from pydantic import BaseModel
from typing import TypedDict, List

class GenerativeModel(BaseModel):
  type: str
  heading: str
  content: str

class State(TypedDict):
  question:str
  context:List[str]
  answer: str