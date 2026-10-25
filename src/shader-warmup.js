// Precompile with the live scene's light/environment configuration. No second renderer.
export class ShaderWarmup {
  constructor(renderer,scene,camera){
    this.renderer=renderer;this.scene=scene;this.camera=camera;this.queue=Promise.resolve();this.disposed=false;this.generation=0;
    this.pending=0;this.completed=[];this.stage='idle';this.durationMs=0;this.error=null;
    this.parallel=!!renderer.getContext().getExtension('KHR_parallel_shader_compile');
  }
  prepare(object=this.scene,label='scene'){
    const generation=this.generation;this.pending++;
    const run=async()=>{
      if(this.disposed||generation!==this.generation)return false;
      if(this.renderer.getContext().isContextLost()){this.stage='context-lost';return false;}
      this.stage=label;this.error=null;const started=performance.now();
      try{
        if(typeof this.renderer.compileAsync==='function')await this.renderer.compileAsync(object,this.camera,this.scene);
        else this.renderer.compile(object,this.camera,this.scene);
        if(this.disposed||generation!==this.generation)return false;
        this.durationMs=performance.now()-started;
        if(!this.completed.includes(label))this.completed.push(label);
        this.stage='ready';return true;
      }catch(error){this.stage='failed';this.error=error.message;throw error;}
    };
    const task=this.queue.catch(()=>{}).then(run).finally(()=>{this.pending--;});
    this.queue=task;return task;
  }
  invalidate(){this.generation++;this.queue=Promise.resolve();this.completed.length=0;this.stage='idle';this.error=null;}
  get state(){return {stage:this.stage,pending:this.pending,parallel:this.parallel,completed:[...this.completed],durationMs:Math.round(this.durationMs),programs:this.renderer.info.programs?.length||0,error:this.error};}
  dispose(){this.disposed=true;this.generation++;}
}
