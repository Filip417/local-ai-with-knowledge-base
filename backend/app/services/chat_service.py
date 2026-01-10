from typing import Dict

from ..models.query import Query


async def handle_query(q: Query) -> Dict[str, str]:
    """
    Very small placeholder for chat processing.
    """
    text = getattr(q, "text", str(q))
    answer = f"Echo: {text}"
    return {"query": text, "answer": answer}
