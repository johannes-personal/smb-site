# smb-site

General small business site constructor with a complementary skill and process.
Next.js, Puck and optional Postgres on Supabase.

Rebuild a small business's website into something they can actually run
themselves. Two halves, and the split between them is the whole design.

| | Where | What |
|---|---|---|
| **Engine** | this repository's root — `@smb-site/engine` | Everything that is the same on every project. A **dependency**. |
| **Skill** | [`skill/`](skill/) | The judgement: what to harvest, what to ask, what to decide. Instructions for an agent, or a process for a person. |

## Why the engine is a dependency and not a template

The first version copied the whole engine into each project at scaffold time.
That is the pattern platform engineering calls **template drift**: the copy and
the original diverge, and the gap widens until taking updates costs more than
living with the bugs.

It played out exactly as advertised. On the first real build, five faults came
from a copy nobody had executed in months — a missing `getCatalogue()`, a
missing `content/collections.json` that the seed route imported, a `FieldDef`
without the `filterable` field the registry read, and a dependency still on
`@measured/puck` after it was deprecated.

A sixth was worse. `titleFor` read a module-level map that only one route ever
populated, so all 884 products on a live site were titled from a raw brand id —
`waldlaufer 4883` instead of `Waldlaufer 4883`. It typechecked, it built, the
tests passed, the validator was clean. Only looking at the deployed page found
it.

As a copy, fixing that fixes one client. As a dependency, it fixes every client
on `npm update`.

## The seam

**The engine never learns where anything is stored.** No Supabase dependency,
no knowledge of routing. The host application loads facts and items and passes
them in:

```tsx
import { SiteHeader, buildConfig } from "@smb-site/engine";

const facts = await getFacts();          // the project's job
const catalogue = await getCatalogue();  // the project's job

<Render config={buildConfig(facts, catalogue)} data={page.data} />
```

That is why `resolveItem` and `titleFor` take their label maps as arguments.
The module-level cache behind the 884-title bug is not merely fixed in the
engine — it is unrepresentable there, because the engine has nowhere to cache
anything from.

| Engine | Project |
|---|---|
| Facts, hours, taxonomy and collection models | Loading and saving them |
| The 16 blocks and the Puck registry | Routes, layouts, metadata |
| `SiteHeader`, `SiteFooter`, `ProductCard` | The owner's editing screens |
| Pure helpers — `weekSchedule`, `spreadByBrand`, `labelsFrom` | Auth, environment, migrations, content |

When something needs changing, the first question is which side it belongs on.
A new block, a fix to the opening-hours rules, a change to how an item titles
itself: engine. A redirect, a bespoke page, this shop's brand colour: project.
**If a project ever needs to fork the engine, the extension points are wrong —
fix those instead.**

## Using the engine

```bash
npm install github:johannes-personal/smb-site#v0.1.0
```

```ts
// next.config.ts — the engine ships TypeScript source rather than a build,
// so the consumer compiles it, and the consumer's own tsc checks it too.
transpilePackages: ["@smb-site/engine"],
```

Peer dependencies: `react`, `next`, `@puckeditor/core`.

Internal imports are relative, never aliased. That is not style: the first
packaged build used a `@/` alias that resolved against the package's own
tsconfig and was meaningless once installed, because `@/` points at the
*host's* root. Everything looked green; every consumer would have failed to
build.

## Using the skill

[`skill/SKILL.md`](skill/SKILL.md) is the entry point. It carries the phases,
the sector packs, the Dutch compliance checklist and the owner-guide templates.
Point an agent at it, or read it and do the work yourself.

Start with
[`skill/references/00-template-manifest.md`](skill/references/00-template-manifest.md)
for what the code already contains — it is generated from the code on disk, so
unlike the prose it cannot describe something that does not exist.

## Verifying it

```bash
npx tsc --noEmit && npx vitest run   # the engine on its own
python skill/scripts/selftest.py     # scaffold a project, install the packed
                                     # engine, typecheck, test, build
```

The second is the one that matters, and CI runs both on every push. It installs
the engine from `npm pack` output rather than from a directory, because a
directory install hides exactly the mistakes that reach consumers: a file left
out of `files`, an import that only resolves through the source tree, a peer
dependency nobody declared. Two such faults have already been caught this way.

## Versioning

Semver, and the major is not decorative:

- **patch** — a fix that changes no API and no markup structure
- **minor** — a new block, a new optional prop, a new helper
- **major** — a removed prop, a renamed export, or a change to rendered
  structure that a site's CSS could depend on

Adding a required field to `Facts` is a major, even though TypeScript makes it
look small: every existing site's content becomes invalid.

## Status

`v0.1.0`. One site built with it, at 884 products. The lessons from that build
are logged in [`skill/CHANGELOG.md`](skill/CHANGELOG.md), including the
expensive ones.
