from typing import List, Dict, cast, Any
from ..models.message import Message, Role
import asyncio
from llama_cpp import Llama
from concurrent.futures import ThreadPoolExecutor
from llama_cpp import ChatCompletionRequestMessage


CONTEXT_LIMIT = 4096
MAX_OUTPUT_TOKENS = 2000


llm = Llama(model_path=r"C:\Users\sawin\coding-projects\local-ai-with-knowledge-base\local-ai-with-knowledge-base\backend\app\llmmodels\Llama-3.2-3B-Instruct-Q5_K_M.gguf",
            n_ctx=CONTEXT_LIMIT,  # context window
            n_threads=4
            )
executor = ThreadPoolExecutor(max_workers=1) # 1 thread worker for LLM interactions
model_lock = asyncio.Lock()


async def _generate(messages: List[Message], max_tokens: int = MAX_OUTPUT_TOKENS) -> str:
    formatted_messages = get_formatted_messages(messages, max_tokens)
    async with model_lock:
        loop = asyncio.get_running_loop()

        def sync_call():
            return llm.create_chat_completion(
                messages=cast(List[ChatCompletionRequestMessage], formatted_messages),
                max_tokens=max_tokens,
                stream=False
            )

        raw_resp = await loop.run_in_executor(executor, sync_call)
        resp = cast(Dict[str, Any], raw_resp)
        return resp['choices'][0]['message']['content'].strip()


async def handle_query(messages: List[Message]) -> Dict[str, str]:
    """
    Handler for messages query.
    """
    if not messages:
        return {"query": "", "answer": "No messages received"}
    prompt = messages[-1].text
    answer = await _generate(messages)
    return {"query": prompt, "answer": answer}


def get_formatted_messages(messages : List[Message], max_tokens : int) -> List[Dict[str, str]]:
    # 1. Configuration
    # Reserve space for the response so the model doesn't cut off mid-sentence
    SAFE_LIMIT = CONTEXT_LIMIT - max_tokens 

    # 2. Start with System Prompt
    system_msg = {"role": "system", "content": "You are a helpful assistant."}
    
    # 3. Create a list of messages (latest first to process backwards)
    # We want to keep the most recent messages.
    history_to_keep = []
    current_tokens = len(llm.tokenize(system_msg["content"].encode('utf-8')))

    for m in reversed(messages):
        # Estimate tokens for this message (text + small overhead for role)
        msg_tokens = len(llm.tokenize(m.text.encode('utf-8'))) + 10
        
        if current_tokens + msg_tokens > SAFE_LIMIT:
            break # Stop adding older messages
            
        history_to_keep.insert(0, {"role": m.role.value, "content": m.text})
        current_tokens += msg_tokens

    formatted_messages = [system_msg] + history_to_keep
    return formatted_messages