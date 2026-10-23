import './story-ui.css';
import {speakers} from './dialogue.js';
import {StoryMachine} from './story-state.js';
export {StoryMachine} from './story-state.js';

const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export function createStory({mount=document.querySelector('#app'),onGesture,onDinner,onScene,onState}={}){
  if(!mount)throw new Error('Story mount is required.');
  const events=new AbortController(),listen=(target,type,fn)=>target.addEventListener(type,fn,{signal:events.signal});
  const root=element('section','story-shell');root.setAttribute('aria-label','莊的晚餐互動短劇');
  const launch=element('button','story-launch');launch.append(element('span','story-launch-kicker','一場雨，一頓飯。'),element('span','story-launch-title','開始今晚的故事'),element('span','story-launch-arrow','↗'));launch.type='button';
  const panel=element('div','story-panel');panel.hidden=true;
  const bar=element('div','story-bar'),name=element('span','story-name'),chapter=element('span','story-chapter');bar.append(name,chapter);
  const line=element('button','story-line');line.type='button';line.setAttribute('aria-label','顯示完整台詞或下一句');
  const text=element('span','story-text'),nextMark=element('span','story-next-mark','⌄');line.append(text,nextMark);
  const choices=element('div','story-choices');choices.setAttribute('aria-label','請選擇');
  const controls=element('div','story-controls'),auto=element('button','story-minor','自動'),skip=element('button','story-minor','略過本段'),collapse=element('button','story-minor','收起');
  for(const button of [auto,skip,collapse])button.type='button';controls.append(auto,skip,collapse);
  const progress=element('span','story-progress','點擊台詞繼續');controls.append(progress);panel.append(bar,line,choices,controls);
  const caption=element('p','story-caption');caption.setAttribute('aria-hidden','true');
  const idle=element('div','story-idle');idle.hidden=true;const ending=element('span','story-ending'),replay=element('button','story-replay','重新選餐'),resume=element('button','story-replay','繼續故事');replay.type=resume.type='button';idle.append(ending,replay,resume);
  const note=element('span','story-fan-note','原創二創 · 非官方劇情');root.append(launch,panel,caption,idle,note);mount.append(root);mount.classList.add('story-ready');
  let machine,lastRevision=-1,lastNode=null,collapsed=false,captionAt=-Infinity,disposed=false;
  const emitState=state=>{onState?.(state);};
  machine=new StoryMachine({onGesture,onDinner,onScene,onState:emitState});
  const chapterNames={opening:'01 · 把人帶出來',dinner:'02 · 挑一份晚餐',choice:'02 · 今晚，吃什麼',branch:'03 · 你選的晚餐',checkout:'04 · 手機先收起來',rain:'05 · 今晚不趕路',ending:'一頓飯，好好吃完',coda:'雨還沒停',chat:'騎樓 · 聽雨',hotspot:'騎樓 · 一點小事'};
  function render(){
    if(disposed)return;const state=machine.state;if(lastRevision===state.revision)return;lastRevision=state.revision;
    const node=state.node,active=Boolean(node);mount.classList.toggle('story-active',active&&!collapsed);mount.classList.toggle('story-has-ending',state.ended);panel.classList.toggle('has-choices',state.waitingChoice);
    launch.hidden=state.phase!=='ready';panel.hidden=!active||collapsed;idle.hidden=active?!collapsed:!state.ended;note.hidden=active;
    resume.hidden=!active||!collapsed;replay.hidden=!state.ended;ending.textContent=active&&collapsed?'故事暫停中':state.endingLabel;
    if(!node){caption.classList.remove('visible');lastNode=null;return;}
    name.textContent=speakers[node.speaker]||node.speaker;name.dataset.speaker=node.speaker;chapter.textContent=chapterNames[node.segment]||'今晚';text.textContent=node.text.slice(0,state.revealed);text.setAttribute('aria-label',node.text);
    line.disabled=state.waitingChoice;nextMark.hidden=state.waitingChoice||state.revealed<node.text.length;progress.textContent=state.waitingChoice?'選擇會留在這裡等你':state.revealed<node.text.length?'點一下，顯示完整台詞':'點擊台詞繼續';
    auto.classList.toggle('selected',state.auto);auto.setAttribute('aria-pressed',String(state.auto));auto.textContent=state.auto?'自動 · 開':'自動';skip.disabled=state.waitingChoice;
    if(lastNode!==node.id){
      choices.replaceChildren();choices.hidden=!state.waitingChoice;
      for(const choice of node.choices||[]){const button=element('button','story-choice');button.type='button';button.dataset.choice=choice.id;button.append(element('span','story-choice-label',choice.label),element('span','story-choice-hint',choice.hint));choices.append(button);}
      if(node.caption){caption.textContent=node.caption;captionAt=machine.time;caption.classList.add('visible');}
      lastNode=node.id;
    }
  }
  listen(launch,'click',()=>{collapsed=false;machine.start();render();});
  listen(line,'click',()=>{machine.next();render();});
  listen(choices,'click',event=>{const button=event.target.closest('[data-choice]');if(button){machine.choose(button.dataset.choice);render();}});
  listen(auto,'click',()=>{machine.setAuto(!machine.auto);render();});
  listen(skip,'click',()=>{machine.skip();render();});
  listen(collapse,'click',()=>{collapsed=true;machine.setPaused(true);render();});
  listen(resume,'click',()=>{collapsed=false;machine.setPaused(false);render();});
  listen(replay,'click',()=>{collapsed=false;machine.setPaused(false);machine.replay();render();});
  listen(root,'pointerdown',event=>event.stopPropagation());listen(root,'pointerup',event=>event.stopPropagation());
  render();
  return {
    update(t){machine.update(t);render();if(t-captionAt>6)caption.classList.remove('visible');},
    start(){collapsed=false;machine.setPaused(false);machine.start();render();},
    replay(){collapsed=false;machine.setPaused(false);machine.replay();render();},
    next(){const result=machine.next();render();return result;},
    choose(id){const result=machine.choose(id);render();return result;},
    hotspot(kind){const result=machine.hotspot(kind);render();return result;},
    setPaused(value){machine.setPaused(value);render();},
    get state(){return machine.state;},
    dispose(){disposed=true;events.abort();root.remove();mount.classList.remove('story-ready','story-active','story-has-ending');},
  };
}
