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
