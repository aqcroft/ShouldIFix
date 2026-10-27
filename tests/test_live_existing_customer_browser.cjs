"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const url="https://aqcroft.github.io/ShouldIFix/renewal-builder-v1.html?existing=1";
(async()=>{
 const browser=await chromium.launch({
   headless:true,
   ...(process.env.CI_BROWSER_PATH?{executablePath:process.env.CI_BROWSER_PATH}: {})
 });
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",err=>errors.push(err.message));
 try{
   const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
   assert(response?.ok(),"Renewal page must load");
   await page.locator("#renewalBuilder").waitFor({state:"visible",timeout:25000});
   assert.equal(await page.locator("#comparisonSwitch").isVisible(),false,"Direct builder should hide legacy comparison choice");
   assert.equal(await page.locator("#generalControls").isVisible(),false,"Direct builder should hide duplicate region controls");
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
   const shareUrl=await page.locator("#builderPreviewLink").getAttribute("href");
   assert(shareUrl&&shareUrl.includes("renew=1")&&shareUrl.includes("bp=155.00"),
     "Share link must preserve the renewal mode and entered monthly payment");
   const params=new URL(shareUrl).searchParams;
   assert(params.get("ending")&&params.get("offered"),"Customer link must preserve BOTH tariff selections");
   const customer=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
   const customerErrors=[];customer.on("pageerror",err=>customerErrors.push(err.message));
   const response2=await customer.goto(shareUrl,{waitUntil:"domcontentloaded",timeout:60000});
   assert(response2?.ok(),"Customer shared view must load");
   await customer.locator("#renewalStory").waitFor({state:"visible",timeout:85000});
   await customer.waitForFunction(()=>{
     const label=document.querySelector("#renewalStatus");
     return label&&/Selected current and renewal tariff rates loaded/i.test(label.textContent||"");
   },{timeout:85000});
   assert(await customer.locator("#renewalBuilder").isHidden(),"Customer should NOT see partner's builder inputs");
   const pay=await customer.locator("#renewalBudgetMonthly").inputValue();
   const restoredEnding=await customer.locator("#renewalEnding").inputValue();
   const restoredOffered=await customer.locator("#renewalOffered").inputValue();
   assert.equal(pay,"155.00");
   assert.equal(restoredEnding,params.get("ending"));
   assert.equal(restoredOffered,params.get("offered"));
   assert(!customerErrors.length,"Customer page errors: "+customerErrors.join("; "));
   console.log("Customer share view: successful, partner builder hidden, both tariff IDs and £155 preserved.");
   await customer.screenshot({path:"test-artifacts/customer-mobile.png",fullPage:true});
   await customer.close();
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
