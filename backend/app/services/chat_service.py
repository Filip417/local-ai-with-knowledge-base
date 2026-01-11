from typing import List, Dict, cast, Any
from ..models.message import Message, Role
import asyncio
from llama_cpp import Llama
from concurrent.futures import ThreadPoolExecutor


llm = Llama(model_path=r"C:\Users\sawin\coding-projects\local-ai-with-knowledge-base\local-ai-with-knowledge-base\backend\app\llmmodels\Llama-3.2-3B-Instruct-Q5_K_M.gguf")
executor = ThreadPoolExecutor(max_workers=2)
model_lock = asyncio.Lock()

async def _generate(prompt: str, max_tokens: int = 256) -> str:
    async with model_lock:
        loop = asyncio.get_running_loop()
        
        def sync_call():
            return llm.create_chat_completion(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                stream=False
            )

        raw_resp = await loop.run_in_executor(executor, sync_call)
        resp = cast(Dict[str, Any], raw_resp)
        return resp['choices'][0]['message']['content'].strip()
    

async def handle_query(messages: List[Message]) -> Dict[str, str]:
    """
    Very small placeholder for chat processing using message history.
    """
    if not messages:
        return {"query": "", "answer": "No messages received"}

    # Example behavior: echo the last message's text
    # last_text = messages[-1].text
    # answer = f"Echo: {last_text}"
    
    # Process the last_text in locally run LLM
    prompt = messages[-1].text
    answer = await _generate(prompt)
    return {"query": prompt, "answer": answer}
