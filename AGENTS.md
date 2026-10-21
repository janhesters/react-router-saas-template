# Agent instructions

[CONTRIBUTING.md](./CONTRIBUTING.md) holds the workflow, the commit format, and
the style guide. The rules under `.cursor/rules/` apply to the files their
globs match. The [README](./README.md) documents the application itself.

## When CI runs

`.github/workflows/ci.yml` runs on a pull request **only once it is ready for
review**, every night on `main`, and on demand through `workflow_dispatch`. The
README's [continuous integration](./README.md#continuous-integration) section
covers the jobs and the reasoning. While you work:

- **A draft pull request runs no CI job.** Never wait for checks on a draft.
  Mark the pull request ready when you want a run.
- **Each push to a ready pull request starts another run.** Push a branch's
  commits together instead of one at a time.
- **The Docker job runs only at night.** Build the image locally when you touch
  the `Dockerfile`, `.dockerignore`, or a pinned runtime version.
- **A merge runs nothing.** The nightly run on `main` catches what a merge
  broke.

Run `bun run validate`, `bun run test`, and `bun run test:e2e` before you mark
a pull request ready. The first run then has a chance of being green, and a
red run costs the same minutes as a green one.
