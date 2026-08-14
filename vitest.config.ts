import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // react-native ecosystem modules use Flow/TS syntax that rollup cannot
    // transform in test mode; tests only exercise pure local modules, so
    // externalize everything else via inline deps is not needed — instead we
    // alias the @ prefix only for the local analysis modules actually tested.
    server: {
      deps: {
        inline: [],
      },
    },
  },
});
