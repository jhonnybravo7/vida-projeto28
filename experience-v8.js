(()=>{
  const V8={week:null,level:null,plannerOffset:0,plannerDraft:null};
  const hardClose=window.closeModal;

  function markModal(level,week=null){
    V8.level=level;
    if(week) V8.week=week;
    requestAnimationFrame(()=>{
      const c=document.querySelector('#modalContent');
      if(!c)return;
      c.dataset.vidaLevel=level;
      if(week)c.dataset.vidaWeek=String(week);
    });
  }

  window.closeModal=function(force=false){
    const c=document.querySelector('#modalContent');
    const level=c?.dataset?.vidaLevel||V8.level;
    const week=Number(c?.dataset?.vidaWeek||V8.week||0);
    if(!force&&level==='detail'&&week>=1&&week<=4){
      V8.level='week';
      return window.openWeek(week);
    }
    V8.level=null;
    if(level==='week')V8.week=null;
    return hardClose(true);
  };

  const openWeekBase=window.openWeek;
  window.openWeek=function(i){
    V8.week=i;V8.level='week';
    const out=openWeekBase(i);
    markModal('week',i);
    return out;
  };

  const openLessonBase=window.openLesson;
  window.openLesson=function(i,j){
    V8.week=i;V8.level='detail';
    const out=openLessonBase(i,j);
    markModal('detail',i);
    return out;
  };

  const openGuideBase=window.openGuide;
  window.openGuide=function(i){
    V8.week=i;V8.level='detail';
    const out=openGuideBase(i);
    markModal('detail',i);
    return out;
  };

  const openMaterialBase=window.openMaterial;
  window.openMaterial=async function(i,j){
    V8.week=i;V8.level='detail';
    const out=await openMaterialBase(i,j);
    markModal('detail',i);
    return out;
  };

  function localDate(d){const x=new Date(d);x.setHours(12,0,0,0);return x}
  function monday(offset=0){const d=localDate(new Date()),dow=d.getDay()||7;d.setDate(d.getDate()-dow+1+(offset*7));return d}
  function addDays(d,n){const x=localDate(d);x.setDate(x.getDate()+n);return x}
  function di(d){return d.toISOString().slice(0,10)}
  function dayLabel(d){return ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'][d.getDay()]}
  function titleCase(s){return String(s||'').split(' ').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ')}
  function normPlan(p){const g=p?.goals;return g&&!Array.isArray(g)&&g.days?{version:3,days:{...(g.days||{})}}:{version:3,days:{}}}
  function actual(date){
    const c=S.checkins.find(x=>x.checkin_date===date);
    if(!c)return {exists:false,types:[],minutes:0,movement:0,sleep:0,water:0,closed:false,done:false};
    const types=String(c.training_type||'').split(',').map(x=>x.trim()).filter(Boolean);
    return {exists:true,types,minutes:Number(c.training_minutes||0),movement:Number(c.movement_minutes||0),sleep:Number(c.sleep_minutes||0),water:Number(c.water_ml||0),closed:!!c.daily_checkin_completed,done:!!c.trained||Number(c.movement_minutes||0)>0};
  }
  function dayRhythm(a){let n=0,total=0;[[a.done,1],[a.sleep>0,1],[a.water>0,1],[a.closed,1]].forEach(([v,w])=>{total+=w;if(v)n+=w});return total?Math.round(n/total*100):0}
  function weekData(offset=V8.plannerOffset){const start=monday(offset),days=Array.from({length:7},(_,i)=>addDays(start,i));return days.map(d=>{const date=di(d);return {d,date,a:actual(date),planned:V8.plannerDraft?.days?.[date]||[]}})}
  function avg(values){const xs=values.filter(v=>Number(v)>0);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0}
  function fmtMinutes(m){return m?`${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,'0')}`:'—'}
  function trainingCount(rows){return rows.filter(x=>x.a.done).length}
  function plannedCount(rows){return rows.filter(x=>x.planned.some(t=>t!=='Descanso')).length}
  function weekCompletion(rows){const planned=rows.filter(x=>x.planned.some(t=>t!=='Descanso'));if(!planned.length)return 0;return Math.round(planned.filter(x=>x.a.done).length/planned.length*100)}
  function streak(){
    const all=[...S.checkins].sort((a,b)=>b.checkin_date.localeCompare(a.checkin_date));if(!all.length)return 0;
    let s=0,d=localDate(new Date());
    for(let i=0;i<35;i++){
      const date=di(d),c=all.find(x=>x.checkin_date===date);
      if(c&&(c.daily_checkin_completed||c.trained||c.movement_minutes||c.sleep_minutes||c.water_ml)){s++;d.setDate(d.getDate()-1)}
      else if(i===0){d.setDate(d.getDate()-1)}else break;
    }
    return s;
  }
  function plannerInsight(rows){
    const withSleep=rows.filter(x=>x.a.sleep>0),short=withSleep.filter(x=>x.a.sleep<360),planned=plannedCount(rows),done=trainingCount(rows),waterDays=rows.filter(x=>x.a.water>0).length;
    if(withSleep.length>=2&&short.length>=2)return {icon:'☾',title:'Recuperação pede atenção',text:`Em ${short.length} registros desta semana o sono ficou abaixo de 6h. Se estiver cansada, hoje vale proteger recuperação e tentar encerrar o dia mais cedo.`};
    if(planned>=2&&done<planned)return {icon:'↗',title:'O plano pode ser ajustado',text:`Você planejou ${planned} dias de treino e registrou ${done}. Use os próximos dias para reorganizar, sem tentar compensar tudo de uma vez.`};
    if(waterDays>0&&waterDays<4)return {icon:'◌',title:'Mais dados = leitura melhor',text:`Há hidratação registrada em ${waterDays} dia${waterDays===1?'':'s'} desta semana. Continue registrando para enxergar o padrão com mais clareza.`};
    if(done>=3)return {icon:'✓',title:'Ritmo consistente',text:`Você já registrou movimento em ${done} dias nesta semana. O objetivo agora é sustentar o ritmo sem transformar todos os dias em máximo esforço.`};
    return {icon:'•',title:'Construa seu ritmo',text:'Planeje poucos dias que façam sentido, registre o que realmente aconteceu e use a diferença entre plano e realidade para ajustar a próxima semana.'};
  }
  function miniWeight(){
    const pts=[...S.measurements].reverse().filter(x=>Number(x.weight_kg)>0).slice(-8).map(x=>({date:x.measured_on,v:Number(x.weight_kg)}));
    if(!pts.length)return '<div class="pv8-empty">Sem peso registrado ainda.</div>';
    if(pts.length===1)return `<div class="pv8-weight-single"><b>${pts[0].v.toFixed(1)} kg</b><span>primeiro registro</span></div>`;
    const vals=pts.map(x=>x.v),min=Math.min(...vals),max=Math.max(...vals),span=max-min||1,w=280,h=86,p=8;
    const coords=pts.map((x,i)=>[p+i*(w-2*p)/(pts.length-1),h-p-(x.v-min)*(h-2*p)/span]);
    const path=coords.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' '),delta=pts.at(-1).v-pts[0].v;
    return `<div class="pv8-weight-head"><b>${pts.at(-1).v.toFixed(1)} kg</b><span>${delta>0?'+':''}${delta.toFixed(1)} kg</span></div><svg class="pv8-weight-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="M8 26 H272 M8 52 H272" class="pv8-grid"/><path d="${path}" class="pv8-line"/>${coords.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="${i===coords.length-1?4:2.5}"/>`).join('')}</svg>`;
  }
  function renderRhythm(rows){return `<div class="pv8-rhythm-bars">${rows.map(r=>{const sc=dayRhythm(r.a);return `<button type="button" onclick="focusPlannerDayV8('${r.date}')"><span class="pv8-bar"><i style="height:${Math.max(8,sc)}%"></i></span><b>${dayLabel(r.d).slice(0,1)}</b><small>${r.d.getDate()}</small></button>`}).join('')}</div>`}
  function planSummary(items){if(!items?.length)return '<span class="pv8-no-plan">Sem plano</span>';return items.map(x=>`<span>${esc(x)}</span>`).join('')}
  function actualSummary(a){if(!a.exists)return 'Sem registro';if(a.done){const names=a.types.length?a.types.map(titleCase).join(' + '):'Movimento';return names+(a.minutes?` · ${a.minutes} min`:'')}if(a.closed)return 'Dia concluído';return 'Sem treino registrado'}
  function editorChips(date,planned){return ['Musculação','Cardio','Caminhada','Mobilidade','Descanso'].map(t=>`<button type="button" data-pv8-plan="${t}" class="${planned.includes(t)?'active':''}" onclick="togglePlanV8(this,'${date}')">${t}</button>`).join('')}
  function renderPlanner(rows){
    const completion=weekCompletion(rows),done=trainingCount(rows),planned=plannedCount(rows),sleep=avg(rows.map(x=>x.a.sleep)),water=avg(rows.map(x=>x.a.water)),minutes=rows.reduce((s,x)=>s+x.a.minutes+x.a.movement,0),ins=plannerInsight(rows),st=streak(),ws=rows[0].date,we=rows[6].date;
    return `<div class="planner-v8" data-pv8-planner="1">
      <div class="pv8-hero"><div class="pv8-topline"><div><span>PLANNER+</span><small>${fdate(ws)} — ${fdate(we)}</small></div><div class="pv8-streak">🔥 ${st}</div></div>
      <div class="pv8-hero-main"><div><small>SEU RITMO DA SEMANA</small><h2>${completion?completion+'%':'Comece pelo plano'}</h2><p>${planned?`${done} de ${planned} dias planejados já apareceram nos registros.`:'Escolha os dias que cabem na sua rotina. O app compara plano e realidade.'}</p></div><div class="pv8-ring" style="--pv8:${completion*3.6}deg"><b>${completion}%</b><span>plano</span></div></div>
      <div class="pv8-weeknav"><button onclick="openPlanner(${V8.plannerOffset-1})">‹</button><b>${V8.plannerOffset===0?'SEMANA ATUAL':V8.plannerOffset>0?`+${V8.plannerOffset} SEMANA${V8.plannerOffset>1?'S':''}`:`${Math.abs(V8.plannerOffset)} SEMANA${Math.abs(V8.plannerOffset)>1?'S':''} ATRÁS`}</b><button onclick="openPlanner(${V8.plannerOffset+1})">›</button></div></div>
      <div class="pv8-kpis"><div><span>◉</span><b>${done}</b><small>dias ativos</small></div><div><span>↗</span><b>${minutes||0}</b><small>min movimento</small></div><div><span>☾</span><b>${sleep?fmtMinutes(sleep):'—'}</b><small>sono médio</small></div><div><span>◌</span><b>${water?`${(water/1000).toFixed(1)}L`:'—'}</b><small>água média</small></div></div>
      <section class="pv8-panel"><div class="pv8-panel-head"><div><small>RITMO</small><h3>Como sua semana está andando</h3></div><span>7 dias</span></div>${renderRhythm(rows)}<div class="pv8-legend"><span><i class="on"></i> mais registros</span><span><i></i> menos registros</span></div></section>
      <section class="pv8-insight"><span>${ins.icon}</span><div><small>LEITURA DA SEMANA</small><h3>${esc(ins.title)}</h3><p>${esc(ins.text)}</p></div></section>
      <section class="pv8-panel pv8-weight"><div class="pv8-panel-head"><div><small>TENDÊNCIA</small><h3>Peso</h3></div><button type="button" onclick="closeModal(true);go('progress')">VER PROGRESSO</button></div>${miniWeight()}</section>
      <div class="pv8-section-title"><div><small>PLANEJAMENTO</small><h3>Organize os próximos dias</h3></div><span>toque no dia</span></div>
      <div class="pv8-days">${rows.map(r=>`<section class="pv8-day ${r.date===iso()?'today':''} ${r.a.done?'done':''}" id="pv8-${r.date}"><button type="button" class="pv8-day-main" onclick="editPlannerDayV8('${r.date}')"><span class="pv8-date"><small>${dayLabel(r.d)}</small><b>${r.d.getDate()}</b></span><span class="pv8-day-body"><b>${r.date===iso()?'Hoje':r.a.done?'Realizado':'Planejamento'}</b><small>${esc(actualSummary(r.a))}</small><i>${planSummary(r.planned)}</i></span><span class="pv8-chevron">›</span></button><div class="pv8-day-edit" data-editor="${r.date}"><small>O que você pretende fazer?</small><div class="pv8-plan-chips">${editorChips(r.date,r.planned)}</div></div></section>`).join('')}</div>
      <button class="btn full pv8-save" onclick="savePlannerV8()">SALVAR MINHA SEMANA</button><p class="pv8-footnote">Planner+ organiza sua rotina e seus próprios registros. Não substitui avaliação ou prescrição individual.</p></div>`;
  }

  window.openPlanner=async function(offset=V8.plannerOffset){
    if(!plannerAccess())return plannerUpgrade();
    V8.plannerOffset=Number(offset)||0;V8.level='planner';V8.week=null;
    const start=monday(V8.plannerOffset),ws=di(start);
    loading(true,'Montando seu ritmo...');
    const {data,error}=await sb.from('planner_weeks').select('*').eq('user_id',user.id).eq('week_start',ws).maybeSingle();
    loading(false);if(error)return toast('Não foi possível abrir o Planner+');
    planner=data||{week_start:ws,goals:{version:3,days:{}},review:{}};V8.plannerDraft=normPlan(planner);
    modal(renderPlanner(weekData(V8.plannerOffset)));markModal('planner');
  };
  window.editPlannerDayV8=function(date){const target=document.querySelector(`[data-editor="${date}"]`);if(!target)return;document.querySelectorAll('.pv8-day-edit.open').forEach(x=>{if(x!==target)x.classList.remove('open')});target.classList.toggle('open')};
  window.focusPlannerDayV8=function(date){const el=document.querySelector('#pv8-'+date);if(!el)return;el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>{const ed=el.querySelector('.pv8-day-edit');if(ed&&!ed.classList.contains('open'))ed.classList.add('open')},250)};
  window.togglePlanV8=function(btn,date){const wrap=btn.closest('.pv8-plan-chips');if(!wrap)return;if(btn.dataset.pv8Plan==='Descanso'&&!btn.classList.contains('active'))wrap.querySelectorAll('button').forEach(x=>x.classList.remove('active'));else if(btn.dataset.pv8Plan!=='Descanso')wrap.querySelector('[data-pv8-plan="Descanso"]')?.classList.remove('active');btn.classList.toggle('active');V8.plannerDraft.days=V8.plannerDraft.days||{};V8.plannerDraft.days[date]=[...wrap.querySelectorAll('button.active')].map(x=>x.dataset.pv8Plan)};
  window.savePlannerV8=async function(){const p={user_id:user.id,week_start:planner.week_start,focus:'Ritmo semanal',goals:{version:3,days:V8.plannerDraft.days||{}},plan_b:null,review:planner.review||{}};loading(true,'Salvando sua semana...');const {error}=await sb.from('planner_weeks').upsert(p,{onConflict:'user_id,week_start'});loading(false);if(error)return toast('Não foi possível salvar');planner=p;toast('Semana salva ✓');await window.openPlanner(V8.plannerOffset)};
  window.__VIDA_EXPERIENCE_VERSION='8.0.0';
})();
