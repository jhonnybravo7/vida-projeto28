(()=>{
  const ACCENT='#c4ff59';
  const WEEK_COPY={
    1:{icon:'01',eyebrow:'SEMANA 1',title:'Como emagrecer',subtitle:'Entenda o processo e comece com um plano que você consegue repetir.'},
    2:{icon:'02',eyebrow:'SEMANA 2',title:'Como se alimentar',subtitle:'Organize escolhas sem transformar comida em medo.'},
    3:{icon:'03',eyebrow:'SEMANA 3',title:'Como se movimentar',subtitle:'Força, cardio e movimento cotidiano trabalhando juntos.'},
    4:{icon:'04',eyebrow:'SEMANA 4',title:'Como continuar',subtitle:'Construa uma versão da rotina que sobreviva aos dias imperfeitos.'}
  };
  const TRAINING=window.VIDA_TRAINING||{};

  // THEME
  const root=document.documentElement;
  function resolvedTheme(mode){return mode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode}
  function applyTheme(mode=localStorage.getItem('vida_theme')||'light'){
    localStorage.setItem('vida_theme',mode);
    root.dataset.theme=resolvedTheme(mode);
    root.dataset.themeMode=mode;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=root.dataset.theme==='dark'?'#0d100e':'#f6f7f4';
    document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===mode));
  }
  window.setVidaTheme=applyTheme;
  window.cycleVidaTheme=()=>{
    const mode=localStorage.getItem('vida_theme')||'light';
    applyTheme(mode==='system'?'dark':mode==='dark'?'light':'system');
  };
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((localStorage.getItem('vida_theme')||'light')==='system')applyTheme('system')});

  function decorateHeader(){
    const top=document.querySelector('.top'); if(!top)return;
    const quick=top.querySelector('.theme-quick');
    if(quick)quick.remove();
    const actions=top.querySelector('.top-actions');
    if(actions){
      const avatar=actions.querySelector('.avatar');
      if(avatar)top.appendChild(avatar);
      actions.remove();
    }
  }

  // MODAL NAVIGATION: details return to the active week instead of the 4-week list.
  const baseClose=window.closeModal;
  let parentWeek=null;
  window.closeModal=function(force=false){
    if(parentWeek&&!force){const w=parentWeek;parentWeek=null;return window.openWeek(w)}
    parentWeek=null;return baseClose();
  };
  window.returnToWeek=i=>{parentWeek=null;window.openWeek(i)};
  function detailBack(i){
    const c=document.querySelector('#modalContent');
    if(!c||c.querySelector('.detail-back'))return;
    c.insertAdjacentHTML('afterbegin',`<button class="detail-back" onclick="returnToWeek(${i})">← Semana ${i}</button>`);
  }

  // WEEK EXPERIENCE
  function lessonDone(i,j){return S.progress.some(p=>p.content_slug===`lesson-${i}-${j}`)}
  function workoutHTML(i){
    const w=TRAINING[i];
    if(!w)return '<section class="training-v6"><div class="training-note">Carregando treino da semana...</div></section>';
    return `<section class="training-v6"><div class="training-heading"><span>${w.level}</span><h3>${w.title}</h3><p>${w.summary}</p></div>${w.blocks.map(bl=>`<div class="training-block"><div class="training-block-title">${bl.name}</div>${bl.items.map((x,n)=>`<div class="training-exercise"><div class="training-check">${n+1}</div><div><b>${x[0]}</b><span>${x[1]}</span><small>${x[2]}</small></div></div>`).join('')}</div>`).join('')}<div class="training-note">${w.note}</div></section>`
  }
  window.openWeek=function(i){
    if(!master()&&day()<weeks[i].unlock)return toast('Essa semana ainda não abriu');
    parentWeek=null;
    const w=WEEK_COPY[i],done=(lessons[i]||[]).filter((_,j)=>lessonDone(i,j)).length;
    modal(`<div class="week-shell-v6">
      <div class="week-hero-v6"><span>${w.eyebrow}</span><div class="week-index-v6">${w.icon}</div><h1>${w.title}</h1><p>${w.subtitle}</p><div class="week-progress-v6"><b>${done}/${lessons[i].length}</b><span>conhecimentos concluídos</span><div><i style="width:${Math.round(done/lessons[i].length*100)}%"></i></div></div></div>
      <div class="sectiontitle v6-title"><h2>Conhecimentos</h2><small>toque para abrir</small></div>
      <div class="lesson-list-v6">${lessons[i].map((x,j)=>`<button class="lesson-v6 ${lessonDone(i,j)?'done':''}" onclick="openLesson(${i},${j})"><span class="lesson-number-v6">${String(j+1).padStart(2,'0')}</span><span class="lesson-copy-v6"><b>${esc(x[0])}</b><small>${lessonDone(i,j)?'Concluído':'Leitura rápida'}</small></span><span class="lesson-arrow-v6">›</span></button>`).join('')}</div>
      <div class="sectiontitle v6-title"><h2>Treino indicado</h2><small>exemplo educativo</small></div>${workoutHTML(i)}
      <div class="sectiontitle v6-title"><h2>Materiais da semana</h2><small>${materials[i].length} atividades</small></div>
      <div class="material-grid-v6">${materials[i].map((m,j)=>`<button class="material-v6" onclick="openMaterial(${i},${j})"><span>${m.checklist?'✓':m.kind==='macro'?'∑':m.kind==='measurements'?'↔':'+'}</span><div><b>${esc(m.title)}</b><small>${esc(m.description||'Abrir atividade')}</small></div><i>›</i></button>`).join('')}</div>
      <div class="knowledge-download-v6"><span>GUIA DA SEMANA ${i}</span><h3>${esc(guides[i].title)}</h3><p>${esc(guides[i].subtitle)}</p><button class="btn full" onclick="openGuide(${i})">LER CONHECIMENTOS DA SEMANA</button><button class="btn outline full" onclick="downloadGuide(${i})">↓ BAIXAR CONHECIMENTOS DA SEMANA</button></div>
    </div>`);
  };

  const baseLesson=window.openLesson;
  window.openLesson=function(i,j){parentWeek=i;baseLesson(i,j);requestAnimationFrame(()=>detailBack(i))};
  const baseGuide=window.openGuide;
  window.openGuide=function(i){parentWeek=i;baseGuide(i);requestAnimationFrame(()=>{detailBack(i);const b=document.querySelector('#modalContent .guide-reader .btn');if(b)b.textContent='↓ BAIXAR CONHECIMENTOS DA SEMANA'})};
  const STATIC_GUIDES_V7=window.VIDA_REFERENCES||{};
  function renderStaticGuideV7(i,d){
    const c=document.querySelector('#modalContent');if(!c)return;
    const cards=d.cards.map(x=>'<div><b>'+esc(x[0])+'</b><p>'+esc(x[1])+'</p></div>').join('');
    c.innerHTML='<button class="detail-back" onclick="returnToWeek('+i+')">← Semana '+i+'</button><div class="reference-sheet-v7"><div class="reference-hero-v7"><span>'+esc(d.icon)+'</span><div><small>GUIA RÁPIDO · SEMANA '+i+'</small><h2>'+esc(d.title)+'</h2><p>'+esc(d.subtitle)+'</p></div></div><div class="reference-cards-v7">'+cards+'</div><div class="reference-tip-v7"><b>LEMBRETE</b><p>'+esc(d.tip)+'</p></div></div>';
  }
  const baseMaterial=window.openMaterial;
  window.openMaterial=async function(i,j){
    parentWeek=i;
    await baseMaterial(i,j);
    requestAnimationFrame(()=>{
      detailBack(i);
      const d=STATIC_GUIDES_V7[materials[i]?.[j]?.title];
      if(d)renderStaticGuideV7(i,d); else enhanceMaterialControls();
    });
  };

  // More mobile-friendly material controls.
  const oldEditable=window.editableTable;
  window.editableTable=function(headers,rows,s={}){
    if(headers.includes('Feito?')){
      return `<div class="mobile-log-list">${rows.map((r,ri)=>`<div class="mobile-log-card"><div class="mobile-log-day">${r}</div><label>Plano principal<input data-mi data-key="t${ri}_0" value="${esc(s[`t${ri}_0`]||'')}"></label><label>Plano B<input data-mi data-key="t${ri}_1" value="${esc(s[`t${ri}_1`]||'')}"></label><label class="mobile-done"><input data-mi data-key="t${ri}_2" type="checkbox" ${s[`t${ri}_2`]===true||s[`t${ri}_2`]==='true'?'checked':''}><span>Feito</span></label></div>`).join('')}</div>`;
    }
    if(headers.some(h=>/Fome 0–10/i.test(h))){
      return `<div class="mobile-log-list">${rows.map((r,ri)=>`<div class="mobile-log-card diary"><div class="mobile-log-day">${r}</div><label>Fome antes <div class="range-line"><input data-mi data-key="t${ri}_0" type="range" min="0" max="10" value="${esc(s[`t${ri}_0`]||5)}" oninput="this.nextElementSibling.value=this.value"><output>${esc(s[`t${ri}_0`]||5)}</output></div></label><label>O que comi<input data-mi data-key="t${ri}_1" value="${esc(s[`t${ri}_1`]||'')}"></label><label>Saciedade depois <div class="range-line"><input data-mi data-key="t${ri}_2" type="range" min="0" max="10" value="${esc(s[`t${ri}_2`]||5)}" oninput="this.nextElementSibling.value=this.value"><output>${esc(s[`t${ri}_2`]||5)}</output></div></label><label>Observação<input data-mi data-key="t${ri}_3" value="${esc(s[`t${ri}_3`]||'')}"></label></div>`).join('')}</div>`;
    }
    return oldEditable(headers,rows,s);
  };

  function enhanceMaterialControls(){
    const c=document.querySelector('#modalContent');if(!c)return;
    c.querySelectorAll('select[data-mi]').forEach(sel=>{
      if(sel.dataset.chips==='1')return; sel.dataset.chips='1';sel.classList.add('select-hidden-v6');
      const wrap=document.createElement('div');wrap.className='choice-chips-v6';
      [...sel.options].filter(o=>o.value).forEach(o=>{const b=document.createElement('button');b.type='button';b.textContent=o.textContent;b.className='choice-chip-v6'+(sel.value===o.value?' active':'');b.onclick=()=>{sel.value=o.value;wrap.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};wrap.appendChild(b)});
      sel.insertAdjacentElement('afterend',wrap);
    });
    c.querySelectorAll('input[data-mi][type="number"]').forEach(inp=>{
      const field=inp.closest('.field');const label=field?.querySelector('label')?.textContent||'';
      if(!/peso/i.test(label)||inp.dataset.stepper==='1')return;inp.dataset.stepper='1';
      inp.step='0.1';const wrap=document.createElement('div');wrap.className='number-stepper-v6';
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.onclick=()=>stepInput(inp,-.1);
      const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.onclick=()=>stepInput(inp,.1);
      inp.parentNode.insertBefore(wrap,inp);wrap.append(minus,inp,plus);
    });
  }
  function stepInput(inp,delta){const base=Number(inp.value||0);inp.value=Math.max(0,Math.round((base+delta)*10)/10).toFixed(1);inp.dispatchEvent(new Event('input',{bubbles:true}))}
  window.stepInput=stepInput;

  // TRACKING — visual + multi-select workout types.
  window.track=function(){
    const c=todayCheck(),water=c.water_ml||0,goal=2000,pct=Math.min(100,Math.round(water/goal*100));
    const types=String(c.training_type||'').split(',').map(x=>x.trim()).filter(Boolean);
    return `<section class="screen track-v6"><div class="compact-hero-v6"><div><span>HOJE · DIA ${day()}</span><h1>Seu dia em movimento.</h1><p>Registre em poucos toques.</p></div><div class="day-ring-v6" style="--p:${score()*3.6}deg"><b>${score()}%</b><small>constância</small></div></div>
      <div class="track-grid-v6">
        <button class="track-card-v6 water-card-v6" onclick="waterExact()"><span>HIDRATAÇÃO</span><div class="water-ring-v6" style="--water:${pct*3.6}deg"><b>${water}</b><small>ml</small></div><p>${pct}% de uma referência visual de 2 L</p><div class="quick-row-v6"><i onclick="event.stopPropagation();water(250)">+250</i><i onclick="event.stopPropagation();water(500)">+500</i></div></button>
        <button class="track-card-v6" onclick="sleep()"><span>SONO</span><strong>${c.sleep_minutes?`${Math.floor(c.sleep_minutes/60)}h${String(c.sleep_minutes%60).padStart(2,'0')}`:'—'}</strong><p>${c.sleep_feeling||'Toque para registrar'}</p><i class="mini-status-v6">${c.sleep_minutes?'REGISTRADO ✓':'REGISTRAR'}</i></button>
      </div>
      <button class="big-action-v6" onclick="training()"><div><span>TREINO E MOVIMENTO</span><h3>${types.length?types.map(x=>x[0].toUpperCase()+x.slice(1)).join(' + '):'O que você fez hoje?'}</h3><p>${c.training_minutes?`${c.training_minutes} min de treino`:''}${c.training_minutes&&c.movement_minutes?' · ':''}${c.movement_minutes?`${c.movement_minutes} min extras`:''}${!c.training_minutes&&!c.movement_minutes?'Você pode marcar mais de um tipo.':''}</p></div><b>+</b></button>
      <button class="big-action-v6" onclick="measurements()"><div><span>PESO E MEDIDAS</span><h3>${S.measurements[0]?.weight_kg?S.measurements[0].weight_kg+' kg':'Registrar peso'}</h3><p>Use o contador para ajustar de 0,1 em 0,1 kg.</p></div><b>›</b></button>
      <button class="daily-close-v6 ${c.daily_checkin_completed?'done':''}" onclick="daily()"><span>${c.daily_checkin_completed?'✓':'○'}</span><div><b>${c.daily_checkin_completed?'Dia concluído':'Fechar meu dia'}</b><small>Conta no Score de Constância.</small></div></button>
      <div class="sectiontitle"><h2>Planner+</h2></div>${plannerCard()}
    </section>`;
  };

  const trainingTypes=['musculação','cardio','caminhada','corrida','bike','outro'];
  window.training=function(){
    const c=todayCheck(),selected=String(c.training_type||'').split(',').map(x=>x.trim()).filter(Boolean);
    modal(`<div class="article training-modal-v6"><span class="badge">REGISTRO RÁPIDO</span><h2>Treino e movimento</h2><p class="lead">Marque tudo que fez hoje. Pode selecionar mais de uma opção.</p><div class="multi-choice-v6" id="trainingChoices">${trainingTypes.map(x=>`<button type="button" data-training="${x}" class="${selected.includes(x)?'active':''}" onclick="this.classList.toggle('active')">${x}</button>`).join('')}</div><div class="duration-v6"><label>Tempo de treino <b id="trainingMinutesLabel">${c.training_minutes||30} min</b></label><input id="tm" type="range" min="0" max="180" step="5" value="${c.training_minutes||30}" oninput="$('#trainingMinutesLabel').textContent=this.value+' min'"><div class="quick-min-v6">${[20,30,45,60].map(x=>`<button type="button" onclick="$('#tm').value=${x};$('#trainingMinutesLabel').textContent='${x} min'">${x}</button>`).join('')}</div></div><div class="duration-v6"><label>Movimento extra <b id="movementMinutesLabel">${c.movement_minutes||0} min</b></label><input id="mm" type="range" min="0" max="180" step="5" value="${c.movement_minutes||0}" oninput="$('#movementMinutesLabel').textContent=this.value+' min'"></div><button class="btn full" onclick="saveTrainingV6()">SALVAR REGISTRO</button></div>`);
  };
  window.saveTrainingV6=async()=>{
    const selected=[...document.querySelectorAll('#trainingChoices [data-training].active')].map(b=>b.dataset.training);
    const tm=n($('#tm').value),mm=n($('#mm').value);
    await upCheck({trained:selected.length>0,training_type:selected.join(', '),training_minutes:tm,movement_minutes:mm});
    baseClose();
  };

  window.measurements=function(){
    const m=S.measurements[0]||{},weight=Number(m.weight_kg||S.onboarding?.initial_weight_kg||70);
    modal(`<div class="article measure-v6"><span class="badge">REGISTRO</span><h2>Peso e medidas</h2><p class="lead">Ajuste o peso de 0,1 em 0,1 kg ou toque no número para digitar.</p><div class="weight-counter-v6"><button type="button" onclick="stepInput($('#mw'),-.1)">−</button><div><input id="mw" type="number" step="0.1" value="${weight.toFixed(1)}"><span>kg</span></div><button type="button" onclick="stepInput($('#mw'),.1)">+</button></div><details class="extra-measures-v6"><summary>Adicionar outras medidas <span>+</span></summary><div class="form-grid">${[['mc','Cintura',m.waist_cm],['ma','Abdômen',m.abdomen_cm],['mh','Quadril',m.hip_cm],['mb','Braço',m.arm_cm],['mt','Coxa',m.thigh_cm]].map(x=>`<div class="field"><label>${x[1]} (cm)</label><input id="${x[0]}" type="number" step="0.1" value="${x[2]||''}"></div>`).join('')}</div></details><button class="btn full" onclick="saveMeasurements()">SALVAR REGISTRO</button></div>`);
  };

  // Profile appearance control and visual polish.
  function enhanceProfile(){
    const screen=document.querySelector('#view .screen');if(!screen||screen.querySelector('.appearance-v6'))return;
    const firstCard=screen.querySelector('.card.top-gap');if(!firstCard)return;
    firstCard.insertAdjacentHTML('afterend',`<div class="card top-gap appearance-v6"><div><span class="badge">APARÊNCIA</span><h3>Tema do aplicativo</h3><p>Escolha claro, escuro ou acompanhe o aparelho.</p></div><div class="theme-segment-v6"><button data-theme-choice="light" onclick="setVidaTheme('light')">☀ Claro</button><button data-theme-choice="dark" onclick="setVidaTheme('dark')">● Escuro</button><button data-theme-choice="system" onclick="setVidaTheme('system')">◐ Aparelho</button></div></div>`);applyTheme(localStorage.getItem('vida_theme')||'light');
  }
  // V7 — calendário, insights e gráficos de evolução.
  function insightV7(){
    const c=todayCheck(),sleep=Number(c.sleep_minutes||0),water=Number(c.water_ml||0);
    if(sleep&&sleep<360)return {icon:'☾',title:'Sono curto no registro',text:'Você registrou '+Math.floor(sleep/60)+'h'+String(sleep%60).padStart(2,'0')+' de sono. Se estiver cansada, considere reduzir a intensidade hoje e priorizar recuperação e um horário de descanso mais cedo.'};
    if(sleep&&c.trained)return {icon:'↗',title:'Treino + recuperação',text:'Treino registrado. Sono, alimentação e hidratação ao longo do dia ajudam a sustentar recuperação e constância.'};
    if(water>0&&water<1000)return {icon:'◌',title:'Hidratação em andamento',text:'Você registrou '+water+' ml até agora. Continue registrando ao longo do dia conforme sua rotina e necessidades individuais.'};
    if(c.daily_checkin_completed)return {icon:'✓',title:'Dia registrado',text:'Seu dia já virou dado. Use a tendência de vários dias para decidir o que ajustar, não um registro isolado.'};
    return {icon:'•',title:'Seu próximo registro',text:'Água, sono, movimento e medidas ficam mais úteis quando formam uma sequência. Registre o que aconteceu, sem tentar “acertar” o dia.'};
  }
  const trackV6Base=window.track;
  window.track=function(){
    let html=trackV6Base();
    const i=insightV7();
    const card='<div class="insight-v7"><span>'+i.icon+'</span><div><small>LEITURA DO DIA</small><b>'+esc(i.title)+'</b><p>'+esc(i.text)+'</p></div></div>';
    return html.replace('<div class="track-grid-v6">',card+'<div class="track-grid-v6">');
  };

  function weekMondayV7(offset=0){
    const d=new Date(),dow=d.getDay()||7;d.setHours(12,0,0,0);d.setDate(d.getDate()-dow+1+offset*7);return d;
  }
  function dateIsoV7(d){return d.toISOString().slice(0,10)}
  function plusDaysV7(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function dayNameV7(d){return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]}
  let plannerOffsetV7=0,plannerDraftV7={};
  function normalizePlannerV7(p){const g=p?.goals;return g&&!Array.isArray(g)&&g.version===2?g:{version:2,days:{}}}
  function actualV7(date){
    const c=S.checkins.find(x=>x.checkin_date===date);if(!c)return null;
    const types=String(c.training_type||'').split(',').map(x=>x.trim()).filter(Boolean);
    return {types,minutes:c.training_minutes||0,done:!!c.trained||!!c.movement_minutes};
  }
  window.openPlanner=async function(offset=plannerOffsetV7){
    if(!plannerAccess())return plannerUpgrade();
    plannerOffsetV7=offset;
    const start=weekMondayV7(offset),ws=dateIsoV7(start),days7=Array.from({length:7},(_,k)=>plusDaysV7(start,k));
    loading(true,'Abrindo calendário...');
    const {data,error}=await sb.from('planner_weeks').select('*').eq('user_id',user.id).eq('week_start',ws).maybeSingle();
    loading(false);if(error)return toast('Não foi possível abrir o Planner+');
    planner=data||{week_start:ws,goals:{version:2,days:{}},review:{}};
    plannerDraftV7=normalizePlannerV7(planner);
    const cards=days7.map(d=>{
      const di=dateIsoV7(d),a=actualV7(di),planned=plannerDraftV7.days?.[di]||[];
      const chips=['Musculação','Cardio','Caminhada','Mobilidade','Descanso'].map(t=>'<button type="button" data-plan="'+t+'" class="'+(planned.includes(t)?'active':'')+'" onclick="togglePlanV7(this,\''+di+'\')">'+t+'</button>').join('');
      const actual=a?.done?'<div class="planner-actual-v7"><b>Registrado</b><span>'+(a.types.length?esc(a.types.join(' + ')):'movimento')+(a.minutes?' · '+a.minutes+' min':'')+'</span></div>':'';
      return '<section class="planner-day-v7 '+(di===iso()?'today':'')+'" data-date="'+di+'"><div class="planner-day-head-v7"><div><small>'+dayNameV7(d)+'</small><b>'+d.getDate()+'</b></div><span class="'+(a?.done?'done':'')+'">'+(a?.done?'✓ realizado':'planejar')+'</span></div><div class="planner-chips-v7">'+chips+'</div>'+actual+'</section>';
    }).join('');
    modal('<div class="planner-v7"><div class="planner-top-v7"><span class="badge">PLANNER+</span><h2>Minha semana</h2><p>Planeje treinos no calendário e compare com o que realmente aconteceu.</p></div><div class="planner-nav-v7"><button onclick="openPlanner('+(offset-1)+')">‹</button><b>'+fdate(ws)+' — '+fdate(dateIsoV7(days7[6]))+'</b><button onclick="openPlanner('+(offset+1)+')">›</button></div><div class="planner-summary-v7"><div><b id="planStrength">0</b><span>força</span></div><div><b id="planCardio">0</b><span>cardio</span></div><div><b id="planDone">0</b><span>realizados</span></div></div><div class="planner-days-v7">'+cards+'</div><button class="btn full planner-save-v7" onclick="savePlannerV7()">SALVAR CALENDÁRIO</button></div>');
    refreshPlannerV7();
  };
  window.togglePlanV7=function(btn,date){
    btn.classList.toggle('active');plannerDraftV7.days=plannerDraftV7.days||{};
    const card=btn.closest('.planner-day-v7');plannerDraftV7.days[date]=[...card.querySelectorAll('[data-plan].active')].map(x=>x.dataset.plan);refreshPlannerV7();
  };
  window.refreshPlannerV7=function(){
    const vals=Object.values(plannerDraftV7.days||{}).flat();
    const strength=vals.filter(x=>x==='Musculação').length,cardio=vals.filter(x=>x==='Cardio'||x==='Caminhada').length;
    const st=weekMondayV7(plannerOffsetV7),dates=Array.from({length:7},(_,k)=>dateIsoV7(plusDaysV7(st,k))),done=dates.filter(d=>actualV7(d)?.done).length;
    const a=$('#planStrength'),b=$('#planCardio'),c=$('#planDone');if(a)a.textContent=strength;if(b)b.textContent=cardio;if(c)c.textContent=done;
  };
  window.savePlannerV7=async function(){
    const p={user_id:user.id,week_start:planner.week_start,focus:'Calendário semanal',goals:plannerDraftV7,plan_b:null,review:planner.review||{}};
    loading(true,'Salvando calendário...');const {error}=await sb.from('planner_weeks').upsert(p,{onConflict:'user_id,week_start'});loading(false);
    if(error)return toast('Não foi possível salvar');toast('Semana salva');
  };

  function seriesV7(field,limit=14){
    const m=new Map();[...S.measurements].reverse().forEach(x=>{const v=Number(x[field]);if(Number.isFinite(v)&&v>0)m.set(x.measured_on,{date:x.measured_on,v})});return [...m.values()].slice(-limit);
  }
  function sparkV7(points,unit){
    if(!points.length)return '<div class="empty-chart-v7">Ainda não há registros.</div>';
    const vals=points.map(p=>p.v),min=Math.min(...vals),max=Math.max(...vals),span=max-min||1,w=320,h=108,pad=12;
    const coords=points.map((p,i)=>[points.length===1?w/2:pad+i*(w-2*pad)/(points.length-1),h-pad-(p.v-min)*(h-2*pad)/span]);
    const path=coords.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    const delta=points.length>1?points[points.length-1].v-points[0].v:0;
    const circles=coords.map((p,i)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i===coords.length-1?4:2.5)+'"/>').join('');
    return '<div class="trend-head-v7"><b>'+points[points.length-1].v.toFixed(1)+' '+unit+'</b><span>'+(points.length>1?(delta>0?'+':'')+delta.toFixed(1)+' '+unit:'primeiro registro')+'</span></div><svg class="spark-v7" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><path class="spark-grid-v7" d="M12 30 H308 M12 54 H308 M12 78 H308"/><path class="spark-line-v7" d="'+path+'"/>'+circles+'</svg><div class="trend-foot-v7"><span>'+fdate(points[0].date)+'</span><span>'+fdate(points[points.length-1].date)+'</span></div>';
  }
  function checkSeriesV7(field){return [...S.checkins].reverse().filter(c=>Number(c[field])>0).slice(-7).map(c=>({date:c.checkin_date,v:Number(c[field])}))}
  function barsV7(points,fmt){
    if(!points.length)return '<div class="empty-chart-v7">Sem registros ainda.</div>';const max=Math.max(...points.map(p=>p.v),1);
    return '<div class="bars-v7">'+points.map(p=>'<div><span style="height:'+Math.max(8,p.v/max*100)+'%"></span><small>'+p.date.slice(8)+'</small><i>'+fmt(p.v)+'</i></div>').join('')+'</div>';
  }
  const progressBaseV7=window.progress;
  window.progress=function(){
    let html=progressBaseV7(),weight=seriesV7('weight_kg'),waist=seriesV7('waist_cm'),abd=seriesV7('abdomen_cm'),sleep=checkSeriesV7('sleep_minutes'),water=checkSeriesV7('water_ml');
    const visual='<div class="sectiontitle"><h2>Minha evolução</h2><small>registros reais</small></div><div class="trend-card-v7"><div class="trend-title-v7"><b>Peso</b><span>'+weight.length+' registros</span></div>'+sparkV7(weight,'kg')+'</div><div class="trend-grid-v7"><div class="trend-card-v7 compact"><div class="trend-title-v7"><b>Cintura</b></div>'+sparkV7(waist,'cm')+'</div><div class="trend-card-v7 compact"><div class="trend-title-v7"><b>Abdômen</b></div>'+sparkV7(abd,'cm')+'</div></div><div class="sectiontitle"><h2>Últimos registros</h2><small>7 entradas</small></div><div class="trend-card-v7"><div class="trend-title-v7"><b>Sono</b><span>horas</span></div>'+barsV7(sleep,v=>(v/60).toFixed(1)+'h')+'</div><div class="trend-card-v7"><div class="trend-title-v7"><b>Hidratação</b><span>ml</span></div>'+barsV7(water,v=>Math.round(v/100)/10+'L')+'</div>';
    const m='<p class="notice top-gap">';return html.includes(m)?html.replace(m,visual+m):html.replace('</section>',visual+'</section>');
  };

  const priorGo=window.go;
  window.go=function(s){priorGo(s);requestAnimationFrame(()=>{decorateHeader();if(s==='profile')enhanceProfile();if(s==='track'){};})};
  decorateHeader();
  window.__VIDA_EXPERIENCE_VERSION='7.0.0';
})();