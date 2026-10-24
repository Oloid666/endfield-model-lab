// Original fan fiction. These lines and the demolition episode are not official lore.
export const speakers={zhuang:'莊芳宜',dragon:'龍泡泡',mifoe:'弭弗'};

export const dinnerChoices=[
  {id:'A',label:'熱便當＋湯',hint:'先吃頓熱的。'},
  {id:'B',label:'飯糰＋茶葉蛋',hint:'簡單吃一點。'},
  {id:'C',label:'甜點＋熱飲',hint:'先救心情。'},
];

const lines=(prefix,items)=>items.map(([speaker,text,gesture='look',mood='calm'],index)=>({
  id:`${prefix}_${index}`,speaker,text,mood,gesture,next:index+1<items.length?`${prefix}_${index+1}`:null,
}));

export const sequences={
  intro:lines('intro',[
    ['dragon','阿莊，先吃飯。','point'],
    ['zhuang','買了帶回去，邊整理資料——','phone'],
    ['dragon','先吃完，再整理。','shake'],
    ['zhuang','……你幫我挑。','goods'],
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
    ['dragon','二樓那間房，是不是一直在眨眼？','point'],
    ['zhuang','不是燈壞了。是有人拿整條街散熱。','goods'],
    ['dragon','你看三秒就知道？','look'],
    ['zhuang','加班十年，認得這種不讓人睡的光。','exhale'],
    ['mifoe','頭，IP 追到了。','look'],
    ['mifoe','大量散布盜版同人掃描檔的伺服器，\n就在梨花樹旁的便利店二樓。','point'],
    ['zhuang','那有我的嗎？','phone'],
    ['mifoe','查起來沒有。','look'],
    ['zhuang','真沒品味。沒有的就提交\n電信警察審判流程。','shake'],
    ['mifoe','這流程要好幾年，\n提弗媽媽的人氣又要往前了……','look'],
    ['mifoe','這麼不急的嗎？','look'],
    ['mifoe','對了頭，主嫌自介寫：','look'],
    ['mifoe','「少女可以是十幾歲、幾百歲，\n但是就是不能三四十歲。」','look','evidence'],
    ['zhuang','……幫我找一條罪名。','shake','anger'],
    ['mifoe','哪有這麼容易……\n倒是有人投訴，這邊晚上太亮。','look'],
    ['mifoe','窗面照度 10.5 lux，本案限值 10 lux。\n超標 0.5 lux。','look'],
    ['zhuang','那就對了。光害超標。\n影響我旁邊的梨花。','point'],
    ['mifoe','人員已撤離，證據已備份。','nod'],
    ['zhuang','直接物理移除。弭弗，幫我接上全城的\n天師樁息壤超電容儲能模組。','point'],
    ['zhuang','開始充電，三十秒後準備砲擊。','point'],
  ]),
  last:lines('last',[
    ['mifoe','頭，能量用完了。砲擊如何？','look'],
    ['mifoe','戰損分析：三樓失聯，店體解體。\n散熱改善百分之百。','look'],
    ['dragon','所以，我們只是幫它拆了機房？','look'],
    ['mifoe','伺服器還在上傳。怎麼辦？','look'],
    ['zhuang','今晚勢在必得。\n還剩最後一發子彈。','point'],
    ['dragon','哪裡？','look'],
    ['zhuang','就是你。','dragon'],
    ['dragon','……三小？','shake','shock'],
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
  ['zhuang','沒關係，它有保天災打雷險。','nod'],
  ['mifoe','您現在算天災？','look'],
  ['zhuang','雷是我打的，條件符合。','point'],
  ['mifoe','理賠原因怎麼填？','look'],
  ['zhuang','局部雷雨。','nod'],
  ['mifoe','範圍是整棟。','look'],
  ['zhuang','武陵的局部。避開梨花。','point'],
  ['mifoe','九成。蓄電天師，準備就緒。','look'],
]).map((line,index)=>({...line,at:index*3}));

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

export const endingCaption='武陵城，又過了平安的一天。';
