(()=>{
  const WEEK_VISUALS={
    1:{icon:'◎',kicker:'ENTENDER',title:'Seu ponto de partida',text:'Peso é um dado. O processo é maior que a balança.',tone:'blue'},
    2:{icon:'◒',kicker:'ALIMENTAR',title:'Leia seu prato',text:'Reconheça proteína, carboidrato, gordura, fibras e contexto.',tone:'green'},
    3:{icon:'↗',kicker:'MOVER',title:'Construa ritmo',text:'Força, cardio e movimento cotidiano trabalhando juntos.',tone:'orange'},
    4:{icon:'∞',kicker:'CONTINUAR',title:'Não volte ao zero',text:'Plano A, plano B e uma forma simples de recomeçar.',tone:'pink'}
  };

  const WORKOUTS={
    1:{
      level:'COMEÇAR / VOLTAR',title:'Treino de adaptação',summary:'Para quem está começando ou voltando. O objetivo é terminar a semana sentindo que conseguiria repetir.',
      plan:['2 treinos de corpo todo','3 caminhadas de 20–30 min','1–2 dias de descanso real'],
      exercises:[
        ['Leg press ou sentar/levantar do banco','2–3 × 10–12','Se joelho incomodar: reduza amplitude e carga; se necessário, prefira banco alto.'],
        ['Puxada frontal','2–3 × 10–12','Se ombro incomodar: use pegada confortável e menor amplitude, sem forçar dor.'],
        ['Supino em máquina','2–3 × 10–12','Sem máquina: flexão na parede ou apoio alto.'],
        ['Mesa flexora','2 × 10–12','Alternativa simples: ponte de glúteos, se confortável.'],
        ['Desenvolvimento em máquina','2 × 10','Se ombro não tolerar: elevação lateral leve ou retire o movimento.'],
        ['Caminhada','20–30 min','Sem impacto: bicicleta ou elíptico em ritmo confortável.']
      ],
      note:'Use cargas leves a moderadas e pare antes de perder a técnica. Dor aguda, tontura, falta de ar incomum ou limitação importante pedem avaliação profissional.'
    },
    2:{
      level:'GANHAR RITMO',title:'Treino de ritmo moderado',summary:'Se a primeira semana encaixou, aumente consistência antes de aumentar sofrimento.',
      plan:['3 treinos de força','1–2 cardios moderados de 20–35 min','Movimento leve nos dias sem treino'],
      exercises:[
        ['Agachamento no banco ou leg press','3 × 8–12','Baixo impacto: leg press com amplitude confortável.'],
        ['Remada sentada','3 × 8–12','Ajuste o banco para não compensar com a lombar.'],
        ['Supino máquina ou halteres','3 × 8–12','Alternativa: flexão com apoio alto.'],
        ['Levantamento terra romeno leve ou flexora','2–3 × 10–12','Se não domina o padrão, mantenha a flexora.'],
        ['Puxada frontal','2–3 × 10–12','Pegada confortável e movimento controlado.'],
        ['Cardio contínuo','20–35 min','Corrida com impacto alto → bike, elíptico ou caminhada inclinada.']
      ],
      note:'A semana 2 não exige treino máximo. Termine a maior parte das séries sentindo que ainda conseguiria algumas repetições com boa técnica.'
    },
    3:{
      level:'CONSOLIDAR',title:'Força + cardio organizados',summary:'Agora a meta é combinar estímulos sem transformar todos os dias em dias pesados.',
      plan:['3 treinos de força','2 sessões de cardio ou caminhada','1 dia de recuperação ativa opcional'],
      exercises:[
        ['Treino A — pernas + empurrar','3–5 movimentos principais','Ex.: leg press, flexora, supino, desenvolvimento e core.'],
        ['Treino B — pernas + puxar','3–5 movimentos principais','Ex.: agachamento assistido, remada, puxada, glúteos e core.'],
        ['Treino C — corpo todo','4–6 movimentos','Repita padrões que você executa bem; não precisa inventar exercícios novos.'],
        ['Cardio moderado','25–40 min','Sem impacto: bike ou elíptico.'],
        ['Cardio intervalado leve','8–12 blocos curtos','Ex.: 1 min mais rápido + 1–2 min fácil. Se impacto incomodar, faça na bike.']
      ],
      note:'Se a recuperação piorar, reduza primeiro volume ou intensidade. Mais sessões só valem se você consegue se recuperar delas.'
    },
    4:{
      level:'CONTINUIDADE',title:'Seu treino que sobrevive à rotina',summary:'A melhor semana não é a perfeita. É a que tem uma versão mínima para quando o dia aperta.',
      plan:['Plano A: sua semana ideal','Plano B: versão reduzida','Plano C: mínimo viável para não desaparecer'],
      exercises:[
        ['Plano A','3 treinos + 2 movimentos/cardios','Use quando a semana estiver normal.'],
        ['Plano B','2 treinos de corpo todo + caminhadas','Use em semanas corridas.'],
        ['Plano C','1 treino curto + 2 caminhadas de 20 min','Use quando tudo sair do planejado.'],
        ['Versão curta de academia','Leg press + puxada + supino + flexora','2 séries de cada, com técnica limpa.'],
        ['Versão sem impacto','Bike + máquinas','Evite saltos e corrida se impacto não estiver confortável.']
      ],
      note:'O plano B não é fracasso. Ele existe para reduzir o tempo entre sair da rotina e voltar.'
    }
  };

  const materialHelp=(m)=>{
    const kind=m?.kind||'form';
    if(kind==='weektable') return {icon:'▦',title:'Como usar',text:'Plano principal é o que você pretende fazer. Plano B é a versão mínima caso o dia dê errado. Em “Feito?”, registre o que realmente aconteceu — não o que gostaria que tivesse acontecido.',example:'Exemplo: principal = academia 45 min · plano B = caminhada 20 min.'};
    if(kind==='diary') return {icon:'◉',title:'Como preencher',text:'Registre antes e depois de comer. Use 0 para nenhuma fome/saciedade e 10 para intensidade máxima. O objetivo é observar padrões, não buscar uma nota perfeita.',example:'Exemplo: fome 7 → almoço → saciedade 8 → “comi devagar e fiquei satisfeita”.'};
    if(kind==='macro') return {icon:'∑',title:'Teste sem prescrição',text:'Digite uma quantidade hipotética de proteína, carboidrato e gordura. O app mostra como esses gramas se transformam em energia.',example:'Exemplo: 30 g proteína + 50 g carbo + 15 g gordura = ~455 kcal.'};
    if(kind==='measurements') return {icon:'↔',title:'Compare tendência',text:'Use condições parecidas quando puder: horário semelhante e método de medição semelhante. Uma medida isolada não define evolução.',example:'Compare períodos, não centímetros de um único dia.'};
    if(kind==='comparison') return {icon:'⇄',title:'Leia como comparação',text:'Olhe o primeiro registro e o mais recente juntos. Depois, conecte os números com sono, treino, roupas, disposição e constância.',example:'Resultado não é só peso.'};
    if(kind==='external') return {icon:'↗',title:'Biblioteca visual',text:'Use a biblioteca para reconhecer nomes e execução geral. Ela não substitui ajuste individual de um profissional.',example:'Se um movimento causar dor, não force para “cumprir a lista”.'};
    if(kind==='gym') return {icon:'★',title:'Próxima etapa',text:'Aqui você não começa do zero. O Gym Rats usa o que foi construído nos 28 dias como base de constância.',example:'A próxima fase é continuidade, não punição.'};
    if(m?.checklist) return {icon:'✓',title:'Checklist de observação',text:'Marque apenas o que já aconteceu ou realmente faz sentido para você. Item desmarcado não é falha: ele mostra onde prestar atenção.',example:'Use o checklist como mapa da semana.'};
    return {icon:'✎',title:'Preencha do seu jeito',text:'Não existe resposta perfeita. Use frases curtas e concretas. A ideia é transformar um pensamento amplo em uma ação que você consiga reconhecer depois.',example:'Prefira “caminhar 20 min terça e quinta” a “me movimentar mais”.'};
  };

  function workoutHTML(i){
    const w=WORKOUTS[i];
    return `<div class="sectiontitle workout-title"><h2>Treino indicado da semana</h2><small>exemplo educativo</small></div>
      <section class="workout-card tone-${i}">
        <div class="workout-head"><div class="workout-icon">${WEEK_VISUALS[i].icon}</div><div><span class="workout-level">${w.level}</span><h3>${w.title}</h3><p>${w.summary}</p></div></div>
        <div class="workout-plan">${w.plan.map(x=>`<div><span>✓</span>${x}</div>`).join('')}</div>
        <button class="btn workout-toggle" onclick="toggleWorkout(${i})">VER EXERCÍCIOS E SUBSTITUIÇÕES</button>
        <div id="workout-${i}" class="workout-details hidden">
          ${w.exercises.map((x,n)=>`<div class="exercise-row"><div class="exercise-n">${n+1}</div><div><b>${x[0]}</b><span>${x[1]}</span><small>${x[2]}</small></div></div>`).join('')}
          <div class="workout-note">${w.note}</div>
        </div>
      </section>`;
  }

  window.toggleWorkout=function(i){
    const e=document.querySelector(`#workout-${i}`); if(!e)return;
    e.classList.toggle('hidden');
    const b=e.previousElementSibling;
    if(b) b.textContent=e.classList.contains('hidden')?'VER EXERCÍCIOS E SUBSTITUIÇÕES':'OCULTAR DETALHES';
  };

  function enhanceWeek(i){
    const c=document.querySelector('#modalContent'); if(!c)return;
    const hero=c.querySelector('.moduleHero');
    if(hero&&!c.querySelector('.week-breadcrumb')) hero.insertAdjacentHTML('beforebegin',`<button class="week-breadcrumb" onclick="closeModal()">← Voltar para as semanas</button>`);
    if(!c.querySelector('.workout-card')) c.insertAdjacentHTML('beforeend',workoutHTML(i));
    const mats=[...c.querySelectorAll('.material')];
    mats.forEach((el,j)=>{
      if(el.querySelector('.material-icon'))return;
      const m=materials[i]?.[j];
      const h=materialHelp(m);
      el.classList.add('material-visual');
      el.insertAdjacentHTML('afterbegin',`<div class="material-icon">${h.icon}</div>`);
    });
  }

  function enhanceMaterial(i,j){
    const c=document.querySelector('#modalContent .material-article'); if(!c||c.querySelector('.material-how'))return;
    const m=materials[i]?.[j]; if(!m)return;
    const h=materialHelp(m);
    const lead=c.querySelector('.lead');
    const box=`<div class="material-how"><div class="material-how-icon">${h.icon}</div><div><b>${h.title}</b><p>${h.text}</p><small>${h.example}</small></div></div>`;
    if(lead) lead.insertAdjacentHTML('afterend',box); else c.insertAdjacentHTML('afterbegin',box);
  }

  function visualHome(){
    if(document.querySelector('.week-visual'))return;
    const hero=document.querySelector('#view .hero'); if(!hero)return;
    const w=WEEK_VISUALS[wnow()];
    const c=todayCheck();
    const done=S.progress?.filter(p=>p.status==='completed').length||0;
    const total=Object.values(lessons).flat().length||1;
    const visual=`<section class="week-visual tone-${wnow()}"><div class="visual-symbol">${w.icon}</div><div class="visual-copy"><span>${w.kicker} · SEMANA ${wnow()}</span><h3>${w.title}</h3><p>${w.text}</p></div></section>
      <div class="visual-stats">
        <div><span>💧</span><b>${c.water_ml||0}</b><small>ml hoje</small></div>
        <div><span>😴</span><b>${c.sleep_minutes?Math.floor(c.sleep_minutes/60)+'h':'—'}</b><small>sono</small></div>
        <div><span>✓</span><b>${score()}%</b><small>constância</small></div>
        <div><span>▤</span><b>${done}/${total}</b><small>conteúdos</small></div>
      </div>`;
    hero.insertAdjacentHTML('afterend',visual);
  }

  function visualLearn(){
    document.querySelectorAll('#view .week').forEach((el,idx)=>{
      if(el.querySelector('.week-art'))return;
      const i=idx+1,w=WEEK_VISUALS[i];
      const num=el.querySelector('.weeknum');
      if(num){num.classList.add('week-art');num.textContent=w.icon;}
    });
  }

  function visualProgress(){
    const bar=document.querySelector('#view .bar-wrap'); if(!bar||document.querySelector('.progress-caption'))return;
    bar.insertAdjacentHTML('afterend','<p class="progress-caption">Cada barra representa seu Score de Constância daquele dia. Use o desenho para enxergar tendência, não para perseguir 100% todos os dias.</p>');
  }

  function enhanceView(s){
    if(s==='home')visualHome();
    if(s==='learn')visualLearn();
    if(s==='progress')visualProgress();
    document.querySelectorAll('.hero .eyebrow').forEach(e=>{if(e.textContent.trim()==='PROJETO 28 · DIA '+day()+' DE 28')e.textContent=`SEU PROJETO · DIA ${day()} DE 28`;});
  }

  function enhanceOnboarding(){
    const h=document.querySelector('#view .onboard-head h1');
    if(h&&obStep===1)h.textContent='Montando seu projeto.';
    document.querySelectorAll('#view .onboard-head .badge').forEach(b=>{if(/BEM-VINDA AO VIDA/i.test(b.textContent))b.textContent='BEM-VINDA AO VIDA NOVA';});
  }

  function renameVisible(){
    document.title='Vida Nova — Projeto 28';
    const logo=document.querySelector('.logo'); if(logo)logo.textContent='VIDA NOVA';
    const badge=document.querySelector('#login .badge'); if(badge)badge.textContent='VIDA NOVA';
    const loginH=document.querySelector('#login h1'); if(loginH)loginH.textContent='Projeto 28';
  }

  function installModalUX(){
    const card=document.querySelector('.modalcard'); if(!card)return;
    if(!card.querySelector('.modal-close'))card.insertAdjacentHTML('afterbegin','<button class="modal-close" onclick="closeModal()" aria-label="Fechar">×</button>');
    const bar=card.querySelector('.modalbar'); if(!bar||bar.dataset.drag==='1')return;
    bar.dataset.drag='1'; let start=0,delta=0,active=false;
    bar.addEventListener('touchstart',e=>{start=e.touches[0].clientY;delta=0;active=true;card.classList.add('dragging')},{passive:true});
    bar.addEventListener('touchmove',e=>{if(!active)return;delta=Math.max(0,e.touches[0].clientY-start);card.style.transform=`translateY(${Math.min(delta,180)}px)`},{passive:true});
    bar.addEventListener('touchend',()=>{if(!active)return;active=false;card.classList.remove('dragging');if(delta>70){card.style.transform='';closeModal()}else{card.style.transform='';}delta=0});
  }

  renameVisible(); installModalUX();

  const oldGo=window.go;
  window.go=function(s){oldGo(s);requestAnimationFrame(()=>enhanceView(s));};

  const oldOpenWeek=window.openWeek;
  window.openWeek=function(i){oldOpenWeek(i);requestAnimationFrame(()=>enhanceWeek(i));};

  const oldOpenMaterial=window.openMaterial;
  window.openMaterial=async function(i,j){await oldOpenMaterial(i,j);requestAnimationFrame(()=>enhanceMaterial(i,j));};

  const oldOnboarding=window.onboarding;
  window.onboarding=function(step=obStep,preview=false){oldOnboarding(step,preview);requestAnimationFrame(enhanceOnboarding);};

  ['terms','privacy','safety'].forEach(name=>{
    const old=window[name]; if(!old)return;
    window[name]=function(){old();requestAnimationFrame(()=>{const c=document.querySelector('#modalContent');if(c)c.innerHTML=c.innerHTML.replaceAll('VIDA / Projeto 28','Vida Nova / Projeto 28').replaceAll('VIDA','Vida Nova');});};
  });

  const observer=new MutationObserver(()=>{renameVisible();installModalUX();});
  observer.observe(document.body,{childList:true,subtree:true});
})();
