"""Verify deployed Pages assets over normal TLS. No browser/device claim."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

URL = 'https://oloid666.github.io/endfield-model-lab/?v=8'
PREFIX = '/endfield-model-lab/'
DIST = Path('dist')
MODELS = {
    'models/zhuang-fangyi.glb': (7520868, '43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94'),
    'models/xaihi.glb': (8029820, 'f953e5890ed0b208d02e59581b3ddee60650cd2646cf94a4324f1e15e5404a68'),
}


def fetch(url):
    assert urlparse(url).hostname == 'oloid666.github.io'
    return subprocess.check_output([
        'curl', '--fail', '--silent', '--show-error', '--location',
        '--connect-timeout', '15', '--max-time', '120', url,
    ])


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify_file(relative):
    local = DIST / relative
    assert local.is_file(), ('Missing local build asset', str(local))
    data = fetch(urljoin(URL, relative))
    actual = digest(data)
    assert digest(local.read_bytes()) == actual, ('Public asset differs from tested build', relative)
    return data, {'path': PREFIX + relative, 'bytes': len(data), 'sha256': actual, 'matches_tested_build': True}


assert len(sys.argv) == 3, 'Usage: python3 scripts/verify-production.py COMMIT ACTION_RUN_URL'
html = fetch(URL).decode()
assert html == (DIST / 'index.html').read_text(), 'Public HTML differs from tested build'
paths = re.findall(r'(?:src|href)="([^"]+)"', html)
entry_paths = [path for path in paths if path.endswith(('.js', '.css', '.svg'))]
assert any(path.endswith('.js') for path in entry_paths), 'Missing JavaScript entry'
for path in entry_paths:
    assert path.startswith(PREFIX), ('Asset does not use Pages repository prefix', path)

# Include the lazy-loaded Xaihi chunk and every emitted stylesheet, not only the
# entry chunk referenced by index.html.
relative_paths = {path.removeprefix(PREFIX) for path in entry_paths}
relative_paths.update(str(path.relative_to(DIST)) for path in (DIST / 'assets').glob('*') if path.suffix in {'.js', '.css'})
relative_paths.update(str(path.relative_to(DIST)) for path in (DIST / 'images').glob('*') if path.is_file())
assert 'images/mifu-portrait-a-source.png' in relative_paths, 'Missing approved Mifu portrait'
assets = []
javascript = ''
for relative in sorted(relative_paths):
    data, record = verify_file(relative)
    assets.append(record)
    if relative.endswith('.js'):
        javascript += data.decode()
markers = [
    'rainOnGPU', 'unlit-fresnel', 'mission-attack',
    'pear-five-petal-blossoms', 'permanent-shop-rubble',
    'neighbor-collateral-wall', 'wuling-tianshi-grid-v8',
    'charred-microwave-v8', 'dragon-login-terminal-v8',
    'xaihi-vcr-actor', 'endfield_power', 'VCR · 時間倒帶',
]
for marker in markers:
    assert marker in javascript, ('Missing V8 build marker', marker)
assert '玩法試驗區' not in javascript, 'Removed playground is still included in public JavaScript'
models = {}
for relative, (size, expected_hash) in MODELS.items():
    data, record = verify_file(relative)
    assert len(data) == size and record['sha256'] == expected_hash, ('Original model mismatch', relative)
    models[relative] = record
result = {
    'url': URL,
    'release': 'lookdev-v8-tianshi-login-xaihi-vcr',
    'commit': sys.argv[1],
    'action': sys.argv[2],
    'tls_verification': True,
    'browser_public_url_test': False,
    'real_iphone_test': False,
    'assets': assets,
    'models': models,
    'new_js_markers_verified': markers,
    'removed_playground_marker_absent': True,
}
Path('artifacts/production-check.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
