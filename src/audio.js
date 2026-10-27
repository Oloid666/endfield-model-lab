export class RainAudio {
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.context&&this.master)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.1);}

  async enable(){
    if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('此瀏覽器無法播放雨聲。');this.context=new Audio();
      const ctx=this.context;this.master=ctx.createGain();this.master.gain.value=this.volume??.7;this.master.connect(ctx.destination);const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
      for(let i=0;i<data.length;i++){last=(last+Math.random()*.12-.06)*.98;data[i]=last;}
      this.source=ctx.createBufferSource();this.source.buffer=buffer;this.source.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2800;this.gain=ctx.createGain();this.gain.gain.value=.18;this.source.connect(filter);filter.connect(this.gain);this.gain.connect(this.master);this.source.start();
    }
    await this.context.resume();
  }
  hum(time){if(!this.context||this.context.state!=='running')return;const beat=Math.floor(time*2);if(beat===this.lastHum)return;this.lastHum=beat;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=[196,220,247,220,174,196,165,196][beat%8];g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.035,c.currentTime+.05);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.35);o.connect(g);g.connect(this.master);o.start();o.stop(c.currentTime+.4);o.onended=()=>{o.disconnect();g.disconnect();};}
  duck(active){if(!this.context||!this.gain)return;if(this.ducked===active)return;this.ducked=active;if(this.context&&this.gain)this.gain.gain.setTargetAtTime(active?.075:.18,this.context.currentTime,.25);}
  effect(kind){
    const c=this.context;if(!c||c.state!=='running')return;
    const now=c.currentTime,o=c.createOscillator(),g=c.createGain(),tone={shutter:[1400,600],flight:[420,180],'photo-send':[750,1100],'grid-connect':[130,500],shot:[95,40],handover:[500,330]}[kind];
    o.type=kind==='objection'?'sawtooth':kind==='stamp'?'triangle':'sine';o.frequency.setValueAtTime(kind==='objection'?220:kind==='stamp'?150:tone?.[0]||920,now);o.frequency.exponentialRampToValueAtTime(kind==='objection'?90:kind==='stamp'?55:tone?.[1]||650,now+.09);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(kind==='objection'?.065:kind==='stamp'?.14:.022,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+.13);o.connect(g);g.connect(this.master);o.start();o.stop(now+.15);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  async disable(){await this.context?.suspend();}
  dispose(){this.source?.stop();this.context?.close();}
}
