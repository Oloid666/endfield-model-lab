// HTTP header values cannot contain arbitrary Unicode. Encode UTF-8 into ASCII;
// HTTPS still protects transport. This encoding is not encryption or a password hash.
export function feedbackAuthorization(token){
 const bytes=new TextEncoder().encode(token);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return 'Feedback '+btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function feedbackCredential(header){
 if(typeof header!=='string'||header.length>8192)return null;
 if(header.startsWith('Bearer '))return header.slice(7); // Previous clients remain usable.
 const match=/^Feedback ([a-z0-9_-]+)$/i.exec(header);if(!match)return null;
 try{const binary=atob(match[1].replaceAll('-','+').replaceAll('_','/')),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return null;}
}
