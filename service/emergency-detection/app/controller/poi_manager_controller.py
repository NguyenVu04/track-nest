from fastapi import APIRouter

router = APIRouter(
    prefix="/poi",
    tags=["poi"]
)

@router.get("/")
async def root():
    return {"message": "Welcome to the POI Manager API!"}