---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "tests/**"
  - "e2e/**"
---
# Testing rules

- Every new piece of code ships with tests. Descriptive names: "should [result] when
  [condition]".
- End-to-end coverage for critical user flows, start to finish.
- Mock external dependencies (payment providers, third-party APIs, media providers), not
  internal modules.
- Clean up side effects between tests.
- A PR isn't "done" unless `lint`, `test`, and `build` (and the scans) all pass.
