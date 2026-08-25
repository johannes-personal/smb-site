#!/usr/bin/env python3
"""Run the template. Not read it, not typecheck it in your head — run it.

The skill shipped 5,000 lines of code that nobody had executed since it gained
collections. It did not compile: a missing `getCatalogue()`, a missing
`content/collections.json` that `/api/seed` imports, a `FieldDef` with no
`filterable` field that `puck.config.tsx` reads, and a dependency still on
`@measured/puck`, deprecated in favour of `@puckeditor/core`.

Four faults, none findable by reading, all findable in four minutes.

Prose can be stale and a reader notices. Code that is stale compiles in your
head and fails in somebody's production. That asymmetry is why this script
exists and why it is not optional:

    **The template must pass this before the skill is packaged or handed over.**

Usage:
    python scripts/selftest.py                # full run
    python scripts/selftest.py --quick        # skip the production build
    python scripts/selftest.py --keep         # leave the scratch project behind
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
STAMP = SKILL / ".selftest.json"


class Step:
    def __init__(self, name: str, cmd: list[str], cwd: Path, optional: bool = False):
        self.name, self.cmd, self.cwd, self.optional = name, cmd, cwd, optional


def run(step: Step) -> tuple[bool, str]:
    started = time.time()
    try:
        proc = subprocess.run(
            step.cmd,
            cwd=step.cwd,
            capture_output=True,
            text=True,
            timeout=900,
        )
    except FileNotFoundError:
        return False, f"{step.cmd[0]} is not installed"
    except subprocess.TimeoutExpired:
        return False, "timed out after 15 minutes"
    took = time.time() - started
    output = (proc.stdout + proc.stderr).strip()
    if proc.returncode == 0:
        print(f"  ok   {step.name}  ({took:.0f}s)")
        return True, ""
    print(f"  FAIL {step.name}  ({took:.0f}s)")
    # The last 40 lines is where a compiler puts the thing you need.
    tail = "\n".join(output.splitlines()[-40:])
    return False, tail


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true", help="skip the production build")
    ap.add_argument("--keep", action="store_true", help="leave the scratch project behind")
    ap.add_argument(
        "--node-modules",
        help="reuse an existing node_modules directory instead of installing",
    )
    args = ap.parse_args()

    work = Path(tempfile.mkdtemp(prefix="smb-site-selftest-"))
    target = work / "project"
    print(f"scaffolding into {target}")

    failures: list[tuple[str, str]] = []

    scaffold = subprocess.run(
        [sys.executable, str(SKILL / "scripts" / "scaffold.py"), str(target)],
        capture_output=True,
        text=True,
    )
    if scaffold.returncode != 0:
        print("  FAIL scaffold")
        print(scaffold.stdout + scaffold.stderr)
        return 1
    print("  ok   scaffold")

    # A scaffolded project must have no ROUTE__ placeholders left: those folders
    # ship renamed because archives reject square brackets in paths, and a
    # missed rename produces a site whose every dynamic route 404s.
    leftovers = [p for p in target.rglob("ROUTE__*")]
    if leftovers:
        failures.append(
            ("route placeholders", "\n".join(str(p.relative_to(target)) for p in leftovers))
        )
        print("  FAIL route placeholders")
    else:
        print("  ok   route placeholders")

    # The engine is installed from a packed tarball, exactly as a registry
    # would deliver it. Installing from a directory would hide the mistakes
    # that matter — a file left out of `files`, an export that only resolves
    # through the source tree, a peer dependency nobody declared.
    # The engine is the repository root; the skill lives in skill/. Falls back
    # to the old in-skill location so the script still works from a standalone
    # copy of the skill.
    engine = SKILL.parent
    if not (engine / "package.json").is_file():
        engine = SKILL / "assets" / "engine"
    if (engine / "package.json").is_file():
        pack = subprocess.run(
            ["npm", "pack", "--pack-destination", str(work)],
            cwd=engine, capture_output=True, text=True,
        )
        if pack.returncode != 0:
            print("  FAIL npm pack (engine)")
            print(pack.stdout + pack.stderr)
            return 1
        tarball = sorted(work.glob("*.tgz"))[-1]
        print(f"  ok   npm pack (engine) — {tarball.name}")
        # Point the shell at the tarball for this run only.
        pkg_path = target / "package.json"
        pkg = json.loads(pkg_path.read_text())
        pkg["dependencies"]["@smb-site/engine"] = f"file:{tarball}"
        pkg_path.write_text(json.dumps(pkg, indent=2) + "\n")

    if args.node_modules:
        src = Path(args.node_modules)
        if src.is_dir():
            shutil.copytree(src, target / "node_modules", symlinks=True)
            # The reused tree predates this run's engine tarball, so install it
            # on top — otherwise the run silently tests a stale engine.
            if (engine / "package.json").is_file():
                add = subprocess.run(
                    ["npm", "install", str(tarball), "--no-audit", "--no-fund"],
                    cwd=target, capture_output=True, text=True,
                )
                if add.returncode != 0:
                    print("  FAIL installing engine tarball")
                    print((add.stdout + add.stderr)[-2000:])
                    return 1
            print("  ok   node_modules (reused, engine installed fresh)")
        else:
            print(f"  FAIL node_modules: {src} is not a directory")
            return 1
    else:
        ok, out = run(Step("npm install", ["npm", "install", "--no-audit", "--no-fund"], target))
        if not ok:
            failures.append(("npm install", out))

    steps = [
        Step("typecheck", ["npx", "tsc", "--noEmit"], target),
        Step("tests", ["npx", "vitest", "run"], target),
        Step("validator", [sys.executable, str(SKILL / "scripts" / "validate.py"), "."], target),
    ]
    if not args.quick:
        steps.append(Step("next build", ["npx", "next", "build"], target))

    env_note = ""
    for step in steps:
        ok, out = run(step)
        if not ok:
            failures.append((step.name, out))

    # The template ships placeholder content, so the validator is allowed to
    # have findings — but it must not crash, and it must not error on the
    # template's own files.
    print()
    if failures:
        print(f"{len(failures)} step(s) failed:\n")
        for name, out in failures:
            print(f"--- {name} " + "-" * (60 - len(name)))
            print(out)
            print()
    else:
        print("template scaffolds, typechecks, tests and builds clean.")
        STAMP.write_text(
            json.dumps(
                {
                    "passed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "quick": args.quick,
                    "template_files": sum(1 for _ in (SKILL / "assets/template").rglob("*") if _.is_file()),
                },
                indent=2,
            )
            + "\n"
        )
        print(f"stamped {STAMP.relative_to(SKILL)}")

    if args.keep:
        print(f"\nscratch project left at {target}")
    else:
        shutil.rmtree(work, ignore_errors=True)

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
