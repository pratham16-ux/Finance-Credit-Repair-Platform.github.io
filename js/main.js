(function(){
  var $=function(s,c){return (c||document).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // header + progress + parallax
  var hdr=$('.hdr'),bar=$('.progress'),bg=$('.hero-bg');
  function onScroll(){
    var y=window.scrollY,h=document.documentElement.scrollHeight-innerHeight;
    if(hdr)hdr.classList.toggle('stuck',y>40);
    if(bar)bar.style.width=(h>0?y/h*100:0)+'%';
    if(bg&&!reduce&&y<innerHeight*1.2)bg.style.transform='translate3d(0,'+(y*.18)+'px,0) scale(1.04)';
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  // login buttons: go straight to dashboard if already signed in
  $$('[data-login]').forEach(function(a){a.addEventListener('click',function(e){
    e.preventDefault();var r=null;
    try{r=sessionStorage.getItem('stk_session_v1')||localStorage.getItem('stk_session_v1');r=r?JSON.parse(r):null}catch(x){}
    location.href=r?(r.role==='admin'?'admin-dashboard.html':'client-dashboard.html'):'login.html';
  })});
  // drawer
  var dr=$('.drawer');
  $$('[data-open]').forEach(function(b){b.addEventListener('click',function(){dr.classList.add('open');document.body.style.overflow='hidden'})});
  $$('[data-close]').forEach(function(b){b.addEventListener('click',function(){dr.classList.remove('open');document.body.style.overflow=''})});
  // reveal
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.14,rootMargin:'0px 0px -40px 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
  // counters
  function count(el){
    var end=parseFloat(el.dataset.n),dec=(el.dataset.n.split('.')[1]||'').length,pre=el.dataset.pre||'',suf=el.dataset.suf||'',t0=null,dur=1900;
    if(reduce){el.textContent=pre+end.toLocaleString('en-IN')+suf;return}
    function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,4);el.textContent=pre+(end*e).toLocaleString('en-IN',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;if(p<1)requestAnimationFrame(f)}
    requestAnimationFrame(f);
  }
  var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){count(e.target);co.unobserve(e.target)}})},{threshold:.5});
  $$('[data-n]').forEach(function(el){co.observe(el)});
  // gauges
  var go=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');go.unobserve(e.target)}})},{threshold:.4});
  $$('.gauge').forEach(function(g){go.observe(g)});
  // tabs
  $$('[data-tabs]').forEach(function(box){
    var bs=$$('.tabs button',box),ps=$$('.panel',box);
    bs.forEach(function(b,i){b.addEventListener('click',function(){bs.forEach(function(x){x.classList.remove('on')});ps.forEach(function(x){x.classList.remove('on')});b.classList.add('on');ps[i].classList.add('on')})});
  });
  // billing toggle
  $$('[data-billing]').forEach(function(box){
    var bs=$$('.toggle button',box);
    bs.forEach(function(b){b.addEventListener('click',function(){
      bs.forEach(function(x){x.classList.remove('on')});b.classList.add('on');
      var yr=b.dataset.mode==='year';
      $$('[data-m]',box).forEach(function(el){var v=yr?el.dataset.y:el.dataset.m;el.firstChild.nodeValue='₹'+Number(v).toLocaleString('en-IN');var s=$('small',el);if(s)s.textContent=yr?' /month, billed yearly':' /month'});
    })});
  });
  // calculators
  $$('input[type=range]').forEach(function(r){
    function fill(){var p=(r.value-r.min)/(r.max-r.min)*100;r.style.setProperty('--fill',p+'%');var o=$('output',r.closest('.fld'));if(o){var pre=r.dataset.pre||'',suf=r.dataset.suf||'';o.textContent=pre+Number(r.value).toLocaleString('en-IN')+suf}calc()}
    r.addEventListener('input',fill);
  });
  function calc(){
    var c=$('#emi');if(!c)return;
    var P=+$('#amt').value,rate=+$('#rate').value/1200,n=+$('#ten').value*12;
    var emi=rate?P*rate*Math.pow(1+rate,n)/(Math.pow(1+rate,n)-1):P/n;
    $('#emiOut').textContent='₹'+Math.round(emi).toLocaleString('en-IN');
    $('#intOut').textContent='₹'+Math.round(emi*n-P).toLocaleString('en-IN');
    $('#totOut').textContent='₹'+Math.round(emi*n).toLocaleString('en-IN');
  }
  $$('input[type=range]').forEach(function(r){r.dispatchEvent(new Event('input'))});
  // forms
  $$('form[data-form]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var ok=$('.ok',f);if(ok){ok.style.display='block';ok.scrollIntoView({block:'nearest',behavior:'smooth'})}f.reset()})});
  // tilt on hero cards (pointer devices only)
  if(matchMedia('(hover:hover)').matches&&!reduce){
    $$('.tilt').forEach(function(el){
      el.addEventListener('mousemove',function(e){var b=el.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;el.style.transform='perspective(900px) rotateY('+x*8+'deg) rotateX('+-y*8+'deg) translateY(-6px)'});
      el.addEventListener('mouseleave',function(){el.style.transform=''});
    });
  }
})();