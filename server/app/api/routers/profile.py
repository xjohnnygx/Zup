from fastapi import APIRouter, UploadFile, File, Form, Query, Body
from fastapi.responses import Response
from sqlalchemy.orm import Session
from db.properties import engine
from api.utils import get_user_by_code
from api.security.encryption import unHash
import json
import os

router = APIRouter()

@router.put("/update_photo")
async def update_photo(photo: UploadFile = File(...), client: str = Form(...)) -> Response:
    with Session(engine) as session:
        try:
            user = get_user_by_code(session=session, code=client)
            URL = f"/user{user.userID}/profile/{photo.filename}"
            path = "./db/media"
            with open(f"{path}{URL}","wb") as buffer:
                buffer.write(await photo.read())
            session.execute(
                f"UPDATE users "
                f"SET photo_url = '{URL}' "
                f"WHERE userID = {user.userID}"
                )
            session.commit()
            return Response(
                content=json.dumps(URL),
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        except Exception as error:
            print(error)
            return Response(status_code=500)
        

@router.delete("/remove_photo")
async def remove_photo(client: str = Query(...)) -> Response:
    with Session(engine) as session:
        try:
            user = get_user_by_code(session=session, code=unHash(client))
            photos = os.listdir(f"./db/media/user{user.userID}/profile")
            for photo in photos:
                os.remove(f"./db/media/user{user.userID}/profile/{photo}")
            session.execute(
                f"UPDATE users "
                f"SET photo_url = NULL "
                f"WHERE userID = {user.userID}"
                )
            session.commit()
            return Response(status_code=200)
        except Exception as error:
            print(error)
            return Response(status_code=500)
        

@router.put("/update_username")
async def update_photo(data: dict = Body(...)) -> Response:
    with Session(engine) as session:
        try:
            session.execute(
                f"UPDATE users "
                f"SET username = '{data['username']}' "
                f"WHERE userID = {data['client']}"
                )
            session.commit()
            return Response(status_code=200)
        except Exception as error:
            print(error)
            return Response(status_code=500)