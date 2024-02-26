import os
import random
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from api.schemas import User_In_DB

# Load variables from .env file
load_dotenv()

KEY: str = str(os.environ.get("KEY"))
ALGORITHM: str = str(os.environ.get("ALGORITHM"))
OAUTH2_SCHEME = OAuth2PasswordBearer(tokenUrl="/sign_in")
PASSWORD_CONTEXT = CryptContext(schemes=["bcrypt"],deprecated="auto")


def hash_password(password: str) -> str:
    return PASSWORD_CONTEXT.hash(password)


def verify_password(original_password: str, hashed_password: str) -> bool:
    return PASSWORD_CONTEXT.verify(original_password, hashed_password)


def authenticate_user(session: Session, email: str, password: str) -> User_In_DB:
    record = session.execute(f"SELECT * FROM users WHERE email = '{email}'").first()
    if not record:
        raise HTTPException(status_code=401, detail=f"User '{email}' not found")
    user = User_In_DB.from_orm(record)
    if not verify_password(original_password=password, hashed_password=user.password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return user


def generate_access_token(payload: dict) -> str:
    return jwt.encode(claims=payload, key=KEY, algorithm=ALGORITHM)


def decode_access_token(access_token: str) -> dict:
    return jwt.decode(token=access_token, key=KEY, algorithms=ALGORITHM)


def generate_authentication_code() -> str:
    code: str = ""
    nums: list[str] = [char for char in "0123456789"]
    for _ in range(4):
        code += random.choice(nums)
    return code