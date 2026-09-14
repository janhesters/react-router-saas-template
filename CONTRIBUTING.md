# Contributing to the React Router SaaS Template

Thank you for your interest in contributing to the React Router SaaS Template!
This guide outlines the process, standards, and proven approaches for contributing
to the project.

**Boy scout rule:** If you see something that can be improved, please improve
it!

> Leave the code better than you found it.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Issue Workflow](#issue-workflow)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Style Guide](#style-guide)
- [Additional Sections to Consider](#additional-sections-to-consider)

## Code of Conduct

We expect all contributors to adhere to our code of conduct. Please be
respectful, inclusive, and professional in all interactions.

## Getting Started

Follow the steps outlined in the main [README.md](./README.md#getting-started).

## Issue Workflow

1. **Create an issue** describing your proposed feature or bug fix. Include:
   - A clear title
   - Description of the problem or feature
   - Relevant context (screenshots, logs, examples)
2. **Get approval** from one of the maintainers (the ReactSquad team) before
   opening a pull request, so you don't waste time on a pull request that won't
   be merged.
3. Once approved, make the changes in a new branch.

## Development Workflow

1. **Create a feature/fix branch** off of `main`:

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

2. **Make your changes**, following the [Style Guide](#style-guide).
3. **Write tests** (see [Testing Guidelines](#testing-guidelines)).
4. **Run checks**:

   Configure the disposable database described in
   [Database-backed tests](./README.md#database-backed-tests), then run:

   ```bash
   bun run validate    # Type checking, linting, and formatting checks
   bun run test         # Unit & integration tests
   bun run test:e2e:ui  # End-to-end tests
   ```

5. **Commit changes** following our [Commit Guidelines](#commit-guidelines).

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clarity
and automated versioning. Commit message format:

```
type(scope): short description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting)
- `refactor`: Code restructuring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

After staging, use Commitizen for consistent formatting:

```bash
bunx cz
```

## Pull Request Process

1. Ensure your branch is up to date with `main`:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your branch to your fork:

   ```bash
   git push origin feat/your-feature-name
   ```

3. Open a pull request against `reactsquad/main`.
4. **Link the approved issue** in your PR description.
5. Ensure all checks pass and the build is green.
6. Request review from at least one maintainer.
7. Address feedback; maintainers may request commit squashing.

## Testing Guidelines

### Test Location

- **Tests live adjacent to source files**, for example:

  ```text
  src/components/Button.tsx
  src/components/Button.test.tsx
  ```

### Coverage Requirements

- **New features** must include tests at the appropriate level: unit,
  integration, component, or E2E.
- **Bug fixes** require a reproducible failing test first. Once the test fails,
  make the change so the test passes.

### Test Style

Follow the project's testing conventions:

- **Prose style**: `given: ... should: ...`
- **Assertions**: `expect(actual).toEqual(expected)`
- See
  [5 Questions Every Test Must Answer](https://medium.com/@ericelliott/5-questions-every-test-must-answer-18a03194eeb1).

Run tests with:

```bash
bun run test        # Unit & integration
bun run test:e2e:ui # End-to-end
```

### Test images

Use `TEST_IMAGE_DATA_URL` from `app/test/test-image.ts` for default avatars and
organization logos. The shared PNG loads without a network request. The user
and organization factories already use it, so seeds and Playwright setup helpers
inherit the same default. Keep external image generators such as `faker.image`
out of rendering fixtures.

Import Playwright's `test` and `expect` from `playwright/fixtures.ts`. Its image
guard blocks external image requests and fails tests which request them.
Intentional Supabase Storage image requests read the files saved by the upload
mocks. Upload tests should check the owner-scoped URL, uploaded bytes, and image
dimensions after reloading the page. Check image dimensions for default avatars
and logos too, so a fallback cannot hide a broken image.

Literal external or OAuth image URLs are valid in parsing and preservation
tests which never fetch them. Intercept requests when a provider image needs to
render. Keep explicit empty-image overrides for fallback tests.

## Style Guide

### TypeScript

- Use strict mode
- Define explicit return types
- Favor `type` for object shapes

### React

- Functional components with hooks
- Follow React Router patterns
- Use React Hook Form for forms
- Add error boundaries

### Styling

- Tailwind CSS
- shadcn/ui component system
- Maintain dark mode support

### File Structure & Naming

- All files must be named in `kebab-case`.
- All constants must be named in `SCREAMING_SNAKE_CASE`.

### Code quality

- Oxlint checks correctness and uses type information from TypeScript.
  Configure lint rules in `.oxlintrc.json`.
- Oxfmt formats files and sorts imports, `package.json`, and Tailwind classes.
  Configure formatting in `.oxfmtrc.json`.
- `@shadcn/lint` enforces all six design-system rules as errors in local linting
  and CI. Use component variants for appearance, theme colors, and static
  classes. `.oxlintrc.json` defines component contracts and scoped exceptions
  for primitive authoring, brand artwork, and HTML email. See the
  [linting policy](README.md#linting-and-formatting) for details.
- CI also runs `check:shadcn`, which proves that each rule rejects an invalid
  example through the project configuration. Keep this check passing when
  changing the design system.
- Run `bun run check` to apply lint fixes and format files. Run
  `bun run validate` before submitting a pull request to check types, linting,
  and formatting.
- The pre-commit hook generates types, fixes lint issues in staged code, and
  formats supported staged files with lint-staged.
- Write self-documenting code
- Add TSDoc to your complex functions
- Comment complex logic
- Keep functions small and focused (DOT principle)

Thank you for helping improve the React Router SaaS Template! We look forward to
your contributions.
