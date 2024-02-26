from db.properties import base
# from properties import base
from sqlalchemy import Column, Integer, Text, String, ForeignKey
from datetime import datetime

class Message(base):
    __tablename__ = "messages"
    messageID = Column(Integer, primary_key=True)
    instanceType = Column(String, default="message", nullable=False)
    sender = Column(Integer, ForeignKey("users.userID"), nullable=False, index=True)
    recipient = Column(Integer, ForeignKey("users.userID"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    reference = Column(Integer, ForeignKey("messages.messageID"), nullable=True)
    dateTime = Column(String, nullable=False)