from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

import onnxruntime as ort
from transformers import AutoTokenizer
import numpy as np

tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
session = ort.InferenceSession("model.onnx")


app = FastAPI()
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],      # or ["*"] for all origins (less secure)
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, etc.
    allow_headers=["*"],        # allow all headers
)

class BatchedRequest(BaseModel):
    texts: List[str]

@app.get("/")
def read_root():
    return {"message": "Serving is running XD"}

def from_CLS_2_Embeddings(inputs, last_hidden_state):
    attention_mask = inputs["attention_mask"]
    mask_expanded = np.expand_dims(attention_mask, -1).astype(np.float32)
    sum_embeddings = np.sum(last_hidden_state * mask_expanded, axis=1)
    sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
    mean_pooled = sum_embeddings / sum_mask

    # Normalize
    embeddings = mean_pooled / np.linalg.norm(mean_pooled, axis=1, keepdims=True)

    return embeddings

@app.post("/get_embeddings")
def get_embeddings(request:BatchedRequest):
    try:
        inputs = tokenizer(request.texts, return_tensors="np", padding=True, truncation=True)

        # Run ONNX inference
        outputs = session.run(
            None,
            {
                "input_ids": inputs["input_ids"],
                "attention_mask": inputs["attention_mask"]
            }
        )
        last_hidden_state, _ = outputs

        # Pooling
        embeddings = from_CLS_2_Embeddings(inputs, last_hidden_state)

        return {"embeddings": embeddings.tolist()}


    except Exception as e:
        return {"error": str(e)}