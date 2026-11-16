# CHANGES — optimisation log

Times are local (Node v24.22.1, this VM, `--driver process`): `bench` = median
CPU time of the parse loop over all 720 practice cases (3 runs, `process.cpuUsage`,
startup excluded); `grade` = kit `grade-local` on the practice set.
Baseline is marked 18.1.3 itself (`baselines/` in the kit). Server times will
differ (Node 26, 1-CPU container, net of the null-entry control) — local
numbers are only for comparing rounds against each other.

## opt-r13 (from 44a7825)

Branch `opt-r13` continues the submitted entry (rank 417/561, cpu_us
3,500,000). Before numbers, same benches as below: parse-loop interleaved
A/B median (full 720 set, `process.cpuUsage`, 7 rounds, warm-up, alternating
order) — baseline 717,273 µs vs entry 658,672 µs (−8.17%); end-to-end
(`main.ts`, bash `time` user+sys, 5 interleaved rounds) — baseline 1,763,000
µs vs entry 1,756,000 µs (−0.40%, a tie: ~1.0 s of fixed Node/JSON costs
dilute the parse-loop gain, and the server subtracts the null-entry control,
so the parse-loop ratio is the better proxy for the server net number).
Setup (not a round): README opt-r13 note, `package.json` bench script,
repo `bench.mjs` smoke benchmark, `main.ts` preallocated output + index loop
(target b; effect ~0, authorship line for the entrypoint).

| round | change | cases_passed | bench cpu_us/run | vs baseline |
|------:|--------|-------------:|-----------------:|------------:|
| 0 | verbatim marked 18.1.3 inlined into parse.js + own main.ts + package.json {"type":"module"} | 720/720 | 749,233 | baseline 705,700 (parse loop only; +6% is wrapper + noise, re-measure after profiling) |
| 1 | list(): first-char pre-filter (`firstMark`) — per list line, test only the block regexes the first non-space char allows (fences `~/`, heading #, html <, blockquote >, bullet */+-/digit, hr -/_/*) instead of all 6 | 720/720 | ~692,000 | A/B interleaved vs baseline: -0.7% (within noise; regex tests were already cheap) |
| 2 | emStrong/del: replace all 7 `[...x]` spreads with allocation-free exact equivalents (`runLen`, `firstCpLen`, `lastCpBefore`) — same code-point counts, no arrays | 720/720 | 704,031 | A/B interleaved vs baseline: -0.7% (median, 9 rounds); micro-opts are below the noise floor — structural work needed next |
| 3 | inline loop (`#t`): first-char dispatch — try only the inline tokenizers whose regex can match the first char (escape `\`, tag/autolink `<`, link/reflink `[`/`!`, emStrong `*`/`_`, codespan `` ` ``, br space/`\`, del `~`, url alnum/`._+-`), instead of all 10 per token | 720/720 | 643,025 | A/B interleaved vs baseline: **-15.1%** (B faster in all 9 rounds) |
| 4 | block loop (`blockTokens`): first-char dispatch — try only the block tokenizers whose regex can match the first char (space/tab: space/code/fences/heading/hr/blockquote/list/html/def; `` ` ``/`~`: fences; `#`: heading; `-`/`_`/`*`: hr/list; `+`/digit: list; `>`: blockquote; `<`: html; `[`: def), table/lheading/paragraph/text always tried after | 720/720 | 611,764 | A/B vs round 3: -1.6% (median, 9 rounds); cumulative vs baseline ≈ -15.0% |
| 5 | `ge()` (trailing-blank-line trim for code/html blocks): replace full `split("\n")` + `join` with a backwards `lastIndexOf` scan — same result, no line array allocated | 720/720 | 596,182 | A/B vs round 4: -1.5% (median, 13 rounds); cumulative vs baseline ≈ -17% |
| 6 | block loop: gate the expensive table regex with `tableMaybe()` — only run it when line 1 is non-blank and line 2 looks like a delimiter row (≤3 leading spaces, only `|`, `:`, `-`, space, starts with `|`, `:`, or `-`, contains a `-`) | 720/720 | 590,512 | A/B vs round 4: -3.4% (median, 13 rounds); cumulative vs baseline ≈ -19% |
| 7 | block loop: gate the expensive lheading regex with `setextMaybe()` — only run it when some line before the first blank line starts (≤3 spaces) with `=` or `-` | 720/720 | 605,289 | A/B vs round 4: -6.1% (median, 13 rounds); cumulative vs baseline ≈ -21% |
| 8 | `#n` (emStrong mask): guard the two full-string `replace` passes with `includes()` checks — skip `anyPunctuationOutsideCode` unless a backtick/backslash is present, skip `blockSkip` unless `[`, backtick, or `<` is present | 720/720 | 571,981 | A/B vs round 7: -2.2% (median, 17 rounds) |
| 9 | `lex()`: skip the whole-document `carriageReturn` regex replace when the input contains no `\r` | 720/720 | 575,195 | A/B vs round 7: -0.4% (within noise; kept — never slower, helps CR-free inputs) |
| 10 | `Dt()` (fenced-code dedent): replace split+map+join with a single `/^[^\S\n]+/gm` replace that trims each line's leading whitespace by the same amount | 720/720 | 586,561 | A/B vs round 7: -0.3% (within noise; kept — strictly less allocation) |
| 11 | `list()`: replace the `doubleBlankLine` regex test (scans the whole item raw) with `hasDoubleBlank()`, a manual scan from the end of the string — exactly equivalent to `/\n[ \t]*\n[ \t]*$/` | 720/720 | 563,961 | A/B vs round 7: -4.5% (median, 17 rounds); cumulative vs baseline ≈ -24% |
| 12 | `he()` (link href encoder): only run the `%25` → `%` replace when the encoded href actually contains `%25` | 720/720 | 555,794 | A/B vs round 11: -1.5% (median, 17 rounds); cumulative vs baseline -21.3% (median, 17 rounds, B faster in all 17) |
| 13 | `list()`: replace the three `split(<newline>,1)[0]` first-line extractions with `firstLine()` (one `indexOf` + `slice`, no array allocation) — exactly equivalent | 720/720 | 562,979 | vs 44a7825, same session, interleaved: parse-loop −3.76% (9 rounds, A 584,958 µs), end-to-end via main.ts −3.18% (5 rounds, A 1,605,000 µs → B 1,554,000 µs); equiv synth 200 + fuzz 3,062 = 0 mismatches |
| 14 | `list()`: replace the three `!x.trim()` blank tests with `/^\s*$/.test(x)` (same whitespace set, no trimmed-string allocation) | 720/720 | 563,392 | vs 44a7825, same session, interleaved: parse-loop −1.67% (9 rounds, A 572,937 µs), end-to-end 0.00% (5 rounds, A 1,572,000 µs = B 1,572,000 µs); B parse-loop flat vs round 13 (562,979 → 563,392 µs, +0.07%) — NO measurable gain, kept (allocation-free, never slower in the parse loop); equiv synth 200 + fuzz 3,062 = 0 mismatches |
