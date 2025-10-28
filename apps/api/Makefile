# Makefile for Webapp Factory API Development
# 
# Usage:
#   make install     - Install dependencies
#   make test        - Run all tests
#   make test-unit   - Run unit tests only
#   make test-auth   - Run authentication tests only
#   make coverage    - Generate coverage report
#   make lint        - Run linting
#   make format      - Format code
#   make clean       - Clean cache files
#   make dev         - Start development server
#   make help        - Show this help

.PHONY: help install test test-unit test-integration test-auth test-fast test-parallel coverage lint format type-check clean dev

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Webapp Factory API - Development Commands"
	@echo "========================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Installation
install: ## Install dependencies
	@echo "Installing test and development dependencies..."
	pip install -e ".[test,dev]"

install-test: ## Install test dependencies only
	@echo "Installing test dependencies..."
	pip install -e ".[test]"

# Testing
test: ## Run all tests with coverage
	python scripts/run_tests.py --all --verbose

test-unit: ## Run unit tests only
	python scripts/run_tests.py --unit --verbose

test-integration: ## Run integration tests only
	python scripts/run_tests.py --integration --verbose

test-auth: ## Run authentication tests only
	python scripts/run_tests.py --auth --verbose

test-fast: ## Run fast tests (skip slow ones)
	python scripts/run_tests.py --fast --verbose

test-parallel: ## Run tests in parallel
	python scripts/run_tests.py --parallel --verbose

# Coverage
coverage: ## Generate HTML coverage report
	python scripts/run_tests.py --coverage html
	@echo "Coverage report: htmlcov/index.html"

coverage-xml: ## Generate XML coverage report
	python scripts/run_tests.py --coverage xml

coverage-term: ## Show coverage in terminal
	python scripts/run_tests.py --coverage term

# Code Quality
lint: ## Run linting tools
	python scripts/run_tests.py --lint

format: ## Format code with black and isort
	python scripts/run_tests.py --format

type-check: ## Run type checking with mypy
	python scripts/run_tests.py --type-check

# Utilities
clean: ## Clean cache files
	python scripts/run_tests.py --clean

dev: ## Start development server
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-debug: ## Start development server with debug logging
	uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

# Docker
docker-build: ## Build Docker image
	docker build -t webapp-factory-api .

docker-run: ## Run Docker container
	docker run -p 8000:8000 webapp-factory-api

# Database (if using migrations)
db-migrate: ## Run database migrations
	@echo "Database migration command here"

db-reset: ## Reset database
	@echo "Database reset command here"

# API Documentation
docs: ## Start API documentation server
	@echo "Starting API documentation..."
	@echo "Visit: http://localhost:8000/docs"
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

# CI/CD helpers
ci-test: ## Run tests for CI (no coverage report)
	pytest -v --tb=short

ci-lint: ## Run linting for CI
	black . --check --diff
	isort . --check-only --diff
	flake8 auth routes services

# Security
security-scan: ## Run security scan (if bandit is installed)
	@which bandit > /dev/null && bandit -r auth routes services || echo "Install bandit for security scanning: pip install bandit"

# Performance
benchmark: ## Run performance benchmarks (if pytest-benchmark is installed)
	@which pytest-benchmark > /dev/null && pytest tests/benchmarks/ || echo "Install pytest-benchmark for benchmarking: pip install pytest-benchmark"

# All checks (CI simulation)
check-all: lint type-check test ## Run all checks (lint, type-check, tests)

# Development setup
setup-dev: install ## Setup development environment
	@echo "Development environment setup complete!"
	@echo "Next steps:"
	@echo "  1. Copy .env.example to .env and configure"
	@echo "  2. Run 'make dev' to start the development server"
	@echo "  3. Run 'make test' to run tests"

# Quick commands
quick-test: ## Quick test run (fast tests only)
	pytest -x --tb=short tests/auth/

quick-format: ## Quick format (current directory only)
	black .
	isort .

# Environment info
env-info: ## Show environment information
	@echo "Python version: $$(python --version)"
	@echo "Pip packages:"
	@pip list | grep -E "(fastapi|pytest|pydantic|uvicorn)"
	@echo "Current directory: $$(pwd)"