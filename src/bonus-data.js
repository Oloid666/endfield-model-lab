import {sequences,chargeLines,captchaLines,connectionPrompts} from './mission-dialogue.js';

// Quotes come from the shipped script, so the classroom follows dialogue revisions.
const quote=(sequence,...indices)=>indices.map(i=>sequence[i].text).join('\n');
const lesson=(id,title,board,recap,analysis,aside,diagnosis,sources=[])=>({id,title,board,recap,analysis,aside,diagnosis,sources});
export const LESSONS=[
 lesson('general','將軍救急，救到哪一棚','爻光充能 → 武陵缺電',quote(sequences.energy,4,5),[
  '龍泡泡：各位同學，這句口號借用的是《崩壞：星穹鐵道》與 UGREEN 綠聯聯動宣傳中的「爻光充能手勢曲」。這裡的將軍是爻光，原本服務的是大家手上的充電設備；現在卻被唱進武陵電網告急的現場。',
  '龍泡泡：充電廣告的承諾，是幫手機補充電量。本劇的需求卻是替全城電網救急，服務範圍突然擴大了好幾個數量級。熟悉聯動的同學會認出口號，不熟悉的同學也能聽懂向將軍求救的誇張程度。',
  '龍泡泡：在武陵缺電的時候，搬出另一部作品的充電宣傳，再被阿莊當場抓到跨棚，形成了作品、商品與情境的三重錯位，令人忍俊不禁。請各位記住「你錯棚了」這句話，下一題還會用到。'
 ],'莊：所以我才說你錯棚。\n龍泡泡：下一題，請妳親自示範。','診斷：充電服務跨區營業。',[
  {label:'帕姆的收藏夾官方微博原文：爻光充能手勢曲（新浪轉載）',url:'https://www.sina.cn/news/detail/5311219349327437.html'},
  {label:'UGREEN 官方：爻光聯名系列',url:'https://www.ugreen.com/en-ca/pages/ugreen-honkai-star-rail'}]),
 lesson('mikoto','武陵的 Level 6','炮姐 Level 5 → 武陵自行加級',quote(sequences.last,3,4),[
  '龍泡泡：接著，剛才要求別人不要跨棚的莊，宣布自己是「武陵的 Level 6」。熟悉炮姐的同學應該已經產生反應。御坂美琴是《魔法禁書目錄》與《科學超電磁砲》系列的電擊使，常態設定為學園都市第三位的 Level 5。',
  '龍泡泡：炮姐透過電磁力發射硬幣，因此以「超電磁砲」聞名；本劇借用的是她的電擊形象、等級制度與砲擊聯想。阿莊把學園都市的分級搬到武陵，還自行往上加了一級。這屬於跨棚兼戰力膨脹，令人忍俊不禁。',
  '龍泡泡：前面先抓別人錯棚，後面自己宣布武陵開分校，規則的適用顯得相當有彈性。炮姐拿硬幣當彈丸，阿莊最後拿我當子彈，連彈藥規格都自行升級。等級可以加，講師的工傷也請一併處理。'
 ],'龍泡泡：妳剛才才說我錯棚！\n莊：武陵校區，現在招生。','診斷：武陵校區自行招生。',[
  {label:'動畫官方：御坂美琴為 Level 5 第三位、電擊使與超電磁砲',url:'https://toaru-project.com/index_3/chara/mikoto.html'}]),

 lesson('cargo','便當與共犯通知','補給 ≠ 無限責任',quote(sequences.cargo,1,3,6,8),[
  '故事先把任務縮得很小：龍泡泡只是想讓加班的莊吃晚餐，拍照也像普通的報平安。觀眾因此預期接下來會是照顧人的溫柔短劇。手機翻到上一張收據，才把同一個「幫忙拿東西」突然放大成一萬噸的責任。',
  '「都是補給」把便當和息壤塞進同一類，字面上勉強說得通，重量、風險與責任卻完全不同。莊用平靜口吻維持行政上的合理，龍泡泡則替觀眾說出兩者不能混為一談；越是淡定，落差越大。',
  '報平安照片後來又能證明店面原本長怎樣，簽收單與保單則一路留到戰損。這些物件不只是當下的包袱，也替後半段理賠鋪路。「外送單」變成「共犯通知」，把照顧者一步步推成背鍋人。'
 ],'莊：我有幫你拿便當。\n龍泡泡：所以我還得說謝謝？','死因：補給範圍解釋過寬。'),
 lesson('taste','莊的辦案標準','依法辦理 → 幫我找罪名',quote(sequences.briefing,1,2,3,4,9),[
  '前半段的「那有我的嗎」讓人以為莊在確認自己是否也是受害者；回答沒有之後，她卻先批評品味。辦案的公共理由與角色的私人在意同時露出來，但她還願意走正常流程，因此笑點仍留在言外。',
  '主嫌的自介說，十幾歲、幾百歲都可以是少女，唯獨三、四十歲不行。這種精準排除的嫌棄戳中莊的不悅，原本還願意移交查辦，下一秒就要求幫忙找罪名。案情沒有突然加重，辦案的心情倒是立刻變了。',
  '同一件案子，前一句還按正常流程走，後一句就急著補上一條罪名。私人不悅披上公務理由，弭弗一句「哪有這麼容易」又把程序拉回現實。辦案標準隨心情即時更新，卻仍維持一本正經的口氣，令人忍俊不禁。'
 ],'莊：教案裡沒有我的嗎？\n龍泡泡：有！所以不用增加課程了。','死因：講師求生欲介入。'),
 lesson('login','誰愛誰，誰親誰','登入 ≠ 表白；驗證 ≠ 免責',connectionPrompts.password.text+'\n'+quote(captchaLines,0,1,2)+'\n'+quote(chargeLines,0),[
  '帳號本來是電網接入的工具，love 和 kiss 卻把普通詞塊變成角色關係的試探。玩家故意按錯，換來「誰愛誰」「誰親誰」的反問，就像偷偷問了一個人物不願正面回答的問題。5201314 也沿用了常見的數字表意讀法。',
  '「我不是機器人」通常只是一個網站驗證步驟，龍泡泡卻先追問自己連人都不是該怎麼選。莊又把判準改成能不能背鍋，讓身分認證滑向責任認定；這也延續便當、簽收和最後當彈藥的受害者位置。',
  '充能演出突然停下來，鏡頭卻繼續圍著鞋子轉，導播的觀看偏好被角色當場吐槽。玩家按「再來一碗」，還能配合導播延長鏡頭，讓觀看本身也成了包袱。「舟禮」就是對這套觀看默契的戲稱：電可以晚點充，這一碗得先看完。'
 ],'龍泡泡：這裡我們分析一下誰親誰。\n莊：先分析一下誰要加班。','死因：登入頁出現感情欄位。'),
 lesson('pear','梨花的環境影響評估','0.5 lux → 物理移除',quote(sequences.briefing,11,12,14,15,16),[
  '照度數字、限值與事故原因欄讓情節看起來像正式稽查。接著卻用大規模火力處理極小的超標量，讓處置尺度與問題尺度完全失衡。0.5 lux 是本劇設定的差值，不是這間店所在地真實法規的判定。',
  '「事故原因先空著，我還沒動手」把未來事故當成可以預約的行政事項。該在事情發生後留下的紀錄，反而預先為即將發生的事準備好；語氣越像例行公事，觀眾越容易意識到事情不對。',
  '梨花同時是開場能看的街角景物、出手的理由與結尾的損失標準。莊最後只問梨花有沒有事，把建物與鄰居排除在視野之外。這個反覆出現的物件讓荒謬有前後呼應，而不只是隨口換一個藉口。'
 ],'莊：梨花沒事，這堂可以結束了。\n龍泡泡：便利店有事！','死因：評估範圍只剩一棵樹。'),
 lesson('compute','算力券蓋出的靶','細節越認真，拆除越心痛',quote(sequences.briefing,17,18,19),[
  '龍泡泡突然談雨棚、反射、貨架和算力券，跨出了角色所在的世界，直接評論這個網頁怎麼被做出來。觀眾知道自己正在看一個作品，於是能同時理解戲內的建物與戲外的製作成本。這就是打破第四面牆。',
  '前一句稱讚結構與氣氛，後一句才揭示這些細節最後都要當靶，先把價值抬高再拆掉。玩家已經看過店內道具和玻璃，所以這個心痛有具體對象，不是單純說「很貴」；細節本身成了包袱的鋪陳。',
  '「ChatGPT 6.0 Astra」和幾十張算力券是現有劇本的後設台詞。本課不把它當成經查證的產品版本、計價方式或實際帳單。能確認的製作事實是：這個場景有被精心安排，而主線又把同一個場景拆毀。'
 ],'莊：課桌也做得不錯。\n龍泡泡：那不是給妳選下一個目標！','死因：製作成本完成回收。'),
 lesson('microwave','三分鐘變零點三秒','W → MW：只多一個字母？',quote(sequences.credentials,0,1,6)+'\n'+quote(sequences['flashback-end'],2,3),[
  '原本的問題只是便當要等三分鐘，解法卻一路升級到接管全城電網。賽希把等待時間當作唯一目標，外部代價全部交給城市承擔，與莊為梨花處理整棟建築形成對照：兩人都非常有效率，只是範圍令人害怕。',
  'W 是瓦特，M 是百萬的 SI 前綴，所以 800 MW 是八億瓦，並不是一般家用微波爐的 800 W。畫面把 M 放大，是把原本容易略過的一個字母變成揭露：角色以為只是加熱便當，實際用了城市尺度的輸出。',
  '三分鐘變零點三秒先給出效率上的成功，忘記關保溫才揭露電量消失的原因，回頭回答現場為什麼沒電。「停服」「PHP 免金鑰」「0000」構成戲內的低門檻入侵笑話；沒有核實的停服事件與漏洞公告不當成真事介紹。'
 ],'賽希：有熱就好。\n龍泡泡：這句的主詞是便當，不是整座城市。','死因：單位未確認。',[{label:'BIPM：SI 單位與前綴（mega = 10⁶）',url:'https://www.bipm.org/en/measurement-units/si-prefixes'}]),
 lesson('insurance','保險與平安的一天','梨花無損失 ≠ 全場無損失',quote(chargeLines,2,7,8)+'\n'+quote(sequences.landing,0,1,2,3,4),[
  '莊以「雷是我打的」把主動行為說成符合天災條件，重點是角色在偷換分類，不是提供真實保險判定。前面保留的貨單、保單和照片因此一起回收：原本溫柔的報平安照，也變成建物存在過的證據。',
  '伺服器是原本目標，便利店和鄰棟卻跟著受損，最後只確認梨花安全就宣布無損失。觀眾看到的廣角與角色選擇承認的小範圍互相衝突。結尾保險歌詞把事情拉回誰承擔代價；本課不新增或擴寫原有歌詞。',
  '收尾借用了《飛天小女警》守護城市的結尾語感，畫面卻是剛被拆過的街區。形式像一天平安結束，內容完全不是，熟悉原作會多認出一層致敬，不熟悉也能看懂畫面與旁白的反差。至於歌詞改編的精確來源，未核實前不指定歌曲。'
 ],'莊：笑點死了，有保嗎？\n龍泡泡：手術成功，笑點死亡。請至隔壁辦理。','診斷完成。請至隔壁辦理。',[{label:'國立臺灣歷史博物館：飛天小女警的結尾語',url:'https://women.nmth.gov.tw/?p=1913'}]),
];
export const CLASS_MOTTO=['解釋笑話就像解剖青蛙。','你會更了解牠，但青蛙死了。','手術成功，笑點死亡。'];
export const LESSON_NOTES={
 general:['聯動角色：爻光','充手機 → 救全城電網','先記住：你錯棚了'],
 mikoto:['炮姐：御坂美琴，Level 5','莊：武陵 Level 6','先抓跨棚 → 自己開分校'],
 cargo:['拿便當 → 萬噸簽收','同樣叫補給，責任卻不同','報平安照片 → 戰損證據'],
 taste:['確認受害者 → 批評品味','私人冒犯 → 公共理由','前後態度，才是反轉'],
 pear:['超標 0.5 lux → 拆掉整棟','事情未發生，表格已備妥','只看梨花 → 宣布無損失'],
 login:['登入詞塊 → 感情試探','驗證身分 → 確認能背鍋','玩家加看 → 導播不下班'],
 compute:['角色突然談起製作成本','先稱讚細節 → 再拿來當靶','劇中台詞 ≠ 真實帳單'],
 microwave:['加熱便當 → 接管電網','800 W → 800 MW','效率成功 → 忘記關保溫'],
 insurance:['主動打雷 → 自稱天災','梨花安全 ≠ 建物無損','平安旁白 ↔ 毀損街景'],
};
const STORAGE_KEY='rainy711.bonus.v1';
export class BonusProgress{
 constructor(storage){this.storage=storage;this.data={unlocked:false,warned:false,read:[],finished:[],preference:'',reading:false,textSize:18,course:null,claimsSettled:false};this.taps=0;try{const d=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');if(d){this.data={unlocked:d.unlocked===true,warned:d.warned===true,read:Array.isArray(d.read)?d.read.filter(id=>LESSONS.some(l=>l.id===id)):[],finished:Array.isArray(d.finished)?d.finished.filter(id=>['A','B'].includes(id)):[],preference:['A','B','both'].includes(d.preference)?d.preference:'',reading:d.reading===true,textSize:[18,22,26].includes(d.textSize)?d.textSize:18,course:d.course&&typeof d.course==='object'?d.course:null,claimsSettled:d.claimsSettled===true};}}catch{/* Private browsing still works for this visit. */}}
 unlock(){if(this.data.unlocked)return false;this.data.unlocked=true;this.save();return true;}
 complete(phase){return phase==='complete'&&this.unlock();}
 save(){try{this.storage?.setItem(STORAGE_KEY,JSON.stringify(this.data));}catch{/* Keep the in-memory progress. */}}
 tap(sign,phase){if(!['ready','complete'].includes(phase)){this.taps=0;return false;}if(!sign){this.taps=0;return false;}if(this.data.unlocked)return false;this.taps++;if(this.taps===7){return this.unlock();}return false;}
 mark(kind,id){const values=kind==='read'?LESSONS.map(l=>l.id):kind==='finished'?['A','B']:[];if(!values.includes(id))return;if(!this.data[kind].includes(id))this.data[kind].push(id);this.save();}
}
export const CLASS_REQUIRED=4;
export const lessonCardCount=id=>{const l=LESSONS.find(l=>l.id===id);return l?1+l.analysis.length+l.aside.split('\n').length:0;};
// Completion belongs to this visit. Read history lives separately in BonusProgress.
export class ClassCourse{
 constructor(){this.reset();}
 reset(){this.steps={};this.stamped=false;}
 get completed(){return LESSONS.filter(l=>(this.steps[l.id]||0)>=lessonCardCount(l.id)).map(l=>l.id);}
 get completedCount(){return this.completed.length;}
 get eligible(){return this.completedCount>=CLASS_REQUIRED;}
 get percentage(){return Math.min(100,this.completedCount/CLASS_REQUIRED*100);}
 confirm(id,cursor){const max=lessonCardCount(id),seen=this.steps[id]||0;if(!max||!Number.isInteger(cursor)||cursor<0||cursor>=max||cursor>seen)return false;this.steps[id]=Math.max(seen,cursor+1);return true;}
 next(after=null){return LESSONS.find(l=>!this.completed.includes(l.id))?.id||LESSONS[(LESSONS.findIndex(l=>l.id===after)+1)%LESSONS.length].id;}
 certify(){if(!this.eligible)return false;this.stamped=true;return true;}
 get saved(){return {steps:{...this.steps},stamped:this.stamped};}
}
