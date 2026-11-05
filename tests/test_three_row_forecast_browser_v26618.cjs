'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CI_BROWSER_PATH?{executablePath:process.env.CI_BROWSER_PATH}:{})});
 try {
  for(const file of ['Oct2026.html','renewal-builder-v1.html']){
   for(const fuel of ['dual','elec','gas']){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    try {
     const url='http://127.0.0.1:8765/'+file+'?r=11&f='+fuel+'&e=3000&g=12000'+(file.includes('renewal')?'&existing=1':'');
     const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
     assert(response&&response.ok(),url+' failed to load');
     await page.waitForFunction(()=>typeof forecastControlMarkup==='function' && document.querySelector('#fuelSeg button[aria-pressed="true"]'),{timeout:20000});
     const inspect=async()=>page.evaluate(()=>{
       const tmp=document.createElement('div');tmp.innerHTML=forecastControlMarkup(Number(document.getElementById('janRise').value));
       const percent=tmp.querySelector('[data-forecast-method="percent"]'),unit=tmp.querySelector('[data-forecast-method="unit"]');
       return {fuel:forecastSelectedFuelMode(),percentActive:percent.classList.contains('is-active'),
         unitActive:unit.classList.contains('is-active'),
         percentCount:percent.querySelectorAll('button').length,
         gasCount:unit.querySelectorAll('.forecast-unit-row.gas button').length,
         elecCount:unit.querySelectorAll('.forecast-unit-row.elec button').length,
         pressedPercent:percent.querySelectorAll('button[aria-pressed="true"]').length,
         pressedUnit:unit.querySelectorAll('button[aria-pressed="true"]').length,
         hasTabs:!!tmp.querySelector('.forecast-mode-tabs'),
         hasBoth:!!tmp.querySelector('[data-forecast-method="percent"]')&&!!tmp.querySelector('[data-forecast-method="unit"]')};
     });
     let out=await inspect();
     assert.equal(out.fuel,fuel,file+': fuel mismatch '+JSON.stringify(out));
     assert(out.hasBoth&&!out.hasTabs,file+': expected both methods without tabs');
     assert.equal(out.percentCount,3,file+': percentage buttons');
     assert.equal(out.gasCount,fuel==='elec'?0:6,file+': gas button visibility');
     assert.equal(out.elecCount,fuel==='gas'?0:6,file+': electricity button visibility');
     assert(out.percentActive&&!out.unitActive&&out.pressedPercent===1&&out.pressedUnit===0,file+': percentage default '+JSON.stringify(out));
     await page.evaluate(f=>{setForecastUnit(f==='gas'?'gas':'elec',f==='gas'?11.5:34);},fuel);
     out=await inspect();
     assert(!out.percentActive&&out.unitActive&&out.pressedPercent===0&&out.pressedUnit===(fuel==='dual'?2:1),file+': unit selection '+JSON.stringify(out));
     await page.evaluate(()=>setJanRise(30));
     out=await inspect();
     assert(out.percentActive&&!out.unitActive&&out.pressedPercent===1&&out.pressedUnit===0,file+': switching back to percent '+JSON.stringify(out));
     console.log('PASS',file,fuel,JSON.stringify(out));
    } finally {await page.close();}
   }
  }
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
