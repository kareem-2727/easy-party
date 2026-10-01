const app=document.querySelector('#app');
const hud=document.querySelector('#hud');
let bootPromise=null;
let dataReady=Promise.resolve();

function renderInstantHome(){
  if(!app)return;
  app.innerHTML=`<section class="screen fade-in"><div class="hero"><div class="logo">EASY <span>PARTY</span></div><p class="subtitle">ألعاب حفلات سريعة وممتعة</p></div><div class="home-actions"><button class="btn primary big-btn" id="fallback-start">🎮 بدء اللعب الجماعي</button><div class="mini-actions"><button class="btn" id="fallback-profile">👤 الملف الشخصي</button><button class="btn" id="fallback-shop">🛍️ المتجر</button><button class="btn" id="fallback-daily">🎁 المكافأة اليومية</button><button class="btn" id="fallback-settings">⚙️ الإعدادات</button></div></div></section>`;
}

function showBootError(error){
  console.error('Easy Party boot error',error);
  if(!app)return;
  app.innerHTML=`<section class="screen fade-in"><div class="hero"><div class="logo">EASY <span>PARTY</span></div><h2>حدث خطأ بسيط في تشغيل اللعبة</h2><p class="muted">اضغط إعادة المحاولة. الصفحة الرئيسية لا تحتاج إلى انتظار كل الألعاب.</p><button class="btn primary big-btn" id="retry">إعادة المحاولة</button></div></section>`;
  app.querySelector('#retry')?.addEventListener('click',()=>location.reload());
}

function showRouteError(error,go,name,payload){
  console.error(`Easy Party route error: ${name}`,error);
  if(!app)return;
  app.innerHTML=`<section class="screen fade-in"><div class="hero"><div class="logo">EASY <span>PARTY</span></div><h2>تعذر فتح هذه الشاشة</h2><p class="muted">تم الحفاظ على الصفحة الرئيسية. جرّب مرة أخرى.</p><div class="row"><button class="btn primary" id="retry-route">إعادة المحاولة</button><button class="btn" id="home-route">الرئيسية</button></div></div></section>`;
  app.querySelector('#retry-route')?.addEventListener('click',()=>safeNavigate(go,name,payload));
  app.querySelector('#home-route')?.addEventListener('click',()=>safeNavigate(go,'home'));
}

function safeNavigate(go,name,payload){
  Promise.resolve(go(name,payload)).catch(error=>showRouteError(error,go,name,payload));
}

async function loadDataInBackground(state){
  const get=async path=>{
    try{
      const r=await fetch(path,{cache:'no-store'});
      if(!r.ok)throw new Error(`${path}: ${r.status}`);
      return await r.json();
    }catch(error){
      console.warn('Easy Party data load failed',path,error);
      return null;
    }
  };
  const [words,questions,shop,achievements]=await Promise.all([
    get('./data/words.json?v=6'),
    get('./data/fiveSecQuestions.json?v=6'),
    get('./data/shopItems.json?v=6'),
    get('./data/achievements.json?v=6')
  ]);
  if(words)state.assets.words=words;
  if(questions)state.assets.questions=questions;
  if(shop)state.assets.shop=shop;
  if(achievements)state.assets.achievements=achievements;
}

async function startGame(){
  if(bootPromise)return bootPromise;
  bootPromise=(async()=>{
    try{
      const [stateMod,routerMod,audioMod,hapticsMod]=await Promise.all([
        import('./core/state.js?v=6'),
        import('./core/router.js?v=6'),
        import('./core/audio.js?v=6'),
        import('./core/haptics.js?v=6')
      ]);
      const {state,initState}=stateMod;
      const {register,go,onNavigate}=routerMod;
      const {sfx}=audioMod;
      const {haptics}=hapticsMod;
      const ctx={root:app,state,sfx,haptics};

      function updateHud(){
        if(!hud)return;
        const p=state.players?.[0];
        if(!p){hud.innerHTML='';return;}
        hud.innerHTML=`<div class="topbar"><div class="wallet"><span class="pill">🪙 ${p.coins}</span><span class="pill">💎 ${p.gems}</span><span class="pill">⭐ ${p.level}</span></div><div class="row"><button class="icon-btn" id="sound">${state.data.settings.sound?'🔊':'🔇'}</button><button class="icon-btn" id="gear">⚙️</button></div></div>`;
        hud.querySelector('#gear')?.addEventListener('click',()=>safeNavigate(go,'settings'));
        hud.querySelector('#sound')?.addEventListener('click',()=>{state.data.settings.sound=!state.data.settings.sound;stateMod.persist();updateHud()});
      }

      initState();
      state.data.settings=state.data.settings||{};
      onNavigate(updateHud);

      register('home',async()=>{const m=await import('./screens/home.js?v=6');return m.home(ctx)});
      register('lobby',async payload=>{await dataReady;const m=await import('./screens/lobby.js?v=6');return m.lobby(ctx,payload)});
      register('profile',async()=>{const m=await import('./screens/profile.js?v=6');return m.profile(ctx)});
      register('shop',async()=>{await dataReady;const m=await import('./screens/shop.js?v=6');return m.shop(ctx)});
      register('settings',async()=>{const m=await import('./screens/settings.js?v=6');return m.settings(ctx)});
      register('library',async()=>{await dataReady;const m=await import('./screens/cardsLibrary.js?v=6');return m.cardsLibrary(ctx)});
      register('spy',async()=>{await dataReady;const m=await import('./screens/spy.js?v=6');return m.spy(ctx)});
      register('five',async()=>{await dataReady;const m=await import('./screens/fiveSeconds.js?v=6');return m.fiveSeconds(ctx)});
      register('miniPicker',async()=>{await dataReady;const m=await import('./screens/miniGamePicker.js?v=6');return m.miniGamePicker(ctx)});
      register('miniGame',async payload=>{await dataReady;const m=await import('./screens/miniGame.js?v=6');return m.miniGame(ctx,payload)});
      register('roundSummary',async payload=>{const m=await import('./screens/roundSummary.js?v=6');return m.roundSummary(ctx,payload)});
      register('victory',async()=>{const m=await import('./screens/victory.js?v=6');return m.victory(ctx)});
      register('daily',async()=>{const m=await import('./screens/daily.js?v=6');return m.daily(ctx)});

      document.addEventListener('easy-party-route',event=>safeNavigate(go,event.detail));
      updateHud();
      dataReady=loadDataInBackground(state);
      await go('home');

      if('serviceWorker' in navigator){
        navigator.serviceWorker.register('./sw.js?v=6',{updateViaCache:'none'}).then(reg=>reg.update()).catch(error=>console.warn('Service worker unavailable',error));
      }

      const pending=window.__easyPartyRoute;
      if(pending&&pending!=='home'){
        delete window.__easyPartyRoute;
        safeNavigate(go,pending);
      }
      return ctx;
    }catch(error){
      showBootError(error);
      throw error;
    }
  })();
  return bootPromise;
}

renderInstantHome();
startGame().catch(()=>{});
