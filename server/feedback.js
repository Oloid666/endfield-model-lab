const ORIGINS=new Set(['https://endfield10000t.aura87.online','https://endfield-model-lab.pages.dev','https://oloid666.github.io']);
const CATEGORIES=new Set(['general','praise','bug','idea']);
const MODES=new Set(['normal','chapter_replay','shortcut','unknown']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const encoder=new TextEncoder();
async function digest(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
const hex=bytes=>Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
async function matches(a,b){const x=await digest(a),y=await digest(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
export function validFeedback(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||!UUID.test(input.id||''))return null;
 const rating=input.rating===null||input.rating===undefined?null:input.rating;
 if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))return null;
 if(typeof input.message!=='string'||input.message.length>1000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(input.message))return null;
 const message=input.message.trim();if(!message&&!rating)return null;
 if(!CATEGORIES.has(input.category)||!MODES.has(input.play_mode))return null;
 if(typeof input.build_version!=='string'||!/^[a-z0-9_.-]{1,40}$/i.test(input.build_version))return null;
 if(typeof input.phase!=='string'||!/^[a-z0-9-]{1,40}$/.test(input.phase))return null;
 return {id:input.id,rating,message,category:input.category,build_version:input.build_version,phase:input.phase,play_mode:input.play_mode};
}
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('invalid');const chunks=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();throw Error('large');}chunks.push(value);}
 const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleFeedback(request,env={},now=Date.now()){
 const origin=request.headers.get('Origin');const allowed=!!origin&&ORIGINS.has(origin);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(allowed){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, Authorization';}
 const reply=(status,data,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
 if(origin&&!allowed)return reply(403,{error:'origin_denied'});
 if(request.method==='OPTIONS')return allowed?new Response(null,{status:204,headers}):reply(403,{error:'origin_denied'});
 if(!['GET','POST'].includes(request.method))return reply(405,{error:'method_not_allowed'},{Allow:'GET, POST, OPTIONS'});
 const token=typeof env.FEEDBACK_ADMIN_TOKEN==='string'?env.FEEDBACK_ADMIN_TOKEN:'';
 if(!env.FEEDBACK_DB||token.length<32)return reply(503,{error:'not_configured'});
 try{
  if(request.method==='GET'){
   const auth=request.headers.get('Authorization')||'';
   if(!auth.startsWith('Bearer ')||!await matches(auth.slice(7),token))return reply(401,{error:'unauthorized'});
   const url=new URL(request.url),category=url.searchParams.get('category'),rating=url.searchParams.get('rating'),cursor=url.searchParams.get('cursor');
   let before=null;if(cursor){try{before=JSON.parse(atob(cursor.replaceAll('-','+').replaceAll('_','/')));}catch{return reply(400,{error:'invalid_cursor'});}if(!Number.isSafeInteger(before?.time)||!UUID.test(before?.id||''))return reply(400,{error:'invalid_cursor'});}
   if(category&&!CATEGORIES.has(category)||rating&&!/^[1-5]$/.test(rating))return reply(400,{error:'invalid_filter'});
   const clauses=[],args=[];if(url.searchParams.get('message_only')==='1')clauses.push("message <> ''");
   if(category){clauses.push('category = ?');args.push(category);}if(rating){clauses.push('rating = ?');args.push(Number(rating));}
   if(before){clauses.push('(created_at < ? OR (created_at = ? AND id < ?))');args.push(before.time,before.time,before.id);}
   const list=await env.FEEDBACK_DB.prepare('SELECT id,created_at,rating,message,category,build_version,phase,play_mode FROM feedback'+(clauses.length?' WHERE '+clauses.join(' AND '):'')+' ORDER BY created_at DESC,id DESC LIMIT 51').bind(...args).all();
   const items=(list.results||[]).slice(0,50),last=items.at(-1);
   const summary=await env.FEEDBACK_DB.prepare("SELECT COUNT(*) AS total,COUNT(rating) AS rated,SUM(CASE WHEN message <> '' THEN 1 ELSE 0 END) AS with_message,ROUND(AVG(rating),2) AS average_rating FROM feedback").first();
   const next=(list.results||[]).length>50?btoa(JSON.stringify({time:last.created_at,id:last.id})).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,''):null;
   return reply(200,{items,summary,next});
  }
  if(!allowed)return reply(403,{error:'origin_required'});
  if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return reply(415,{error:'json_required'});
  let raw;try{raw=await readBody(request);}catch(e){return reply(e.message==='large'?413:400,{error:e.message==='large'?'too_large':'invalid_json'});}
  const value=validFeedback(raw);if(!value)return reply(400,{error:'invalid_feedback'});
  const bodyHash=hex(await digest(JSON.stringify(value))),db=env.FEEDBACK_DB;
  const existing=()=>db.prepare('SELECT body_hash FROM feedback WHERE id = ?').bind(value.id).first();
  const old=await existing();if(old)return old.body_hash===bodyHash?reply(200,{ok:true,id:value.id,duplicate:true}):reply(409,{error:'id_conflict'});
  // No raw IP, browser identity, password or photo is stored. The daily hash only limits spam.
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const key=await crypto.subtle.importKey('raw',encoder.encode(token),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sourceKey=hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode('feedback-rate|'+new Date(now).toISOString().slice(0,10)+'|'+ip))));
  // The rate check and insertion are one SQL statement, including concurrent requests.
  const inserted=await db.prepare('INSERT INTO feedback (id,created_at,rating,message,category,build_version,phase,play_mode,source_key,body_hash) SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM feedback WHERE source_key = ? AND created_at >= ?) < 20 ON CONFLICT(id) DO NOTHING RETURNING id').bind(value.id,now,value.rating,value.message,value.category,value.build_version,value.phase,value.play_mode,sourceKey,bodyHash,sourceKey,now-600000).first();
  if(!inserted){const race=await existing();if(race)return race.body_hash===bodyHash?reply(200,{ok:true,id:value.id,duplicate:true}):reply(409,{error:'id_conflict'});return reply(429,{error:'rate_limited'},{'Retry-After':'600'});}
  return reply(201,{ok:true,id:value.id});
 }catch{return reply(503,{error:'temporarily_unavailable'});}
}
