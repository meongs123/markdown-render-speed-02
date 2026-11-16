# markdown-render-speed-02

[![make.fun](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/c/markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/meongs123/markdown-render-speed-02/rank.svg)](https://make.fun/c/markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/meongs123/markdown-render-speed-02/reward.svg)](https://make.fun/c/markdown-render-speed-02)

A fast, dependency-free drop-in for [marked](https://github.com/markedjs/marked)
18.1.3: `parse(markdown)` returns byte-identical HTML to `marked.parse`
with marked's default options (GFM on, async off), but faster.

## How it works

`parse.js` starts from marked 18.1.3's own `lib/marked.esm.js` (MIT, see
`vendor/marked/LICENSE` and `vendor/marked/NOTICE`), then is optimised step
by step without changing its output. Each step is verified with the kit's
`grade-local` (720/720 cases) and logged in [CHANGES.md](CHANGES.md).

`main.ts` is the harness driver: it reads `/input/cases.json`, renders each
case with `parse`, and writes `/output/html.json`. No clock, no randomness,
no network, no dependencies beyond Node's built-ins.

## Files

- `parse.js` — the renderer (dependency-free ES module)
- `main.ts` — the driver
- `vendor/marked/` — marked 18.1.3 attribution (LICENSE, NOTICE)
- `CHANGES.md` — optimisation log, one verified round per row
