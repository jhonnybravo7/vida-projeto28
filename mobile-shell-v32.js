(()=>{
  function closeVidaMenu(){
    document.querySelector('#vidaSideMenu')?.classList.remove('open');
    document.querySelector('#vidaMenuBackdrop')?.classList.remove('open');
    document.body.classList.remove('vida-menu-open');
    const b=document.querySelector('.nav [data-menu="more"]');
    if(b)b.classList.remove('active');
  }
  function openVidaMenu(){
    document.querySelector('#vidaSideMenu')?.classList.add('open');
    document.querySelector('#vidaMenuBackdrop')?.classList.add('open');
    document.body.classList.add('vida-menu-open');
    const b=document.querySelector('.nav [data-menu="more"]');
    if(b)b.classList.add('active');
  }
  window.openVidaMenu=openVidaMenu;
  window.closeVidaMenu=closeVidaMenu;
  window.vidaMenuGo=function(screen){
    closeVidaMenu();
    go(screen);
  };

  function installShell(){
    const top=document.querySelector('.top');
    if(top){
      const avatar=top.querySelector('.avatar');
      if(avatar)avatar.remove();
    }

    const nav=document.querySelector('.nav');
    if(nav){
      const gym=nav.querySelector('[data-go="gym"]');
      if(gym){
        gym.removeAttribute('data-go');
        gym.setAttribute('data-menu','more');
        gym.setAttribute('onclick','openVidaMenu()');
        gym.innerHTML='<span class="ico">☰</span>MENU';
      }
    }

    if(!document.querySelector('#vidaMenuBackdrop')){
      const back=document.createElement('div');
      back.id='vidaMenuBackdrop';
      back.className='vida-menu-backdrop';
      back.onclick=closeVidaMenu;
      document.body.appendChild(back);
    }

    if(!document.querySelector('#vidaSideMenu')){
      const aside=document.createElement('aside');
      aside.id='vidaSideMenu';
      aside.className='vida-side-menu';
      aside.setAttribute('aria-label','Menu');
      aside.innerHTML='<div class="vida-menu-head"><div><span class="badge">VIDA NOVA</span><h2>Menu</h2></div><button type="button" onclick="closeVidaMenu()" aria-label="Fechar">×</button></div><button class="vida-menu-item" type="button" onclick="vidaMenuGo(\'profile\')"><span>◎</span><div><b>Meu perfil</b><small>Acesso, segurança e preferências</small></div><i>›</i></button><button class="vida-menu-item" type="button" onclick="vidaMenuGo(\'gym\')"><span>🏆</span><div><b>Gym Rats</b><small>Próxima etapa do projeto</small></div><i>›</i></button><button class="vida-menu-item" type="button" onclick="closeVidaMenu();terms()"><span>▤</span><div><b>Termos de uso</b><small>Informações do Vida Nova</small></div><i>›</i></button><button class="vida-menu-item" type="button" onclick="closeVidaMenu();privacy()"><span>◌</span><div><b>Privacidade</b><small>Como seus dados são tratados</small></div><i>›</i></button><button class="vida-menu-item danger" type="button" onclick="closeVidaMenu();logout()"><span>↪</span><div><b>Sair</b><small>Encerrar sessão neste aparelho</small></div><i>›</i></button>';
      document.body.appendChild(aside);
    }
  }

  installShell();
  window.addEventListener('resize',()=>{if(innerWidth>700)closeVidaMenu()});
  window.__VIDA_MOBILE_SHELL='32.0.0';
})();