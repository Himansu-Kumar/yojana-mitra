# Contributing

## Workflow
1. Pick (or create) a GitHub Issue. One issue = one step or part of a step from `docs/build-guide.md`.
2. Branch from the latest `main`:
   `feat/<module>-<short-desc>` · `fix/<module>-<short-desc>` · `chore/<desc>`
3. If you add or change an endpoint, **update `docs/api-contract.md` first**.
4. Keep the PR small. Fill in the PR template. Link the issue (`Closes #12`).
5. CI must pass and one teammate must approve. Then squash-merge.

Commit messages: `type(scope): message`, e.g. `feat(eligibility): show near-miss reason`.
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Modularity rules
1. **One feature = one folder**: `client/src/features/<feature>/` and `server/src/modules/<module>/`.
2. Modules use each other only through exported service functions, never each other's models or internals.
3. **Only the server writes to MongoDB.** `ml-service` is stateless.
4. **Only `server/src/clients/mlClient.js` calls `ml-service`.**
5. Every endpoint is documented in `docs/api-contract.md`.
6. Secrets live in `.env` files, never in code or commits. Update the matching `.env.example` when you add a variable.
7. Each module ships with at least one test.

## Adding a server module
```
server/src/modules/<name>/
  <name>.routes.js       Express router (validation + call service)
  <name>.service.js      business logic
  <name>.model.js        Mongoose model (if it stores data)
  <name>.test.js         node:test tests
```
Then mount it with one line in `server/src/app.js`.

## Adding a client feature
```
client/src/features/<name>/
  api.js                 calls shared/lib/api.js
  <Name>Page.jsx         page component
  ...                    feature-only components
```
Then add a route in `client/src/app/App.jsx` (and a nav link in `Layout.jsx` if needed).
Shared, generic UI goes in `client/src/shared/ui/`.

## Adding a scheme
Edit `data/schemes.json` (format in `data/README.md`), run `npm test` (validates every rule), then `npm run seed`.

## Ownership
See `.github/CODEOWNERS`. Reviewers are assigned automatically by folder.
