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
