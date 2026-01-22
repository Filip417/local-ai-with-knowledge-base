from typing import List, Dict, cast, Any, AsyncGenerator, Optional
from app.models.message import Message
import asyncio
from llama_cpp import Llama
from llama_cpp.llama_cpp import llama_supports_gpu_offload
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from app.services.file_service import get_results_from_vector_db
from chromadb import QueryResult
from app.core.config import CONTEXT_LIMIT, MAX_OUTPUT_TOKENS, MODEL_ABSOLUTE_PATH, ROLE_LLM_PROMPT, N_GPU_LAYERS, LLAMA_VERBOSE, SOURCES_VECTOR_DB_N_RESULTS
from uuid import UUID 


# Initialize with GPU support: n_gpu_la$env:CMAKE_ARGS="-DLLAMA_CUDA=on"; pip install llama-cpp-python --upgrade --force-reinstall --no-cache-diryers offloads layers to GPU
# -1 offloads all layers; adjust based on your VRAM and model size
llm = Llama(
    model_path=MODEL_ABSOLUTE_PATH, # type: ignore
    n_ctx=CONTEXT_LIMIT,
    n_gpu_layers=N_GPU_LAYERS,  # Enable GPU acceleration
    verbose=LLAMA_VERBOSE  # Set True for debugging
)
print(f"Library compiled with GPU support: {llama_supports_gpu_offload()}")
executor = ThreadPoolExecutor(max_workers=1) # 1 thread worker for LLM interactions
model_lock = asyncio.Lock()


async def handle_query_stream(
        messages: List[Message],
        selected_file_ids: Optional[List[UUID]] = None,
        max_tokens: int = MAX_OUTPUT_TOKENS) -> AsyncGenerator[str, None]:
    
    llm_formatted_messages = get_llm_formatted_messages(messages)

    knowledge_base_the_most_relevant = get_results_from_vector_db(
        last_user_message=messages[-1],
        selected_file_ids=selected_file_ids)
    
    prompt_messages = cut_into_context_window(
        llm_formatted_messages,
        knowledge_base_the_most_relevant,
        max_tokens)
    
    loop = asyncio.get_running_loop()
    
    sync_func = partial(
        llm.create_chat_completion,
        messages=prompt_messages, # type: ignore[arg-type],
        max_tokens=max_tokens,
        stream=True
    )
    
    stream_iterator = await loop.run_in_executor(executor, sync_func)

    # Yield chunks as they arrive
    for chunk in stream_iterator:
        chunk_dict = cast(Dict[str, Any], chunk)
        content = chunk_dict['choices'][0].get('delta', {}).get('content')
        if content:
            yield content
            await asyncio.sleep(0)


def count_tokens(text: str) -> int:
    # Rough estimate: 1 token ~= 4 characters for English
    # can also use len(llm.tokenize("test".encode('utf-8'))) for more accuracy
    return len(text) // 4

def cut_into_context_window(
        formatted_messages : List[Dict[str, str]],
        knowledge_base_the_most_relevant : QueryResult | None,
        max_tokens: int) -> List[Dict[str, str]]:
    
    # Reserve space for the response so the model doesn't cut off mid-sentence
    SAFE_LIMIT = CONTEXT_LIMIT - max_tokens
    current_tokens = 0
    final_context = []

    # 1. Extract Mandatory components: 
    # System Prompt, Last User Message and Prioritize Past x Messages
    mandatory_messages = [ m for m in formatted_messages ]

    for msg in mandatory_messages:
        tokens = count_tokens(msg["content"])
        final_context.append(msg)
        current_tokens += tokens

    # 2. Knowledge Base (RAG) results
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
        remaining_tokens = SAFE_LIMIT - current_tokens
        
        if tokens <= remaining_tokens:
            # Entire document fits
            valid_docs.append(doc_text)
            current_tokens += tokens
        elif remaining_tokens > 0:
            # Partial document fits 
            max_chars = remaining_tokens * 4  # Approximate chars from tokens
            truncated_doc = doc_text[:max_chars] + "... [truncated]"
            valid_docs.append(truncated_doc)
            current_tokens += remaining_tokens
            break
        else:
            break
    
    if valid_docs:
        context_str = "\n\n".join(valid_docs)
        final_context.insert(0, {
            "role": "system", 
            "content": f"{SOURCES_VECTOR_DB_N_RESULTS} The most relevant paragraphs context from database:\n\n{context_str}"
        })

    print(f"{final_context=}")
    return final_context


def get_llm_formatted_messages(messages : List[Message]) -> List[Dict[str, str]]:
    llm_formatted_messages = []
    for m in messages:
        llm_formatted_messages.append({"role": m.role.value, "content": m.text})

    llm_formatted_messages.append({"role": "system", "content": ROLE_LLM_PROMPT})
    return llm_formatted_messages