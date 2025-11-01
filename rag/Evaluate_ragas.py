"""
    This file is used to test the RAG system using 'ragas' package
    Evaluation Metrics: 
        For retreiver:
        - Context Precision
        - Context Recall
        - Context Relevance

        For Generator && End-to-End System:
        - Noise Senstivity
        - Response Relvance
        - Answer Accuracy

    Dataset: <Any QA Dataset>
        [
            {
                "dataset": "allenai/qasper",
                "sub_set": "train",
                "key_feilds": ["questions","evidence","answers"]
            }
        ]
        
        **Format of key_feilds : [query, context, answer]**
"""

from datasets import load_dataset
import json

from dotenv import load_dotenv
import os

load_dotenv()
huggingface_token = os.getenv("HUGGINGFACE_TOKEN")

# --------------------------------------------------- #
# ------------------ LOADING DATASET ---------------- #
# --------------------------------------------------- #


def get_path(data, path):
    for key in path:
        data = data[key]
    return data

def load_dataset(json_path):
    try:
        with open(json_path, 'r') as f:
            datasets = json.load(f)
    except FileNotFoundError:
        print("Error: 'data.json' not found.")

    for dataset in datasets:
        ds = load_dataset(dataset['dataset'])

        Eval_ds = []
        for key in dataset['key_fields']:
            value = get_path(ds[dataset['sub_set']][0], key)
            print(":", value)

