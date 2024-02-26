from datetime import datetime, timedelta
from fastapi import HTTPException, WebSocket
from dotenv import load_dotenv
import smtplib, ssl
import os


# Load variables from .env file
load_dotenv()


class ClientManager:
    def __init__(self) -> None:
        self.clients: dict = {}

    def add_client(self, email: str, auth_code: str) -> None:
        self.clients[email] = {
                "delivered_code": auth_code,
                "code_expiration": (datetime.utcnow() + timedelta(minutes=3))
            }
        
    def mail_client(self, client: str, message: str) -> None:
        sender: str = str(os.environ.get("EMAIL"))
        recipient: str = client
        password: str = str(os.environ.get("EMAIL_PASSWORD"))
        with smtplib.SMTP_SSL(host="smtp.gmail.com", port=465, context=ssl.create_default_context()) as server:
            server.login(sender, password)
            server.sendmail(sender, recipient, message)

    def remove_expired_clients(self) -> None:
        try:
            for client in list(self.clients.keys()):
                if self.clients[client]["code_expiration"] < datetime.utcnow():
                    del self.clients[client]
        except:
            return None

    def match_client_code(self, client: str, code: str) -> None:
        try:
            authentication_code = self.clients[client]["delivered_code"]
            if not (authentication_code == code):
                raise HTTPException(status_code=401, detail="incorrect code")
        except:
            raise HTTPException(status_code=401, detail="incorrect code")
        

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict = {}

    async def connect(self, user_code: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[user_code] = websocket

    def disconnect(self, user_code: str) -> None:
        del self.active_connections[user_code]

    async def broadcast(self, sender: str, recipient: str, message: dict) -> None:
        if sender in self.active_connections:
            connection: WebSocket = self.active_connections[sender]
            await connection.send(message=message)
        if recipient in self.active_connections:
            connection: WebSocket = self.active_connections[recipient]
            await connection.send(message=message)


class NotificationManager:
    def __init__(self) -> None:
        self.active_connections: dict = {}

    async def connect(self, user_code: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[user_code] = websocket

    def disconnect(self, user_code: str) -> None:
        del self.active_connections[user_code]

    async def broadcast(self, contact: str, message: dict) -> None:
        if contact in self.active_connections:
            connection: WebSocket = self.active_connections[contact]
            await connection.send(message=message)