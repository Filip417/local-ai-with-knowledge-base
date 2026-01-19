VECTOR_DB_COLLECTION_NAME = "my_collection"
CONTEXT_LIMIT = 10000
MAX_OUTPUT_TOKENS = 4000
MODEL_ABSOLUTE_PATH = r"C:\Users\sawin\coding-projects\local-ai-with-knowledge-base\local-ai-with-knowledge-base\backend\app\llmmodels\Llama-3.2-3B-Instruct-Q5_K_M.gguf"
ROLE_LLM_PROMPT="You are a helpful assistant."

# GPU Configuration
# Set N_GPU_LAYERS to the number of layers to offload to GPU
# RTX 5070 (12GB) with 3B model: can safely use -1 (all layers) or 30-35
# Set to -1 to offload all layers (requires sufficient VRAM)
N_GPU_LAYERS = -1  # All layers for RTX 5070 with 12GB VRAM
# Verbose output for debugging GPU initialization
VERBOSE = False