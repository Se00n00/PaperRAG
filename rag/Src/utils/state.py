from pydantic import BaseModel

class GenerativeModel(BaseModel):
    type:str
    answer:str