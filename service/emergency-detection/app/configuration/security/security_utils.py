from fastapi import Depends, HTTPException, Request

def get_current_user(request: Request):
    user = request.state.user
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

def require_role(role: str):
    def checker(user = Depends(get_current_user)):
        if role not in user.roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker