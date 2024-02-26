from db.properties import base
# from properties import base
from sqlalchemy import Column, Integer, String, ForeignKey
from datetime import datetime

class Attachment(base):
    __tablename__ = "attachments"
    attachmentID = Column(Integer, primary_key=True)
    instanceType = Column(String, default="attachment", nullable=False)
    sender = Column(Integer, ForeignKey("users.userID"), nullable=False, index=True)
    recipient = Column(Integer, ForeignKey("users.userID"), nullable=False, index=True)
    type = Column(String, nullable=False)
    url = Column(String, nullable=False)
    dateTime = Column(String, nullable=False)