# Make the same four-column report from next week's CSV

This walkthrough uses fictional records, not customer exports. Both inputs have26 columns. The second deliberately reverses their order and changes the ticket ID from00017 to00018. One saved recipe should produce the same report layout from either input.

## Try it with the sample files

Download [week-one.csv](week-one.csv), [week-two.csv](week-two.csv) and [report-recipe.json](report-recipe.json) from this folder. On GitHub, open each file and use **Download raw file**. Keep them on your computer. [Open the checked browser app](https://vit-percentage-recovery.cektekstudios.chatgpt.site/csv-recipe/). The alternative host was verified with actual downloaded fictional CSV/recipe files and recipe reuse; the separate GitHub Pages job remains pending.

1. Open CSV Recipe. Under **UTF-8 comma-separated file**, choose week-one.csv.
2. Under **Load a saved recipe**, choose report-recipe.json. Leave the formula-prefix option checked.
3. Click **Check and preview**. Expect one data row and the four headings below. Check that Ticket ID is00017 and Seconds is00090. Both are text, not automatic numeric conversions.
4. Click **Download CSV** to save week-one.selected.csv. **Check and preview** alone downloads nothing. Click **Save recipe** to save your own column-recipe.json for reuse.
5. In the same tab, choose week-two.csv as the CSV. The current selections stay in place; click **Check and preview** again. Expect the same four headings, Ticket ID00018, and Seconds00090. Download week-two.selected.csv. If you reset or opened a fresh tab, choose the CSV first and reload your saved recipe before previewing.

| Source heading | Report heading | Output position |
|---|---|---:|
| Title | Report title |1|
| ID | Ticket ID |2|
| Description | Notes |3|
| Time Spent | Seconds |4|

The Notes value has two lines and contains a comma and quotation marks. Compare the values in [expected-week-one.csv](expected-week-one.csv) and [expected-week-two.csv](expected-week-two.csv) as CSV, not by counting physical lines. A spreadsheet may still interpret downloaded text as numbers; use its explicit text-import settings if retaining leading zeros there matters. This tool does not control your spreadsheet's import behaviour.

## Use your own report layout

Choose columns with the checkboxes, edit the exported headings and move them with the arrows. Preview and check the result, then save the recipe. Sources are matched by exact heading, so reordering input columns is fine; missing or renamed headings produce an error. A saved recipe contains heading names only and cannot fetch data missing from an export.

Default formula handling prefixes formula-like values with an apostrophe; negative numbers can also change. Such downloads use .modified.csv. The sample has no such values, so its selected strings are preserved. Unchecking the option keeps original strings, including formulas a spreadsheet might execute. The heuristic does not guarantee safety in every spreadsheet. CSV quoting and record separators are normalized, so the selected output is not a byte-for-byte copy of the input.

Only UTF-8 comma/doublequote CSV is supported:10MiB,50,000data rows,120columns. No file upload, account, checkout, analytics or cloud data processing is implemented. The host receives ordinary page requests. **Stop / reset** clears current data and download readiness; closing the tab stops the app. Nothing is saved automatically.

## Tell us whether it helped on a real task

Owner tests and this fictional example are not customer-use evidence. If you used a saved recipe again on a real report, describe the task, your previous method, what failed, and time spent including checking the result in the repository's Issues. Do not attach private data or customer exports. The current code is free under MIT. There is nothing to buy. Existing free csvcut and OpenRefine may already fit your workflow better.
