# Agent notes for the React Router SaaS template

Lessons engineers learned while working on the React Router SaaS template, moved here from their
private memory on 21 November 2026. Check a note against the current code
before relying on it, and list corrections under **Lessons** in your PR.

<a id="commitlint-footer-trap"></a>

## Commitlint footer trap

_Commitlint warns footer-leading-blank when a commit body line starts with \"Word:\" or \"Header-Name:\"; check messages with bunx commitlint --edit_

A commit body line that starts with a token and a colon, such as `X-Forwarded-Proto: https` or `only: the host`, is parsed as a footer. Commitlint then warns `footer-leading-blank`.

**Why:** the warning appeared twice on PR #167 (2026-10-28), and each fix cost an amend.

**How to apply:** wrap body lines so none starts with `something:`. Before committing, check the message file with `bunx commitlint --edit <file>`. Don't use `Fixes:`/`Closes:` footers for an issue the brief says to leave unchanged; use `Refs:`.

<a id="playwright-held-request-gate"></a>

## Playwright held request gate

_Pattern and pitfalls for holding a real React Router form POST in template e2e tests to assert pending UI (gate, cleanup fixture, probes, attachments)_

Found on 2026-11-10 (ticket #178, PR #179, onboarding organization creation):

- A pending-state check right after a click races the action: the name-only `POST /onboarding/organization.data` took about 25 ms. Hold it with `page.route(urlPredicate, handler)` and in the handler await a release promise, then call `route.fallback()`. Page routes run before the shared context image guard in `playwright/fixtures.ts`, and fallback keeps that guard in the chain.
- Wait for hydration (`history.scrollRestoration === "manual"`) before the click. Otherwise the native POST goes to the page path and the `.data` gate never fires.
- Playwright's `toBeDisabled` sees a button disabled by a `<fieldset disabled>` ancestor.
- In a fixture's teardown, release the gate first, then await `request.response().then(r => r?.finished())` for each creation POST, then delete the DB rows. Otherwise a late action write outlives the cleanup.
- `testInfo.attach(..., { body })` is not saved to `--output` with the list reporter. To read it, run with `--reporter=json` and `PLAYWRIGHT_JSON_OUTPUT_FILE`, then base64-decode `.attachments[].body`.
- Negative probes that leave the delivered test unchanged: copy the spec into a temporary `zz-probe-*.e2e.ts` and inject a `beforeEach` that switches on an env var. Useful switches: an `addInitScript` MutationObserver that rewrites the text or removes `disabled`, or a `page.route` that aborts the POST. Delete the copy before running `validate`, because oxfmt checks it.
- The old onboarding tests deleted only the user, so each run left its organization behind.

Added on 2026-11-10 (ticket #180, PR #181, invite-link Deactivate guard):

- React Router 8 commits navigation states in `React.startTransition`, so the DOM can still show the "submitting" render after the refresh GET is already held. A `toBeDisabled` check there passed under a POST-only guard. Deterministic alternative: a `MutationObserver` on the button's `disabled` attribute that records `{disabled, href of the shown link}`. Then require exactly [disabled+old, enabled+new]. The probe caught a POST-only guard 3/3.
- To prove "can't submit" while a gate holds, run `button.evaluate` to attach a form `submit` listener, call native `click()`, and return whether it fired. Playwright's `click()` waits until the button is enabled, so it would only submit after the release.
- After a 400 action response, the page still revalidates (GET .data 200).
- `route.fallback({ postData })` sends a held request to the real action with a changed body, for example an unknown intent that triggers the handled 400. The `response` event's `request().postData()` then shows the overridden body.

Related: [Playwright hydration readiness](#playwright-hydration-readiness), [Playwright overlapping form actions](#playwright-overlapping-form-actions), [Template local test setup](#template-local-test-setup)

<a id="playwright-hydration-readiness"></a>

## Playwright hydration readiness

_In react-router-saas-template e2e, wait for history.scrollRestoration === "manual" before clicking forms; window.__reactRouterDataRouter is too early; page.route misses native-redirect hops_

Found on 2026-11-02 (ticket #170, PR #174):

- `playwright/utils.ts` `waitForHydration(page)` waits for `history.scrollRestoration === "manual"`, set by React Router's `<ScrollRestoration />` effect after React commits hydration.
- `window.__reactRouterDataRouter` exists while hydration still suspends on the page's i18n namespace (`/api/locales/en/<ns>`); a click then still submits natively (probe: 5/5 `POST /register`).
- Playwright `page.route` does not see the redirected request after a native form POST's 302 (or a route-fulfilled 302). Only fresh navigations (React Router's client redirect after `/<route>.data` 202) are routed.
- Holding `**/api/locales/*/userAuthentication` keeps hydration uncommitted, a deterministic way to reproduce pre-hydration clicks. A gate released on "test read the readiness signal OR registration POST seen" discriminates old wait vs fix without timers.

Related: [Template local test setup](#template-local-test-setup)

<a id="playwright-overlapping-form-actions"></a>

## Playwright overlapping form actions

_In react-router-saas-template e2e, a second <Form> submit aborts the first in the browser while its server action may still run; how to reproduce that interleaving with page.route gates and read request order from traces_

Found on 2026-11-10 (ticket #176, invite-link regenerate/deactivate test):

- Clicking a second `<Form method="POST">` while the first navigation is pending makes React Router abort the first: trace shows `POST …/members.data -1 net::ERR_ABORTED` or an aborted revalidation `GET …/members.data`. The server can still finish the aborted action.
- Reproducing a server-side interleaving: hold the first POST in `page.route`; after the second action finishes, `route.fetch()` still reaches the server even though the browser aborted it. Also hold the revalidation `GET .data` until that fetch answers, and the page renders the late write (here, an active link that stayed after deactivation).
- `page.on("request")` sees a request before `page.route` holds it, so it records submission order; `request.postData()` gives the urlencoded `intent`.
- Trace zips hold `<n>-trace.network` NDJSON (`resource-snapshot` entries); POST bodies sit in `resources/*.dat`, not inline.
- `waitForHydration` exists only on PR #174's branch, not on main. On the members page, the copy button enables itself only after hydration (`useHydrated`). A click before that submits natively (`POST members`, not `.data`), and `page.route` on `.data` never sees it.

Related: [Playwright hydration readiness](#playwright-hydration-readiness), [Template local test setup](#template-local-test-setup)

<a id="pr-screenshots-convention"></a>

## Pr screenshots convention

_How to host and capture UI screenshots for PRs in Jan's harness repos (orphan <PR>-pr-screenshots branch, blob ?raw=true links, before/after pixel diff)_

Found on 2026-10-28 while working ticket #164 (PR #167):

- The harness keeps only GitHub-hosted PR images: user attachments (need a browser) or files in the PR's own repo. The team convention (seen in get-signals #461) is an orphan branch `<PR>-pr-screenshots` with a `review-N/` folder. Embed the images as `https://github.com/<owner>/<repo>/blob/<commit>/review-N/<file>.png?raw=true`.
- Create the orphan commit without touching the worktree: use a temporary `GIT_INDEX_FILE`, then `hash-object -w`, `update-index --cacheinfo`, `write-tree`, `commit-tree`, and `git push origin <sha>:refs/heads/<PR>-pr-screenshots`.
- For a "UI preserved" claim: `git archive origin/main` into `~/.cache/ocl-build-$OCL_RUN_ID/main`, build both sides, serve them against one seeded test DB, capture with the `playwright` library from node (`reducedMotion: "reduce"`), and compare with `compare -metric AE`.
- The template's onboarding globe and light rays render only when `NODE_ENV !== "test"`. Serve the screenshot builds with `NODE_ENV=development MOCKS=true EMAIL_MOCKS=true bun run start`.
- The first capture after a server cold start differed by about 20 to 30 pixels in the header icon buttons (bell, theme toggle, copy icon), even main against main. A second capture of main matched the PR build exactly. Capture main twice before calling a difference real. The invite URL uses the request origin, so serve both builds on the same port, one after the other (PR #166, 2026-10-28).

- A zero pixel difference proves nothing if both sides are blank. In PR #167 round 1, a loose button regex clicked "Continue with Google" and captured an empty white redirect page on both sides; the reviewer caught it. Wait for the target state in each capture step, such as `getByText(...).waitFor()` for a validation message. Then reject near-uniform images: `magick f.png -colorspace gray -format "%[fx:standard_deviation]" info:` below 0.01.

Related: [Template local test setup](#template-local-test-setup)

<a id="template-local-test-setup"></a>

## Template local test setup

_How to run react-router-saas-template's DB-backed tests and Docker checks as an agent on Jan's machine (Prisma reset guard, no Docker socket, shared Postgres, pinned runtimes)_

Facts found on 2026-10-28 while working ticket #163 (PR #166):

- Prisma 7.10 refuses `prisma db push --force-reset` (so `bun run test:db:reset`) when an AI agent runs it, and demands the user's consent. Don't fake the consent env var. Instead create a fresh, empty loopback database per suite (`psql -h localhost -U postgres -c "create database react_router_saas_test_<tag>"`), then `bun scripts/run-with-test-database.ts bunx prisma db push`.
- Local Postgres on localhost:5432 (postgres/postgres) is shared with other projects. Use a name containing `test` and a ticket tag.
- The agent user isn't in the `docker` group, so `docker build` fails. The repo's CI has `workflow_dispatch`, and its Docker job runs on dispatch: `gh workflow run ci.yml --ref <branch>`.
- Run pinned runtimes side by side via mise without touching the global config: `mise install node@X bun@Y`, then prepend `~/.local/share/mise/installs/{node,bun}/<ver>/bin` to PATH.
- For e2e, use `CI=1 APP_URL=http://localhost:<port> PORT=<port>`, so it doesn't collide with other worktrees on port 3000.
- Write coverage to $TMPDIR (`--coverage.reportsDirectory=$TMPDIR/coverage`), because `coverage/` isn't gitignored.
- The worktree's `.env` (gitignored, copy of `.env.example`) holds TEST_DATABASE_URL for later runs. A TEST_DATABASE_URL set in the shell wins over `.env` (dotenv doesn't override), so e2e can use its own fresh DB without editing `.env`.
- To show a dependency-upgrade test failing first (ticket #165, 2026-10-28): copy package.json and bun.lock to $TMPDIR, `bun add --exact <pkg>@<old>`, run the spec, then copy both files back and `bun install --frozen-lockfile`.
- The Google registration e2e flake (fixed in PR #174, ticket #170, 2026-11-02) came from clicking before hydration: a native form POST gets a 302, and Playwright `page.route` does not intercept the redirect hop, so the mock is skipped (ERR_NAME_NOT_RESOLVED). See [Playwright hydration readiness](#playwright-hydration-readiness). The login Google test likely has the same race.
- Since #164, the e2e suite also starts an HTTPS proxy on the fixed port 8443. Build with `APP_URL=<e2e url> ADDITIONAL_ACTION_ORIGINS=localhost:8443 bun run build`, as CI does.

- Run even unit-test files through `bun scripts/run-with-test-database.ts bunx vitest --run <file>`. A plain `bunx vitest` loads no .env, so any file importing `stripe-admin.server` (e.g. via the Stripe factories) fails with "Neither apiKey nor config.authenticator provided" (ticket #169, 2026-10-29).

<a id="vitest-title-truncation"></a>

## Vitest title truncation

_Vitest 5 cuts $name / %s values in test.each titles at 40 characters; use for-of loops with template-literal titles for long case names_

In react-router-saas-template (Vitest 5.0.5), `test.each(cases)("given: $name, …")` and `describe.each` shorten each interpolated value to 40 characters, e.g. "an expiring subscription schedule which…". The setting behind it is `taskTitleValueFormatTruncate`. Found on 2026-10-30 (ticket #172).

**How to apply:** for table-driven tests with long case names, loop with `for (const c of cases) test(\`given: ${c.name}, …\`, …)`, so titles in the PR's before/after table and in CI logs stay readable. Also, a mocked module in a `.server.test.ts`needs every import-time client mocked:`stripe-event-factories.server`imports`STRIPE_API_VERSION`from`stripe-admin.server`, so its mock must export that constant too.

Related: [Template local test setup](#template-local-test-setup)
