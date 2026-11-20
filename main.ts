// Vice Coast Cover Studio — the hand-in program for gta6-cover-art-01 (Node 22, stdlib only).
// It copies the offline web app (app/) and its screenshots (screenshots/) from beside this
// file into /output, then writes /output/dossier.json with buildDossier from the vendored
// make.fun library (vendor/makefun-app.ts, the kit's copy, unchanged). The grader runs this
// program twice in a fresh container with no network; both runs must write the same bytes.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output dir so a stale file from an earlier run can never leak in.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// The app itself: static files only, app/index.html at its root, no build step, no network.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// The screenshots: 3 or 4 images, the first by name is the cover.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier the judge reads, built by the kit's own library from what was just copied.
// The caps mirror the sealed gate (reference/gate.json): dossier text at most 160 KiB,
// at most 4 screenshots of 256 KiB, app/ at most 993 files and 48 MiB in all.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
