"""
Logging and monitoring configuration for the Webapp Factory API.

This module provides comprehensive configuration for:
- Structured logging
- Request tracing
- Performance monitoring
- Error tracking
- Metrics collection
"""

from typing import Dict, List, Optional, Any, Union
from enum import Enum
from pydantic import Field, validator
from .base import BaseConfig, Environment


class LogLevel(str, Enum):
    """Logging levels."""
    CRITICAL = "CRITICAL"
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"
    DEBUG = "DEBUG"


class LogFormat(str, Enum):
    """Log output formats."""
    JSON = "json"
    TEXT = "text"
    STRUCTURED = "structured"


class LogHandler(BaseConfig):
    """Log handler configuration."""
    
    name: str = Field(description="Handler name")
    type: str = Field(description="Handler type (console, file, syslog, etc.)")
    level: LogLevel = Field(default=LogLevel.INFO, description="Log level")
    format: LogFormat = Field(default=LogFormat.JSON, description="Log format")
    
    # File handler settings
    filename: Optional[str] = Field(default=None, description="Log file path")
    max_bytes: int = Field(default=10485760, description="Max file size in bytes (10MB)")
    backup_count: int = Field(default=5, description="Number of backup files")
    
    # Network handler settings
    host: Optional[str] = Field(default=None, description="Remote log host")
    port: Optional[int] = Field(default=None, description="Remote log port")
    
    # Custom fields
    extra_fields: Dict[str, Union[str, int, bool]] = Field(
        default_factory=dict,
        description="Extra fields to include in logs"
    )


class MetricsConfig(BaseConfig):
    """Metrics collection configuration."""
    
    enabled: bool = Field(default=True, description="Enable metrics collection")
    
    # Prometheus settings
    prometheus_enabled: bool = Field(default=True, description="Enable Prometheus metrics")
    prometheus_port: int = Field(default=8090, description="Prometheus metrics port")
    prometheus_path: str = Field(default="/metrics", description="Prometheus metrics path")
    
    # Custom metrics
    custom_metrics: Dict[str, str] = Field(
        default_factory=dict,
        description="Custom metrics to collect"
    )
    
    # Collection intervals
    collection_interval: int = Field(
        default=60,
        description="Metrics collection interval in seconds",
        ge=1
    )
    
    # Retention
    retention_days: int = Field(
        default=30,
        description="Metrics retention period in days",
        ge=1
    )


class TracingConfig(BaseConfig):
    """Request tracing configuration."""
    
    enabled: bool = Field(default=True, description="Enable request tracing")
    
    # Sampling
    sample_rate: float = Field(
        default=1.0,
        description="Trace sampling rate (0.0 to 1.0)",
        ge=0.0,
        le=1.0
    )
    
    # Headers
    trace_header: str = Field(
        default="X-Trace-Id",
        description="HTTP header for trace ID"
    )
    
    span_header: str = Field(
        default="X-Span-Id", 
        description="HTTP header for span ID"
    )
    
    # Performance thresholds
    slow_request_threshold_ms: int = Field(
        default=1000,
        description="Threshold for slow request logging (ms)",
        ge=1
    )
    
    # Database query tracing
    trace_db_queries: bool = Field(
        default=True,
        description="Trace database queries"
    )
    
    slow_query_threshold_ms: int = Field(
        default=500,
        description="Threshold for slow query logging (ms)",
        ge=1
    )
    
    # External service tracing
    trace_external_calls: bool = Field(
        default=True,
        description="Trace external HTTP calls"
    )


class ErrorTrackingConfig(BaseConfig):
    """Error tracking configuration."""
    
    enabled: bool = Field(default=True, description="Enable error tracking")
    
    # Sentry configuration
    sentry_enabled: bool = Field(default=False, description="Enable Sentry error tracking")
    sentry_dsn: Optional[str] = Field(default=None, description="Sentry DSN")
    sentry_environment: Optional[str] = Field(default=None, description="Sentry environment")
    sentry_release: Optional[str] = Field(default=None, description="Sentry release version")
    
    # Error handling
    capture_unhandled_exceptions: bool = Field(
        default=True,
        description="Capture unhandled exceptions"
    )
    
    capture_http_errors: bool = Field(
        default=True,
        description="Capture HTTP 4xx/5xx errors"
    )
    
    # Sampling
    error_sample_rate: float = Field(
        default=1.0,
        description="Error sampling rate (0.0 to 1.0)",
        ge=0.0,
        le=1.0
    )
    
    # PII handling
    scrub_sensitive_data: bool = Field(
        default=True,
        description="Scrub sensitive data from error reports"
    )
    
    sensitive_fields: List[str] = Field(
        default_factory=lambda: ["password", "secret", "token", "api_key", "authorization"],
        description="Fields to scrub from error reports"
    )


class PerformanceConfig(BaseConfig):
    """Performance monitoring configuration."""
    
    enabled: bool = Field(default=True, description="Enable performance monitoring")
    
    # Request monitoring
    monitor_requests: bool = Field(default=True, description="Monitor HTTP requests")
    monitor_database: bool = Field(default=True, description="Monitor database operations")
    monitor_cache: bool = Field(default=True, description="Monitor cache operations")
    monitor_external_calls: bool = Field(default=True, description="Monitor external API calls")
    
    # Thresholds
    request_timeout_warning_ms: int = Field(
        default=5000,
        description="Request timeout warning threshold (ms)"
    )
    
    memory_usage_warning_mb: int = Field(
        default=500,
        description="Memory usage warning threshold (MB)"
    )
    
    cpu_usage_warning_percent: int = Field(
        default=80,
        description="CPU usage warning threshold (%)"
    )
    
    # Collection
    collect_system_metrics: bool = Field(
        default=True,
        description="Collect system metrics (CPU, memory, disk)"
    )
    
    metrics_interval: int = Field(
        default=30,
        description="System metrics collection interval (seconds)"
    )


class LoggingConfig(BaseConfig):
    """Main logging and monitoring configuration."""
    
    environment: Environment = Field(
        default=Environment.DEVELOPMENT,
        description="Application environment"
    )
    
    # Root logger settings
    root_level: LogLevel = Field(default=LogLevel.INFO, description="Root log level")
    log_format: LogFormat = Field(default=LogFormat.JSON, description="Default log format")
    
    # Handlers
    handlers: List[LogHandler] = Field(
        default_factory=list,
        description="Log handlers"
    )
    
    # Component configurations
    metrics: MetricsConfig = Field(default_factory=MetricsConfig)
    tracing: TracingConfig = Field(default_factory=TracingConfig)
    error_tracking: ErrorTrackingConfig = Field(default_factory=ErrorTrackingConfig)
    performance: PerformanceConfig = Field(default_factory=PerformanceConfig)
    
    # Logger-specific levels
    logger_levels: Dict[str, LogLevel] = Field(
        default_factory=lambda: {
            "uvicorn": LogLevel.INFO,
            "fastapi": LogLevel.INFO,
            "httpx": LogLevel.WARNING,
            "redis": LogLevel.WARNING,
            "google.cloud": LogLevel.WARNING,
        },
        description="Logger-specific log levels"
    )
    
    # Request logging
    log_requests: bool = Field(default=True, description="Log HTTP requests")
    log_responses: bool = Field(default=False, description="Log HTTP responses")
    log_request_body: bool = Field(default=False, description="Log request bodies")
    log_response_body: bool = Field(default=False, description="Log response bodies")
    
    # Sensitive data handling
    mask_sensitive_data: bool = Field(default=True, description="Mask sensitive data in logs")
    sensitive_headers: List[str] = Field(
        default_factory=lambda: ["authorization", "cookie", "x-api-key"],
        description="HTTP headers to mask in logs"
    )
    
    # Security logging
    log_auth_events: bool = Field(default=True, description="Log authentication events")
    log_permission_denied: bool = Field(default=True, description="Log permission denied events")
    log_rate_limit_hits: bool = Field(default=True, description="Log rate limit violations")
    
    def add_handler(self, handler: LogHandler) -> None:
        """Add a log handler."""
        self.handlers.append(handler)
    
    def get_handler(self, name: str) -> Optional[LogHandler]:
        """Get a log handler by name."""
        for handler in self.handlers:
            if handler.name == name:
                return handler
        return None
    
    def remove_handler(self, name: str) -> bool:
        """Remove a log handler by name."""
        for i, handler in enumerate(self.handlers):
            if handler.name == name:
                del self.handlers[i]
                return True
        return False


# Default configurations
def create_default_handlers() -> List[LogHandler]:
    """Create default log handlers."""
    return [
        LogHandler(
            name="console",
            type="console",
            level=LogLevel.INFO,
            format=LogFormat.JSON
        )
    ]


def get_logging_config() -> LoggingConfig:
    """Get logging configuration from environment variables."""
    config = LoggingConfig()
    config.handlers = create_default_handlers()
    return config


def get_development_logging_config() -> LoggingConfig:
    """Get development logging configuration."""
    config = LoggingConfig(environment=Environment.DEVELOPMENT)
    
    # Development-friendly settings
    config.root_level = LogLevel.DEBUG
    config.log_format = LogFormat.TEXT
    config.log_request_body = True
    config.log_response_body = True
    
    # Console handler with text format
    config.handlers = [
        LogHandler(
            name="console",
            type="console", 
            level=LogLevel.DEBUG,
            format=LogFormat.TEXT
        )
    ]
    
    # Reduced external service tracing for dev
    config.tracing.sample_rate = 0.1
    config.metrics.collection_interval = 300  # 5 minutes
    
    return config


def get_testing_logging_config() -> LoggingConfig:
    """Get testing logging configuration."""
    config = LoggingConfig(environment=Environment.TESTING)
    
    # Minimal logging for tests
    config.root_level = LogLevel.WARNING
    config.log_requests = False
    config.log_responses = False
    
    # Disable most monitoring for tests
    config.metrics.enabled = False
    config.tracing.enabled = False
    config.error_tracking.enabled = False
    config.performance.enabled = False
    
    # Simple console handler
    config.handlers = [
        LogHandler(
            name="console",
            type="console",
            level=LogLevel.WARNING,
            format=LogFormat.TEXT
        )
    ]
    
    return config


def get_production_logging_config() -> LoggingConfig:
    """Get production logging configuration."""
    config = LoggingConfig(environment=Environment.PRODUCTION)
    
    # Production settings
    config.root_level = LogLevel.INFO
    config.log_format = LogFormat.JSON
    config.mask_sensitive_data = True
    
    # Production handlers
    config.handlers = [
        LogHandler(
            name="console",
            type="console",
            level=LogLevel.INFO,
            format=LogFormat.JSON
        ),
        LogHandler(
            name="file",
            type="file",
            level=LogLevel.INFO,
            format=LogFormat.JSON,
            filename="/var/log/webapp-factory/api.log",
            max_bytes=52428800,  # 50MB
            backup_count=10
        )
    ]
    
    # Enable all monitoring
    config.metrics.enabled = True
    config.tracing.enabled = True
    config.error_tracking.enabled = True
    config.performance.enabled = True
    
    # Production tracing settings
    config.tracing.sample_rate = 0.1  # 10% sampling
    config.error_tracking.error_sample_rate = 1.0  # Capture all errors
    
    return config


# Validation
def validate_logging_config(config: LoggingConfig) -> List[str]:
    """Validate logging configuration."""
    issues = []
    
    if not config.handlers:
        issues.append("At least one log handler must be configured")
    
    # Check file handlers
    for handler in config.handlers:
        if handler.type == "file" and not handler.filename:
            issues.append(f"File handler '{handler.name}' missing filename")
        
        if handler.type in ["syslog", "http"] and not handler.host:
            issues.append(f"Network handler '{handler.name}' missing host")
    
    # Production checks
    if config.environment == Environment.PRODUCTION:
        if config.root_level == LogLevel.DEBUG:
            issues.append("DEBUG level not recommended for production")
        
        if config.log_request_body or config.log_response_body:
            issues.append("Request/response body logging not recommended for production")
        
        if not config.mask_sensitive_data:
            issues.append("Sensitive data masking should be enabled in production")
        
        if config.tracing.sample_rate > 0.2:
            issues.append("Consider lower trace sampling rate in production")
    
    return issues