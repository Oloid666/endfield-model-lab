"""Verify deployed Pages assets over normal TLS. No browser/device claim."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
from urllib.parse import urljoin,urlparse

URL='https://oloid666.github.io/endfield-model-lab/?v=5'
def fetch(url):
    assert urlparse(url).hostname=='oloid666.github.io'
    return subprocess.check_output(['curl','--fail','--silent','--show-error','--location',url])
def digest(data):return hashlib.sha256(data).hexdigest()
html=fetch(URL).decode()
paths=re.findall(r'(?:src|href)="([^"]+)"',html)
assets=[];javascript=''
for path in paths:
    if not path.endswith(('.js','.css','.svg')):continue
    data=fetch(urljoin(URL,path));assets.append({'path':path,'bytes':len(data),'sha256':digest(data)})
    if path.endswith('.js'):javascript+=data.decode()
markers=['rainOnGPU','instanceAtlas','unlit-fresnel','single-file','postSamples']
for marker in markers:assert marker in javascript,marker
model=fetch(urljoin(URL,'models/zhuang-fangyi.glb'))
assert len(model)==7520868 and digest(model)=='43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94'
assert len(assets)>=3
result={'url':URL,'release':'lookdev-v5-follower-store-camera-ui','commit':sys.argv[1],
        'action':sys.argv[2],'tls_verification':True,'browser_public_url_test':False,'real_iphone_test':False,
        'assets':assets,'model':{'bytes':len(model),'sha256':digest(model)},'new_js_markers_verified':markers}
Path('artifacts/production-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
