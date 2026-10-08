(()=>{
const sb=supabase.createClient('https://hvzlegeufiigjyanfyuu.supabase.co','sb_publishable_hFLv8Q_9RCtHviptHWtEZw_FB7TXRqh');
const token=location.hash.slice(1),form=document.getElementById('activate'),button=document.getElementById('submit'),message=document.getElementById('message'),password=document.getElementById('password');
history.replaceState(null,'',location.pathname);
document.getElementById('show').addEventListener('change',e=>{password.type=e.target.checked?'text':'password'});
if(!/^[a-f0-9]{64}$/.test(token)){button.disabled=true;message.textContent='Abra o link individual de acesso que você recebeu. Se precisar, peça um novo link ao suporte.';}
form.addEventListener('submit',async e=>{
 e.preventDefault();button.disabled=true;message.textContent='Preparando seu acesso…';
 const email=document.getElementById('email').value.trim().toLowerCase();
 try{
  const response=await fetch('https://hvzlegeufiigjyanfyuu.supabase.co/functions/v1/first-access-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'redeem',token,email,password:password.value})});
  const data=await response.json();
  if(!response.ok||!data.ok){
   const messages={invalid_link:'Confira o e-mail da compra. Se estiver correto, este link expirou ou já foi usado. Peça um novo link ao suporte.',password_requirements:'Escolha uma senha com pelo menos 6 caracteres.',password_rejected:'Escolha uma senha um pouco mais forte e tente novamente.',activation_failed:'Não foi possível finalizar. Peça um novo link ao suporte.'};
   message.textContent=messages[data.error]||'Não foi possível concluir agora. Tente novamente.';button.disabled=false;return;
  }
  password.value='';
  if(data.login_required){message.textContent='Senha criada! Toque em “Já tenho senha · entrar” para acessar.';return;}
  const {error}=await sb.auth.setSession(data.session);
  if(error){message.textContent='Senha criada! Toque em “Já tenho senha · entrar” para acessar.';return;}
  message.textContent='Tudo pronto. Entrando…';location.replace('/');
 }catch{message.textContent='A conexão falhou. Se a senha já foi salva, entre pela opção abaixo; caso contrário, tente novamente.';button.disabled=false;}
});
})();