from Utils.get_pdf_contents import get_pdf_content
from Node.agents import agentic_rag
from fastapi import FastAPI, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import uuid
from supabase import create_client, Client
from dotenv import load_dotenv
import os

from pinecone import Pinecone

from langchain_core.messages import AIMessage

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

#------------------------ ENDPOINT: /
@app.get("/")
def home():
    return {"message":"I will Make it"}

#------------------------ ENDPOINT: /upsert
pc = Pinecone(api_key=os.environ.get("PINECONE_APIKEY"))
index = pc.Index(host=os.environ.get("UNSIGNED_HOST"))

@app.post("/upsert")
def add_pdf(pdf_url:str, user_id=Depends(get_user_or_guest)):
    try:
        content = get_pdf_content(pdf_url)
        index.upsert(
            vectors=[
                {"values": [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]},
                {"values": [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]}
            ],
            namespace=user_id
            )
    except Exception as e:
        return {"error":f"Content's Didn't Upserted Exception: {e}"}
    
#------------------------ ENDPOINT: /chat
@app.post("/chat")
# async def chat(query:str, user_id=Depends(get_user_or_guest)):

async def chat(query:str):
    try:
        config = {"configurable": {"thread_id": "abcd123"}}
        def event_generator():
            for chunk, meta in agentic_rag.stream(
                {'query':query}, config, stream_mode = "messages"
            ):
                if isinstance(chunk, AIMessage):
                    yield chunk.content
        
        return StreamingResponse(event_generator(), media_type='text/plain')
    except Exception as e:
        return {"error":f"Exception: {e}"}