(()=>{
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const rich=t=>String(t??'').split(/\n\n+/).map(p=>`<p>${safe(p).replace(/\n/g,'<br>')}</p>`).join('');

  window.openGuide=function(i){
    const g=window.VIDA_GUIDES[i];
    modal(`<div class="article guide-reader"><span class="badge">GUIA · SEMANA ${i}</span><h2>${safe(g.title)}</h2><p class="lead">${safe(g.subtitle)}</p>${g.sections.map(s=>`<h3>${safe(s[0])}</h3>${rich(s[1])}`).join('')}<div class="notice">Material educacional. Não substitui avaliação, diagnóstico ou prescrição individual.</div><button class="btn full top-gap" onclick="downloadGuide(${i})">BAIXAR COMO PDF</button></div>`);
  };

  window.downloadGuide=function(i){
    if(!window.jspdf){toast('Gerador de PDF carregando. Tente novamente.');return}
    const {jsPDF}=window.jspdf,g=window.VIDA_GUIDES[i],d=new jsPDF({unit:'mm',format:'a4'});
    const left=18,right=18,width=210-left-right,bottom=277;
    let y=20;
    const nextPage=()=>{d.addPage();y=20};
    const need=h=>{if(y+h>bottom)nextPage()};
    const paragraph=(text,size=10,gap=4)=>{
      d.setFont('helvetica','normal');d.setFontSize(size);
      const parts=String(text).split('\n');
      for(const part of parts){
        if(!part.trim()){y+=3;continue}
        const lines=d.splitTextToSize(part,width);need(lines.length*4.6+2);d.text(lines,left,y);y+=lines.length*4.6+1;
      }
      y+=gap;
    };
    d.setFont('helvetica','bold');d.setFontSize(9);d.text('VIDA · PROJETO 28',left,y);y+=9;
    d.setFontSize(22);d.text(g.title,left,y);y+=9;
    d.setFont('helvetica','normal');d.setFontSize(10);paragraph(g.subtitle,10,7);
    g.sections.forEach(s=>{
      need(18);d.setFont('helvetica','bold');d.setFontSize(13);const h=d.splitTextToSize(s[0],width);d.text(h,left,y);y+=h.length*5.2+3;paragraph(s[1],10,6);
    });
    need(24);d.setDrawColor(210);d.line(left,y,210-right,y);y+=7;paragraph('Conteúdo educacional. Não substitui diagnóstico, consulta, prescrição nutricional, prescrição de exercício ou tratamento individual.',8,0);
    const pages=d.getNumberOfPages();
    for(let p=1;p<=pages;p++){d.setPage(p);d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(120);d.text(`VIDA · Semana ${i}`,left,291);d.text(`${p}/${pages}`,192,291,{align:'right'});d.setTextColor(0)}
    d.save(`VIDA_Projeto28_Semana_${i}_${g.title.replace(/[^a-z0-9]+/gi,'_')}.pdf`);
  };

  const originalOpenMaterial=window.openMaterial;
  if(originalOpenMaterial){
    window.openMaterial=async function(i,j){
      await originalOpenMaterial(i,j);
      if(i===4&&j===3){
        const checks=[...document.querySelectorAll('#modalContent input[type="checkbox"][data-mi]')];
        checks.forEach(ch=>ch.addEventListener('change',()=>{
          const selected=checks.filter(x=>x.checked);
          if(selected.length>3){ch.checked=false;toast('Escolha no máximo 3 prioridades.');}
        }));
      }
    };
  }
})();
