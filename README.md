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
