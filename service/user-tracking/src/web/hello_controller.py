from fastapi import APIRouter

router = APIRouter(prefix="", tags=["hello"])

@router.get("/")
async def say_hello():
    return {"message": "Hello, World!"}