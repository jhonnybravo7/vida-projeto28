(()=>{
  const EMAIL_KEY='vida_last_email_v1';
  const SEND_KEY='vida_last_link_send_v1';
  const previousForgot=window.forgotPassword;
  const previousLogin=window.login;
  const previousProfile=window.profile;

  function saveEmail(v){try{localStorage.setItem(EMAIL_KEY,String(v||'').trim().toLowerCase())}catch{}}
  function getEmail(){try{return localStorage.getItem(EMAIL_KEY)||''}catch{return''}}
  function sentAgo(){try{return Math.floor((Date.now()-Number(localStorage.getItem(SEND_KEY)||0))/1000)}catch{return 999}}
  function markSent(){try{localStorage.setItem(SEND_KEY,String(Date.now()))}catch{}}

  window.login=async function(){
    const email=document.querySelector('#loginEmail')?.value||'';
    if(email)saveEmail(email);
    return previousLogin?.();
  };

  window.forgotPassword=async function(){
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!email)return setAuth('Digite seu e-mail primeiro.');
    saveEmail(email);
    const ago=sentAgo();
    if(ago<60)return setAuth('O link já foi enviado. Aguarde '+(60-ago)+'s antes de pedir outro.');
    markSent();
    return previousForgot?.();
  };

  if(previousProfile){
    window.profile=function(){
      let h=previousProfile();
      const card='<div class="card top-gap"><span class="badge">ACESSO</span><h3>Login e segurança</h3><p>O link por e-mail continua funcionando. Se quiser, você também pode criar ou alterar uma senha para entrar pelo botão ENTRAR.</p><button class="btn full top-gap-sm" onclick="recovery()">CRIAR / ALTERAR SENHA</button></div>';
      const marker='<div class="card top-gap profile-links">';
      return h.includes(marker)?h.replace(marker,card+marker):h+card;
    };
  }

  setTimeout(()=>{
    const email=document.querySelector('#loginEmail');
    if(email&&!email.value&&getEmail())email.value=getEmail();
  },100);

  window.__VIDA_ACCESS_POLISH='28.0.0';
})();