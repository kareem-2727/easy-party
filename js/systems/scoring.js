export const POINTS={fiveSecCorrect:10,spyVoteCorrect:15,spyGuessWord:25,spyUncaught:30,mini:[20,10,5,0]};
export function createScoreboard(players){return Object.fromEntries(players.map(p=>[p.id,0]))}
export function addPoints(board,id,pts){board[id]=(board[id]||0)+pts;return board[id]}
export function rankPlayers(board){return Object.entries(board).sort((a,b)=>b[1]-a[1]).map(([id,pts],rank)=>({id,pts,rank}))}
export function isMatchOver(board,round,cfg){const top=Math.max(...Object.values(board),0);const rounds=Math.max(1,Number(cfg?.roundsPerMatch)||7);const target=Math.max(1,Number(cfg?.winScore)||100);return top>=target||(Number(round)||0)+1>=rounds}
export function awardMini(board,ids){ids.forEach((id,i)=>addPoints(board,id,POINTS.mini[i]??0))}
