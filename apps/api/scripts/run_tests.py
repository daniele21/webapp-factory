#!/usr/bin/env python3
"""
Test runner script for the Webapp Factory API authentication system.

This script provides convenient commands for running different types of tests
and generating reports.
"""

import sys
import subprocess
import argparse
import os
from pathlib import Path


def run_command(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result."""
    print(f"Running: {' '.join(cmd)}")
    return subprocess.run(cmd, check=check)


def run_all_tests(verbose: bool = False, coverage: bool = True) -> None:
    """Run all tests."""
    cmd = ["pytest"]
    
    if verbose:
        cmd.append("-v")
    
    if coverage:
        cmd.extend([
            "--cov=auth",
            "--cov=routes", 
            "--cov=services",
            "--cov-report=term-missing",
            "--cov-report=html:htmlcov",
        ])
    
    run_command(cmd)


def run_unit_tests(verbose: bool = False) -> None:
    """Run only unit tests."""
    cmd = ["pytest", "-m", "unit"]
    
    if verbose:
        cmd.append("-v")
    
    run_command(cmd)


def run_integration_tests(verbose: bool = False) -> None:
    """Run only integration tests."""
    cmd = ["pytest", "-m", "integration"]
    
    if verbose:
        cmd.append("-v")
    
    run_command(cmd)


def run_auth_tests(verbose: bool = False) -> None:
    """Run only authentication-related tests."""
    cmd = ["pytest", "tests/auth/"]
    
    if verbose:
        cmd.append("-v")
    
    run_command(cmd)


def run_fast_tests(verbose: bool = False) -> None:
    """Run fast tests (exclude slow tests)."""
    cmd = ["pytest", "-m", "not slow"]
    
    if verbose:
        cmd.append("-v")
    
    run_command(cmd)


def run_parallel_tests(workers: int = None, verbose: bool = False) -> None:
    """Run tests in parallel."""
    cmd = ["pytest"]
    
    if workers:
        cmd.extend(["-n", str(workers)])
    else:
        cmd.extend(["-n", "auto"])
    
    if verbose:
        cmd.append("-v")
    
    run_command(cmd)


def generate_coverage_report(format_type: str = "html") -> None:
    """Generate coverage report."""
    cmd = ["pytest", "--cov=auth", "--cov=routes", "--cov=services"]
    
    if format_type == "html":
        cmd.append("--cov-report=html:htmlcov")
        print("\nCoverage report generated in: htmlcov/index.html")
    elif format_type == "xml":
        cmd.append("--cov-report=xml:coverage.xml")
        print("\nCoverage report generated: coverage.xml")
    elif format_type == "term":
        cmd.append("--cov-report=term-missing")
    else:
        raise ValueError(f"Unknown format type: {format_type}")
    
    run_command(cmd)


def lint_code() -> None:
    """Run linting tools."""
    print("Running black...")
    run_command(["black", ".", "--check"])
    
    print("Running isort...")
    run_command(["isort", ".", "--check-only"])
    
    print("Running flake8...")
    run_command(["flake8", "auth", "routes", "services"])


def format_code() -> None:
    """Format code with black and isort.""" 
    print("Formatting with black...")
    run_command(["black", "."])
    
    print("Sorting imports with isort...")
    run_command(["isort", "."])


def type_check() -> None:
    """Run type checking with mypy."""
    print("Running mypy...")
    run_command(["mypy", "auth", "routes", "services"])


def run_specific_test(test_path: str, verbose: bool = False) -> None:
    """Run a specific test file or test function."""
    cmd = ["pytest", test_path]
    
    if verbose:
        cmd.append("-v")
    
    run_command(cmd)


def install_dependencies() -> None:
    """Install test and dev dependencies."""
    print("Installing test dependencies...")
    run_command(["pip", "install", "-e", ".[test]"])
    
    print("Installing dev dependencies...")
    run_command(["pip", "install", "-e", ".[dev]"])


def clean_cache() -> None:
    """Clean pytest and Python cache."""
    print("Cleaning pytest cache...")
    run_command(["pytest", "--cache-clear"], check=False)
    
    print("Cleaning Python cache...")
    for root, dirs, files in os.walk("."):
        # Remove __pycache__ directories
        if "__pycache__" in dirs:
            pycache_path = os.path.join(root, "__pycache__")
            print(f"Removing {pycache_path}")
            run_command(["rm", "-rf", pycache_path], check=False)
        
        # Remove .pyc files
        for file in files:
            if file.endswith(".pyc"):
                pyc_path = os.path.join(root, file)
                print(f"Removing {pyc_path}")
                os.remove(pyc_path)


def main():
    parser = argparse.ArgumentParser(
        description="Test runner for Webapp Factory API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --all                    # Run all tests
  %(prog)s --unit                   # Run unit tests only
  %(prog)s --integration            # Run integration tests only
  %(prog)s --auth                   # Run auth tests only
  %(prog)s --fast                   # Run fast tests (skip slow)
  %(prog)s --parallel               # Run tests in parallel
  %(prog)s --coverage html          # Generate HTML coverage report
  %(prog)s --specific tests/auth/test_jwt.py  # Run specific test file
  %(prog)s --lint                   # Run linting
  %(prog)s --format                 # Format code
  %(prog)s --install                # Install dependencies
        """
    )
    
    # Test execution options
    test_group = parser.add_argument_group("Test Execution")
    test_group.add_argument("--all", action="store_true", help="Run all tests")
    test_group.add_argument("--unit", action="store_true", help="Run unit tests only")
    test_group.add_argument("--integration", action="store_true", help="Run integration tests only")
    test_group.add_argument("--auth", action="store_true", help="Run auth tests only")
    test_group.add_argument("--fast", action="store_true", help="Run fast tests (skip slow)")
    test_group.add_argument("--parallel", action="store_true", help="Run tests in parallel")
    test_group.add_argument("--specific", metavar="PATH", help="Run specific test file or function")
    
    # Report generation
    report_group = parser.add_argument_group("Reports")
    report_group.add_argument("--coverage", choices=["html", "xml", "term"], help="Generate coverage report")
    
    # Code quality
    quality_group = parser.add_argument_group("Code Quality")
    quality_group.add_argument("--lint", action="store_true", help="Run linting tools")
    quality_group.add_argument("--format", action="store_true", help="Format code")
    quality_group.add_argument("--type-check", action="store_true", help="Run type checking")
    
    # Utilities
    util_group = parser.add_argument_group("Utilities")
    util_group.add_argument("--install", action="store_true", help="Install test and dev dependencies")
    util_group.add_argument("--clean", action="store_true", help="Clean cache files")
    
    # Options
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument("-w", "--workers", type=int, help="Number of parallel workers")
    
    args = parser.parse_args()
    
    # Ensure we're in the right directory
    if not Path("pyproject.toml").exists():
        print("Error: Must be run from the API root directory (where pyproject.toml is located)")
        sys.exit(1)
    
    try:
        if args.install:
            install_dependencies()
        elif args.clean:
            clean_cache()
        elif args.lint:
            lint_code()
        elif args.format:
            format_code()
        elif args.type_check:
            type_check()
        elif args.coverage:
            generate_coverage_report(args.coverage)
        elif args.specific:
            run_specific_test(args.specific, args.verbose)
        elif args.unit:
            run_unit_tests(args.verbose)
        elif args.integration:
            run_integration_tests(args.verbose)
        elif args.auth:
            run_auth_tests(args.verbose)
        elif args.fast:
            run_fast_tests(args.verbose)
        elif args.parallel:
            run_parallel_tests(args.workers, args.verbose)
        elif args.all:
            run_all_tests(args.verbose, coverage=True)
        else:
            # Default: run all tests
            run_all_tests(args.verbose, coverage=True)
    
    except subprocess.CalledProcessError as e:
        print(f"\nCommand failed with exit code {e.returncode}")
        sys.exit(e.returncode)
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()