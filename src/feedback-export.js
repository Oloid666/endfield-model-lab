export function feedbackCSV(items){
 const columns=['created_at','rating','category','message','build_version','phase','play_mode'];
 const cell=value=>{let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return '\uFEFF'+[columns.join(','),...items.map(item=>columns.map(k=>cell(k==='created_at'?new Date(item[k]).toISOString():item[k])).join(','))].join('\r\n');
}
