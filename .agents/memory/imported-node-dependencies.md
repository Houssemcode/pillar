---
name: Imported Node dependencies
description: A dependency-installation quirk that can affect projects imported from zip archives.
---

Imported zip projects can contain `node_modules/.bin` launchers as regular copied files rather than symlinks. A package install may leave the broken launcher in place, so a command can resolve relative imports from the wrong directory even when the package itself is intact.

**Why:** The imported Vite launcher resolved `../dist` from `node_modules/.bin` instead of from the Vite package directory, blocking both build and dev startup.

**How to apply:** When an imported Node project reports a missing module under `node_modules/` before application code runs, inspect the failing `.bin` entry and recreate the package-manager link before changing source code.