import numpy as np
from dotenv import load_dotenv
from fastmcp import Client
import os
from pinecone import Pinecone

load_dotenv()
url = os.getenv("MCP_CLIENT")


#------------------------------------
# Get_embeddings: FROM MCP Backend
#------------------------------------

class MCPHelper:
    def __init__(self, url: str):
        self.url = url

    async def call(self, tool_name: str, params: dict):
        async with Client(self.url) as client:
            results = await client.call_tool(tool_name, params)
            results = results.data

            # Normalize numpy types
            if isinstance(results, np.ndarray) and results.shape == ():
                results = results.item()

            if not isinstance(results, (list, dict, str)):
                results = [results]

            return results

mcp = MCPHelper(url)

async def get_embeddings(data: list[str]):
  return await mcp.call("embeddings", {"data": data})

#------------------------------------
# VectorStore: Pinecone
#------------------------------------
class VectorStore:
  def __init__(self, host, pinecone_api_key):
    pc = Pinecone(api_key=pinecone_api_key)
    self.index = pc.Index(host=host)

  def upsert(self, vectors, text, namespace):
    items = [{"id":str(idx), "values":embed, "metadata":{"chunk":chunk}} for idx, (embed, chunk) in enumerate(zip(vectors, text))]
    try:
      self.index.upsert(vectors=items, namespace=namespace)
    except Exception as e:
      print("Exception: ",e)

  def search(self, query, namespace, top_k=10):
    try:
      results = self.index.query(
          namespace=namespace,
          top_k=top_k,
          vector=query,
          include_metadata=True,
          include_values=False
      )

      return results['matches']
    except Exception as e:
      print("Exception: ",e)
      return []

  def isin_namespace(self,namespace):
    namespaces = self.index.describe_index_stats().get("namespaces", {}).keys()
    return namespace in namespaces

  def delete_namespace(self, namespace):
    if (self.isin_namespace(namespace)):
        self.index.delete_namespace(namespace=namespace)