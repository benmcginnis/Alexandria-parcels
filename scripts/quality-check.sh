#!/bin/bash

# Quality Check Script for Alexandria Parcels Project
# This script runs tests, linting, and type checks before commits

set -e  # Exit on any error

echo "🔍 Running Quality Checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Type Check
echo "📝 Running TypeScript type check..."
if npx tsc --noEmit; then
    print_status "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
    exit 1
fi

# 2. Linting
echo "🧹 Running ESLint..."
if npx eslint src/ --ext .ts,.tsx; then
    print_status "ESLint passed"
else
    print_error "ESLint failed"
    exit 1
fi

# 3. Prettier check
echo "🎨 Checking code formatting..."
if npx prettier --check src/; then
    print_status "Code formatting is correct"
else
    print_warning "Code formatting issues found. Run 'npm run format' to fix"
    exit 1
fi

# 4. Tests
echo "🧪 Running tests..."
if npm test -- --passWithNoTests; then
    print_status "All tests passed"
else
    print_error "Tests failed"
    exit 1
fi

# 5. Build check
echo "🏗️  Checking build..."
if npm run build:vite; then
    print_status "Build successful"
else
    print_error "Build failed"
    exit 1
fi

echo ""
print_status "All quality checks passed! 🎉"
echo "Ready to commit."
