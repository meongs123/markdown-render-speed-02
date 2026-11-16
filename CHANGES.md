# CHANGES — optimisation log

Times are local (Node v24.22.1, this VM, `--driver process`): `bench` = median
CPU time of the parse loop over all 720 practice cases (3 runs, `process.cpuUsage`,
startup excluded); `grade` = kit `grade-local` on the practice set.
Baseline is marked 18.1.3 itself (`baselines/` in the kit). Server times will
differ (Node 26, 1-CPU container, net of the null-entry control) — local
numbers are only for comparing rounds against each other.

| round | change | cases_passed | bench cpu_us/run | vs baseline |
|------:|--------|-------------:|-----------------:|------------:|
| 0 | verbatim marked 18.1.3 inlined into parse.js + own main.ts + package.json {"type":"module"} | 720/720 | 749,233 | baseline 705,700 (parse loop only; +6% is wrapper + noise, re-measure after profiling) |
| 1 | list(): first-char pre-filter (`firstMark`) — per list line, test only the block regexes the first non-space char allows (fences `~/`, heading #, html <, blockquote >, bullet */+-/digit, hr -/_/*) instead of all 6 | 720/720 | ~692,000 | A/B interleaved vs baseline: -0.7% (within noise; regex tests were already cheap) |
| 2 | emStrong/del: replace all 7 `[...x]` spreads with allocation-free exact equivalents (`runLen`, `firstCpLen`, `lastCpBefore`) — same code-point counts, no arrays | 720/720 | 704,031 | A/B interleaved vs baseline: -0.7% (median, 9 rounds); micro-opts are below the noise floor — structural work needed next |
