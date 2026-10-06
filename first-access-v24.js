(()=>{
  const FIRST_ACCESS={email:'',resendAt:0,timer:null};

  function normalizeEmail(v){
    return String(v||'').trim().toLowerCase();
  }

  function validEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function otpHtml(email){
    return `<div class="first-access-v24">
      <button class="fa-back" type="button" onclick="closeModal(true)">‹</button>
      <span class="badge">PRIMEIRO ACESSO</span>
      <h2>Confira seu e-mail.</h2>
      <p>Enviamos um código de 6 dígitos para <b>${esc(email)}</b>.</p>
      <div class="fa-code-wrap">
        <input id="faOtp" class="fa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"
          oninput="this.value=this.value.replace(/\D/g,'').slice(0,6);if(this.value.length===6)verifyFirstAccessCode()">
      </div>
      <button class="btn full" id="faVerifyBtn" type="button" onclick="verifyFirstAccessCode()">CONFIRMAR CÓDIGO</button>
      <button class="text-button full fa-resend" id="faResendBtn" type="button" onclick="resendFirstAccessCode()">REENVIAR CÓDIGO</button>
      <p id="faTimer" class="fa-timer"></p>
      <button class="text-button full" type="button" onclick="closeModal(true);document.querySelector('#loginEmail')?.focus()">USAR OUTRO E-MAIL</button>
      <div class="notice top-gap-sm">Por segurança, o código é de uso único e expira.</div>
    </div>`;
  }

  function passwordHtml(){
    return `<div class="first-access-v24">
      <span class="badge">ÚLTIMO PASSO</span>
      <h2>Crie sua senha.</h2>
      <p>Depois disso, você já entra direto no Vida Nova.</p>
      <div class="field"><label>Nova senha</label><input id="faPass" type="password" autocomplete="new-password" placeholder="8 caracteres ou mais"></div>
      <div class="field"><label>Confirmar senha</label><input id="faPass2" type="password" autocomplete="new-password" placeholder="Repita sua senha"></div>
      <button class="btn full" type="button" onclick="finishFirstAccess()">CRIAR SENHA E ENTRAR</button>
      <p id="faMsg" class="notice top-gap-sm"></p>
    </div>`;
  }

  function startCountdown(){
    clearInterval(FIRST_ACCESS.timer);
    FIRST_ACCESS.resendAt=Date.now()+60000;
    const tick=()=>{
      const left=Math.max(0,Math.ceil((FIRST_ACCESS.resendAt-Date.now())/1000));
      const btn=document.querySelector('#faResendBtn');
      const out=document.querySelector('#faTimer');
      if(btn)btn.disabled=left>0;
      if(out)out.textContent=left>0?`Você pode reenviar em ${left}s`:'';
      if(left<=0)clearInterval(FIRST_ACCESS.timer);
    };
    tick();
    FIRST_ACCESS.timer=setInterval(tick,1000);
  }

  async function sendCode(email,showScreen=true){
    loading(true,'Enviando código...');
    const {error}=await sb.auth.signInWithOtp({
      email,
      options:{shouldCreateUser:false}
    });
    loading(false);

    if(error){
      const msg=String(error.message||'').toLowerCase();
      if(msg.includes('rate')||msg.includes('security purposes')){
        toast('Aguarde um pouco antes de pedir outro código.');
      }else{
        toast('Não foi possível enviar agora. Tente novamente.');
      }
      return false;
    }

    FIRST_ACCESS.email=email;
    if(showScreen){
      modal(otpHtml(email));
      setTimeout(()=>document.querySelector('#faOtp')?.focus(),120);
    }else{
      toast('Novo código enviado.');
    }
    startCountdown();
    return true;
  }

  window.forgotPassword=async function(){
    const email=normalizeEmail(document.querySelector('#loginEmail')?.value);
    if(!validEmail(email))return setAuth('Digite um e-mail válido.');
    await sendCode(email,true);
  };

  window.verifyFirstAccessCode=async function(){
    const token=String(document.querySelector('#faOtp')?.value||'').replace(/\D/g,'');
    if(token.length!==6)return toast('Digite os 6 números do código.');

    const btn=document.querySelector('#faVerifyBtn');
    if(btn)btn.disabled=true;
    loading(true,'Confirmando código...');
    const {data,error}=await sb.auth.verifyOtp({
      email:FIRST_ACCESS.email,
      token,
      type:'email'
    });
    loading(false);
    if(btn)btn.disabled=false;

    if(error||!data?.session){
      toast('Código inválido ou expirado. Confira o e-mail e tente novamente.');
      return;
    }

    user=data.user;
    modal(passwordHtml());
    setTimeout(()=>document.querySelector('#faPass')?.focus(),120);
  };

  window.resendFirstAccessCode=async function(){
    if(Date.now()<FIRST_ACCESS.resendAt)return;
    await sendCode(FIRST_ACCESS.email,false);
  };

  window.finishFirstAccess=async function(){
    const p=String(document.querySelector('#faPass')?.value||'');
    const p2=String(document.querySelector('#faPass2')?.value||'');
    const msg=document.querySelector('#faMsg');

    if(p.length<8){
      if(msg)msg.textContent='Use pelo menos 8 caracteres.';
      return;
    }
    if(p!==p2){
      if(msg)msg.textContent='As senhas não são iguais.';
      return;
    }

    loading(true,'Preparando seu acesso...');
    const {error}=await sb.auth.updateUser({password:p});
    if(error){
      loading(false);
      if(msg)msg.textContent='Não foi possível criar a senha. Tente novamente.';
      return;
    }

    const {data}=await sb.auth.getUser();
    user=data.user;
    try{
      await route();
      closeModal(true);
      toast('Acesso criado ✓');
    }catch{
      loading(false);
      if(msg)msg.textContent='Senha criada. Feche esta tela e entre novamente.';
    }
    loading(false);
  };

  window.__VIDA_FIRST_ACCESS_VERSION='24.0.0';
})();