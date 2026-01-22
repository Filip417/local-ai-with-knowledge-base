from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import (
    CONTEXT_LIMIT,
    MAX_OUTPUT_TOKENS,
    MODEL_ABSOLUTE_PATH,
    runtime_config
)

router = APIRouter()


class PromptUpdate(BaseModel):
    prompt: str


@router.get("/settings")
async def get_settings_info():
    """
    Get some basic settings information
    """
    model = Path(MODEL_ABSOLUTE_PATH).stem if MODEL_ABSOLUTE_PATH else "unknown"
    
    return {
        "context_limit": CONTEXT_LIMIT,
        "max_output_tokens": MAX_OUTPUT_TOKENS,
        "model": model,
        "role_llm_prompt": runtime_config.role_llm_prompt,
    }

@router.get("/settings/prompt")
async def get_prompt():
    return {"role_llm_prompt": runtime_config.role_llm_prompt}


@router.post("/settings/prompt")
async def set_prompt(update: PromptUpdate):
    runtime_config.role_llm_prompt = update.prompt
    return {"role_llm_prompt": runtime_config.role_llm_prompt}