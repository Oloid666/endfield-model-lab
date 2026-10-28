// The opening advances only while its rendered frame is visible.
export const OPENING_LINES = [
  ['歡迎來到溫馨雨夜。', 1.8],
  ['歡迎來到溫馨雨夜。（？）', .8],
  ['等一下，主角還沒下班。', 2],
  ['龍泡泡：阿莊，下班了。', 2],
  ['龍泡泡：又說再五分鐘？妳上次也是這樣說。', 2.8],
  ['龍泡泡：晚餐我來買。今天一定要把妳請出來。', 3],
];
export const WAITING_LINES = [
  '龍泡泡：五分鐘是她的時間單位。', '龍泡泡：湯還熱著，放心。',
  '龍泡泡：我有在聽，沒有偷睡。', '龍泡泡：妳看，我連袋子都拿好了。',
  '龍泡泡：先把工作群放旁邊。', '龍泡泡：今天的行程只剩吃飯。',
  '龍泡泡：雨有點大，站近一點。', '龍泡泡：門口等妳，不催。真的。',
];
export class OpeningTimeline {
  constructor(){this.time=0;this.index=0;this.age=0;this.ready=false;this.final=false;this.done=false;this.reaction=-1;this.reactionAge=0;this.waited=0;this.cooldown=0;this.count=0;}
  tick(dt,visible=true){
    if(!visible||this.done)return;dt=Math.max(0,Math.min(.25,dt));this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    if(this.index<OPENING_LINES.length){this.age+=dt;if(this.age+1e-8>=OPENING_LINES[this.index][1]){this.age=0;this.index++;}return;}
    if(this.reaction>=0){this.reactionAge+=dt;if(this.reactionAge>=1.8){this.reaction=-1;this.waited=0;}return;}
    if(this.ready){this.final=true;this.age+=dt;this.done=this.age>=2.5;return;}
    this.waited+=dt;if(this.waited>=15)this.interact();
  }
  interact(){if(!this.idle||this.cooldown>0||this.ready)return false;this.reaction=this.count++%WAITING_LINES.length;this.reactionAge=0;this.cooldown=2;return true;}
  get idle(){return this.index>=OPENING_LINES.length&&!this.final&&this.reaction<0;}
  get text(){return OPENING_LINES[this.index]?.[0]??(this.final?'龍泡泡：好，說定了。先下班，再吃飯。':this.reaction>=0?WAITING_LINES[this.reaction]:'');}
  get phone(){return this.index>=3&&(!this.final||this.age<1.5);}
}
