// Small procedural effects: no remote audio, music or voice downloads.
export function createRaceAudio(){
  let ctx,master,wind,slide,rope,muted=false,active=false,ready=false,lastHit=-Infinity;
  const shots=new Set();
  function noiseBuffer(){const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),a=buffer.getChannelData(0);let brown=0;for(let i=0;i<a.length;i++){brown=(brown+(Math.random()*2-1)*.08)/1.025;a[i]=brown*3;}return buffer;}
  function noiseLoop(buffer,type,frequency){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type=type;filter.frequency.value=frequency;gain.gain.value=0;source.connect(filter).connect(gain).connect(master);source.start();return {source,filter,gain};}
  function init(){
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
    ctx=new Audio();master=ctx.createGain();master.gain.value=0;const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=6;master.connect(limiter).connect(ctx.destination);
    const buffer=noiseBuffer();wind=noiseLoop(buffer,'lowpass',1100);slide=noiseLoop(buffer,'bandpass',1700);rope=noiseLoop(buffer,'bandpass',380);rope.filter.Q.value=5;ready=true;return true;
  }
  function volume(){if(master)master.gain.setTargetAtTime(active&&!muted?.62:0,ctx.currentTime,.035);}
  function stopShots(){for(const node of shots){try{node.stop();}catch{ /* Already ended. */ }}shots.clear();}
  return {
    async unlock(){try{if(!ctx&&!init())return;await ctx.resume();volume();}catch{ /* Audio failure must never block gameplay. */ }},
    setActive(value){active=value;if(!value)stopShots();volume();},
    setMuted(value){muted=value;if(muted)stopShots();volume();},
    update(state){if(!ctx||!active||muted)return;const at=ctx.currentTime,speed=Math.min(1,state.speed/27),slip=Math.min(1,state.slip/7),strain=Math.min(1,state.tension/65);
      wind.gain.gain.setTargetAtTime(.015+speed*speed*.14,at,.12);wind.filter.frequency.setTargetAtTime(500+speed*1600,at,.1);
      slide.gain.gain.setTargetAtTime(slip*speed*.2,at,.06);slide.filter.frequency.setTargetAtTime(900+slip*1300,at,.1);
      rope.gain.gain.setTargetAtTime(strain*.1,at,.06);rope.filter.frequency.setTargetAtTime(280+strain*450,at,.08);
    },
    hit(event){if(!ctx||!active||muted||ctx.state!=='running'||ctx.currentTime-lastHit<.045)return;lastHit=ctx.currentTime;
      const at=ctx.currentTime,strength=event.strength,duration=event.kind==='wall'?.07+strength*.08:.1+strength*.17;
      const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=wind.source.buffer;filter.type='lowpass';filter.frequency.value=event.kind==='wall'?2400:800+strength*1700;gain.gain.setValueAtTime(.12+strength*.55,at);gain.gain.exponentialRampToValueAtTime(.001,at+duration);src.connect(filter).connect(gain).connect(master);shots.add(src);src.onended=()=>{shots.delete(src);src.disconnect();filter.disconnect();gain.disconnect();};src.start();src.stop(at+duration);
      if(event.combo>1){const tone=ctx.createOscillator(),g=ctx.createGain();tone.frequency.value=440*2**((Math.min(5,event.combo)-1)/6);g.gain.setValueAtTime(.07,at);g.gain.exponentialRampToValueAtTime(.001,at+.12);tone.connect(g).connect(master);shots.add(tone);tone.onended=()=>{shots.delete(tone);tone.disconnect();g.disconnect();};tone.start();tone.stop(at+.12);}
      if(event.kind!=='wall'||strength>.35){const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(80+strength*80,at);osc.frequency.exponentialRampToValueAtTime(38,at+duration);g.gain.setValueAtTime(.1+strength*.3,at);g.gain.exponentialRampToValueAtTime(.001,at+duration);osc.connect(g).connect(master);shots.add(osc);osc.onended=()=>{shots.delete(osc);osc.disconnect();g.disconnect();};osc.start();osc.stop(at+duration);}
    },
    get state(){return {ready,muted,active,context:ctx?.state||'uninitialized'};},
  };
}
