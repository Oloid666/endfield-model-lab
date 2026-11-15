export const SHARE_TITLE='莊的晚餐｜雨夜711';
export const SHARE_DESCRIPTION='只是出門買個晚餐，事情怎麼越來越不對勁？和莊方宜、龍泡泡一起，度過一場荒唐的雨夜。手機直接開玩。';
export const CANONICAL_URL='https://endfield10000t.aura87.online/';
export const SHARE_IMAGE='images/og-rainy711-v1.jpg';
export function sharingURLs(env=process.env){
 const preview=env.CF_PAGES_BRANCH&&env.CF_PAGES_BRANCH!=='main';
 const value=env.VITE_SITE_URL||(preview?(env.CF_PAGES_URL||'https://ui-preview.endfield-model-lab.pages.dev/'):env.GITHUB_ACTIONS==='true'?'https://oloid666.github.io/endfield-model-lab/':CANONICAL_URL);
 const site=new URL(value);if(site.protocol!=='https:'||site.username||site.password||['localhost','127.0.0.1','::1'].includes(site.hostname))throw Error('Sharing needs a public HTTPS site URL');
 site.search=site.hash='';if(!site.pathname.endsWith('/'))site.pathname+='/';
 return {site:site.href,image:new URL(SHARE_IMAGE,site).href,canonical:CANONICAL_URL};
}
export function sharingMetaPlugin(env=process.env){
 return {name:'rainy711-sharing-meta',transformIndexHtml(html){
  if(!html.includes('property="og:title"'))return html;
  const urls=sharingURLs(env),escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  return html.replace(/(<meta property="og:url" content=")[^"]*/g,'$1'+escape(urls.site)).replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*/g,'$1'+escape(urls.image));
 }};
}
