'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const close=(x,y,label)=>assert(Math.abs(x-y)<1e-8,label+': '+x+' vs '+y);
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CI_BROWSER_PATH?{executablePath:process.env.CI_BROWSER_PATH}:{})});
 try{
  for(const file of ['Oct2026.html','renewal-builder-v1.html']){
   for(const fuel of ['dual','elec','gas']){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    try{
     const url='http://127.0.0.1:8765/'+file+'?r=11&f='+fuel+'&e=3000&g=12000'+(file.includes('renewal')?'&existing=1':'');
     const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
     assert(response&&response.ok(),url+' failed to load');
     await page.waitForFunction(()=>typeof forecastControlMarkup==='function'&&document.querySelector('#fuelSeg button[aria-pressed="true"]'),{timeout:20000});
     const snapshot=()=>page.evaluate(()=>{
       const tmp=document.createElement('div');
       tmp.innerHTML=forecastControlMarkup(Number(document.getElementById('janRise').value));
       const percent=tmp.querySelector('[data-forecast-method="percent"]'),unit=tmp.querySelector('[data-forecast-method="unit"]');
       const s=state(),fix=s.region.uw;
       const result=compute({region:s.region,elecY:3000,gasY:12000,mode:s.mode,fix,disc:0,
         janRise:s.janRise,electricHeat:false,tracker:null,variable:null});
       const rates=forecastDefaultUnitRates();
       return {fuel:forecastSelectedFuelMode(),mode:forecastScenarioMode,
        percentActive:percent.classList.contains('is-active'),unitActive:unit.classList.contains('is-active'),
        percentCount:percent.querySelectorAll('.chart-scenarios button').length,
        gasCount:unit.querySelectorAll('.forecast-unit-row.gas button').length,
        elecCount:unit.querySelectorAll('.forecast-unit-row.elec button').length,
        percentSelection:percent.querySelectorAll('.chart-scenarios button[aria-pressed="true"]').length,
        unitSelection:unit.querySelectorAll('.forecast-unit-row button[aria-pressed="true"]').length,
        percentageButtonLabels:[...percent.querySelectorAll('.chart-scenarios button')].map(x=>x.textContent),
        rateLabels:{gas:forecastRateLabel(rates.gas,'gas'),elec:forecastRateLabel(rates.elec,'elec')},
        hasTabs:!!tmp.querySelector('.forecast-mode-tabs'),activationButtons:tmp.querySelectorAll('.forecast-activate').length,
        phases:forecastSteps(s.janRise),monthly:result.rows.map(x=>x.cap),annual:result.yCap};
     });
     const initial=await snapshot();
     assert.equal(initial.fuel,fuel);
     assert.equal(initial.percentCount,6);
     assert.deepEqual(initial.percentageButtonLabels,['+15%','+20%','+25%','+28.8%','+30%','+35%']);
     assert.equal(initial.gasCount,fuel==='elec'?0:6);
     assert.equal(initial.elecCount,fuel==='gas'?0:6);
     assert(initial.percentActive&&!initial.unitActive&&initial.percentSelection===1&&initial.unitSelection===0);
     assert.equal(initial.activationButtons,2);
     assert(!initial.hasTabs);
     assert.equal(initial.rateLabels.gas,'11.36p');
     assert.equal(initial.rateLabels.elec,'33.3p');
     await page.evaluate(()=>activateForecastMethod('unit'));
     const unit=await snapshot();
     assert(unit.unitActive&&!unit.percentActive&&unit.percentSelection===0&&unit.unitSelection===(fuel==='dual'?2:1));
     for(const phase of ['jan','apr','jul','flat']){
       close(initial.phases[phase].e,unit.phases[phase].e,file+' '+fuel+' '+phase+' elec parity');
       close(initial.phases[phase].g,unit.phases[phase].g,file+' '+fuel+' '+phase+' gas parity');
     }
     for(let m=0;m<unit.monthly.length;m++)close(initial.monthly[m],unit.monthly[m],file+' '+fuel+' month '+m);
     close(initial.annual,unit.annual,file+' '+fuel+' annual savings baseline');
     // Simulate a manually stressed irrelevant fuel, independently of UI controls.
     if(fuel!=='dual'){
       await page.evaluate(f=>{if(f==='elec')forecastGasUnit=13;else forecastElecUnit=35;},fuel);
       const otherFuel=await snapshot();
       for(let m=0;m<unit.monthly.length;m++)close(otherFuel.monthly[m],unit.monthly[m],file+' '+fuel+' independent month '+m);
       close(otherFuel.annual,unit.annual,file+' '+fuel+' independent yearly');
     }
     await page.evaluate(f=>{setForecastUnit(f==='gas'?'gas':'elec',f==='gas'?11.5:34);},fuel);
     const stressed=await snapshot();
     assert(stressed.unitActive);
     await page.evaluate(()=>activateForecastMethod('percent'));
     const back=await snapshot();
     assert(back.percentActive&&!back.unitActive&&back.unitSelection===0&&back.percentSelection===1);
     for(let m=0;m<initial.monthly.length;m++)close(initial.monthly[m],back.monthly[m],file+' '+fuel+' reverted month '+m);
     console.log('PASS',file,fuel,'exact model parity, fuel independence, six percentages and activation');
    }finally{await page.close();}
   }
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
