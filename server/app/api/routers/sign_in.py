from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import Response
from api.schemas import User_Log, Token
from api.security.auth import authenticate_user, generate_access_token
from api.utils import create_user_claims
from sqlalchemy.orm import Session
from db.properties import engine
import json


router = APIRouter()


@router.post("/sign_in")
async def sign_in(form_data: User_Log = Body(...)) -> Response:
    with Session(engine) as session:
        try:
            user = authenticate_user(session=session, email=form_data.email, password=form_data.password)
            claims: dict = create_user_claims(user=user)
            token: str = generate_access_token(payload=claims)
            return Response(
                content=Token(access_token=token, token_type="bearer").json(),
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