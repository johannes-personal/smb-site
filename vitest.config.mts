import { defineConfig } from "vitest/config";

// No path alias, deliberately. The engine's internal imports are relative, so
// what the tests resolve is exactly what a host application resolves after
// `npm install`. An alias here would let a packaging bug pass the tests and
// fail in every consumer — which is precisely what happened once.
export default defineConfig({
  test: {
    // Only the engine's own tests. `skill/assets/template/tests/` belongs to a
    // scaffolded project: it imports `@/lib/...` and `@smb-site/engine`, which
    // resolve there and not here. Running it from the repo root tests nothing
    // and fails loudly, which is worse than not running it.
    include: ["tests/**/*.test.ts"],
  },
});
