<div align="center"><img src="logo_paperrag.png"></div>

<div align="center">

![FastAPI](https://img.shields.io/pypi/v/fastapi?label=FastAPI&logo=fastapi&logoColor=white)
![Uvicorn](https://img.shields.io/pypi/v/uvicorn?label=Uvicorn&logo=uvicorn&logoColor=white)
![Pydantic](https://img.shields.io/pypi/v/pydantic?label=Pydantic&logo=pydantic&logoColor=white)
![NumPy](https://img.shields.io/pypi/v/numpy?label=NumPy&logo=numpy&logoColor=white)

![Pinecone](https://img.shields.io/badge/Pinecone-Latest-blue?logo=pinecone)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)
![LangChain](https://img.shields.io/pypi/v/langchain?label=LangChain&logo=langchain)
![LangGraph](https://img.shields.io/pypi/v/langgraph?label=LangGraph)
![LangChain Core](https://img.shields.io/pypi/v/langchain-core?label=LangChain-Core)
![LangChain Community](https://img.shields.io/pypi/v/langchain-community?label=LangChain-Community)
![LangChain OpenAI](https://img.shields.io/pypi/v/langchain-openai?label=LangChain-OpenAI)

![PyMuPDF](https://img.shields.io/pypi/v/PyMuPDF?label=PyMuPDF)
![PyPDF](https://img.shields.io/pypi/v/pypdf?label=PyPDF)
![BeautifulSoup4](https://img.shields.io/pypi/v/beautifulsoup4?label=BeautifulSoup4)
![SemanticScholar](https://img.shields.io/pypi/v/semanticscholar?label=SemanticScholar)

![dotenv](https://img.shields.io/pypi/v/python-dotenv?label=python-dotenv)
![asyncio](https://img.shields.io/badge/asyncio-built--in-blue)
![typing](https://img.shields.io/badge/typing-built--in-lightgrey)
![fastmcp](https://img.shields.io/pypi/v/fastmcp?label=fastmcp)

</div>

# PaperRAG

<div align="center">
  <img src="demo.gif">
</div>

---

A Production grade full stack RAG application for answering queries related to online research papers

## Architecture
<div align="center">
  <img src="Untitled Diagram.drawio(3).png">
</div>

---

**Query Router**
- Routes the query on the basis of requirement of context

**Query Enhancement Techniques**
- Use Step-back prompting to capture broad range of topics for enriched context
- Use Context aware query decomposition to generate a quality queries using retreived context from step-back prompt

**Advanced Retreival**
- Filter retreived documents to remove redundant and non-relevant documents
- Rerank the retreived documents using cross-encoder to get more relevance of ordering of documents

**Generation**
- Generate the answer with given context only (if query router had pointed to rag portion) else generate only from learned patterns

## Project Structure
```
paper-rag/
├── app.py                  # FastAPI entrypoint – exposes the RAG pipeline as API endpoints
├── requirements.txt        # All Python dependencies for the project
├── Dockerfile              # Docker setup for production-ready deployment
├── datasets.json           # Dataset / paper metadata for retrieval
├── Evaluate.ipynb          # Jupyter notebook for RAG evaluation and experimentation
├── Evaluate_ragas.py       # Script for evaluation using RAGAS metrics

├── Src/                    # Core application source code (agents, graph, prompts, utils)
│   ├── __init__.py
│   ├── agents.py           # Assembled LangGraph / LangChain agents (router, query generator, generator)
│   ├── prompts/            # All prompt templates for various agent components
│   │   ├── agent.txt
│   │   ├── generate_queries.txt
│   │   ├── generator.txt
│   │   ├── query_router.txt
│   │   ├── simple_generator.txt
│   │   └── step_back.txt
│   └── utils/              # Utility modules for state, nodes, and graph tooling
│       ├── nodes.py        # LangGraph node functions
│       ├── state.py        # RAG pipeline state management (TypedDict / pydantic)
│       ├── tools.py        # Tools used by agents (retrievers, API calls)
│       └── __init__.py

├── Utils/                  # Additional helper modules outside main source
│   ├── pdf_utils.py        # Extract text/metadata from PDFs via PyMuPDF
│   └── __pycache__/       

└── __pycache__/            
```
---
