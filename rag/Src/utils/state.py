from pydantic import BaseModel
from typing import TypedDict, List

class GenerativeModel(BaseModel):
  type: str
  heading: str
  content: str

class GenerateQueries(BaseModel):
  queries: str

# Node: Query Router
class QueryRouter(BaseModel):
  decision: str

class State(TypedDict):
  decision: str
  question: str
  context: List[str]
  answer: str
  queries: List[str]
  step_back: str