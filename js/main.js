import {state,initState} from "./core/state.js";
import {register,go,onNavigate} from "./core/router.js";
import {sfx} from "./core/audio.js";
import {haptics} from "./core/haptics.js";
import {home} from "./screens/home.js";
import {lobby} from "./screens/lobby.js";
import {profile} from "./screens/profile.js";
import {shop} from "./screens/shop.js";
import {settings} from "./screens/settings.js";
import {cardsLibrary} from "./screens/cardsLibrary.js";
import {spy} from "./screens/spy.js";
import {fiveSeconds} from "./screens/fiveSeconds.js";
import {miniGamePicker} from "./screens/miniGamePicker.js";
import {roundSummary} from "./screens/roundSummary.js";
import {victory} from "./screens/victory.js";
import {miniGame} from "./screens/miniGame.js";
import {daily} from "./screens/daily.js";
import {load,save} from "./core/storage.js";

const root=document.querySelector("#app");
const hud=document.querySelector("#hud");
const ctx={root,state,sfx,haptics};

async function getJson(path){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch(path,{signal:controller.signal});
    if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
    return await response.json();
  }finally{clearTimeout(timer)}
}

async function loadAssets(){
  const [words,questions,shopItems,achievements]=await Promise.all([
    getJson("./data/words.json"),
    getJson("./data/fiveSecQuestions.json"),
    getJson("./data/shopItems.json"),
    getJson("./data/achievements.json")
  ]);
  state.assets.words=words;
  state.assets.questions=questions;
  state.assets.shop=shopItems;
  state.assets.achievements=achievements;
  state.data=load();
}

function updateHud(){
  if(!state.players.length){hud.innerHTML="";return}
  const p=state.players[0];
  hud.innerHTML=`<div class="topbar"><div class="wallet"><span class="pill">🪙 ${p.coins}</span><span class="pill">💎 ${p.gems}</span><span class="pill">⭐ ${p.level} <span class="xp"><i style="width:${Math.min(100,p.xp/Math.max(1,100*p.level)*100)}%"></i></span></span></div><div class="row"><button class="icon-btn" id="sound">${state.data.settings.sound?"🔊":"🔇"}</button><button class="icon-btn" id="gear">⚙️</button></div></div>`;
  hud.querySelector("#gear").onclick=()=>go("settings");
  hud.querySelector("#sound").onclick=()=>{state.data.settings.sound=!state.data.settings.sound;save(state.data);updateHud()};
}

onNavigate(updateHud);
register("home",()=>home(ctx));
register("lobby",p=>lobby(ctx,p));
register("profile",()=>profile(ctx));
register("shop",()=>shop(ctx));
register("settings",()=>settings(ctx));
register("library",()=>cardsLibrary(ctx));
register("spy",()=>spy(ctx));
register("five",()=>fiveSeconds(ctx));
register("miniPicker",()=>miniGamePicker(ctx));
register("miniGame",p=>miniGame(ctx,p));
register("roundSummary",p=>roundSummary(ctx,p));
register("victory",()=>victory(ctx));
register("daily",()=>daily(ctx));

async function boot(){
  initState();
  await loadAssets();
  if("serviceWorker" in navigator){
    const registration=await navigator.serviceWorker.register("./sw.js?v=4",{updateViaCache:"none"});
    await registration.update().catch(()=>{});
  }
  await go("home");
}

boot().catch(error=>{
  console.error("Easy Party boot failed",error);
  hud.innerHTML="";
  root.innerHTML=`<section class="screen"><div class="card glass"><div class="logo">EASY <span>PARTY</span></div><h2>تعذر تشغيل اللعبة</h2><p class="muted">${String(error?.message||error)}</p><button class="btn primary" id="retry">إعادة المحاولة</button></div></section>`;
  root.querySelector("#retry").onclick=()=>location.reload();
});