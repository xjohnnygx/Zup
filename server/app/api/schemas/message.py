from pydantic import BaseModel


class New_Message(BaseModel):
    type: str
    sender: str
    recipient: str
    text: str|None = None
    reference: int = 0
    attachments: list|None = None

class Message_In_DB(BaseModel):
    messageID: int
    instanceType: str
    sender: int
    recipient: int
    text: str
    reference: int|None = None
    dateTime: str
    class Config:
        orm_mode = True