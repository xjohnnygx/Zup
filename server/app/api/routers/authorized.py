from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from db.properties import engine
from api.utils import get_user_by_token
import json


router = APIRouter()


@router.get("/verify_authentication")
async def verify_authentication(Authorization: str = Header(...)) -> Response:
    with Session(engine) as session:
        try:
            user = get_user_by_token(session=session, token=Authorization)
            return Response(
                content=user.json(),
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
            return Response(status_code=401)