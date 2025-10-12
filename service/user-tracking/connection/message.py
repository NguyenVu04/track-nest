from pydantic import BaseModel

class Message(BaseModel):
    topic: str
    message: str