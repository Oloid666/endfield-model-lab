import './style.css';
import { World } from './world.js';
import { loadActors } from './actors.js';
import { RainAudio } from './audio.js';

const $=s=>document.querySelector(s),loading=$('#loading'),message=$('#loading-message'),error=$('#error');
const audio=new RainAudio(),abort=new AbortController();let world,closed=false;
const listen=(element,type,fn)=>element.addEventListener(type,fn,{signal:abort.signal});
function showError(text){$('#error-message').textContent=text;error.hidden=false;loading.hidden=true;}
function menu(open){$('#settings').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'關閉設定':'開啟設定');}
listen($('#menu-toggle'),'click',()=>menu($('#settings').hidden));listen($('#menu-close'),'click',()=>menu(false));
listen(document,'keydown',e=>{if(e.key==='Escape')menu(false);});
listen($('#retry'),'click',()=>location.reload());
listen($('#rain'),'change',e=>{if(world){world.weather.root.visible=e.target.checked;world.actors?.setRain(e.target.checked);}});
listen($('#characters'),'change',e=>{if(world?.actors)world.actors.root.visible=e.target.checked;});
listen($('#quality'),'change',e=>world?.setQuality(e.target.value));
listen($('#sound'),'change',async e=>{try{if(e.target.checked)await audio.enable();else await audio.disable();}catch{e.target.checked=false;message.textContent='雨聲無法開啟。';}});
listen(document,'visibilitychange',()=>{if(document.hidden)audio.disable();else if($('#sound').checked)audio.enable().catch(()=>{$('#sound').checked=false;});});
const buttons=[...document.querySelectorAll('[data-view]')];
listen($('.view-dock'),'click',e=>{const button=e.target.closest('[data-view]');if(!button)return;const view=button.dataset.view;world?.setView(view);for(const b of buttons){const active=b.dataset.view===(view==='reset'?'street':view);b.classList.toggle('active',active);if(b.dataset.view!=='reset')b.setAttribute('aria-pressed',String(active));}});
async function init(){
  try{
    world=new World($('#scene'),{onFraming:close=>$('#app').classList.toggle('close-view',close),onManual:()=>{for(const b of buttons){b.classList.remove('active');if(b.dataset.view!=='reset')b.setAttribute('aria-pressed','false');}},onContextLost:()=>showError('畫面暫時中斷。請重新載入，或關閉其他分頁後再試。'),onContextRestored:()=>{error.hidden=true;world.start();}});
    world.start();
    try{world.actors=await loadActors(world.scene,world.r,text=>message.textContent=text,abort.signal);if(closed){world.dispose();return;}world.actors.root.visible=$('#characters').checked;world.actors.setRain($('#rain').checked);world.time=0;world.previous=undefined;}
    catch(e){if(e.name==='AbortError')return;$('#characters').checked=false;$('#characters').disabled=true;$('#characters').parentElement.title=e.message;console.warn(e);const note=document.createElement('p');note.className='control-tip';note.textContent='人物暫時沒有載入。請重新整理後再試。';$('#settings').append(note);}
    loading.classList.add('done');
    // QA exposes measured state only. It never drives the experience.
    window.__rainy711={get time(){return world.time;},get renders(){return world.renderCount;},get drawCalls(){return world.renderer.info.render.calls;},get triangles(){return world.renderer.info.render.triangles;},get glassReady(){const u=world.store.glass.uniforms;return !!(u.uDepth.value?.isDepthTexture&&u.uScene.value?.isTexture&&u.uEnvironment.value?.isCubeTexture);},get poseData(){return world.actors?.poseData;},get idle(){return world.actors?.status;},get floorPlan(){return world.store.floorPlan;},inspectLayout(){world.inspectLayout();},pauseForCapture(){world.stop();},resume(){world.start();},frameView(name){world.setView(name,true);},samplePose(t){world.actors?.update(t);world.weather.update(t);world.composer.render();},get actorsLoaded(){return!!world.actors;},get bonesSupported(){return!!world.actors?.supported;},get camera(){return world.camera.position.toArray();},get quality(){return world.quality;},get actorsVisible(){return!!world.actors?.root.visible;},get rendererCount(){return document.querySelectorAll('canvas').length;}};
  }catch(e){world?.dispose();showError('無法啟動 3D 畫面。請使用支援 WebGL 2 的 Safari，然後重新載入。');console.error(e);}
}
function dispose(){closed=true;abort.abort();audio.dispose();world?.dispose();}
listen(window,'pagehide',event=>{if(!event.persisted)dispose();else world?.stop();});
listen(window,'pageshow',event=>{if(event.persisted)world?.start();});
if(import.meta.hot)import.meta.hot.dispose(dispose);
init();
