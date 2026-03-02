import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  exports: true,
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
  banner: ({ fileName }) => (fileName.startsWith("cli") ? "#!/usr/bin/env node" : undefined),
});
