(()=>{
  const APP_URL='https://vida-projeto28.vercel.app';
  try{localStorage.removeItem('vida_device_pair_v1')}catch{}

  window.forgotPassword=async function(){
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      setAuth('Digite um e-mail válido.');
      return false;
    }
    setAuth('');
    loading(true,'Enviando primeiro acesso...');
    try{
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_URL+'/?recovery=1'});
      if(error){
        if(error.code==='over_email_send_rate_limit'){
          setAuth('O envio está temporariamente indisponível. Se já criou sua senha, use ENTRAR. Para o primeiro acesso, peça seu link individual ao suporte do Vida Nova.');
        }else if(error.status===429){
          setAuth('Aguarde antes de pedir outro link. Este pedido não foi enviado. Se já recebeu um link, use o e-mail anterior.');
        }else{
          setAuth('Não foi possível enviar agora. Se já criou sua senha, use ENTRAR.');
        }
        return false;
      }
      setAuth('Pedido de envio recebido. Se você comprou com esse e-mail, confira a caixa de entrada e o spam. Abra o link para criar sua senha.');
      return true;
    }catch{
      setAuth('Não foi possível confirmar o envio. Confira sua caixa de entrada antes de tentar novamente.');
      return false;
    }finally{
      loading(false);
    }
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

  window.__VIDA_FIRST_ACCESS_STABLE='36.0.0';
})();