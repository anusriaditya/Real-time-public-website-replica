# Accessibility Baseline & Repository Architecture Audit

A real accessibility audit of a public transit portal, turned into an
accessible, maintainable monorepo skeleton with one fully working vertical
feature slice.

- **Audit report:** [`docs/accessibility-audit-report.md`](./docs/accessibility-audit-report.md)
- **Architecture, system boundaries, local setup:** [`docs/README.md`](./docs/README.md)
- **Why pnpm + Turborepo:** [`docs/adr/0001-monorepo-tooling.md`](./docs/adr/0001-monorepo-tooling.md)

Quick start:
```bash
corepack enable && corepack prepare pnpm@9.12.0 --activate
pnpm install
cp server/.env.example server/.env
pnpm dev
```
Full instructions, including running the accessibility test suite, are in
[`docs/README.md`](./docs/README.md).
