// Original fan fiction. These lines and the demolition episode are not official lore.
export const speakers={zhuang:'莊芳宜',dragon:'龍泡泡',mifoe:'弭弗',xaihi:'塞西',clerk:'店員',system:'天師樁終端',microwave:'微波爐',manager:'管理員'};

export const dinnerChoices=[
  {id:'A',label:'熱便當＋湯',hint:'先吃頓熱的。'},
  {id:'B',label:'飯糰＋茶葉蛋',hint:'簡單吃一點。'},
  {id:'C',label:'甜點＋熱飲',hint:'先救心情。'},
];

const lines=(prefix,items)=>items.map(([speaker,text,gesture='look',mood='calm',event=null],index)=>({
  id:`${prefix}_${prefix==='intro'?index+2:index}`,speaker,text,mood,gesture,event,next:index+1<items.length?`${prefix}_${prefix==='intro'?index+3:index+1}`:null,
}));

export const sequences={
  intro:lines('intro',[
        ['dragon','總算出來了。今天先好好吃飯。','point'],
    ['zhuang','你電話裡已經說三次了。','look'],
    ['dragon','怕妳掛掉又回去加班。','point'],
    ['zhuang','知道了，別忘了拿湯。','look'],
    ['dragon','所以我才親自來拖人。','shake'],
    ['zhuang','買了帶回去，邊整理資料——','phone'],
    ['dragon','先吃完，再整理。','shake'],
    ['dragon','妳留在這。我進去拿晚餐。','point'],
    ['zhuang','慢慢拿。','hold'],
    ['dragon','便當、湯。好，沒有公文。','look'],
    ['dragon','買完了，來吃吧。','hold'],
  ]),
  photoTalk:lines('photo_talk',[
    ['zhuang','龍泡泡，幫我拍一張。跟管理員報個平安，讓他知道我有好好吃飯。','phone'],
    ['dragon','懂了，證明妳真的有出來吃飯。','happy'],
    ['zhuang','相機給你。退遠一點，把店也拍進去。','receive','calm','camera-handover'],
  ]),
  photoCheck:lines('photo_check', [['zhuang','拍好了？放大看看。','player'],['dragon','確認妳有沒有眨眼？','look'],['zhuang','確認沒眨眼就發給管理員。讓他知道我有好好吃飯。','nod']]),
  observation:lines('observe',[
    ['dragon','唉……我以為接的是外送單，結果接的是共犯通知。','exhale','calm','phone-away'],
    ['zhuang','月光下的梨花真美。','look'],
    ['dragon','妳還有心情風花雪月。','look','calm','pear-tour'],
    ['zhuang','不是燈壞了。是伺服器拿整條街散熱。','goods'],
    ['dragon','你看三秒就知道？','look'],
    ['zhuang','加班十年，認得這種不讓人睡的光。','exhale'],
  ]),
  cargo:lines('cargo',[
    ['zhuang','怎麼跳到上一張了？','phone','calm','album-previous'],
    ['dragon','息壤簽收單……一萬噸？','point','calm','receipt-reveal'],
    ['zhuang','小聲一點。','look'],
    ['dragon','品名：土產。簽收人……龍泡泡？','shake'],
    ['dragon','我自己都還沒簽名過！','shake'],
    ['zhuang','我幫你拿便當。沒關係，不用緊張。攝影機拍到你簽收了。','hold'],
    ['zhuang','送到711。你隨貨簽收。','nod'],
    ['dragon','我答應幫妳拿的是便當，不是萬噸息壤！','shake'],
    ['zhuang','都是補給。','nod'],
    ['dragon','一個用餐袋，一個要寫供詞！','player','aside'],
    ['zhuang','單據收好。晚點有用。','phone'],
  ]),
  mealA:lines('meal_A',[
    ['zhuang','先吃頓熱的也好。','hold'],
    ['dragon','慢慢吃，今天不催進度。','nod'],
  ]),
  mealB:lines('meal_B',[
    ['zhuang','方便，路上就能吃完。','hold'],
    ['dragon','就在這吃。飯糰不接受加班。','point'],
  ]),
  mealC:lines('meal_C',[
    ['zhuang','只拿一份……再拿一份，給你。','receive'],
    ['dragon','明白，這叫分工。','happy'],
  ]),
  briefing:lines('briefing',[
    ['mifoe','頭，IP 追到了。','look','calm','server-closeup'],
    ['mifoe','大量散布盜版同人掃描檔的伺服器，\n就在梨花樹旁的便利店二樓。','point'],
    ['zhuang','那有我的嗎？','phone'],
    ['mifoe','查起來沒有。','look'],
    ['zhuang','真沒品味。移交巡衛隊，\n立案查辦。','shake'],
    ['mifoe','這流程要好幾年，\n提弗媽媽的人氣又要往前了……','look'],
    ['mifoe','這麼不急的嗎？','look'],
    ['mifoe','對了頭，主嫌自介寫：','look'],
    ['mifoe','「少女可以是十幾歲、幾百歲，\n但是就是不能三四十歲。」','look','evidence'],
    ['zhuang','……幫我找一條罪名。','shake','anger'],
    ['mifoe','哪有這麼容易……\n倒是有人投訴，這邊晚上太亮。','look'],
    ['mifoe','窗面照度 10.5 lux，本案限值 10 lux。\n超標 0.5 lux。','look'],
    ['zhuang','那就對了。光害超標。\n影響我旁邊的梨花。','point'],
    ['mifoe','附近沒有目擊者。','nod'],
    ['mifoe','頭，事故原因那欄怎麼填？','look'],
    ['zhuang','先空著。我還沒動手。','nod'],
    ['zhuang','直接物理移除。','point','calm','physical-removal'],
    ['dragon','什麼？這間可是 ChatGPT 6.0 Astra 蓋的 711。','look','aside'],
    ['dragon','建築的比例、玻璃的反射，連霓虹映在雨裡的顏色都挑過。結構漂亮，夜雨的氣氛也到位。審美在線。','look','aside'],
    ['dragon','燒了幾十張算力券，最後蓋出來當靶？？？？？','shake','aside'],
    ['zhuang','弭弗，接上全城的天師樁\n息壤超電容儲能模組。','point'],
    ['zhuang','龍泡泡，幫我登入。我準備一下。','point'],
    ['dragon','準備找人背鍋？','look'],
  ]),
  energy:lines('energy',[
    ['mifoe','頭，儲能快見底了。三樓已坍塌，外牆與樓板還在掉落。','look'],
    ['dragon','招牌說全天營業，現在連屋頂都下班了。','shake'],
    ['mifoe','確認：外牆與樓板碎片仍在落下。','look'],
    ['zhuang','能量怎麼可能用這麼快？','shake'],
    ['dragon','電量告急，將軍救急！將軍出手，萬事大吉～','happy'],
    ['zhuang','你錯棚了。','shake'],
    ['zhuang','以前堂堂武陵電，就算電一些奇怪的人三天三夜都沒問題啊。','look'],
    ['dragon','消失的電跑到哪裡去了呢？\n讓我們看一段 VCR。','player','aside','vcr-cue'],
  ]),
  flashback:lines('flashback',[
    ['xaihi','難得出門，晚餐應該快一點。','phone','thought','cctv-counter'],
    ['dragon','三小時前。塞西難得出門，來711買晚餐。','player','aside'],
    ['microwave','微波加熱：預計三分鐘。','look'],
    ['xaihi','人不該等便當。先查附近有沒有快一點的方法。','phone','thought'],
    ['xaihi','找到了，這方法蠻方便的。\n旁邊就有天師樁。接一下，借億點點。','phone','calm','xaihi-terminal'],
    ['dragon','那可是武陵電網，應該沒那麼容易進去吧？','player','aside'],
    ['xaihi','剛剛賽馬娘停服，順手看了個PHP漏洞。沒想到這麼快就用上。','phone'],
    ['dragon','遊戲才停服，妳就讓整條街停電？轉服成本也太高了吧。','player','aside'],
    ['xaihi','先接通管理終端。','phone'],
  ]),
  credentials:lines('credentials',[
    ['xaihi','這次最新的 PHP 2 Shell 漏洞，不愧是 9.2 分、Critical 級。金鑰一下就到手，管理員權限也一起開了。','phone','evidence'],
    ['system','金鑰已取得｜管理員權限已啟用。','look','evidence'],
    ['dragon','妳只是買個便當，怎麼連管理員都當上了？','player','aside'],
    ['xaihi','省掉等待。','nod'],
    ['dragon','妳省的是三分鐘，花的是整座城的電。','shake'],
    ['xaihi','三分鐘，改成零點三秒。','point','calm','microwave-closeup'],
  ]),
  'flashback-end':lines('flashback_end',[
    ['system','加熱完成：0.3 秒。','hold','calm','heated-meal'],
    ['xaihi','這樣就不用等了。','receive'],
    ['system','保溫不打烊。武陵電網持續買單。','look','calm','warm-setting'],
    ['dragon','她忘了關。\n我們剛充的電，正在替便當保溫。','player','aside'],
    ['dragon','難怪微波爐這麼黑。','look','aside','charred-microwave'],
  ]),
  last:lines('last',[
    ['dragon','伺服器呢？','look','calm','server-survives'],
    ['mifoe','運作正常，還在上傳。','look'],
    ['dragon','所以，最該壞的沒壞。','shake'],
    ['zhuang','今晚勢在必得。\n還剩最後一發子彈。','point'],
    ['zhuang','我可是武陵的Level 6。','point','calm','personal-charge'],
    ['dragon','妳剛才才說我錯棚！','shake'],
    ['dragon','最後一發子彈在哪裡？','look'],
    ['zhuang','就是你。','dragon','calm','dragon-capture'],
    ['dragon','……三小？','shake','shock'],
    ['dragon','不對吧？等一下，\n哪裡搞錯了。','shake','shock'],
    ['zhuang','方向沒錯。','nod'],
  ]),
  landing:lines('landing',[
    ['mifoe','伺服器粉碎。後面那棟有保隕石險嗎？','look'],
    ['zhuang','那棟跟我沒關係。','nod'],
    ['zhuang','梨花呢？','goods'],
    ['mifoe','沒事。','nod'],
    ['zhuang','那就是無損失。','nod'],
  ]),
};

export const chargeLines=lines('charge',[
  ['dragon','導播，合乎舟禮。鞋子拍完可以拍臉了。','player','aside'],
  ['mifoe','711 怎麼辦？','look'],
  ['zhuang','建物、貨物、天災打雷，都保了。','nod'],
  ['dragon','貨單、保單、現場照，妳一樣都沒少？','look'],
  ['zhuang','做事要留紀錄。','nod'],
  ['mifoe','附件填好了，只有事故時間空白。','look'],
  ['zhuang','等一下填。','nod'],
  ['mifoe','您現在算天災？','look'],
  ['zhuang','雷是我打的，條件符合。','point'],
  ['dragon','保險公司看完會先賠誰？','player','aside'],
]).map((line,index)=>({...line,at:index*3}));

// Terminal instructions share the same story clock and dialogue schema.
export const connectionPrompts={
  account:{id:'login_account',speaker:'zhuang',text:'帳號：endfield，底線，power。',mood:'calm',gesture:'point',event:'dictate-account',next:null},
  password:{id:'login_password',speaker:'zhuang',text:'密碼，五二零一三一四。',mood:'calm',gesture:'point',event:'dictate-password',next:null},
  lever:{id:'connect_lever',speaker:'zhuang',text:'最後，把拉桿往右拉到底。',mood:'calm',gesture:'point',event:'pull-lever',next:null},
  verified:{id:'captcha_verified',speaker:'dragon',text:'連機器人都得背鍋，這驗證倒是很武陵。',mood:'aside',gesture:'player',event:'captcha-pass',next:null},
  heat:{id:'heat_ready',speaker:'dragon',text:'跟著電流按節拍。短點，長按，別把店當烤箱。',mood:'aside',gesture:'player',event:'heat-control',next:null},
  returned:{id:'vcr_returned',speaker:'dragon',text:'回到現場。現在知道電去哪了。',mood:'aside',gesture:'look',event:'return-present',next:null},
};
export const captchaLines=lines('captcha',[
  ['zhuang','勾「我不是機器人」。','point'],
  ['dragon','我連人都不是，這題怎麼算？','look','aside'],
  ['zhuang','機器人是不能背鍋的，反正你可以。','nod'],
]).map((node,index)=>({...node,at:index*3}));
export const heatDemoLines=lines('heat_demo',[
  ['xaihi','先用額定功率。','phone'],
  ['dragon','微波爐的？','look'],
  ['system','武陵電網額定輸出。','look'],
  ['dragon','單位看一下啊！','shake'],
]).map((node,index)=>({...node,at:index*1.2}));
export const finalAmmoLines=lines('ammo',[
  ['dragon','不對吧？我現在是彈藥？','shake','shock'],
  ['dragon','等一下，哪裡搞錯了。','look','shock'],
  ['dragon','我說的不是方向——','shake','shock'],
]).map((node,index)=>({...node,at:index*3}));

export const chatterGroups=[
  lines('chat_0',[['zhuang','手機好像亮了。','phone'],['dragon','這次真的是手機。','look'],['zhuang','……先吃完。','hold']]),
  lines('chat_1',[['dragon','有人打算先把我拔出來嗎？','shake'],['zhuang','別動。我在看受力。','look']]),
  lines('chat_2',[['zhuang','梨花沒事。','goods'],['dragon','你的晚餐也沒事。','hold'],['zhuang','嗯。辛苦了。','nod']]),
  lines('chat_3',[['dragon','你今天到底算下班了嗎？','look'],['zhuang','現在算。','nod']]),
  lines('chat_4',[['zhuang','下次可以提早十分鐘出來。','nod'],['dragon','很好。不要開會討論。','point']]),
  lines('chat_5',[['dragon','你是不是又在想工作的事？','look'],['zhuang','我在想明天吃什麼。','hold'],['dragon','這個可以想。','happy']]),
  lines('chat_6',[['dragon','管理員問你在哪，怎麼說？','look'],['zhuang','補給。','nod'],['dragon','今晚這個詞的範圍有點大。','look']]),
  lines('chat_7',[['zhuang','雨好像小了。','rain'],['dragon','你吃完了嗎？','look'],['zhuang','還沒有。再待一會。','hold']]),
  lines('chat_8',[['dragon','你袖子上有花瓣。','point'],['zhuang','替我拿一下。','sleeve'],['dragon','這次不是我弄的。','look']]),
  lines('chat_9',[['zhuang','下次不讓你當子彈了。','dragon'],['dragon','這句請寫進規章。','shake']]),
  lines('chat_10',[['dragon','今晚有浪費時間嗎？','look'],['zhuang','沒有。','nod'],['dragon','回答好快。','happy']]),
  lines('chat_11',[['zhuang','熱飲還溫著。','hold'],['dragon','因為你終於肯現在喝了。','look']]),
  lines('chat_12',[['dragon','我們是不是忘了什麼？','look'],['zhuang','垃圾。待會我拿去丟。','point'],['dragon','好。不是工作就好。','happy']]),
  lines('chat_13',[['zhuang','這裡安靜多了。','goods'],['dragon','嗯。現在只有雨聲。','rain']]),
  lines('chat_14',[['dragon','你嘴邊有一點。','point'],['zhuang','哪裡？','look'],['dragon','別動。好了。','receive']]),
  lines('chat_15',[['zhuang','如果他回來，應該也餓了。','phone'],['dragon','那你先吃飽。才有力氣等他。','hold'],['zhuang','……嗯。','nod']]),
];

export const hotspots={
  zhuang:[
    lines('tap_zhuang_0',[['zhuang','叫我？','player'],['dragon','她現在有空。','wave']]),
    lines('tap_zhuang_1',[['zhuang','衣角被風吹亂了。','sleeve'],['dragon','讓她慢慢整理。','look']]),
    lines('tap_zhuang_2',[['zhuang','這裡還有位置。','receive'],['dragon','可以一起聽雨。','happy']]),
  ],
  dragon:[
    lines('tap_dragon_0',[['dragon','別戳。我現在是承重結構。','shake'],['zhuang','沒人在驗收你。','dragon']]),
    lines('tap_dragon_1',[['dragon','今天值得加餐吧？','happy'],['zhuang','值得。','nod']]),
    lines('tap_dragon_2',[['dragon','角上沒有冒煙了吧？','look'],['zhuang','沒有。很精神。','nod']]),
  ],
  food:[
    lines('tap_food_0',[['zhuang','還熱著。要試一口嗎？','receive'],['dragon','一口就好。','hold']]),
    lines('tap_food_1',[['dragon','這份有主人了。','hold'],['zhuang','沒有人搶你的。','dragon']]),
    lines('tap_food_2',[['zhuang','袋子放裡面，別淋到。','hold'],['dragon','今晚的補給，優先保護。','point']]),
  ],
  phone:[
    lines('tap_phone_0',[['zhuang','只是看時間。','phone'],['dragon','那怎麼開到工作群？','point']]),
    lines('tap_phone_1',[['dragon','螢幕又亮了。','phone'],['zhuang','……先翻過來。','phone']]),
    lines('tap_phone_2',[['zhuang','沒有新訊息。','phone'],['dragon','先吃。回來的人會找得到你。','hold']]),
  ],
  rain:[
    lines('tap_rain_0',[['dragon','哇，這一滴專挑我。','rain'],['zhuang','靠近一點。','receive']]),
    lines('tap_rain_1',[['zhuang','袖口會濕。','sleeve'],['dragon','知道，這次不往你身上擦。','look']]),
    lines('tap_rain_2',[['dragon','雨聲有點像鼓掌。','rain'],['zhuang','給誰？','look'],['dragon','給終於坐下來的人。','happy']]),
  ],
};

chatterGroups.push(
  lines('chat_hair',[['mifoe','報告要附現場照片。','look'],['zhuang','管理員會看到。挑張頭髮沒亂的。','phone'],['dragon','終於知道事情大了，結果是這個？','shake']]),
  lines('chat_insurance',[['mifoe','保險公司問，天災有沒有名字。','look'],['zhuang','有必要嗎？','look'],['dragon','有，還有工號。','point']]),
  lines('chat_photo',[['dragon','還好有拍，至少知道它原本長怎樣。','look'],['zhuang','傳給我。保險公司也要。','phone']]),
  lines('chat_inventory',[['mifoe','現場已經沒有庫存。','look'],['zhuang','帳實相符。','nod'],['dragon','妳對清庫存的理解有結構性問題。','shake']]),
  lines('chat_report',[['mifoe','報告標題怎麼寫？','look'],['zhuang','晚間環境改善。','nod'],['dragon','附件記得拍廣角。','point']]),
  lines('chat_claim',[['system','案件已受理。預估三至五個工作日。','look'],['dragon','伺服器妳等不了，這個倒願意等。','look'],['zhuang','這個會回款。','nod']]),
  lines('chat_manager',[['manager','看到了。晚餐記得趁熱吃。','phone'],['zhuang','……嗯。','hold'],['dragon','有沒有人注意到，我還沒吃？','look']]),
);
export const reactionPools={
  miss:['弭弗：未命中目標。周邊有意見。','龍泡泡：這發有景觀工程的潛力。','弭弗：目標沒事。路牌需要休假。'],
  hit:['弭弗：店面外牆破損，招牌正在鬆動。', '龍泡泡：我會一層一層撥開你的心 🎷','弭弗：請問公告寫設備維護嗎？莊：不會再壞。'],
  waiting:['龍泡泡：慢慢看。她還不知道自己下班了。','龍泡泡：這個角度不處理公文。莊：也沒有要處理。','龍泡泡：看夠再開始，晚餐會等你。'],
};
export const endingSong=['🎤🎵 保險～怎麼兩清，怎麼忍心','🎵 怎麼做回甲乙丙丁','🎤 難道非要耗盡所有委屈','🎵 再賠上這一條爛命'];
export const endingCaption='弭弗：就這樣，武陵又平安地度過了一天。\n感謝飛天小女警的努力。\nFin.';

export const storyQuote=(sequence,...ids)=>ids.map(id=>sequences[sequence].find(n=>n.id===id)?.text||'').join('\n');

// Stable cue identifiers survive editorial removals and inserted shots.
function relink(items){items.forEach((n,i)=>n.next=items[i+1]?.id||null);return items;}
sequences.intro=relink(sequences.intro.filter(n=>!['intro_6','intro_7','intro_8'].includes(n.id)));
sequences.energy=relink(sequences.energy.filter(n=>n.id!=='energy_2'));
sequences.observation.splice(3,0,{id:'observe_window',speaker:'dragon',text:'對了，二樓中間那扇窗戶怎麼有點陰森？',gesture:'point',mood:'calm',event:'server-closeup'});relink(sequences.observation);
