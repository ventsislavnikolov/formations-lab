import json,glob,re,collections,sys
ms={}
for f in glob.glob('/root/sb/open-data/data/matches/*/*.json'):
    for m in json.load(open(f)): ms[m['match_id']]=m
rows=[]
pat=re.compile(r'"name" : "Starting XI".*?"team" : \{\s*"id" : (\d+),\s*"name" : "([^"]*)".*?"formation" : (\d+),\s*"lineup" : \[(.*?)\]\s*\}',re.S)
posre=re.compile(r'"position" : \{\s*"id" : (\d+),\s*"name" : "([^"]*)"')
missing=0
for mid,m in ms.items():
    try: txt=open(f'/root/sb/heads/{mid}.json').read()
    except: missing+=1; continue
    found=pat.findall(txt)
    for tid,tname,form,lineup in found[:2]:
        side='home_team' if m['home_team']['home_team_id']==int(tid) else 'away_team'
        mg=m[side].get('managers') or []
        rows.append(dict(match_id=mid,date=m['match_date'],comp=m['competition']['competition_name'],season=m['season']['season_name'],
          team=tname,team_id=int(tid),manager=(mg[0]['name'].strip() if mg else None),
          nick=(mg[0].get('nickname') if mg else None),country=(mg[0].get('country',{}).get('name') if mg else None),
          formation=form,positions=[int(p) for p,_ in posre.findall(lineup)],
          gf=m['home_score'] if side=='home_team' else m['away_score'],ga=m['away_score'] if side=='home_team' else m['home_score']))
print('rows',len(rows),'missing',missing,file=sys.stderr)
json.dump(rows,open('/root/work/starts.json','w'))
c=collections.Counter(r['formation'] for r in rows);print(c.most_common(30),file=sys.stderr)
print(sum(1 for r in rows if r['manager']),'with manager',file=sys.stderr)
