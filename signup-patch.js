(()=>{
  function ensureSignupButton(){
    const box=document.querySelector('#login .loginbox');
    if(!box||box.querySelector('[data-signup]'))return;
    const forgot=box.querySelector('.text-button');
    if(!forgot)return;
    const b=document.createElement('button');
    b.className='btn outline full top-gap-sm';
    b.dataset.signup='1';
    b.textContent='CRIAR CONTA';
    b.onclick=()=>window.openSignup();
    forgot.insertAdjacentElement('afterend',b);
  }

  window.openSignup=function(){
    modal(`<div class="article"><span class="badge">PRIMEIRO ACESSO</span><h2>Criar minha conta</h2><p class="lead">Use o e-mail aprovado ou o mesmo e-mail informado na compra.</p><div class="field"><label>Nome</label><input id="su_name" autocomplete="name" placeholder="Seu nome"></div><div class="field"><label>E-mail</label><input id="su_email" type="email" autocomplete="email" placeholder="voce@email.com"></div><div class="field"><label>Senha</label><input id="su_pass" type="password" autocomplete="new-password" placeholder="8 caracteres ou mais"></div><div class="notice">Se esse e-mail já estiver pré-aprovado, o acesso é liberado automaticamente. Caso contrário, a conta fica aguardando aprovação ou confirmação da compra.</div><button class="btn full top-gap" onclick="submitSignup()">CRIAR E ENTRAR</button></div>`);
  };

  window.submitSignup=async function(){
    const name=document.querySelector('#su_name')?.value.trim();
    const email=document.querySelector('#su_email')?.value.trim();
    const password=document.querySelector('#su_pass')?.value||'';
    if(!name||!email||password.length<8)return toast('Preencha nome, e-mail e uma senha de pelo menos 8 caracteres.');
    loading(true,'Criando acesso...');
    let r=await sb.auth.signUp({email,password,options:{data:{full_name:name}}});
    if(r.error && !/already|registered|exists/i.test(r.error.message||'')){
      loading(false);return toast(r.error.message||'Não foi possível criar a conta.');
    }
    const loginResult=await sb.auth.signInWithPassword({email,password});
    loading(false);
    if(loginResult.error){
      closeModal();
      const e=document.querySelector('#loginEmail'); if(e)e.value=email;
      setAuth('Conta criada. Se o acesso ainda não estiver pré-aprovado, confira seu e-mail ou aguarde a liberação.');
      return;
    }
    user=loginResult.data.user;
    closeModal();
    await route();
  };

  ensureSignupButton();
  const obs=new MutationObserver(ensureSignupButton);
  obs.observe(document.body,{childList:true,subtree:true});
})();
