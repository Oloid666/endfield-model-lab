export class RainAudio {
  async enable(){
    if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('此瀏覽器無法播放雨聲。');this.context=new Audio();
      const ctx=this.context,buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
      for(let i=0;i<data.length;i++){last=(last+Math.random()*.12-.06)*.98;data[i]=last;}
      this.source=ctx.createBufferSource();this.source.buffer=buffer;this.source.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2800;this.gain=ctx.createGain();this.gain.gain.value=.18;this.source.connect(filter);filter.connect(this.gain);this.gain.connect(ctx.destination);this.source.start();
    }
    await this.context.resume();
  }
  async disable(){await this.context?.suspend();}
  dispose(){this.source?.stop();this.context?.close();}
}
