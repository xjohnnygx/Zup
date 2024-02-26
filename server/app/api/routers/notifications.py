from fastapi import APIRouter, WebSocket, Query
from sqlalchemy.orm import Session
from db.properties import engine
from api.security.encryption import unHash
from api.utils import (
    get_user_by_code,
    NotificationManager
)
import json


router = APIRouter()
manager = NotificationManager()

@router.websocket("/notification")
async def notifications(websocket: WebSocket, client: str = Query(...)) -> None:
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
                data = json.loads(ASGI_MESSAGE["text"])
                await manager.broadcast(
                    contact=data["notify_user"],
                    message={
                        "type": "websocket.send",
                        "text": json.dumps({
                            "task": data["operation"]
                        })
                    }
                )
        except Exception as error:
            print(error)
            manager.disconnect(user_code=user.code)
            await websocket.close()