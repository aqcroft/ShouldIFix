'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function read(name){return fs.readFileSync(name,'utf8');}
function scriptBlocks(html){
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1])&&!/application\/ld\+json/.test(m[1])&&m[2].trim())
    .map(m=>m[2]);
}
for(const file of ['Oct2026.html','renewal-builder-v1.html']){
  test(file+' scripts compile and both forecast controls exist',()=>{
    const html=read(file);
    for(const block of scriptBlocks(html))new vm.Script(block,{filename:file});
    assert.match(html,/forecastControlMarkup\(janRise\)/);
    assert.match(html,/function setJanRise\(value\)\{\s*forecastScenarioMode='percent'/);
    assert.doesNotMatch(html,/forecast-mode-tabs|setForecastScenarioMode/);
    assert.match(html,/\[10,10\.5,11,11\.5,12,13\]/);
    assert.match(html,/\.forecast-unit-row\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
    assert.match(html,/forecastScenarioMode==='unit'/);
    assert.match(html,/p\.set\('um','1'\)/);
    assert.match(html,/forecastElecUnit=33,forecastElecUnit|forecastGasUnit=11,forecastElecUnit=33/);
    for(const value of [10,10.5,11,11.5,12,13,30,31,32,33,34,35])assert.match(html,new RegExp('\\b'+value+'\\b'));
  });
  test(file+' unit mode gives January average unit rate with regional proportional factor',()=>{
    const html=read(file);
    const controls=html.slice(html.indexOf('let forecastScenarioMode='),html.indexOf('/* Forecast split:',html.indexOf('let forecastScenarioMode=')));
    const model=html.slice(html.indexOf('const forecastStepCache=new Map();'),html.indexOf('/* ---------- EV / ECONOMY 7 EXTENSION ---------- */'));
    assert(controls.length>0&&model.length>0);
    const page={mode:'dual'};
    const scope={
      window:{},document:{querySelector:()=>({dataset:{mode:page.mode}})},
      forecastScenarioValues:()=>[28.8,30,35],render:()=>{},Map,Math,Number,
      REGIONS:[{cap:{octdec:{eSC:50,eU:26,gSC:30,gU:8},julsep:{eSC:48,eU:25,gSC:28,gU:7}}}],
      FORECAST_MED_E:2500,FORECAST_MED_G:9500,FORECAST_E_SHAPE:7.6,FORECAST_G_SHAPE:12.2,
      APR_FROM_JAN:1.064,JUL_FROM_APR:0.907
    };
    vm.runInNewContext(controls+model,scope);
    const initial=vm.runInNewContext('forecastControlMarkup(28.8)',scope);
    assert.match(initial,/Percentage increase/);
    assert.match(initial,/Gas \(p\/kWh\)/);
    assert.match(initial,/Electricity \(p\/kWh\)/);
    assert.match(initial,/data-forecast-method="percent"/);
    assert.match(initial,/data-forecast-method="unit"/);
    assert.match(initial,/aria-pressed="true">\+28\.8%/);
    assert.doesNotMatch(initial,/aria-pressed="true">11p/);
    assert.doesNotMatch(initial,/forecast-mode-tabs|setForecastScenarioMode/);
    page.mode='elec';
    const onlyElectricity=vm.runInNewContext('forecastControlMarkup(28.8)',scope);
    assert.doesNotMatch(onlyElectricity,/Gas \(p\/kWh\)/);
    assert.match(onlyElectricity,/Electricity \(p\/kWh\)/);
    page.mode='gas';
    const onlyGas=vm.runInNewContext('forecastControlMarkup(28.8)',scope);
    assert.match(onlyGas,/Gas \(p\/kWh\)/);
    assert.doesNotMatch(onlyGas,/Electricity \(p\/kWh\)/);
    page.mode='dual';
    vm.runInNewContext('setForecastUnit("gas",11);',scope);
    const units=vm.runInNewContext('forecastControlMarkup(28.8)',scope);
    assert.match(units,/aria-pressed="true">11p/);
    assert.match(units,/aria-pressed="true">33p/);
    assert.doesNotMatch(units,/aria-pressed="true">\+28\.8%/);
    assert.equal((units.match(/forecast-method-used/g)||[]).length,1);

    const before=vm.runInNewContext('forecastSteps(28.8)',scope);
    assert(Math.abs(before.jan.e-33/26)<1e-8);
    assert(Math.abs(before.jan.g-11/8)<1e-8);
    assert(before.apr.e>before.jan.e);
    const absolute=vm.runInNewContext('projectedCapRate(REGIONS[0],"jan",28.8)',scope);
    assert(Math.abs(absolute.eU-33)<1e-8);
    assert(Math.abs(absolute.gU-11)<1e-8);
    assert(absolute.eSC===50&&absolute.gSC===30);
    vm.runInNewContext('setForecastUnit("gas",10.5);',scope);
    assert(Math.abs(vm.runInNewContext('forecastSteps(28.8).jan.g',scope)-10.5/8)<1e-8);
    vm.runInNewContext('setForecastUnit("gas",11.5);',scope);
    assert(Math.abs(vm.runInNewContext('forecastSteps(28.8).jan.g',scope)-11.5/8)<1e-8);
    vm.runInNewContext('setForecastUnit("elec",35);',scope);
    assert(Math.abs(vm.runInNewContext('forecastSteps(28.8).jan.e',scope)-35/26)<1e-8);
    // The percentage buttons restore the percentage calculation mode.
    vm.runInNewContext('forecastScenarioMode="percent";',scope);
    const percentAgain=vm.runInNewContext('forecastControlMarkup(28.8)',scope);
    assert.match(percentAgain,/aria-pressed="true">\+28\.8%/);
    assert.doesNotMatch(percentAgain,/aria-pressed="true">35p/);
    assert.equal((percentAgain.match(/forecast-method-used/g)||[]).length,1);
    page.mode='elec';
    vm.runInNewContext('setForecastUnit("gas",12);',scope);
    assert.equal(vm.runInNewContext('forecastScenarioMode',scope),'percent');

    assert.notEqual(vm.runInNewContext('forecastSteps(28.8).jan.e',scope),35/26);
  });
}
