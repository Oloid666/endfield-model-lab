export const STREET_SONGS={
 collapse:[
  ['全都是泡沫 🫧 只一剎的花火 🎹','你所有承諾 🎸 全部都太脆弱'],
  ['倫敦鐵橋 🥁 垮下來，垮下來 🎺'],
  ['早知道是這樣 🎷 像夢一場','我才不會把愛 🎹 都放在同一個地方'],
  ['這街道在下陷 🥁 我們就快失去了家園','你我卻都沒有埋怨 🎹 將眼淚停格瞬間','街景摧毀 🎸 我內心卻不輕易撤退','滿天風雪 🌨️ 我們會微笑去面對 🎸']
 ],
 restore:[
  ['再出發 🥁 再出發啦 🎺','要拿冠軍第一名','天公就疼這款命 🎸','嘎甘苦當作跳恰恰 🥁'],
  ['毀壞的沙雕 🎸 如何重來，有裂痕的愛 🎹 怎麼重蓋','只是一切 🎹 結束太快，你說你無法釋懷 🎸'],
  ['想回到過去 ⏪🎹 試著讓故事繼續','至少不再讓妳 🎸 離我而去'],
  ['突然好想你 🎹 你會在哪裡？','過得快樂 🎸 或委屈？']
 ]
};
export function songFrame(lines,age){let at=2.8;for(let i=0;i<lines.length;i++){const end=at+Math.max(3,Array.from(lines[i]).length/5.5+1);if(age<end)return {line:age>=at?lines[i]:'',index:i,end,done:false};at=end;}return {line:'',index:lines.length,end:at,done:true};}
