/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 1 — WELCOME SCREEN CONTROLLER
   Handles: cinematic intro animation, star canvas, boot log
   text, progress bar fill, door panel open/close sequence,
   and dispatches 'portfolioReady' event when done.
════════════════════════════════════════════════════════════════ */
(function () {
  const ws       = document.getElementById('welcome-screen');
  const canvas   = document.getElementById('ws-canvas');
  const barFill  = document.getElementById('ws-bar-fill');
  const pctEl    = document.getElementById('ws-pct');
  const statusEl = document.getElementById('ws-status');
  const barTop   = document.querySelector('.ws-bar-top');
  const barBot   = document.querySelector('.ws-bar-bottom');
  const bootLog  = document.getElementById('ws-boot-log');
  const glitch   = document.getElementById('ws-glitch');
  const doorL    = document.getElementById('ws-door-left');
  const doorR    = document.getElementById('ws-door-right');
  const doorFlash= document.getElementById('ws-door-flash');

  const ctx = canvas.getContext('2d');
  let W, H, stars = [], rafId;

  function resizeCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  function mkStars() {
    stars = [];
    const N = Math.min(Math.floor(W * H / 2200), 320);
    for (let i = 0; i < N; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        spd: Math.random() * 0.35 + 0.05,
        o: Math.random() * 0.7 + 0.15,
        c: Math.random() < 0.15 ? (Math.random() < 0.5 ? '#f0a500' : '#7c3aff') : '#ffffff'
      });
    }
  }
  function drawStars() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.c; ctx.globalAlpha = s.o; ctx.fill();
      s.y -= s.spd;
      if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
    });
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(drawStars);
  }
  resizeCanvas(); mkStars(); drawStars();
  window.addEventListener('resize', () => { resizeCanvas(); mkStars(); });

  const BOOT_LINES = [
    { t: 'CORE SYSTEM BOOT v2.5.0', cls: 'ok',   delay: 250  },
    { t: 'LOADING ML MODULES',      cls: 'ok',   delay: 500  },
    { t: 'INITIALIZING DATA GRID',  cls: 'ok',   delay: 750  },
    { t: 'ESTABLISHING UPLINK',     cls: 'warn', delay: 1000 },
    { t: 'SECURE CHANNEL READY',    cls: 'ok',   delay: 1200 },
  ];
  BOOT_LINES.forEach(line => {
    setTimeout(() => {
      const span = document.createElement('span');
      span.className = 'ws-boot-line ' + line.cls;
      span.textContent = '> ' + line.t;
      bootLog.appendChild(span);
    }, line.delay);
  });

  const STATUS_MSGS = [
    'LOADING DATA MODULES...','PARSING ML WEIGHTS...',
    'CALIBRATING SYSTEMS...','COMPILING PORTFOLIO...',
    'ESTABLISHING UPLINK...','ACCESS GRANTED.',
  ];
  let pct = 0, msgIdx = 0, progressTimer;

  function exitWelcome() {
    try {
      cancelAnimationFrame(rafId);
      glitch.style.background = 'rgba(255,255,255,0.1)';
      glitch.style.opacity = '1';
      setTimeout(() => { glitch.style.opacity = '0'; }, 80);
      setTimeout(() => {
        doorFlash.classList.add('burst');
        setTimeout(() => {
          doorFlash.classList.remove('burst');
          doorFlash.style.display = 'none';
        }, 700);
      }, 80);
      setTimeout(() => {
        ws.classList.add('ws-door-exit');
        doorL.classList.add('open');
        doorR.classList.add('open');
        setTimeout(() => {
          ws.style.display            = 'none';
          doorL.style.display         = 'none';
          doorR.style.display         = 'none';
          document.body.style.overflow = '';
          document.dispatchEvent(new Event('portfolioReady'));
        }, 1000);
      }, 120);
    } catch (err) {
      ws.style.display             = 'none';
      doorL.style.display          = 'none';
      doorR.style.display          = 'none';
      document.body.style.overflow = '';
      document.dispatchEvent(new Event('portfolioReady'));
    }
  }

  setTimeout(() => {
    setTimeout(() => {
      barTop.classList.add('retract-top');
      barBot.classList.add('retract-bottom');
    }, 650);

    progressTimer = setInterval(() => {
      const step = pct < 40 ? 3.2 : pct < 70 ? 2.0 : pct < 88 ? 1.2 : pct < 96 ? 0.6 : 0.3;
      pct = Math.min(100, pct + step);
      barFill.style.width = pct + '%';
      pctEl.textContent = Math.floor(pct) + '%';

      const newIdx = Math.min(STATUS_MSGS.length - 1, Math.floor(pct / 18));
      if (newIdx !== msgIdx) {
        msgIdx = newIdx;
        statusEl.style.opacity = '0';
        setTimeout(() => { statusEl.textContent = STATUS_MSGS[msgIdx]; statusEl.style.opacity = '1'; }, 180);
      }
      if (Math.random() < 0.012) {
        glitch.style.opacity = '1';
        setTimeout(() => { glitch.style.opacity = '0'; }, 60 + Math.random() * 80);
      }
      if (pct >= 100) {
        clearInterval(progressTimer);
        statusEl.textContent = 'ACCESS GRANTED. WELCOME.';
        statusEl.style.color = 'rgba(0,255,200,0.9)';
        setTimeout(exitWelcome, 600);
      }
    }, 42);
  }, 1800);

  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    if (!ws.classList.contains('ws-door-exit')) exitWelcome();
  }, 7000);
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 2 — JARVIS PHOTO CANVAS ANIMATION
   Handles: floating particle network, arc ring rotations,
   scan-line reveal effect for the hero photo, and HUD labels.
════════════════════════════════════════════════════════════════ */
(function () {
  const cvs = document.getElementById('jarvis-cvs');
  if (!cvs) return;

  function resizeCvs() {
    const wrap = document.getElementById('jarvis-wrap');
    if (!wrap) return;
    requestAnimationFrame(() => {
      const r = wrap.getBoundingClientRect();
      cvs.width  = r.width  + 70;
      cvs.height = r.height + 70;
    });
  }
  window.addEventListener('resize', resizeCvs);

  const ctx = cvs.getContext('2d');
  let W, H, CX, CY;
  function getDims() { W = cvs.width; H = cvs.height; CX = W/2; CY = H/2; }
  window.addEventListener('resize', () => { resizeCvs(); getDims(); });

  let phase = 0, frameN = 0, rafId = null;
  let nodes = [], edges = [], particles = [];
  let a1 = 0, a2 = Math.PI / 3;
  let scanY = 0, scanActive = false;
  let arcPulse = 0;

  const GOLD = '240,165,0', VIOLET = '124,58,255', MINT = '0,255,200';

  function makeNodes() {
    nodes = [];
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 22 + Math.random() * (CX * 0.65);
      nodes.push({
        x: CX + Math.cos(angle)*r, y: CY + Math.sin(angle)*r,
        alpha: 0, size: 1.5 + Math.random()*2.5, delay: Math.floor(i*3.5),
        pulse: Math.random()*Math.PI*2,
        color: Math.random()<0.4 ? VIOLET : Math.random()<0.5 ? GOLD : MINT
      });
    }
    edges = [];
    nodes.forEach((n,i) => {
      nodes.forEach((m,j) => {
        if (j<=i) return;
        if (Math.hypot(n.x-m.x, n.y-m.y) < 80) edges.push({a:i,b:j});
      });
    });
  }

  function draw() {
    getDims();
    ctx.clearRect(0, 0, W, H);
    frameN++; arcPulse += 0.05;

    if (phase === 0) {
      nodes.forEach(n => {
        if (frameN > n.delay) n.alpha = Math.min(1, n.alpha + 0.04);
        n.pulse += 0.08;
        const g = 0.5 + Math.sin(n.pulse)*0.5;
        ctx.beginPath(); ctx.arc(n.x,n.y,n.size,0,Math.PI*2);
        ctx.fillStyle = `rgba(${n.color},${n.alpha*g})`; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,n.size*2.8,0,Math.PI*2);
        ctx.fillStyle = `rgba(${n.color},${n.alpha*0.1})`; ctx.fill();
      });
      edges.forEach(e => {
        const a=nodes[e.a],b=nodes[e.b]; const al=Math.min(a.alpha,b.alpha);
        if (al<0.1) return;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(${VIOLET},${al*0.2})`; ctx.lineWidth=0.6; ctx.stroke();
      });
      if (nodes.every(n=>n.alpha>0.88)) { phase=1; frameN=0; }
    }

    if (phase>=1 && phase<3) {
      nodes.forEach(n => {
        n.pulse += 0.06;
        if (phase===1) { const s=Math.max(0,1-frameN/50); n.alpha=s; }
        if (n.alpha<0.02) return;
        const g = 0.4+Math.sin(n.pulse)*0.4;
        ctx.beginPath(); ctx.arc(n.x,n.y,n.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(${n.color},${n.alpha*g})`; ctx.fill();
        if (phase===1) {
          const px=n.x+(CX-n.x)*(frameN/50), py=n.y+(CY-n.y)*(frameN/50);
          ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(px,py);
          ctx.strokeStyle=`rgba(${GOLD},${n.alpha*0.5})`; ctx.lineWidth=0.8; ctx.stroke();
        }
      });
      if (frameN>50 && phase===1) {
        phase=2; frameN=0; scanY=0; scanActive=true;
        const ph=document.getElementById('jarvis-photo');
        ph.style.transition='opacity 0.5s ease'; ph.style.opacity='1';
        document.getElementById('jscanov').style.opacity='1';
        document.getElementById('jscan').style.opacity='1';
      }
    }

    if (phase>=2) {
      a1+=0.008; a2-=0.005;
      const ar1=document.getElementById('jar1'), ar2=document.getElementById('jar2');
      if (ar1) {
        ar1.style.transform=`rotate(${a1}rad)`;
        ar1.style.boxShadow=`0 0 ${6+Math.sin(arcPulse)*3}px rgba(${GOLD},0.3)`;
        ar1.style.borderColor=`rgba(${GOLD},${0.4+Math.sin(arcPulse)*0.2})`;
        ar1.style.borderTopColor='rgba(240,165,0,0)'; ar1.style.borderBottomColor='rgba(240,165,0,0)';
      }
      if (ar2) {
        ar2.style.transform=`rotate(${a2}rad)`;
        ar2.style.borderColor=`rgba(${VIOLET},${0.35+Math.sin(arcPulse+1)*0.15})`;
        ar2.style.borderLeftColor='rgba(124,58,255,0)'; ar2.style.borderRightColor='rgba(124,58,255,0)';
      }
      if (scanActive) {
        const wrap=document.getElementById('jarvis-wrap');
        const photoH=wrap?wrap.offsetHeight:200;
        scanY+=0.9;
        const sb=document.getElementById('jscan');
        if (sb) sb.style.top=scanY+'px';
        if (scanY>photoH) {
          scanActive=false;
          if (sb) sb.style.opacity='0';
          document.getElementById('jscanov').style.opacity='0';
          if (phase===2) { phase=3; frameN=0; showHUD(); }
        }
      }
      const glowR=10+Math.sin(arcPulse*1.4)*3;
      const grd=ctx.createRadialGradient(CX,CY,0,CX,CY,glowR);
      grd.addColorStop(0,`rgba(${GOLD},${0.45+Math.sin(arcPulse)*0.25})`);
      grd.addColorStop(0.5,`rgba(${GOLD},0.1)`); grd.addColorStop(1,'rgba(240,165,0,0)');
      ctx.beginPath(); ctx.arc(CX,CY,glowR,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
    }

    if (phase===3) {
      if (Math.random()<0.1) {
        const angle=Math.random()*Math.PI*2, r=CX*0.68;
        particles.push({
          x:CX+Math.cos(angle)*r, y:CY+Math.sin(angle)*r,
          vx:(CX-(CX+Math.cos(angle)*r))*0.016, vy:(CY-(CY+Math.sin(angle)*r))*0.016,
          alpha:0.9, life:45, color:Math.random()<0.5?GOLD:VIOLET
        });
      }
      particles=particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.life--; p.alpha=p.life/45;
        ctx.beginPath(); ctx.arc(p.x,p.y,1.3,0,Math.PI*2);
        ctx.fillStyle=`rgba(${p.color},${p.alpha*0.75})`; ctx.fill();
      });
      const glowR=8+Math.sin(arcPulse*1.4)*3;
      const grd=ctx.createRadialGradient(CX,CY,0,CX,CY,glowR);
      grd.addColorStop(0,`rgba(${GOLD},${0.4+Math.sin(arcPulse)*0.2})`);
      grd.addColorStop(1,'rgba(240,165,0,0)');
      ctx.beginPath(); ctx.arc(CX,CY,glowR,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
      const ar1=document.getElementById('jar1'), ar2=document.getElementById('jar2');
      if (ar1) {
        a1+=0.008; ar1.style.transform=`rotate(${a1}rad)`;
        ar1.style.boxShadow=`0 0 ${6+Math.sin(arcPulse)*3}px rgba(${GOLD},0.3)`;
        ar1.style.borderColor=`rgba(${GOLD},${0.35+Math.sin(arcPulse)*0.15})`;
        ar1.style.borderTopColor='rgba(240,165,0,0)'; ar1.style.borderBottomColor='rgba(240,165,0,0)';
      }
      if (ar2) {
        a2-=0.005; ar2.style.transform=`rotate(${a2}rad)`;
        ar2.style.borderColor=`rgba(${VIOLET},${0.3+Math.sin(arcPulse+1)*0.12})`;
        ar2.style.borderLeftColor='rgba(124,58,255,0)'; ar2.style.borderRightColor='rgba(124,58,255,0)';
      }
    }
    rafId=requestAnimationFrame(draw);
  }

  function showHUD() {
    ['jh1','jh2','jh3','jh4'].forEach((id,i)=>{
      setTimeout(()=>{ const el=document.getElementById(id); if(el) el.style.opacity='1'; },i*180);
    });
    const ph=document.getElementById('jarvis-photo');
    if (!ph) return;
    ph.addEventListener('mouseenter',()=>{
      ph.style.transition='all 0.3s ease';
      ph.style.filter='brightness(1.3) hue-rotate(15deg) saturate(1.4)';
      ph.style.transform='scale(1.04)';
      ph.style.borderColor='rgba(0,255,200,1)';
      ph.style.boxShadow='0 0 60px rgba(0,255,200,0.7), 0 0 120px rgba(124,58,255,0.5)';
    });
    ph.addEventListener('mouseleave',()=>{
      ph.style.filter=''; ph.style.transform='scale(1)';
      ph.style.borderColor='rgba(240,165,0,0.9)';
    });
  }

  document.addEventListener('portfolioReady', function () {
    resizeCvs();
    requestAnimationFrame(()=>{ getDims(); makeNodes(); draw(); });
  });
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 3 — NAVIGATION: ACTIVE LINK TRACKING + SHIMMER
   Handles: mouse shimmer effect on desktop nav, ripple/trace
   click animations on nav links, and IntersectionObserver-based
   active state updating as user scrolls through sections.
════════════════════════════════════════════════════════════════ */
(function () {
  const desktopMenu = document.getElementById('desktop-menu');
  const navShimmer  = document.getElementById('nav-shimmer');
  const navLinks    = desktopMenu ? desktopMenu.querySelectorAll('li a') : [];

  if (desktopMenu && navShimmer) {
    desktopMenu.addEventListener('mousemove', e => {
      const rect = desktopMenu.getBoundingClientRect();
      navShimmer.style.transform = `translate3d(${e.clientX-rect.left}px,${e.clientY-rect.top}px,0) translate(-50%,-50%)`;
    });
  }
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const ripple = document.createElement('span'); ripple.className='nav-ripple';
      const rect = this.getBoundingClientRect();
      ripple.style.left=(e.clientX-rect.left)+'px'; ripple.style.top=(e.clientY-rect.top)+'px';
      this.appendChild(ripple);
      const trace = document.createElement('span'); trace.className='nav-trace';
      const accentMap={'nav-home':'#c4b5fd','nav-about':'#fde68a','nav-skills':'#6ee7b7','nav-projects':'#fca5a5','nav-contact':'#c4b5fd'};
      const cls=[...this.classList].find(c=>accentMap[c]);
      trace.style.color=cls?accentMap[cls]:'#f0a500';
      this.appendChild(trace);
      ripple.addEventListener('animationend',()=>ripple.remove());
      trace.addEventListener('animationend',()=>trace.remove());
    });
  });

  const sections = document.querySelectorAll('section[id]');
  const allNavLinks = document.querySelectorAll('#desktop-menu a');
  sections.forEach(s => {
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          allNavLinks.forEach(l=>l.classList.remove('active'));
          const a=document.querySelector(`#desktop-menu a[href="#${e.target.id}"]`);
          if (a) {
            a.classList.add('active');
            a.style.transition='none'; a.style.filter='brightness(1.8) saturate(2)';
            requestAnimationFrame(()=>requestAnimationFrame(()=>{a.style.transition='';a.style.filter='';}));
          }
        }
      });
    },{threshold:0.4}).observe(s);
  });
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 4 — MOBILE MENU PANEL
   Handles: hamburger toggle open/close, overlay click to close,
   auto-close when a nav link inside the panel is tapped.
════════════════════════════════════════════════════════════════ */
(function () {
  const toggleBtn=document.getElementById('toggleMenu');
  const closeBtn=document.getElementById('closeMenuBtn');
  const mobilePanel=document.getElementById('mobile-panel');
  const overlay=document.getElementById('overlay');
  function openMenu(){ mobilePanel.classList.add('open'); overlay.classList.add('show'); toggleBtn.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeMenu(){ mobilePanel.classList.remove('open'); overlay.classList.remove('show'); toggleBtn.classList.remove('open'); document.body.style.overflow=''; }
  toggleBtn.addEventListener('click',()=>mobilePanel.classList.contains('open')?closeMenu():openMenu());
  closeBtn.addEventListener('click',closeMenu);
  overlay.addEventListener('click',closeMenu);
  mobilePanel.querySelectorAll('.mp-links a').forEach(a=>a.addEventListener('click',closeMenu));
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 5 — HERO TYPEWRITER EFFECT
   Handles: cycling through an array of phrases with character-
   by-character typing and deletion at timed intervals.
════════════════════════════════════════════════════════════════ */
(function () {
  const phrases=['Data Scientist in the Making...','ML Enthusiast & Problem Solver','Turning Raw Data into Insights','Code. Analyze. Predict. Repeat.'];
  let pi=0,ci=0,del=false;
  const typedEl=document.getElementById('typed-text');
  function type() {
    const p=phrases[pi];
    if (!del&&ci<p.length){typedEl.textContent+=p[ci++];setTimeout(type,68);}
    else if (del&&ci>0){typedEl.textContent=p.substring(0,--ci);setTimeout(type,36);}
    else if (!del){setTimeout(()=>{del=true;type();},2200);}
    else{del=false;pi=(pi+1)%phrases.length;setTimeout(type,500);}
  }
  type();
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 6 — ABOUT SECTION TABS + SKILL BAR ANIMATION
   Handles: tab switching (Education / Experience / Proficiency),
   animated skill bar fill-up on tab activation or scroll-into-view.
════════════════════════════════════════════════════════════════ */
(function () {
  function animateBars(){ document.querySelectorAll('.skill-fill').forEach(bar=>{bar.style.width=bar.dataset.w+'%';}); }
  document.querySelectorAll('.tab-trigger').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab=btn.dataset.tab;
      document.querySelectorAll('.tab-trigger').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active'); document.getElementById('tab-'+tab).classList.add('active');
      if (tab==='proficiency') animateBars();
    });
  });
  const profPanel=document.getElementById('tab-proficiency');
  if (profPanel) { new IntersectionObserver(entries=>{if(entries[0].isIntersecting)animateBars();},{threshold:0.3}).observe(profPanel); }
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 7 — HOME SECTION FLOATING PARTICLES
   Handles: dynamically creating 22 floating particle elements
   inside the home section hero background for ambient effect.
════════════════════════════════════════════════════════════════ */
(function () {
  const pw=document.getElementById('particles-wrap');
  const colors=['#7c3aff','#f0a500','#00ffc8','#a855f7','#ffcc44'];
  for (let i=0;i<22;i++){
    const p=document.createElement('div'); p.className='particle';
    const size=Math.random()*4+2;
    p.style.cssText=`width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*12+8}s;animation-delay:${Math.random()*10}s;`;
    pw.appendChild(p);
  }
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 8 — SCROLL REVEAL OBSERVER
   Handles: IntersectionObserver that toggles 'visible' class on
   elements with .scroll-reveal as they enter the viewport,
   triggering their CSS entrance animations.
════════════════════════════════════════════════════════════════ */
window.revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const el = entry.target;
    if (entry.isIntersecting) { el.classList.remove('visible'); void el.offsetWidth; el.classList.add('visible'); }
    else { el.classList.remove('visible'); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.scroll-reveal').forEach(el => window.revealObserver.observe(el));


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 9 — PROJECT CARDS: SEE MORE / SEE LESS + 3D TILT
   Handles: animated reveal/collapse of hidden project cards
   with clip-path keyframe animations and scan effects;
   also binds mouse-move 3D tilt effect to non-mobile cards.
════════════════════════════════════════════════════════════════ */
(function () {
  const TILT_MAX=8, TILT_SCALE=1.02;
  const isMobile=()=>window.matchMedia('(max-width: 768px)').matches;

  function bindTilt(card) {
    if (card._tiltBound||isMobile()) return; card._tiltBound=true;
    let raf=null,targetX=0,targetY=0,currentX=0,currentY=0,isHovered=false;
    function lerpLoop(){
      if (!isHovered) return;
      currentX+=(targetX-currentX)*0.12; currentY+=(targetY-currentY)*0.12;
      card.style.transform=`perspective(900px) rotateX(${currentX}deg) rotateY(${currentY}deg) scale(${TILT_SCALE})`;
      raf=requestAnimationFrame(lerpLoop);
    }
    card.addEventListener('mouseenter',()=>{isHovered=true;card.style.transition='box-shadow 0.35s ease,border-color 0.35s ease';lerpLoop();});
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const dx=(e.clientX-r.left-r.width/2)/(r.width/2), dy=(e.clientY-r.top-r.height/2)/(r.height/2);
      targetY=dx*TILT_MAX; targetX=-dy*TILT_MAX;
    });
    card.addEventListener('mouseleave',()=>{
      isHovered=false; cancelAnimationFrame(raf);
      card.style.transition='transform 0.6s cubic-bezier(0.23,1,0.32,1),box-shadow 0.35s ease,border-color 0.35s ease';
      card.style.transform='perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
      currentX=0;currentY=0;targetX=0;targetY=0;
    });
    card.addEventListener('touchstart',()=>{},{passive:true});
  }
  document.querySelectorAll('[data-tilt]:not(.proj-card-hidden)').forEach(bindTilt);
  let resizeTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      if (!isMobile()) document.querySelectorAll('[data-tilt]').forEach(card=>{card._tiltBound=false;bindTilt(card);});
    },250);
  });

  const btn=document.getElementById('btnSeeMore');
  const seeMoreTxt=document.getElementById('seeMoreText');
  const seeMoreIcon=document.getElementById('seeMoreIcon');
  const seeMoreCount=document.getElementById('seeMoreCount');
  const badge=document.getElementById('proj-count-badge');
  const hiddenCards=Array.from(document.querySelectorAll('.proj-card-hidden'));
  let expanded=false, isAnimating=false;

  (function injectStyles(){
    if (document.getElementById('see-more-styles')) return;
    const style=document.createElement('style'); style.id='see-more-styles';
    style.textContent=`
      .proj-card-hidden{display:none;opacity:0;clip-path:inset(0 0 100% 0);filter:brightness(0.4) saturate(0);}
      .proj-card-reveal-scan{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,rgba(240,165,0,0.9),rgba(0,255,200,0.7),transparent);pointer-events:none;z-index:20;top:0;opacity:0;}
      .proj-card-glitch-layer{position:absolute;inset:0;pointer-events:none;z-index:19;opacity:0;background:linear-gradient(180deg,transparent 0%,rgba(124,58,255,0.06) 48%,rgba(240,165,0,0.10) 50%,rgba(0,255,200,0.06) 52%,transparent 100%);}
      @keyframes cardScanDown{0%{top:-3px;opacity:1}100%{top:102%;opacity:0.4}}
      @keyframes cardScanUp{0%{bottom:-3px;top:auto;opacity:1}100%{bottom:102%;top:auto;opacity:0.4}}
      @keyframes cardGlitchFlash{0%,100%{opacity:0}15%{opacity:1}30%{opacity:0}50%{opacity:0.6}70%{opacity:0}}
      @keyframes cardClipReveal{0%{clip-path:inset(0 0 100% 0);filter:brightness(0.3) saturate(0);opacity:0.5}40%{clip-path:inset(0 0 60% 0);filter:brightness(0.6) saturate(0.3);opacity:0.8}80%{clip-path:inset(0 0 5% 0);filter:brightness(1) saturate(0.8);opacity:1}100%{clip-path:inset(0 0 0% 0);filter:brightness(1) saturate(1);opacity:1}}
      @keyframes cardClipCollapse{0%{clip-path:inset(0 0 0% 0);filter:brightness(1) saturate(1);opacity:1}30%{clip-path:inset(0 0 10% 0);filter:brightness(0.9) saturate(0.6);opacity:0.9}70%{clip-path:inset(0 0 65% 0);filter:brightness(0.5) saturate(0.2);opacity:0.6}100%{clip-path:inset(0 0 100% 0);filter:brightness(0.3) saturate(0);opacity:0}}
      .see-more-inner.loading{border-color:rgba(240,165,0,0.9)!important;box-shadow:0 0 28px rgba(240,165,0,0.45),0 0 60px rgba(124,58,255,0.2)!important;}
    `;
    document.head.appendChild(style);
  })();

  hiddenCards.forEach(card=>{
    if (!card.querySelector('.proj-card-reveal-scan')) {
      const scan=document.createElement('div'); scan.className='proj-card-reveal-scan';
      const glitch=document.createElement('div'); glitch.className='proj-card-glitch-layer';
      card.style.position='relative'; card.appendChild(scan); card.appendChild(glitch);
    }
  });

  function setBtn(exp){
    btn.classList.toggle('expanded',exp);
    seeMoreIcon.className=`fas fa-chevron-${exp?'up':'down'} see-more-icon`;
    seeMoreTxt.textContent=exp?'SEE LESS':'SEE MORE PROJECTS';
    seeMoreCount.textContent=exp?'−3':'+3';
    badge.textContent=exp?'// 06 OF 06 BUILDS SHOWN':'// 03 OF 06 BUILDS SHOWN';
  }

  function showCards(){
    const scrollY=window.scrollY;
    hiddenCards.forEach(card=>{
      card.style.display='block'; card.style.visibility='hidden';
      card.style.animation='none'; card.style.clipPath='inset(0 0 100% 0)';
      card.style.opacity='0'; card.style.filter='brightness(0.3) saturate(0)';
    });
    requestAnimationFrame(()=>{
      window.scrollTo({top:scrollY,behavior:'instant'});
      hiddenCards.forEach((card,i)=>{
        card.style.visibility=''; bindTilt(card);
        if (window.revealObserver) window.revealObserver.observe(card);
        setTimeout(()=>{
          const glitch=card.querySelector('.proj-card-glitch-layer');
          if (glitch){glitch.style.animation='cardGlitchFlash 0.35s ease forwards';setTimeout(()=>{glitch.style.animation='none';},400);}
          card.style.animation='cardClipReveal 0.75s cubic-bezier(0.16,1,0.3,1) forwards';
          const scan=card.querySelector('.proj-card-reveal-scan');
          if (scan){scan.style.top='-3px';scan.style.bottom='auto';scan.style.animation='cardScanDown 0.75s cubic-bezier(0.16,1,0.3,1) forwards';}
        },i*160);
      });
      const total=hiddenCards.length*160+750;
      setTimeout(()=>{
        hiddenCards.forEach(card=>{
          card.style.animation='none'; card.style.clipPath='inset(0 0 0% 0)';
          card.style.filter='brightness(1) saturate(1)'; card.style.opacity='1';
          card.classList.add('proj-card-visible'); card.classList.remove('visible');
          void card.offsetWidth; card.classList.add('visible');
        });
        isAnimating=false;
      },total);
    });
  }

  function hideCards(){
    const total=hiddenCards.length*100+650;
    hiddenCards.forEach((card,i)=>{
      setTimeout(()=>{
        const glitch=card.querySelector('.proj-card-glitch-layer');
        if (glitch){glitch.style.animation='cardGlitchFlash 0.25s ease forwards';setTimeout(()=>{glitch.style.animation='none';},300);}
        const scan=card.querySelector('.proj-card-reveal-scan');
        if (scan){scan.style.top='auto';scan.style.bottom='-3px';scan.style.animation='cardScanUp 0.6s cubic-bezier(0.77,0,0.18,1) forwards';}
        card.style.animation='cardClipCollapse 0.6s cubic-bezier(0.77,0,0.18,1) forwards';
        card.classList.remove('proj-card-visible','visible');
      },i*100);
    });
    setTimeout(()=>{
      hiddenCards.forEach(card=>{
        card.style.display='none'; card.style.animation='none';
        card.style.clipPath='inset(0 0 100% 0)'; card.style.opacity='0';
        const scan=card.querySelector('.proj-card-reveal-scan');
        if (scan) scan.style.animation='none';
      });
      const projectsEl=document.getElementById('projects');
      if (projectsEl){ const top=projectsEl.getBoundingClientRect().top+window.scrollY-20; window.scrollTo({top,behavior:'smooth'}); }
      isAnimating=false;
    },total);
  }

  btn.addEventListener('click',()=>{
    if (isAnimating) return; isAnimating=true; expanded=!expanded; setBtn(expanded);
    const inner=btn.querySelector('.see-more-inner');
    if (inner){inner.classList.add('loading');setTimeout(()=>inner.classList.remove('loading'),500);}
    if (expanded) showCards(); else hideCards();
  });
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 10 — CONTACT FORM SUBMISSION
   Handles: form submit event, POST to Formspree + backend API
   simultaneously, loading state on button, and success/error
   message display with auto-hide after 5 seconds.
════════════════════════════════════════════════════════════════ */
(function () {
  const form=document.getElementById('contactForm');
  const btn=document.getElementById('submitBtn');
  const btnText=document.getElementById('btn-text');
  const msg=document.getElementById('form-msg');

  form.addEventListener('submit',e=>{
    e.preventDefault();
    btn.style.opacity='0.7'; btn.style.pointerEvents='none'; btnText.textContent='TRANSMITTING...';
    const payload={
      name:form.elements['user_name'].value.trim(),
      email:form.elements['user_email'].value.trim(),
      subject:form.elements['subject'].value.trim()||'Portfolio Contact',
      message:form.elements['message'].value.trim()
    };
    const formspreeFetch=fetch('https://formspree.io/f/xkoejwro',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
    const renderFetch=fetch('https://ahmednihatportfoliobackend.onrender.com/api/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>null);
    Promise.all([formspreeFetch,renderFetch])
      .then(async([res])=>{const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.message||'Failed');return data;})
      .then(()=>{
        msg.style.display='block'; msg.style.borderColor='rgba(0,255,200,0.45)';
        msg.style.background='rgba(0,255,200,0.08)'; msg.style.color='rgba(220,255,245,0.95)';
        msg.innerHTML='<i class="fas fa-circle-check" style="color:var(--mint);margin-right:8px;"></i>CORE CONNECTION ESTABLISHED — MESSAGE TRANSMITTED.';
        form.reset(); setTimeout(()=>{msg.style.display='none';},5000);
      })
      .catch(()=>{
        msg.style.display='block'; msg.style.borderColor='rgba(255,77,141,0.45)';
        msg.style.background='rgba(255,77,141,0.08)'; msg.style.color='rgba(255,220,235,0.95)';
        msg.innerHTML='<i class="fas fa-triangle-exclamation" style="color:var(--rose);margin-right:8px;"></i>FAILED TO TRANSMIT — TRY AGAIN.';
        setTimeout(()=>{msg.style.display='none';},5000);
      })
      .finally(()=>{btn.style.opacity='1';btn.style.pointerEvents='';btnText.textContent='TRANSMIT MESSAGE';});
  });
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 11 — AI CHATBOT WIDGET
   Handles: sending user messages to the portfolio backend API,
   displaying bot/user chat bubbles, typing indicator, quick
   chip shortcuts, chip auto-hide on first message, and graceful
   fallback message when the backend is unreachable.
════════════════════════════════════════════════════════════════ */
(function () {
  const API_URL = 'https://ahmednihatportfoliobackend.onrender.com/api/chat';

  const msgsEl = document.getElementById('chatbot-messages');
  const inputEl = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const chipsEl = document.getElementById('cb-chips');

  if (!msgsEl || !inputEl || !sendBtn) return;

  let chipsHidden = false;

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `
      <span class="chat-avatar"><i class="fas ${role === 'bot' ? 'fa-robot' : 'fa-user'}"></i></span>
      <span class="chat-bubble">${text}</span>`;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.id = 'cb-typing';
    typing.innerHTML = `
      <span class="chat-avatar"><i class="fas fa-robot"></i></span>
      <span class="chat-bubble">
        <div class="cb-typing-dots"><span></span><span></span><span></span></div>
      </span>`;
    msgsEl.appendChild(typing);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('cb-typing');
    if (typing) typing.remove();
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    if (!chipsHidden && chipsEl) {
      chipsHidden = true;
      chipsEl.style.transition = 'opacity 0.4s ease';
      chipsEl.style.opacity = '0';
      setTimeout(() => chipsEl.style.display = 'none', 450);
    }

    showTyping();

    let reply = "";
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [{ role: 'user', parts: [{ text }] }] })
      });
      const data = await res.json();
      reply = data.reply || `Hi! I'm Ahmed's AI assistant.<br><br>There is a temporary issue connecting right now.<br><strong>Click "Wake Up AI Assistant"</strong> below to activate me.`;
    } catch (err) {
      reply = `Hi! I'm Ahmed's AI assistant.<br><br>My backend is currently asleep.<br><strong>Click "Wake Up AI Assistant"</strong> below to wake me up.`;
    }

    hideTyping();
    addMessage(reply, 'bot');
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  if (chipsEl) {
    chipsEl.querySelectorAll('.cb-chip').forEach(chip => {
      chip.addEventListener('click', () => { inputEl.value = chip.dataset.q; sendMessage(); });
    });
  }
})();


/* ════════════════════════════════════════════════════════════════
   JS SCRIPT 12 — WAKE UP BACKEND BUTTON
   Handles: pinging the Render.com backend to wake it from
   sleep state with two sequential fetch calls and a status
   message update reflecting the result.
════════════════════════════════════════════════════════════════ */
document.getElementById('wakeBtn').addEventListener('click', async function() {
  const btn = this;
  const status = document.getElementById('wakeStatus');

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> &nbsp; Waking up...`;
  status.style.display = 'block';
  status.textContent = '⏳ Connecting to server...';
  status.style.color = '#f0a500';

  try {
    await fetch('https://ahmednihatportfoliobackend.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [] })
    }).catch(() => {});

    await new Promise(r => setTimeout(r, 800));

    await fetch('https://ahmednihatportfoliobackend.onrender.com', {
      method: 'GET', cache: 'no-cache'
    }).catch(() => {});

    status.textContent = '✅ Backend is awake! You can now use the chatbot.';
    status.style.color = '#00ffc8';
  } catch (err) {
    status.textContent = '⚠️ Could not wake up. Try again in a moment.';
    status.style.color = '#ff4d8d';
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-power-off"></i> &nbsp; Wake Up AI Assistant`;
    }, 3000);
  }
});
