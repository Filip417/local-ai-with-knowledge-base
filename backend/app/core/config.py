import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

VECTOR_DB_COLLECTION_NAME = "my_collection"
CONTEXT_LIMIT = int(os.getenv("CONTEXT_LIMIT", 100000))
SERVICE_NAME = os.getenv("SERVICE_NAME")
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", 40000))
MODEL_ABSOLUTE_PATH = os.getenv("MODEL_ABSOLUTE_PATH")
ROLE_LLM_PROMPT = os.getenv("ROLE_LLM_PROMPT", "You are a helpful, respectful and honest assistant.")
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS", -1)) # Set to -1 to offload all layers (requires sufficient VRAM)
LLAMA_VERBOSE = os.getenv("LLAMA_VERBOSE", "False").lower() in ("true", "1", "yes")
SOURCES_VECTOR_DB_N_RESULTS = int(os.getenv("SOURCES_VECTOR_DB_N_RESULTS", 100))