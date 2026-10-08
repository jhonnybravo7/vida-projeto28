(()=>{
  const EMAIL_KEY='vida_last_email_v1';
  const SEND_KEY='vida_last_link_send_v2';
  let sending=false;
  let lastSent=null;
  const previousForgot=window.forgotPassword;
  const previousLogin=window.login;
  const previousProfile=window.profile;

  function saveEmail(v){try{localStorage.setItem(EMAIL_KEY,String(v||'').trim().toLowerCase())}catch{}}
  function getEmail(){try{return localStorage.getItem(EMAIL_KEY)||''}catch{return''}}
  function sentAgo(email){
    let state=lastSent;
    try{state=JSON.parse(localStorage.getItem(SEND_KEY)||'null')||state}catch{}
    if(state?.email!==email||!Number.isFinite(state?.at))return 999;
    return Math.max(0,Math.floor((Date.now()-state.at)/1000));
  }
  function markSent(email){
    lastSent={email,at:Date.now()};
    try{localStorage.setItem(SEND_KEY,JSON.stringify(lastSent))}catch{}
  }

  window.login=async function(){
    const email=document.querySelector('#loginEmail')?.value||'';
    if(email)saveEmail(email);
    return previousLogin?.();
  };

  window.forgotPassword=async function(){
    if(sending)return false;
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!email){setAuth('Digite seu e-mail primeiro.');return false;}
    saveEmail(email);
    const ago=sentAgo(email);
    if(ago<60){
      setAuth('O pedido de envio já foi recebido. Confira sua caixa de entrada e o spam. Aguarde '+(60-ago)+'s antes de pedir outro.');
      return false;
    }
    sending=true;
    const buttons=[...document.querySelectorAll('button[onclick="forgotPassword()"]')];
    const disabled=buttons.map(button=>button.disabled);
    buttons.forEach(button=>{button.disabled=true});
    try{
      const sent=await previousForgot?.();
      if(sent===true)markSent(email);
      return sent===true;
    }finally{
      sending=false;
      buttons.forEach((button,i)=>{button.disabled=disabled[i]});
    }
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

  window.__VIDA_ACCESS_POLISH='36.0.0';
})();