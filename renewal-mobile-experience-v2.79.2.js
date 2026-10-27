/* Should I Fix v2.79.2 - presentation only; tariff computation stays in renewal-builder. */
(function () {
 'use strict';
 const ID='renewalSavingsPair';
 const palette={green:'#087a3b',amber:'#ab5400',red:'#bc2030'};
 const css="\n/* Three scannable tap targets above the chart on all screen sizes. */\n#renewalSavingsPair{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important;margin-bottom:15px}\n#renewalSavingsPair .renewal-saving-card{border:2px solid var(--rank-color,#53398b)!important;border-radius:14px!important;background:#fff!important;padding:12px 10px!important;box-shadow:0 3px 0 color-mix(in srgb,var(--rank-color) 18%,transparent);min-width:0;cursor:pointer;display:flex;gap:3px;flex-direction:column}\n#renewalSavingsPair .renewal-saving-card .kicker{color:var(--rank-color)!important;font-size:clamp(.65rem,1.6vw,.88rem)!important;letter-spacing:0!important;line-height:1.2!important;min-height:2.5em;text-transform:none!important}\n#renewalSavingsPair .renewal-saving-card .amount{order:2;color:var(--rank-color)!important;font:900 clamp(1.15rem,3.3vw,1.9rem)/1.15 Nunito,system-ui,sans-serif!important;margin:4px 0!important;white-space:nowrap}\n#renewalSavingsPair .renewal-saving-card .cost-note{order:1;margin:5px 0 0!important;color:#292139!important;font-size:clamp(.76rem,2.2vw,1rem)!important;line-height:1.2}\n#renewalSavingsPair .renewal-saving-card .cost-note b{font-size:1.06em;color:var(--rank-color)}\n#renewalSavingsPair .renewal-saving-card .saving-note,#renewalSavingsPair .renewal-saving-card .renewal-card-points{display:none!important}\n#renewalSavingsPair .renewal-active-choice::after{content:'Tap for details ⓘ';order:4;margin-top:auto;padding-top:9px;font-weight:800;font-size:.68rem;color:var(--rank-color)}\n#renewalSavingsPair .renewal-active-choice:focus-visible{outline:3px solid #21212b;outline-offset:3px}\n#renewalSavingsPair .renewal-active-choice:hover{background:#fafafa!important}\n#renewalLineLegend{display:flex!important;justify-content:flex-start;flex-direction:column;align-items:stretch;gap:8px!important;margin:10px 0 14px;padding:0!important}\n.renewal-key-item{display:flex;gap:10px;align-items:flex-start;padding:7px 9px;border-left:4px solid var(--rank-color);background:#fff;border-radius:4px}\n.renewal-key-item i{display:block;flex:0 0 22px;border-top:4px solid var(--rank-color);margin-top:8px}\n.renewal-key-item div{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;line-height:1.3}\n.renewal-key-item b{color:var(--rank-color);font-size:.8rem}\n.renewal-key-item strong{color:var(--rank-color);font-size:.85rem}\n.renewal-key-item small{color:#454050;font-size:.72rem;font-weight:700}\n.renewal-key-reference{display:flex;align-items:center;gap:10px;text-align:left;font-size:.73rem;color:#535065;font-weight:800;padding-left:12px}\n.renewal-key-reference i{display:inline-block;width:22px;border-top:3px dashed var(--rank-color)}\n#renewalFourLineChart svg{background:#fff}\n.renewal-quarter-heading{margin:14px 0 10px}\n.renewal-quarter-heading h3{color:#39245c;font-size:1rem;font-weight:900;margin:0 0 3px}\n.renewal-quarter-heading p{margin:0;color:#625c70;font-size:.74rem;line-height:1.4}\n.renewal-quarter-scroll{width:100%;overflow-x:auto;border:1px solid #c7bfd2;border-radius:11px}\n.renewal-quarter-scroll:focus-visible{outline:3px solid #553694}\n.renewal-quarter-scroll table{border-collapse:collapse;width:100%;min-width:585px;font:750 .78rem Nunito,system-ui,sans-serif}\n.renewal-quarter-scroll th,.renewal-quarter-scroll td{padding:10px 9px;border-bottom:1px solid #e5e0ed;text-align:right;white-space:nowrap}\n.renewal-quarter-scroll th:first-child,.renewal-quarter-scroll td:first-child{text-align:left}\n.renewal-quarter-scroll thead{background:#eeeaf5;color:#38244f}\n.renewal-quarter-scroll thead th:not(:first-child){border-top:3px solid var(--rank-color,transparent)}\n.renewal-quarter-scroll tbody td:not(:last-child),.renewal-quarter-scroll tfoot td:not(:last-child){color:var(--rank-color)}\n.renewal-quarter-scroll .quarter-best{background:#e6f3e8;font-weight:900;box-shadow:inset 0 0 0 1px #78b78c}\n.renewal-quarter-scroll tfoot{background:#f6f3f9;font-weight:900}\n#renewalChoiceDetails{border:0;border-radius:17px;max-width:min(95vw,560px);max-height:85vh;overflow:auto;padding:19px;background:white;color:#292139;box-shadow:0 20px 80px #1118}\n#renewalChoiceDetails::backdrop{background:#1e153dc2}\n.renewal-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}\n.renewal-modal-head button{border:1px solid #9a91a8;background:#fff;border-radius:9px;padding:10px 13px;font:800 .84rem Nunito,system-ui;cursor:pointer}\n#renewalChoiceDetailsContent .renewal-saving-card{padding:14px;border:2px solid #756989;border-radius:13px}\n#renewalChoiceDetailsContent .kicker{font-weight:900;color:#30224d;font-size:1rem}\n#renewalChoiceDetailsContent .amount{display:block;font-size:2rem;color:#30224d;font-weight:900}\n#renewalChoiceDetailsContent .saving-note{font-size:.82rem;color:#484151;margin-top:7px}\n#renewalChoiceDetailsContent .cost-note{font-weight:850;margin:8px 0}\n#renewalChoiceDetailsContent .renewal-card-points{display:grid;margin-top:12px}\n#renewalChoiceDetailsContent .renewal-card-points li{font-size:.85rem}\n#renewalPreviewWarning[hidden]{display:none!important}\n@media(max-width:540px){\n #renewalStory{padding:12px 9px!important}\n #renewalSavingsPair{gap:5px!important}\n #renewalSavingsPair .renewal-saving-card{padding:8px 5px!important;min-height:132px}\n #renewalSavingsPair .renewal-saving-card .kicker{font-size:.62rem!important;min-height:2.8em}\n #renewalSavingsPair .renewal-saving-card .amount{font-size:clamp(1rem,4.3vw,1.5rem)!important;letter-spacing:-.03em}\n #renewalSavingsPair .renewal-saving-card .cost-note{font-size:.67rem!important;order:1}\n #renewalSavingsPair .renewal-saving-card .cost-note b{font-size:1em}\n #renewalSavingsPair .renewal-active-choice::after{font-size:.58rem}\n .renewal-key-item{padding:5px 8px}\n .renewal-key-item div{gap:3px 8px}\n .renewal-key-item b{font-size:.72rem}\n .renewal-key-item small{font-size:.66rem}\n .renewal-scenario-buttons{gap:6px!important}\n}\n@media(prefers-reduced-motion:reduce){#renewalSavingsPair .renewal-active-choice{transition:none}}\n";
 const style=document.createElement('style');
 style.id='renewalMobileStylesV2792';
 style.textContent=css;
 document.head.appendChild(style);
 const existing=document.getElementById(ID);
 if(!existing)return;
 const details=document.createElement('dialog');
 details.id='renewalChoiceDetails';
 details.setAttribute('aria-label','Tariff option details');
 details.innerHTML='<div class="renewal-modal-head"><strong>Tariff option details</strong><button type="button" class="renewal-modal-close" aria-label="Close tariff details">✕ Close</button></div><div id="renewalChoiceDetailsContent"></div>';
 document.body.appendChild(details);
 details.querySelector('.renewal-modal-close').addEventListener('click',()=>details.close());
 details.addEventListener('click',e=>{if(e.target===details)details.close();});
 existing.addEventListener('click',e=>{const card=e.target.closest('.renewal-saving-card');if(card)openCard(card);});
 existing.addEventListener('keydown',e=>{const card=e.target.closest('.renewal-saving-card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openCard(card);}});
 function openCard(card){
   if(!card.classList.contains('renewal-active-choice'))return;
   const copy=card.cloneNode(true);
   copy.classList.remove('renewal-active-choice');copy.removeAttribute('role');copy.removeAttribute('tabindex');
   copy.removeAttribute('aria-label');copy.style.removeProperty('--rank-color');
   const target=details.querySelector('#renewalChoiceDetailsContent');
   target.replaceChildren(copy);
   if(details.showModal)details.showModal();else details.setAttribute('open','');
   details.querySelector('.renewal-modal-close').focus();
 }
 function gbp(n){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);}
 const sum=xs=>xs.reduce((x,y)=>x+Number(y||0),0);
 const safe=raw=>String(raw??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function ranked(data){
   return [['variable',data.years.variable],['offer',data.years.offer],['public',data.years.public]]
     .sort((a,b)=>a[1]-b[1]||['offer','public','variable'].indexOf(a[0])-['offer','public','variable'].indexOf(b[0]))
     .reduce((o,x,i)=>(o[x[0]]=['green','amber','red'][i],o),{});
 }
 function render(data){
   if(!data||!data.years||!Array.isArray(data.months))return;
   if(details.open)details.close();
   const order=ranked(data);
   const keys=['variable','offer','public'];
   const cards=existing.querySelectorAll('.renewal-saving-card');
   cards.forEach((card,i)=>{
      const key=keys[i],tone=order[key];
      card.classList.add('renewal-active-choice');
      card.dataset.renewalChoice=key;card.dataset.renewalRank=tone;
      card.style.setProperty('--rank-color',palette[tone]);
      card.setAttribute('role','button');card.tabIndex=0;
      card.setAttribute('aria-label',(card.querySelector('.kicker')?.textContent||key)+': '+gbp(data.years[key]/12)+' per month, '+gbp(data.years[key])+' for the comparison period. Tap for details.');
   });
   const labels={
     variable:data.names.variable||'Variable tariff',
     offer:data.names.offer||'Your renewal offer',
     public:data.names.public||'Public fixed tariff'
   };
   const legend=document.getElementById('renewalLineLegend');
   if(legend){
     legend.innerHTML=keys.slice().sort((a,b)=>data.years[a]-data.years[b]).map(key=>
       '<div class="renewal-key-item" style="--rank-color:'+palette[order[key]]+'"><i aria-hidden="true"></i><div><b>'+safe(labels[key])+'</b><strong>'+gbp(data.years[key]/12)+'/month</strong><small>'+gbp(data.years[key])+' for 12 months</small></div></div>'
     ).join('')+
     (data.budget!==null?'<div class="renewal-key-reference" style="--rank-color:#394b70"><i aria-hidden="true"></i>Budget Plan '+gbp(data.budget)+'/month (payment, not usage cost)</div>':'')+
     (data.hasPast?'<div class="renewal-key-reference" style="--rank-color:#777784"><i aria-hidden="true"></i>Modelled previous costs</div>':'');
   }
   let quarterly=document.getElementById('renewalQuarterlyCosts');
   if(!quarterly){quarterly=document.createElement('section');quarterly.id='renewalQuarterlyCosts';quarterly.setAttribute('aria-label','Quarterly energy cost comparison');
     document.getElementById('renewalFourLineChart')?.insertAdjacentElement('afterend',quarterly);}
   const groups=[];
   data.months.forEach((m,i)=>{
     let q=groups[groups.length-1];
     const id=m.year+'-Q'+(Math.floor(m.cal/3)+1);
     if(!q||q.id!==id){q={id,months:[],cost:{variable:0,offer:0,public:0}};groups.push(q);}
     q.months.push(m);
     keys.forEach(key=>q.cost[key]+=Number(data.series[key][i]||0));
   });
   const name=m=>new Date(Date.UTC(m.year,m.cal,1)).toLocaleString('en-GB',{month:'short',timeZone:'UTC'});
   const qname=q=>name(q.months[0])+(q.months.length===1?'':'-'+name(q.months[q.months.length-1]))+' '+q.months[0].year;
   const title=key=>key==='variable'?'Variable':key==='offer'?'Email offer':'Public fixed';
   const body=groups.map(q=>{
     const cheapest=keys.slice().sort((a,b)=>q.cost[a]-q.cost[b])[0];
     return '<tr><th scope="row">'+safe(qname(q))+'</th>'+keys.map(key=>
       '<td class="'+(key===cheapest?'quarter-best':'')+'" style="--rank-color:'+palette[order[key]]+'">'+gbp(q.cost[key])+'</td>').join('')+
       '<td>'+((q.cost.variable-q.cost.offer)>=0?'Save ':'Extra ')+gbp(Math.abs(q.cost.variable-q.cost.offer))+'</td></tr>';
   }).join('');
   quarterly.innerHTML='<div class="renewal-quarter-heading"><h3>What each quarter could cost</h3><p>Same monthly forecast figures as the chart. The highlighted cell is the cheapest option in that quarter.</p></div>'+
     '<div class="renewal-quarter-scroll" tabindex="0" role="region" aria-label="Scrollable quarterly cost table"><table><thead><tr><th scope="col">Quarter</th>'+
     keys.map(key=>'<th scope="col" style="--rank-color:'+palette[order[key]]+'">'+title(key)+'</th>').join('')+
     '<th scope="col">Email offer vs variable</th></tr></thead><tbody>'+body+'</tbody><tfoot><tr><th scope="row">12-month total</th>'+
     keys.map(key=>'<td style="--rank-color:'+palette[order[key]]+'">'+gbp(data.years[key])+'</td>').join('')+
     '<td>'+((data.years.variable-data.years.offer)>=0?'Save ':'Extra ')+gbp(Math.abs(data.years.variable-data.years.offer))+'</td></tr></tfoot></table></div>';
   const intro=document.getElementById('renewalChartIntro');
   if(intro)intro.textContent='Your projected energy use and costs from '+data.range+'. Tap a coloured summary for details; figures are not monthly Direct Debit payments.';
   const caption=document.querySelector('.renewal-chart-caption');
   if(caption)caption.textContent='Solid lines show projected monthly costs; the variable line becomes dashed for forecast months. Navy dotted = monthly Budget Plan payment (not energy usage). Grey dotted = modelled previous costs, where available.';
 }
 function clear(){
   const quarterly=document.getElementById('renewalQuarterlyCosts');
   if(quarterly)quarterly.remove();
   if(details.open)details.close();
 }
 window.RenewalMobileUX={render,clear};
 if(window.__renewalVisualData)render(window.__renewalVisualData);
})();
