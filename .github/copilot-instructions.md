# Copilot Instructions — azure-devops-pr-commentator

This is an Azure DevOps pipeline task (`PrCommentator`) written in TypeScript. It runs during a build
and automatically posts a comment on a pull request when configured conditions are met (e.g. changed
files match a glob, or a commit message matches an expression).

## Build, test, and lint

- Install deps: `npm ci`
- Run all tests: `npm test` (Mocha + ts-node, no compile step needed)
- Run a single test file: `npx mocha -r ts-node/register -r mocha-suppress-logs "./tests/commentator.test.ts"`
- Run tests matching a name: add `-g "<pattern>"`, e.g.
  `npx mocha -r ts-node/register -r mocha-suppress-logs -g "should succeed when conditions are met" "./tests/**/*.test.ts"`
- Coverage: `npm run coverage` (or `coverage-html` for an HTML report in `/coverage`). Coverage excludes `src/index.ts`.
- Lint: `npm run lint` (ESLint, `eslint-config-love` + stylistic plugin, 4-space indent, double quotes). Auto-fix with `npm run lint-fix`.
- Build the extension package: `npm run build-dev` (bumps versions, compiles, packages a `.vsix`).
- Tests run automatically on commit via husky pre-commit hook; both Node 20 and Node 24 are supported/tested in CI (`.github/workflows/build.yml`).

## Architecture

Execution flow starts in `src/index.ts` and flows through a small pipeline:

1. `Inputs` (`src/inputs.ts`) and `Variables` (`src/variables.ts`) read task inputs / pipeline
   predefined variables via `azure-pipelines-task-lib`.
2. `createGitClient` (`src/azure-helpers.ts`) builds an `azure-devops-node-api` Git client; it's wrapped
   by `GitApiExtension` (`src/git-api-extension.ts`) which adds higher-level PR/commit operations.
3. `ValidatorFactory` (`src/validators/validator-factory.ts`) builds an ordered list of `IValidator`s
   (currently `FileGlobValidator` and `CommitExpressionValidator`). `validateAll` (`src/validators/validator.ts`)
   runs them **in sequence, short-circuiting on the first unmet condition**, threading an accumulating
   `IResultContext` (matched `files`/`commits`) through each validator so later validators can narrow
   scope based on earlier matches.
4. `TaskRunner` (`src/task-runner.ts`) orchestrates validation and, if all conditions passed, calls
   `Commentator.createComment` (`src/commentator.ts`).
5. `Commentator` builds the PR comment thread content (including collapsible file/commit lists), but
   first checks existing threads for one whose `thread.properties.hash` matches `inputs.hashedConditions`
   (via `isAutoCommentThread` in `src/type-guards.ts`) — this ensures a comment for the same condition
   set is **only created once per PR**, even across repeated pipeline runs.

Adding a new condition type means adding a new `IValidator` implementation under `src/validators/` and
registering it in `ValidatorFactory.createValidators()`. Order matters because context narrows downstream.

## Conventions

- Interfaces for injected/testable dependencies are prefixed `I` and exported alongside the class that
  implements them (e.g. `ICommentator`, `IValidator`, `IVariables`), enabling stubbing in tests.
- Class methods that need `this` binding for use as callbacks are declared as `public readonly x = (...) => {...}`
  arrow function class properties rather than regular methods.
- Mocking is done with `rewiremock` (see `tests/rewire.ts`), not module-level test frameworks' auto-mocking.
  `rewireAll()`/`instantiate()` stub `azure-pipelines-task-lib`, `minimatch`, and `azure-devops-node-api`;
  the module under test must be dynamically `import()`-ed *inside* `instantiate()` so the rewired mocks apply.
- Test files mirror source file names: `<name>.test.ts` for `src/<name>.ts`. Shared stub builders live in
  `tests/stub-helper.ts`.
- User-facing strings (comment section headers, etc.) are centralized in `src/resources.ts`.
- Task metadata/inputs are defined in `task.json` and must stay in sync with `src/inputs.ts`.
