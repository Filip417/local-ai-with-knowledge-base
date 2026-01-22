from typing import Dict, List, Optional
from uuid import UUID, uuid4
from app.models.message import Message
from app.models.chat_request import ChatRequest
from app.core.enums import Role

class MessageRepository:
    """In-memory CRUD repository for messages keyed by message ID."""

    def __init__(self):
        self._messages: Dict[Optional[UUID], Message] = {}

    def create_from_chat_request(self, chat_request: ChatRequest) -> bool:
        for message in chat_request.messages:
            print(f"{message.id=}")
            if not self.get(message.id) and message.role != Role.assistant:
                message_object = Message(
                                        id=message.id,
                                        session_id=chat_request.session_id,
                                        text=message.text,
                                        role=message.role,
                                        timestamp=message.timestamp)
                self.create(message_object)
        return True

    def create(self, message: Message) -> Message:
        if message.id in self._messages:
            raise ValueError(f"Message with ID {message.id} already exists.")
        self._messages[message.id] = message
        return message

    def get(self, message_id: UUID | None) -> Message | None:
        return self._messages.get(message_id)

    def get_all(self) -> List[Message]:
        return list(self._messages.values())

    def get_by_session(self, session_id: str) -> List[Message]:
        return [m for m in self._messages.values() if m.session_id == session_id]

    def update(self, message_id: UUID, **kwargs) -> Message | None:
        existing = self._messages.get(message_id)
        if not existing:
            return None
        updated = existing.model_copy(update=kwargs)
        self._messages[message_id] = updated
        return updated

    def delete(self, message_id: UUID) -> bool:
        if message_id not in self._messages:
            return False
        del self._messages[message_id]
        return True

    def delete_by_session(self, session_id: str) -> int:
        to_delete = [mid for mid, msg in self._messages.items() if msg.session_id == session_id]
        for mid in to_delete:
            del self._messages[mid]
        return len(to_delete)

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

        # Group messages by session_id
        sessions: Dict[str, List[Message]] = {}
        for msg in self._messages.values():
            if not msg.session_id:
                continue
            sessions.setdefault(msg.session_id, []).append(msg)

        def parse_ts(ts: str) -> float:
            """Parse ISO timestamp to a UTC POSIX float seconds.

            Returns a float timestamp. If parsing fails, returns 0.0.
            Naive datetimes are treated as UTC.
            """
            try:
                dt = datetime.fromisoformat(ts)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt.timestamp()
            except Exception:
                return 0.0

        from app.core.enums import Role
        summaries: List[Dict[str, str]] = []
        for sid, msgs in sessions.items():
            # Sort messages by timestamp ascending; fallback to string compare if parse fails
            msgs_sorted = sorted(
                msgs,
                key=lambda m: parse_ts(m.timestamp)
            )

            last = msgs_sorted[-1]
            # Title: first user message text; fallback to first message text
            first_user = next((m for m in msgs_sorted if m.role == Role.user), None)

            title_text = (first_user.text if first_user else msgs_sorted[0].text)

            summaries.append({
                "id": sid,
                "title": title_text,
                "timestamp": last.timestamp,
                "lastMessage": last.text,
            })

        # Sort by timestamp descending
        summaries.sort(
            key=lambda s: parse_ts(s["timestamp"]),
            reverse=True,
        )

        return summaries


_message_repository: Optional[MessageRepository] = None


def get_message_repository() -> MessageRepository:
    global _message_repository
    if _message_repository is None:
        _message_repository = MessageRepository()
    return _message_repository
