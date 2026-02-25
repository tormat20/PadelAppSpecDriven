from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PADEL_", env_file=".env", extra="ignore")

    app_name: str = "Padel Host App"
    api_prefix: str = "/api/v1"
    db_path: str = "padel.duckdb"


settings = Settings()
