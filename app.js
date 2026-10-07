'use strict';
const $ = id => document.getElementById(id);
let table = null, columns = [], current = null, generation = 0, name = 'export';
function invalidate() {
  current = null; $('download').disabled = true; $('saveRecipe').disabled = true;
  $('previewTable').replaceChildren(); $('receipt').textContent = '';
}
function status(text, error = false) { $('status').textContent = text; $('status').dataset.error = String(error); }
function displayColumns() {
  const holder = $('columns'); holder.replaceChildren();
  columns.forEach((c, index) => {
    const row = document.createElement('div'); row.className = 'column';
    const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = c.enabled;
    enabled.setAttribute('aria-label', `Include ${c.source}`);
    enabled.addEventListener('change', () => { c.enabled = enabled.checked; invalidate(); });
    const label = document.createElement('label'); label.textContent = c.source;
    const output = document.createElement('input'); output.type = 'text'; output.value = c.output; output.maxLength = 160;
    output.setAttribute('aria-label', `Exported heading for ${c.source}`);
    output.addEventListener('input', () => { c.output = output.value; invalidate(); });
    const moves = document.createElement('div'); moves.className = 'moves';
    [-1, 1].forEach(direction => {
      const button = document.createElement('button'); button.textContent = direction < 0 ? '↑' : '↓';
      button.setAttribute('aria-label', `Move ${c.source} ${direction < 0 ? 'up' : 'down'}`);
      button.disabled = index + direction < 0 || index + direction >= columns.length;
      button.addEventListener('click', () => {
        [columns[index], columns[index + direction]] = [columns[index + direction], columns[index]];
        invalidate(); displayColumns();
      }); moves.append(button);
    }); row.append(enabled, label, output, moves); holder.append(row);
  });
}
async function fileText(file, maxBytes) {
  if (!file) throw new Error('Choose a file.');
  if (file.size > maxBytes) throw new Error('File exceeds the supported size limit.');
  return new TextDecoder('utf-8', {fatal: true}).decode(await file.arrayBuffer());
}
$('csvFile').addEventListener('change', async () => {
  const token = ++generation; invalidate(); table = null; $('preview').disabled = true;
  try {
    const file = $('csvFile').files[0];
    const text = await fileText(file, CsvRecipe.LIMITS.bytes);
    if (token !== generation) return;
    table = CsvRecipe.parse(text); name = file.name.replace(/\.csv$/i, '').replace(/[^\w.-]/g, '_') || 'export';
    if (!columns.length) columns = table.header.map(source => ({source, output: source, enabled: true}));
    displayColumns(); $('preview').disabled = false;
    status(`Loaded ${table.rows.length} rows. Existing recipe selections remain exact; check the preview.`);
  } catch (error) {
    if (token !== generation) return;
    columns = []; displayColumns(); status(error.message, true);
  }
});
$('recipeFile').addEventListener('change', async () => {
  const token = ++generation; invalidate();
  try {
    const text = await fileText($('recipeFile').files[0], 65536);
    if (token !== generation) return;
    const checked = CsvRecipe.recipe(JSON.parse(text));
    columns = checked.columns.map(c => ({...c, enabled: true})); displayColumns();
    status('Recipe loaded. Choose a CSV if needed, then check the preview.');
  } catch (error) {
    if (token === generation) { columns = []; displayColumns(); status(error.message, true); }
  }
});
$('neutralize').addEventListener('change', invalidate);
$('preview').addEventListener('click', () => {
  invalidate();
  try {
    if (!table) throw new Error('Choose a valid CSV first.');
    const definition = {version: 1, columns: columns.filter(c => c.enabled).map(({source, output}) => ({source, output}))};
    current = CsvRecipe.transform(table, definition, {neutralizeFormulas: $('neutralize').checked});
    const grid = document.createElement('table');
    current.preview.forEach((row, i) => {
      const tr = document.createElement('tr'); row.forEach(value => { const cell = document.createElement(i ? 'td' : 'th'); cell.textContent = value; tr.append(cell); }); grid.append(tr);
    }); $('previewTable').append(grid); $('receipt').textContent = JSON.stringify(current.receipt, null, 2);
    $('download').disabled = false; $('saveRecipe').disabled = false;
    status(current.receipt.neutralizedCells ? `Ready. ${current.receipt.neutralizedCells} formula-like cells modified; download is labelled modified.` :
      current.receipt.formulaLikeCells ? 'Ready in original-string mode. Formula-like values may execute in a spreadsheet.' : 'Ready. Selected strings preserved; other columns omitted.');
  } catch (error) { status(error.message, true); }
});
function download(data, filename, type) {
  const url = URL.createObjectURL(new Blob([data], {type})); const link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('download').addEventListener('click', () => { if (current) download(current.csv, name + (current.receipt.neutralizedCells ? '.modified.csv' : '.selected.csv'), 'text/csv;charset=utf-8'); });
$('saveRecipe').addEventListener('click', () => { if (current) download(JSON.stringify(current.recipe, null, 2) + '\n', 'column-recipe.json', 'application/json'); });
$('reset').addEventListener('click', () => {
  generation++; table = null; columns = []; invalidate(); displayColumns();
  $('csvFile').value = ''; $('recipeFile').value = ''; $('neutralize').checked = true; $('preview').disabled = true;
  status('Stopped and reset. In-flight reads cannot commit. Choose a new file to resume.');
});
