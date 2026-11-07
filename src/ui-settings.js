import {buttonStyle} from './button-style.js';
// Group existing controls without replacing their listeners or pause ownership.
export function createSettingsLayout(settings, signal) {
  const original = [...settings.children];
  const group = (title, folded = false) => {
    const root = document.createElement(folded ? 'details' : 'section');
    root.className = 'settings-group';
    const heading = document.createElement(folded ? 'summary' : 'h2');
    heading.textContent = title; root.append(heading); settings.append(root); return root;
  };
  const play = group('遊玩與字幕'), display = group('畫面與聲音');
  const chapters = group('章節接續／重看', true), about = group('作品與回報', true);
  for (const node of original) {
    if (node.classList.contains('panel-heading')) continue;
    const text = node.textContent || '';
    if (node.classList.contains('chapter-menu')) { chapters.append(node); node.querySelector('h3')?.remove(); }
    else if (node.classList.contains('setting-row')) display.append(node);
    else if (node.tagName === 'BUTTON' && /自動對話|字幕字級|回到演出/.test(text)) play.append(node);
    else if (node.tagName === 'BUTTON' && /重新開始/.test(text)) { node.classList.add('settings-restart'); buttonStyle(node,'danger'); settings.append(node); }
    else about.append(node);
  }
  // Keep restart last, away from ordinary adjustments.
  settings.append(settings.querySelector('.settings-restart'));
  settings.setAttribute('role', 'dialog'); settings.setAttribute('aria-modal', 'true');
  const backdrop = document.createElement('div'); backdrop.className = 'settings-backdrop'; backdrop.hidden = true;
  settings.before(backdrop);
  let open = false, opener, inertNodes = [];
  // Closed details keep only their own summary in the tab order.
  const tabs = () => [...settings.querySelectorAll('button,summary,input,select,a[href]')].filter(n => {
    if (n.disabled || !n.getClientRects().length || getComputedStyle(n).visibility === 'hidden') return false;
    for (let p = n.parentElement; p && p !== settings; p = p.parentElement)
      if (p.tagName === 'DETAILS' && !p.open && n !== p.querySelector(':scope > summary')) return false;
    return true;
  });
  settings.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const list = tabs(), first = list[0], last = list.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }, {signal});
  return {setOpen(value) {
    if (open === value) return; open = value; backdrop.hidden = !value;
    if (value) {
      opener = document.activeElement;
      inertNodes = [...settings.parentElement.children].filter(n => n !== settings && n !== backdrop).map(n => [n, n.inert]);
      for (const [n] of inertNodes) n.inert = true;
      settings.querySelector('#menu-close').focus({preventScroll: true});
    } else {
      for (const [n, previous] of inertNodes) n.inert = previous;
      inertNodes = []; if (opener?.isConnected) opener.focus({preventScroll: true});
    }
  }};
}
