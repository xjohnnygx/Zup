from fastapi import HTTPException
from sqlalchemy.orm import Session
from api.schemas import User_In_DB
from api.security.auth import decode_access_token
from jose import ExpiredSignatureError
from datetime import datetime, timedelta
import os
import json


def get_user_by_ID(session: Session, userID: int) -> (User_In_DB|None):
    user = session.execute(f"SELECT * FROM users WHERE userID = {userID}").first()
    if user:
        return User_In_DB.from_orm(user)


def get_user_by_email(session: Session, email: str) -> (User_In_DB|None):
    user = session.execute(f"SELECT * FROM users WHERE email = '{email}'").first()
    if user:
        return User_In_DB.from_orm(user)


def get_user_by_code(session: Session, code: str) -> (User_In_DB|None):
    user = session.execute(f"SELECT * FROM users WHERE code = '{code}'").first()
    if user:
        return User_In_DB.from_orm(user)


def get_user_by_token(session: Session, token: str) -> User_In_DB:
    try:
        claims: dict = decode_access_token(access_token=token)
        user = get_user_by_ID(session=session, userID=int(claims["sub"]))
        if not user:
            raise HTTPException(status_code=401, detail="invalid credentials")
        return user
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="session expired")
    except Exception:
        raise HTTPException(status_code=401, detail="invalid credentials")


def user_already_exists(session: Session, email: str) -> None:
    accounts = [row[0] for row in session.execute("SELECT email FROM users").all()]
    if email in accounts:
        raise HTTPException(status_code=409, detail=f"account '{email}' already exists")

    
def create_user_media_folders(userID: int) -> None:
    folders: list[str] = ["audios","images","videos","documents","profile"]
    os.mkdir(f"./db/media/user{userID}")
    for folder in folders:
        os.mkdir(f"./db/media/user{userID}/{folder}")


def create_user_claims(user: User_In_DB) -> dict:
    claims = {
        "iss": "Zup!",
        "sub": str(user.userID),
        "account": user.email,
        "iat": datetime.utcnow(),
        "exp": (datetime.utcnow() + timedelta(weeks=1))
    }
    return claims


def get_user_conversations(session: Session, userID: int) -> list[int]:
    result = session.execute(f"SELECT conversations FROM users_inbox WHERE userID = {userID}").scalar()
    conversations = json.loads(result)
    return conversations


def update_inbox(session: Session, sender: int, recipient: int) -> None:
    sender_conversations: list[int] = get_user_conversations(session=session, userID=sender)
    recipient_conversations: list[int] = get_user_conversations(session=session, userID=recipient)
    if not (recipient in sender_conversations):
        sender_conversations.append(recipient)
    else:
        sender_conversations.remove(recipient)
        sender_conversations.append(recipient)
    if not (sender in recipient_conversations):
        recipient_conversations.append(sender)
    else:
        recipient_conversations.remove(sender)
        recipient_conversations.append(sender)
    session.execute(
        f"UPDATE users_inbox "
        f"SET conversations = '{sender_conversations}' "
        f"WHERE userID = {sender}"
        )
    session.execute(
        f"UPDATE users_inbox "
        f"SET conversations = '{recipient_conversations}' "
        f"WHERE userID = {recipient}"
        )