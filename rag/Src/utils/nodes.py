from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.config import get_stream_writer
from dotenv import load_dotenv
import os

from Src.utils.state import State, GenerativeModel, QueryRouter
from Src.utils.tools import get_embeddings, VectorStore, curated_index, rerank_index

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
def get_text(path:str):
    file = open(path, 'r')
    return file.read()

#----------------------------------
# Prompts
#----------------------------------
generator_prompt = ChatPromptTemplate.from_template(get_text("Src.prompts.generator.txt"))
generate_queries_prompt = ChatPromptTemplate.from_template(get_text("Src.prompts.generate_queries.txt"))
simple_generator_prompt = ChatPromptTemplate.from_template(get_text("Src.prompts.simple_generator.txt"))
step_back_prompt = ChatPromptTemplate.from_template(get_text("Src.prompts.step_back.txt"))
query_router_prompt = ChatPromptTemplate.from_template(get_text("Src.prompts.query_router.txt"))


# ---------------------------------
# ADVANCED RAG NODE: Query Enhancement nodes
#----------------------------------
async def step_back(state:State):
    """
    This helps the system gather more context and background for better retrieval later.
    """
    prompt = step_back_prompt.invoke({"original_query":state['question']}).messages
    response = llm.invoke(prompt)
    return {"step_back":response.content}    

async def speciallized_queries_generation(state:State):
    """
    Generate speciallized Query
    """
    prompt = generate_queries_prompt.invoke({
        "original_query":state['question'],
        "step_back":state['step_back'],
        "chunks":state['context']}
    ).messages
    
    response = llm.invoke(prompt)

    state["context"] = []
    return {"queries":response}  

# ---------------------------------
# ADVANCED RAG NODE: Post Retreiver
# ---------------------------------`
async def filter_results(state:State):
    curated = await curated_index(state['context'],state['question']) # > Result Indexes of relevent docs
    state['context'] = [state['context'][idx] for idx in curated]
    return state
    
        

async def re_rank_results(state:State):
    re_ranked_indexes = await re_ranked_indexes(state['context'],state['question']) 
    raise NotImplementedError
    return state

# ---------------------------------
# ADVANCED RAG NODE: Query Router
# ---------------------------------
async def router_query(state:State):
    prompt = query_router_prompt.invoke(
        {"user_query":state['question']}
    ).messages

    router = llm.with_structured_output(QueryRouter)

    response = router.invoke(prompt)
    return {"decision":response.decision}

async def general_chat(state:State):
    try:
        writer = get_stream_writer()  
        genetor_llm = llm.with_structured_output(GenerativeModel)
        messages = simple_generator_prompt.invoke(
            {"question":state['question']}
        ).messages
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
    
async def reterive_queries(state:State, config):
    try:
        Context = []
        for query in state['queries']:
            embeddings = await get_embeddings([query])
            context = store.search(embeddings, namespace=config['metadata']["namespace"])
            cont =  '\n\n'.join([i['id']+' Chunk: '+i['metadata']['chunk']for i in context])
            Context.append(cont)
        
        return {"context":Context}
    
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