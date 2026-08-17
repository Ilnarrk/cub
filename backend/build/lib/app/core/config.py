"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Rubik's Cube Solver API"
    app_version: str = "0.1.0"
    debug: bool = True

    # API
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Vision
    face_warp_size: int = 300
    grid_cell_sample_size: int = 5  # 5x5 neighbourhood for median sampling

    # Solver
    kociemba_max_moves: int = 20


settings = Settings()