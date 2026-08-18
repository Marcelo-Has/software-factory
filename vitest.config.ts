import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['factory/bench/tests/**/*.test.ts'],
    // A handful of suites (states/style/tokens design tests) self-skip until a real
    // project/app exists; passWithNoTests keeps that — and the empty skeleton before any
    // bench test existed — from ever failing an otherwise-empty run.
    passWithNoTests: true,
  },
})
