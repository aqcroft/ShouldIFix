/* Deterministic SVG price-tag placement. Boxes are checked against every
   plotted segment and marker, other tags, and the viewBox edges. */
(function(root){
  "use strict";
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  function intersects(a,b,margin){
    return a.x-a.w/2-margin < b.x+b.w/2 && a.x+a.w/2+margin > b.x-b.w/2 &&
      a.y-a.h/2-margin < b.y+b.h/2 && a.y+a.h/2+margin > b.y-b.h/2;
  }
  function segmentHitsRect(p1,p2,r,pad){
    const x0=r.x-r.w/2-pad,x1=r.x+r.w/2+pad,y0=r.y-r.h/2-pad,y1=r.y+r.h/2+pad;
    let t0=0,t1=1,dx=p2[0]-p1[0],dy=p2[1]-p1[1];
    const pp=[-dx,dx,-dy,dy],qq=[p1[0]-x0,x1-p1[0],p1[1]-y0,y1-p1[1]];
    for(let i=0;i<4;i++){
      if(pp[i]===0){if(qq[i]<0)return false;continue;}
      const t=qq[i]/pp[i];
      if(pp[i]<0){if(t>t1)return false;if(t>t0)t0=t;}
      else {if(t<t0)return false;if(t<t1)t1=t;}
    }
    return t0<=t1;
  }
  function markerHits(p,r,pad){
    const dx=Math.max(Math.abs(p[0]-r.x)-r.w/2,0),dy=Math.max(Math.abs(p[1]-r.y)-r.h/2,0);
    return dx*dx+dy*dy<=(pad||0)*(pad||0);
  }
  function collidesWithSeries(rect,series,pad){
    for(const line of series){
      for(const p of line.points||[])if(markerHits(p,rect,pad+3))return true;
      for(let i=1;i<(line.points||[]).length;i++)if(segmentHitsRect(line.points[i-1],line.points[i],rect,pad))return true;
    }
    return false;
  }
  function place(labels,series,options={}){
    const width=options.width||548,height=options.height||360,plotTop=options.plotTop||48,plotBottom=options.plotBottom||322;
    const boxW=options.boxWidth||96,boxH=options.boxHeight||34,gap=options.gap||6,pathClearance=options.pathClearance||5;
    const minX=(options.plotLeft||0)+boxW/2;
    const placed=[],result=[];
    const targets=labels.map(label=>{
      const pts=label.points||[];
      const peak=pts.reduce((best,p,i)=>!best||p[1]<best.point[1]?{point:p,index:i}:best,null);
      return {...label,peak};
    }).sort((a,b)=>(a.peak?.point[1]??Infinity)-(b.peak?.point[1]??Infinity));
    for(const label of targets){
      const pts=label.points||[];
      const anchors=pts.map((p,i)=>({point:p,index:i})).sort((a,b)=>a.point[1]-b.point[1]);
      const candidates=[];
      for(const anchor of anchors){
        const [ax,ay]=anchor.point;
        for(const [dx,dy] of [[0,-31],[0,31],[-54,-18],[54,-18],[-54,18],[54,18],[-63,0],[63,0]]){
          const c={x:clamp(ax+dx,minX,width-boxW/2),y:clamp(ay+dy,plotTop-boxH/2-2,plotBottom+boxH/2+2),w:boxW,h:boxH,
            anchorX:ax,anchorY:ay,index:anchor.index};
          if(c.y-c.h/2<2||c.y+c.h/2>height-2)continue;
          if(collidesWithSeries(c,series,pathClearance))continue;
          if(placed.some(p=>intersects(c,p,gap)))continue;
          const dist=Math.hypot(c.x-ax,c.y-ay),topPenalty=c.y<plotTop?180:0;
          candidates.push({...c,score:dist+topPenalty});
        }
      }
      candidates.sort((a,b)=>a.score-b.score);
      let chosen=candidates[0];
      if(!chosen){
        // The header strip is deliberately above the plot area and is the
        // guaranteed escape route for coincident or tightly crossing series.
        const idx=result.length,total=targets.length;
        const available=width-minX-boxW/2,slot=available/total,fw=Math.min(boxW,slot-gap);
        chosen={x:minX+slot*(idx+.5),y:plotTop-boxH/2-7,w:fw,h:boxH,
          anchorX:label.peak?.point[0]??4+slot*(idx+.5),anchorY:label.peak?.point[1]??plotTop,leader:false,fallback:true};
        // If an unusually short viewBox cannot fit all labels, vertically stack
        // within the same reserved strip with compact boxes.
        if(chosen.y-chosen.h/2<1)chosen.y=chosen.h/2+1;
      }
      chosen.leader=Math.hypot(chosen.x-chosen.anchorX,chosen.y-chosen.anchorY)>38;
      chosen.key=label.key;
      placed.push(chosen);result.push(chosen);
    }
    return result;
  }
  const api={place,collidesWithSeries,segmentHitsRect,markerHits};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.ShouldIFixLabelPlacement=api;
})(typeof globalThis!=="undefined"?globalThis:this);
