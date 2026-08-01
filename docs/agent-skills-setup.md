# Agent skills (open-agent-skills)

Murmur uses the [open-agent-skills](https://github.com/mbaiges/open-agent-skills) marketplace **locally**. The clone lives under `.agentic/` and is **gitignored**; project rules in [`.cursor/rules/agentic-skills.mdc`](../.cursor/rules/agentic-skills.mdc) point Cursor at those paths.

Upstream integration guide: `.agentic/open-agent-skills/docs/INTEGRATION.md` (after clone).

## One-time setup (each machine)

From the repository root:

```bash
mkdir -p .agentic
git clone git@github.com:mbaiges/open-agent-skills.git .agentic/open-agent-skills
cd .agentic/open-agent-skills
git fetch --tags
git checkout main   # or pin a release tag when available
cd ../..
```

Optional — Cursor native skills discovery symlink:

```bash
ln -sf ../.agentic/open-agent-skills/skills .agents/skills
```

## Update marketplace

```bash
cd .agentic/open-agent-skills
git fetch origin
git checkout main   # or a specific tag/SHA
cd ../..
```

## Skills wired for this repo

| Skill | Purpose |
|-------|---------|
| functional-spec | Product spec + structured Q&A |
| technical-spec | Engineering spec from functional spec |
| loop-build | Implement → test → verify (screenshots) → iterate |

Bundle **spec-to-ship**: functional-spec → technical-spec → loop-build.

## Do not commit

- `.agentic/open-agent-skills/` (entire tree)
- Optional local symlinks under `.agents/`

**Do commit:** `.gitignore`, `.cursor/rules/agentic-skills.mdc`, this doc.
