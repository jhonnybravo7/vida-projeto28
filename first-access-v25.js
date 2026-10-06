(()=>{
  const RECOVERY_URL='https://vida-projeto28.vercel.app/?recovery=1';

  window.forgotPassword=async function(){
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!email)return setAuth('Digite seu e-mail primeiro.');

    loading(true,'Enviando acesso...');
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:RECOVERY_URL});
    loading(false);

    if(error){
      const msg=String(error.message||'').toLowerCase();
      if(msg.includes('rate')||msg.includes('security purposes')){
        return setAuth('Aguarde alguns segundos e tente novamente.');
      }
      return setAuth('Não foi possível enviar agora. Tente novamente.');
    }

    setAuth('Enviamos um link para criar ou redefinir sua senha.');
  };

  window.__VIDA_FIRST_ACCESS_VERSION='25.0.0';
})();