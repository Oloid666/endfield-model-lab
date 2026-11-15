import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {sharingURLs,sharingMetaPlugin,SHARE_TITLE,SHARE_DESCRIPTION} from './sharing-meta.mjs';
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
for(const env of [{},{CF_PAGES_BRANCH:'ui-preview',CF_PAGES_URL:'https://preview.endfield-model-lab.pages.dev'},{CF_PAGES_BRANCH:'ui-preview'},{GITHUB_ACTIONS:'true'},{VITE_SITE_URL:'https://example.com/game/'}]){
 const u=sharingURLs(env),built=sharingMetaPlugin(env).transformIndexHtml(html);assert(built.includes('content="'+u.image+'"'));assert(built.includes('content="'+u.site+'"'));assert(built.includes('href="'+u.canonical+'"'));assert(!built.includes('localhost'));
}
assert.equal(sharingURLs({GITHUB_ACTIONS:'true'}).image,'https://oloid666.github.io/endfield-model-lab/images/og-rainy711-v1.jpg');
for(const value of ['http://example.com','https://user:pass@example.com','https://localhost'])assert.throws(()=>sharingURLs({VITE_SITE_URL:value}));
assert(sharingURLs({VITE_SITE_URL:'https://example.com/?secret=x#z'}).site==='https://example.com/');
assert(sharingMetaPlugin().transformIndexHtml('<title>Admin</title>')==='<title>Admin</title>');
for(const key of ['og:title','og:description','og:url','og:image','og:image:width','og:image:height','twitter:card','twitter:image'])assert.equal((html.match(new RegExp('(?:property|name)="'+key+'"','g'))||[]).length,1,key);
assert(html.includes('content="'+SHARE_TITLE+'"')&&html.includes('content="'+SHARE_DESCRIPTION+'"'));assert(html.includes('lang="zh-Hant"'));assert(html.includes('sizes="180x180"'));
console.log('Sharing: static cards, public HTTPS origins, preview/root/subpath and canonical checks passed.');
