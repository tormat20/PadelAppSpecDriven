from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PADEL_", env_file=".env", extra="ignore")

    app_name: str = "Padel Host App"
    api_prefix: str = "/api/v1"
    db_path: str = "padel.duckdb"

    # JWT — jwt_secret_key has no default; the app refuses to start without it
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 hours

    # CORS — parsed from JSON array in env var, e.g.:
    # PADEL_CORS_ORIGINS=["http://localhost:5173","https://example.com"]
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
