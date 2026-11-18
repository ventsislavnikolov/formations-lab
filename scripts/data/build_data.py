"""Aggregate StatsBomb open-data starting formations + featured coach shapes into src/data.json."""
import json,collections
rows=json.load(open('/root/work/starts.json'))
shapes=json.load(open('/root/work/shapes.json'))
FMAP={'433':'4-3-3','4231':'4-2-3-1','442':'4-4-2','4141':'4-1-4-1','352':'3-5-2','41212':'4-1-2-1-2','343':'3-4-3','4411':'4-4-1-1',
 '3421':'3-4-2-1','3412':'3-4-1-2','451':'4-5-1','3511':'3-5-1-1','4321':'4-3-2-1','41221':'4-1-2-2-1','4222':'4-2-2-2','32221':'3-2-2-2-1',
 '42211':'4-2-2-1-1','3142':'3-1-4-2','4312':'4-3-1-2','532':'5-3-2','3232':'3-2-3-2','5221':'5-2-2-1','541':'5-4-1','42121':'4-2-1-2-1'}
def f(x): return FMAP.get(x,x)
def era(season):
    y=int(season[:4]); return 'pre-2000' if y<2000 else ('2000-2014' if y<2015 else ('2015-2019' if y<2020 else '2020+'))
form=collections.Counter(f(r['formation']) for r in rows)
by_era=collections.defaultdict(collections.Counter)
for r in rows: by_era[era(r['season'])][f(r['formation'])]+=1
women=lambda c: any(k in c for k in ['Women','NWSL','Frauen','Liga F',"Women's",'Serie A Women'])
by_gender=collections.defaultdict(collections.Counter)
for r in rows: by_gender['women' if women(r['comp']) else 'men'][f(r['formation'])]+=1
coaches=collections.defaultdict(list)
for r in rows:
    if r['manager']: coaches[r['manager'].strip()].append(r)
clist=[]
for name,v in coaches.items():
    if len(v)<8: continue
    fc=collections.Counter(f(r['formation']) for r in v)
    teams=collections.Counter(r['team'] for r in v)
    seasons=sorted(set(f"{r['comp']} {r['season']}" for r in v))
    w=sum(1 for r in v if r['gf']>r['ga']); d=sum(1 for r in v if r['gf']==r['ga'])
    clist.append(dict(name=name,display=(v[0]['nick'] or name).strip(),country=v[0]['country'],matches=len(v),
        formations=fc.most_common(),teams=[t for t,_ in teams.most_common(3)],competitions=seasons[:6],
        nCompetitions=len(seasons),record=[w,d,len(v)-w-d]))
clist.sort(key=lambda c:-c['matches'])
top=collections.defaultdict(list)
for c in clist:
    for fm,n in c['formations']:
        top[fm].append([c['display'],c['teams'][0],n,round(n/c['matches'],2)])
top={k:sorted(v,key=lambda x:-x[2])[:12] for k,v in top.items()}
nick={c['name']:c['display'] for c in clist}
for s in shapes:
    s['display']=nick.get(s['manager'].strip(),s['manager']); s['formation']=f(s['formation'])
comps=collections.Counter(f"{r['comp']}" for r in rows)
out=dict(meta=dict(starts=len(rows),matches=len(set(r['match_id'] for r in rows)),competitions=len(comps),
   seasons=len(set((r['comp'],r['season']) for r in rows)),coaches=len(coaches),shapeMatches=sum(len(s['matches']) for s in shapes),
   compList=comps.most_common()),
   formations=form.most_common(),byEra={k:v.most_common() for k,v in by_era.items()},byGender={k:v.most_common() for k,v in by_gender.items()},
   topCoaches=top,coaches=clist,shapes=shapes)
json.dump(out,open('/root/formations-lab/src/data.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(clist),'coaches',len(shapes),'shapes')
