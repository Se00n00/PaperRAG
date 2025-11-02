from Src.utils.state import GenerativeModel
from Src.utils.nodes import reterive, generate, step_back, speciallized_queries_generation, filter_results, re_rank_results, router_query, general_chat, reterive_queries
from Src.utils.state import State

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.config import get_stream_writer

import os
from dotenv import load_dotenv

load_dotenv()

llm = os.getenv("SECONDARY_LLM")
openrouter_api = os.getenv("OPENROUTER_APIKEY")
base_url = os.getenv("BASE_URL")

# Model Initiallization
llm = ChatOpenAI(
    model = llm,
    api_key=openrouter_api,
    base_url = base_url,
    streaming=True
)

def get_text(path:str):
    file = open(path, 'r')
    return file.read()

# Prompt template
prompt_template = ChatPromptTemplate([
    SystemMessage(content=get_text("Src/prompts/agent.txt")), MessagesPlaceholder("query")
])

# Node
structured_llm = llm.with_structured_output(GenerativeModel)
def model(state: MessagesState):
    writer = get_stream_writer()
    try:
        response = structured_llm.invoke(
            prompt_template.invoke({"query":state['messages']}).to_messages()
        )
        return {"messages": response.answer}
    except Exception as e:
        print(str(e))

memory = MemorySaver()
agentic_rag = (
    StateGraph(state_schema = MessagesState)
    .add_node("model",model)
    .add_edge(START, "model")
    .compile(checkpointer=memory)
)

memory_rag1 = MemorySaver()
naive_rag_graph = (
    StateGraph(State)
    .add_sequence([reterive, generate])
    .add_edge(START, "reterive")
    .compile(checkpointer = memory_rag1)
)
memory_rag2 = MemorySaver()
advanced_rag_graph =(
    StateGraph(State)
    .add_node("router_query", router_query)
    .add_node("step_back", step_back)
    .add_node("queries", speciallized_queries_generation)
    .add_node("filter_results", filter_results)
    .add_node("re_rank_results", re_rank_results)
    .add_node("general_chat",general_chat)
    .add_node("reterive",reterive)
    .add_node("reterive_queries",reterive_queries)
    .add_node("generate",generate)
    .add_edge(START,"router_query")
    .add_conditional_edges(
        "router_query",
        {"RETRIEVE":"step_back","DIRECT":"general_chat"}
    )
    .add_edge("step_back","reterive")
    .add_edge("reterive","queries")
    .add_edge("queries","reterive_queries")
    .add_edge("reterive_queries","filter_results")
    .add_edge("filter_results","re_rank_results")
    .add_edge("re_rank_results","generate")
    .add_edge("general_chat",END)
    .add_edge("generate",END)
    .compile(checkpointer = memory_rag2)
)
# TODO: Hybrid Retreival
# TODO: While fixing thread_id, fix the previous queries for memory