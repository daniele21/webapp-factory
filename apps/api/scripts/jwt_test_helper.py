#!/usr/bin/env python3
"""
JWT Test Utility for Webapp Factory API

This script helps generate test JWT tokens for development and testing purposes.
It provides different preset user scenarios and allows custom token generation.

Usage:
    python scripts/jwt_test_helper.py --help
    python scripts/jwt_test_helper.py --preset admin
    python scripts/jwt_test_helper.py --preset pro-user
    python scripts/jwt_test_helper.py --custom --user-id user123 --roles owner --plan enterprise
"""

import argparse
import sys
import os
from datetime import datetime, timezone

# Add the parent directory to Python path to import from the API
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from auth.jwt import sign_access_jwt, verify_access_jwt


# Preset user scenarios for testing
PRESETS = {
    "admin": {
        "sub": "admin_001",
        "email": "admin@example.com",
        "orgId": "org_main",
        "roles": ["admin", "owner"],
        "plan": "enterprise",
        "features": ["vector_search", "ai_assistant", "advanced_analytics"],
        "ttl_minutes": 60,
    },
    "owner": {
        "sub": "owner_001", 
        "email": "owner@example.com",
        "orgId": "org_startup",
        "roles": ["owner"],
        "plan": "pro",
        "features": ["vector_search", "ai_assistant"],
        "ttl_minutes": 60,
    },
    "pro-user": {
        "sub": "user_pro_001",
        "email": "pro.user@example.com", 
        "orgId": "org_company",
        "roles": ["member"],
        "plan": "pro",
        "features": ["vector_search"],
        "ttl_minutes": 60,
    },
    "free-user": {
        "sub": "user_free_001",
        "email": "free.user@example.com",
        "orgId": "org_personal", 
        "roles": ["member"],
        "plan": "free",
        "features": [],
        "ttl_minutes": 60,
    },
    "enterprise-admin": {
        "sub": "enterprise_admin_001",
        "email": "admin@enterprise.com",
        "orgId": "org_enterprise",
        "roles": ["admin", "owner"],
        "plan": "enterprise", 
        "features": ["vector_search", "ai_assistant", "advanced_analytics", "white_label"],
        "ttl_minutes": 120,
    },
    "member": {
        "sub": "member_001",
        "email": "member@example.com",
        "orgId": "org_team",
        "roles": ["member"],
        "plan": "pro",
        "features": ["vector_search"],
        "ttl_minutes": 60,
    }
}


def generate_token_from_preset(preset_name: str) -> str:
    """Generate a JWT token from a preset configuration."""
    if preset_name not in PRESETS:
        raise ValueError(f"Unknown preset: {preset_name}. Available: {list(PRESETS.keys())}")
    
    config = PRESETS[preset_name]
    return sign_access_jwt(**config)


def generate_custom_token(
    user_id: str,
    email: str = None,
    org_id: str = None, 
    roles: list = None,
    plan: str = None,
    features: list = None,
    ttl_minutes: int = 60
) -> str:
    """Generate a custom JWT token with specified parameters."""
    return sign_access_jwt(
        sub=user_id,
        email=email,
        orgId=org_id,
        roles=roles or [],
        plan=plan,
        features=features or [],
        ttl_minutes=ttl_minutes,
    )


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        claims = verify_access_jwt(token)
        return claims
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        sys.exit(1)


def print_token_info(token: str, claims: dict = None):
    """Pretty print token information."""
    if claims is None:
        claims = verify_token(token)
    
    print("🔑 Generated JWT Token:")
    print(f"   {token}")
    print()
    print("📋 Token Claims:")
    print(f"   User ID:      {claims.get('sub')}")
    print(f"   Email:        {claims.get('email', 'N/A')}")
    print(f"   Organization: {claims.get('orgId', 'N/A')}")
    print(f"   Roles:        {', '.join(claims.get('roles', []))}")
    print(f"   Plan:         {claims.get('plan', 'N/A')}")
    print(f"   Features:     {', '.join(claims.get('features', []))}")
    print(f"   Issued At:    {datetime.fromtimestamp(claims.get('iat', 0), timezone.utc)}")
    print(f"   Expires At:   {datetime.fromtimestamp(claims.get('exp', 0), timezone.utc)}")
    print()
    print("🧪 Testing Commands:")
    print('   export TOKEN="' + token + '"')
    print("   curl -H \"Authorization: Bearer $TOKEN\" http://localhost:8000/protected/me")
    print()


def print_available_presets():
    """Print information about available presets."""
    print("📦 Available Presets:")
    print()
    for name, config in PRESETS.items():
        print(f"   {name}:")
        print(f"      User:     {config['email']} ({config['sub']})")
        print(f"      Org:      {config['orgId']}")
        print(f"      Roles:    {', '.join(config['roles'])}")
        print(f"      Plan:     {config['plan']}")
        print(f"      Features: {', '.join(config['features']) if config['features'] else 'None'}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="JWT Test Utility for Webapp Factory API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --preset admin
  %(prog)s --preset pro-user
  %(prog)s --list-presets
  %(prog)s --custom --user-id user123 --email user@test.com --roles member --plan pro
  %(prog)s --verify-token "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    
    group.add_argument(
        "--preset", 
        choices=list(PRESETS.keys()),
        help="Generate token from preset configuration"
    )
    
    group.add_argument(
        "--custom",
        action="store_true", 
        help="Generate custom token with specified parameters"
    )
    
    group.add_argument(
        "--list-presets",
        action="store_true",
        help="List all available presets"
    )
    
    group.add_argument(
        "--verify-token",
        metavar="TOKEN",
        help="Verify and decode an existing JWT token"
    )
    
    # Custom token parameters
    parser.add_argument("--user-id", help="User ID for custom token")
    parser.add_argument("--email", help="Email for custom token")
    parser.add_argument("--org-id", help="Organization ID for custom token")
    parser.add_argument("--roles", nargs="+", default=[], help="Roles for custom token")
    parser.add_argument("--plan", help="Plan for custom token")
    parser.add_argument("--features", nargs="+", default=[], help="Features for custom token")
    parser.add_argument("--ttl", type=int, default=60, help="Token TTL in minutes (default: 60)")
    
    args = parser.parse_args()
    
    try:
        if args.list_presets:
            print_available_presets()
        
        elif args.verify_token:
            claims = verify_token(args.verify_token)
            print("✅ Token is valid!")
            print_token_info(args.verify_token, claims)
        
        elif args.preset:
            token = generate_token_from_preset(args.preset)
            claims = verify_token(token)
            print(f"✅ Generated token for preset: {args.preset}")
            print_token_info(token, claims)
        
        elif args.custom:
            if not args.user_id:
                parser.error("--user-id is required for custom tokens")
            
            token = generate_custom_token(
                user_id=args.user_id,
                email=args.email,
                org_id=args.org_id,
                roles=args.roles,
                plan=args.plan,
                features=args.features,
                ttl_minutes=args.ttl,
            )
            claims = verify_token(token)
            print("✅ Generated custom token")
            print_token_info(token, claims)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()