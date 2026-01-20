# local-ai-with-knowledge-base
This repository features a privacy-first, Retrieval-Augmented Generation (RAG) platform designed for secure local document intelligence. Built with Angular and Python FastAPI, the system enables users to upload a custom knowledge base and interact with it using open-source Local LLMs.

## how to run

1. backend - uvicorn
from repo root\backend
```
$env:CUDA_PATH = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.0"
python -m app.main
```

2. frontend - Angular
from repo root\frontend
```
ng serve
```