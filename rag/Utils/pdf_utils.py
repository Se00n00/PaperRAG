from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import requests
import uuid
import os

def replace_t_with_space(list_of_documents):
    for doc in list_of_documents:
        doc.page_content = doc.page_content.replace('\t', ' ')
    return list_of_documents

def get_pdf_chunks(pdf_path, chunk_size = 1000, chunk_overlap = 200):
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap, length_function=len
    )

    texts = text_splitter.split_documents(documents)
    cleaned_texts = replace_t_with_space(texts)
    return cleaned_texts

def get_pdf_from_url(pdf_link):
    response = requests.get(pdf_link)
    file_name = str(uuid.uuid4()) + ".pdf"
    if response.status_code == 200:
        with open(file_name, "wb") as f:
            f.write(response.content)
            return 0, file_name
    else:
        return -1, "Failed to Download and Write PDF"

def delete_pdf_file(pdf_path):
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
        return 0
    else:
        return -1