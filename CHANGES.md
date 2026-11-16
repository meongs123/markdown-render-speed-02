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
