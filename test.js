'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {performance} = require('node:perf_hooks');
const api = require('./core');
const headers = ['ID','IID','Title','Description','Type','URL','State','Confidential','Locked','Milestone','Labels','Author','Author Username','Assignee','Assignee Username','Created At (UTC)','Updated At (UTC)','Closed At (UTC)','Due Date','Start Date','Parent ID','Parent IID','Parent Title','Time Estimate','Time Spent','Weight'];
const values = headers.map(h => h === 'ID' ? '00017' : h === 'Title' ? 'Český výstup 🧪' :
  h === 'Description' ? 'First line\r\nSecond, "quoted" line' : h === 'Labels' ? 'bug, export' :
  h === 'Time Spent' ? '00090' : h === 'Weight' ? '2.00' : `value:${h}`);
const definition = {version:1,columns:[{source:'Title',output:'Report title'},{source:'ID',output:'Ticket ID'},{source:'Description',output:'Notes'},{source:'Time Spent',output:'Seconds'}]};
const source = api.stringify([headers,values]);
const results = [];
async function test(name, fn) {
  const start = performance.now();
  try { await fn(); results.push({name,status:'pass',milliseconds:+(performance.now()-start).toFixed(3)}); }
  catch(error) { results.push({name,status:'fail',error:error.stack}); }
}
function mockUI() {
  const ids = new Map();
  function element(tag) {
    return {tag,children:[],listeners:{},dataset:{},files:[],value:'',checked:false,disabled:false,
      textContent:'',className:'',attrs:{},append(...items){this.children.push(...items);},
      replaceChildren(...items){this.children=items;},setAttribute(k,v){this.attrs[k]=v;},
      addEventListener(k,v){this.listeners[k]=v;},click(){if(this.listeners.click)return this.listeners.click();}};
  }
  for(const id of ['csvFile','recipeFile','columns','neutralize','preview','download','saveRecipe','reset','status','previewTable','receipt']) ids.set(id,element(id));
  ids.get('neutralize').checked=true;
  ids.get('preview').disabled=ids.get('download').disabled=ids.get('saveRecipe').disabled=true;
  let downloads=0;
  const document={getElementById(id){return ids.get(id);},createElement(tag){const e=element(tag);if(tag==='a')e.click=()=>downloads++;return e;}};
  const context=vm.createContext({document,CsvRecipe:api,TextDecoder,Blob,URL:{createObjectURL(){return 'blob:mock';},revokeObjectURL(){}},setTimeout(fn){fn();}});
  vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),context,{filename:'app.js'});
  const e=id=>ids.get(id);
  function file(text){const bytes=new TextEncoder().encode(text);return {name:'synthetic.csv',size:bytes.length,arrayBuffer:async()=>bytes.buffer};}
  return {e,file,downloads:()=>downloads,async load(text){e('csvFile').files=[file(text)];await e('csvFile').listeners.change();}};
}
(async()=>{
await test('01 representative26column selected strings and renamed order',()=>{
  const table=api.parse(source), before=JSON.stringify(table);
  const output=api.transform(table,definition,{neutralizeFormulas:false});
  assert.deepEqual(api.parse(output.csv),{header:['Report title','Ticket ID','Notes','Seconds'],rows:[['Český výstup 🧪','00017','First line\r\nSecond, "quoted" line','00090']]});
  assert.equal(JSON.stringify(table),before);assert.equal(output.receipt.wholeFilePreserved,false);
});
await test('02 source column order changes do not change saved recipe output',()=>{
  const reversed=api.stringify([headers.toReversed(),values.toReversed()]);
  assert.equal(api.transform(api.parse(reversed),definition).csv,api.transform(api.parse(source),definition).csv);
});
await test('03 JSON recipe save/reload across a second export and exact missing names',()=>{
  const loaded=api.recipe(JSON.parse(JSON.stringify(definition)));
  const second=values.map((v,i)=>headers[i]==='ID'?'00018':v);
  const transformed=api.parse(api.transform(api.parse(api.stringify([headers,second])),loaded).csv);
  assert.equal(transformed.rows[0][1],'00018');
  assert.throws(()=>api.transform(api.parse('id,Title\n1,hello\n'),loaded),/Missing source column/);
});
await test('04 quoted data roundtrip with LF CRLF empty fields commas quotes BOM',()=>{
  const rows=[['a','b','c'],['','comma,value','"quoted"'],['line\nline','line\r\nline','🧪']];
  assert.deepEqual(api.parse('\uFEFF'+api.stringify(rows)),{header:rows[0],rows:rows.slice(1)});
  assert.deepEqual(api.parse('a,b\n1,\n'),{header:['a','b'],rows:[['1','']]});
});
await test('05 malformed quotes widths and blank duplicate headers reject before output',()=>{
  for(const text of ['', 'a,a\n1,2',',b\n1,2','a,b\n1','a,b\n1,2,3','a\n"unfinished','a\n"ok"x','a\nun"quoted'])assert.throws(()=>api.parse(text));
});
await test('06 recipe drift duplicates unknown executable-shaped fields rejected',()=>{
  for(const r of [{version:2,columns:[]},{version:1,columns:[],code:'alert(1)'},{version:1,columns:[{source:'ID',output:'x',expression:'foo'}]},
    {version:1,columns:[{source:'ID',output:'x'},{source:'ID',output:'y'}]},
    {version:1,columns:[{source:'ID',output:'x'},{source:'IID',output:'x'}]},
    {version:1,columns:[{source:'ID',output:' '}]}])assert.throws(()=>api.recipe(r));
});
await test('07 formula-like cells preserve raw or explicitly modify header and body',()=>{
  const table=api.parse('raw\n=1+2\n-4\n"  @SUM(A1)"\n0007\n');
  const r={version:1,columns:[{source:'raw',output:'=header'}]};
  const original=api.transform(table,r,{neutralizeFormulas:false});
  assert.deepEqual(api.parse(original.csv).rows,table.rows);assert.equal(original.receipt.formulaLikeCells,4);assert.equal(original.receipt.selectedStringsPreserved,true);
  const modified=api.transform(table,r);assert.equal(modified.receipt.neutralizedCells,4);assert.equal(modified.receipt.selectedStringsPreserved,false);
  assert.equal(api.parse(modified.csv).header[0],"'=header");assert.equal(api.parse(modified.csv).rows[3][0],'0007');
});
await test('08 byte row column and recipe limits stop oversized jobs',()=>{
  assert.throws(()=>api.parse('h\n'+'x'.repeat(api.LIMITS.bytes)),/10 MiB/);
  assert.throws(()=>api.parse(Array.from({length:121},(_,i)=>'c'+i).join(',')+'\n'),/120 columns/);
  assert.throws(()=>api.parse('h\n'+'x\n'.repeat(50001)),/50000 data rows/);
  assert.throws(()=>api.recipe({version:1,columns:[{source:'x'.repeat(161),output:'y'}]}));
});
await test('09 repeated deterministic exports dependency recovery and bounded workload',()=>{
  const large=api.stringify([headers,...Array.from({length:10000},(_,i)=>values.map((v,k)=>k===0?String(i).padStart(8,'0'):v))]);
  const start=performance.now(), parsed=api.parse(large), one=api.transform(parsed,definition);
  const elapsed=performance.now()-start;
  assert.equal(api.parse(one.csv).rows.length,10000);assert.equal(api.transform(parsed,definition).csv,one.csv);
  delete require.cache[require.resolve('./core')];const fresh=require('./core');assert.equal(fresh.transform(fresh.parse(large),JSON.parse(JSON.stringify(definition))).csv,one.csv);
  results.push({name:'workload_measurement',kind:'measurement_not_extra_fixture_group',rows:10000,columns:26,inputBytes:Buffer.byteLength(large),milliseconds:+elapsed.toFixed(3),processMaxRSSKiB:process.resourceUsage().maxRSS,humanUseVerified:false});
});
await test('10 mocked UI: bad next file clears prior downloadable output',async()=>{
  const ui=mockUI();await ui.load(source);ui.e('preview').click();assert.equal(ui.e('download').disabled,false);
  await ui.load('bad,bad\n1,2');assert.equal(ui.e('download').disabled,true);assert.equal(ui.e('saveRecipe').disabled,true);assert.equal(ui.e('previewTable').children.length,0);
  ui.e('download').click();assert.equal(ui.downloads(),0);
});
await test('11 mocked UI: reset invalidates an in-flight file read',async()=>{
  const ui=mockUI();let resolve;const promise=new Promise(r=>resolve=r);
  ui.e('csvFile').files=[{name:'synthetic.csv',size:source.length,arrayBuffer:()=>promise}];
  const pending=ui.e('csvFile').listeners.change();ui.e('reset').click();resolve(new TextEncoder().encode(source).buffer);await pending;
  assert.equal(ui.e('preview').disabled,true);assert.equal(ui.e('columns').children.length,0);assert.match(ui.e('status').textContent,/Stopped/);
});
await test('12 mocked UI: invalid recipe and config changes invalidate old delivery',async()=>{
  const ui=mockUI();await ui.load(source);ui.e('preview').click();ui.e('neutralize').listeners.change();assert.equal(ui.e('download').disabled,true);
  ui.e('preview').click();ui.e('recipeFile').files=[ui.file('{"version":1,"columns":[],"code":"bad"}')];await ui.e('recipeFile').listeners.change();
  assert.equal(ui.e('download').disabled,true);ui.e('preview').click();assert.equal(ui.e('download').disabled,true);assert.match(ui.e('status').textContent,/Select 1/);
});
const failures=results.filter(r=>r.status==='fail');
process.stdout.write(JSON.stringify({fixtureGroups:12,passed:results.filter(r=>r.status==='pass').length,failed:failures.length,
  scope:'Core actual Node execution; UI tests use small mocked DOM, not a browser.',results},null,2)+'\n');
process.exitCode=failures.length?1:0;
})();
