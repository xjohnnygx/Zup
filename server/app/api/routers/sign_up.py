from fastapi import APIRouter, Body, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from db.properties import engine
from db.models import User, UserInbox
from api.schemas import New_User, Token
from api.security.auth import (
    hash_password,
    generate_access_token,
    generate_authentication_code
)
from api.utils import (
    ClientManager,
    user_already_exists,
    get_user_by_ID,
    unique_code,
    create_user_media_folders,
    create_user_claims
)
import json


router = APIRouter()
manager = ClientManager()


@router.post("/request_authentication_code")
async def request_authentication_code(email: str = Body(...)) -> Response:
    with Session(engine) as session:
        try:
            user_already_exists(session=session, email=email)
            auth_code: str = generate_authentication_code()
            manager.add_client(email=email, auth_code=auth_code)
            message = f"Subject: Your Zup! Verification Code\n\nHello,\n\nYour verification code for your new Zup! account is: {auth_code}\n\nBest regards,\nThe Zup! Team"
            manager.mail_client(client=email, message=message)
            return Response(
                content=json.dumps(f"authentication code delivered to '{email}'"),
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        except HTTPException as error:
            return Response(
                content=json.dumps(error.detail),
                status_code=error.status_code,
                headers={"Content-Type": "application/json"}
            )
        except Exception as error:
            print(error)
            return Response(status_code=500)


@router.post("/sign_up")
async def sign_up(form_data: New_User = Body(...), authentication_code: str = Query(...)) -> Response:
    with Session(engine) as session:
        session.begin()
        try:
            manager.remove_expired_clients()
            manager.match_client_code(client=form_data.email, code=authentication_code)
            new_user: User = User(
                username=form_data.username,
                email=form_data.email,
                password=hash_password(form_data.password),
                code=unique_code(session=session)
                )
            session.add(new_user)
            session.commit()
            session.add(UserInbox(userID=new_user.userID))
            session.commit()
            create_user_media_folders(new_user.userID)
            user = get_user_by_ID(session=session, userID=new_user.userID)
            user_claims: dict = create_user_claims(user=user)
            token: str = generate_access_token(payload=user_claims)
            return Response(
                content=Token(access_token=token, token_type="bearer").json(),
                status_code=201,
                headers={"Content-Type": "application/json"}
            )
        except HTTPException as error:
            return Response(
                content=json.dumps(error.detail),
                status_code=error.status_code,
                headers={"Content-Type": "application/json"}
            )
        except Exception as error:
            session.rollback()
            print(error)
            return Response(status_code=500)