<div align="center" ><img height="200px" src="log_paperrag.png"></div>

<div align="center">

![FastAPI](https://img.shields.io/pypi/v/fastapi?label=FastAPI&logo=fastapi&logoColor=white)

![Pinecone](https://img.shields.io/badge/Pinecone-Latest-blue?logo=pinecone)
![LangChain](https://img.shields.io/pypi/v/langchain?label=LangChain&logo=langchain)
![LangGraph](https://img.shields.io/pypi/v/langgraph?label=LangGraph)
![LangChain OpenAI](https://img.shields.io/pypi/v/langchain-openai?label=LangChain-OpenAI)

![SemanticScholar](https://img.shields.io/pypi/v/semanticscholar?label=SemanticScholar)
![fastmcp](https://img.shields.io/pypi/v/fastmcp?label=fastmcp)

</div>

# PaperRAG

<div align="center">
  <a href="https://www.youtube.com/watch?v=m9QMwHktHRo">
    <img src="demo.gif">
  </a>
  
</div>

<div align="center">
  Click to view Demo video on youtube
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


# Evaluation Summary

## **Comparison of RAG Approaches (Mean Metrics)**

| Metric                        | Naive RAG | Advanced RAG (WO Hybrid Retrieval) | Advanced RAG + Hybrid Retrieval |
| ----------------------------- | --------- | --------------------------- | ------------------------ |
| **Correctness**               | 0.188     | 0.215                       | **0.285**                |
| **Groundness**                | 0.876     | 0.813                       | **0.830**                |
| **Relevance**                 | 0.648     | 0.710                       | **0.837**                |
| **Retrieval Relevance**       | **0.860** | 0.796                       | 0.619                    |
| **Coherence**                 | **0.912** | 0.909                       | 0.993                    |
| **String Similarity**         | 0.173     | 0.193                       | **0.196**                |
| **BLEU**                      | 0.0218    | 0.0224                      | **0.0245**               |
| **ROUGE-L**                   | 0.0830    | 0.1091                      | **0.1118**               |
| **Non-LLM Context Precision** | 0.0102    | **0.0167**                  | 0.0158                   |
| **LLM Context Recall**        | 0.213     | 0.198                       | **0.334**                |
| **LLM Context Precision**     | **0.525** | 0.506                       | 0.490                    |

---


## Project Structure
```
PaperRAG >
rag/
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
