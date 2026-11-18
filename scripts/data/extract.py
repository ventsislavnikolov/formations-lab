import json,collections,random,subprocess,os,sys
random.seed(7)
rows=json.load(open('/root/work/starts.json'))
FEAT=['Josep Guardiola i Sala','Luis Enrique Martínez García','Maurizio Sarri','Zinédine Zidane','Mauricio Roberto Pochettino Trossero',
'Unai Emery Etxegoien','José Mario Felix dos Santos Mourinho','Jürgen Klopp','Diego Pablo Simeone','Claudio Ranieri','Marcelino García Toral',
'Roger Schmidt','Massimiliano Allegri','Gian Piero Ventura','Gareth Southgate','Xabier Alonso Olano','Gian Piero Gasperini',
'Paulo Manuel Carvalho de Sousa','Kasper Hjulmand','Louis van Gaal','Sam Allardyce','Patrice Garande','Marco Giampaolo',
'Sarina Glotzbach-Wiegman','Emma Hayes','Lionel Sebastián Scaloni','Didier Deschamps','Arsène Wenger','Eddie Howe','Laurent Blanc',
'Ernesto Valverde Tejedor','Jonatan Giráldez Costas','Ronald Koeman','Roberto Martínez Montoliú','Matt Beard','Rehanne Skinner']
os.makedirs('/root/sb/ev',exist_ok=True)
DEF={'Pressure','Ball Recovery','Interception','Duel','Block','Clearance','Foul Committed','50/50'}
POSS={'Pass','Carry','Ball Receipt*','Shot','Dribble'}
PPDA_DEF={'Interception','Foul Committed'}
out={}
def fetch(mid):
    p=f'/root/sb/ev/{mid}.json'
    if not os.path.exists(p) or os.path.getsize(p)<1000:
        subprocess.run(['curl','-sS','--retry','3','-o',p,f'https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/{mid}.json'],check=True)
    return p
jobs=[]
for mgr in FEAT:
    mine=[r for r in rows if r['manager'] and r['manager'].strip()==mgr]
    if not mine: print('NONE',mgr,file=sys.stderr); continue
    fc=collections.Counter(r['formation'] for r in mine)
    for form,n in fc.most_common(3):
        if n<4 and form!=fc.most_common(1)[0][0]: continue
        sample=sorted(mine if False else [r for r in mine if r['formation']==form],key=lambda r:r['date'])[-6:]
        for r in sample: jobs.append((mgr,form,r))
print(len(jobs),'jobs',file=sys.stderr)
# parallel download
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(16) as ex: list(ex.map(lambda j:fetch(j[2]['match_id']),jobs))
agg={}
for mgr,form,r in jobs:
    ev=json.load(open(f"/root/sb/ev/{r['match_id']}.json"))
    tid=r['team_id']
    xi=[e for e in ev if e['type']['name']=='Starting XI' and e['team']['id']==tid][0]
    pos={l['player']['id']:l['position']['id'] for l in xi['tactics']['lineup']}
    # stop at first tactical shift / sub for this team
    stop=10**9
    for e in ev:
        if e['team']['id']==tid and e['type']['name'] in ('Tactical Shift','Substitution'):
            stop=e['index'];break
    key=(mgr,form)
    a=agg.setdefault(key,dict(per=[],m=[],team=r['team']))
    inp=collections.defaultdict(list);outp=collections.defaultdict(list)
    a['per'].append((frozenset(pos.values()),inp,outp))
    a['m'].append(dict(id=r['match_id'],date=r['date'],comp=r['comp'],season=r['season'],gf=r['gf'],ga=r['ga']))
    opp_pass=0;our_def=0;press_x=[];def_x=[];poss_t=0;tot_t=0;plen=[];passes=0;fwd=0
    for e in ev:
        t=e['type']['name']
        if e.get('possession_team') and e.get('duration'):
            tot_t+=e['duration']; 
            if e['possession_team']['id']==tid: poss_t+=e['duration']
        loc=e.get('location')
        if e['team']['id']==tid:
            if t=='Pass':
                passes+=1; plen.append(e['pass'].get('length',0))
                if e['pass'].get('end_location') and e['pass']['end_location'][0]-loc[0]>=10: fwd+=1
            if t=='Pressure' and loc: press_x.append(loc[0])
            if t in DEF and loc: def_x.append(loc[0])
            if loc and (t in PPDA_DEF or (t=='Duel' and e.get('duel',{}).get('type',{}).get('name')=='Tackle')) and loc[0]>=48: our_def+=1
            if e['index']<stop and e.get('player') and loc and e['player']['id'] in pos:
                p=pos[e['player']['id']]
                if t in POSS: inp[p].append(loc)
                elif t in DEF: outp[p].append(loc)
        else:
            if t=='Pass' and loc and loc[0]<=72: opp_pass+=1
    a.setdefault('stats',[]).append(dict(ppda=opp_pass/max(our_def,1),press_x=sum(press_x)/max(len(press_x),1),
        def_x=sum(def_x)/max(len(def_x),1),poss=poss_t/max(tot_t,1),plen=sum(plen)/max(len(plen),1),fwd=fwd/max(passes,1),
        press_hi=sum(1 for x in press_x if x>=80)/max(len(press_x),1)))
    print(mgr,form,r['match_id'],file=sys.stderr)
res=[]
for (mgr,form),a in agg.items():
    def avg(d,minn=8):
        o={}
        for p,L in d.items():
            if len(L)>=minn: o[p]=[round(sum(x for x,_ in L)/len(L),1),round(sum(y for _,y in L)/len(L),1),len(L)]
        return o
    modal=collections.Counter(st_ for st_,_,_ in a['per']).most_common(1)[0][0]
    keep=[(i_,o_) for st_,i_,o_ in a['per'] if st_==modal]
    a['inp']=collections.defaultdict(list); a['out']=collections.defaultdict(list)
    for i_,o_ in keep:
        for k_,v_ in i_.items(): a['inp'][k_]+=v_
        for k_,v_ in o_.items(): a['out'][k_]+=v_
    s=a['stats']; ms={k:round(sum(x[k] for x in s)/len(s),3) for k in s[0]}
    res.append(dict(manager=mgr,formation=form,team=a['team'],matches=a['m'],shapeMatches=len(keep),inPossession=avg(a['inp']),outOfPossession=avg(a['out']),stats=ms))
json.dump(res,open('/root/work/shapes.json','w'),ensure_ascii=False)
print('done',len(res),file=sys.stderr)
