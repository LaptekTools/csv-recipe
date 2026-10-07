# CSV Recipe

A free browser utility for repeating the same CSV column selection. Select columns, reorder them, rename the headings and save a small JSON recipe for the next export. It is an experimental original tool made with AI assistance, not a paid product or an official GitLab integration.

The intended use is an already-exported project report that must match the same internal template each week. It does not fetch missing fields, update GitLab, infer types or decide which columns should be shared.

## Use

[Open CSV Recipe in your browser](https://vit-percentage-recovery.cektekstudios.chatgpt.site/csv-recipe/). No account or installation.

1. Choose a UTF-8 comma-separated CSV.
2. Choose columns, exported headings and order, or load your saved recipe.
3. Click **Check and preview**. This dry run downloads nothing.
4. Download the checked CSV and optionally **Save recipe** for next time.

The browser page can be hosted directly from `index.html`, `core.js`, `app.js` and `style.css`; no build, API key, account or package installation. The linked alternative HTTPS host has been checked with fictional inputs, actual downloaded CSV/recipe files and recipe reuse. The separate GitHub Pages deployment remains pending; it is not required to try this link. Source ZIPs are available through GitHub's Code menu. Direct file-origin behaviour was not verified in the development browser because its URL policy permits only HTTP/HTTPS.

## Try a fictional example

Download [week-one.csv](week-one.csv) and [report-recipe.json](report-recipe.json): open each file on GitHub and choose **Download raw file**. In the browser tool, select the CSV, load the recipe, then click **Check and preview**. Expect four columns and Ticket ID `00017`. **Download CSV** saves the result; preview alone does not.

Then choose [week-two.csv](week-two.csv) and preview again. The saved mapping should still work after the input columns move; Ticket ID becomes `00018`. If starting in a fresh tab, select the new CSV first, then load your saved recipe.

[Full worked example and expected outputs](WALKTHROUGH.md). The files are fictional; this example is not customer-use evidence. Do not upload private data to repository Issues.

## What stays unchanged

Selected values remain strings, including leading zeros, empty fields, commas, quoted text and multiline descriptions. Input column order may change; sources are matched by exact heading. Missing or duplicate source columns, inconsistent row widths and malformed quoting produce errors instead of a guessed output. The source file is never overwritten.

**Formula handling changes data by default:** formula-like cells/headings receive an apostrophe and the download is labelled `.modified.csv`. Negative numbers can also be prefixed. Unchecking the option preserves original selected strings, including values a spreadsheet may execute. This heuristic is not a guarantee for every spreadsheet application. CSV quoting/record separators are normalized; it is not a byte-for-byte copy of the original file.

Limits:10MiB,50,000data rows,120columns,UTF-8/comma/doublequote CSV. Recipe version1 contains source/output names only, no executable expressions. Stop/reset clears the tab's current data and invalidates pending reads. Closing the tab stops the app; there is no automatic restart or background worker.

## Privacy

CSV and recipe contents are processed in the browser. No upload endpoint, analytics, external library, API request, account or checkout is implemented. Downloaded files remain on your computer. The linked web host receives ordinary page requests. When hosted on GitHub Pages, ordinary page requests also reach GitHub; [GitHub documents security logging of visitor IP addresses](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection). This is separate from CSV contents, which the app does not send.

## Feedback on a real task

If you used it, an issue with these details is useful:

- What report were you preparing, and what did you use before?
- Did you reuse the saved recipe on a second export? Did anything fail?
- How much manual work did it actually remove, including checking the output?
- If an additional repeated task remains, describe it. Would a separate tool solving those extra requirements be worth EUR9one-time? That is optional, nonbinding research; the current code remains free and there is nothing to buy.

Do not attach customer exports, personal data, tokens or private source. Use fictional examples or a short nonsensitive description. Stars and downloads do not establish customer value or revenue. No reply means unknown demand, not proven product failure.

## Existing alternatives and evidence

[csvcut](https://csvkit.readthedocs.io/en/latest/scripts/csvcut.html) already selects named columns in a specified order. [OpenRefine](https://openrefine.org/docs/manual/exporting) offers a GUI exporter with reusable JSON settings. Use those if they fit. This project tests a small browser workflow, not a unique algorithm.

Twelve local fixture groups passed:26column fictional exports, reordered sources, saved recipes, Unicode/multiline CSV, malformed/drift/duplicate inputs, formula modes, limits, deterministic repeat/reload and mocked stale-output/reset paths. Actual desktop browser checks verified file selection, preview, CSV and recipe downloads, reuse on reversed headers, duplicate errors and reset; a narrow-screen layout was reviewed. Actual phone, a complete keyboard-only journey and direct file-origin behaviour remain unverified. No actual customer time-saving or paid demand has been measured.

Tests: `node test.js` from this folder. No dependencies. Development runtime version is recorded in the release evidence. The10,000x26fictional input was4.31MB; one Node parse+transform measurement was111ms. This is not a browser benchmark, a guaranteed limit or a whole-business cost estimate. Tests never send customer files or money.

MIT license. No payment link, donation processor or paid service.
