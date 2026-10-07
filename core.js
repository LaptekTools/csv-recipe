/* Original local mechanism prototype. No expressions, network or dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CsvRecipe = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMITS = Object.freeze({bytes: 10 * 1024 * 1024, rows: 50000, columns: 120});
  function fail(message) { throw new Error(message); }
  function parse(text) {
    if (typeof text !== 'string') fail('CSV must be text.');
    if (new TextEncoder().encode(text).byteLength > LIMITS.bytes) fail('CSV exceeds 10 MiB.');
    if (text.startsWith('\uFEFF')) text = text.slice(1);
    if (!text.length) fail('CSV is empty.');
    const rows = []; let row = [], cell = '', state = 'plain', atStart = true, pending = false;
    function field() {
      row.push(cell); cell = ''; state = 'plain'; atStart = true;
      if (row.length > LIMITS.columns) fail('More than 120 columns.');
    }
    function record() {
      field(); rows.push(row); row = []; pending = false;
      if (rows.length > LIMITS.rows + 1) fail('More than 50000 data rows.');
    }
    for (let i = 0; i < text.length; i++) {
      const c = text[i]; pending = true;
      if (state === 'quoted') {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else state = 'closed';
        } else cell += c;
        continue;
      }
      if (state === 'closed' && c !== ',' && c !== '\r' && c !== '\n') fail('Characters after a closing quote.');
      if (c === ',') { field(); continue; }
      if (c === '\r' || c === '\n') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        record(); continue;
      }
      if (c === '"') {
        if (!atStart) fail('Quote inside an unquoted field.');
        state = 'quoted'; atStart = false;
      } else { cell += c; atStart = false; }
    }
    if (state === 'quoted') fail('Unclosed quoted field.');
    if (pending || row.length) record();
    const header = rows.shift();
    if (!header || header.some(h => !h.trim())) fail('Headers must be nonblank.');
    if (new Set(header).size !== header.length) fail('Duplicate source headers.');
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].length !== header.length) fail(`Row ${i + 2} has ${rows[i].length} fields; expected ${header.length}.`);
    }
    return {header, rows};
  }
  function exactKeys(object, keys) {
    return object && typeof object === 'object' && !Array.isArray(object) &&
      Object.keys(object).sort().join('|') === keys.slice().sort().join('|');
  }
  function recipe(value) {
    if (!exactKeys(value, ['version', 'columns']) || value.version !== 1 || !Array.isArray(value.columns)) fail('Recipe must contain version1 and columns only.');
    if (!value.columns.length || value.columns.length > LIMITS.columns) fail('Select 1–120 columns.');
    const columns = value.columns.map(c => {
      if (!exactKeys(c, ['source', 'output']) || typeof c.source !== 'string' || typeof c.output !== 'string' ||
          !c.source.trim() || !c.output.trim() || c.source.length > 160 || c.output.length > 160) fail('Each column needs exact source and output names (1–160 characters).');
      return {source: c.source, output: c.output};
    });
    if (new Set(columns.map(c => c.source)).size !== columns.length) fail('Duplicate selected source.');
    if (new Set(columns.map(c => c.output)).size !== columns.length) fail('Duplicate output names.');
    return {version: 1, columns};
  }
  function stringify(rows) {
    return rows.map(row => row.map(value => {
      if (typeof value !== 'string') fail('CSV values must remain strings.');
      return /[",\r\n]/.test(value) ? '"' + value.replaceAll('"', '""') + '"' : value;
    }).join(',')).join('\r\n') + '\r\n';
  }
  function transform(table, definition, {neutralizeFormulas = true} = {}) {
    if (typeof neutralizeFormulas !== 'boolean') fail('Formula mode must be explicit boolean.');
    const checked = recipe(definition);
    const indices = checked.columns.map(c => {
      const index = table.header.indexOf(c.source);
      if (index < 0) fail(`Missing source column: ${c.source}. No fuzzy matching.`);
      return index;
    });
    let formulaCells = 0;
    const raw = [checked.columns.map(c => c.output), ...table.rows.map(row => indices.map(i => row[i]))];
    const output = raw.map(row => row.map(value => {
      if (/^[\u0000-\u0020]*[=+\-@]/.test(value)) {
        formulaCells++;
        return neutralizeFormulas ? "'" + value : value;
      }
      return value;
    }));
    return {csv: stringify(output), preview: output.slice(0, 6), recipe: checked,
      receipt: {kind: 'local_synthetic_or_user_supplied_csv', rows: table.rows.length,
        inputColumns: table.header.length, outputColumns: checked.columns.length,
        formulaLikeCells: formulaCells, neutralizedCells: neutralizeFormulas ? formulaCells : 0,
        selectedStringsPreserved: !neutralizeFormulas || formulaCells === 0,
        wholeFilePreserved: false, networkRequests: 0}};
  }
  return Object.freeze({LIMITS, parse, recipe, stringify, transform});
});
