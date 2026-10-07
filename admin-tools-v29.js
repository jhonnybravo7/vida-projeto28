(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .top{background:var(--bg)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    .admin-delete-v29{margin-top:8px!important;border-color:#d9b2b2!important;color:#9a2f2f!important;background:#fff!important}
    .admin-user-status-v29{display:block!important;margin-top:3px!important;font-size:7px!important;color:var(--text-2)!important}
  `;
  document.head.appendChild(style);

  async function adminApi(body){
    const {data,error}=await sb.functions.invoke('admin-access',{body});
    if(error)throw error;
    if(!data?.ok)throw new Error(data?.error||'admin_error');
    return data;
  }

  function selectedEmail(){
    return String(document.querySelector('#admEmail')?.value||'').trim().toLowerCase();
  }

  function ensureDeleteButton(){
    const editor=document.querySelector('.admin-editor');
    if(!editor||editor.querySelector('.admin-delete-v29'))return;
    const revoke=editor.querySelector('.admin-revoke');
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn outline full admin-delete-v29';
    btn.textContent='EXCLUIR USUÁRIO DE TESTE';
    btn.onclick=window.deleteVidaTestUser;
    if(revoke)revoke.insertAdjacentElement('afterend',btn); else editor.appendChild(btn);
    const help=editor.querySelector('.admin-help');
    if(help)help.innerHTML='Usuária nova entra pelo <b>link enviado por e-mail</b>. Depois pode criar uma senha dentro do app. <b>Excluir usuário</b> é para testes e apaga a conta manual para refazer o primeiro acesso.';
  }

  async function enhanceRows(){
    try{
      const data=await adminApi({action:'list'});
      const map=new Map((data.rows||[]).map(r=>[String(r.email||'').toLowerCase(),r]));
      document.querySelectorAll('.admin-user-row').forEach(row=>{
        const smalls=row.querySelectorAll('.admin-user-main small');
        const email=String(smalls[0]?.textContent||'').trim().toLowerCase();
        const r=map.get(email);
        if(!r)return;
        let status=row.querySelector('.admin-user-status-v29');
        if(!status){
          status=document.createElement('small');
          status.className='admin-user-status-v29';
          row.querySelector('.admin-user-main')?.appendChild(status);
        }
        const last=r.last_sign_in_at?new Date(r.last_sign_in_at).toLocaleDateString('pt-BR'):'nunca entrou';
        status.textContent='Último acesso: '+last+' · '+(r.password_set?'senha criada':'sem senha criada');
      });
    }catch{}
  }

  window.deleteVidaTestUser=async function(){
    const email=selectedEmail();
    if(!email)return toast('Selecione um usuário primeiro');
    const ok=confirm('Excluir completamente '+email+' para refazer o primeiro acesso?\n\nIsso apaga a conta e os dados de teste desse usuário.');
    if(!ok)return;
    loading(true,'Excluindo usuário...');
    try{
      await adminApi({action:'delete',email});
      toast('Usuário excluído ✓');
      const input=document.querySelector('#admEmail');if(input)input.value='';
      ['admBase','admPlanner','admGym','admClub'].forEach(id=>{const e=document.querySelector('#'+id);if(e)e.checked=false});
      document.querySelector('#admSelected')?.classList.add('hidden');
      await window.refreshAdminList?.();
      setTimeout(enhanceRows,250);
    }catch(e){
      const m=String(e?.message||'');
      if(m.includes('cakto_user_delete_blocked'))toast('Usuário da Cakto: revogue o acesso em vez de excluir.');
      else if(m.includes('cannot_delete_self'))toast('Seu próprio usuário admin não pode ser excluído.');
      else toast('Não foi possível excluir esse usuário.');
    }finally{loading(false)}
  };

  const oldOpen=window.openVidaAdmin;
  if(oldOpen)window.openVidaAdmin=async function(){
    await oldOpen();
    setTimeout(()=>{ensureDeleteButton();enhanceRows()},180);
  };

  const oldSelect=window.selectAdminUser;
  if(oldSelect)window.selectAdminUser=function(email){
    oldSelect(email);
    ensureDeleteButton();
  };

  const oldFind=window.adminFindEmail;
  if(oldFind)window.adminFindEmail=function(){
    oldFind();
    ensureDeleteButton();
  };

  const oldRefresh=window.refreshAdminList;
  if(oldRefresh)window.refreshAdminList=async function(){
    await oldRefresh();
    setTimeout(()=>{ensureDeleteButton();enhanceRows()},120);
  };

  window.__VIDA_ADMIN_TOOLS='29.0.0';
})();