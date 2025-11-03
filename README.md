# Paper

A Production grade full stack RAG application

## Architecture
<div>
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
