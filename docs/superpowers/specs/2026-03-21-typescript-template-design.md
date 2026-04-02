# TypeScript Template Repository Design Document

**Date:** 2026-03-21
**Author:** Claude

## Overview

Create a cross-platform (Windows/Mac) TypeScript template repository optimized for Node.js tool development, with consideration for future web frontend (React) migration.

## Requirements

- Support both Windows and Mac platforms
- Optimized for Node.js tool development
- Future-proof for React migration
- Include CI/CD for test and build verification

## Project Structure

```
ts-template-base/
├── src/
│   ├── index.ts              # Entry point with signal handling
│   ├── config/
│   │   └── index.ts          # Environment variable validation
│   ├── lib/                  # Common logic (placeholder)
│   └── index.test.ts         # Sample Vitest test
├── .github/workflows/
│   └── ci.yml                # CI workflow (test + build)
├── .env.example              # Environment variable examples
├── .gitattributes            # Git line ending configuration
├── .gitignore                # Exclusions for Node, Windows, Mac
├── .npmrc                    # npm configuration (engine-strict)
├── package.json
├── tsconfig.json
├── tsup.config.ts            # Build configuration
├── eslint.config.js           # ESLint configuration (flat config)
├── .prettierrc               # Prettier configuration
├── vitest.config.ts          # Vitest configuration
├── package-lock.json         # Lock file (committed for consistency)
└── README.md                 # Setup and usage instructions
```

## Technology Stack

| Category | Tool | Version |
|----------|------|---------|
| Runtime | Node.js | >=20.0.0 |
| Package Manager | npm | - |
| Build Tool | tsup | latest (8.x) |
| Dev Runtime | tsx | latest (4.x) |
| TypeScript | typescript | latest (5.x) |
| Linting | eslint | latest (10.x, flat config) |
| Formatting | prettier | latest (3.x) |
| Testing | vitest | latest (4.x) |
| Validation | zod | latest (4.x) |
| Config | dotenv | latest (17.x) |

## package.json Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx watch src/index.ts` | Hot-reload development |
| `build` | `tsup src/index.ts --clean --format cjs,esm` | Build production files |
| `start` | `node dist/index.js` | Run built files |
| `test` | `vitest run` | Run tests |
| `test:watch` | `vitest` | Watch mode testing |
| `lint` | `eslint src/**` | Lint source code |
| `format` | `prettier --write src/**` | Format source code |

### package.json Required Fields

```json
{
  "name": "ts-template-base",
  "version": "0.0.1",
  "description": "TypeScript template repository for Node.js tool development",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "keywords": ["typescript", "template", "nodejs"],
  "license": "MIT"
}
```

## Implementation Details

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  }
}
```

### Signal Handling (src/index.ts)

The entry point includes graceful shutdown handling:
- Listens for `SIGINT` (Ctrl+C) - works on both Windows and Unix
- Listens for `SIGTERM` (kill command) - Unix only
- Logs shutdown message before exit

Example implementation:
```typescript
const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

### Environment Variable Validation (src/config/index.ts)

Uses Zod schema for robust validation. The following environment variables are **placeholder examples** that should be customized for your project:

```typescript
const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),  // Example: Discord bot token
  DEEPL_AUTH_KEY: z.string().min(1),  // Example: DeepL API key
});
```

Note: Replace `DISCORD_TOKEN` and `DEEPL_AUTH_KEY` with your actual required environment variables.

### Sample Test (src/index.test.ts)

Simple Vitest test demonstrating framework setup:
- Test `Math` addition functionality
- Target pattern: `src/**/*.test.ts`

Example:
```typescript
import { describe, it, expect } from 'vitest';

describe('Math', () => {
  it('adds two numbers', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### tsup Configuration (tsup.config.ts)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,  // Generate .d.ts type definition files
  sourcemap: true,
});
```

### ESLint Configuration (eslint.config.js)

Uses ESLint 10.x flat config format:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
```

### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Vitest Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'node_modules/'],
    },
  },
});
```

## CI/CD Pipeline

The GitHub Actions workflow runs all platforms in parallel using a matrix strategy:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [20.x]
      fail-fast: false  # Continue other matrix jobs if one fails
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
      - run: npm ci
      - run: npm run build
```

Platform-specific failures are reported individually, and all platforms must pass for the build to succeed.

## Cross-Platform Considerations

- **Line endings**: Git handles LF/CRLF conversion automatically via `.gitattributes`
- **Path separators**: Use `path.join()` for file paths (works on both Windows and Unix)
- **Signal handling**: SIGINT works on both platforms (Ctrl+C on Windows), SIGTERM is Unix-only
- **Build output**: CommonJS and ESM formats for compatibility
- **Lock files**: `package-lock.json` is committed for consistency across environments

### .gitattributes

The `.gitattributes` file ensures consistent line endings across platforms, preventing linter errors due to CRLF/LF differences:

```plaintext
* text=auto eol=lf
```

This forces all text files to use LF line endings in the Git repository, regardless of the user's OS.

### .npmrc

The `.npmrc` file enforces Node.js version requirements to prevent running on incompatible environments:

```plaintext
engine-strict=true
```

Combined with `package.json`'s `engines` field (`"node": ">=20.0.0"`), this prevents installation on unsupported Node.js versions.

## Success Criteria

- [ ] Project structure matches specification
- [ ] package.json contains all required fields (name, version, description, type, engines, keywords, license)
- [ ] package-lock.json is committed to repository
- [ ] All npm scripts work correctly (dev, build, start, test, test:watch, lint, format)
- [ ] npm install completes successfully on all platforms
- [ ] TypeScript compilation passes with strict mode
- [ ] ESLint (flat config) and Prettier configured and working
- [ ] Vitest runs sample test successfully
- [ ] tsup builds both CJS and ESM formats with type definitions
- [ ] CI workflow passes on all platforms (Ubuntu, Windows, macOS)
- [ ] Environment variable validation works with custom schema
- [ ] Signal handling works gracefully on all platforms
- [ ] README.md includes setup and usage instructions
- [ ] .gitattributes enforces LF line endings
- [ ] .npmrc enforces engine-strict for Node.js version requirements
