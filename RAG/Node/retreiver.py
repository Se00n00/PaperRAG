import os
from pinecone import Pinecone

# TODO: Upsert Records in Batches

# Initiallization
pinecone_api_key = os.environ.get("PINECONE_API_KEY")
pc = Pinecone(api_key=pinecone_api_key)

index = pc.Index(host="INDEX_HOST")

def upsert(vectors, namespace):
    index.upsert(vectors, namespace)