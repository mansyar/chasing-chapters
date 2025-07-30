# Testing Guide - Chasing Chapters

This document provides comprehensive testing procedures and guidelines for the Chasing Chapters application.

## Overview

Our testing strategy includes multiple layers of testing to ensure quality, performance, and reliability:

- **Integration Tests** - Vitest with React Testing Library (150+ tests)
- **End-to-End Tests** - Playwright across multiple browsers (21+ tests)
- **Performance Tests** - Lighthouse automation with Core Web Vitals
- **Security Tests** - Vulnerability scanning and dependency auditing
- **Load Tests** - Artillery.js for production readiness
- **Accessibility Tests** - Axe-core integration for WCAG compliance

## Test Structure

```
tests/
├── int/                    # Integration tests (Vitest)
│   ├── api.int.spec.ts
│   ├── collections.int.spec.ts
│   ├── google-books*.int.spec.ts
│   ├── search-functionality.int.spec.ts
│   └── components/*.int.spec.tsx
├── e2e/                    # End-to-end tests (Playwright)
│   ├── frontend.e2e.spec.ts
│   ├── search.e2e.spec.ts
│   ├── image-optimization.e2e.spec.ts
│   └── accessibility.e2e.spec.ts
├── performance/            # Performance tests
│   └── lighthouse.perf.spec.ts
└── load/                   # Load testing configuration
    ├── artillery.yml
    └── load-test-processor.js
```

## Running Tests

### Quick Test Commands

```bash
# Run all tests (integration + e2e)
pnpm test

# Run with coverage report
pnpm test:coverage

# Integration tests only
pnpm test:int

# Integration tests with coverage
pnpm test:int:coverage

# Integration tests in watch mode
pnpm test:int:watch

# E2E tests (all browsers)
pnpm test:e2e

# E2E tests with browser UI
pnpm test:e2e:headed

# E2E tests in debug mode
pnpm test:e2e:debug
```

### Browser-Specific Testing

```bash
# Test specific browsers
pnpm test:e2e:chrome
pnpm test:e2e:firefox
pnpm test:e2e:safari

# Mobile device testing
pnpm test:e2e:mobile

# Accessibility testing
pnpm test:e2e:accessibility
```

### Performance Testing

```bash
# Lighthouse performance tests
pnpm test:performance

# Bundle analysis
pnpm analyze

# Full performance suite
pnpm perf:test
```

### Security Testing

```bash
# Security vulnerability scan
pnpm test:security

# Dependency audit only
pnpm audit --audit-level moderate

# Retire.js scan only
pnpm security:scan
```

### Load Testing

```bash
# Full load test suite
pnpm test:load

# Quick load test (50 users, 10 concurrent)
pnpm test:load:quick

# Generate load test report
pnpm test:load:report
```

## Test Coverage Requirements

### Coverage Thresholds

- **Global**: 80% coverage (branches, functions, lines, statements)
- **Critical Components**: 85-90% coverage
  - BookSearch components: 90%
  - TagManager component: 85%
  - Library utilities: 85%

### Excluded from Coverage

- Generated files (`payload-types.ts`)
- Configuration files
- Next.js layouts and pages (tested via E2E)
- External dependencies

### Viewing Coverage Reports

```bash
# Generate coverage report
pnpm test:int:coverage

# Open HTML coverage report
open coverage/index.html
```

## Performance Standards

### Core Web Vitals Thresholds

- **Largest Contentful Paint (LCP)**: < 2.5s desktop, < 4s mobile
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s
- **Total Blocking Time (TBT)**: < 300ms

### Lighthouse Scores

- **Performance**: ≥80% desktop, ≥70% mobile
- **Accessibility**: ≥90%
- **SEO**: ≥90% homepage, ≥85% other pages
- **Best Practices**: ≥90%

### Bundle Size Limits

- **Main Bundle**: < 500KB
- **Total Bundle**: < 2MB
- **Individual Components**: < 50KB each

## Browser Support Matrix

### Desktop Browsers

- **Chrome**: Latest 2 versions ✅
- **Firefox**: Latest 2 versions ✅
- **Safari**: Latest 2 versions ✅
- **Edge**: Latest version ✅

### Mobile Devices

- **Android Chrome**: Pixel 5 emulation ✅
- **iOS Safari**: iPhone 12 emulation ✅
- **Tablet**: iPad Pro emulation ✅

## Accessibility Standards

### WCAG 2.1 AA Compliance

- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Reader**: Proper ARIA labels and semantic markup
- **Image Alt Text**: Descriptive alt text for all images
- **Form Labels**: Proper labeling for all form elements

### Accessibility Testing

```bash
# Run accessibility tests
pnpm test:e2e:accessibility

# Manual accessibility check with axe DevTools extension
# Install: https://www.deque.com/axe/devtools/
```

## Load Testing Scenarios

### Test Phases

1. **Warm Up**: 5 users/sec for 60s
2. **Ramp Up**: 5-20 users/sec over 120s
3. **Sustained Load**: 20 users/sec for 300s
4. **Peak Load**: 50 users/sec for 60s

### Test Scenarios (Weighted)

- **Homepage**: 40% of traffic
- **Search**: 30% of traffic
- **Review Pages**: 20% of traffic
- **API Endpoints**: 10% of traffic

### Performance Expectations

- **Response Time**: < 2s for 95% of requests
- **Error Rate**: < 1% of requests
- **Throughput**: Handle 50 concurrent users
- **Resource Usage**: Monitor CPU and memory

## Security Testing

### Dependency Scanning

- **npm audit**: Check for known vulnerabilities
- **retire.js**: Identify outdated/insecure dependencies
- **Snyk**: Advanced vulnerability scanning (optional)

### Security Checklist

- [ ] No credentials in code/config
- [ ] Secure HTTP headers configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload restrictions

## CI/CD Integration

### GitHub Actions (Recommended)

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:coverage
      - run: pnpm test:e2e:chrome
      - run: pnpm test:security
```

### Pre-commit Hooks

```bash
# Install husky for git hooks
pnpm add -D husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "pnpm test:int && pnpm lint"
```

## Debugging Tests

### Integration Test Debugging

```bash
# Debug specific test file
pnpm test:int:watch tests/int/api.int.spec.ts

# Run with debugging output
DEBUG=* pnpm test:int
```

### E2E Test Debugging

```bash
# Run in headed mode
pnpm test:e2e:headed

# Debug mode with pause
pnpm test:e2e:debug

# Generate test artifacts
PWDEBUG=1 pnpm test:e2e
```

### Performance Test Debugging

```bash
# Generate detailed Lighthouse report
pnpm lighthouse --view

# Analyze bundle composition
pnpm analyze

# Check Web Vitals in DevTools
# Use Lighthouse tab in Chrome DevTools
```

## Test Data Management

### Test Database

- Uses separate test database connection
- Automatic cleanup between tests
- Seed data for consistent testing

### Mock Data

```javascript
// Example mock data structure
const mockReview = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  rating: 5,
  excerpt: 'Test excerpt...',
  tags: [{ id: '1', name: 'Fiction', color: '#3B82F6' }]
}
```

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Independent Tests**: Each test should be isolated
4. **Realistic Data**: Use realistic test data
5. **Error Cases**: Test both success and failure scenarios

### Test Maintenance

1. **Regular Updates**: Keep tests updated with code changes
2. **Flaky Test Fixes**: Address intermittent test failures immediately
3. **Performance Monitoring**: Track test execution times
4. **Coverage Goals**: Maintain coverage above thresholds
5. **Documentation**: Keep this guide updated

## Troubleshooting

### Common Issues

**Test Timeouts**
```bash
# Increase timeout in vitest.config.mts
test: {
  testTimeout: 30000 // 30 seconds
}
```

**Database Connection Issues**
```bash
# Check environment variables
echo $DATABASE_URI

# Restart Docker database
pnpm docker:reset
```

**Browser Launch Failures**
```bash
# Install browser binaries
npx playwright install

# Install system dependencies
npx playwright install-deps
```

**Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=8000" pnpm test
```

### Getting Help

- Check test logs for detailed error messages
- Use browser DevTools for E2E debugging  
- Review GitHub Actions logs for CI failures
- Consult Playwright/Vitest documentation
- Check project issues on GitHub

## Metrics and Reporting

### Test Metrics Tracked

- **Test Coverage**: Percentage by type and threshold compliance
- **Test Duration**: Execution time trends
- **Failure Rate**: Test stability metrics
- **Performance**: Core Web Vitals trends
- **Security**: Vulnerability counts and severity

### Reports Generated

- **Coverage Report**: HTML report in `coverage/` directory
- **E2E Report**: Playwright HTML report
- **Performance Report**: Lighthouse JSON/HTML reports
- **Security Report**: JSON vulnerability report
- **Load Test Report**: Artillery HTML report

---

*Last Updated: January 30, 2025*  
*Next Review: February 15, 2025*