from Src.utils.state import GenerativeModel

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langgraph.graph import StateGraph, START
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
agentic_rag = (StateGraph(state_schema = MessagesState)
    .add_node("model",model)
    .add_edge(START, "model")
    .compile(checkpointer=memory))
