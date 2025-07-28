# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP Guidelines

- **Always** use sequentialthinking for planning.
- **Always** use serena for semantic codebase searching.
- **Always** use context7 to get latest documentations.
- **Always** use magic for UI enhancements.

## Additional Information

When asked to design UI & frontend interface, include `.superdesign/CLAUDE.md`.

## Project Overview

**Chasing Chapters** is a personal book review platform built as a unified Next.js + Payload CMS application. The app combines a public-facing website for displaying book reviews with an admin panel (via Payload CMS) for content management. It uses PostgreSQL for data storage and is configured for Cloudflare R2 media storage.

## Development Commands

### Essential Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build production app
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Testing

- `pnpm test` - Run all tests (integration + e2e)
- `pnpm test:int` - Run integration tests with Vitest
- `pnpm test:e2e` - Run end-to-end tests with Playwright

### Payload CMS Commands

- `pnpm payload` - Run Payload CLI commands
- `pnpm generate:types` - Generate TypeScript types from Payload config
- `pnpm generate:importmap` - Generate import map for admin panel

### Development Issues

- `pnpm devsafe` - Clean rebuild (removes .next and starts fresh)
- All commands use `NODE_OPTIONS=--no-deprecation` to suppress warnings

### Docker Development Commands

- `pnpm docker:up` - Start PostgreSQL database container
- `pnpm docker:down` - Stop database container
- `pnpm docker:logs` - View database logs
- `pnpm docker:reset` - Reset database with fresh data

### Additional Development Commands

- `pnpm test:int:watch` - Run integration tests in watch mode (use `vitest --config ./vitest.config.mts`)
- `pnpm test:e2e:headed` - Run e2e tests with browser UI (use `playwright test --headed`)
- `pnpm test:e2e:debug` - Debug e2e tests (use `playwright test --debug`)

## Architecture

### Dual App Structure

The project uses Next.js App Router with two distinct route groups:

1. **Frontend App**: `src/app/(frontend)/`
   - Public website for book reviews
   - Homepage, review pages, tag filtering
   - Uses custom CSS in `styles.css`

2. **Payload Admin**: `src/app/(payload)/`
   - CMS admin panel at `/admin`
   - Auto-generated layout and routes
   - Custom styling in `custom.scss`
   - API routes for GraphQL and REST endpoints

### Key Configuration Files

- `src/payload.config.ts` - Main Payload CMS configuration
- `next.config.mjs` - Next.js config with Payload integration via `withPayload`
- Both apps share the same Next.js instance but have separate layouts

### Collections

- **Users**: Authentication-enabled collection for admin access
- **Media**: Upload collection for images with pre-configured sizes
- Located in `src/collections/` directory
- Additional collections will be added for Reviews and Tags as per PRD specifications

### Database & Storage

- Uses PostgreSQL via `@payloadcms/db-postgres` adapter
- Configured for Cloudflare R2 storage (via payload-cloud plugin)
- Connection via `DATABASE_URI` environment variable

### Future Features

According to `docs/PRD.md`, the app will include:

- Google Books API integration for book metadata
- Enhanced review fields (rating, tags, reading status)
- Tag-based filtering and search
- Instagram auto-posting integration (future phase)

## Testing Setup

### Integration Tests (Vitest)

- Config: `vitest.config.mts`
- Test files: `tests/int/**/*.int.spec.ts`
- Environment: jsdom with React Testing Library
- Setup: `vitest.setup.ts`

### E2E Tests (Playwright)

- Config: `playwright.config.ts`
- Test files: `tests/e2e/**/*.e2e.spec.ts`
- Runs against local dev server
- Chrome browser testing configured

## Docker Support

The project includes Docker configuration:

- `docker-compose.dev.yml` provides PostgreSQL database on port 7482
- Optional development setup for those preferring containerized DB
- Main app can run locally while DB runs in Docker
- Database: `chasing-chapters` with postgres/postgres credentials

## Important Notes

- Uses pnpm as package manager (required by engines config)
- Node.js 18.20.2+ or 20.9.0+ required
- TypeScript configuration supports path aliases
- Payload auto-generates admin UI - avoid modifying generated files
- Environment variables needed: `PAYLOAD_SECRET`, `DATABASE_URI`

## Code Patterns & Conventions

### File Organization

- Route groups: `(frontend)` for public website, `(payload)` for admin/API
- Collections in `src/collections/` - follow existing Users.ts and Media.ts patterns
- Test files: `tests/int/**/*.int.spec.ts` for integration, `tests/e2e/**/*.e2e.spec.ts` for e2e
- Generated types: `src/payload-types.ts` (auto-generated, don't edit manually)

### Development Guidelines

- Always run `pnpm generate:types` after modifying Payload collections
- Use absolute imports where configured in TypeScript paths
- Follow existing styling patterns: custom CSS for frontend, SCSS for admin
- Payload admin customizations go in `src/app/(payload)/custom.scss`

### API Integration Notes

- Google Books API integration planned for book metadata
- GraphQL endpoint available at `/api/graphql` with playground at `/api/graphql-playground`
- REST endpoints follow Payload's auto-generated patterns at `/api/[...slug]`
- Admin panel accessible at `/admin`

### Environment Setup

- Required environment variables: `PAYLOAD_SECRET`, `DATABASE_URI`
- PostgreSQL connection string format: `postgresql://user:password@host:port/database`
- For local Docker: `postgresql://postgres:postgres@localhost:7482/chasing-chapters`

---

## AI Development Team Configuration
*Configured by team-configurator on 2025-07-28*

### Detected Technology Stack
- **Frontend**: Next.js 15.3.2 + React 19 + TypeScript
- **Backend**: Payload CMS 3.49.0 + PostgreSQL
- **Styling**: Custom CSS + SCSS
- **Testing**: Vitest (integration) + Playwright (E2E)
- **Storage**: Cloudflare R2 + S3 adapter

### Specialist Team Assignments

#### **Frontend Development** → @react-nextjs-expert
- Next.js App Router and dual-route architecture ((frontend) + (payload))
- React 19 components and modern patterns
- TypeScript integration and type safety
- Client-side routing and state management
- **MCP Integration**: Context7 (Next.js docs), Magic (UI components)

#### **API & CMS Development** → @api-architect  
- Payload CMS collections and relationships (Reviews ↔ Tags ↔ Media ↔ Users)
- REST and GraphQL API endpoints
- Database schema design and optimization
- Google Books API integration planning
- **MCP Integration**: Context7 (Payload docs), Sequential (complex data modeling)

#### **UI/UX Design** → @tailwind-css-expert
- Responsive design and component systems
- Custom CSS for frontend, SCSS for admin panel
- Accessibility and mobile-first design
- Design consistency across dual apps
- **MCP Integration**: Magic (UI components), Context7 (design patterns)

#### **Performance & SEO** → @performance-optimizer
- Bundle optimization and code splitting
- Database query optimization
- SEO metadata and Open Graph integration
- Core Web Vitals and loading performance
- **MCP Integration**: Playwright (performance metrics), Sequential (analysis)

#### **Quality Assurance** → @code-reviewer
- Code quality and pattern consistency
- Testing strategy (integration + E2E)
- Security and best practices validation
- Pull request reviews and compliance
- **MCP Integration**: Playwright (testing), Sequential (quality analysis)

### Task Routing Guide

**For Frontend Work:**
- "Build review display component" → @react-nextjs-expert
- "Create responsive layout" → @tailwind-css-expert
- "Add interactive filtering" → @react-nextjs-expert + @tailwind-css-expert

**For Backend/CMS Work:**
- "Implement Reviews collection" → @api-architect
- "Add Google Books API integration" → @api-architect
- "Optimize database queries" → @api-architect + @performance-optimizer

**For Testing:**
- "Write E2E tests" → @code-reviewer
- "Test performance" → @performance-optimizer
- "Review code quality" → @code-reviewer

**For Analysis:**
- "Analyze system architecture" → @api-architect
- "Debug performance issues" → @performance-optimizer
- "Review implementation patterns" → @code-reviewer

### Team Coordination Commands

Use these optimized commands for best results:

```bash
# Frontend development with UI components
/build --frontend → @react-nextjs-expert + Magic

# Backend/CMS implementation with documentation
/implement --api → @api-architect + Context7

# Performance optimization with metrics
/improve --perf → @performance-optimizer + Playwright

# Quality review with comprehensive analysis
/analyze --quality → @code-reviewer + Sequential

# UI enhancement with design systems
/design --component → @tailwind-css-expert + Magic
```

### Integration Notes

- **Collections Priority**: Reviews (primary) → Tags (organization) → Media (assets) → Users (admin)
- **Testing Strategy**: Integration tests for collections, E2E tests for user workflows
- **Performance Targets**: <3s load time, 80%+ test coverage, WCAG AA compliance
- **Future Integrations**: Google Books API, Instagram posting, advanced search

Your specialized AI development team is ready to build chasing-chapters efficiently!

---
