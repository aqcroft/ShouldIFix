"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('forecast-data.json','utf8')),read=f=>fs.readFileSync(f,'utf8');
const jan=data.periods[1].average.change_pct,apr=data.periods[2].average.change_pct,jul=data.periods[3].average.change_pct;
test('November MSE approved file is internally consistent',()=>{
 assert.equal(jan,28.8);assert.equal(apr,6.4);assert.equal(jul,-9.3);
 assert.equal(data.periods[1].average.annual_gbp,2219);
});
for(const file of ['Oct2026.html','renewal-builder-v1.html'])test(file+' initial forecast, controls and supplier table match approved JSON',()=>{
 const s=read(file);
 for(const [label,fragment] of Object.entries({
  'revision':'name="forecast-bundled-revision" content="'+data.revision+'"',
  'Jan':'let DEFAULT_JAN_RISE='+jan+';',
  'April':'let APR_FROM_JAN='+(1+apr/100)+';',
  'July':'JUL_FROM_APR='+(1+jul/100)+';',
  'chosen':'id="janRise" type="hidden" value="'+jan+'"',
  'MSE default':'id="forecastDefault" type="hidden" value="'+jan+'"',
  'buttons':'[DEFAULT_JAN_RISE,30,35]',
  'source period':'week beginning 2 November 2026',
  'version':'App version: 2.66.17',
  'feed cache':'forecast-feed.js?v=2.66.17',
  'gas':'[10,10.5,11,11.5,12,13]',
  'electricity':'[30,31,32,33,34,35]',
  'unit default':"forecastScenarioMode='percent',forecastGasUnit=11,forecastElecUnit=33"
 }))assert(s.includes(fragment),file+': missing '+label);
 assert.doesNotMatch(s,/25%|12 October 2026|week starting 12 Oct/);
 const panel=s.split('id="forecastPanelSource"')[1].split('id="forecastPanelModel"')[0];
 for(const supplier of [...data.suppliers,{name:'Average',values:data.periods.map(p=>p.average)}]){
  assert(panel.includes(supplier.name),file+': supplier '+supplier.name);
  for(const v of supplier.values)if(v){
   assert(panel.includes((v.change_pct>=0?'Up ':'Down ')+Math.abs(v.change_pct)+'%'),file+': pct '+v.change_pct);
   assert(panel.includes('£'+v.annual_gbp.toLocaleString('en-GB')+' a year'),file+': amount '+v.annual_gbp);
  }
 }
});
test('runtime feed prevents stale JSON from replacing approved snapshot',()=>{
 const js=read('forecast-feed.js');
 assert.match(js,/data\.revision<bundled/);assert.match(js,/Live forecast refresh unavailable/);
});
