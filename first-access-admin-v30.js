(()=>{
  const MIN_PASSWORD_LENGTH=10;
  const FORCE_FLAG='vida_password_change_required';
  const RECOVERY_WAIT_MS=60_000;
  let recoveryAllowedAt=0,recoveryTimer=null;

  async function callFirstAccess(body){
    const {data,error}=await sb.functions.invoke('first-access-admin',{body});
    if(error)throw error;
    if(!data?.ok)throw new Error(data?.error||'first_access_failed');
    return data;
  }

  function passwordChangeScreen(){
    document.querySelector('#login')?.classList.add('hidden');
    document.querySelector('#root')?.classList.remove('hidden');
    document.querySelector('.top')?.classList.add('hidden');
    document.querySelector('.nav')?.classList.add('hidden');
    const name=String(user?.user_metadata?.full_name||'').trim();
    const view=document.querySelector('#view');
    if(!view)return;
    view.innerHTML=`<section class="center-screen"><div class="loginbox first-access-required-v30">
      <span class="badge">PRIMEIRO ACESSO</span>
      <h1>Crie sua senha pessoal.</h1>
      <p>${name?`Olá, ${esc(name)}. `:''}Por segurança, você precisa trocar a senha temporária antes de acessar o Vida Nova.</p>
      <div class="field"><label>Nova senha</label><input id="faNewPasswordV30" type="password" autocomplete="new-password" minlength="${MIN_PASSWORD_LENGTH}" placeholder="Pelo menos ${MIN_PASSWORD_LENGTH} caracteres"></div>
      <div class="field"><label>Confirmar nova senha</label><input id="faConfirmPasswordV30" type="password" autocomplete="new-password" minlength="${MIN_PASSWORD_LENGTH}" placeholder="Digite a senha novamente"></div>
      <button class="btn full" id="faSavePasswordV30" type="button">CRIAR MINHA SENHA</button>
      <p id="faPasswordMessageV30" class="notice auth-msg" role="status"></p>
      <button class="text-button full" type="button" id="faSignOutV30">SAIR</button>
    </div></section>`;
    document.querySelector('#faSavePasswordV30')?.addEventListener('click',finishPasswordChange);
    document.querySelector('#faSignOutV30')?.addEventListener('click',()=>sb.auth.signOut().then(()=>location.reload()));
  }

  async function finishPasswordChange(){
    const password=String(document.querySelector('#faNewPasswordV30')?.value||'');
    const confirmPassword=String(document.querySelector('#faConfirmPasswordV30')?.value||'');
    const message=document.querySelector('#faPasswordMessageV30');
    const button=document.querySelector('#faSavePasswordV30');
    if(password.length<MIN_PASSWORD_LENGTH){if(message)message.textContent=`Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;return}
    if(password!==confirmPassword){if(message)message.textContent='As senhas não são iguais.';return}
    if(button)button.disabled=true;
    loading(true,'Atualizando sua senha...');
    try{
      await callFirstAccess({action:'complete',new_password:password});
      const {data,error}=await sb.auth.refreshSession();
      if(error||!data?.user)throw new Error('session_refresh_failed');
      user=data.user;
      if(user.app_metadata?.[FORCE_FLAG])throw new Error('password_change_still_required');
      toast('Senha atualizada ✓');
      await window.route.__vidaOriginal.apply(window,[]);
    }catch{
      if(message)message.textContent='Não foi possível concluir a troca. Confirme os requisitos e tente novamente.';
      if(button)button.disabled=false;
    }finally{loading(false)}
  }

  const originalRoute=window.route;
  if(typeof originalRoute==='function'){
    const gatedRoute=async function(...args){
      if(user?.app_metadata?.[FORCE_FLAG])return passwordChangeScreen();
      return originalRoute.apply(this,args);
    };
    gatedRoute.__vidaOriginal=originalRoute;
    window.route=gatedRoute;
  }

  function recoveryButton(){return document.querySelector('#login .loginbox > .text-button.full')}
  function startRecoveryCooldown(){
    recoveryAllowedAt=Date.now()+RECOVERY_WAIT_MS;
    clearInterval(recoveryTimer);
    const button=recoveryButton();
    const originalText='PRIMEIRO ACESSO / ESQUECI A SENHA';
    const tick=()=>{
      const left=Math.max(0,Math.ceil((recoveryAllowedAt-Date.now())/1000));
      const current=recoveryButton();
      if(current){current.disabled=left>0;current.textContent=left?`AGUARDE ${left}S PARA TENTAR NOVAMENTE`:originalText}
      if(!left)clearInterval(recoveryTimer);
    };
    if(button)button.disabled=true;
    tick();
    recoveryTimer=setInterval(tick,1000);
  }

  window.forgotPassword=async function(){
    const left=Math.max(0,Math.ceil((recoveryAllowedAt-Date.now())/1000));
    if(left)return setAuth(`Aguarde ${left}s antes de pedir outro e-mail.`);
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setAuth('Digite um e-mail válido.');
    startRecoveryCooldown();
    loading(true,'Enviando link de acesso...');
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?recovery=1'});
    loading(false);
    if(error){
      const message=String(error.message||'').toLowerCase();
      if(message.includes('rate')||message.includes('security purposes')){
        return setAuth('O serviço de e-mail atingiu o limite temporário. Aguarde antes de tentar novamente.');
      }
      return setAuth('Se esse e-mail estiver cadastrado, você receberá um link para criar ou redefinir sua senha.');
    }
    setAuth('Se esse e-mail estiver cadastrado, você receberá um link para criar ou redefinir sua senha.');
  };

  function selectedEmail(){
    return String(document.querySelector('#admEmail')?.value||'').trim().toLowerCase();
  }

  function ensureTempPasswordButton(){
    const editor=document.querySelector('.admin-editor');
    if(!editor||editor.querySelector('.admin-temp-password-v30'))return;
    const revoke=editor.querySelector('.admin-revoke');
    const button=document.createElement('button');
    button.type='button';
    button.className='btn outline full admin-temp-password-v30';
    button.textContent='LIBERAR PRIMEIRO ACESSO';
    button.addEventListener('click',issueTemporaryPassword);
    if(revoke)revoke.insertAdjacentElement('afterend',button);else editor.appendChild(button);
    const help=editor.querySelector('.admin-help');
    if(help)help.innerHTML='Para liberar o primeiro acesso, salve os acessos e gere uma senha temporária. Ela aparece uma única vez para ser entregue à cliente por um canal privado. O app exigirá a troca antes de mostrar qualquer tela.';
  }

  function showTemporaryPassword(email,password){
    modal(`<div class="first-access-v24 first-access-issued-v30">
      <span class="badge">ACESSO LIBERADO</span>
      <h2>Senha temporária criada.</h2>
      <p>Entregue esta senha à cliente por um canal privado. Ela será obrigada a criar uma senha pessoal no primeiro login.</p>
      <div class="field"><label>E-mail</label><input readonly value="${esc(email)}"></div>
      <div class="field"><label>Senha temporária · exibida apenas agora</label><input id="faIssuedPasswordV30" readonly value="${esc(password)}" autocomplete="off"></div>
      <button class="btn full" id="faCopyPasswordV30" type="button">COPIAR SENHA</button>
      <p class="notice top-gap-sm">Depois de fechar esta tela, gere outra senha temporária se precisar liberar o acesso novamente.</p>
    </div>`);
    document.querySelector('#faCopyPasswordV30')?.addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(password);
        toast('Senha copiada. Envie em particular.');
      }catch{
        const input=document.querySelector('#faIssuedPasswordV30');
        input?.select();
        toast('Senha selecionada para copiar.');
      }
    });
  }

  async function issueTemporaryPassword(){
    const email=selectedEmail();
    if(!email)return toast('Busque ou selecione uma cliente primeiro.');
    if(!confirm(`Gerar uma senha temporária para ${email}?\n\nA senha atual será substituída e a cliente deverá criar outra no próximo acesso.`))return;
    const button=document.querySelector('.admin-temp-password-v30');
    if(button)button.disabled=true;
    loading(true,'Gerando senha temporária...');
    try{
      const data=await callFirstAccess({action:'issue',email});
      showTemporaryPassword(email,data.temporary_password);
      await window.refreshAdminList?.();
    }catch(e){
      const code=String(e?.message||'');
      if(code.includes('user_not_found'))toast('Salve os acessos desta cliente antes de liberar o primeiro acesso.');
      else toast('Não foi possível gerar a senha temporária.');
    }finally{
      loading(false);
      if(button)button.disabled=false;
    }
  }

  const openAdmin=window.openVidaAdmin;
  if(typeof openAdmin==='function')window.openVidaAdmin=async function(...args){
    await openAdmin.apply(this,args);
    ensureTempPasswordButton();
  };
  const selectAdmin=window.selectAdminUser;
  if(typeof selectAdmin==='function')window.selectAdminUser=function(...args){
    const out=selectAdmin.apply(this,args);
    ensureTempPasswordButton();
    return out;
  };
  const findAdmin=window.adminFindEmail;
  if(typeof findAdmin==='function')window.adminFindEmail=function(...args){
    const out=findAdmin.apply(this,args);
    ensureTempPasswordButton();
    return out;
  };
  const refreshAdmin=window.refreshAdminList;
  if(typeof refreshAdmin==='function')window.refreshAdminList=async function(...args){
    const out=await refreshAdmin.apply(this,args);
    ensureTempPasswordButton();
    return out;
  };

  window.__VIDA_FIRST_ACCESS_ADMIN='30.0.0';
})();
