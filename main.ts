// Driver for the markdown-render-speed-02 entry (revised).
//
// The harness runs `node /bot/main.ts` (Node 22, type stripping only).
// It reads every case from /input/cases.json — or MAKEFUN_INPUT_DIR when set —
// renders each case on its own with parse() from parse.js, and writes
// /output/html.json (or MAKEFUN_OUTPUT_DIR when set): a JSON array of the
// HTML strings, one per case, in the cases' order.
//
// Written from scratch for this entry: no clock, no randomness, no network,
// no dependency beyond Node's built-ins. Renders each case exactly once,
// in input order, and writes the output only after every case rendered.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

const inputDir = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

interface Case {
  id: string;
  markdown: string;
}

const cases: Case[] = JSON.parse(readFileSync(join(inputDir, 'cases.json'), 'utf8'));
const html: string[] = cases.map((c) => parse(c.markdown));

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'html.json'), JSON.stringify(html));
