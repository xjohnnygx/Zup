from fastapi import APIRouter, Query, Body
from fastapi.responses import Response
from sqlalchemy.orm import Session
from db.properties import engine
from api.security.encryption import unHash
from api.utils import (
    get_user_by_ID,
    get_user_by_code,
    get_user_conversations,
    get_conversation,
    filter_message
)
import json


router = APIRouter()

@router.get("/request_inbox")
async def request_inbox(client: str = Query(...)) -> Response:
    with Session(engine) as session:
        try:
            current = get_user_by_code(session=session, code=unHash(client))
            if not current:
                return Response(status_code=401)
            inbox: list = []
            conversations: list[int] = get_user_conversations(session=session, userID=current.userID)
            for contact in conversations:
                user = get_user_by_ID(session=session, userID=contact)
                messages = get_conversation(
                    session=session,
                    userx=current.userID,
                    usery=user.userID,
                    limit=1,
                    amount=1
                )
                message = messages[0] if messages else None
                inbox.append({
                    "photo": user.photo_url,
                    "username": user.username,
                    "code": user.code,
                    "message": filter_message(contact=user.username, message=message),
                    "dateTime": message.dateTime if message else None
                })
            return Response(
                content=json.dumps(inbox[::-1]),
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        except Exception as error:
            print(error)
            return Response(status_code=500)
        

@router.post("/add_contact")
async def add_contact(data: dict = Body(...)) -> Response:
    with Session(engine) as session:
        try:
            user = get_user_by_code(session=session, code=data["client"])
            contact = get_user_by_code(session=session, code=data["contact"])
            conversations = get_user_conversations(session=session, userID=user.userID)
            if contact.userID in conversations:
                return Response(
                    content=json.dumps(f"contact '{data['contact']}' already exists."),
                    status_code=409,
                    headers={"Content-Type": "application/json"}
                )
            conversations.append(contact.userID)
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