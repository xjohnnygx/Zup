import random

def Hash(data: str) -> str:
    characters: str = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    inverted: str = ""
    result: str = ""
    for x in data:
        inverted = x + inverted
    i: int = 0
    while i < len(data):
        result += random.choice(characters)
        result += random.choice(characters)
        result += inverted[i]
        i += 1
    return result

def unHash(hash: str) -> str:
    inverted: str = ""
    result: str = ""
    i: int = 2
    while i < len(hash):
        inverted += hash[i]
        i += 3
    for x in inverted:
        result = x + result
    return result