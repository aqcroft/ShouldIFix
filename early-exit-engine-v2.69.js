/* Pure early-exit comparison engine. Rates are p/kWh and p/day; catalogue
   rates exclude VAT. No rate is inferred by this module. */
(function(root){
  "use strict";
  const DAY=86400000;
  function utcDate(value){
    if(value instanceof Date)return new Date(Date.UTC(value.getUTCFullYear(),value.getUTCMonth(),value.getUTCDate()));
    const m=String(value||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m)return null;
    const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
    return d.getUTCFullYear()===+m[1]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3]?d:null;
  }
  function iso(d){return d.toISOString().slice(0,10);}
  function firstNextMonth(value){const d=utcDate(value);return d?new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)):null;}
  function addDays(value,n){const d=utcDate(value);return d?new Date(d.getTime()+n*DAY):null;}
  function daysInMonth(y,m){return new Date(Date.UTC(y,m+1,0)).getUTCDate();}
  function minus49Days(value){return addDays(value,-49);}
  function ratesValid(r,mode="dual"){
    if(!r)return false;
    const keys=mode==="gas"?["gU","gSC"]:mode==="elec"?["eU","eSC"]:["eU","eSC","gU","gSC"];
    return keys.every(k=>Number.isFinite(+r[k])&&+r[k]>=0);
  }
  function boundsForExpiry(expiry){const d=utcDate(expiry);return d?iso(minus49Days(d)):null;}
  function costForPath(input,path){
    const start=utcDate(input.startDate),end=utcDate(input.endDate);
    if(!start||!end||end<start)throw new Error("A valid comparison period is required");
    const mode=input.mode||"dual",electricHeat=!!input.electricHeat;
    const elec=mode!=="gas",gas=mode!=="elec";
    const eAnnual=elec?Math.max(0,+input.elecKwh||0):0,gAnnual=gas?Math.max(0,+input.gasKwh||0):0;
    const eWeights=input.elecWeights||[],gWeights=input.gasWeights||[];
    const discount=mode==="dual"?Math.max(0,+input.dualFuelDiscountPDay||0):0;
    const out=[];
    for(let cursor=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1));cursor<=end;cursor=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,1))){
      const y=cursor.getUTCFullYear(),m=cursor.getUTCMonth(),full=daysInMonth(y,m);
      const from=Math.max(start.getTime(),Date.UTC(y,m,1)),to=Math.min(end.getTime(),Date.UTC(y,m,full));
      const monthDays=Math.floor((to-from)/DAY)+1;
      const eWeight=+(electricHeat&&mode==="elec"?(gWeights[m]||0):(eWeights[m]||0)),gWeight=+(gWeights[m]||0);
      const eMonth=eAnnual*eWeight*monthDays/full,gMonth=gAnnual*gWeight*monthDays/full;
      let eCost=0,gCost=0;
      for(const seg of path.segments){
        const a=Math.max(from,seg.from.getTime()),b=Math.min(to,seg.to.getTime());
        if(b<a)continue;
        const n=Math.floor((b-a)/DAY)+1,rate=seg.rate;
        if(!ratesValid(rate,mode))throw new Error("A tariff rate is unavailable for part of the comparison");
        const part=n/monthDays;
        const eK=eMonth*part,gK=gMonth*part;
        const eVAT=elec&&((y===2026&&m>=9)||(y===2027&&m<=2))?1:1.05;
        const gVAT=1.05;
        const eSC=Math.max(0,+rate.eSC-(seg.vatInclusive?0:discount));
        const gSC=Math.max(0,+rate.gSC-(seg.vatInclusive?0:discount));
        if(elec)eCost+=(eSC*n+rate.eU*eK)*eVAT/100;
        if(gas)gCost+=(gSC*n+rate.gU*gK)*gVAT/100;
      }
      const covered=path.segments.reduce((sum,seg)=>sum+Math.max(0,Math.floor((Math.min(to,seg.to.getTime())-Math.max(from,seg.from.getTime()))/DAY)+1),0);
      if(covered!==monthDays)throw new Error("Tariff periods do not cover every comparison day");
      out.push({year:y,month:m,days:monthDays,electricity:eCost,gas:gCost,total:eCost+gCost});
    }
    return out;
  }
  function compare(input){
    const start=utcDate(input.startDate),expiry=utcDate(input.expiryDate),end=utcDate(input.endDate);
    const newExpiry=utcDate(input.newExpiryDate),futureExpiry=utcDate(input.futureExpiryDate);
    const process=utcDate(input.processDate),waitProcess=utcDate(input.waitProcessDate);
    if(!start||!expiry||!newExpiry||!futureExpiry||!end||!process||!waitProcess||end<start)throw new Error("Comparison dates are incomplete");
    if(!ratesValid(input.oldRate,input.mode)||!ratesValid(input.newRate,input.mode)||!ratesValid(input.variableRate,input.mode)||!ratesValid(input.futureRate,input.mode))throw new Error("Verified old, new, variable and explicit future-scenario rates are required");
    const nowEffective=firstNextMonth(process),waitEffective=firstNextMonth(waitProcess);
    const lastDay=addDays(end,0);
    const feeStatus=input.feeStatus;
    if(!["assumed-fee","confirmed-free","confirmed-other","unconfirmed"].includes(feeStatus))throw new Error("Exit-fee status is required");
    const fees=feeStatus==="unconfirmed"?null:feeStatus==="confirmed-free"?{e:0,g:0}: {
      e:input.mode==="gas"?0:Math.max(0,+input.elecFee||0),
      g:input.mode==="elec"?0:Math.max(0,+input.gasFee||0)
    };
    const oldStart=start,oldEnd=expiry;
    const make=(transition,lockedRate,lockedExpiry,fee={e:0,g:0})=>{
      const segments=[];
      const preChangeEnd=new Date(Math.min(oldEnd.getTime(),transition.getTime()-DAY));
      if(preChangeEnd>=oldStart)segments.push({from:oldStart,to:preChangeEnd,rate:input.oldRate});
      const gapStart=new Date(Math.max(oldStart.getTime(),oldEnd.getTime()+DAY));
      const gapEnd=new Date(Math.min(lastDay.getTime(),transition.getTime()-DAY));
      if(gapStart<=gapEnd)segments.push({from:gapStart,to:gapEnd,rate:input.variableRate});
      const afterStart=new Date(Math.max(oldStart.getTime(),transition.getTime()));
      const lockedEnd=new Date(Math.min(lastDay.getTime(),lockedExpiry.getTime()));
      if(afterStart<=lockedEnd)segments.push({from:afterStart,to:lockedEnd,rate:lockedRate});
      const variableStart=new Date(Math.max(oldStart.getTime(),lockedExpiry.getTime()+DAY,transition.getTime()));
      if(variableStart<=lastDay)segments.push({from:variableStart,to:lastDay,rate:input.variableRate});
      if(!segments.length)throw new Error("No tariff covers the comparison horizon");
      const months=costForPath(input,{segments});
      const inHorizon=transition.getTime()<=lastDay.getTime();
      if(inHorizon){
        const d=transition<start?start:transition;
        const feeMonth=months.find(m=>m.year===d.getUTCFullYear()&&m.month===d.getUTCMonth());
        if(feeMonth){feeMonth.total+=fee.e+fee.g;feeMonth.fees=fee.e+fee.g;}
      }
      const actualFees=inHorizon?{...fee}:{e:0,g:0};
      return {months,total:months.reduce((a,m)=>a+m.total,0),fees:actualFees};
    };
    const keepTransition=addDays(expiry,1);
    const keep=make(keepTransition,input.variableRate,end);
    const feeApplicable=feeStatus!=="unconfirmed";
    const now=make(nowEffective,input.newRate,newExpiry,feeApplicable?fees:{e:0,g:0});
    const wait=make(waitEffective,input.futureRate,futureExpiry,feeApplicable?fees:{e:0,g:0});
    const deltaVsWait=wait.total-now.total;
    let breakEvenPct=null;
    if(now.total>wait.total){
      let low=0,high=4;
      const waitAt=pct=>make(waitEffective,Object.fromEntries(["eU","eSC","gU","gSC"].map(k=>[k,+input.futureRate[k]*(1+pct)])),futureExpiry).total;
      if(waitAt(high)>=now.total){for(let i=0;i<60;i++){const mid=(low+high)/2;if(waitAt(mid)>=now.total)high=mid;else low=mid;}breakEvenPct=high*100;}
    }
    return {dates:{request:iso(process),changeEffective:iso(nowEffective),waitRequest:iso(waitProcess),waitEffective:iso(waitEffective),expiry:iso(expiry),feeFreeThreshold:boundsForExpiry(expiry),end:iso(end)},feeStatus,feeConfirmed:feeApplicable,paths:{keep,now,wait},differenceNowVsWait:now.total-wait.total,breakEvenFutureRateRisePct:breakEvenPct};
  }
  const api={utcDate,iso,firstNextMonth,addDays,daysInMonth,minus49Days,boundsForExpiry,costForPath,compare};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.ShouldIFixEarlyExit=api;
})(typeof globalThis!=="undefined"?globalThis:this);
