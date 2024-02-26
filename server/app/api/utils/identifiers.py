import random
from sqlalchemy.orm import Session

def generate_code() -> str:
    characters = [char for char in "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
    code: str = ""
    for _ in range(10):
        code += random.choice(characters)
    return code

def unique_code(session: Session) -> str:
    used_codes = [row[0] for row in session.execute("SELECT code FROM users").all()]
    code: str = generate_code()
    while code in used_codes:
        code = generate_code()
    return code