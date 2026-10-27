"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const url="https://aqcroft.github.io/ShouldIFix/renewal-builder-v1.html";
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",err=>errors.push(err.message));
 try{
   const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
   assert(response?.ok(),"Renewal page must load");
   await page.locator("#renewalBuilder").waitFor({state:"visible",timeout:25000});
   await page.locator("#renewalEndingPicks button").first().waitFor({state:"visible",timeout:85000});
   const ending=await page.locator("#renewalEndingPicks button").count();
   const offers=await page.locator("#renewalSuitePicks button").count();
   assert(ending>=3&&offers>=1,"Archive and offer selections must populate");
   const historyLabel=await page.locator("#builderArchivedRateSummary").textContent();
   console.log("Historical choices:",ending,"Offer choices:",offers,"Initial:",historyLabel);
   await page.locator("#renewalEndingPicks button").first().click();
   await page.locator("#renewalSuitePicks button").first().click();
   await page.locator("#renewalBudgetMonthly").fill("155");
   await page.locator("#builderElecExact").fill("3000");
   await page.locator("#builderGasExact").fill("12500");
   await page.waitForTimeout(1100);
   const status=await page.locator("#builderShareStatus").textContent();
   const disabled=await page.locator("#builderCopyLink").isDisabled();
   const selected=await page.locator("#builderArchivedRateSummary").textContent();
   const check=await page.locator("#renewalStatus").textContent();
   console.log("Selected tariff:",selected,"Share state:",status,"Disabled:",disabled,"Renewal:",check);
   assert(!disabled,"A complete verified selection should enable customer link");
   assert(!errors.length,"Browser runtime errors: "+errors.join("; "));
   await page.screenshot({path:"test-artifacts/renewal-mobile.png",fullPage:true});
   console.log("PASS: Live customer renewal has functional historical buttons, real rates, offer selection, annual usage and share links.");
 }catch(e){
   console.error("Live renewal browser smoke failed:",e.stack||e);
   console.error("Page errors:",errors);
   await page.screenshot({path:"test-artifacts/renewal-failure.png",fullPage:true}).catch(()=>{});
   process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
