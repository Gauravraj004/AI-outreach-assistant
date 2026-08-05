import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.js"],
    coverage: {
      reporter: ["text", "html"],
      include: [
        "src/content/profile-extractor.js",
        "src/prompts/**/*.js",
        "src/services/gemini-client.js",
        "src/services/storage.js",
        "src/shared/**/*.js",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
