(()=>{
  window.stepWaterV6=function(delta){const el=$('#waterV6');if(!el)return;el.value=Math.max(0,Number(el.value||0)+delta);const out=$('#waterV6Label');if(out)out.textContent=el.value+' ml'};
  window.setWaterV6=function(v){const el=$('#waterV6');if(el){el.value=v;const out=$('#waterV6Label');if(out)out.textContent=v+' ml'}};
  window.waterExact=function(){
    const value=todayCheck().water_ml||0;
    modal(`<div class="article water-modal-v6"><span class="badge">HIDRATAÇÃO</span><h2>Água de hoje</h2><p class="lead">Ajuste em poucos toques. O valor é um registro da sua rotina, não uma meta clínica.</p><div class="water-counter-v6"><button type="button" onclick="stepWaterV6(-250)">−</button><div><b id="waterV6Label">${value} ml</b><input id="waterV6" type="hidden" value="${value}"></div><button type="button" onclick="stepWaterV6(250)">+</button></div><div class="water-presets-v6">${[500,1000,1500,2000,2500,3000].map(v=>`<button type="button" onclick="setWaterV6(${v})">${v>=1000?(v/1000)+' L':v+' ml'}</button>`).join('')}</div><button class="btn full" onclick="upCheck({water_ml:+$('#waterV6').value});closeModal(true)">SALVAR HIDRATAÇÃO</button></div>`);
  };
})();