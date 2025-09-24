from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langgraph.graph import StateGraph, START
from langgraph.checkpoint.memory import MemorySaver

import os
from dotenv import load_dotenv

load_dotenv()

llm = os.getenv("SECONDARY_LLM")
openrouter_api = os.getenv("OPENROUTER_APIKEY")

llm = ChatOpenAI(
    model = llm,
    api_key=openrouter_api,
    base_url = "https://openrouter.ai/api/v1",
    streaming=True
)


# Node
def model(state: MessagesState):
    response = llm.invoke(state['messages'])
    return {"messages": response}

memory = MemorySaver()
agentic_rag = (StateGraph(state_schema = MessagesState)
    .add_node("model",model)
    .add_edge(START, "model")
    .compile(checkpointer=memory))