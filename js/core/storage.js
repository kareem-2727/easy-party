const KEY="easyparty_v2";
const defaults=()=>({version:2,settings:{sound:true,music:true,vibrate:true,theme:"neon",roundsPerMatch:7,winScore:100,difficulty:"normal",highContrast:false,largeText:false},profiles:[],lastDailyClaim:null,dailyWheel:null,customWords:[],customQuestions:[],matchesToday:{date:null,count:0},lastBackup:null});
export function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return defaults();const parsed=JSON.parse(raw);return {...defaults(),...parsed,settings:{...defaults().settings,...parsed.settings}}}catch{return defaults()}}
export function save(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(e){console.warn("save failed",e);return false}}
export function resetAll(){localStorage.removeItem(KEY)}
export function exportData(){return JSON.stringify(load(),null,2)}
export function importData(text){const data=JSON.parse(text);if(!data||typeof data!=="object")throw new Error("Invalid backup");save({...defaults(),...data});return load()}