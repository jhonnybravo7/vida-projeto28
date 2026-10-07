(()=>{
  const APP_URL='https://vida-projeto28.vercel.app';
  try{localStorage.removeItem('vida_device_pair_v1')}catch{}

  window.forgotPassword=async function(){
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!email)return setAuth('Digite seu e-mail primeiro.');
    loading(true,'Enviando primeiro acesso...');
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_URL+'/?recovery=1'});
    loading(false);
    if(error){
      const m=String(error.message||'').toLowerCase();
      if(m.includes('rate')||m.includes('security purposes'))return setAuth('O envio foi limitado. Aguarde um pouco e tente novamente.');
      return setAuth('Não foi possível enviar agora. Tente novamente.');
    }
    setAuth('Link enviado. Abra o e-mail, crie sua senha e depois entre no Vida Nova com e-mail + senha.');
  };

  const previousRecovery=window.recovery;
  window.recovery=function(){
    if(previousRecovery)previousRecovery();
    const box=document.querySelector('.loginbox');
    if(!box)return;
    const p=box.querySelector('p');
    if(p)p.textContent='Crie sua senha para concluir o primeiro acesso. Depois você poderá entrar pelo app com e-mail + senha.';
  };

  const previousStart=window.startVidaApp;
  window.startVidaApp=async function(){
    if(new URLSearchParams(location.search).get('recovery')==='1')return recovery();
    return previousStart?.();
  };

  window.__VIDA_FIRST_ACCESS_STABLE='31.0.0';
})();