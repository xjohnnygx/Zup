from sqlalchemy.orm import Session
from api.schemas import Message_In_DB, Attachment_In_DB
from db.models import Message, Attachment


def get_message_by_ID(session: Session, messageID: int) -> (Message_In_DB|None):
    message = session.execute(f"SELECT * FROM messages WHERE messageID = {messageID}").first()
    if message:
        return Message_In_DB.from_orm(message)


def get_attachment_by_ID(session: Session, attachmentID: int) -> (Attachment_In_DB|None):
    attachment = session.execute(f"SELECT * FROM attachments WHERE attachmentID = {attachmentID}").first()
    if attachment:
        return Attachment_In_DB.from_orm(attachment)


def get_messages(session: Session, userx: int, usery: int, limit: int) -> (list[Message_In_DB]|None):
    userx_messages = session.execute(
            f"SELECT * FROM messages "
            f"WHERE sender = {userx} AND recipient = {usery} "
            f"ORDER BY messageID DESC "
            f"LIMIT {limit}"
            ).all()
    usery_messages = session.execute(
            f"SELECT * FROM messages "
            f"WHERE sender = {usery} AND recipient = {userx} "
            f"ORDER BY messageID DESC "
            f"LIMIT {limit}"
            ).all()
    x = [Message_In_DB.from_orm(x) for x in userx_messages] if userx_messages else None
    y = [Message_In_DB.from_orm(x) for x in usery_messages] if usery_messages else None
    if x and y:
        id = lambda instance: instance.messageID
        messages = sorted((x + y), key=id)
        return messages[-limit:]
    if x:
        return x[::-1]
    if y:
        return y[::-1]
    return None
    

def get_attachments(session: Session, userx: int, usery: int, limit: int) -> (list[Attachment_In_DB]|None):
    messages = get_messages(session=session, userx=userx, usery=usery, limit=limit)
    if messages:
        date = messages[0].dateTime
        userx_attachments = session.execute(
                f"SELECT * FROM attachments "
                f"WHERE sender = {userx} AND recipient = {usery} "
                f"AND dateTime > '{date}'"
                ).all()
        usery_attachments = session.execute(
                f"SELECT * FROM attachments "
                f"WHERE sender = {usery} AND recipient = {userx} "
                f"AND dateTime > '{date}'"
                ).all()
        x = [Attachment_In_DB.from_orm(x) for x in userx_attachments] if userx_attachments else None
        y = [Attachment_In_DB.from_orm(x) for x in usery_attachments] if usery_attachments else None
        if x and y:
            id = lambda instance: instance.attachmentID
            attachments = sorted((x + y), key=id)
            return attachments
        if x:
            return x
        if y:
            return y
        return None
    userx_attachments = session.execute(
            f"SELECT * FROM attachments "
            f"WHERE sender = {userx} AND recipient = {usery} "
            f"ORDER BY attachmentID DESC "
            f"LIMIT {limit}"
            ).all()
    usery_attachments = session.execute(
            f"SELECT * FROM attachments "
            f"WHERE sender = {usery} AND recipient = {userx} "
            f"ORDER BY attachmentID DESC "
            f"LIMIT {limit}"
            ).all()
    x = [Attachment_In_DB.from_orm(x) for x in userx_attachments] if userx_attachments else None
    y = [Attachment_In_DB.from_orm(x) for x in usery_attachments] if usery_attachments else None
    if x and y:
        id = lambda instance: instance.attachmentID
        attachments = sorted((x + y), key=id)
        return attachments[-limit:]
    if x:
        return x[::-1]
    if y:
        return y[::-1]
    return None


def get_conversation(session: Session, userx: int, usery: int, limit: int, amount: int):
    messages = get_messages(session=session, userx=userx, usery=usery, limit=limit)
    attachments = get_attachments(session=session, userx=userx, usery=usery, limit=limit)
    if messages and attachments:
        messages_attachments = (messages + attachments)
        date_time = lambda instance: instance.dateTime
        conversation = sorted(messages_attachments, key=date_time)
        return conversation[-amount:]
    if messages:
        return messages
    if attachments:
        return attachments
    return None


def filter_message(contact: str, message: Message_In_DB|Attachment_In_DB|None) -> str:
    if type(message) == Message_In_DB:
        return message.text
    if type(message) == Attachment_In_DB:
        return "new attachment."
    return f"Say hi to {contact}!"