import { defineConfig } from "vitest/config";

// No path alias, deliberately. The engine's internal imports are relative, so
// that what the tests resolve is exactly what a host application resolves
// after `npm install`. An alias here would let a packaging bug pass the tests
// and fail in every consumer — which is precisely what happened once.
export default defineConfig({});
