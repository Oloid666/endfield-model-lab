// Idle timeout resets on real bytes. A slow, progressing download is not a failure.
export async function downloadModel(url,onStage,signal,label='人物'){
  const controller=new AbortController();let timer;
  const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(new Error('下載暫停超過 40 秒。請重試。')),40000);};
  const cancel=()=>controller.abort(signal.reason);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  try{
    reset();const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error(`${label}下載失敗（${response.status}）`);
    const known=url.includes('zhuang-fangyi')?7520868:url.includes('xaihi')?8029820:0;const total=known||(response.headers.get('Content-Encoding')?0:Number(response.headers.get('Content-Length'))),reader=response.body?.getReader(),chunks=[];let count=0;
    if(reader){while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);count+=value.length;reset();onStage(total>0?`${label} ${(count/1e6).toFixed(2)} / ${(total/1e6).toFixed(2)} MB · ${Math.min(100,Math.round(count/total*100))}%`:`${label}下載 ${(count/1048576).toFixed(1)} MB`);}}
    else {chunks.push(new Uint8Array(await response.arrayBuffer()));count=chunks[0].length;}
    const data=new Uint8Array(count);let offset=0;for(const part of chunks){data.set(part,offset);offset+=part.length;}
    if(count<12||new DataView(data.buffer).getUint32(0,true)!==0x46546c67)throw Error(`${label}檔案不完整。請重試。`);
    return data.buffer;
  }catch(error){if(controller.signal.aborted&&!signal?.aborted)throw Error('模型下載暫停超過 40 秒。可重試，不必重新載入街景。');throw error;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
