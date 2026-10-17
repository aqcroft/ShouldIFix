#!/usr/bin/env python3
"""Fail-closed MSE weekly forecast scraper. Produces a proposed JSON edit, not a live update."""
import argparse
import copy
import datetime as dt
import json
import re
import sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup

URL="https://www.moneysavingexpert.com/utilities/energy-price-cap-prediction/"
LABELS=("1 Oct to 31 Dec 2026","1 Jan to 31 March 2027","1 Apr to 30 June 2027","1 Jul to 30 Sep 2027")
ROW=re.compile(r"EDF\s*\(\s*1\s*\)|British\s+Gas\s*\(\s*2\s*\)|E\.on\s+Next\s*\(\s*3\s*\)|Average\s*\(\s*4\s*\)",re.I)
CELL=re.compile(r"(?:\b(UP|DOWN)\s+(\d+(?:\.\d+)?)\s*%\s*£\s*([\d,]+)(?:\s+a year)?)|No prediction yet",re.I)
def iso(text):
    for fmt in ("%d %B %Y","%d %b %Y"):
        try: return dt.datetime.strptime(text.strip(),fmt).date().isoformat()
        except ValueError: pass
    raise ValueError("Invalid MSE date: "+text)
def read_table(html,approved,today=None):
    txt=re.sub(r"\s+"," ",BeautifulSoup(html,"html.parser").get_text(" ",strip=True))
    article=re.search(r"\bUpdated\s+(\d{1,2}\s+[A-Za-z]+\s+20\d{2})\b",txt,re.I)
    heading=re.search(r"Annual Price Cap predictions for week starting\s+(\d{1,2})\s+([A-Za-z]+)",txt,re.I)
    if not(article and heading): raise ValueError("MSE forecast heading or article date missing")
    published=iso(article.group(1))
    week=iso(heading.group(1)+" "+heading.group(2)+" "+published[:4])
    today=today or dt.datetime.now(dt.timezone.utc).date()
    when=dt.date.fromisoformat(week)
    if when>today+dt.timedelta(days=7) or when<today-dt.timedelta(days=35): raise ValueError("Forecast week is stale or implausible")
    start=heading.end()
    end=re.search(r"Based on a dual[ -]fuel household",txt[start:],re.I)
    if not end: raise ValueError("MSE forecast table end missing")
    table=txt[start:start+end.start()]
    for q in LABELS:
        if q.lower() not in table.lower(): raise ValueError("MSE quarter definitions changed: "+q)
    matches=list(ROW.finditer(table))
    if len(matches)!=4: raise ValueError("MSE supplier rows missing or changed")
    names=[re.sub(r"\s*\(\s*\d\s*\)$","",m.group()).strip().lower() for m in matches]
    if names!=["edf","british gas","e.on next","average"]: raise ValueError("Supplier order changed")
    rows=[]
    for i,m in enumerate(matches):
        segment=table[m.end():matches[i+1].start() if i<3 else len(table)]
        values=[]
        for x in CELL.finditer(segment):
            if x.group(1) is None: values.append(None)
            else: values.append({"change_pct":float(x.group(2))*(1 if x.group(1).upper()=="UP" else -1),
                                 "annual_gbp":int(x.group(3).replace(",",""))})
        if len(values)!=4: raise ValueError("Expected four quarter values in "+m.group())
        for v in values:
            if v is not None and not(-90<v["change_pct"]<150 and 100<v["annual_gbp"]<10000):
                raise ValueError("MSE figure outside safe range")
        if values[0] is None or values[0]["change_pct"]!=3.6: raise ValueError("Confirmed October cap changed")
        rows.append(values)
    if any(x is None for x in rows[3]): raise ValueError("Average forecast row incomplete")
    new=copy.deepcopy(approved)
    if [p["key"] for p in new["periods"]]!=["oct2026","jan2027","apr2027","jul2027"]:
        raise ValueError("Approved forecast JSON schema not supported")
    new["revision"]="mse-"+week
    new["source"]["week_start"]=week
    new["source"]["article_updated"]=published
    for i,v in enumerate(rows[3]): new["periods"][i]["average"]=v
    for i,row in enumerate(rows[:3]):
        new["suppliers"][i]["values"]=row
        match=re.search(r"\("+str(i+1)+r"\)\s*According to the latest prediction\s*\(on\s*(\d{1,2}\s+[A-Za-z]+\s+20\d{2})\)",txt,re.I)
        new["suppliers"][i]["predicted_on"]=iso(match.group(1)) if match else published
    return new
def signature(data):
    # Normalise e.g. 25 and 25.0, otherwise a no-change week requests approval.
    def normal(value):
        if value is None: return None
        return (round(float(value["change_pct"]),3),int(value["annual_gbp"]))
    return (tuple(normal(p["average"]) for p in data["periods"]),
            tuple(tuple(normal(v) for v in s["values"]) for s in data["suppliers"]))
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--data",default="forecast-data.json")
    p.add_argument("--fixture",help="Offline fixture for tests, never scheduled")
    p.add_argument("--summary",default="forecast-update.md")
    args=p.parse_args()
    path=Path(args.data)
    before=json.loads(path.read_text(encoding="utf-8"))
    if args.fixture: html=Path(args.fixture).read_text(encoding="utf-8")
    else:
        result=requests.get(URL,timeout=25,headers={"User-Agent":"Mozilla/5.0 (compatible; ShouldIFixForecastReview/1.0)"})
        result.raise_for_status()
        if not 15000<len(result.content)<5000000: raise ValueError("MSE response length unexpected")
        html=result.text
    after=read_table(html,before)
    if signature(before)==signature(after):
        print("No change to published forecasts; nothing to approve.")
        return
    if after["source"]["week_start"]<before["source"]["week_start"]:
        raise ValueError("Refusing an older forecast")
    path.write_text(json.dumps(after,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    body=["## New MSE price cap forecast - approval requested","","**No customer-facing changes until this request is merged.**","",
          "Source: "+URL,"Source week: "+after["source"]["week_start"],"",
          "| Quarter | Currently approved | Proposed |","|---|---:|---:|"]
    for old,new in zip(before["periods"],after["periods"]):
        a=old["average"];b=new["average"]
        body.append(f"| {new['label']} | {a['change_pct']:+g}% / £{a['annual_gbp']:,} | **{b['change_pct']:+g}% / £{b['annual_gbp']:,}** |")
    body+=["","The full EDF, British Gas, E.on Next and MSE average table is in the forecast-data.json diff.",
           "Both the live calculator and tappable source table use this approved file.","",
           "### To approve","1. Compare the figures against the linked MSE table.",
           "2. Click Merge pull request, then Confirm merge to publish.",
           "3. Close the pull request without merging to reject.","",
           "A confirmation will be logged when GitHub Pages serves the approved revision."]
    Path(args.summary).write_text("\n".join(body)+"\n",encoding="utf-8")
    print("Validated proposal:",before["revision"],"->",after["revision"])
if __name__=="__main__":
    try: main()
    except (ValueError,KeyError,IndexError,requests.RequestException) as error:
        print("FORECAST VALIDATION FAILED - no changes: "+str(error),file=sys.stderr)
        raise SystemExit(1)
