from pydantic import BaseModel

class User_Log(BaseModel):
    email: str
    password: str

class New_User(BaseModel):
    username: str
    email: str
    password: str

class User_In_DB(BaseModel):
    userID: int
    instanceType: str
    username: str
    email: str
    password: str
    code: str
    photo_url: str|None = None
    class Config:
        orm_mode = True