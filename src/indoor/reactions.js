// Cosmetic reactions use simulation time: pause freezes them, restarting clears injuries.
export function createReactions(){return {player:{age:10,mode:'dent',hits:0,damage:0,side:1,kind:'wall'},dragon:{age:10,mode:'squash',hits:0,damage:0,side:1,kind:'wall'}};}
export function stepReactions(r,dt){for(const p of Object.values(r))p.age+=dt;}
export function strikeReaction(r,who,strength,kind='wall',side=1){
 const p=r[who==='dragon'?'dragon':'player'];if(p.age<.38)return false;
 p.age=0;p.hits++;p.side=side||1;p.kind=kind;p.damage=Math.min(4,p.damage+(strength>.45?1:.35));
 const modes=who==='dragon'?['squash','bag','dizzy','stretch','rattle']:['pancake','split','triple','banana','dent'];
 p.mode=strength<.28?(who==='dragon'?'rattle':'dent'):modes[(p.hits-1)%modes.length];return true;
}
