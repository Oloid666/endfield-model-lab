// Original fan fiction. Ten years of overtime and the Administrator coda are
// this short story's setting; they are not presented as official game dialogue.
export const speakers={zhuang:'莊方宜',dragon:'龍泡泡'};
export const nodes={};
function sequence(prefix,segment,lines,next,extra={}){
  lines.forEach((line,index)=>{
    const [speaker,text,gesture='look',mood='calm']=line;
    const id=`${prefix}_${index}`;
    nodes[id]={id,segment,speaker,text,mood,gesture,next:index===lines.length-1?next:`${prefix}_${index+1}`,...(index===0?extra:{})};
  });
  return `${prefix}_0`;
}
sequence('opening','opening',[
  ['dragon','阿莊，下班了。','wave'],
  ['zhuang','我知道。剩下的回去做。','phone'],
  ['dragon','我的意思是——\n人也要下班。','point'],
  ['zhuang','你把我拉到便利店，\n就是為了說這個？','look'],
  ['dragon','不是。你午餐還沒吃。','point'],
  ['zhuang','現在吃，正好省一餐。','nod'],
  ['dragon','省下來的不是錢，\n是你的血條。','shake'],
  ['zhuang','……先看看有什麼。','look'],
], 'dinner_0',{scene:'store',caption:'雨替整座城按了暫停。她還沒學會。'});
sequence('dinner','dinner',[
  ['zhuang','便當、飯糰、熱飲……\n種類倒是齊全。','look'],
  ['dragon','晚餐而已，\n不用做品項分析。','shake'],
  ['zhuang','至少要看補給效率。','nod'],
  ['dragon','那先把「好好吃飯」算進去。','point'],
  ['zhuang','你今天話很多。','look'],
  ['dragon','怕你連「餓了」都排到明天。','look'],
  ['zhuang','……你幫我挑一份。','receive'],
], 'choose_dinner');
nodes.choose_dinner={id:'choose_dinner',segment:'choice',speaker:'zhuang',text:'今晚，吃什麼？',mood:'soft',gesture:'look',next:null,choices:[
  {id:'A',label:'熱便當＋湯',hint:'先吃頓熱的。',next:'branch_A_0',branch:'A'},
  {id:'B',label:'飯糰＋茶葉蛋',hint:'簡單吃一點。',next:'branch_B_0',branch:'B'},
  {id:'C',label:'甜點＋熱飲',hint:'先救心情。',next:'branch_C_0',branch:'C'},
]};
sequence('branch_A','branch',[
  ['zhuang','這份可以。帶回去，\n邊整理資料邊——','hold'],
  ['dragon','不可以。','point'],
  ['zhuang','我還沒說完。','look'],
  ['dragon','你後半句，我聽過太多次了。','shake'],
  ['zhuang','那等它熱好，先吃兩口。','nod'],
  ['dragon','先吃完。','point'],
  ['zhuang','你是在監工？','look'],
  ['dragon','對。今天工程叫\n「阿莊的胃」。','wave'],
  ['zhuang','……這個工程，不准催進度。','shake'],
  ['dragon','好。你慢慢吃。','happy'],
], 'checkout_0',{caption:'微波爐會停。她也可以。'});
sequence('branch_B','branch',[
  ['zhuang','這個方便。路上就能吃完。','hold'],
  ['dragon','然後另一隻手回訊息？','point'],
  ['zhuang','不影響。','nod'],
  ['dragon','上次你把包裝紙帶到會議上了。','look'],
  ['zhuang','只是還沒找到垃圾桶。','look'],
  ['dragon','你還對它說「這份再改一下」。','point'],
  ['zhuang','……那是對手機說的。','phone'],
  ['dragon','所以今天吃完再走。\n飯糰不接受加班。','shake'],
  ['zhuang','行。你也挑一個。','receive'],
  ['dragon','這句有效率，我喜歡。','happy'],
], 'checkout_0',{caption:'有些事情，不能總在路上完成。'});
sequence('branch_C','branch',[
  ['zhuang','晚餐吃這個？','hold'],
  ['dragon','先讓心情吃飯。','point'],
  ['zhuang','糖分太多。','shake'],
  ['dragon','你今天的苦，\n已經夠配三份了。','look'],
  ['zhuang','只拿一份。','receive'],
  ['dragon','嗯嗯。','nod'],
  ['zhuang','……再拿一份，給你。','receive'],
  ['dragon','那就是兩份！','happy'],
  ['zhuang','我的一份。你的一份。','point'],
  ['dragon','明白。這叫分工，\n不叫嘴硬。','hold'],
], 'checkout_0',{caption:'她把關心說得很輕。份量卻從來不少。'});
sequence('checkout','checkout',[
  ['zhuang','結完了。回去吧。','receive'],
  ['dragon','吃的買了，休息呢？','look'],
  ['zhuang','剛才等加熱，不就在休息？','nod'],
  ['dragon','你剛才把櫃台補貨順序\n看了一遍。','point'],
  ['zhuang','只是順眼看見。','look'],
  ['dragon','還用手機記下來了。','phone'],
  ['zhuang','……手機先收起來。','phone'],
], 'rain_0');
sequence('rain','rain',[
  ['dragon','雨變大了。剛好，等一等。','rain'],
  ['zhuang','我可以把這段水擋住。','point'],
  ['dragon','你連躲雨都要優化？','look'],
  ['zhuang','省得你淋濕。','look'],
  ['dragon','……那我站近一點就好了。','hold'],
  ['zhuang','不是讓你擠到餐袋上。','look'],
  ['dragon','它也是我們隊的。','hold'],
  ['zhuang','這裡不漏雨。就在這吃。','eat'],
  ['dragon','收到。今晚不趕路。','happy'],
], '$ending',{scene:'awning',caption:'雨還在下。終於有人不用趕路。'});
sequence('ending_A','ending',[
  ['zhuang','今天還剩一件事。','hold'],
  ['dragon','你又——','point'],
  ['zhuang','把這份吃完。','eat'],
  ['dragon','准了。這個任務\n可以慢慢做。','happy'],
], 'coda_offer',{ending:'一頓熱飯',caption:'結局一 · 一頓熱飯'});
sequence('ending_B','ending',[
  ['dragon','現在可以回去了？','look'],
  ['zhuang','等你吃完。','hold'],
  ['dragon','你不趕時間了？','look'],
  ['zhuang','包裝紙進不了會議室。\n你說的。','nod'],
], 'coda_offer',{ending:'等你吃完',caption:'結局二 · 等你吃完'});
sequence('ending_C','ending',[
  ['dragon','那份留給明天？','hold'],
  ['zhuang','不是。現在就吃。','eat'],
  ['dragon','難得你不把好事排到明天。','happy'],
  ['zhuang','再說話，你那份就要冷了。','look'],
], 'coda_offer',{ending:'現在就好',caption:'結局三 · 現在就好'});
nodes.coda_offer={id:'coda_offer',segment:'coda',speaker:'dragon',text:'雨還沒停。\n想再坐一會兒嗎？',mood:'soft',gesture:'look',next:null,choices:[
  {id:'listen',label:'再坐一會',hint:'聽她說起那個人。',next:'coda_0'},
  {id:'quiet',label:'安靜聽雨',hint:'有些陪伴，不必說出來。',next:'quiet_0'},
]};
sequence('quiet','coda',[
  ['zhuang','嗯。就一會兒。','nod'],
  ['dragon','這次的一會兒，\n不用計時。','hold'],
], '$idle',{caption:'今晚的空白，也算好好過完的一部分。'});
sequence('coda','coda',[
  ['dragon','你今天怎麼一直看門口？','look'],
  ['zhuang','雨大。看看有沒有人沒帶傘。','look'],
  ['dragon','是「有人」，\n還是管理員？','look'],
  ['zhuang','……他總說，很快就回來。','hold'],
  ['dragon','所以你把燈留著？','look'],
  ['zhuang','夜路長。\n總要有一處，讓人看得見。','look'],
  ['dragon','那你呢？這十年，\n總把自己的晚餐留到最後。','look'],
  ['zhuang','習慣等事情都妥當。','nod'],
  ['dragon','事情沒有都妥當的一天。\n你也得有人照顧。','hold'],
  ['zhuang','不是有你在嗎。','look'],
  ['dragon','……這句突然得很過分。','happy'],
  ['zhuang','那就記著。別讓我再說一次。','shake'],
], 'choose_message',{caption:'她很會等人。今晚，有人先等她吃完。'});
nodes.choose_message={id:'choose_message',segment:'coda',speaker:'zhuang',text:'如果他看見這裡的燈……',mood:'soft',gesture:'phone',next:null,choices:[
  {id:'send',label:'留一句問候',hint:'「雨大，記得吃飯。」',next:'message_send_0',memory:'一盞等你的燈'},
  {id:'keep',label:'先留在心裡',hint:'把手機放下，把今晚吃完。',next:'message_keep_0',memory:'今晚先照顧自己'},
]};
sequence('message_send','coda',[
  ['zhuang','「雨大，記得吃飯。」\n……這樣就好。','phone'],
  ['dragon','你可以順便說，你也在吃。','point'],
  ['zhuang','等吃完再說。\n這次要有證據。','eat'],
  ['dragon','好。我替你作證。','happy'],
], '$idle',{caption:'留一句問候，也替自己留一點暖。'});
sequence('message_keep','coda',[
  ['zhuang','先不寫了。','phone'],
  ['dragon','不等回覆？','look'],
  ['zhuang','等。但不必餓著等。','eat'],
  ['dragon','這句我要記下來。\n以後每天念給你聽。','happy'],
], '$idle',{caption:'想念沒有變少。只是今晚，她也在名單裡。'});

export const chatGroups=[
  [['zhuang','手機好像亮了。','phone'],['dragon','是便利店燈照上去。','look'],['zhuang','……嗯。','look'],['dragon','你別失望啊！','wave']],
  [['zhuang','下次可以提早十分鐘出來。','nod'],['dragon','很好。不要開會討論這件事。','point'],['zhuang','我沒打算。','look'],['dragon','那先把備忘錄關掉。','phone']],
  [['dragon','那台微波爐比你準時下班。','point'],['zhuang','它剛才還在轉。','look'],['dragon','但它會停！','wave']],
  [['zhuang','你今天到底算什麼職務？','look'],['dragon','晚餐監督員。','wave'],['zhuang','誰任命的？','look'],['dragon','你的胃，全票通過。','happy']],
  [['dragon','外面那灘水，看起來挺好玩。','point'],['zhuang','去吧。','nod'],['dragon','你不攔我？','look'],['zhuang','回來不准往我袖子上擦。','sleeve']],
  [['dragon','你是不是又在想工作的事？','look'],['zhuang','我在想明天吃什麼。','look'],['dragon','這個可以想！','happy']],
  [['dragon','如果管理員問你在哪？','look'],['zhuang','補給。','nod'],['dragon','如果問補什麼？','look'],['zhuang','晚餐。這次是真的。','hold']],
  [['zhuang','雨好像小了。','rain'],['dragon','嗯。你吃完了嗎？','look'],['zhuang','還沒有。','hold'],['dragon','那就再待一會。','nod']],
  [['dragon','你袖子上有一點水。','point'],['zhuang','沒事。','sleeve'],['dragon','這次真的不是我。','wave'],['zhuang','我知道。你不用報告兩遍。','look']],
  [['zhuang','這張椅子倒是結實。','look'],['dragon','坐著就好，不用驗收。','point'],['zhuang','職業習慣。','nod']],
  [['dragon','你覺得今晚有浪費時間嗎？','look'],['zhuang','沒有。','nod'],['dragon','回答好快。','happy'],['zhuang','這件事，不需要分析。','hold']],
  [['zhuang','熱飲還溫著。','hold'],['dragon','因為你終於沒等到它冷。','look'],['zhuang','……下次也這樣。','nod']],
  [['dragon','我們是不是忘了什麼？','look'],['zhuang','垃圾。待會我拿去丟。','point'],['dragon','好。不是工作就好。','happy']],
  [['dragon','你看，燈在水裡也亮著。','rain'],['zhuang','嗯。','look'],['dragon','今天可以只看漂亮的東西。','point'],['zhuang','我正在看。','look']],
  [['zhuang','你嘴邊有一點。','point'],['dragon','哪裡？','look'],['zhuang','別動。好了。','receive'],['dragon','……晚餐監督員也有福利。','happy']],
  [['dragon','明天還來？','look'],['zhuang','先把今天過完。','hold'],['dragon','這話從你嘴裡說出來真好。','happy']],
];
export const hotspotGroups={
  zhuang:[
    [['zhuang','叫我？','player'],['dragon','如果不是工作，她現在有空。','wave']],
    [['zhuang','衣角？剛才被風吹亂了。','sleeve'],['dragon','她會整理好。你先別催。','look']],
    [['zhuang','這裡還有位置。','receive'],['dragon','她的意思是，可以一起躲雨。','happy']],
  ],
  dragon:[
    [['dragon','別戳，我抱著晚餐！','hold'],['zhuang','那你先別滾。','look']],
    [['dragon','看，一點點精神就夠了。','happy'],['zhuang','不要把湯也晃出精神來。','point']],
    [['dragon','今天的我，值得一個點頭吧。','wave'],['zhuang','嗯。辛苦了。','nod'],['dragon','……你這樣我反而接不上話。','happy']],
  ],
  food:[
    [['zhuang','還熱著。要試一口嗎？','receive'],['dragon','她說一口，真的只算一口。','hold']],
    [['dragon','這份有主人了。','hold'],['zhuang','沒有人要搶你的。','look']],
    [['zhuang','袋子放裡面一點，別淋到。','hold'],['dragon','今晚的補給，優先保護。','point']],
  ],
  phone:[
    [['zhuang','只是看時間。','phone'],['dragon','那怎麼會開到工作群？','point']],
    [['dragon','螢幕又亮了。','phone'],['zhuang','……先翻過來。','phone'],['dragon','這個動作，我給滿分。','happy']],
    [['zhuang','沒有新訊息。','phone'],['dragon','那就先吃。有人回來，會看見燈。','look']],
  ],
  rain:[
    [['dragon','哇！這一滴專挑我！','rain'],['zhuang','站進來。這裡不漏。','receive']],
    [['zhuang','別伸手接，袖口會濕。','point'],['dragon','你看，我就說她管這個。','wave']],
    [['dragon','雨聲有點像在鼓掌。','rain'],['zhuang','給誰？','look'],['dragon','給終於坐下來的人。','happy']],
  ],
};

export const branchTitles={A:'一頓熱飯',B:'等你吃完',C:'現在就好'};
export const segmentExits={opening:'dinner_0',dinner:'choose_dinner',branch:'checkout_0',checkout:'rain_0',rain:'$ending',ending:'coda_offer',coda:'$idle'};
