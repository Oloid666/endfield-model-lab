// Presentation roles only: no handlers, timers, observers or gameplay state.
const primary = new Set(['mission-launch','mission-attack','mission-login-submit','flight-ready','photo-shutter','photo-send','call-accept','fire-continue','shoe-continue','rhythm-pad','bonus-primary']);
const quiet = new Set(['round-button','mission-prompt-replay','mission-camera-reset','mission-auto','mission-skip','bonus-text-button']);
const surface = new Set(['mission-line','mission-resume-panel','mission-lever-thumb','mission-captcha-check']);
const danger = new Set(['mission-replay','postgame-reset','settings-restart']);
export function buttonStyle(node, tone) {
 if(node.tagName!=='BUTTON')return node;
 const classes=[...node.classList];
 if(!tone&&['menu-toggle','menu-close'].includes(node.id))tone='quiet';
 if(!tone&&['retry','asset-retry'].includes(node.id))tone='primary';
 node.dataset.ui=tone || (classes.some(c=>surface.has(c))?'surface':classes.some(c=>danger.has(c))?'danger':classes.some(c=>primary.has(c))?'primary':classes.some(c=>quiet.has(c))?'quiet':'secondary');
 return node;
}
export function styleExistingButtons(root){
 for(const node of root.querySelectorAll('button:not([data-ui])'))buttonStyle(node,node.closest('.rating-stars')?'rating':undefined);
}
