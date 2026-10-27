import {sequences,chargeLines,captchaLines,connectionPrompts} from './mission-dialogue.js';

// Quotes come from the shipped script, so the classroom follows dialogue revisions.
const quote=(sequence,...indices)=>indices.map(i=>sequence[i].text).join('\n');
const lesson=(id,title,board,recap,analysis,aside,diagnosis,sources=[])=>({id,title,board,recap,analysis,aside,diagnosis,sources});
export const LESSONS=[
 lesson('cargo','便當與共犯通知','補給 ≠ 無限責任',quote(sequences.cargo,1,3,6,8),[
  '故事先把任務縮得很小：龍泡泡只是想讓加班的莊吃晚餐，拍照也像普通的報平安。觀眾因此預期接下來會是照顧人的溫柔短劇。手機翻到上一張收據，才把同一個「幫忙拿東西」突然放大成一萬噸的責任。',
  '「都是補給」把便當和息壤塞進同一類，字面上勉強說得通，重量、風險與責任卻完全不同。莊用平靜口吻維持行政上的合理，龍泡泡則替觀眾說出兩者不能混為一談；越是淡定，落差越大。',
  '報平安照片後來又能證明店面原本長怎樣，簽收單與保單則一路留到戰損。這些物件不只是當下的包袱，也替後半段理賠鋪路。「外送單」變成「共犯通知」，把照顧者一步步推成背鍋人。'
 ],'莊：我有幫你拿便當。\n龍泡泡：所以我還得說謝謝？','死因：補給範圍解釋過寬。'),
 lesson('taste','莊的辦案標準','依法辦理 → 幫我找罪名',quote(sequences.briefing,1,2,3,4,9),[
  '前半段的「那有我的嗎」讓人以為莊在確認自己是否也是受害者；回答沒有之後，她卻先批評品味。辦案的公共理由與角色的私人在意同時露出來，但她還願意走正常流程，因此笑點仍留在言外。',
  '主嫌的年齡自介一出現，莊立刻要人找罪名。這不是新證據讓案情加重，而是同一個人突然不想再等。觀眾能比較前後態度，察覺私人不悅如何披上正式公文的外衣；弭弗的遲疑則把這件事點破。',
  '解析可以確定的是這段台詞安排出的冒犯與反應，不能據此宣布角色的官方年齡，也不能把提弗人氣或同人伺服器當成官方事件。笑點靠劇內的態度轉折成立，不需要捏造一則真實社群新聞。'
 ],'莊：教案裡沒有我的嗎？\n龍泡泡：有！所以不用增加課程了。','死因：講師求生欲介入。'),
 lesson('pear','梨花的環境影響評估','0.5 lux → 物理移除',quote(sequences.briefing,11,12,14,15,16),[
  '照度數字、限值與事故原因欄讓情節看起來像正式稽查。接著卻用大規模火力處理極小的超標量，讓處置尺度與問題尺度完全失衡。0.5 lux 是本劇設定的差值，不是這間店所在地真實法規的判定。',
  '「事故原因先空著，我還沒動手」把未來事故當成可以預約的行政事項。該在事情發生後留下的紀錄，反而預先為即將發生的事準備好；語氣越像例行公事，觀眾越容易意識到事情不對。',
  '梨花同時是開場能看的街角景物、出手的理由與結尾的損失標準。莊最後只問梨花有沒有事，把建物與鄰居排除在視野之外。這個反覆出現的物件讓荒謬有前後呼應，而不只是隨口換一個藉口。'
 ],'莊：梨花沒事，這堂可以結束了。\n龍泡泡：便利店有事！','死因：評估範圍只剩一棵樹。'),
 lesson('login','誰愛誰，誰親誰','登入 ≠ 表白；驗證 ≠ 免責',connectionPrompts.password.text+'\n'+quote(captchaLines,0,1,2)+'\n'+quote(chargeLines,0),[
  '帳號本來是電網接入的工具，love 和 kiss 卻把普通詞塊變成角色關係的試探。玩家故意按錯，換來「誰愛誰」「誰親誰」的反問，就像偷偷問了一個人物不願正面回答的問題。5201314 也沿用了常見的數字表意讀法。',
  '「我不是機器人」通常只是一個網站驗證步驟，龍泡泡卻先追問自己連人都不是該怎麼選。莊又把判準改成能不能背鍋，讓身分認證滑向責任認定；這也延續便當、簽收和最後當彈藥的受害者位置。',
  '鞋子環繞暫停了本來應該繼續的充能演出，導播的鏡頭偏好直接被角色吐槽。玩家按「再來一碗」還能主動延長，於是觀看本身也成了包袱。「舟禮」在這裡作為社群口吻使用，未核實的最早出處不另編來源。'
 ],'龍泡泡：這裡我們分析一下誰親誰。\n莊：先分析一下誰要加班。','死因：登入頁出現感情欄位。'),
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
 lesson('ammo','武陵 Level 6','最後一發：就是你',quote(sequences.energy,3,4)+'\n'+quote(sequences.last,3,4,5,7),[
  '龍泡泡先用「將軍救急」的口號替電量告急解圍，被莊指出錯棚。後來莊自己又搬出 Level 6，等於建立規矩的人先違反規矩。即使不熟悉外部作品，也能從前後兩句看懂這個雙重標準。',
  'Level 6 是《科學超電磁砲》系列確實使用的名詞；放進武陵並不表示莊在原作真的具有這個等級，而是此劇借用另一部作品的語彙抬高出力。將軍口號與「最後一發子彈」的精確外部出處若未核實，僅分析本劇用法。',
  '故事前面讓龍泡泡拿便當、簽收、登入與背鍋，最後連彈藥都由他提供，是同一種被徵用的極端終點。「哪裡搞錯了」問的是身分和處境，莊卻回答方向沒錯，故意把求救理解成彈道校正。'
 ],'龍泡泡：我不是要聽彈道分析。\n莊：那你選錯教室了。','死因：講師同時是教具。',[{label:'《科學超電磁砲》官方：第 22 話 Level 6',url:'https://toaru-project.com/railgun/story/22.html'}]),
 lesson('insurance','保險與平安的一天','梨花無損失 ≠ 全場無損失',quote(chargeLines,2,7,8)+'\n'+quote(sequences.landing,0,1,2,3,4),[
  '莊以「雷是我打的」把主動行為說成符合天災條件，重點是角色在偷換分類，不是提供真實保險判定。前面保留的貨單、保單和照片因此一起回收：原本溫柔的報平安照，也變成建物存在過的證據。',
  '伺服器是原本目標，便利店和鄰棟卻跟著受損，最後只確認梨花安全就宣布無損失。觀眾看到的廣角與角色選擇承認的小範圍互相衝突。結尾保險歌詞把事情拉回誰承擔代價；本課不新增或擴寫原有歌詞。',
  '收尾借用了《飛天小女警》守護城市的結尾語感，畫面卻是剛被拆過的街區。形式像一天平安結束，內容完全不是，熟悉原作會多認出一層致敬，不熟悉也能看懂畫面與旁白的反差。至於歌詞改編的精確來源，未核實前不指定歌曲。'
 ],'龍泡泡：手術成功，笑點死了。\n莊：有保嗎？\n龍泡泡：……下課。','診斷完成。請至隔壁辦理。',[{label:'國立臺灣歷史博物館：飛天小女警的結尾語',url:'https://women.nmth.gov.tw/?p=1913'}]),
];
export const CLASS_MOTTO=['解釋笑話就像解剖青蛙。','你會更了解牠，但青蛙死了。','手術成功，笑點死亡。'];
export const LESSON_NOTES={
 cargo:['拿便當 → 萬噸簽收','同樣叫補給，責任卻不同','報平安照片 → 戰損證據'],
 taste:['確認受害者 → 批評品味','私人冒犯 → 公共理由','前後態度，才是反轉'],
 pear:['超標 0.5 lux → 拆掉整棟','事情未發生，表格已備妥','只看梨花 → 宣布無損失'],
 login:['登入詞塊 → 感情試探','驗證身分 → 確認能背鍋','玩家加看 → 導播不下班'],
 compute:['角色突然談起製作成本','先稱讚細節 → 再拿來當靶','劇中台詞 ≠ 真實帳單'],
 microwave:['加熱便當 → 接管電網','800 W → 800 MW','效率成功 → 忘記關保溫'],
 ammo:['先說錯棚 → 自己也跨棚','借用 Level 6，抬高出力','徵用幫手 → 徵用彈藥'],
 insurance:['主動打雷 → 自稱天災','梨花安全 ≠ 建物無損','平安旁白 ↔ 毀損街景'],
};
export const CLAIM_CLUES=[
 {id:'thunder',evidence:'record',text:'莊：雷是我打的，條件符合。',matches:'cause'},
 {id:'ammo',evidence:'record',text:'莊：就是你。',matches:null},
 {id:'time',evidence:'application',text:'事故時間：待補。',matches:null},
 {id:'damage',evidence:'photos',text:'案發後：店面、招牌與樓板毀損。',matches:'loss'},
 {id:'pear-safe',evidence:'photos',text:'案發後：梨花保留。',matches:null},
];
export const CLAIM_DECLARATIONS={cause:'申報原因：自然雷擊。',loss:'損失申報：梨花無損失，故本案無損失。'};
export const EVIDENCE=[
 {id:'application',title:'01 · 理賠申請書',text:'事故原因：自然雷擊。\n損失申報：梨花無損失，故本案無損失。\n申請人：莊芳宜。\n事故時間：待補。',note:'本模式新增的戲內申請書。'},
 {id:'record',title:'02 · 現場發射紀錄',text:quote(chargeLines,7,8)+'\n'+quote(sequences.last,3,7),note:'摘錄本劇台詞：出力與發射均由莊主動決定。'},
 {id:'photos',title:'03 · 店面前後對照',text:'案發前：招牌、樓板與店面完整。\n案發後：便利店建物與招牌毀損，梨花保留。',note:'同版本場景固定取景；不代表你本次砲擊的命中紀錄。'},
];
export const CLAIM_FIELDS=[
 {id:'cause',label:'事故原因',options:[['natural','自然雷擊','莊：雷是我打的，條件符合。\n龍泡泡：所以妳不能省略「我打的」。'],['human','人工雷擊','弭弗：已註記主動出力。\n莊：字可以小一點。'],['dinner','晚餐延誤','龍泡泡：餓了是動機，不是天氣。']]},
 {id:'responsibility',label:'責任歸屬',options:[['weather','天氣','弭弗：天氣表示，今晚沒有接到發射指令。'],['zhuang','莊芳宜','莊：姓名有必要寫全嗎？\n龍泡泡：工號也可以附上。'],['dragon','暫填龍泡泡','龍泡泡：暫填為什麼已經印好了？']]},
 {id:'loss',label:'損失範圍',options:[['pear','只看梨花','莊：沒有損失。\n龍泡泡：妳保的是便利店，請看一下受詞。'],['building','依現場建物紀錄','弭弗：建物毀損已列入，鄰棟另案。']]},
];
export function claimResult(form){
 if(!CLAIM_FIELDS.every(f=>f.options.some(o=>o[0]===form[f.id])))return null;
 const reasons=[];
 if(form.loss!=='building')reasons.push('損失漏報：梨花無損失，不等於便利店無損失。');
 if(form.responsibility!=='zhuang')reasons.push('責任矛盾：現場紀錄中的主動出力者是莊芳宜。');
 if(form.cause!=='human')reasons.push('原因矛盾：發射紀錄不支持自然雷擊或晚餐延誤分類。');
 return {status:reasons.length?'退回補件':'更正受理',reasons:reasons.length?reasons:['已依現場紀錄更正；受理不代表核賠。'],aside:reasons.length?'龍泡泡：表格可以重填，便利店不能只擦掉重畫。':'莊：多久回款？\n龍泡泡：我只說收到了。'};
}
const STORAGE_KEY='rainy711.bonus.v1';
export class BonusProgress{
 constructor(storage){this.storage=storage;this.data={unlocked:false,warned:false,read:[],finished:[],preference:'',reading:false,textSize:18};this.taps=0;try{const d=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');if(d){this.data={unlocked:d.unlocked===true,warned:d.warned===true,read:Array.isArray(d.read)?d.read.filter(id=>LESSONS.some(l=>l.id===id)):[],finished:Array.isArray(d.finished)?d.finished.filter(id=>['A','B'].includes(id)):[],preference:['A','B','both'].includes(d.preference)?d.preference:'',reading:d.reading===true,textSize:[18,22,26].includes(d.textSize)?d.textSize:18};}}catch{/* Private browsing still works for this visit. */}}
 save(){try{this.storage?.setItem(STORAGE_KEY,JSON.stringify(this.data));}catch{/* Keep the in-memory progress. */}}
 tap(sign,phase){if(!['ready','complete'].includes(phase)){this.taps=0;return false;}if(!sign){this.taps=0;return false;}if(this.data.unlocked)return false;this.taps++;if(this.taps===7){this.data.unlocked=true;this.save();return true;}return false;}
 mark(kind,id){const values=kind==='read'?LESSONS.map(l=>l.id):kind==='finished'?['A','B']:[];if(!values.includes(id))return;if(!this.data[kind].includes(id))this.data[kind].push(id);this.save();}
}
export class ClaimTrial{
 constructor(){this.reset('A');}
 reset(mode){this.mode=mode==='B'?'B':'A';this.field=null;this.found=[];this.errors=0;this.feedback='先翻閱證據，再比對申請欄位。';this.form={};this.result=null;this.clue=null;this.proofs=[];}
 selectClue(id){if(!this.field||!CLAIM_CLUES.some(c=>c.id===id))return false;this.clue=id;return true;}
 compare(id=this.clue){
  const clue=CLAIM_CLUES.find(c=>c.id===id);if(!clue||!['cause','loss'].includes(this.field))return false;
  if(clue.matches!==this.field){this.errors++;this.feedback=this.errors>=2?'提示：找出誰主動打雷，再看店面是否真的沒有損失。':'龍泡泡：這段內容還不能反駁該欄。再看一眼附件。';return false;}
  if(!this.found.includes(this.field)){this.found.push(this.field);this.proofs.push({field:this.field,clue:id});}
  this.feedback=this.field==='cause'?'矛盾成立：自然雷擊／主動發射。':'矛盾成立：無損失／店面毀損。';this.field=null;this.clue=null;return true;
 }
 finishA(decision){if(this.found.length!==2||!['return','accept'].includes(decision))return false;this.result={status:decision==='return'?'退回補件':'更正受理',reasons:decision==='return'?['請補正事故原因、損失範圍與事故時間。']:['原因更正為人工雷擊，責任人莊芳宜，損失依建物紀錄；事故時間待補。','受理不代表核賠。'],aside:decision==='return'?'莊：退回要幾個工作日？\n龍泡泡：妳願意等公文的時候真多。':'莊：梨花那欄保留。\n龍泡泡：可以，但不是損失總表。'};return true;}
 finishB(){this.result=claimResult(this.form);return !!this.result;}
}
