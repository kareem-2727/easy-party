const app=document.querySelector('#app');
const hud=document.querySelector('#hud');

function renderInstantHome(){
  if(!app)return;
  app.innerHTML=`<section class="screen fade-in"><div class="hero"><div class="logo">EASY <span>PARTY</span></div><p class="subtitle">ألعاب حفلات سريعة وممتعة</p></div><div class="home-actions"><button class="btn primary big-btn" id="fallback-start">🎮 بدء اللعب الجماعي</button><div class="mini-actions"><button class="btn" id="fallback-profile">👤 الملف الشخصي</button><button class="btn" id="fallback-shop">🛍️ المتجر</button><button class="btn" id="fallback-daily">🎁 المكافأة اليومية</button><button class="btn" id="fallback-settings">⚙️ الإعدادات</button></div></div></section>`;
}

renderInstantHome();

async function startGame(){
  try{
    const [stateMod,routerMod,audioMod,hapticsMod,homeMod,lobbyMod,profileMod,shopMod,settingsMod,libraryMod,spyMod,fiveMod,pickerMod,miniMod,summaryMod,victoryMod,dailyMod]=await Promise.all([
      import('./core/state.js'),import('./core/router.js'),import('./core/audio.js'),import('./core/haptics.js'),import('./screens/home.js'),import('./screens/lobby.js'),import('./screens/profile.js'),import('./screens/shop.js'),import('./screens/settings.js'),import('./screens/cardsLibrary.js'),import('./screens/spy.js'),import('./screens/fiveSeconds.js'),import('./screens/miniGamePicker.js'),import('./screens/miniGame.js'),import('./screens/roundSummary.js'),import('./screens/victory.js'),import('./screens/daily.js')
    ]);
    const {state,initState}=stateMod; const {register,go,onNavigate}=routerMod;
    const {sfx}=audioMod; const {haptics}=hapticsMod;
    const ctx={root:app,state,sfx,haptics};
    function updateHud(){
      if(!state.players.length){hud.innerHTML='';return}
      const p=state.players[0];
      hud.innerHTML=`<div class="topbar"><div class="wallet"><span class="pill">🪙 ${p.coins}</span><span class="pill">💎 ${p.gems}</span><span class="pill">⭐ ${p.level}</span></div><div class="row"><button class="icon-btn" id="sound">${state.data.settings.sound?'🔊':'🔇'}</button><button class="icon-btn" id="gear">⚙️</button></div></div>`;
      hud.querySelector('#gear').onclick=()=>go('settings');
      hud.querySelector('#sound').onclick=()=>{state.data.settings.sound=!state.data.settings.sound;stateMod.persist();updateHud()};
    }
    register('home',()=>homeMod.home(ctx));register('lobby',p=>lobbyMod.lobby(ctx,p));register('profile',()=>profileMod.profile(ctx));register('shop',()=>shopMod.shop(ctx));register('settings',()=>settingsMod.settings(ctx));register('library',()=>libraryMod.cardsLibrary(ctx));register('spy',()=>spyMod.spy(ctx));register('five',()=>fiveMod.fiveSeconds(ctx));register('miniPicker',()=>pickerMod.miniGamePicker(ctx));register('miniGame',p=>miniMod.miniGame(ctx,p));register('roundSummary',p=>summaryMod.roundSummary(ctx,p));register('victory',()=>victoryMod.victory(ctx));register('daily',()=>dailyMod.daily(ctx));
    initState();
    state.data.settings=state.data.settings||{};
    onNavigate(updateHud);
    document.addEventListener('easy-party-route',e=>go(e.detail));
    updateHud();
    go('home');
    loadDataInBackground(state);
    if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=5',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
  }catch(error){
    console.error('Easy Party module startup failed',error);
    renderInstantHome();
    const bind=(id,route)=>document.getElementById(id)?.addEventListener('click',()=>alert('جاري تجهيز اللعبة… حاول الضغط مرة أخرى بعد لحظة.'));
    bind('fallback-start','lobby');bind('fallback-profile','profile');bind('fallback-shop','shop');bind('fallback-daily','daily');bind('fallback-settings','settings');
  }
}

async function loadDataInBackground(state){
  const get=async path=>{try{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return await r.json()}catch{return null}};
  const [words,questions,shop,achievements]=await Promise.all([get('./data/words.json'),get('./data/fiveSecQuestions.json'),get('./data/shopItems.json'),get('./data/achievements.json')]);
  if(words)state.assets.words=words;if(questions)state.assets.questions=questions;if(shop)state.assets.shop=shop;if(achievements)state.assets.achievements=achievements;
}

startGame();
