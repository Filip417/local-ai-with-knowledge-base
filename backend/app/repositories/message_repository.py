import sqlite3
from pathlib import Path
from typing import Dict, List, Optional
from uuid import UUID

from app.models.message import Message
from app.models.chat_request import ChatRequest
from app.core.enums import Role


class MessageRepository:
    """SQLite-backed CRUD repository for messages."""

    def __init__(self, db_path: Optional[str] = None):
        # Default DB at backend/messages.db
        if db_path is None:
            backend_dir = Path(__file__).resolve().parents[2]
            self._db_path = backend_dir / "messages.db"
        else:
            self._db_path = Path(db_path)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    session_id TEXT,
                    text TEXT NOT NULL,
                    role TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_session_id
                ON messages(session_id)
                """
            )
            conn.commit()

    def create_from_chat_request(self, chat_request: ChatRequest) -> bool:
        # Persist only non-assistant messages from the request payload
        for msg in chat_request.messages:
            if msg.role != Role.assistant:
                # If already present, skip; otherwise insert
                if not self.get(msg.id):
                    message_object = Message(
                        id=msg.id,
                        session_id=chat_request.session_id,
                        text=msg.text,
                        role=msg.role,
                        timestamp=msg.timestamp,
                    )
                    self.create(message_object)
        return True

    def create(self, message: Message) -> Message:
        with self._connect() as conn:
            try:
                conn.execute(
                    "INSERT INTO messages (id, session_id, text, role, timestamp) VALUES (?, ?, ?, ?, ?)",
                    (
                        str(message.id),
                        message.session_id,
                        message.text,
                        message.role.value if hasattr(message.role, "value") else str(message.role),
                        message.timestamp,
                    ),
                )
                conn.commit()
            except sqlite3.IntegrityError:
                raise ValueError(f"Message with ID {message.id} already exists.")
        return message

    def _row_to_message(self, row: sqlite3.Row) -> Message:
        role_str = row["role"]
        role = Role(role_str)
        return Message(
            id=UUID(row["id"]),
            session_id=row["session_id"],
            text=row["text"],
            role=role,
            timestamp=row["timestamp"],
        )

    def get(self, message_id: UUID | None) -> Message | None:
        if message_id is None:
            return None
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT id, session_id, text, role, timestamp FROM messages WHERE id = ?",
                (str(message_id),),
            )
            row = cur.fetchone()
            return self._row_to_message(row) if row else None

    def get_all(self) -> List[Message]:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT id, session_id, text, role, timestamp FROM messages ORDER BY timestamp ASC"
            )
            return [self._row_to_message(r) for r in cur.fetchall()]

    def get_by_session(self, session_id: str) -> List[Message]:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT id, session_id, text, role, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
                (session_id,),
            )
            return [self._row_to_message(r) for r in cur.fetchall()]

    def update(self, message_id: UUID, **kwargs) -> Message | None:
        existing = self.get(message_id)
        if not existing:
            return None

        # Build updated Message using pydantic's model_copy like behavior
        updated = existing.model_copy(update=kwargs)
        with self._connect() as conn:
            conn.execute(
                "UPDATE messages SET session_id = ?, text = ?, role = ?, timestamp = ? WHERE id = ?",
                (
                    updated.session_id,
                    updated.text,
                    updated.role.value if hasattr(updated.role, "value") else str(updated.role),
                    updated.timestamp,
                    str(message_id),
                ),
            )
            conn.commit()
        return updated

    def delete(self, message_id: UUID) -> bool:
        with self._connect() as conn:
            cur = conn.execute("DELETE FROM messages WHERE id = ?", (str(message_id),))
            conn.commit()
            return cur.rowcount > 0

    def delete_by_session(self, session_id: str) -> int:
        with self._connect() as conn:
            cur = conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
            conn.commit()
            return cur.rowcount or 0

    def get_sessions_data(self) -> List[Dict[str, str]]:
        """
        Aggregate messages into session summaries.

        Returns a list of dictionaries with keys:
        - id: session identifier
        - title: derived from the first user message text (fallback to first message)
        - timestamp: timestamp of the last message in the session
        - lastMessage: text of the last message in the session

        Sessions are sorted by last message timestamp (descending).
        """
        from datetime import datetime, timezone

        def parse_ts(ts: str) -> float:
            try:
                dt = datetime.fromisoformat(ts)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt.timestamp()
            except Exception:
                return 0.0

        # Fetch distinct session_ids
        with self._connect() as conn:
            cur = conn.execute("SELECT DISTINCT session_id FROM messages WHERE session_id IS NOT NULL")
            session_ids = [row["session_id"] for row in cur.fetchall()]

        summaries: List[Dict[str, str]] = []
        for sid in session_ids:
            msgs = self.get_by_session(sid)
            if not msgs:
                continue
            last = msgs[-1]
            first_user = next((m for m in msgs if m.role == Role.user), None)
            title_text = (first_user.text if first_user else msgs[0].text)
            title_text_words = title_text.split(" ")
            final_title_text = " ".join(title_text_words[:10])[:75]
            last_message_words = last.text.split(" ")
            final_last_message = " ".join(last_message_words[:20])[:150]

            summaries.append(
                {
                    "id": str(sid),
                    "title": final_title_text,
                    "timestamp": last.timestamp,
                    "lastMessage": final_last_message,
                }
            )

        summaries.sort(key=lambda s: parse_ts(s["timestamp"]), reverse=True)
        return summaries


_message_repository: Optional[MessageRepository] = None


def get_message_repository() -> MessageRepository:
    global _message_repository
    if _message_repository is None:
        # Default to backend/messages.db per migration notes
        _message_repository = MessageRepository()
    return _message_repository
