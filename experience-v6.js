(()=>{
  const ACCENT='#c4ff59';
  const WEEK_COPY={
    1:{icon:'01',eyebrow:'SEMANA 1',title:'Como emagrecer',subtitle:'Entenda o processo e comece com um plano que você consegue repetir.'},
    2:{icon:'02',eyebrow:'SEMANA 2',title:'Como se alimentar',subtitle:'Organize escolhas sem transformar comida em medo.'},
    3:{icon:'03',eyebrow:'SEMANA 3',title:'Como se movimentar',subtitle:'Força, cardio e movimento cotidiano trabalhando juntos.'},
    4:{icon:'04',eyebrow:'SEMANA 4',title:'Como continuar',subtitle:'Construa uma versão da rotina que sobreviva aos dias imperfeitos.'}
  };
  const TRAINING={
    1:{
      level:'COMEÇAR / VOLTAR',title:'Treino base da primeira semana',summary:'Duas rotinas simples para voltar a treinar sem precisar começar no máximo.',
      blocks:[
        {name:'SUPERIORES',items:[
          ['Puxada frontal aberta','2–3 × 10–12','Se o ombro incomodar, use pegada neutra ou mais fechada e amplitude confortável.'],
          ['Desenvolvimento máquina','2–3 × 10–12','Se houver desconforto no ombro, reduza amplitude/carga ou troque por elevação lateral leve se tolerada.'],
          ['Tríceps na polia com corda','2–3 × 10–12','Mantenha cotovelos estáveis; reduza carga se perder controle.'],
          ['Rosca direta','2–3 × 10–12','Pode ser feita na polia, máquina ou com halteres leves.'],
          ['Cardio','15–30 min','Para reduzir impacto: bicicleta, elíptico ou caminhada sem corrida.']
        ]},
        {name:'INFERIORES',items:[
          ['Leg press','2–3 × 10–12','Use amplitude confortável. Se o joelho incomodar, reduza amplitude e carga.'],
          ['Cadeira flexora','2–3 × 10–12','Movimento lento e controlado; não precisa buscar carga máxima.'],
          ['Elevação pélvica','2–3 × 10–12','Pode ser no solo, banco ou máquina, conforme conforto.'],
          ['Cadeira adutora','2–3 × 10–15','Amplitude confortável, sem forçar abertura ou fechamento.'],
          ['Cadeira abdutora','2–3 × 10–15','Controle o retorno e evite embalo.'],
          ['Panturrilhas','2–3 × 12–15','Em pé, sentado ou no leg press, conforme disponibilidade.'],
          ['Cardio','15–30 min','Baixo impacto: bicicleta ou elíptico. Caminhada também funciona.']
        ]}
      ],
      note:'Exemplo educacional para iniciar/retomar. Ajuste carga, amplitude e equipamento ao seu nível. Dor aguda, tontura, falta de ar incomum ou limitação importante pedem avaliação profissional.'
    },
    2:{level:'GANHAR RITMO',title:'Consistência antes de intensidade',summary:'Aumente frequência e qualidade sem transformar toda sessão em treino máximo.',blocks:[{name:'SUGESTÃO DA SEMANA',items:[['Força','3 sessões','Priorize movimentos que você executa bem.'],['Cardio','1–2 sessões de 20–35 min','Bike, elíptico ou caminhada se quiser reduzir impacto.'],['Movimento leve','Dias sem treino','Caminhada e tarefas do dia também contam.']]}],note:'Evolua uma variável de cada vez: frequência, duração, carga, repetições ou ritmo.'},
    3:{level:'CONSOLIDAR',title:'Força + cardio organizados',summary:'Distribua estímulos para treinar e ainda conseguir recuperar.',blocks:[{name:'SUGESTÃO DA SEMANA',items:[['Treino A','Pernas + empurrar','Ex.: leg press, flexora, supino, desenvolvimento e core.'],['Treino B','Pernas + puxar','Ex.: agachamento assistido, remada, puxada, glúteos e core.'],['Treino C','Corpo todo','4–6 movimentos que você já domina.'],['Cardio moderado','25–40 min','Baixo impacto: bike ou elíptico.']]}],note:'Se sono, disposição ou recuperação piorarem, reduza primeiro volume ou intensidade.'},
    4:{level:'CONTINUIDADE',title:'Seu treino que sobrevive à rotina',summary:'Tenha uma versão ideal e uma versão mínima para não desaparecer.',blocks:[{name:'PLANOS',items:[['Plano A','3 treinos + 2 cardios/movimentos','Use em semanas normais.'],['Plano B','2 treinos de corpo todo + caminhadas','Use em semanas corridas.'],['Plano C','1 treino curto + 2 caminhadas de 20 min','Seu mínimo viável.'],['Versão sem impacto','Bike + máquinas','Evite corrida e saltos se impacto não estiver confortável.']]}],note:'Plano B não é fracasso. É uma ferramenta para reduzir o tempo entre sair da rotina e voltar.'}
  };

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
  const baseMaterial=window.openMaterial;
  window.openMaterial=async function(i,j){parentWeek=i;await baseMaterial(i,j);requestAnimationFrame(()=>{detailBack(i);enhanceMaterialControls()})};

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
  const priorGo=window.go;
  window.go=function(s){priorGo(s);requestAnimationFrame(()=>{decorateHeader();if(s==='profile')enhanceProfile();if(s==='track'){};})};
  decorateHeader();
  window.__VIDA_EXPERIENCE_VERSION='6.0.0';
})();