const app=document.querySelector('#app');
const hud=document.querySelector('#hud');
let bootPromise=null;
let dataReady=Promise.resolve();

function renderInstantHome(){
  if(!app)return;
  app.innerHTML=`<section class="screen fade-in"><div class="hero"><div class="logo">EASY <span>PARTY</span></div><p class="subtitle">حفلة واحدة. عشرات التحديات. جهاز واحد.</p></div><div class="home-actions"><button class="btn primary big-btn" id="fallback-start">🎉 بدء اللعب الجماعي</button><div class="mini-actions"><button class="btn" id="fallback-profile">👤 الملف الشخصي</button><button class="btn" id="fallback-shop">🛒 المتجر</button><button class="btn" id="fallback-daily">🎁 المكافأة اليومية</button><button class="btn" id="fallback-settings">⚙️ الإعدادات</button></div></div></section>`;
}

function showBootError(error){
  console.error('Easy Party boot error',error);
  if(!app)return;
  app.innerHTML=`<section class="screen fade-in"><div class="hero"><div class="logo">EASY <span>PARTY</span></div><h2>تعذر تشغيل اللعبة</h2><p class="muted">تم تحديث اللعبة. اضغط إعادة المحاولة.</p><button class="btn primary big-btn" id="retry">إعادة المحاولة</button></div></section>`;
  app.querySelector('#retry')?.addEventListener('click',()=>location.reload());
}

function showRouteError(error,go,name,payload){
  console.error(`Easy Party route error: ${name}`,error);
  if(!app)return;
  app.innerHTML=`<section class="screen fade-in"><div class="hero"><div class="logo">EASY <span>PARTY</span></div><h2>تعذر فتح اللعبة</h2><p class="muted">حدث خطأ أثناء فتح شاشة ${name}. يمكنك المحاولة مرة أخرى.</p><div class="row"><button class="btn primary" id="retry-route">إعادة المحاولة</button><button class="btn" id="home-route">الرئيسية</button></div></div></section>`;
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
    get('./data/words.json?v=7'),
    get('./data/fiveSecQuestions.json?v=7'),
    get('./data/shopItems.json?v=7'),
    get('./data/achievements.json?v=7')
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
      // IMPORTANT: keep canonical module URLs. Adding ?v=7 to these imports would
      // create separate ES-module instances and duplicate the router state.
      const [stateMod,routerMod,audioMod,hapticsMod]=await Promise.all([
        import('./core/state.js'),
        import('./core/router.js'),
        import('./core/audio.js'),
        import('./core/haptics.js')
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

      register('home',async()=>{const m=await import('./screens/home.js');return m.home(ctx)});
      register('lobby',async payload=>{await dataReady;const m=await import('./screens/lobby.js');return m.lobby(ctx,payload)});
      register('profile',async()=>{const m=await import('./screens/profile.js');return m.profile(ctx)});
      register('shop',async()=>{await dataReady;const m=await import('./screens/shop.js');return m.shop(ctx)});
      register('settings',async()=>{const m=await import('./screens/settings.js');return m.settings(ctx)});
      register('library',async()=>{await dataReady;const m=await import('./screens/cardsLibrary.js');return m.cardsLibrary(ctx)});
      register('spy',async()=>{await dataReady;const m=await import('./screens/spy.js');return m.spy(ctx)});
      register('five',async()=>{await dataReady;const m=await import('./screens/fiveSeconds.js');return m.fiveSeconds(ctx)});
      register('miniPicker',async()=>{await dataReady;const m=await import('./screens/miniGamePicker.js');return m.miniGamePicker(ctx)});
      register('miniGame',async payload=>{await dataReady;const m=await import('./screens/miniGame.js');return m.miniGame(ctx,payload)});
      register('roundSummary',async payload=>{const m=await import('./screens/roundSummary.js');return m.roundSummary(ctx,payload)});
      register('victory',async()=>{const m=await import('./screens/victory.js');return m.victory(ctx)});
      register('daily',async()=>{const m=await import('./screens/daily.js');return m.daily(ctx)});

      document.addEventListener('easy-party-route',event=>safeNavigate(go,event.detail));
      updateHud();
      dataReady=loadDataInBackground(state);
      await go('home');

      if('serviceWorker' in navigator){
        navigator.serviceWorker.register('./sw-v7.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(error=>console.warn('Service worker unavailable',error));
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
