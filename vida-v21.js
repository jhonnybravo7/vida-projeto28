/* Vida Nova v21 production bundle — protected content */

/* --- app-v3.js --- */
const SUPABASE_URL='https://hvzlegeufiigjyanfyuu.supabase.co';
const SUPABASE_KEY='sb_publishable_hFLv8Q_9RCtHviptHWtEZw_FB7TXRqh';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const lessons=window.VIDA_LESSONS||{}, weeks=window.VIDA_WEEK_META||{}, guides=window.VIDA_GUIDES||{}, materials=window.VIDA_MATERIALS||{};
let user=null, obStep=1, ob={}, matCache={}, planner=null;
let S={role:'member',profile:{},feature:{},onboarding:null,enrollment:null,checkins:[],measurements:[],progress:[],waitlist:false,config:{},masterDay:null,masterPlanner:null};
const $=q=>document.querySelector(q), esc=x=>String(x??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const vidaDateFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
function brasiliaDate(value=new Date()){const parts=vidaDateFormat.formatToParts(new Date(value));const get=type=>parts.find(p=>p.type===type).value;return `${get('year')}-${get('month')}-${get('day')}`}
const iso=()=>brasiliaDate(), calendarToday=()=>new Date(iso()+'T12:00:00Z'), n=v=>v===''||v==null?null:Number(v);
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}
function loading(on,t='Carregando...'){const e=$('#globalLoading');e.querySelector('b').textContent=t;e.classList.toggle('hidden',!on)}
function modal(h){$('#modalContent').innerHTML=h;$('#modal').classList.add('open')} function closeModal(){$('#modal').classList.remove('open')}
function master(){return S.role==='master'} function base(){return master()||!!S.feature.base_access} function plannerAccess(){return master()?(S.masterPlanner===null?true:S.masterPlanner):!!S.feature.planner_access}
function fdate(d){if(!d)return'—';const [y,m,a]=d.slice(0,10).split('-');return`${a}/${m}/${y}`}
function days(a,b){return Math.floor((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/86400000)}
function day(){if(master()&&S.masterDay)return S.masterDay;return S.enrollment?.start_date?Math.max(1,Math.min(28,days(S.enrollment.start_date,iso())+1)):1}
function wnow(){return day()>=22?4:day()>=15?3:day()>=8?2:1}
function todayCheck(){return S.checkins.find(x=>x.checkin_date===iso())||{water_ml:0}}
function todayContent(){return S.progress.some(x=>x.completed_at&&brasiliaDate(x.completed_at)===iso())}
function flags(c=todayCheck(),content=todayContent()){return{water:(c.water_ml||0)>0,movement:!!c.trained||(c.movement_minutes||0)>0,sleep:(c.sleep_minutes||0)>0,daily:!!c.daily_checkin_completed,content}}
function score(c=todayCheck(),content=todayContent()){return Object.values(flags(c,content)).filter(Boolean).length*20}
function nav(s){document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.go===s))}
function setAuth(t){$('#authMsg').textContent=t||''}

async function login(){setAuth('');const email=$('#loginEmail').value.trim(),password=$('#loginPass').value;if(!email||!password)return setAuth('Preencha e-mail e senha.');loading(true,'Entrando...');const {data,error}=await sb.auth.signInWithPassword({email,password});loading(false);if(error)return setAuth(error.message);user=data.user;await route()}
async function forgotPassword(){const email=$('#loginEmail').value.trim();if(!email)return setAuth('Digite seu e-mail primeiro.');loading(true,'Enviando recuperação...');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?recovery=1'});loading(false);setAuth(error?error.message:'Enviamos um link para redefinir sua senha.')}
function recovery(){document.querySelector('#login').classList.remove('hidden');document.querySelector('#root').classList.add('hidden');$('.loginbox').innerHTML=`<span class="badge">VIDA</span><h1>Nova senha</h1><p>Defina uma nova senha para continuar.</p><div class="field"><label>Nova senha</label><input id="newPass" type="password" placeholder="8 caracteres ou mais"></div><button class="btn full" onclick="updatePassword()">SALVAR NOVA SENHA</button><p id="authMsg" class="notice top-gap-sm"></p>`}
async function updatePassword(){const p=$('#newPass').value;if(p.length<8)return setAuth('Use pelo menos 8 caracteres.');loading(true,'Atualizando...');const {error}=await sb.auth.updateUser({password:p});loading(false);if(error)return setAuth(error.message);history.replaceState({},'',location.origin);const {data}=await sb.auth.getUser();user=data.user;await route()}
async function hydrate(){const id=user.id;const R=await Promise.all([sb.from('profiles').select('*').eq('id',id).maybeSingle(),sb.from('feature_access').select('*').eq('user_id',id).maybeSingle(),sb.from('onboarding').select('*').eq('user_id',id).maybeSingle(),sb.from('enrollments').select('*').eq('user_id',id).eq('program_slug','projeto-28').maybeSingle(),sb.from('daily_checkins').select('*').eq('user_id',id).order('checkin_date',{ascending:false}).limit(40),sb.from('body_measurements').select('*').eq('user_id',id).order('measured_on',{ascending:false}).limit(30),sb.from('content_progress').select('*').eq('user_id',id).eq('status','completed'),sb.from('club_waitlist').select('id').eq('user_id',id).maybeSingle(),sb.from('app_config').select('*')]);const [p,f,o,e,c,m,pr,w,cfg]=R.map(x=>x.data);S.role=user.app_metadata?.vida_role||'member';S.profile={name:p?.full_name||user.user_metadata?.full_name||user.email.split('@')[0],email:user.email,birth_date:p?.birth_date};S.feature=f||{};S.onboarding=o;S.enrollment=e;S.checkins=c||[];S.measurements=m||[];S.progress=pr||[];S.waitlist=!!w;S.config={};(cfg||[]).forEach(x=>S.config[x.key]=x.value)}
async function route(){loading(true,'Preparando seu VIDA...');await hydrate();loading(false);$('#login').classList.add('hidden');$('#root').classList.remove('hidden');if(!base())return noAccess();if(!master()&&!S.onboarding?.completed_at)return onboarding();showApp()}
function noAccess(){$('.top').classList.add('hidden');$('.nav').classList.add('hidden');$('#view').innerHTML=`<section class="center-screen"><div class="loginbox"><span class="badge">ACESSO</span><h1>Estamos validando sua compra.</h1><p>Não encontramos acesso ativo para <b>${esc(S.profile.email)}</b>.</p><div class="notice">Se acabou de pagar, aguarde a confirmação e use o mesmo e-mail do checkout.</div><button class="btn full top-gap" onclick="refreshAccess()">ATUALIZAR ACESSO</button><button class="btn outline full top-gap-sm" onclick="logout()">SAIR</button></div></section>`}
async function refreshAccess(){loading(true,'Verificando...');await hydrate();loading(false);base()?route():toast('Acesso ainda não identificado')}

function onboarding(step=obStep,preview=false){$('.top').classList.add('hidden');$('.nav').classList.add('hidden');let h='';if(step===1)h=`<section class="onboarding"><div class="onboard-head"><span class="badge">${preview?'PRÉVIA MASTER':'BEM-VINDA AO VIDA'}</span><h1>Vamos registrar seu ponto de partida.</h1><p>Esses dados ficam privados e servem para comparar sua própria evolução.</p></div><div class="card"><div class="field"><label>Como quer ser chamada?</label><input id="ob_name" value="${esc(ob.name||S.profile.name||'')}"></div><div class="field"><label>Data de nascimento (opcional)</label><input id="ob_birth" type="date" value="${esc(ob.birth||S.profile.birth_date||'')}"></div><label class="consent"><input id="ob_disclaimer" type="checkbox" ${ob.disclaimer?'checked':''}><span>Entendo que o conteúdo é educacional e não substitui acompanhamento profissional individual.</span></label><label class="consent"><input id="ob_terms" type="checkbox" ${ob.terms?'checked':''}><span>Li e concordo com os Termos de Uso e a Política de Privacidade.</span></label><button class="btn full" onclick="obNext1(${preview})">CONTINUAR</button>${preview?'<button class="btn outline full top-gap-sm" onclick="showApp()">SAIR DA PRÉVIA</button>':''}</div></section>`;if(step===2)h=`<section class="onboarding"><div class="onboard-head"><span class="badge">PASSO 2 DE 3</span><h1>Seu ponto de partida.</h1><p>Preencha apenas o que fizer sentido.</p></div><div class="card"><div class="form-grid">${[['height','Altura (cm)'],['weight','Peso (kg)'],['waist','Cintura (cm)'],['abdomen','Abdômen (cm)'],['hip','Quadril (cm)'],['arm','Braço (cm)'],['thigh','Coxa (cm)']].map(x=>`<div class="field"><label>${x[1]}</label><input id="ob_${x[0]}" type="number" step="0.1" value="${esc(ob[x[0]]||'')}"></div>`).join('')}</div><button class="btn full" onclick="obNext2(${preview})">CONTINUAR</button><button class="text-button full" onclick="obStep=1;onboarding(1,${preview})">VOLTAR</button></div></section>`;if(step===3)h=`<section class="onboarding"><div class="onboard-head"><span class="badge">PASSO 3 DE 3</span><h1>Como é sua rotina hoje?</h1></div><div class="card"><div class="field"><label>Treinos por semana</label><input id="ob_training" value="${esc(ob.training||'')}"></div><div class="form-grid"><div class="field"><label>Sono médio (h)</label><input id="ob_sleep" type="number" step="0.1" value="${esc(ob.sleep||'')}"></div><div class="field"><label>Água aproximada (ml)</label><input id="ob_water" type="number" value="${esc(ob.water||'')}"></div></div><div class="field"><label>Movimento diário</label><select id="ob_movement"><option value="">Selecione</option>${['baixo','moderado','alto'].map(x=>`<option ${ob.movement===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Seu principal objetivo</label><textarea id="ob_goal">${esc(ob.goal||'')}</textarea></div><div class="field"><label>Principal dificuldade hoje</label><textarea id="ob_difficulty">${esc(ob.difficulty||'')}</textarea></div>${imcBox()}<button class="btn full" onclick="finishOnboarding(${preview})">${preview?'FINALIZAR PRÉVIA':'COMEÇAR MEUS 28 DIAS'}</button><button class="text-button full" onclick="obStep=2;onboarding(2,${preview})">VOLTAR</button></div></section>`;$('#view').innerHTML=h}
function obNext1(p){ob.name=$('#ob_name').value.trim();ob.birth=$('#ob_birth').value;ob.disclaimer=$('#ob_disclaimer').checked;ob.terms=$('#ob_terms').checked;if(!ob.name)return toast('Informe seu nome');if(!ob.disclaimer||!ob.terms)return toast('Confirme os avisos');obStep=2;onboarding(2,p)}
function obNext2(p){['height','weight','waist','abdomen','hip','arm','thigh'].forEach(k=>ob[k]=n($('#ob_'+k).value));obStep=3;onboarding(3,p)}
function imcBox(){const w=ob.weight,h=ob.height?ob.height/100:0,v=w&&h?w/(h*h):null;return v?`<div class="imc-card"><small>IMC estimado</small><strong>${v.toFixed(1)}</strong><p>Referência educativa. Não mede diretamente gordura ou massa muscular e não é diagnóstico.</p></div>`:''}
async function finishOnboarding(preview){if(preview){ob={};obStep=1;return showApp()}ob.training=$('#ob_training').value;ob.sleep=n($('#ob_sleep').value);ob.water=n($('#ob_water').value);ob.movement=$('#ob_movement').value;ob.goal=$('#ob_goal').value;ob.difficulty=$('#ob_difficulty').value;loading(true,'Salvando...');const now=new Date().toISOString();await sb.from('profiles').upsert({id:user.id,email:user.email,full_name:ob.name,birth_date:ob.birth||null});const {error}=await sb.from('onboarding').upsert({user_id:user.id,height_cm:ob.height,initial_weight_kg:ob.weight,waist_cm:ob.waist,abdomen_cm:ob.abdomen,hip_cm:ob.hip,arm_cm:ob.arm,thigh_cm:ob.thigh,training_frequency:ob.training,sleep_hours_avg:ob.sleep,water_ml_avg:ob.water,movement_level:ob.movement||null,goal_text:ob.goal,main_difficulty:ob.difficulty,disclaimer_accepted_at:now,completed_at:now});if(ob.weight||ob.waist||ob.abdomen)await sb.from('body_measurements').insert({user_id:user.id,measured_on:iso(),weight_kg:ob.weight,waist_cm:ob.waist,abdomen_cm:ob.abdomen,hip_cm:ob.hip,arm_cm:ob.arm,thigh_cm:ob.thigh});const rpc=await sb.rpc('start_project28');loading(false);if(error||rpc.error)return toast('Não foi possível concluir. Tente novamente.');ob={};await hydrate();showApp()}

function showApp(){$('.top').classList.remove('hidden');$('.nav').classList.remove('hidden');go('home')}
function go(s){nav(s);const v=$('#view');if(s==='home')v.innerHTML=home();if(s==='learn')v.innerHTML=learn();if(s==='track')v.innerHTML=track();if(s==='progress')v.innerHTML=progress();if(s==='gym')v.innerHTML=gym();if(s==='profile')v.innerHTML=profile();scrollTo(0,0)}
function masterPanel(){if(!master())return'';return`<div class="card master-card top-gap"><span class="badge dark-badge">MASTER</span><h3>Modo de homologação</h3><div class="master-grid"><label>Dia<select onchange="S.masterDay=+this.value;go('home')">${[1,8,15,22,28].map(x=>`<option value="${x}" ${day()===x?'selected':''}>Dia ${x}</option>`).join('')}</select></label><label>Planner<select onchange="S.masterPlanner=this.value==='real'?null:this.value==='on';go('home')"><option value="real">Real</option><option value="on">Liberado</option><option value="off">Bloqueado</option></select></label></div><button class="btn outline full top-gap-sm" onclick="ob={};obStep=1;onboarding(1,true)">REVISAR ONBOARDING</button></div>`}
function home(){const f=flags();return`<section class="screen"><div class="hero"><div class="eyebrow">PROJETO 28 · DIA ${day()} DE 28</div><h1>Sua jornada começa no que você consegue repetir.</h1><p>Entenda o processo, registre o que importa e acompanhe sua própria constância.</p><button class="btn light" onclick="go('track')">CONTINUAR MEU DIA</button></div>${masterPanel()}<div class="grid2 top-gap"><div class="card"><small>Score de Constância</small><div class="metric">${score()}%</div><div class="progress"><span style="width:${score()}%"></span></div><p class="micro">Mede registros do dia, não saúde.</p></div><div class="card"><small>Semana atual</small><div class="metric sm">${wnow()}/4</div><p>${esc(weeks[wnow()].title)}</p></div></div><div class="sectiontitle"><h2>Check-in de hoje</h2><small>5 ações</small></div><div class="checks">${[['💧','Hidratação','water'],['🏋️','Treino / movimento','movement'],['😴','Sono','sleep'],['✓','Fechar meu dia','daily'],['📚','Conteúdo','content']].map(x=>`<div class="check ${f[x[2]]?'done':''}" onclick="${x[2]==='content'?"go('learn')":"go('track')"}"><span>${x[0]}</span><div><b>${x[1]}</b><div>${f[x[2]]?'Registrado':'Ainda não registrado'}</div></div><button class="mark">${f[x[2]]?'✓':'+'}</button></div>`).join('')}</div><div class="sectiontitle"><h2>Sua jornada</h2><small>progressiva</small></div>${weekList()}<div class="sectiontitle"><h2>Recursos</h2></div>${plannerCard()}${clubCard()}</section>`}
function weekList(){return[1,2,3,4].map(i=>{const open=master()||day()>=weeks[i].unlock,done=(lessons[i]||[]).every((_,j)=>S.progress.some(p=>p.content_slug==='lesson-'+i+'-'+j));return`<div class="week ${open?'':'locked'}" ${open?`onclick="openWeek(${i})"`:''}><div class="weeknum" style="background:${weeks[i].color}">${i}</div><div class="weekbody"><b>Semana ${i} — ${esc(weeks[i].title)}</b><span>${lessons[i].length} ensinamentos · 1 guia · ${materials[i].length} materiais</span></div><span class="tag ${done?'ok':''}">${done?'CONCLUÍDA':open?'ABERTA':'DIA '+weeks[i].unlock}</span></div>`}).join('')}
function plannerCard(){return plannerAccess()?`<div class="card resource-card"><div><span class="badge">PLANNER+</span><h3>Planeje sua semana.</h3><p>Calendário semanal, treinos planejados e histórico do que você realizou.</p></div><button class="btn" onclick="openPlanner()">ABRIR</button></div>`:`<div class="card resource-card locked-card"><div><span class="badge">ADICIONAL</span><h3>Planner+</h3><p>Calendário semanal de treinos e acompanhamento visual.</p></div><button class="btn" onclick="plannerUpgrade()">ADICIONAR</button></div>`}
function clubCard(){return`<div class="card resource-card club top-gap-sm"><div><span class="badge">ACESSO RESTRITO</span><h3>Carol Club</h3><p>Vagas encerradas no momento.</p></div><button class="btn soft" onclick="club()">${S.waitlist?'NA LISTA ✓':'LISTA DE ESPERA'}</button></div>`}

function learn(){return`<section class="screen"><div class="hero"><div class="eyebrow">APRENDER</div><h1>Conhecimento em etapas.</h1><p>O aprofundamento abre nos Dias 1, 8, 15 e 22.</p></div><div class="sectiontitle"><h2>Projeto 28</h2><small>46 ensinamentos</small></div>${weekList()}</section>`}
function openWeek(i){if(!master()&&day()<weeks[i].unlock)return toast('Essa semana ainda não abriu');modal(`<div class="moduleHero" style="background:${weeks[i].color}"><small>SEMANA ${i}</small><h1>${esc(weeks[i].title)}</h1><p>${lessons[i].length} ensinamentos, guia principal e ${materials[i].length} materiais.</p></div><div class="card"><h3>Ensinamentos</h3>${lessons[i].map((x,j)=>`<div class="lesson" onclick="openLesson(${i},${j})"><div class="lessonidx">${j+1}</div><div class="lessontext"><b>${esc(x[0])}</b><span>${S.progress.some(p=>p.content_slug==='lesson-'+i+'-'+j)?'Concluído ✓':'Abrir leitura'}</span></div><span>›</span></div>`).join('')}</div><div class="sectiontitle"><h2>Guia principal</h2></div><div class="guide-card"><span class="badge">PDF · SEMANA ${i}</span><h3>${esc(guides[i].title)}</h3><p>${esc(guides[i].subtitle)}</p><div class="row"><button class="btn" onclick="openGuide(${i})">ABRIR</button><button class="btn outline" onclick="downloadGuide(${i})">BAIXAR PDF</button></div></div><div class="sectiontitle"><h2>Materiais adicionais</h2></div>${materials[i].map((m,j)=>`<div class="material" onclick="openMaterial(${i},${j})"><b>${esc(m.title)}</b><span>${esc(m.description||'Abrir material')}</span></div>`).join('')}`)}
function md(s){return String(s).split('\n\n').map(p=>p.startsWith('> ')?`<div class="quote">${esc(p.slice(2))}</div>`:`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}
function openLesson(i,j){const x=lessons[i][j];modal(`<div class="article"><span class="badge">SEMANA ${i} · AULA ${j+1}</span><h2>${esc(x[0])}</h2>${md(x[1])}<button class="btn full" onclick="completeLesson(${i},${j})">${S.progress.some(p=>p.content_slug==='lesson-'+i+'-'+j)?'CONCLUÍDO ✓':'MARCAR COMO CONCLUÍDO'}</button></div>`)}
async function completeLesson(i,j){loading(true,'Salvando progresso...');const {error}=await sb.from('content_progress').upsert({user_id:user.id,content_slug:`lesson-${i}-${j}`,status:'completed',completed_at:new Date().toISOString()},{onConflict:'user_id,content_slug'});loading(false);if(error)return toast('Não foi possível salvar');await hydrate();openWeek(i);toast('Conteúdo concluído')}
function guideHtml(i){return`<div class="article"><span class="badge">GUIA · SEMANA ${i}</span><h2>${esc(guides[i].title)}</h2><p class="lead">${esc(guides[i].subtitle)}</p>${guides[i].sections.map(s=>`<h3>${esc(s[0])}</h3><p>${esc(s[1])}</p>`).join('')}<div class="notice">Material educacional. Não substitui avaliação, diagnóstico ou prescrição individual.</div></div>`}
function openGuide(i){modal(guideHtml(i)+`<button class="btn full top-gap" onclick="downloadGuide(${i})">BAIXAR COMO PDF</button>`)}
function downloadGuide(i){if(!window.jspdf)return toast('Gerador de PDF carregando. Tente novamente.');const {jsPDF}=window.jspdf,d=new jsPDF({unit:'mm',format:'a4'}),g=guides[i];let y=20;d.setFont('helvetica','bold');d.setFontSize(20);d.text('VIDA — PROJETO 28',18,y);y+=12;d.setFontSize(16);d.text(g.title,18,y);y+=10;d.setFont('helvetica','normal');d.setFontSize(10);const add=t=>{const lines=d.splitTextToSize(t,174);if(y+lines.length*5>280){d.addPage();y=20}d.text(lines,18,y);y+=lines.length*5+4};add(g.subtitle);g.sections.forEach(s=>{if(y>255){d.addPage();y=20}d.setFont('helvetica','bold');d.setFontSize(12);d.text(s[0],18,y);y+=7;d.setFont('helvetica','normal');d.setFontSize(10);add(s[1])});d.save(`VIDA_Semana_${i}_${g.title.replace(/[^a-z0-9]+/gi,'_')}.pdf`)}

async function openMaterial(i,j){const m=materials[i][j],slug=`w${i}-m${j+1}`;let saved=matCache[slug];if(saved===undefined){loading(true,'Abrindo material...');const {data}=await sb.from('material_responses').select('response').eq('user_id',user.id).eq('material_slug',slug).maybeSingle();loading(false);saved=data?.response||{};matCache[slug]=saved}renderMaterial(i,j,saved)}
function input(f,s){const [k,l,t='text',opts='']=f,v=s[k]??'';if(t==='textarea')return`<div class="field"><label>${esc(l)}</label><textarea data-mi data-key="${k}">${esc(v)}</textarea></div>`;if(t==='select')return`<div class="field"><label>${esc(l)}</label><select data-mi data-key="${k}"><option value="">Selecione</option>${opts.split('|').map(o=>`<option ${v===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;return`<div class="field"><label>${esc(l)}</label><input data-mi data-key="${k}" type="${t}" ${t==='number'?'step="0.1"':''} value="${esc(v)}"></div>`}
function renderMaterial(i,j,s={}){const m=materials[i][j],slug=`w${i}-m${j+1}`;let b='';if(m.kind==='measurements')b=measureTable();else if(m.kind==='macro')b=`<div class="grid3">${[['p','Proteína (g)'],['c','Carboidrato (g)'],['f','Gordura (g)']].map(x=>`<div class="field"><label>${x[1]}</label><input data-mi data-key="${x[0]}" id="m_${x[0]}" type="number" value="${s[x[0]]||0}" oninput="macro()"></div>`).join('')}</div><div id="macroResult" class="resultbox"></div>`;else if(m.kind==='diary')b=editableTable(['Momento','Fome 0–10','O que comi','Saciedade 0–10','Observação'],['Café da manhã','Almoço','Lanche','Jantar'],s);else if(m.kind==='weektable')b=editableTable(['Dia','Plano principal','Plano B','Feito?'],['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'],s);else if(m.kind==='comparison')b=comparison(s);else if(m.kind==='external')b=`<p>${esc(m.description)}</p><a class="btn full linkbtn" href="${m.url}" target="_blank" rel="noopener">ABRIR BIBLIOTECA</a>`;else if(m.kind==='gym')b=`<p>${esc(m.description)}</p><button class="btn full" onclick="closeModal();go('gym')">CONHECER A PRÓXIMA FASE</button>`;else{b=(m.fields||[]).map(f=>input(f,s)).join('');if(m.checklist)b+=`<div class="material-checks">${m.checklist.map((x,k)=>`<label class="material-consent"><input data-mi data-key="c${k}" type="checkbox" ${s['c'+k]?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div>`;if(m.note)b+=`<div class="material-note">${esc(m.note)}</div>`}modal(`<div class="article material-article"><span class="badge">MATERIAL · SEMANA ${i}</span><h2>${esc(m.title)}</h2><p class="lead">${esc(m.description||'')}</p>${b}${['external','gym','measurements','comparison'].includes(m.kind)?'':`<button class="btn full material-save" onclick="saveMaterial('${slug}',${i},${j})">SALVAR</button>`}</div>`);if(m.kind==='macro')macro()}
function editableTable(headers,rows,s){return`<div class="table-wrap"><table class="edit-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r,ri)=>`<tr><td>${r}</td>${headers.slice(1).map((_,ci)=>`<td><input data-mi data-key="t${ri}_${ci}" value="${esc(s[`t${ri}_${ci}`]||'')}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function macro(){const p=+($('#m_p')?.value||0),c=+($('#m_c')?.value||0),f=+($('#m_f')?.value||0);$('#macroResult').innerHTML=`Proteína: ${p*4} kcal<br>Carboidrato: ${c*4} kcal<br>Gordura: ${f*9} kcal<hr><b>Total: ${p*4+c*4+f*9} kcal</b>`}
function measureTable(){return`<p>Registros salvos no VIDA:</p><div class="table-wrap"><table class="edit-table"><thead><tr><th>Data</th><th>Peso</th><th>Cintura</th><th>Abdômen</th></tr></thead><tbody>${S.measurements.length?S.measurements.slice().reverse().map(m=>`<tr><td>${fdate(m.measured_on)}</td><td>${m.weight_kg??'—'}</td><td>${m.waist_cm??'—'}</td><td>${m.abdomen_cm??'—'}</td></tr>`).join(''):'<tr><td colspan="4">Nenhum registro.</td></tr>'}</tbody></table></div><button class="btn full" onclick="closeModal();measurements()">REGISTRAR MEDIDAS</button>`}
function comparison(){const a=S.measurements[S.measurements.length-1]||{},z=S.measurements[0]||{};return`<div class="compare-grid"><div class="card"><small>Dia 1 / primeiro</small><b>${a.weight_kg??'—'} kg</b><span>Cintura ${a.waist_cm??'—'} cm</span></div><div class="card"><small>Atual</small><b>${z.weight_kg??'—'} kg</b><span>Cintura ${z.waist_cm??'—'} cm</span></div></div>`}
async function saveMaterial(slug,i,j){const r={};document.querySelectorAll('[data-mi]').forEach(e=>r[e.dataset.key]=e.type==='checkbox'?e.checked:e.value);loading(true,'Salvando...');const {error}=await sb.from('material_responses').upsert({user_id:user.id,material_slug:slug,response:r},{onConflict:'user_id,material_slug'});loading(false);if(error)return toast('Não foi possível salvar');matCache[slug]=r;if(materials[i][j].final&&(+r.weight||+r.waist||+r.abdomen)){await sb.from('body_measurements').insert({user_id:user.id,measured_on:r.date||iso(),weight_kg:n(r.weight),waist_cm:n(r.waist),abdomen_cm:n(r.abdomen),hip_cm:n(r.hip),arm_cm:n(r.arm),thigh_cm:n(r.thigh)});await hydrate()}toast('Material salvo')}

function track(){const c=todayCheck();return`<section class="screen"><div class="hero"><div class="eyebrow">ACOMPANHAR</div><h1>Hoje conta.</h1><p>Registros simples para enxergar sua constância.</p></div><div class="grid2 top-gap"><div class="card"><small>Hidratação</small><div class="metric">${c.water_ml||0}</div><p>ml hoje</p><div class="track-actions"><button class="btn soft" onclick="water(250)">+250</button><button class="btn soft" onclick="water(500)">+500</button><button class="btn outline" onclick="waterExact()">AJUSTAR</button></div></div><div class="card"><small>Sono</small><div class="metric sm">${c.sleep_minutes?`${Math.floor(c.sleep_minutes/60)}h${String(c.sleep_minutes%60).padStart(2,'0')}`:'—'}</div><p>${c.sleep_feeling||'Sem registro'}</p><button class="btn soft mini top-gap-sm" onclick="sleep()">REGISTRAR</button></div></div><div class="sectiontitle"><h2>Treino e movimento</h2></div><div class="card"><h3>${c.trained?'Treino registrado':'Como foi seu movimento?'}</h3><p>${c.training_type?`${esc(c.training_type)} · ${c.training_minutes||0} min`:c.movement_minutes?`${c.movement_minutes} min ativos`:'Sem registro'}</p><button class="btn full top-gap-sm" onclick="training()">REGISTRAR / EDITAR</button></div><div class="sectiontitle"><h2>Peso e medidas</h2></div><div class="card"><div class="between row"><div><small>Último peso</small><div class="metric sm">${S.measurements[0]?.weight_kg?S.measurements[0].weight_kg+' kg':'—'}</div></div><button class="btn soft" onclick="measurements()">REGISTRAR</button></div></div><div class="sectiontitle"><h2>Fechar o dia</h2></div><div class="card"><h3>${c.daily_checkin_completed?'Check-in concluído ✓':'Seu dia ainda está em aberto.'}</h3><p>Concluir o check-in conta no Score de Constância.</p><button class="btn full top-gap-sm" onclick="daily()">${c.daily_checkin_completed?'CONCLUÍDO':'CONCLUIR CHECK-IN'}</button></div><div class="sectiontitle"><h2>Planner+</h2></div>${plannerCard()}</section>`}
async function upCheck(p){const c={user_id:user.id,checkin_date:iso(),...p};const {error}=await sb.from('daily_checkins').upsert(c,{onConflict:'user_id,checkin_date'});if(error)return toast('Não foi possível salvar');await hydrate();go('track')}
async function water(x){await upCheck({water_ml:(todayCheck().water_ml||0)+x})}
function waterExact(){modal(`<h2>Ajustar água</h2><div class="field"><label>Total de hoje (ml)</label><input id="waterN" type="number" value="${todayCheck().water_ml||0}"></div><button class="btn full" onclick="upCheck({water_ml:+$('#waterN').value});closeModal()">SALVAR</button>`)}
function sleep(){const c=todayCheck(),h=c.sleep_minutes?Math.floor(c.sleep_minutes/60):'',m=c.sleep_minutes?c.sleep_minutes%60:'';modal(`<h2>Registrar sono</h2><div class="form-grid"><div class="field"><label>Horas</label><input id="sh" type="number" value="${h}"></div><div class="field"><label>Minutos</label><input id="sm" type="number" value="${m}"></div></div><div class="field"><label>Como acordou?</label><select id="sf"><option>cansada</option><option>normal</option><option>bem</option></select></div><button class="btn full" onclick="upCheck({sleep_minutes:+$('#sh').value*60+(+$('#sm').value||0),sleep_feeling:$('#sf').value});closeModal()">SALVAR</button>`)}
function training(){const c=todayCheck();modal(`<h2>Treino e movimento</h2><label class="consent"><input id="tr" type="checkbox" ${c.trained?'checked':''}><span>Treinei hoje</span></label><div class="field"><label>Tipo</label><select id="tt">${['musculação','cardio','caminhada','corrida','bike','outro'].map(x=>`<option ${c.training_type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-grid"><div class="field"><label>Treino (min)</label><input id="tm" type="number" value="${c.training_minutes||''}"></div><div class="field"><label>Movimento extra (min)</label><input id="mm" type="number" value="${c.movement_minutes||''}"></div></div><button class="btn full" onclick="upCheck({trained:$('#tr').checked,training_type:$('#tt').value,training_minutes:n($('#tm').value),movement_minutes:n($('#mm').value)});closeModal()">SALVAR</button>`)}
async function daily(){await upCheck({daily_checkin_completed:true})}
function measurements(){const m=S.measurements[0]||{};modal(`<h2>Peso e medidas</h2><div class="form-grid">${[['mw','Peso',m.weight_kg],['mc','Cintura',m.waist_cm],['ma','Abdômen',m.abdomen_cm],['mh','Quadril',m.hip_cm],['mb','Braço',m.arm_cm],['mt','Coxa',m.thigh_cm]].map(x=>`<div class="field"><label>${x[1]}</label><input id="${x[0]}" type="number" step="0.1" value="${x[2]||''}"></div>`).join('')}</div><button class="btn full" onclick="saveMeasurements()">SALVAR</button>`)}
async function saveMeasurements(){loading(true,'Salvando medidas...');const {error}=await sb.from('body_measurements').insert({user_id:user.id,measured_on:iso(),weight_kg:n($('#mw').value),waist_cm:n($('#mc').value),abdomen_cm:n($('#ma').value),hip_cm:n($('#mh').value),arm_cm:n($('#mb').value),thigh_cm:n($('#mt').value)});loading(false);if(error)return toast('Não foi possível salvar');closeModal();await hydrate();go('track')}

function progress(){const last7=[];for(let k=6;k>=0;k--){const d=calendarToday();d.setUTCDate(d.getUTCDate()-k);const di=d.toISOString().slice(0,10),c=S.checkins.find(x=>x.checkin_date===di),ct=S.progress.some(x=>x.completed_at&&brasiliaDate(x.completed_at)===di);last7.push([di,score(c||{},ct)])}const done=S.progress.length,total=Object.values(lessons).flat().length,a=S.measurements[S.measurements.length-1],z=S.measurements[0];return`<section class="screen"><div class="hero"><div class="eyebrow">PROGRESSO</div><h1>Olhe para tendência, não para um único dia.</h1><p>Seu acompanhamento existe para mostrar o processo.</p></div><div class="grid2 top-gap"><div class="stat"><b>${day()}/28</b><span>Dias</span></div><div class="stat"><b>${score()}%</b><span>Constância hoje</span></div><div class="stat"><b>${done}</b><span>Conteúdos concluídos</span></div><div class="stat"><b>${z?.weight_kg??'—'} kg</b><span>Último peso</span></div></div><div class="card top-gap"><h3>Constância — últimos 7 dias</h3><div class="bar-wrap">${last7.map(x=>`<div class="bar" data-label="${x[0].slice(8)}" style="height:${Math.max(3,x[1])}%"></div>`).join('')}</div></div><div class="card top-gap"><h3>Conteúdo</h3><p>${done} de ${total} ensinamentos concluídos.</p><div class="progress"><span style="width:${total?Math.round(done/total*100):0}%"></span></div></div><div class="card top-gap"><h3>Início x atual</h3><div class="compare-grid"><div><small>Primeiro peso</small><b>${a?.weight_kg??'—'} kg</b><span>Cintura ${a?.waist_cm??'—'} cm</span></div><div><small>Atual</small><b>${z?.weight_kg??'—'} kg</b><span>Cintura ${z?.waist_cm??'—'} cm</span></div></div></div>${day()===28?'<button class="btn full top-gap" onclick="openMaterial(4,0)">FAZER AVALIAÇÃO FINAL</button>':''}<p class="notice top-gap">Peso, IMC e medidas são indicadores limitados quando vistos isoladamente. O VIDA não usa esses números como diagnóstico.</p></section>`}

async function openPlanner(){if(!plannerAccess())return plannerUpgrade();const ws=(()=>{const d=calendarToday(),k=d.getUTCDay()===0?-6:1-d.getUTCDay();d.setUTCDate(d.getUTCDate()+k);return d.toISOString().slice(0,10)})();loading(true,'Abrindo Planner+...');const {data}=await sb.from('planner_weeks').select('*').eq('user_id',user.id).eq('week_start',ws).maybeSingle();loading(false);planner=data||{week_start:ws,goals:[],review:{}};const g=planner.goals||[],r=planner.review||{};modal(`<div class="article"><span class="badge">PLANNER+</span><h2>Minha semana</h2><div class="field"><label>Foco principal</label><textarea id="pf">${esc(planner.focus||'')}</textarea></div>${[0,1,2].map(i=>`<div class="field"><label>Meta ${i+1}</label><input id="pg${i}" value="${esc(g[i]||'')}"></div>`).join('')}<div class="field"><label>Plano B</label><textarea id="pb">${esc(planner.plan_b||'')}</textarea></div><div class="field"><label>O que funcionou?</label><textarea id="pr1">${esc(r.worked||'')}</textarea></div><div class="field"><label>O que atrapalhou?</label><textarea id="pr2">${esc(r.blocked||'')}</textarea></div><div class="field"><label>Ajuste para a próxima semana</label><textarea id="pr3">${esc(r.adjust||'')}</textarea></div><div class="field"><label>Minha pequena vitória</label><textarea id="pr4">${esc(r.win||'')}</textarea></div><button class="btn full" onclick="savePlanner()">SALVAR PLANNER</button></div>`)}
async function savePlanner(){const p={user_id:user.id,week_start:planner.week_start,focus:$('#pf').value,goals:[$('#pg0').value,$('#pg1').value,$('#pg2').value].filter(Boolean),plan_b:$('#pb').value,review:{worked:$('#pr1').value,blocked:$('#pr2').value,adjust:$('#pr3').value,win:$('#pr4').value}};loading(true,'Salvando...');const {error}=await sb.from('planner_weeks').upsert(p,{onConflict:'user_id,week_start'});loading(false);if(error)return toast('Não foi possível salvar');closeModal();toast('Planner salvo')}
function plannerUpgrade(){const c=S.config.planner_checkout||{},url=c.url;modal(`<h2>Planner+</h2><p>Você já acompanha. Agora pode planejar.</p><div class="card"><div class="metric sm">+ R$ ${Number(c.price_brl||6).toFixed(2).replace('.',',')}</div><p>Calendário semanal e acompanhamento na mesma conta, com pagamento único.</p></div>${url?`<a class="btn full linkbtn top-gap" href="${esc(url)}" target="_blank">IR PARA O CHECKOUT</a>`:'<button class="btn full top-gap" disabled>CHECKOUT EM CONFIGURAÇÃO</button>'}<p class="notice top-gap-sm">Após o pagamento único, o recurso será liberado automaticamente.</p>`)}
function gym(){const c=S.config.gymrats||{start_date:'2026-11-01',end_date:'2026-12-15'};return`<section class="screen"><div class="moduleHero gymhero"><small>PRÓXIMA FASE</small><h1>GYM RATS</h1><p>45 dias para continuar aparecendo e transformar constância em jogo.</p></div><div class="card"><span class="badge">EM PREPARAÇÃO</span><h3 class="top-gap-sm">${fdate(c.start_date)} → ${fdate(c.end_date)}</h3><p>O Projeto 28 ensina a base. O Gym Rats usa essa base como próxima etapa.</p></div><div class="card top-gap"><h3>Estrutura em preparação</h3><p>Regras, missões, pontuação, ranking e premiações só aparecem quando a mecânica final estiver fechada.</p></div></section>`}
function profile(){return`<section class="screen"><div class="hero"><div class="eyebrow">PERFIL</div><h1>${esc(S.profile.name)}</h1><p>${esc(S.profile.email)}</p>${master()?'<span class="badge white-badge">ACESSO MASTER</span>':''}</div><div class="card top-gap"><h3>Meu acesso</h3><div class="access-row"><span>Projeto 28</span><b>ATIVO</b></div><div class="access-row"><span>Planner+</span><b>${plannerAccess()?'ATIVO':'NÃO CONTRATADO'}</b></div><div class="access-row"><span>Carol Club</span><b>${S.waitlist?'LISTA DE ESPERA':'VAGAS ENCERRADAS'}</b></div><div class="access-row"><span>Início</span><b>${fdate(S.enrollment?.start_date)}</b></div></div><div class="card top-gap profile-links"><button onclick="terms()">Termos de Uso <span>›</span></button><button onclick="privacy()">Política de Privacidade <span>›</span></button><button onclick="safety()">Avisos de saúde e segurança <span>›</span></button></div>${master()?'<button class="btn outline full top-gap" onclick="ob={};obStep=1;onboarding(1,true)">PRÉVIA DO ONBOARDING</button>':''}<button class="btn outline full top-gap" onclick="logout()">SAIR</button></section>`}
function terms(){modal(`<div class="article"><h2>Termos de Uso</h2><p><b>Vigência:</b> 01/10/2026.</p><p>O VIDA / Projeto 28 é uma plataforma educacional e de acompanhamento de hábitos. O acesso é pessoal e vinculado ao e-mail informado na compra.</p><h3>Natureza</h3><p>Os materiais não constituem diagnóstico, consulta, prescrição nutricional, prescrição de exercício ou tratamento individual.</p><h3>Pagamentos e acesso</h3><p>Pagamento, cancelamento e reembolso seguem o checkout usado na compra e as condições informadas na oferta.</p><h3>Resultados</h3><p>Não existe garantia de perda específica de peso, medidas ou gordura corporal.</p><h3>Uso do conteúdo</h3><p>Materiais são destinados ao uso pessoal. Redistribuição comercial sem autorização não é permitida.</p><div class="notice">A identificação jurídica do responsável pelo produto seguirá os dados do checkout e canais oficiais antes da divulgação final.</div></div>`)}
function privacy(){modal(`<div class="article"><h2>Política de Privacidade</h2><p>O VIDA trata nome, e-mail, dados de onboarding, peso, medidas e registros voluntários para autenticação, funcionamento da jornada, progresso e suporte.</p><p>Dados de peso e medidas ficam privados por padrão e são protegidos por controles de acesso por usuário.</p><p>Prestadores de infraestrutura e pagamento podem processar apenas os dados necessários às suas funções.</p><p>A usuária pode solicitar correção ou exclusão conforme aplicável, observados registros que precisem ser mantidos por obrigação legal ou operacional.</p><div class="notice">A identificação formal do controlador e canal de privacidade será alinhada aos dados jurídicos do checkout antes da divulgação final.</div></div>`)}
function safety(){modal(`<div class="article"><h2>Avisos de saúde e segurança</h2><ul><li>Conteúdo educacional não substitui acompanhamento individual.</li><li>Exemplos de alimentos, calorias e macros são ilustrativos.</li><li>Exemplos de atividade física não constituem ficha individual.</li><li>Necessidades de líquidos variam; restrições devem seguir orientação profissional.</li><li>Peso e IMC são indicadores limitados isoladamente.</li><li>Não há garantia de perda específica de peso ou medidas.</li><li>Em sintomas graves ou emergência, procure atendimento adequado.</li></ul></div>`)}
async function club(){if(S.waitlist)return toast('Você já está na lista');modal(`<h2>Carol Club</h2><p>Vagas encerradas no momento.</p><label class="consent"><input id="cc" type="checkbox"><span>Quero receber informações sobre a próxima abertura.</span></label><button class="btn full" onclick="joinClub()">ENTRAR NA LISTA</button>`)}
async function joinClub(){if(!$('#cc').checked)return toast('Confirme que quer entrar na lista');loading(true,'Entrando na lista...');const {error}=await sb.from('club_waitlist').upsert({user_id:user.id,email:S.profile.email,source:'app'},{onConflict:'email'});loading(false);if(error)return toast('Não foi possível salvar');S.waitlist=true;closeModal();go('home')}
async function logout(){await sb.auth.signOut();location.reload()}

sb.auth.onAuthStateChange((e,s)=>{if(e==='PASSWORD_RECOVERY')recovery()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
window.startVidaApp=async function(){
  if(new URLSearchParams(location.search).get('recovery')==='1')return recovery();
  const {data}=await sb.auth.getSession();
  if(data.session?.user){user=data.session.user;await route()}
};
if(!window.__VIDA_DEFER_BOOT)window.startVidaApp();


/* --- ui-patch.js --- */
(()=>{
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const rich=t=>String(t??'').split(/\n\n+/).map(p=>`<p>${safe(p).replace(/\n/g,'<br>')}</p>`).join('');

  window.openGuide=function(i){
    const g=window.VIDA_GUIDES[i];
    modal(`<div class="article guide-reader"><span class="badge">GUIA · SEMANA ${i}</span><h2>${safe(g.title)}</h2><p class="lead">${safe(g.subtitle)}</p>${g.sections.map(s=>`<h3>${safe(s[0])}</h3>${rich(s[1])}`).join('')}<div class="notice">Material educacional. Não substitui avaliação, diagnóstico ou prescrição individual.</div><button class="btn full top-gap" onclick="downloadGuide(${i})">BAIXAR COMO PDF</button></div>`);
  };

  window.downloadGuide=function(i){
    if(!window.jspdf){toast('Gerador de PDF carregando. Tente novamente.');return}
    const {jsPDF}=window.jspdf,g=window.VIDA_GUIDES[i],d=new jsPDF({unit:'mm',format:'a4'});
    const left=18,right=18,width=210-left-right,bottom=277;
    let y=20;
    const nextPage=()=>{d.addPage();y=20};
    const need=h=>{if(y+h>bottom)nextPage()};
    const paragraph=(text,size=10,gap=4)=>{
      d.setFont('helvetica','normal');d.setFontSize(size);
      const parts=String(text).split('\n');
      for(const part of parts){
        if(!part.trim()){y+=3;continue}
        const lines=d.splitTextToSize(part,width);need(lines.length*4.6+2);d.text(lines,left,y);y+=lines.length*4.6+1;
      }
      y+=gap;
    };
    d.setFont('helvetica','bold');d.setFontSize(9);d.text('VIDA · PROJETO 28',left,y);y+=9;
    d.setFontSize(22);d.text(g.title,left,y);y+=9;
    d.setFont('helvetica','normal');d.setFontSize(10);paragraph(g.subtitle,10,7);
    g.sections.forEach(s=>{
      need(18);d.setFont('helvetica','bold');d.setFontSize(13);const h=d.splitTextToSize(s[0],width);d.text(h,left,y);y+=h.length*5.2+3;paragraph(s[1],10,6);
    });
    need(24);d.setDrawColor(210);d.line(left,y,210-right,y);y+=7;paragraph('Conteúdo educacional. Não substitui diagnóstico, consulta, prescrição nutricional, prescrição de exercício ou tratamento individual.',8,0);
    const pages=d.getNumberOfPages();
    for(let p=1;p<=pages;p++){d.setPage(p);d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(120);d.text(`VIDA · Semana ${i}`,left,291);d.text(`${p}/${pages}`,192,291,{align:'right'});d.setTextColor(0)}
    d.save(`VIDA_Projeto28_Semana_${i}_${g.title.replace(/[^a-z0-9]+/gi,'_')}.pdf`);
  };

  const originalOpenMaterial=window.openMaterial;
  if(originalOpenMaterial){
    window.openMaterial=async function(i,j){
      await originalOpenMaterial(i,j);
      if(i===4&&j===3){
        const checks=[...document.querySelectorAll('#modalContent input[type="checkbox"][data-mi]')];
        checks.forEach(ch=>ch.addEventListener('change',()=>{
          const selected=checks.filter(x=>x.checked);
          if(selected.length>3){ch.checked=false;toast('Escolha no máximo 3 prioridades.');}
        }));
      }
    };
  }
})();


/* --- experience-v5.js --- */
(()=>{
  const WEEK_VISUALS={
    1:{icon:'◎',kicker:'ENTENDER',title:'Seu ponto de partida',text:'Peso é um dado. O processo é maior que a balança.'},
    2:{icon:'◒',kicker:'ALIMENTAR',title:'Leia seu prato',text:'Reconheça proteína, carboidrato, gordura, fibras e contexto.'},
    3:{icon:'↗',kicker:'MOVER',title:'Construa ritmo',text:'Força, cardio e movimento cotidiano trabalhando juntos.'},
    4:{icon:'∞',kicker:'CONTINUAR',title:'Não volte ao zero',text:'Plano A, plano B e uma forma simples de recomeçar.'}
  };
  const WORKOUTS={};

  const materialHelp=m=>{
    const kind=m?.kind||'form';
    if(kind==='weektable')return{icon:'▦',title:'Como usar',text:'Plano principal é o que você pretende fazer. Plano B é a versão mínima caso o dia dê errado.',example:'Exemplo: principal = academia 45 min · plano B = caminhada 20 min.'};
    if(kind==='diary')return{icon:'◉',title:'Como preencher',text:'Registre antes e depois de comer. Use 0 para nenhuma fome/saciedade e 10 para intensidade máxima.',example:'O objetivo é observar padrões, não buscar uma nota perfeita.'};
    if(kind==='macro')return{icon:'∑',title:'Teste sem prescrição',text:'Digite uma quantidade hipotética de proteína, carboidrato e gordura para visualizar a energia correspondente.',example:'É um simulador educativo, não uma meta individual.'};
    if(kind==='measurements')return{icon:'↔',title:'Compare tendência',text:'Use condições parecidas quando puder. Uma medida isolada não define evolução.',example:'Compare períodos, não centímetros de um único dia.'};
    if(kind==='comparison')return{icon:'⇄',title:'Leia como comparação',text:'Olhe o primeiro registro e o mais recente juntos e conecte os números com sono, treino e constância.',example:'Resultado não é só peso.'};
    if(kind==='external')return{icon:'↗',title:'Biblioteca visual',text:'Use a biblioteca para reconhecer nomes e execução geral.',example:'Se um movimento causar dor, não force.'};
    if(kind==='gym')return{icon:'★',title:'Próxima etapa',text:'O Gym Rats usa o que foi construído nos 28 dias como base.',example:'A próxima fase é continuidade, não punição.'};
    if(m?.checklist)return{icon:'✓',title:'Checklist de observação',text:'Marque apenas o que já aconteceu ou realmente faz sentido para você.',example:'Item desmarcado mostra onde prestar atenção; não é falha.'};
    return{icon:'✎',title:'Preencha do seu jeito',text:'Use frases curtas e concretas para transformar intenção em ação.',example:'Prefira “caminhar 20 min terça e quinta” a “me movimentar mais”.'};
  };

  function workoutHTML(i){const w=WORKOUTS[i];return `<div class="sectiontitle workout-title"><h2>Treino indicado da semana</h2><small>exemplo educativo</small></div><section class="workout-card tone-${i}"><div class="workout-head"><div class="workout-icon">${WEEK_VISUALS[i].icon}</div><div><span class="workout-level">${w.level}</span><h3>${w.title}</h3><p>${w.summary}</p></div></div><div class="workout-plan">${w.plan.map(x=>`<div><span>✓</span>${x}</div>`).join('')}</div><button class="btn workout-toggle" onclick="toggleWorkout(${i})">VER EXERCÍCIOS E SUBSTITUIÇÕES</button><div id="workout-${i}" class="workout-details hidden">${w.exercises.map((x,n)=>`<div class="exercise-row"><div class="exercise-n">${n+1}</div><div><b>${x[0]}</b><span>${x[1]}</span><small>${x[2]}</small></div></div>`).join('')}<div class="workout-note">${w.note}</div></div></section>`}
  window.toggleWorkout=i=>{const e=document.querySelector(`#workout-${i}`);if(!e)return;e.classList.toggle('hidden');const b=e.previousElementSibling;if(b)b.textContent=e.classList.contains('hidden')?'VER EXERCÍCIOS E SUBSTITUIÇÕES':'OCULTAR DETALHES'};

  function enhanceWeek(i){const c=document.querySelector('#modalContent');if(!c)return;const hero=c.querySelector('.moduleHero');if(hero&&!c.querySelector('.week-breadcrumb'))hero.insertAdjacentHTML('beforebegin','<button class="week-breadcrumb" onclick="closeModal()">← Voltar para as semanas</button>');if(!c.querySelector('.workout-card'))c.insertAdjacentHTML('beforeend',workoutHTML(i));[...c.querySelectorAll('.material')].forEach((el,j)=>{if(el.querySelector('.material-icon'))return;const h=materialHelp(materials[i]?.[j]);el.classList.add('material-visual');el.insertAdjacentHTML('afterbegin',`<div class="material-icon">${h.icon}</div>`)})}
  function enhanceMaterial(i,j){const c=document.querySelector('#modalContent .material-article');if(!c||c.querySelector('.material-how'))return;const m=materials[i]?.[j];if(!m)return;const h=materialHelp(m),lead=c.querySelector('.lead'),box=`<div class="material-how"><div class="material-how-icon">${h.icon}</div><div><b>${h.title}</b><p>${h.text}</p><small>${h.example}</small></div></div>`;if(lead)lead.insertAdjacentHTML('afterend',box);else c.insertAdjacentHTML('afterbegin',box)}
  function visualHome(){if(document.querySelector('.week-visual'))return;const hero=document.querySelector('#view .hero');if(!hero)return;const w=WEEK_VISUALS[wnow()],c=todayCheck(),done=S.progress?.filter(p=>p.status==='completed').length||0,total=Object.values(lessons).flat().length||1;hero.insertAdjacentHTML('afterend',`<section class="week-visual tone-${wnow()}"><div class="visual-symbol">${w.icon}</div><div class="visual-copy"><span>${w.kicker} · SEMANA ${wnow()}</span><h3>${w.title}</h3><p>${w.text}</p></div></section><div class="visual-stats"><div><span>💧</span><b>${c.water_ml||0}</b><small>ml hoje</small></div><div><span>😴</span><b>${c.sleep_minutes?Math.floor(c.sleep_minutes/60)+'h':'—'}</b><small>sono</small></div><div><span>✓</span><b>${score()}%</b><small>constância</small></div><div><span>▤</span><b>${done}/${total}</b><small>conteúdos</small></div></div>`)}
  function visualLearn(){document.querySelectorAll('#view .week').forEach((el,idx)=>{if(el.querySelector('.week-art'))return;const w=WEEK_VISUALS[idx+1],num=el.querySelector('.weeknum');if(num&&w){num.classList.add('week-art');num.textContent=w.icon}})}
  function visualProgress(){const bar=document.querySelector('#view .bar-wrap');if(bar&&!document.querySelector('.progress-caption'))bar.insertAdjacentHTML('afterend','<p class="progress-caption">Cada barra representa seu Score de Constância daquele dia. Use o desenho para enxergar tendência, não para perseguir 100% todos os dias.</p>')}
  function enhanceView(s){if(s==='home')visualHome();if(s==='learn')visualLearn();if(s==='progress')visualProgress();document.querySelectorAll('.hero .eyebrow').forEach(e=>{if(e.textContent.startsWith('PROJETO 28 · DIA'))e.textContent=`SEU PROJETO · DIA ${day()} DE 28`})}
  function enhanceOnboarding(){const h=document.querySelector('#view .onboard-head h1');if(h&&obStep===1)h.textContent='Montando seu projeto.';document.querySelectorAll('#view .onboard-head .badge').forEach(b=>{if(/BEM-VINDA AO VIDA/i.test(b.textContent))b.textContent='BEM-VINDA AO VIDA NOVA'})}
  function installModalUX(){const card=document.querySelector('.modalcard');if(!card)return;if(!card.querySelector('.modal-close'))card.insertAdjacentHTML('afterbegin','<button class="modal-close" onclick="closeModal()" aria-label="Fechar">×</button>');const bar=card.querySelector('.modalbar');if(!bar||bar.dataset.drag==='1')return;bar.dataset.drag='1';let start=0,delta=0,active=false;bar.addEventListener('touchstart',e=>{start=e.touches[0].clientY;delta=0;active=true;card.classList.add('dragging')},{passive:true});bar.addEventListener('touchmove',e=>{if(!active)return;delta=Math.max(0,e.touches[0].clientY-start);card.style.transform=`translateY(${Math.min(delta,180)}px)`},{passive:true});bar.addEventListener('touchend',()=>{if(!active)return;active=false;card.classList.remove('dragging');card.style.transform='';if(delta>70)closeModal();delta=0})}

  document.title='Vida Nova — Projeto 28';
  installModalUX();
  const oldGo=window.go;window.go=function(s){oldGo(s);requestAnimationFrame(()=>enhanceView(s))};
  const oldOpenWeek=window.openWeek;window.openWeek=function(i){oldOpenWeek(i);requestAnimationFrame(()=>enhanceWeek(i))};
  const oldOpenMaterial=window.openMaterial;window.openMaterial=async function(i,j){await oldOpenMaterial(i,j);requestAnimationFrame(()=>enhanceMaterial(i,j))};
  const oldOnboarding=window.onboarding;window.onboarding=function(step=obStep,preview=false){oldOnboarding(step,preview);requestAnimationFrame(enhanceOnboarding)};
  ['terms','privacy','safety'].forEach(name=>{const old=window[name];if(!old)return;window[name]=function(){old();requestAnimationFrame(()=>{const c=document.querySelector('#modalContent');if(c)c.innerHTML=c.innerHTML.replaceAll('VIDA / Projeto 28','Vida Nova / Projeto 28').replaceAll('VIDA','Vida Nova')})}});

  // Important: no MutationObserver here. V4 used an observer that rewrote textContent
  // inside its own callback, producing a self-triggering DOM loop in some browsers.
  window.__VIDA_EXPERIENCE_VERSION='5.0.0';
})();

/* --- experience-v6.js --- */
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
    const d=calendarToday(),dow=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-dow+1+offset*7);return d;
  }
  function dateIsoV7(d){return d.toISOString().slice(0,10)}
  function plusDaysV7(d,n){const x=new Date(d);x.setUTCDate(x.getUTCDate()+n);return x}
  function dayNameV7(d){return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getUTCDay()]}
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
      return '<section class="planner-day-v7 '+(di===iso()?'today':'')+'" data-date="'+di+'"><div class="planner-day-head-v7"><div><small>'+dayNameV7(d)+'</small><b>'+d.getUTCDate()+'</b></div><span class="'+(a?.done?'done':'')+'">'+(a?.done?'✓ realizado':'planejar')+'</span></div><div class="planner-chips-v7">'+chips+'</div>'+actual+'</section>';
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

/* --- experience-v6-water.js --- */
(()=>{
  window.stepWaterV6=function(delta){const el=$('#waterV6');if(!el)return;el.value=Math.max(0,Number(el.value||0)+delta);const out=$('#waterV6Label');if(out)out.textContent=el.value+' ml'};
  window.setWaterV6=function(v){const el=$('#waterV6');if(el){el.value=v;const out=$('#waterV6Label');if(out)out.textContent=v+' ml'}};
  window.waterExact=function(){
    const value=todayCheck().water_ml||0;
    modal(`<div class="article water-modal-v6"><span class="badge">HIDRATAÇÃO</span><h2>Água de hoje</h2><p class="lead">Ajuste em poucos toques. O valor é um registro da sua rotina, não uma meta clínica.</p><div class="water-counter-v6"><button type="button" onclick="stepWaterV6(-250)">−</button><div><b id="waterV6Label">${value} ml</b><input id="waterV6" type="hidden" value="${value}"></div><button type="button" onclick="stepWaterV6(250)">+</button></div><div class="water-presets-v6">${[500,1000,1500,2000,2500,3000].map(v=>`<button type="button" onclick="setWaterV6(${v})">${v>=1000?(v/1000)+' L':v+' ml'}</button>`).join('')}</div><button class="btn full" onclick="upCheck({water_ml:+$('#waterV6').value});closeModal(true)">SALVAR HIDRATAÇÃO</button></div>`);
  };
})();

/* --- experience-v8.js --- */
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

  function localDate(d){return new Date(brasiliaDate(d)+'T12:00:00Z')}
  function monday(offset=0){const d=localDate(new Date()),dow=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-dow+1+(offset*7));return d}
  function addDays(d,n){const x=localDate(d);x.setUTCDate(x.getUTCDate()+n);return x}
  function di(d){return d.toISOString().slice(0,10)}
  function dayLabel(d){return ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'][d.getUTCDay()]}
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
      if(c&&(c.daily_checkin_completed||c.trained||c.movement_minutes||c.sleep_minutes||c.water_ml)){s++;d.setUTCDate(d.getUTCDate()-1)}
      else if(i===0){d.setUTCDate(d.getUTCDate()-1)}else break;
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
  function renderRhythm(rows){return `<div class="pv8-rhythm-bars">${rows.map(r=>{const sc=dayRhythm(r.a);return `<button type="button" onclick="focusPlannerDayV8('${r.date}')"><span class="pv8-bar"><i style="height:${Math.max(8,sc)}%"></i></span><b>${dayLabel(r.d).slice(0,1)}</b><small>${r.d.getUTCDate()}</small></button>`}).join('')}</div>`}
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
      <div class="pv8-days">${rows.map(r=>`<section class="pv8-day ${r.date===iso()?'today':''} ${r.a.done?'done':''}" id="pv8-${r.date}"><button type="button" class="pv8-day-main" onclick="editPlannerDayV8('${r.date}')"><span class="pv8-date"><small>${dayLabel(r.d)}</small><b>${r.d.getUTCDate()}</b></span><span class="pv8-day-body"><b>${r.date===iso()?'Hoje':r.a.done?'Realizado':'Planejamento'}</b><small>${esc(actualSummary(r.a))}</small><i>${planSummary(r.planned)}</i></span><span class="pv8-chevron">›</span></button><div class="pv8-day-edit" data-editor="${r.date}"><small>O que você pretende fazer?</small><div class="pv8-plan-chips">${editorChips(r.date,r.planned)}</div></div></section>`).join('')}</div>
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


/* --- runtime-v19.js --- */
(()=>{
  const V19={indexLoaded:false,weeksLoaded:{},pdfPromise:null,loginFailures:0,lockUntil:0};

  function applyBootstrap(data){
    const p=data?.profile||{}, f=data?.feature||{};
    S.role=user?.app_metadata?.vida_role||'member';
    S.profile={
      name:p.full_name||user?.user_metadata?.full_name||user?.email?.split('@')[0]||'Usuária',
      email:user?.email||p.email||'',
      birth_date:p.birth_date||null
    };
    S.feature=f;
    S.onboarding=data?.onboarding||null;
    S.enrollment=data?.enrollment||null;
    S.checkins=Array.isArray(data?.checkins)?data.checkins:[];
    S.measurements=Array.isArray(data?.measurements)?data.measurements:[];
    S.progress=Array.isArray(data?.progress)?data.progress:[];
    S.waitlist=!!data?.waitlist;
    S.config=data?.config&&typeof data.config==='object'?data.config:{};
  }

  async function loadIndex(){
    if(V19.indexLoaded)return true;
    const {data,error}=await sb.rpc('get_program_index');
    if(error)return false;
    (data||[]).forEach(x=>{
      const i=Number(x.week);
      weeks[i]={title:x.title,unlock:Number(x.unlock),color:x.color};
      if(!V19.weeksLoaded[i]){
        lessons[i]=Array.from({length:Number(x.lesson_count||0)},()=>null);
        materials[i]=Array.from({length:Number(x.material_count||0)},()=>null);
      }
    });
    V19.indexLoaded=true;
    return true;
  }

  window.hydrate=async function(){
    const {data,error}=await sb.rpc('get_app_bootstrap');
    if(error)throw error;
    applyBootstrap(data||{});
    if(base()&&!(await loadIndex()))throw new Error('program_index_failed');
  };

  window.ensureProgramWeekV19=async function(i){
    i=Number(i);
    if(V19.weeksLoaded[i])return true;
    loading(true,'Abrindo Semana '+i+'...');
    const {data,error}=await sb.rpc('get_program_week',{p_week:i});
    loading(false);
    if(error){
      const m=String(error.message||'');
      if(/week_locked/i.test(m))toast('Essa semana ainda não abriu');
      else if(/base_access_required|enrollment_required/i.test(m))toast('Acesso não liberado para esta semana');
      else toast('Não foi possível carregar o conteúdo agora');
      return false;
    }
    const p=data||{};
    if(p.meta)weeks[i]={...weeks[i],...p.meta};
    lessons[i]=Array.isArray(p.lessons)?p.lessons:[];
    guides[i]=p.guide||{};
    materials[i]=Array.isArray(p.materials)?p.materials:[];
    if(p.training)window.VIDA_TRAINING[i]=p.training;
    if(p.references&&typeof p.references==='object')Object.assign(window.VIDA_REFERENCES,p.references);
    V19.weeksLoaded[i]=true;
    return true;
  };

  const openWeekBase=window.openWeek;
  window.openWeek=async function(i){
    i=Number(i);
    if(!master()&&weeks[i]&&day()<Number(weeks[i].unlock))return toast('Essa semana ainda não abriu');
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openWeekBase(i);
  };

  const openLessonBase=window.openLesson;
  window.openLesson=async function(i,j){
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openLessonBase(i,j);
  };
  const openGuideBase=window.openGuide;
  window.openGuide=async function(i){
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openGuideBase(i);
  };
  const openMaterialBase=window.openMaterial;
  window.openMaterial=async function(i,j){
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openMaterialBase(i,j);
  };

  function loadJsPdf(){
    if(window.jspdf)return Promise.resolve();
    if(V19.pdfPromise)return V19.pdfPromise;
    V19.pdfPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
      s.async=true;
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('pdf_load_failed'));
      document.head.appendChild(s);
    });
    return V19.pdfPromise;
  }
  const downloadGuideBase=window.downloadGuide;
  window.downloadGuide=async function(i){
    if(!(await window.ensureProgramWeekV19(i)))return;
    try{await loadJsPdf()}catch{return toast('Não foi possível preparar o PDF agora')};
    return downloadGuideBase(i);
  };

  function authMessage(kind){
    if(kind==='login')return 'E-mail ou senha inválidos.';
    return 'Não foi possível concluir agora. Tente novamente em instantes.';
  }
  function remainingLock(){
    return Math.max(0,Math.ceil((V19.lockUntil-Date.now())/1000));
  }
  window.login=async function(){
    setAuth('');
    const wait=remainingLock();
    if(wait>0)return setAuth('Muitas tentativas. Aguarde '+wait+'s e tente novamente.');
    const email=$('#loginEmail')?.value.trim(),password=$('#loginPass')?.value||'';
    if(!email||!password)return setAuth('Preencha e-mail e senha.');
    loading(true,'Entrando...');
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    loading(false);
    if(error){
      V19.loginFailures++;
      if(V19.loginFailures>=5){V19.lockUntil=Date.now()+60000;V19.loginFailures=0}
      return setAuth(authMessage('login'));
    }
    V19.loginFailures=0;
    user=data.user;
    try{await route()}catch{setAuth(authMessage('generic'))}
  };

  window.forgotPassword=async function(){
    const email=$('#loginEmail')?.value.trim();
    if(!email)return setAuth('Digite seu e-mail primeiro.');
    loading(true,'Enviando acesso...');
    await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?recovery=1'});
    loading(false);
    setAuth('Se esse e-mail estiver cadastrado, você receberá um link para criar ou redefinir sua senha.');
  };

  window.updatePassword=async function(){
    const p=$('#newPass')?.value||'';
    if(p.length<8)return setAuth('Use pelo menos 8 caracteres.');
    loading(true,'Atualizando...');
    const {error}=await sb.auth.updateUser({password:p});
    loading(false);
    if(error)return setAuth(authMessage('generic'));
    history.replaceState({},'',location.origin);
    const {data}=await sb.auth.getUser();
    user=data.user;
    try{await route()}catch{setAuth(authMessage('generic'))}
  };

  window.upCheck=async function(p){
    const date=iso(),row={user_id:user.id,checkin_date:date,...p};
    const {error}=await sb.from('daily_checkins').upsert(row,{onConflict:'user_id,checkin_date'});
    if(error)return toast('Não foi possível salvar');
    const idx=S.checkins.findIndex(x=>x.checkin_date===date);
    if(idx>=0)S.checkins[idx]={...S.checkins[idx],...p};
    else S.checkins.unshift({...row});
    go('track');
  };

  window.completeLesson=async function(i,j){
    loading(true,'Salvando progresso...');
    const {data,error}=await sb.rpc('complete_program_lesson',{p_week:Number(i),p_lesson:Number(j)});
    loading(false);
    if(error)return toast('Não foi possível salvar');
    const row=data||{content_slug:'lesson-'+i+'-'+j,status:'completed',completed_at:new Date().toISOString()};
    const ix=S.progress.findIndex(x=>x.content_slug===row.content_slug);
    if(ix>=0)S.progress[ix]={...S.progress[ix],...row};else S.progress.push(row);
    await window.openWeek(i);
    toast('Conteúdo concluído');
  };

  window.saveMeasurements=async function(){
    const row={
      user_id:user.id,measured_on:iso(),
      weight_kg:n($('#mw')?.value),waist_cm:n($('#mc')?.value),abdomen_cm:n($('#ma')?.value),
      hip_cm:n($('#mh')?.value),arm_cm:n($('#mb')?.value),thigh_cm:n($('#mt')?.value)
    };
    loading(true,'Salvando medidas...');
    const {data,error}=await sb.from('body_measurements').insert(row).select('*').single();
    loading(false);
    if(error)return toast('Não foi possível salvar');
    S.measurements.unshift(data||row);
    closeModal(true);
    go('track');
  };

  window.__VIDA_SECURITY_VERSION='19.0.0';
})();

