from pydantic import BaseModel


class Attachment_In_DB(BaseModel):
    attachmentID: int
    instanceType: str
    sender: int
    recipient: int
    type: str
    url: str
    dateTime: str
    class Config:
        orm_mode = True