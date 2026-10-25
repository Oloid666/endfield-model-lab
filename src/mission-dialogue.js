// Original fan fiction. These lines and the demolition episode are not official lore.
export const speakers={zhuang:'莊芳宜',dragon:'龍泡泡',mifoe:'弭弗',xaihi:'賽希',clerk:'店員',system:'天師樁終端',manager:'管理員'};

export const dinnerChoices=[
  {id:'A',label:'熱便當＋湯',hint:'先吃頓熱的。'},
  {id:'B',label:'飯糰＋茶葉蛋',hint:'簡單吃一點。'},
  {id:'C',label:'甜點＋熱飲',hint:'先救心情。'},
];

const lines=(prefix,items)=>items.map(([speaker,text,gesture='look',mood='calm',event=null],index)=>({
  id:`${prefix}_${index}`,speaker,text,mood,gesture,event,next:index+1<items.length?`${prefix}_${index+1}`:null,
}));

export const sequences={
  intro:lines('intro',[
    ['dragon','阿莊，先吃飯。','point'],
    ['zhuang','買了帶回去，邊整理資料——','phone'],
    ['dragon','先吃完，再整理。','shake'],
    ['clerk','莊小姐，今天也要打統編嗎？','look'],
    ['zhuang','晚餐不用。','hold'],
    ['dragon','所以之前那些有用？','look'],
    ['manager','還在忙？記得吃飯。','phone'],
    ['zhuang','知道了。','phone'],
    ['dragon','你對他倒是回得很快。','look'],
    ['zhuang','拍張照。省得他擔心。','player'],
  ]),
  observation:lines('observe',[
    ['dragon','二樓那間房，怎麼有點陰森？','point','calm','server-closeup'],
    ['zhuang','不是燈壞了。是伺服器拿整條街散熱。','goods'],
    ['dragon','你看三秒就知道？','look'],
    ['zhuang','加班十年，認得這種不讓人睡的光。','exhale'],
  ]),
  cargo:lines('cargo',[
    ['dragon','息壤……一萬噸？','point','calm','cargo-closeup'],
    ['zhuang','小聲一點。','look'],
    ['dragon','這麼大量的東西，小聲就能處理？','shake'],
    ['zhuang','至少不要替它廣播。','nod'],
    ['dragon','品名寫「土產」？','point'],
    ['zhuang','武陵產的。','nod'],
    ['dragon','每個字都對，合起來很不對。','shake'],
    ['dragon','經辦人和核准人，都是莊芳宜？','point'],
    ['zhuang','減少溝通成本。','nod'],
    ['dragon','隨貨人員……龍泡泡？我是跟來吃飯，不是跟案！','shake'],
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
    ['mifoe','頭，IP 追到了。','look'],
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
    ['mifoe','人都撤了，證據也存了。','nod'],
    ['mifoe','店員問，這算天災假嗎？','look'],
    ['zhuang','看保險怎麼認定。','nod'],
    ['zhuang','直接物理移除。','point','calm','physical-removal'],
    ['dragon','什麼？這間可是\nChatGPT 6.0 Astra 蓋的 711。','look','aside'],
    ['dragon','燒了十張重置券的算力，\n結果蓋出來當靶？？？？？','shake','aside'],
    ['zhuang','弭弗，接上全城的天師樁\n息壤超電容儲能模組。','point'],
    ['zhuang','我在忙。龍泡泡，幫我連線。','point','calm','connection-board'],
  ]),
  energy:lines('energy',[
    ['mifoe','頭，能量用完了。戰損報告：\n店體解體，三樓去向不明。','look'],
    ['zhuang','能量怎麼可能用這麼快？','shake'],
    ['zhuang','電隊是越來越多人，\n但還是撐得住啊。','look'],
    ['dragon','消失的電跑到哪裡去了呢？\n讓我們看一段 VCR。','player','aside','vcr-cue'],
  ]),
  flashback:lines('flashback',[
    ['clerk','加熱要等三分鐘。','look','calm','cctv-counter'],
    ['xaihi','三分鐘。足夠調整一次供電。','phone','thought'],
    ['xaihi','便當不該等人。電網應該配合便當。','phone','thought'],
    ['xaihi','接一下武陵電網。只是借一點電。','phone','calm','xaihi-terminal'],
    ['dragon','各位，她嫌午餐太慢，所以決定改造全城電網。','player','aside'],
    ['xaihi','先接通管理終端。','phone'],
  ]),
  credentials:lines('credentials',[
    ['system','login.php：驗證結果異常。管理頁已開啟。','look'],
    ['system','管理密碼：0000。','look','evidence'],
    ['xaihi','四位。輸入效率很好。','nod'],
    ['dragon','妳是天才，不要連這個也稱讚。','shake'],
    ['dragon','PHP 寬鬆比較出了問題。門鎖壞了，鑰匙還貼門上。','player','aside'],
    ['xaihi','三分鐘，改成零點三秒。','point','calm','microwave-closeup'],
  ]),
  'flashback-end':lines('flashback_end',[
    ['system','加熱完成：0.3 秒。','hold','calm','heated-meal'],
    ['xaihi','這樣就不用等了。','receive'],
    ['system','極速保溫：持續運轉。\n儲能網分流：已保留。','look','calm','warm-setting'],
    ['dragon','她忘了關。\n我們剛充的電，正在替便當保溫。','player','aside'],
    ['dragon','難怪微波爐這麼黑。','look','aside','charred-microwave'],
  ]),
  last:lines('last',[
    ['dragon','伺服器呢？','look'],
    ['mifoe','運作正常，還在上傳。','look'],
    ['dragon','所以，最該壞的沒壞。','shake'],
    ['zhuang','今晚勢在必得。\n還剩最後一發子彈。','point'],
    ['dragon','哪裡？','look'],
    ['zhuang','就是你。','dragon'],
    ['dragon','……三小？','shake','shock'],
    ['dragon','不對吧？等一下，\n哪裡搞錯了。','shake','shock'],
    ['zhuang','方向沒錯。','nod'],
  ]),
  landing:lines('landing',[
    ['mifoe','伺服器粉碎。鄰居家也多了一個洞。','nod'],
    ['zhuang','梨花呢？','goods'],
    ['mifoe','沒事。','nod'],
    ['zhuang','那就是無損失。','nod'],
  ]),
};

export const chargeLines=lines('charge',[
  ['mifoe','儲能網接通，開始充電。','look'],
  ['mifoe','711 怎麼辦？','look'],
  ['zhuang','有保天災打雷險。我辦的。','nod'],
  ['dragon','妳怎麼連這個都準備了？','look'],
  ['zhuang','萬噸息壤經過這裡，總要有保障。','nod'],
  ['dragon','正常人是先找倉庫。','shake'],
  ['zhuang','這裡二十四小時有人。','nod'],
  ['mifoe','您現在算天災？','look'],
  ['zhuang','雷是我打的，條件符合。','point'],
  ['dragon','這個回答，保險公司聽得到嗎？','player','aside'],
]).map((line,index)=>({...line,at:index*3}));

// Terminal instructions share the same story clock and dialogue schema.
export const connectionPrompts={
  account:{id:'login_account',speaker:'zhuang',text:'帳號：endfield，底線，power。',mood:'calm',gesture:'point',event:'dictate-account',next:null},
  password:{id:'login_password',speaker:'zhuang',text:'密碼，五二零一三一四。',mood:'calm',gesture:'point',event:'dictate-password',next:null},
  lever:{id:'connect_lever',speaker:'zhuang',text:'最後，把拉桿往右拉到底。',mood:'calm',gesture:'point',event:'pull-lever',next:null},
  verified:{id:'captcha_verified',speaker:'dragon',text:'原來武陵資安是國文題。',mood:'aside',gesture:'player',event:'captcha-pass',next:null},
  heat:{id:'heat_ready',speaker:'dragon',text:'跟著電流按節拍。短點，長按，別把店當烤箱。',mood:'aside',gesture:'player',event:'heat-control',next:null},
  returned:{id:'vcr_returned',speaker:'dragon',text:'回到現場。現在知道電去哪了。',mood:'aside',gesture:'look',event:'return-present',next:null},
};
export const captchaLines=lines('captcha',[
  ['zhuang','勾「我不是機器人」。','point'],
  ['dragon','我連人都不是，這題怎麼算？','look','aside'],
  ['zhuang','它問的是機器人。勾。','nod'],
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
  hit:['弭弗：三樓已移除。去向仍在追蹤。','龍泡泡：原來「拆開來看」是這個意思。','弭弗：請問公告寫設備維護嗎？莊：不會再壞。'],
  waiting:['龍泡泡：慢慢看。她還不知道自己下班了。','龍泡泡：這個角度不處理公文。莊：也沒有要處理。','龍泡泡：看夠再開始，晚餐會等你。'],
};
export const endingCaption='武陵城，又過了平安的一天。';
