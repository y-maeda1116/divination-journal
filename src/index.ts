import { config } from "./config/index.js";

console.log("Application starting...");

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log("Config loaded:", config);
