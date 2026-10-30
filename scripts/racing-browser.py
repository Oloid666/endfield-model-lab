"""Chromium mobile-emulation smoke check; this is not an iPhone hardware test."""
import json, os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':430,'height':880},device_scale_factor=1,has_touch=True)
    page.set_default_timeout(30000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.clock.install()
    page.goto(os.environ.get('RACING_URL','http://127.0.0.1:4182/endfield-model-lab/racing.html'))
    page.wait_for_function('window.__racing')
    page.clock.pause_at(page.evaluate('Date.now()+2000'))
    page.click('#rope')
    assert page.evaluate('__racing.state.ropeMode')=='long'
    page.screenshot(path='/tmp/racing-v2-intro.png')
    page.click('#start')
    page.wait_for_function('__racing.audio.ready && __racing.audio.context==="running"')
    page.clock.run_for(3500)
    print('straight',page.evaluate('({s:__racing.state.player.s,audio:__racing.audio})'),flush=True)
    # Real keyboard input changes heading; releasing preserves heading rather than following the road.
    page.keyboard.down('KeyD');page.clock.run_for(450);page.keyboard.up('KeyD')
    assert page.evaluate('__racing.state.player.heading')>.2
    page.clock.run_for(700)
    page.screenshot(path='/tmp/racing-v2-turn.png')
    page.click('#pause');t=page.evaluate('__racing.state.time');page.clock.run_for(400)
    assert page.evaluate('__racing.state.time')==t
    assert not page.evaluate('__racing.audio.active')
    page.click('#pause')
    # Simultaneous, genuine touch pointers: turn + brake + drift; cancel must clear all inputs.
    cdp=page.context.new_cdp_session(page)
    def point(selector,rx=.5):
        b=page.locator(selector).bounding_box();return {'x':b['x']+b['width']*rx,'y':b['y']+b['height']*.4}
    points=[dict(point('#steer',.83),id=1),dict(point('#brake'),id=2),dict(point('#drift'),id=3)]
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points})
    assert page.evaluate('__racing.input.steer>.5 && __racing.input.brake && __racing.input.drift')
    page.clock.run_for(250)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
    assert page.evaluate('__racing.input.steer===0 && !__racing.input.brake && !__racing.input.drift')
    page.click('#recover');assert page.evaluate('__racing.state.speed')<1
    page.click('#sound');assert page.evaluate('__racing.audio.muted')
    page.click('#rope');assert page.evaluate('__racing.state.ropeMode')=='medium'
    assert page.evaluate('__racing.state.time')<.1
    assert page.evaluate('__racing.audio.muted'),'mute survives restart'
    page.click('#sound');assert not page.evaluate('__racing.audio.muted')
    page.clock.run_for(700)
    page.keyboard.down('KeyA');page.evaluate('window.dispatchEvent(new Event("blur"))')
    assert page.evaluate('__racing.paused && __racing.input.steer===0 && !__racing.audio.active')
    page.keyboard.up('KeyA');page.click('#pause')
    page.set_viewport_size({'width':1100,'height':700});page.clock.run_for(100)
    page.screenshot(path='/tmp/racing-v2-landscape.png')
    page.set_viewport_size({'width':844,'height':390});page.clock.run_for(100)
    page.screenshot(path='/tmp/racing-v2-phone-landscape.png')
    assert not errors,errors
    print('PASS browser: keyboard steering, three touch pointers/cancel, pause/audio, recovery, rope switch, mute, blur, portrait/landscape; no runtime exceptions',flush=True)
    browser.close()
