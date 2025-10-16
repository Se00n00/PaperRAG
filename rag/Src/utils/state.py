from pydantic import BaseModel

class GenerativeModel(BaseModel):
    type: str
    heading: str
    answer: str