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
        writer({"ERROR":str(e)})
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
        writer({"ERROR":str(e)})
        return {"answer": str(e)}