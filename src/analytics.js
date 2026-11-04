// Only the rain-night entry point loads this module. No ID means no Google requests.
const EVENTS=new Set(['page_view','game_loaded','game_load_failed','game_start','chapter_reached','main_story_complete','story_replay_complete','shortcut_used','bonus_enter','rating_submit','rating_skip','feedback_submit','content_complete','game_complete','play_time']);
const PARAMS=new Set(['play_mode','run_number','is_replay','chapter_id','rating','active_seconds','active_seconds_delta','error_stage','game_id','build_version']);
export function analyticsURL(value){
  try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol))return '';const out=new URL(u.origin+u.pathname);
    for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){const v=u.searchParams.get(k);if(v&&/^[a-z0-9_. -]{1,80}$/i.test(v))out.searchParams.set(k,v);}return out.href;
  }catch{return '';}
}
export function createGA4({measurementId='',production=false,win=globalThis.window,doc=globalThis.document,version='local'}={}){
  const id=String(measurementId).trim();let officialHost=false;try{officialHost=['endfield10000t.aura87.online','oloid666.github.io'].includes(new URL(win?.location?.href).hostname);}catch{}
  let enabled=!!(production&&officialHost&&/^G-[A-Z0-9]{4,20}$/.test(id)&&win&&doc),started=false;
  if(win?.navigator?.globalPrivacyControl||win?.navigator?.doNotTrack==='1')enabled=false;
  function command(...args){win.dataLayer.push(arguments);}
  function send(name,params={}){
    if(!enabled||!EVENTS.has(name))return;
    try{
      if(!started){started=true;win.dataLayer=win.dataLayer||[];win.gtag=win.gtag||command;
        win.gtag('js',new Date());win.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:analyticsURL(win.location.href),page_referrer:analyticsURL(doc.referrer)});
        const script=doc.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;script.dataset.rainAnalytics='true';doc.head.append(script);
      }
      const clean={game_id:'rainy711',build_version:version};
      for(const [k,v] of Object.entries(params))if(PARAMS.has(k)&&((typeof v==='number'&&Number.isFinite(v))||(typeof v==='string'&&/^[a-z0-9_. -]{1,60}$/i.test(v))))clean[k]=v;
      // Override page metadata on every event, not just the initial configuration.
      win.gtag('event',name,{...clean,send_to:id,page_location:analyticsURL(win.location.href),page_referrer:analyticsURL(doc.referrer),transport_type:'beacon'});
    }catch{/* Tracking must never interrupt loading, controls or the ending. */}
  }
  return {get enabled(){return enabled;},send,pageView(){send('page_view');}};
}

const CHAPTERS=new Set(['intro','cargo','terminal-deploy','rewind','last']);
export function createRainAnalytics(send=()=>{}){
  let mode='normal',run=0,seconds=0,pending=0,lastTime=null,wasPlaying=false,started=false,mainDone=false,allDone=false,loaded=false;
  const reached=new Set();
  const event=(name,params={})=>{try{send(name,{play_mode:mode,run_number:run,...params});}catch{/* Optional sink. */}};
  function flush(){if(pending<.01)return;event('play_time',{active_seconds_delta:Math.round(pending*100)/100,active_seconds:Math.round(seconds)});pending=0;}
  function start(playMode='normal'){
    flush();mode=playMode;run++;seconds=pending=0;reached.clear();started=true;mainDone=allDone=false;lastTime=null;wasPlaying=false;
    event('game_start',{is_replay:run>1?1:0});
  }
  return {
    ready(){if(!loaded){loaded=true;event('game_loaded');}},
    fail(stage){event('game_load_failed',{error_stage:['actors','renderer','scene'].includes(stage)?stage:'scene'});},
    start,
    stage(phase){
      if(!started)return;
      if(CHAPTERS.has(phase)&&!reached.has(phase)){reached.add(phase);event('chapter_reached',{chapter_id:phase});}
      if(phase==='complete'&&!mainDone&&mode!=='shortcut'){mainDone=true;flush();event(mode==='normal'?'main_story_complete':'story_replay_complete',{active_seconds:Math.round(seconds)});}
    },
    shortcut(){if(!started)start('shortcut');else {flush();mode='shortcut';}mainDone=true;event('shortcut_used');},
    bonus(action,value){
      if(action==='enter')event('bonus_enter');
      else if(action==='feedback')event('feedback_submit');
      else if(action==='rating'&&Number.isInteger(value)&&value>=1&&value<=5)event('rating_submit',{rating:value});
      else if(action==='rating_skip')event('rating_skip');
      else if(action==='complete'&&!allDone){allDone=true;flush();event('content_complete',{active_seconds:Math.round(seconds)});if(mode==='normal'&&mainDone)event('game_complete',{active_seconds:Math.round(seconds)});}
    },
    tick(now,{visible=true,paused=false}={}){
      const playing=started&&visible&&!paused;
      if(lastTime!==null&&playing&&wasPlaying){const dt=Math.min(2,Math.max(0,(now-lastTime)/1000));seconds+=dt;pending+=dt;}
      lastTime=now;wasPlaying=playing;if(pending>=30)flush();
    },
    flush,
    get state(){return {playMode:mode,run,activeSeconds:seconds,mainDone,allDone};}
  };
}
