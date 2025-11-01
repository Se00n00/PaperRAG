from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.config import get_stream_writer
from dotenv import load_dotenv
import os

from Src.utils.state import State, GenerativeModel
from Src.utils.tools import get_embeddings, VectorStore

#----------------------------------
# LLM
#----------------------------------
load_dotenv()
llm = os.getenv("SECONDARY_LLM")
openrouter_api = os.getenv("OPENROUTER_APIKEY")
base_url = os.getenv("BASE_URL")


llm = ChatOpenAI(
    model = llm,
    api_key = openrouter_api,
    base_url = base_url,
    streaming=True
)

#----------------------------------
# Prompts
#----------------------------------
generator_prompt = ChatPromptTemplate.from_template(
    """
    Answer the question based only on the following context: {context}
    Question: {question}

    Answer the question in following Schema
        type: "ASSISTANT"  <--- keep string intact
        heading: <heading of your answer>
        content: <your answer>
    """
)

step_back_prompt = ChatPromptTemplate.from_template(
    """
    You are an AI assistant tasked with generating broader, more general query to improve context retrieval in a RAG system.
    Given the original query, generate a step-back query that is more general and can help retrieve relevant background information.

    Original query: {original_query}

    Step-back query:
    """
)

generate_queries_prompt = ChatPromptTemplate.from_template(
    """
    You are an expert in query understanding and retrieval augmentation.
    Given a user's original query, a step-back version of that query (which is broader and more general), and a set of retrieved text chunks, your task is to generate specialized sub-queries for each chunk.
    Each sub-query should:

    Combine the intent of the original query and the step-back query.
    Be specific to the content of the chunks.
    Aim to retrieve or generate more detailed, contextual, or nuanced information related to that chunk.

    Avoid repeating the same question across chunks — each should be distinct and relevant to its own content.

    given:
        Original Query: {original_query}
        step-back Query: {step_back}
        Relevent Chunks: {chunks}
    
    Output_format:
        queries: str
    """
)
# ---------------------------------
# ADVANCED RAG NODE: Query Enhancement nodes
#----------------------------------
async def step_back(state:State):
    """
    This helps the system gather more context and background for better retrieval later.
    """
    prompt = step_back_prompt.invoke({"original_query":state['question']})
    response = llm.invoke(prompt)
    return {"step_back":response.content}    

async def speciallized_queries_generation(state:State):
    """
    Generate speciallized Query
    """
    prompt = step_back_prompt.invoke({
        "original_query":state['question'],
        "step_back":state['step_back'],
        "chunks":state['context']})
    
    response = llm.invoke(prompt)

    state["context"] = []
    return {"queries":response}  

# ---------------------------------
# ADVANCED RAG NODE: Post Retreiver
# ---------------------------------``
#----------------------------------
# NODE: Reterive
#----------------------------------
host = os.getenv("UNSIGNED_HOST")
pinecone_api_key = os.getenv("PINECONE_APIKEY")
store = VectorStore(host, pinecone_api_key)

async def get(questions):
    return await get_embeddings(questions)

async def reterive(state:State, config):
    try:
        embeddings = await get_embeddings([state["question"]])
        context = store.search(embeddings, namespace=config['metadata']["namespace"])
        cont =  {"context":'\n\n'.join([i['id']+' Chunk: '+i['metadata']['chunk']for i in context])}
        
        return cont
    except Exception as e:
        writer = get_stream_writer()  
        writer({
            "type":"SYSTEM",
            "heading": "",
            "content":str(e)
        })
        return {"context": str(e)}

#----------------------------------
# NODE: Generative
#----------------------------------
async def generate(state:State):
    try:
        writer = get_stream_writer()  
        genetor_llm = llm.with_structured_output(GenerativeModel)
        docs_content = state['context']
        messages = generator_prompt.invoke({"question":state["question"],"context":docs_content})
        response = genetor_llm.invoke(messages)

        writer(response)
        
        # Remove the strings
        state['context'] = []
        return {"answer":response.content}
    except Exception as e:
        writer = get_stream_writer()  
        writer({
            "type":"SYSTEM",
            "heading": "",
            "content":str(e)
        })
        return {"answer": str(e)}