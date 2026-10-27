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
   const shareDebug=await page.evaluate(()=>{
     const card=document.querySelector("section.card.share");
     return {body:document.body.className,display:card&&getComputedStyle(card).display,
       htmlVersion:document.querySelector('meta[name="app-version"]')?.content,
       matching:card&&card.matches("body.renewal-mode section.card.share"),
       cssFound:[...document.styleSheets].some(sheet=>{
         try{return [...sheet.cssRules].some(r=>r.cssText.includes("body.renewal-mode section.card.share"));}catch(_){return false;}
       })};
   });
   console.log("Renewal share isolation diagnostic:",JSON.stringify(shareDebug));
   assert.equal(await page.locator("section.card.share").isVisible(),false,"Old prospective customer Share panel must be hidden in renewal mode");
   assert.equal(await page.locator("#builderCopyLink").isVisible(),true,"Verified customer-share control must remain visible");
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
   // New mobile results: 3 ranked summaries, a left-aligned legend and sourced quarterly costs.
   await page.locator("#renewalSavingsPair .renewal-active-choice").first().waitFor({state:"visible",timeout:20000});
   assert.equal(await page.locator("#renewalSavingsPair .renewal-active-choice").count(),3,
     "All three energy choices need compact, tappable summaries");
   assert(await page.locator("#renewalQuarterlyCosts tbody tr").count()>=4,
     "Quarterly cost comparison must use modelled months");
   assert.equal(await page.locator("#renewalPreviewWarning").isVisible(),false,
     "No obsolete beige preview warning on verified results");
   const ordered=await page.evaluate(()=>{
     const legend=document.querySelector("#renewalLineLegend"),chart=document.querySelector("#renewalFourLineChart");
     return !!(legend.compareDocumentPosition(chart)&Node.DOCUMENT_POSITION_FOLLOWING);
   });
   assert(ordered,"Legend should come immediately before the forecast chart");
   const costRows=await page.locator("#renewalLineLegend .renewal-key-item").count();
   assert.equal(costRows,3,"Chart key must label each route with monthly and annual costs");
   await page.locator("#renewalSavingsPair .renewal-saving-card").first().click();
   assert.equal(await page.locator("#renewalChoiceDetails").isVisible(),true,
     "Tap a hero to open the full explanation");
   assert(await page.locator("#renewalChoiceDetails .renewal-card-points").isVisible(),
     "Explanation modal retains benefits and cautions");
   await page.locator("#renewalChoiceDetails .renewal-modal-close").click();
   assert.equal(await page.locator("#renewalChoiceDetails").isVisible(),false);

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

   await customer.locator("#renewalSavingsPair .renewal-active-choice").first().waitFor({state:"visible",timeout:20000});
   assert.equal(await customer.locator("#renewalSavingsPair .renewal-active-choice").count(),3,
     "Customer share must have three compact summaries");
   assert(await customer.locator("#renewalQuarterlyCosts tbody tr").count()>=4,
     "Customer share retains quarterly cost table");
   assert.equal(await customer.locator("#renewalPreviewWarning").isVisible(),false,
     "No preview warning on verified customer link");
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
