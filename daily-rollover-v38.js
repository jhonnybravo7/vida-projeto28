/* Daily records use Brasilia dates. A new day never deletes yesterday. */
(()=>{
  let renderedDate=iso(), screen='home', timer;
  const ready=()=>user&&base()&&(master()||S.onboarding?.completed_at)&&!document.querySelector('#root')?.classList.contains('hidden');
  const oldGo=window.go;
  window.go=function(name){screen=name;renderedDate=iso();return oldGo(name)};
  const oldModal=window.modal;
  window.modal=function(html){const result=oldModal(html);document.querySelector('#modal').dataset.recordDate=iso();return result};
  function refreshDay(){
    if(!ready()||iso()===renderedDate)return false;
    renderedDate=iso();
    window.closeModal(true);
    window.go(screen);
    toast('Novo dia iniciado. Seus registros anteriores continuam salvos.');
    const uid=user.id;
    Promise.resolve(hydrate()).then(()=>{
      if(user?.id===uid&&ready()&&['home','track','progress'].includes(screen))window.go(screen);
    }).catch(()=>{});
    return true;
  }
  const oldCheck=window.upCheck;
  window.upCheck=async function(values){
    const modal=document.querySelector('#modal');
    const staleModal=modal?.classList.contains('open')&&modal.dataset.recordDate!==iso();
    if(refreshDay()||staleModal){
      window.closeModal(true);
      toast('O dia mudou. Registre os dados de hoje novamente.');
      return;
    }
    return oldCheck(values);
  };
  function schedule(){
    clearTimeout(timer);
    // Brasilia has UTC-03:00; recheck on every resume as mobile timers can pause.
    const next=new Date(iso()+'T00:00:00-03:00').getTime()+86400000;
    timer=setTimeout(()=>{refreshDay();schedule()},Math.max(100,next-Date.now()+50));
  }
  function resume(){refreshDay();schedule()}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resume()});
  window.addEventListener('focus',resume);
  window.addEventListener('pageshow',resume);
  // A suspended page must not write values from an old form into the new day.
  document.addEventListener('click',event=>{
    if(refreshDay()){event.preventDefault();event.stopImmediatePropagation()}
  },true);
  schedule();
  window.__VIDA_DAY_TIMEZONE='America/Sao_Paulo';
})();
