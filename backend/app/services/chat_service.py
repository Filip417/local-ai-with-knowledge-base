from typing import List, Dict

from ..models.message import Message, Role


async def handle_query(messages: List[Message]) -> Dict[str, str]:
    """
    Very small placeholder for chat processing using message history.
    """
    if not messages:
        return {"query": "", "answer": "No messages received"}

    # Example behavior: echo the last message's text
    last_text = messages[-1].text
    answer = f"Echo: {last_text}"
    return {"query": last_text, "answer": answer}
