import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['factory/bench/tests/**/*.test.ts'],
    // The bench is ported in a later session; CI must stay green on the empty skeleton.
    passWithNoTests: true,
  },
})
