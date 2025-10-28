from typing import List, Optional
from types import MethodType
from pydantic import BaseModel, Field, ValidationError, validator


class AuthClaims(BaseModel):
    """
    Authentication claims extracted from JWT token.
    
    This model represents the claims contained in a validated JWT access token.
    Standard JWT claims (exp, iat, iss, aud) are validated but not included here.
    """
    
    sub: str = Field(..., min_length=1)  # Subject (user ID)
    email: Optional[str] = None
    orgId: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    plan: Optional[str] = None
    features: List[str] = Field(default_factory=list)

    @validator("roles", "features", pre=True, always=True)
    def ensure_list(cls, v):
        # Normalize None to empty list and ensure the value is an iterable of strings
        if v is None:
            return []

        if isinstance(v, (list, tuple, set)):
            return list(v)

        raise ValueError("must be a list of strings")
    
    def has_role(self, role: str) -> bool:
        """Check if user has a specific role (case-insensitive)."""
        return role.lower() in [r.lower() for r in self.roles]
    
    def has_any_role(self, *roles: str) -> bool:
        """Check if user has any of the specified roles (case-insensitive)."""
        user_roles = {r.lower() for r in self.roles}
        allowed_roles = {r.lower() for r in roles}
        return bool(user_roles.intersection(allowed_roles))
    
    def has_plan(self, *plans: str) -> bool:
        """Check if user has one of the specified plans (case-insensitive)."""
        # Treat only None as 'no plan'; empty string is a valid plan value
        if self.plan is None:
            return False
        return self.plan.lower() in [p.lower() for p in plans]
    
    def has_feature(self, feature: str) -> bool:
        """Check if user has access to a specific feature (case-insensitive)."""
        return feature.lower() in [f.lower() for f in self.features]
    
    def belongs_to_org(self, org_id: str) -> bool:
        """Check if user belongs to the specified organization."""
        # Treat only None as 'no org'; empty string should be compared normally
        if self.orgId is None:
            return False
        return str(self.orgId) == str(org_id)

    def __init__(self, **data):
        try:
            super().__init__(**data)
        except ValidationError as exc:
            original_errors = exc.errors

            def _errors_with_field(self_exc):
                formatted = []
                for err in original_errors():
                    loc = err.get("loc") or ()
                    field = loc[0] if loc else None
                    err_type = err.get("type") or "value_error"
                    if err_type.endswith("missing"):
                        err_type = "missing"
                    formatted.append(
                        {
                            "field": field,
                            "type": err_type,
                        }
                    )
                return formatted

            exc.errors = MethodType(_errors_with_field, exc)
            raise exc
