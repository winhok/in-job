# in-job

`in-job` uses a pnpm workspace to keep the frontend and backend in one repository.
The Nest application remains a single standalone application inside `server/`.

## Structure

```text
.
├── apps/
│   └── web/       # frontend application
├── server/        # Nest single application
├── package.json   # workspace scripts
└── pnpm-workspace.yaml
```

## Commands

```bash
pnpm install
pnpm server       # start the Nest application in watch mode
pnpm web          # start apps/web after its package.json is added
pnpm dev          # start both applications after apps/web is ready
pnpm build        # build every workspace package that has a build script
pnpm test         # test every workspace package that has a test script
```

The frontend can be copied into `apps/web/`. Its `package.json` should use the
package name `@in-job/web` so the root `web` and `dev` scripts can select it.

## DeliveryGuard

The repository uses DeliveryGuard to keep specifications, implementation,
acceptance evidence, repairs, and releases as separate, verifiable lifecycle
stages.

```bash
pnpm deliveryguard:check   # validate configured delivery gates
pnpm deliveryguard:status  # show derived lifecycle stages
```

Project delivery records live in `.deliveryguard/`, while active OpenSpec
changes live in `openspec/changes/`. The reusable agent workflow is documented
in `AGENTS.md` and `.agents/skills/`.
