from typing import List, Dict, cast, Any, AsyncGenerator, Optional
from ..models.message import Message
import asyncio
from llama_cpp import Llama
from concurrent.futures import ThreadPoolExecutor
from llama_cpp import ChatCompletionRequestMessage
from functools import partial
from .file_service import get_results_from_vector_db
from chromadb import QueryResult
from app.core.config import CONTEXT_LIMIT, MAX_OUTPUT_TOKENS
from uuid import UUID 


llm = Llama(model_path=r"C:\Users\sawin\coding-projects\local-ai-with-knowledge-base\local-ai-with-knowledge-base\backend\app\llmmodels\Llama-3.2-3B-Instruct-Q5_K_M.gguf",
            n_ctx=CONTEXT_LIMIT,  # context window
            n_threads=4
            )
executor = ThreadPoolExecutor(max_workers=1) # 1 thread worker for LLM interactions
model_lock = asyncio.Lock()


async def _generate_stream(
        messages: List[Message],
        max_tokens: int = MAX_OUTPUT_TOKENS,
        selected_file_ids: Optional[List[UUID]] = None) -> AsyncGenerator[str, None]:
    
    llm_formatted_messages = get_llm_formatted_messages(messages)
    knowledge_base_the_most_relevant = get_results_from_vector_db(messages, selected_file_ids)
    prompt_messages = cut_into_context_window(
        llm_formatted_messages,
        knowledge_base_the_most_relevant,
        max_tokens)
    loop = asyncio.get_running_loop()
    
    # Get the streaming iterator from llama-cpp in the thread pool
    sync_func = partial(
        llm.create_chat_completion,
        messages=cast(List[ChatCompletionRequestMessage], prompt_messages),
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


async def handle_query_stream(messages: List[Message],
                              selected_file_ids: Optional[List[UUID]] = None):
    if not messages:
        yield "No messages received"
        return

    async for chunk in _generate_stream(messages, selected_file_ids=selected_file_ids):
        yield chunk

def count_tokens(text: str) -> int:
    # Rough estimate: 1 token ~= 4 characters for English
    # can also use len(llm.tokenize("test".encode('utf-8'))) for more accuracy
    return len(text) // 4

def cut_into_context_window(
        formatted_messages : List[Dict[str, str]],
        knowledge_base_the_most_relevant : QueryResult | None,
        max_tokens: int,
        number_of_last_messages_to_prioritise : int = 3) -> List[Dict[str, str]]:
    # Reserve space for the response so the model doesn't cut off mid-sentence
    SAFE_LIMIT = CONTEXT_LIMIT - max_tokens
    current_tokens = 0
    final_context = []

    # 2. Extract Mandatory components: System Prompt and Latest Message
    system_prompt = next((m for m in formatted_messages if m["role"] == "system"), None)
    latest_message = formatted_messages[-1] if formatted_messages else None
    
    # Calculate initial overhead
    if system_prompt:
        current_tokens += count_tokens(system_prompt["content"])
    if latest_message and latest_message != system_prompt:
        current_tokens += count_tokens(latest_message["content"])

    # 3. Prioritize Past x Messages (excluding system and latest)
    # We look at messages from newest to oldest to keep recent context
    history_candidates = [
        m for m in formatted_messages 
        if m != system_prompt and m != latest_message
    ][-number_of_last_messages_to_prioritise:] # Get last x

    valid_history = []
    for msg in reversed(history_candidates):
        tokens = count_tokens(msg["content"])
        if current_tokens + tokens < SAFE_LIMIT:
            valid_history.insert(0, msg) # Keep chronological order
            current_tokens += tokens
        else:
            break

    # 4. Prioritize Knowledge Base (RAG) results
    # Flatten documents from Chroma QueryResult
    all_docs = []

    if knowledge_base_the_most_relevant is not None:
        # Check if 'documents' key exists and isn't empty
        docs = knowledge_base_the_most_relevant.get("documents")
        if docs and len(docs) > 0:
            all_docs = docs[0]

    valid_docs = []
    for doc_text in all_docs:
        tokens = count_tokens(doc_text)
        if current_tokens + tokens < SAFE_LIMIT:
            valid_docs.append(doc_text)
            current_tokens += tokens
        else:
            break

    # 5. Reassemble the final message list
    # Usually: [System] + [Docs/Context] + [History] + [Latest User Query]
    if system_prompt:
        final_context.append(system_prompt)
    
    if valid_docs:
        context_str = "\n---\n".join(valid_docs)
        final_context.append({
            "role": "system", 
            "content": f"Relevant context from database:\n{context_str}"
        })
        
    final_context.extend(valid_history)
    
    if latest_message and latest_message != system_prompt:
        final_context.append(latest_message)

    print(f"{final_context=}")
    return final_context


def get_llm_formatted_messages(messages : List[Message]) -> List[Dict[str, str]]:
    llm_formatted_messages = [{"role": "system", "content": "You are a helpful assistant."}]
    for m in reversed(messages):
        llm_formatted_messages.insert(0, {"role": m.role.value, "content": m.text})

    return llm_formatted_messages