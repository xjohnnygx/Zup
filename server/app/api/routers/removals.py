from fastapi import APIRouter, Body
from fastapi.responses import Response
from sqlalchemy.orm import Session
from db.properties import engine
from api.utils import (
    get_user_by_ID,
    get_user_by_code,
    get_message_by_ID,
    get_attachment_by_ID,
    get_user_conversations
)
import json


router = APIRouter()


@router.delete("/delete_message")
async def delete_message(data: dict = Body(...)) -> Response:
    with Session(engine) as session:
        try:
            user = get_user_by_ID(session=session, userID=data["client"])
            if data["type"] == "message":
                message = get_message_by_ID(session=session, messageID=data["id"])
                sender = get_user_by_ID(session=session, userID=message.sender)
                recipient = get_user_by_ID(session=session, userID=message.recipient)
                if not (user.userID == sender.userID):
                    return Response(status_code=401)
                session.execute(f"DELETE FROM messages WHERE messageID = {message.messageID}")
                session.commit()
                return Response(
                    content=json.dumps({
                        "notify_user": recipient.code,
                        "operation": "update chat"
                    }),
                    status_code=200,
                    headers={"Content-Type": "application/json"}
                )
            if data["type"] == "attachment":
                attachment = get_attachment_by_ID(session=session, attachmentID=data["id"])
                sender = get_user_by_ID(session=session, userID=attachment.sender)
                recipient = get_user_by_ID(session=session, userID=attachment.recipient)
                if not (user.userID == sender.userID):
                    return Response(status_code=401)
                session.execute(f"DELETE FROM attachments WHERE attachmentID = {attachment.attachmentID}")
                session.commit()
                return Response(
                    content=json.dumps({
                        "notify_user": recipient.code,
                        "operation": "update chat"
                    }),
                    status_code=200,
                    headers={"Content-Type": "application/json"}
                )
            return Response(status_code=422)
        except Exception as error:
            print(error)
            return Response(status_code=500)


@router.delete("/remove_conversation")
async def remove_conversation(data: dict = Body(...)) -> Response:
    with Session(engine) as session:
        try:
            user = get_user_by_code(session=session, code=data["client"])
            contact = get_user_by_code(session=session, code=data["contact"])
            conversations = get_user_conversations(session=session, userID=user.userID)
            conversations.remove(contact.userID)
            session.execute(
                f"UPDATE users_inbox "
                f"SET conversations = '{conversations}' "
                f"WHERE userID = {user.userID}"
                )
            session.commit()
            return Response(status_code=200)
        except Exception as error:
            print(error)
            return Response(status_code=500)