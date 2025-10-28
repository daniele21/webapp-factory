"""
Configuration management utility for the Webapp Factory API.

This utility provides commands for:
- Generating environment files
- Validating configurations
- Managing configuration across environments
"""

import argparse
import sys
import os
from pathlib import Path
from typing import List, Dict, Any

# Add the parent directory to the path so we can import from config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.environments import (
    write_development_env_file,
    write_testing_env_file,
    write_production_env_file,
    validate_production_config,
    get_development_config,
    get_testing_config,
    get_production_config,
)
from config.auth import validate_auth_config
from config.database import validate_database_config
from config.features import validate_feature_flags_config
from config.logging import validate_logging_config


def generate_env_file(environment: str, output_path: str = None) -> None:
    """Generate environment file for the specified environment."""
    if output_path is None:
        output_path = f".env.{environment}"
    
    print(f"Generating {environment} environment file: {output_path}")
    
    if environment == "development":
        write_development_env_file(output_path)
    elif environment == "testing":
        write_testing_env_file(output_path)
    elif environment == "production":
        write_production_env_file(output_path)
    else:
        print(f"Error: Unknown environment '{environment}'")
        sys.exit(1)
    
    print(f"✅ Environment file generated: {output_path}")
    
    if environment == "production":
        print("\n⚠️  SECURITY WARNING:")
        print("   - Change all default values in the production file")
        print("   - Keep the production environment file secure")
        print("   - Never commit secrets to version control")
        print("   - Use environment-specific secret management")


def validate_configuration(environment: str = None) -> None:
    """Validate configuration for the specified environment."""
    if environment is None:
        # Auto-detect environment
        environment = os.getenv("APP_ENV", "development")
    
    print(f"Validating {environment} configuration...")
    
    # Get configuration
    if environment == "development":
        config = get_development_config()
    elif environment == "testing":
        config = get_testing_config()
    elif environment == "production":
        config = get_production_config()
    else:
        print(f"Error: Unknown environment '{environment}'")
        sys.exit(1)
    
    issues = []
    
    # Validate each component
    if "auth" in config:
        auth_issues = validate_auth_config(config["auth"])
        issues.extend([f"Auth: {issue}" for issue in auth_issues])
    
    if "database" in config:
        db_issues = validate_database_config(config["database"])
        issues.extend([f"Database: {issue}" for issue in db_issues])
    
    if "features" in config:
        features_issues = validate_feature_flags_config(config["features"])
        issues.extend([f"Features: {issue}" for issue in features_issues])
    
    if "logging" in config:
        logging_issues = validate_logging_config(config["logging"])
        issues.extend([f"Logging: {issue}" for issue in logging_issues])
    
    # Environment-specific validation
    if environment == "production":
        prod_issues = validate_production_config(config)
        issues.extend([f"Production: {issue}" for issue in prod_issues])
    
    # Report results
    if issues:
        print(f"\n❌ Found {len(issues)} configuration issues:")
        for issue in issues:
            print(f"   • {issue}")
        
        if environment == "production":
            print("\n⚠️  Production deployment is not recommended with these issues.")
            sys.exit(1)
        else:
            print(f"\n⚠️  Please review the {environment} configuration.")
    else:
        print(f"✅ {environment.capitalize()} configuration is valid!")


def show_configuration(environment: str = None) -> None:
    """Display current configuration for the specified environment."""
    if environment is None:
        environment = os.getenv("APP_ENV", "development")
    
    print(f"Configuration for {environment} environment:")
    print("=" * 50)
    
    # Get configuration
    if environment == "development":
        config = get_development_config()
    elif environment == "testing":
        config = get_testing_config()
    elif environment == "production":
        config = get_production_config()
    else:
        print(f"Error: Unknown environment '{environment}'")
        sys.exit(1)
    
    # Display configuration sections
    _print_config_section("Environment", {
        "Environment": config.get("environment", "unknown"),
        "Debug": config.get("debug", False),
        "API Docs": config.get("api_docs_enabled", False),
        "Base URL": config.get("api_base_url", "unknown"),
        "Frontend URL": config.get("frontend_base_url", "unknown"),
    })
    
    # Auth configuration
    auth_config = config.get("auth")
    if auth_config:
        _print_config_section("Authentication", {
            "JWT Algorithm": auth_config.jwt.algorithm,
            "Access Token TTL": f"{auth_config.jwt.access_token_expire_minutes} minutes",
            "Refresh Token TTL": f"{auth_config.jwt.refresh_token_expire_days} days",
            "OAuth Providers": "Google" if auth_config.google_oauth else "None",
            "CORS Origins": len(auth_config.cors_origins),
            "Secure Cookies": auth_config.cookie_secure,
        })
    
    # Database configuration
    db_config = config.get("database")
    if db_config:
        _print_config_section("Database", {
            "Firestore Project": db_config.firestore.project_id,
            "Use Emulator": db_config.firestore.use_emulator,
            "Redis URL": db_config.redis.host + ":" + str(db_config.redis.port),
            "Redis Database": db_config.redis.database,
            "Connection Pooling": db_config.enable_connection_pooling,
        })
    
    # Features configuration
    features_config = config.get("features")
    if features_config:
        enabled_flags = sum(1 for flag in features_config.default_flags.values() if flag.enabled)
        _print_config_section("Feature Flags", {
            "Storage Backend": features_config.storage_backend,
            "Cache TTL": f"{features_config.cache_ttl_seconds} seconds",
            "Total Flags": len(features_config.default_flags),
            "Enabled Flags": enabled_flags,
            "Admin API": features_config.admin_api_enabled,
        })
    
    # Logging configuration
    logging_config = config.get("logging")
    if logging_config:
        _print_config_section("Logging", {
            "Root Level": logging_config.root_level,
            "Format": logging_config.log_format,
            "Handlers": len(logging_config.handlers),
            "Metrics Enabled": logging_config.metrics.enabled,
            "Tracing Enabled": logging_config.tracing.enabled,
            "Error Tracking": logging_config.error_tracking.enabled,
        })


def _print_config_section(title: str, config: Dict[str, Any]) -> None:
    """Print a configuration section."""
    print(f"\n{title}:")
    print("-" * len(title))
    for key, value in config.items():
        if isinstance(value, str) and len(value) > 50:
            value = value[:47] + "..."
        print(f"  {key:<20}: {value}")


def compare_configurations() -> None:
    """Compare configurations across environments."""
    print("Configuration Comparison")
    print("=" * 50)
    
    dev_config = get_development_config()
    test_config = get_testing_config()
    prod_config = get_production_config()
    
    # Compare key settings
    comparisons = [
        ("Debug Mode", "debug"),
        ("API Docs", "api_docs_enabled"),
        ("CORS Allow All", "cors_allow_all"),
        ("Profiling", "profiling_enabled"),
    ]
    
    print(f"{'Setting':<20} {'Development':<15} {'Testing':<15} {'Production':<15}")
    print("-" * 65)
    
    for name, key in comparisons:
        dev_val = dev_config.get(key, "N/A")
        test_val = test_config.get(key, "N/A")
        prod_val = prod_config.get(key, "N/A")
        
        print(f"{name:<20} {str(dev_val):<15} {str(test_val):<15} {str(prod_val):<15}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Configuration management for Webapp Factory API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s generate development
  %(prog)s generate production --output .env.prod
  %(prog)s validate production
  %(prog)s show development
  %(prog)s compare
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate environment file")
    gen_parser.add_argument("environment", choices=["development", "testing", "production"],
                          help="Environment to generate file for")
    gen_parser.add_argument("--output", "-o", help="Output file path")
    
    # Validate command
    val_parser = subparsers.add_parser("validate", help="Validate configuration")
    val_parser.add_argument("environment", nargs="?", 
                          choices=["development", "testing", "production"],
                          help="Environment to validate (auto-detected if not specified)")
    
    # Show command
    show_parser = subparsers.add_parser("show", help="Show configuration")
    show_parser.add_argument("environment", nargs="?",
                           choices=["development", "testing", "production"],
                           help="Environment to show (auto-detected if not specified)")
    
    # Compare command
    subparsers.add_parser("compare", help="Compare configurations across environments")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == "generate":
            generate_env_file(args.environment, args.output)
        elif args.command == "validate":
            validate_configuration(args.environment)
        elif args.command == "show":
            show_configuration(args.environment)
        elif args.command == "compare":
            compare_configurations()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()