"""
Base configuration classes and utilities.
"""

from enum import Enum
from typing import Any, Dict
from pydantic import BaseModel, Field


class Environment(str, Enum):
    """Application environment types."""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class BaseConfig(BaseModel):
    """Base configuration class with common utilities."""
    
    model_config = {"env_file": ".env", "extra": "ignore"}
    
    def get_env_vars(self) -> Dict[str, Any]:
        """Get all environment variables as a dictionary."""
        return self.model_dump()
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return getattr(self, 'environment', Environment.DEVELOPMENT) == Environment.PRODUCTION
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return getattr(self, 'environment', Environment.DEVELOPMENT) == Environment.DEVELOPMENT
    
    def is_testing(self) -> bool:
        """Check if running in testing environment."""
        return getattr(self, 'environment', Environment.DEVELOPMENT) == Environment.TESTING