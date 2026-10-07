(()=>{
  const APP_URL='https://vida-projeto28.vercel.app';
  const BOOT_TIMEOUT=12000;
  let booting=false;

  function delay(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))}
  function withTimeout(p,ms=BOOT_TIMEOUT){return Promise.race([p,delay(ms)])}

  window.forgotPassword=async function(){
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!email)return setAuth('Digite seu e-mail primeiro.');

    loading(true,'Enviando acesso...');
    const {error}=await sb.auth.signInWithOtp({
      email,
      options:{
        shouldCreateUser:false,
        emailRedirectTo:APP_URL
      }
    });
    loading(false);

    if(error){
      const m=String(error.message||'').toLowerCase();
      if(m.includes('rate')||m.includes('security purposes')){
        return setAuth('Aguarde alguns segundos e tente novamente.');
      }
      return setAuth('Não foi possível enviar o acesso agora. Tente novamente.');
    }
    setAuth('Enviamos um link de acesso. Abra o e-mail e toque em “Sign in”. Você entra direto, sem criar senha.');
    const btn=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes('ENTRAR POR E-MAIL'));
    if(btn){
      btn.disabled=true;
      let left=60;
      const original='PRIMEIRO ACESSO / ENTRAR POR E-MAIL';
      btn.textContent='REENVIAR EM '+left+'s';
      const timer=setInterval(()=>{
        left--;
        if(left<=0){clearInterval(timer);btn.disabled=false;btn.textContent=original}
        else btn.textContent='REENVIAR EM '+left+'s';
      },1000);
    }
  };

  window.startVidaApp=async function(){
    if(booting)return;
    booting=true;
    try{
      const {data}=await withTimeout(sb.auth.getSession(),8000);
      if(data?.session?.user){
        user=data.session.user;
        await withTimeout(route(),BOOT_TIMEOUT);
        return;
      }
      loading(false);
      document.querySelector('#login')?.classList.remove('hidden');
      document.querySelector('#root')?.classList.add('hidden');
    }catch(e){
      loading(false);
      document.querySelector('#login')?.classList.remove('hidden');
      document.querySelector('#root')?.classList.add('hidden');
      setAuth('A conexão demorou mais que o esperado. Tente entrar novamente.');
    }finally{
      booting=false;
    }
  };

  window.addEventListener('online',()=>{
    const msg=document.querySelector('#authMsg');
    if(msg?.textContent?.includes('conexão'))msg.textContent='';
  });

  window.__VIDA_LAUNCH_STABILITY='26.0.0';
})();