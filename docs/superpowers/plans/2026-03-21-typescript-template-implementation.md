# TypeScript Template Repository Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform TypeScript template repository optimized for Node.js tool development with CI/CD, linting, testing, and build capabilities.

**Architecture:** Standard Node.js package structure with TypeScript, using tsx for development, tsup for building, Vitest for testing, ESLint/Prettier for code quality, and GitHub Actions for CI/CD.

**Tech Stack:** Node.js 20+, TypeScript 5.x, tsx, tsup, Vitest 4.x, ESLint 10.x (flat config), Prettier 3.x, Zod 4.x, dotenv 17.x

---

## File Structure

| File | Purpose |
|------|---------|
| `package.json` | Package metadata, dependencies, scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `tsup.config.ts` | Build configuration (CJS + ESM) |
| `eslint.config.js` | ESLint flat config |
| `.prettierrc` | Prettier formatting rules |
| `vitest.config.ts` | Vitest test configuration |
| `.gitignore` | Git exclusions |
| `.gitattributes` | Line ending configuration |
| `.npmrc` | npm engine-strict setting |
| `.env.example` | Environment variable examples |
| `src/index.ts` | Entry point with signal handling |
| `src/config/index.ts` | Environment variable validation |
| `src/index.test.ts` | Sample Vitest test |
| `.github/workflows/ci.yml` | CI/CD workflow |
| `README.md` | Setup and usage instructions |

---

### Task 1: Create package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create package.json with all required fields and dependencies**

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
  "license": "MIT",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup --clean",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/**",
    "format": "prettier --write src/**"
  },
  "devDependencies": {
    "@eslint/js": "^9.20.0",
    "@types/node": "^22.12.7",
    "@vitest/coverage-v8": "^1.9.0",
    "eslint": "^10.1.0",
    "prettier": "^3.8.1",
    "tsup": "^8.5.1",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.57.1",
    "vitest": "^4.1.0"
  },
  "dependencies": {
    "dotenv": "^17.3.1",
    "zod": "^4.3.6"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "feat: add package.json with dependencies and scripts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create TypeScript configuration

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: Create tsconfig.json with strict settings**

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
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "feat: add TypeScript configuration with strict mode

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Create tsup build configuration

**Files:**
- Create: `tsup.config.ts`

- [ ] **Step 1: Create tsup.config.ts for dual CJS/ESM output**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
  sourcemap: true,
});
```

- [ ] **Step 2: Commit**

```bash
git add tsup.config.ts
git commit -m "feat: add tsup configuration for dual CJS/ESM build

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Create ESLint configuration (flat config)

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Create eslint.config.js using flat config format**

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

- [ ] **Step 2: Commit**

```bash
git add eslint.config.js
git commit -m "feat: add ESLint flat configuration

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Create Prettier configuration

**Files:**
- Create: `.prettierrc`

- [ ] **Step 1: Create .prettierrc with formatting rules**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 2: Commit**

```bash
git add .prettierrc
git commit -m "feat: add Prettier configuration

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Create Vitest configuration

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest.config.ts with coverage settings**

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

- [ ] **Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "feat: add Vitest configuration

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Create .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore with exclusions for Node, Windows, Mac**

```
# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build output
dist/

# Environment
.env
.env.*
.env.local
.env.*.local

# OS specific
.DS_Store
Thumbs.db
desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Coverage
coverage/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "feat: add .gitignore for Node, Windows, Mac

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Create .gitattributes

**Files:**
- Create: `.gitattributes`

- [ ] **Step 1: Create .gitattributes to enforce LF line endings**

```
* text=auto eol=lf
```

- [ ] **Step 2: Commit**

```bash
git add .gitattributes
git commit -m "feat: add .gitattributes for LF line ending enforcement

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Create .npmrc

**Files:**
- Create: `.npmrc`

- [ ] **Step 1: Create .npmrc with engine-strict**

```
engine-strict=true
```

- [ ] **Step 2: Commit**

```bash
git add .npmrc
git commit -m "feat: add .npmrc with engine-strict for Node.js version enforcement

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Create .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example with placeholder environment variables**

```env
DISCORD_TOKEN=your_discord_bot_token_here
DEEPL_AUTH_KEY=your_deepl_auth_key_here
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add .env.example with placeholder variables

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Create source directory structure

**Files:**
- Create: `src/index.ts`, `src/config/index.ts`, `src/index.test.ts`, `src/lib/` (placeholder)

- [ ] **Step 1: Create source directories**

```bash
mkdir -p src/config src/lib
```

- [ ] **Step 2: Create src/config/index.ts with environment variable validation**

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DEEPL_AUTH_KEY: z.string().min(1),
});

export const config = envSchema.parse(process.env);
```

- [ ] **Step 3: Create src/index.ts with signal handling**

```typescript
import { config } from './config';

console.log('Application starting...');

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

console.log('Config loaded:', config);
```

- [ ] **Step 4: Create src/index.test.ts with sample test**

```typescript
import { describe, it, expect } from 'vitest';

describe('Math', () => {
  it('adds two numbers', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Create src/lib/.gitkeep to preserve directory**

```bash
touch src/lib/.gitkeep
```

- [ ] **Step 6: Run TypeScript compilation to verify**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 7: Run tests to verify**

```bash
npm test
```

Expected: Tests pass

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: add source files with signal handling and env validation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create GitHub workflow directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create .github/workflows/ci.yml with test and build jobs**

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
      fail-fast: false
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

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "feat: add CI workflow for test and build on all platforms

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Create README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md with setup and usage instructions**

```markdown
# TypeScript Template Base

A cross-platform TypeScript template repository optimized for Node.js tool development with consideration for future web frontend (React) migration.

## Features

- TypeScript with strict mode
- Hot-reload development with `tsx`
- Dual CJS/ESM build with `tsup`
- Testing with Vitest
- Linting with ESLint (flat config)
- Formatting with Prettier
- Environment variable validation with Zod
- CI/CD with GitHub Actions (Ubuntu, Windows, macOS)

## Requirements

- Node.js >= 20.0.0
- npm

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Edit `.env` with your actual values:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DEEPL_AUTH_KEY=your_deepl_auth_key_here
```

## Development

Run in development mode with hot-reload:

```bash
npm run dev
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Build

Build for production:

```bash
npm run build
```

Run built files:

```bash
npm start
```

## Linting and Formatting

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## Environment Variables

The following environment variables are required (customize for your project):

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord bot token (example) |
| `DEEPL_AUTH_KEY` | DeepL API key (example) |

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and usage instructions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 14: Install dependencies and verify

**Files:**
- Modify: `package-lock.json` (generated by npm install)

- [ ] **Step 1: Install dependencies**

```bash
npm install
```

Expected: All packages installed successfully

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: Tests pass

- [ ] **Step 4: Run linter**

```bash
npm run lint
```

Expected: No linting errors

- [ ] **Step 5: Build project**

```bash
npm run build
```

Expected: dist/ directory created with CJS and ESM output

- [ ] **Step 6: Verify build output**

```bash
ls -la dist/
```

Expected: index.js, index.mjs, index.d.ts, source maps

- [ ] **Step 7: Commit package-lock.json**

```bash
git add package-lock.json
git commit -m "chore: add package-lock.json

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Success Criteria Checklist

After completing all tasks:

- [ ] Project structure matches specification
- [ ] package.json contains all required fields
- [ ] package-lock.json is committed
- [ ] All npm scripts work correctly
- [ ] npm install completes successfully
- [ ] TypeScript compilation passes with strict mode
- [ ] ESLint and Prettier configured and working
- [ ] Vitest runs sample test successfully
- [ ] tsup builds both CJS and ESM formats with type definitions
- [ ] .gitattributes enforces LF line endings
- [ ] .npmrc enforces engine-strict
- [ ] CI workflow ready for GitHub Actions
- [ ] README.md includes setup and usage instructions
