from fastapi import APIRouter, WebSocket, Query, Form, UploadFile, File, Body
from fastapi.responses import Response
from datetime import datetime
from sqlalchemy.orm import Session
from db.properties import engine
from db.models import Message, Attachment
from api.schemas import New_Message
from api.security.encryption import unHash
from api.utils import (
    ConnectionManager,
    get_user_by_code,
    get_message_by_ID,
    update_inbox,
    filter_filetype,
    get_conversation
)
import json


router = APIRouter()
manager = ConnectionManager()


@router.websocket("/message")
async def ws(websocket: WebSocket, client: str = Query(...)) -> None:
    with Session(engine) as session:
        user = get_user_by_code(session=session,code=unHash(client))
        if not user:
            return
        await manager.connect(
            user_code=user.code,
            websocket=websocket
        )
        try:
            while True:
                ASGI_MESSAGE = await websocket.receive()
                if ASGI_MESSAGE["type"] == "websocket.disconnect":
                    manager.disconnect(user_code=user.code)
                    break
                data: New_Message = New_Message(**json.loads(ASGI_MESSAGE["text"]))
                if data.type == "attachment":
                    await manager.broadcast(
                        sender=data.sender,
                        recipient=data.recipient,
                        message={
                            "type": "websocket.send",
                            "text": json.dumps({
                                "type": data.type,
                                "attachments": data.attachments
                            })
                        }
                    )
                if data.type == "message":
                    sender = get_user_by_code(session=session, code=data.sender)
                    recipient = get_user_by_code(session=session, code=data.recipient)
                    reference = get_message_by_ID(session=session, messageID=data.reference)
                    message: Message = Message(
                        sender=sender.userID,
                        recipient=recipient.userID,
                        text=data.text,
                        reference=reference.messageID if reference else None,
                        dateTime=str(datetime.utcnow())
                    )
                    session.add(message)
                    session.commit()
                    await manager.broadcast(
                        sender=sender.code,
                        recipient=recipient.code,
                        message={
                            "type": "websocket.send",
                            "text": json.dumps({
                                "type": data.type,
                                "message": {
                                    "messageID": message.messageID,
                                    "instanceType": message.instanceType,
                                    "sender": message.sender,
                                    "recipient": message.recipient,
                                    "text": message.text,
                                    "reference": reference.text if reference else None,
                                    "dateTime": message.dateTime
                                }
                            })
                        }
                    )
                    update_inbox(session=session, sender=sender.userID, recipient=recipient.userID)
                    session.commit()
        except Exception as error:
            print(error)
            manager.disconnect(user_code=user.code)
            await websocket.close()


@router.post("/uploads")
async def uploads(files: list[UploadFile] = File(...), metadata: str = Form(...)) -> Response:
    with Session(engine) as session:
        session.begin()
        try:
            data: dict = json.loads(metadata)
            sender = get_user_by_code(session=session, code=data["sender"])
            recipient = get_user_by_code(session=session, code=data["recipient"])
            attachments: list = []
            if not (sender and recipient):
                return Response(status_code=401)
            for file in files:
                filename: str = file.filename
                filetype: str = filter_filetype(file.content_type.split("/")[0])
                timestamp: str = datetime.utcnow().strftime('%Y%m%d%H%M%S')
                name, extension = filename.split(".")
                URL: str = f"/user{sender.userID}/{filetype}/{f'{name}{timestamp}.{extension}'}"
                with open(file=f"./db/media{URL}", mode="wb") as buffer:
                    buffer.write(await file.read())
                attachment: Attachment = Attachment(
                    sender=sender.userID,
                    recipient=recipient.userID,
                    type=file.content_type,
                    url=URL,
                    dateTime=str(datetime.utcnow())
                )
                session.add(attachment)
                session.commit()
                attachments.append({
                    "attachmentID": attachment.attachmentID,
                    "instanceType": attachment.instanceType,
                    "sender": attachment.sender,
                    "recipient": attachment.recipient,
                    "type": attachment.type,
                    "url": attachment.url,
                    "dateTime": attachment.dateTime
                })
            update_inbox(session=session, sender=sender.userID, recipient=recipient.userID)
            session.commit()
            return Response(
                content=json.dumps(attachments),
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        except Exception as error:
            print(error)
            session.rollback()
            return Response(status_code=500)


@router.post("/display_conversation")
async def display_conversation(details: dict = Body(...)) -> Response:
    with Session(engine) as session:
        try:
            user = get_user_by_code(session=session, code=details["client"])
            contact = get_user_by_code(session=session, code=details["contact"])
            messages = get_conversation(
                session=session,
                userx=user.userID,
                usery=contact.userID,
                limit=details["amount"],
                amount=details["amount"]
            )
            conversation = [dict(x) for x in messages] if messages else []
            for message in conversation:
                if message["instanceType"] == "message":
                    if message["reference"]:
                        reference = get_message_by_ID(
                            session=session,
                            messageID=message["reference"]
                        )
                        message["reference"] = reference.text
            return Response(
                content=json.dumps(conversation),
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        except Exception as error:
            print(error)
            return Response(status_code=500)