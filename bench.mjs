// Smoke benchmark for parse.js: times parse() over a built-in sample document.
// Usage: npm run bench   (or: node bench.mjs)
// Not part of the graded entry; main.ts is the harness driver.
import { parse } from './parse.js';

const sample = (
  '# Benchmark\n\nSome *emphasised* and **strong** text with `code`, ' +
  'a [link](https://example.com) and an ![image](https://example.com/i.png).\n\n' +
  '- one\n- two\n- three\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n' +
  '> a quote\n\n```js\nconst x = 1;\n```\n\n'
).repeat(40);

for (let i = 0; i < 5; i++) parse(sample); // warm up
const rounds = 20;
const t0 = process.cpuUsage();
for (let i = 0; i < rounds; i++) parse(sample);
const d = process.cpuUsage(t0);
console.log(`parse cpu_us/run: ${((d.user + d.system) / rounds).toFixed(0)} (sample ${sample.length} chars, ${rounds} rounds)`);
