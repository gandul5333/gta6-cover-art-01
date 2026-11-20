# Vice Coast Cover Studio — GTA-style cover art maker

[![make.fun](https://make.fun/api/badge/competition/gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun](https://make.fun/api/badge/reward/gta6-cover-art-01/gandul5333/gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun](https://make.fun/api/badge/entry/gandul5333/gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01)

A free, offline web app that turns your own photos and a caption into GTA 6-style
multi-panel poster cover art — a Vice City sunset or neon colour grade, bold display
lettering, exported as a PNG to share. No upload, no account, no network: open
`app/index.html` in desktop Chrome and it just works.

## What it does

- **Any photo** — add your own photos from your machine (they never leave it), or load
  the two bundled samples. Fill several panels with one photo or several, one per panel.
- **Crop and position each panel** — click a panel in the live preview, drag to pan the
  photo, scroll (or use the slider) to zoom, or hit *Fit photo* to reset it.
- **Four poster layouts** — Poster 4 (hero + three), Hero 4 (hero on top), a Nine-panel
  grid, and Full bleed — plus five colour grades: Sunset, Neon, Vice, Golden, Noir.
- **Bold caption lettering** — an eyebrow line, a big gradient title in Anton, and a
  neon script subtitle in Pacifico, all editable live. The cover also gets a glowing
  sun disc, film grain and a vignette.
- **Fast and easy** — photo to PNG in a few clicks, at the three common post sizes:
  1080 × 1080, 1080 × 1350 and 1920 × 1080.

## Try it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

Or open `app/index.html` directly from any static file server.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output dir and writes
`dossier.json` with the vendored make.fun library. Screenshots are taken from the
app's own `?shot=` scenes with headless Chromium (see `shots.json`).

## Originality

Everything here is original work: no Rockstar Games logo, wordmark, artwork,
character or font. The display fonts are Anton and Pacifico, both under the SIL
Open Font License — see `app/fonts/OFL-Anton.txt` and `app/fonts/OFL-Pacifico.txt`.
The two sample photos in `app/samples/` were made with an image model for make.fun
and are free to use.

## License

MIT — see [LICENSE](LICENSE).
