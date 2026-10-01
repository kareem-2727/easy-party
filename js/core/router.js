const routes=new Map();let current='';let hook=null;let navToken=0;
export function register(name,fn){routes.set(name,fn)}
export function onNavigate(fn){hook=fn}
export async function go(name,payload){const fn=routes.get(name);if(!fn)throw new Error(`Route not found: ${name}`);const token=++navToken;const result=await fn(payload);if(token!==navToken)return result;current=name;if(hook)await hook(name,payload);return result}
export const route=()=>current;
