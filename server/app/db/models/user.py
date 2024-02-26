from db.properties import base
# from properties import base
from sqlalchemy import Column, Integer, String, JSON, ForeignKey

class User(base):
    __tablename__ = "users"
    userID = Column(Integer, primary_key=True)
    instanceType = Column(String, default="user", nullable=False)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True, index=True)
    photo_url = Column(String, nullable=True)

class UserInbox(base):
    __tablename__ = "users_inbox"
    userID = Column(Integer, ForeignKey("users.userID"), primary_key=True)
    conversations = Column(JSON, default=[], nullable=False)