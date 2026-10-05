(()=>{
  const ADMIN_EMAIL='jpcaminata@gmail.com';
  let adminRows=[];

  function adminUI(){
    const currentUser=(typeof user!=='undefined'&&user)?user:null;
    const email=String(currentUser?.email||'').toLowerCase();
    const isMaster=(typeof master==='function')?master():false;
    return !!(currentUser?.app_metadata?.vida_admin===true || (email===ADMIN_EMAIL && isMaster));
  }

  async function api(body){
    const {data,error}=await sb.functions.invoke('admin-access',{body});
    if(error) throw error;
    if(!data?.ok) throw new Error(data?.error||'admin_error');
    return data;
  }

  function accessTags(r){
    const tags=[];
    if(r.base_access)tags.push('<span>Projeto 28</span>');
    if(r.planner_access)tags.push('<span>Planner+</span>');
    if(r.gymrats_access)tags.push('<span>Gym Rats</span>');
    if(r.club_access)tags.push('<span>Carol Club</span>');
    return tags.length?tags.join(''):'<span class="off">Sem acesso</span>';
  }

  function rowHtml(r){
    return `<button class="admin-user-row" type="button" onclick="selectAdminUser('${esc(r.email||'')}')">
      <span class="admin-user-main"><b>${esc(r.full_name||r.email||'Usuária')}</b><small>${esc(r.email||'')}</small></span>
      <span class="admin-user-origin ${String(r.origin||'').toLowerCase().replace(/\s+/g,'-')}">${esc(r.origin||'Sistema')}</span>
      <span class="admin-access-tags">${accessTags(r)}</span>
      <span class="admin-chevron">›</span>
    </button>`;
  }

  function panelHtml(rows){
    return `<div class="admin-v22">
      <div class="admin-head">
        <span class="badge">ADMIN</span>
        <h2>Acessos do Vida Nova</h2>
        <p>Libere ou revogue acessos por e-mail. Tudo é validado no servidor e registrado em auditoria.</p>
      </div>

      <section class="admin-editor">
        <label>E-mail da cliente</label>
        <div class="admin-email-row">
          <input id="admEmail" type="email" inputmode="email" autocomplete="off" placeholder="cliente@email.com">
          <button type="button" onclick="adminFindEmail()">BUSCAR</button>
        </div>

        <div class="admin-switch-grid">
          <label class="admin-switch"><input id="admBase" type="checkbox"><span><b>Projeto 28</b><small>Acesso principal</small></span><i></i></label>
          <label class="admin-switch"><input id="admPlanner" type="checkbox"><span><b>Planner+</b><small>Adicional</small></span><i></i></label>
          <label class="admin-switch"><input id="admGym" type="checkbox"><span><b>Gym Rats</b><small>Próxima fase</small></span><i></i></label>
          <label class="admin-switch"><input id="admClub" type="checkbox"><span><b>Carol Club</b><small>Acesso restrito</small></span><i></i></label>
        </div>

        <div id="admSelected" class="admin-selected hidden"></div>
        <button class="btn full admin-save" type="button" onclick="adminSaveAccess()">SALVAR ACESSOS</button>
        <button class="btn outline full admin-revoke" type="button" onclick="adminRevokeAll()">REVOGAR TODOS</button>
        <p class="admin-help">Se o e-mail ainda não existir, o sistema cria a conta e a pessoa usa <b>Primeiro acesso / criar senha</b>.</p>
      </section>

      <section class="admin-list-section">
        <div class="admin-list-head">
          <div><small>USUÁRIOS</small><h3>Clientes e acessos</h3></div>
          <button type="button" onclick="refreshAdminList()">↻</button>
        </div>
        <div class="admin-search"><input id="admSearch" placeholder="Buscar nome ou e-mail" oninput="filterAdminLocal(this.value)"></div>
        <div id="admUsers" class="admin-users">${rows.map(rowHtml).join('')||'<div class="admin-empty">Nenhum usuário encontrado.</div>'}</div>
      </section>
    </div>`;
  }

  function fill(r){
    $('#admEmail').value=r?.email||'';
    $('#admBase').checked=!!r?.base_access;
    $('#admPlanner').checked=!!r?.planner_access;
    $('#admGym').checked=!!r?.gymrats_access;
    $('#admClub').checked=!!r?.club_access;
    const el=$('#admSelected');
    if(r){
      el.classList.remove('hidden');
      el.innerHTML=`<span>ORIGEM</span><b>${esc(r.origin||'Sistema')}</b><small>${esc(r.full_name||r.email||'')}</small>`;
    }else{
      el.classList.add('hidden');
      el.innerHTML='';
    }
  }

  window.openVidaAdmin=async function(){
    if(!adminUI())return toast('Acesso administrativo indisponível');
    loading(true,'Abrindo painel...');
    try{
      const data=await api({action:'list'});
      adminRows=data.rows||[];
      modal(panelHtml(adminRows));
    }catch(e){
      toast('Não foi possível abrir o painel');
    }finally{loading(false)}
  };

  window.refreshAdminList=async function(){
    loading(true,'Atualizando usuários...');
    try{
      const data=await api({action:'list'});
      adminRows=data.rows||[];
      const el=$('#admUsers');if(el)el.innerHTML=adminRows.map(rowHtml).join('')||'<div class="admin-empty">Nenhum usuário encontrado.</div>';
    }catch{toast('Não foi possível atualizar')}finally{loading(false)}
  };

  window.filterAdminLocal=function(q){
    q=String(q||'').trim().toLowerCase();
    const rows=!q?adminRows:adminRows.filter(r=>String(r.email||'').toLowerCase().includes(q)||String(r.full_name||'').toLowerCase().includes(q));
    const el=$('#admUsers');if(el)el.innerHTML=rows.map(rowHtml).join('')||'<div class="admin-empty">Nenhum resultado.</div>';
  };

  window.selectAdminUser=function(email){
    const r=adminRows.find(x=>String(x.email||'').toLowerCase()===String(email||'').toLowerCase());
    fill(r||{email});
    document.querySelector('.admin-editor')?.scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.adminFindEmail=function(){
    const email=String($('#admEmail')?.value||'').trim().toLowerCase();
    if(!email)return toast('Digite um e-mail');
    const r=adminRows.find(x=>String(x.email||'').toLowerCase()===email);
    fill(r||{email,origin:'Novo acesso'});
    if(!r)toast('E-mail novo. Escolha os acessos e salve.');
  };

  async function saveState(state){
    const email=String($('#admEmail')?.value||'').trim().toLowerCase();
    if(!email)return toast('Digite o e-mail');
    loading(true,'Salvando acessos...');
    try{
      const data=await api({action:'set',email,...state});
      toast('Acessos atualizados ✓');
      await refreshAdminList();
      const r=adminRows.find(x=>String(x.email||'').toLowerCase()===email);
      fill(r||data);
    }catch(e){
      toast('Não foi possível salvar');
    }finally{loading(false)}
  }

  window.adminSaveAccess=async function(){
    const state={
      base_access:!!$('#admBase')?.checked,
      planner_access:!!$('#admPlanner')?.checked,
      gymrats_access:!!$('#admGym')?.checked,
      club_access:!!$('#admClub')?.checked
    };
    if(state.planner_access||state.gymrats_access||state.club_access){
      state.base_access=true;
      if($('#admBase'))$('#admBase').checked=true;
    }
    await saveState(state);
  };

  window.adminRevokeAll=async function(){
    await saveState({base_access:false,planner_access:false,gymrats_access:false,club_access:false});
    ['admBase','admPlanner','admGym','admClub'].forEach(id=>{const e=$('#'+id);if(e)e.checked=false});
  };

  const baseMasterPanel=window.masterPanel;
  if(baseMasterPanel){
    window.masterPanel=function(){
      const html=baseMasterPanel();
      if(!adminUI())return html;
      return html+`<div class="card master-card top-gap-sm admin-master-shortcut"><span class="badge dark-badge">ADMIN</span><h3>Gestão de acessos</h3><p>Libere ou revogue clientes manualmente.</p><button class="btn full top-gap-sm" onclick="openVidaAdmin()">ABRIR PAINEL ADMIN</button></div>`;
    };
  }

  const baseProfile=window.profile;
  if(baseProfile){
    window.profile=function(){
      let html=baseProfile();
      if(!adminUI())return html;
      const adminCard=`<div class="card top-gap admin-profile-card">
        <div><span class="badge">ADMIN</span><h3>Gestão de acessos</h3><p>Libere clientes manualmente sem passar pela Cakto.</p></div>
        <button class="btn" onclick="openVidaAdmin()">ABRIR PAINEL</button>
      </div>`;
      const marker='<div class="card top-gap profile-links">';
      return html.includes(marker)?html.replace(marker,adminCard+marker):html+adminCard;
    };
  }

  window.__VIDA_ADMIN_VERSION='22.1.0';
})();