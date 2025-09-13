# AI Coding Agent Instructions for ig-auto-test

This document guides AI agents on the key patterns and workflows for the Instagram automation service codebase.

## Project Overview
- A Fastify-based service for automating Instagram Business/Creator account interactions
- Uses Prisma with PostgreSQL for data persistence
- Implements token-based authentication flow with Instagram's Graph API
- Supports rule-based automation for Instagram media interactions

## Core Architecture

### Key Components
1. **Auth Flow** (`src/controllers/auth.controller.ts`, `src/services/auth.services.ts`)
   - Handles Instagram OAuth token management
   - Converts short-lived tokens to long-lived (60-day) tokens
   - Token models defined in `src/types/igauth.ts`

2. **Data Layer** (`prisma/schema.prisma`)
   - `IgUser`: Stores authenticated Instagram business accounts
   - `AutomationRule`: Defines automation rules per media post/reel
   - `Template`: Stores response templates for automated interactions

3. **API Server** (`src/index.ts`)
   - Fastify-based HTTP server
   - Environment configuration via `src/config/env.ts`
   - Database connection via `src/lib/db.ts`

## Development Workflows

### Setup & Installation
```bash
# Install dependencies
bun install

# Generate Prisma client
bun run generate

# Push database schema
bun run push

# Start development server
bun run dev
```

### Database Management
- Uses Prisma ORM with PostgreSQL
- Schema changes require running `bun run push` to update the database
- Prisma client must be regenerated with `bun run generate` after schema changes

## Project Conventions

### Type Safety
- Strict TypeScript throughout the codebase
- Instagram API responses typed in `src/types/igauth.ts`
- Zod for runtime type validation (particularly for configs and API responses)

### Token Management
- Tokens are stored encrypted in the database
- Token refresh workflow is automated with expiry tracking
- Instagram permissions are stored as JSON in the database

### Error Handling
- Instagram API errors are typed via `IgAuthError` interface
- Services should propagate typed errors up to controllers
- HTTP responses follow standard error response structure

## Integration Points
1. **Instagram Graph API**
   - Primary external dependency
   - Requires business/creator account access
   - Token scopes defined in permissions field

2. **PostgreSQL**
   - Required for production deployment
   - Connection string via `DATABASE_URL` environment variable

## Critical Files
- `src/index.ts`: Main application entry point
- `prisma/schema.prisma`: Database schema definition
- `src/types/igauth.ts`: Core type definitions for Instagram integration
- `src/config/env.ts`: Environment configuration
- `src/services/auth.services.ts`: Instagram authentication logic