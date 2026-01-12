from typing import List, Dict, cast, Any, AsyncGenerator
from ..models.message import Message
import asyncio
from llama_cpp import Llama
from concurrent.futures import ThreadPoolExecutor
from llama_cpp import ChatCompletionRequestMessage
from functools import partial

CONTEXT_LIMIT = 4096
MAX_OUTPUT_TOKENS = 2000


llm = Llama(model_path=r"C:\Users\sawin\coding-projects\local-ai-with-knowledge-base\local-ai-with-knowledge-base\backend\app\llmmodels\Llama-3.2-3B-Instruct-Q5_K_M.gguf",
            n_ctx=CONTEXT_LIMIT,  # context window
            n_threads=4
            )
executor = ThreadPoolExecutor(max_workers=1) # 1 thread worker for LLM interactions
model_lock = asyncio.Lock()


async def _generate_stream(
        messages: List[Message],
        max_tokens: int = MAX_OUTPUT_TOKENS) -> AsyncGenerator[str, None]:
    
    formatted_messages = get_formatted_messages(messages, max_tokens)
    loop = asyncio.get_running_loop()
    
    # Get the streaming iterator from llama-cpp in the thread pool
    sync_func = partial(
        llm.create_chat_completion,
        messages=cast(List[ChatCompletionRequestMessage], formatted_messages),
        max_tokens=max_tokens,
        stream=True
    )
    
    # This returns the iterator itself
    stream_iterator = await loop.run_in_executor(executor, sync_func)

    # Yield chunks as they arrive
    for chunk in stream_iterator:
        chunk_dict = cast(Dict[str, Any], chunk)
        content = chunk_dict['choices'][0].get('delta', {}).get('content')
        if content:
            yield content
            await asyncio.sleep(0)


async def handle_query_stream(messages: List[Message]):
    if not messages:
        yield "No messages received"
        return

    async for chunk in _generate_stream(messages):
        yield chunk


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