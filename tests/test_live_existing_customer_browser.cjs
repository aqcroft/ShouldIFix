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
   assert(ending===2&&offers===2,"Exactly two historical (66/65) and two offered (100/99) shortcuts");
   assert.deepEqual(await page.locator("#renewalEndingPicks button b").allTextContents(),["Fixed Saver 66","Fixed Saver 65"]);
   assert.deepEqual(await page.locator("#renewalSuitePicks button b").allTextContents(),["Fixed Saver 100","Fixed Saver 99"]);
   assert.equal(await page.locator("#renewalBuilder .renewal-choice-line").count(),2,"Two tidy rows");
   assert.equal(await page.locator("#renewalBuilder .renewal-row-cog").count(),2,"Manual rate cog on each row");
   const version = await page.locator('meta[name="app-version"]').getAttribute('content');
   assert.equal(version,"2.66.8","Should I Fix version must match Companion");
   const shortcutTitles=await page.locator("#renewalSuitePicks button b").allTextContents();
   assert(shortcutTitles.every(s=>/\b(?:99|100)$/.test(s)), "Only tariffs 99 and 100 appear as shortcut buttons: "+shortcutTitles);
   assert(!shortcutTitles.some(s=>/98$/.test(s)), "Fixed 98 must not be a shortcut");
   assert.equal((await page.locator("#renewalSuitePicks button").count()),2,
     "The verified archive should expose both Fixed 99 and Fixed 100");
   const chooser=page.locator('#renewalOfferedQuickSelect').locator('xpath=ancestor::details[1]');
   assert.equal((await chooser.locator('summary').innerText()).trim(),"Choose");
   assert.equal(await chooser.evaluate(el=>el.open),false,"All-tariff select remains collapsed until requested");
   const endingHints=await page.locator("#renewalEndingPicks button span").allTextContents();
   assert(endingHints.every(h=>!h.includes(" · Apr 2026 rates")),"Use the explicit April 26 rate-version wording");
   const historyLabel=await page.locator("#builderArchivedRateSummary").textContent();
   console.log("Historical choices:",ending,"Offer choices:",offers,"Initial:",historyLabel);
   await page.locator("#renewalBuilder .renewal-row-cog").first().click();
   assert.equal(await page.locator("#renewalManualDetails").evaluate(el=>el.open),true,"Expiring tariff cog opens editable rates");
   await page.locator("#renewalBuilder .renewal-row-cog").first().click();
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
   assert.equal(await page.locator("#renewalQuarterlyCosts .renewal-q-label").count(),4,
     "Quarter strip should have a heading and three tariff rows");
   const widths=await page.evaluate(()=>{
     const table=document.querySelector("#renewalQuarterlyCosts");
     const chart=document.querySelector("#renewalFourLineChart svg");
     return {quarters:table?.dataset.quarterCount,grid:table&&getComputedStyle(table.querySelector('.renewal-q-grid')).gridTemplateColumns,svg:chart?.getAttribute('viewBox'),scroller:!!table?.closest('#renewalChartTableScroller')};
   });
   assert(widths.scroller&&widths.svg.startsWith("0 0 690"),"Chart and quarter rows use a shared viewBox");
   const layout=await page.evaluate(()=>{
     const chart=document.querySelector("#renewalFourLineChart"),
       grid=document.querySelector("#renewalQuarterlyCosts .renewal-q-grid"),
       wrapper=document.querySelector("#renewalChartTableScroller"),
       svg=chart?.querySelector("svg");
     const rect=e=>e.getBoundingClientRect().width;
     return {chart:rect(chart),quarter:rect(grid),wrapper:rect(wrapper),
       inner:wrapper.clientWidth,content:wrapper.scrollWidth,
       window:document.documentElement.clientWidth,
       page:document.documentElement.scrollWidth,
       cols:getComputedStyle(grid).gridTemplateColumns.split(" ").length,
       svg:rect(svg),collapsed:!document.getElementById("renewalMethodology").open};
   });
   assert.equal(layout.cols,6,"Six columns: tariff label plus five price-cap quarters");
   assert(Math.abs(layout.chart-layout.quarter)<3,"Quarter figures must align under the chart: "+JSON.stringify(layout));
   assert(layout.content<=layout.inner+2,"No sideways scroll in renewal chart: "+JSON.stringify(layout));
   assert(layout.page<=layout.window+2,"No horizontal overflow on phone: "+JSON.stringify(layout));
   assert(layout.collapsed,"Methodology should not clutter the screen before expansion");
   const alignment=await page.evaluate(()=>{
     const svg=document.querySelector("#renewalFourLineChart svg");
     const grid=document.querySelector("#renewalQuarterlyCosts .renewal-q-grid");
     const quarter=document.querySelector("#renewalQuarterlyCosts");
     const xs=svg.dataset.quarterEdges.split(",").map(Number);
     const box=svg.getBoundingClientRect();
     const cells=Array.from(grid.children);
     const actual=[cells[0].getBoundingClientRect().right,...cells.slice(1,6).map(x=>x.getBoundingClientRect().right)];
     const expected=xs.map(x=>box.left+x*box.width/690);
     const errors=actual.map((x,i)=>Math.abs(x-expected[i]));
     const counts=["#bc2030","#ab5400","#087a3b"].map(colour=>
       svg.querySelectorAll('path[stroke="'+colour+'"]').length);
     return {quarterCount:xs.length-1,errors,actual,expected,
       chartAlignment:quarter.dataset.chartAlignment,
       consistentEdges:quarter.dataset.quarterEdges===svg.dataset.quarterEdges,
       plottedOptionCounts:counts};
   });
   assert.equal(alignment.chartAlignment,"shared-geometry");
   assert.equal(alignment.quarterCount,5,"Five calendar quarter columns share the graph timeline");
   assert(alignment.consistentEdges,"Table and graph must use identical quarter boundaries");
   assert(alignment.errors.every(v=>v<2.5),
     "Quarter column boundaries should align with the chart to within 2.5px: "+JSON.stringify(alignment));
   assert.deepEqual(alignment.plottedOptionCounts,[1,1,1],
     "One distinct red, amber and green line per tariff - no duplicate red line");
   assert(Number(widths.quarters)>=4,"Quarter cells must come from the forecast months");
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
   assert.equal(await page.locator("#renewalChoiceDetails .renewal-fuel-row").count(),2,
     "Modal must provide electricity and gas costs separately");
   assert(await page.locator("#renewalChoiceDetails .renewal-variable-caution").isVisible(),
     "Variable comparison warns that future variable rates are illustrative");
   await page.locator("#renewalChoiceDetails .renewal-modal-close").click();
   await page.locator("#renewalSavingsPair .renewal-saving-card").nth(1).click();
   assert.equal(await page.locator("#renewalChoiceDetails .renewal-fuel-row").count(),2);
   assert.equal(await page.locator("#renewalChoiceDetails .renewal-rate-grid strong").count(),4,
     "Email offer modal displays four source rates");
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
   assert.equal(await customer.locator("#renewalQuarterlyCosts .renewal-q-label").count(),4,
     "Customer share retains main-tool-style quarterly strip");
   assert.equal(await customer.locator("#renewalPreviewWarning").isVisible(),false,
     "No preview warning on verified customer link");
   assert(!customerErrors.length,"Customer page errors: "+customerErrors.join("; "));
   console.log("Customer share view: successful, partner builder hidden, both tariff IDs and £155 preserved.");
   await customer.screenshot({path:"test-artifacts/customer-mobile.png",fullPage:true});
   await customer.close();
   // Manual renewal-offer rates must remain a partner-only, non-shareable scenario.
   await page.locator("#renewalBuilder .renewal-row-cog").nth(1).click();
   assert.equal(await page.locator("#renewalOfferManualDetails").evaluate(el=>el.open),true);
   for(const [id,value] of [
     ["offerTariffName","Fixed Saver 99"],["offerElecUnit","20"],
     ["offerElecSC","42"],["offerGasUnit","4.5"],["offerGasSC","24"]
   ]) await page.locator("#"+id).fill(value);
   await page.waitForFunction(()=>window.__renewalVisualData?.rates?.offer?.eU===20);
   assert.equal(await page.locator("#renewalSavingsPair .renewal-active-choice").count(),3,
     "Manually entered rates should produce an on-screen scenario");
   assert.equal(await page.locator("#builderCopyLink").isDisabled(),true,
     "Never share manually entered rates as verified customer tariffs");
   assert.match(await page.locator("#builderShareStatus").innerText(),/manual offer rates.*sharing disabled/i);
   await page.locator("#renewalSuitePicks button").first().click();
   assert.equal(await page.locator("#builderCopyLink").isDisabled(),false,
     "Re-selecting a verified tariff restores verified sharing");
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
