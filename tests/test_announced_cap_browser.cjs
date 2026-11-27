'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CI_BROWSER_PATH?{executablePath:process.env.CI_BROWSER_PATH}:{})});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   // Deterministic fixture only: no dependency on live supplier tariff service.
   const tariffLive=Array.from({length:14},(_,i)=>({region_no:10+i,payment_method:'DD',tariff_type:'fixed',tariff_name:'Fixed Saver 104',fixed_series:104,GDSC:17,GUR:9,EDSC_Std:53,EUR_Std:28,fixed_end_date:'2027-10-30'}));
   await page.route('**/script.google.com/**',route=>route.fulfill({json:{tariffLive}}));
   await page.route('**/fonts.googleapis.com/**',route=>route.abort());
   await page.goto('http://127.0.0.1:8765/Oct2026.html?cr=20261127&local=1');
   await page.waitForFunction(()=>document.body.dataset.tariffDataStatus==='verified');
   assert.deepEqual(errors,[]);
   await page.locator('#resultCard').waitFor({state:'visible'});
   assert(await page.locator('.chart-forecast-label').first().textContent().then(s=>s.includes('January confirmed')));
   const initial=await page.evaluate(()=>{
    const s=state();return {jan:projectedCapRate(s.region,'jan',s.janRise),share:buildShareUrl(s),label:phaseForecastLabel('jan',s.janRise),total:compute({region:s.region,elecY:s.elecY,gasY:s.gasY,mode:s.mode,fix:s.region.uw,disc:0,janRise:s.janRise,electricHeat:false}).yCap};
   });
   assert.deepEqual(initial.jan,{eSC:51.38,eU:31.65,gSC:29.37,gU:10.81});
   assert.equal(initial.label,'Confirmed');assert(new URL(initial.share).searchParams.get('cr')==='20261127');
   await page.evaluate(()=>activateForecastMethod('unit'));
   assert.equal(await page.evaluate(()=>phaseForecastLabel('jan',state().janRise)),'Confirmed');
   await page.evaluate(()=>openForecastSource());
   assert((await page.locator('#forecastPanelSource').innerText()).includes('£2,222'));
   assert((await page.locator('#forecastPanelSource').innerText()).includes('23 November'));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'horizontal overflow');
   await page.close();
  }
  console.log('Phone and desktop cap chart, source modal, share revision and script checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
