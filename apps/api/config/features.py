"""
Feature flags configuration for the Webapp Factory API.

This module provides a comprehensive feature flag system for:
- A/B testing
- Progressive rollouts
- Feature toggling
- Environment-specific features
- User/organization-specific features
"""

from typing import Dict, List, Optional, Any, Union
from enum import Enum
from datetime import datetime
from pydantic import Field, validator
from .base import BaseConfig, Environment


class FeatureFlagStrategy(str, Enum):
    """Feature flag rollout strategies."""
    ALL = "all"  # Enable for all users
    NONE = "none"  # Disable for all users
    PERCENTAGE = "percentage"  # Enable for percentage of users
    WHITELIST = "whitelist"  # Enable for specific users/orgs
    BLACKLIST = "blacklist"  # Disable for specific users/orgs
    GRADUAL = "gradual"  # Gradual rollout over time


class FeatureFlagCondition(BaseConfig):
    """Condition for feature flag evaluation."""
    
    # User-based conditions
    user_ids: List[str] = Field(
        default_factory=list,
        description="Specific user IDs"
    )
    
    user_roles: List[str] = Field(
        default_factory=list,
        description="User roles to match"
    )
    
    user_plans: List[str] = Field(
        default_factory=list,
        description="User subscription plans to match"
    )
    
    # Organization-based conditions
    organization_ids: List[str] = Field(
        default_factory=list,
        description="Specific organization IDs"
    )
    
    organization_plans: List[str] = Field(
        default_factory=list,
        description="Organization plans to match"
    )
    
    # Environment conditions
    environments: List[Environment] = Field(
        default_factory=list,
        description="Environments where this condition applies"
    )
    
    # Time-based conditions
    start_date: Optional[datetime] = Field(
        default=None,
        description="Start date for time-based rollout"
    )
    
    end_date: Optional[datetime] = Field(
        default=None,
        description="End date for time-based rollout"
    )
    
    # Custom attributes
    custom_attributes: Dict[str, Union[str, int, bool, List[str]]] = Field(
        default_factory=dict,
        description="Custom attributes for condition matching"
    )


class FeatureFlag(BaseConfig):
    """Individual feature flag configuration."""
    
    # Basic properties
    key: str = Field(description="Unique feature flag key")
    name: str = Field(description="Human-readable name")
    description: str = Field(description="Feature description")
    
    # Flag state
    enabled: bool = Field(
        default=False,
        description="Whether the flag is enabled"
    )
    
    strategy: FeatureFlagStrategy = Field(
        default=FeatureFlagStrategy.NONE,
        description="Rollout strategy"
    )
    
    # Rollout configuration
    percentage: int = Field(
        default=0,
        description="Percentage of users to enable (0-100)",
        ge=0,
        le=100
    )
    
    # Conditions
    conditions: List[FeatureFlagCondition] = Field(
        default_factory=list,
        description="Conditions for flag evaluation"
    )
    
    # Targeting
    whitelist_users: List[str] = Field(
        default_factory=list,
        description="Users who always have this feature enabled"
    )
    
    blacklist_users: List[str] = Field(
        default_factory=list,
        description="Users who never have this feature enabled"
    )
    
    whitelist_organizations: List[str] = Field(
        default_factory=list,
        description="Organizations that always have this feature enabled"
    )
    
    blacklist_organizations: List[str] = Field(
        default_factory=list,
        description="Organizations that never have this feature enabled"
    )
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    created_by: Optional[str] = Field(default=None, description="User who created the flag")
    
    # Dependencies
    depends_on: List[str] = Field(
        default_factory=list,
        description="Other feature flags this flag depends on"
    )
    
    # Tags for organization
    tags: List[str] = Field(
        default_factory=list,
        description="Tags for organizing flags"
    )
    
    @validator('key')
    def validate_key(cls, v):
        """Validate feature flag key format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError("Feature flag key must be alphanumeric with underscores or hyphens")
        return v.lower()


class FeatureFlagsConfig(BaseConfig):
    """Main feature flags configuration."""
    
    environment: Environment = Field(
        default=Environment.DEVELOPMENT,
        description="Application environment"
    )
    
    # Storage configuration
    storage_backend: str = Field(
        default="memory",
        description="Storage backend (memory, redis, firestore)"
    )
    
    # Cache settings
    cache_ttl_seconds: int = Field(
        default=300,  # 5 minutes
        description="Cache TTL for feature flag evaluations",
        ge=1
    )
    
    enable_caching: bool = Field(
        default=True,
        description="Enable caching of feature flag evaluations"
    )
    
    # Default flags
    default_flags: Dict[str, FeatureFlag] = Field(
        default_factory=dict,
        description="Default feature flags"
    )
    
    # Evaluation settings
    strict_mode: bool = Field(
        default=False,
        description="Fail on unknown feature flags (vs. returning False)"
    )
    
    log_evaluations: bool = Field(
        default=True,
        description="Log feature flag evaluations for analytics"
    )
    
    # API settings
    admin_api_enabled: bool = Field(
        default=True,
        description="Enable admin API for managing feature flags"
    )
    
    admin_api_auth_required: bool = Field(
        default=True,
        description="Require authentication for admin API"
    )
    
    # Metrics and monitoring
    metrics_enabled: bool = Field(
        default=True,
        description="Enable metrics collection for feature flags"
    )
    
    analytics_enabled: bool = Field(
        default=True,
        description="Enable analytics for A/B testing"
    )
    
    def add_default_flag(self, flag: FeatureFlag) -> None:
        """Add a default feature flag."""
        self.default_flags[flag.key] = flag
    
    def get_flag(self, key: str) -> Optional[FeatureFlag]:
        """Get a feature flag by key."""
        return self.default_flags.get(key)
    
    def remove_flag(self, key: str) -> bool:
        """Remove a feature flag by key."""
        if key in self.default_flags:
            del self.default_flags[key]
            return True
        return False


# Default feature flags for the application
def create_default_flags() -> Dict[str, FeatureFlag]:
    """Create default feature flags for the application."""
    flags = {}
    
    # Authentication features
    flags["oauth_login"] = FeatureFlag(
        key="oauth_login",
        name="OAuth Login",
        description="Enable OAuth login with Google",
        enabled=True,
        strategy=FeatureFlagStrategy.ALL,
        tags=["auth", "login"]
    )
    
    flags["mfa_required"] = FeatureFlag(
        key="mfa_required",
        name="Multi-Factor Authentication",
        description="Require MFA for sensitive operations",
        enabled=False,
        strategy=FeatureFlagStrategy.WHITELIST,
        whitelist_users=["admin"],
        tags=["auth", "security"]
    )
    
    # API features
    flags["rate_limiting"] = FeatureFlag(
        key="rate_limiting",
        name="API Rate Limiting",
        description="Enable rate limiting for API endpoints",
        enabled=True,
        strategy=FeatureFlagStrategy.ALL,
        tags=["api", "security"]
    )
    
    flags["api_v2"] = FeatureFlag(
        key="api_v2",
        name="API v2 Endpoints",
        description="Enable new API v2 endpoints",
        enabled=False,
        strategy=FeatureFlagStrategy.PERCENTAGE,
        percentage=10,
        tags=["api", "beta"]
    )
    
    # UI features
    flags["new_dashboard"] = FeatureFlag(
        key="new_dashboard",
        name="New Dashboard UI",
        description="Enable the redesigned dashboard interface",
        enabled=False,
        strategy=FeatureFlagStrategy.PERCENTAGE,
        percentage=20,
        tags=["ui", "dashboard", "beta"]
    )
    
    flags["dark_mode"] = FeatureFlag(
        key="dark_mode",
        name="Dark Mode",
        description="Enable dark mode theme",
        enabled=True,
        strategy=FeatureFlagStrategy.ALL,
        tags=["ui", "theme"]
    )
    
    # Premium features
    flags["advanced_analytics"] = FeatureFlag(
        key="advanced_analytics",
        name="Advanced Analytics",
        description="Advanced analytics and reporting features",
        enabled=True,
        strategy=FeatureFlagStrategy.WHITELIST,
        conditions=[
            FeatureFlagCondition(
                user_plans=["pro", "enterprise"],
                organization_plans=["business", "enterprise"]
            )
        ],
        tags=["premium", "analytics"]
    )
    
    flags["export_data"] = FeatureFlag(
        key="export_data",
        name="Data Export",
        description="Export user data and reports",
        enabled=True,
        strategy=FeatureFlagStrategy.WHITELIST,
        conditions=[
            FeatureFlagCondition(
                user_plans=["pro", "enterprise"]
            )
        ],
        tags=["premium", "export"]
    )
    
    # Experimental features
    flags["ai_suggestions"] = FeatureFlag(
        key="ai_suggestions",
        name="AI Suggestions",
        description="AI-powered suggestions and recommendations",
        enabled=False,
        strategy=FeatureFlagStrategy.PERCENTAGE,
        percentage=5,
        tags=["experimental", "ai", "beta"]
    )
    
    flags["real_time_collaboration"] = FeatureFlag(
        key="real_time_collaboration",
        name="Real-time Collaboration",
        description="Real-time collaborative editing features",
        enabled=False,
        strategy=FeatureFlagStrategy.WHITELIST,
        whitelist_organizations=["test-org"],
        tags=["experimental", "collaboration", "beta"]
    )
    
    return flags


# Configuration factories
def get_feature_flags_config() -> FeatureFlagsConfig:
    """Get feature flags configuration from environment variables."""
    config = FeatureFlagsConfig()
    config.default_flags = create_default_flags()
    return config


def get_development_flags_config() -> FeatureFlagsConfig:
    """Get development feature flags configuration."""
    config = FeatureFlagsConfig(environment=Environment.DEVELOPMENT)
    config.default_flags = create_default_flags()
    
    # Enable more experimental features in development
    config.storage_backend = "memory"
    config.strict_mode = False
    config.log_evaluations = True
    
    return config


def get_testing_flags_config() -> FeatureFlagsConfig:
    """Get testing feature flags configuration."""
    config = FeatureFlagsConfig(environment=Environment.TESTING)
    config.default_flags = create_default_flags()
    
    # Minimal flags for testing
    config.storage_backend = "memory"
    config.cache_ttl_seconds = 1  # Short cache for tests
    config.strict_mode = True  # Fail on unknown flags in tests
    config.log_evaluations = False
    
    return config


def get_production_flags_config() -> FeatureFlagsConfig:
    """Get production feature flags configuration."""
    config = FeatureFlagsConfig(environment=Environment.PRODUCTION)
    config.default_flags = create_default_flags()
    
    # Production settings
    config.storage_backend = "firestore"  # Persistent storage
    config.cache_ttl_seconds = 300
    config.strict_mode = False  # Don't fail on unknown flags
    config.log_evaluations = True
    config.metrics_enabled = True
    config.analytics_enabled = True
    
    return config


# Validation
def validate_feature_flags_config(config: FeatureFlagsConfig) -> List[str]:
    """Validate feature flags configuration."""
    issues = []
    
    # Check for flag dependency cycles
    for flag_key, flag in config.default_flags.items():
        visited = set()
        if _has_circular_dependency(flag, config.default_flags, visited):
            issues.append(f"Circular dependency detected for flag: {flag_key}")
    
    # Production checks
    if config.environment == Environment.PRODUCTION:
        if config.storage_backend == "memory":
            issues.append("Memory storage not recommended for production")
        
        if not config.admin_api_auth_required:
            issues.append("Admin API authentication should be required in production")
    
    return issues


def _has_circular_dependency(flag: FeatureFlag, all_flags: Dict[str, FeatureFlag], visited: set) -> bool:
    """Check for circular dependencies in feature flags."""
    if flag.key in visited:
        return True
    
    visited.add(flag.key)
    
    for dep_key in flag.depends_on:
        if dep_key in all_flags:
            dep_flag = all_flags[dep_key]
            if _has_circular_dependency(dep_flag, all_flags, visited):
                return True
    
    visited.remove(flag.key)
    return False