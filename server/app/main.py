import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routers import (
    routerA,
    router1,
    router2,
    router3,
    router4,
    router5,
    router6,
    router7
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","PATCH","DELETE"],
    allow_headers=["*"],
)

app.include_router(router=routerA)
app.include_router(router=router1)
app.include_router(router=router2)
app.include_router(router=router3)
app.include_router(router=router4)
app.include_router(router=router5)
app.include_router(router=router6)
app.include_router(router=router7)
app.mount(
    path="/media",
    app=StaticFiles(
        directory="./db/media"
    )
)

if __name__ == "__main__":
    uvicorn.run(app=app, host="127.0.0.1", port=8080)