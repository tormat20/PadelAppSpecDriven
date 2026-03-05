from fastapi import APIRouter, Depends

from app.api.deps import TokenData, get_current_user, services_scope
from app.api.schemas.auth import LoginRequest, MeResponse, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest) -> TokenResponse:
    with services_scope() as services:
        token = services["auth_service"].register(payload.email, payload.password)
        return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    with services_scope() as services:
        token = services["auth_service"].login(payload.email, payload.password)
        return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
def me(token_data: TokenData = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=token_data.sub,
        email=token_data.email,
        role=token_data.role,
    )
