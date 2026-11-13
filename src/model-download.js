// Idle timeout resets on real bytes. A slow, progressing download is not a failure.
export async function downloadModel(url,onStage,signal,label='人物',onProgress=()=>{},gzip=null){
  const controller=new AbortController();let timer;
  const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(new Error('下載暫停超過 40 秒。請重試。')),40000);};
  const cancel=()=>controller.abort(signal.reason);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  const known=url.includes('zhuang-fangyi')?7520868:url.includes('xaihi')?8029820:0;
  const valid=data=>data.byteLength>=12&&new DataView(data.buffer,data.byteOffset,data.byteLength).getUint32(0,true)===0x46546c67&&new DataView(data.buffer,data.byteOffset,data.byteLength).getUint32(8,true)===data.byteLength;
  async function read(path,bytes){
    reset();const response=await fetch(path,{signal:controller.signal});if(!response.ok)throw Error(`${label}下載失敗（${response.status}）`);
    // Content-Encoding may make fetch decode gzip itself. Count the bytes its body actually emits.
    const encoded=!!response.headers.get('Content-Encoding');
    const total=(encoded?known:bytes)||Number(response.headers.get('Content-Length'))||0,reader=response.body?.getReader(),chunks=[];let count=0;
    if(reader){while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);count+=value.length;reset();onProgress({loaded:count,total,ratio:total>0?Math.min(1,count/total):null});onStage(total>0?`${label} ${(count/1e6).toFixed(2)} / ${(total/1e6).toFixed(2)} MB · ${Math.min(100,Math.round(count/total*100))}%`:`${label}下載 ${(count/1048576).toFixed(1)} MB`);}}
    else {chunks.push(new Uint8Array(await response.arrayBuffer()));count=chunks[0].length;}
    const data=new Uint8Array(count);let offset=0;for(const part of chunks){data.set(part,offset);offset+=part.length;}
    return data;
  }
  try{
    if(gzip&&typeof DecompressionStream==='function'){
      try{
        let packed=await read(gzip.url,gzip.bytes);
        if(!valid(packed)){
          onStage(`正在解開${label}模型`);reset();
          const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
          packed=new Uint8Array(await new Response(stream).arrayBuffer());
        }
        if(controller.signal.aborted)throw controller.signal.reason;
        if(!valid(packed))throw Error('壓縮模型不完整');
        return packed.buffer;
      }catch(error){
        if(controller.signal.aborted)throw error;
        onStage(`改用原始${label}模型`);
      }
    }
    const data=await read(url,known);
    if(!valid(data))throw Error(`${label}檔案不完整。請重試。`);
    return data.buffer;
  }catch(error){if(controller.signal.aborted&&!signal?.aborted)throw Error('模型下載暫停超過 40 秒。可重試，不必重新載入街景。');throw error;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
