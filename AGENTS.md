# Agent instructions

Before considering a task complete, every agent working in this repo must run and resolve the following commands:

1. **Formatting**: Run `npm run format` (Prettier). All code must be formatted.
2. **Linting**: Run `npm run lint` (OxLint). All errors must be resolved; warnings should be addressed when reasonable.
3. **Type checking**: Run `npm run typecheck` (tsc --noEmit). No TypeScript errors.
4. **Build**: Run `npm run build`. The project must compile cleanly.
5. **Tests**: Run `npm run test` (Vitest). All tests must pass.
