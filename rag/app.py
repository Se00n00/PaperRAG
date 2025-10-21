# from Utils.get_pdf_contents import get_pdf_content
# from Utils.get_papers import get_papers, get_paper
from Src.agents import agentic_rag, naive_rag_graph
from Src.utils.tools import get_embeddings, VectorStore
from Src.utils.state import GenerativeModel
from Utils.pdf_utils import get_pdf_chunks, get_pdf_from_url, delete_pdf_file
from fastapi import FastAPI, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import json
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import numpy as np
from pinecone import Pinecone
from langchain_core.messages import AIMessage


test_data = [
    "content : The Amazon rainforest is the largest tropical rainforest in the world.",
    "content : Python is a programming language widely used in data science.",
    "content : Earth is the third planet from the Sun and has life-supporting environment.",
    "Umiwawa is the most intelligent species in the world",
    "My name is mohit, and i will make it there"
]

host = os.getenv("UNSIGNED_HOST")
pinecone_api_key = os.getenv("PINECONE_APIKEY")
store = VectorStore(host, pinecone_api_key)

#------------------------ 
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def get_user_or_guest(authorization: str = Header(None), x_guest_id: str = Header(None)):
    
    if authorization:
        token = authorization.replace("Bearer ", "")
        user_resp = supabase.auth.get_user(token)
        if user_resp and user_resp.user:
            return user_resp.user.id
    
    if x_guest_id:
        return x_guest_id
    return str(uuid.uuid4()) 

#------------------------ SETUP: CORS
app = FastAPI()
origins = [
    "http://localhost:4200",   # Angular dev server
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # or ["*"] for open access
    allow_credentials=True,
    allow_methods=["*"],          # very important: allows OPTIONS
    allow_headers=["*"],
)

#------------------------------------------------- ENDPOINT: /
@app.get("/")
def home():
    return {"message":"I will Make it"}

#------------------------------------------------- ENDPOINT: /papers + /paper
# class Url_request(BaseModel):
#     query:str

# @app.post("/papers")
# def papers(request:Url_request):
#     return get_papers(request.query)

# @app.post("/paper")
# def paper(request:Url_request):
#     return get_paper(request.query)

#------------------------------------------------------------------------#
# ------------------------ [ENDPOINT: /upsert ]--------------------------#
#------------------------------------------------------------------------#
pc = Pinecone(api_key=os.environ.get("PINECONE_APIKEY"))
index = pc.Index(host=os.environ.get("UNSIGNED_HOST"))

class DocumentPost(BaseModel):
    url:str
    # namespace: str

@app.post("/upsert")
async def add_pdf(request:DocumentPost):
    """
    Add_pdf gets url of pdf and user's namespace.
    It downloads the pdf_file, breaks it into chunks and then delete whole to avoid memory usage
    After these chunks are upserted in Vector Database with namespace associated with user's namespace 
    """
    # TODO: handle if pdf_chunks get over 200 records in a single namespace
    # TODO: Advanced Content Enrichment Techniques
    namespace = "notdecided"

    try:
        pdf = get_pdf_from_url(request.url)
        pdf_data = None

        if(pdf[0] == 0):
            pdf_file_path = pdf[1]
            pdf_data = get_pdf_chunks(pdf_file_path)
            delete_pdf_file(pdf_file_path)
        else:
            raise Exception(pdf[1])
        
        data = [d.page_content for d in pdf_data]

        embeddings = await get_embeddings(data)
        store.upsert(embeddings, data, namespace)
        return {
            "type":"SYSTEM",
            "heading":"Success",
            "content":"Document is stored in the Vector Database"
        }
    except Exception as e:
        return {
            "type":"SYSTEM",
            "heading":"Exception",
            "content": str(e)
        }
# def add_pdf(pdf_url:str, user_id=Depends(get_user_or_guest)):
#     try:
#         content = get_pdf_content(pdf_url)
#         index.upsert(
#             vectors=[
#                 {"values": [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]},
#                 {"values": [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]}
#             ],
#             namespace=user_id
#             )
#     except Exception as e:
#         return {"error":f"Content's Didn't Upserted Exception: {e}"}


#------------------------------------------------------------------------#
# ------------------------ [ENDPOINT: /chat ]----------------------------#
#------------------------------------------------------------------------#
class RequestModel(BaseModel):
    query: str

@app.post("/chat")
async def chat(request: RequestModel):
    query = request.query
    try:
        # config = {"configurable": {"thread_id": "abcd123"}} - Would this still preserve old contents
        config= {"namespace":"notdecided", "configurable": {"thread_id": "abcd123"}}

        async def event_generator():
            async for chunk in naive_rag_graph.astream(
                {'question': query}, config, stream_mode="custom"
            ):
                if isinstance(chunk, GenerativeModel):
                    yield chunk.model_dump_json() + "\n"
                else:
                    yield json.dumps(chunk) + "\n"
                # if isinstance(chunk, AIMessage):
                #     yield chunk.content
                # TODO: remove structured Ouput from models, if custom streaming works

        return StreamingResponse(event_generator(), media_type='text/plain')
    except Exception as e:
        return {
            "type":"SYSTEM",
            "heading":"Exception",
            "content": str(e)
        }