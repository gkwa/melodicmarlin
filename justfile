# List all available commands
default:
    @just --list

# Setup project dependencies and build
setup:
    pnpm install
    just build

# Build the extension for production
build:
    pnpm run build

# Build and watch for changes during development
dev:
    pnpm run dev

# Run tests
test:
    pnpm run test

# Clean build artifacts
teardown:
    pnpm run clean
