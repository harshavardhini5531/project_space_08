'use client'
import { useEffect, useRef } from 'react'

export default function AuthBackground({ children }) {
  const galaxyRef  = useRef(null)
  const sphereRef  = useRef(null)

  useEffect(() => {
    /* ═══ GALAXY BACKGROUND — same as landing page ═══ */
    const cv = galaxyRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let W, H
    const dpr = Math.min(window.devicePixelRatio, 2)

    const nebulaCanvas = document.createElement('canvas')
    const nCtx = nebulaCanvas.getContext('2d')

    const layers = [
      { stars:[], count:600, rMin:0.15, rMax:0.5, oMin:0.1, oMax:0.35, speed:0.08 },
      { stars:[], count:300, rMin:0.3, rMax:0.9, oMin:0.15, oMax:0.5, speed:0.18 },
      { stars:[], count:80, rMin:0.5, rMax:1.4, oMin:0.25, oMax:0.7, speed:0.35, bright:true }
    ]
    let bandStars = []
    let sparks = []
    const NUM_SPARK = 18
    const bandAngle = -0.15
    let time = 0

    function resize() {
      W = cv.width = window.innerWidth * dpr
      H = cv.height = window.innerHeight * dpr
      cv.style.width = window.innerWidth + 'px'
      cv.style.height = window.innerHeight + 'px'
      nebulaCanvas.width = W + 80*dpr
      nebulaCanvas.height = H + 80*dpr
      initStars()
      renderNebula()
    }

    function initStars() {
      for (let l=0; l<layers.length; l++) {
        const ly = layers[l]
        ly.stars = []
        for (let i=0; i<ly.count; i++) {
          ly.stars.push({
            x: Math.random()*W, y: Math.random()*(H+100*dpr),
            r: (Math.random()*(ly.rMax-ly.rMin)+ly.rMin)*dpr,
            o: Math.random()*(ly.oMax-ly.oMin)+ly.oMin,
            twinklePhase: Math.random()*Math.PI*2,
            twinkleSpeed: Math.random()*0.003+0.001
          })
        }
      }
      bandStars = []
      for (let i=0; i<500; i++) {
        bandStars.push({
          x:(Math.random()-0.5)*W*1.4, y:(Math.random()-0.5)*H*0.2,
          r:(Math.random()*0.5+0.15)*dpr, o:Math.random()*0.3+0.08
        })
      }
      sparks = []
      for (let i=0; i<NUM_SPARK; i++) {
        sparks.push({
          x:Math.random()*W, y:Math.random()*H,
          r:(Math.random()*1.0+0.4)*dpr,
          phase:Math.random()*Math.PI*2, speed:Math.random()*0.008+0.004,
          maxLife:Math.random()*0.7+0.3, layer:Math.floor(Math.random()*3)
        })
      }
    }

    function renderNebula() {
      const nW = nebulaCanvas.width, nH = nebulaCanvas.height
      nCtx.clearRect(0,0,nW,nH)
      nCtx.fillStyle = '#000000'
      nCtx.fillRect(0,0,nW,nH)

      let topGrd = nCtx.createLinearGradient(0,0,0,nH*0.15)
      topGrd.addColorStop(0,'rgba(180,20,0,0.18)')
      topGrd.addColorStop(0.4,'rgba(120,15,0,0.08)')
      topGrd.addColorStop(1,'rgba(0,0,0,0)')
      nCtx.fillStyle = topGrd
      nCtx.fillRect(0,0,nW,nH*0.15)

      let botGrd = nCtx.createLinearGradient(0,nH*0.85,0,nH)
      botGrd.addColorStop(0,'rgba(0,0,0,0)')
      botGrd.addColorStop(0.6,'rgba(120,15,0,0.08)')
      botGrd.addColorStop(1,'rgba(180,20,0,0.18)')
      nCtx.fillStyle = botGrd
      nCtx.fillRect(0,nH*0.85,nW,nH*0.15)

      let skyHaze = nCtx.createRadialGradient(nW*0.5,nH*0.45,0,nW*0.5,nH*0.45,Math.max(nW,nH)*0.55)
      skyHaze.addColorStop(0,'rgba(8,8,20,0.15)')
      skyHaze.addColorStop(0.5,'rgba(5,4,12,0.08)')
      skyHaze.addColorStop(1,'rgba(0,0,0,0)')
      nCtx.fillStyle = skyHaze
      nCtx.fillRect(0,0,nW,nH)

      const dustClouds = [
        {x:nW*0.15,y:nH*0.3,w:nW*0.3,h:nH*0.08,a:0.04,rot:-0.1},
        {x:nW*0.55,y:nH*0.5,w:nW*0.35,h:nH*0.06,a:0.035,rot:0.05},
        {x:nW*0.3,y:nH*0.65,w:nW*0.25,h:nH*0.05,a:0.03,rot:-0.08},
        {x:nW*0.7,y:nH*0.25,w:nW*0.2,h:nH*0.07,a:0.03,rot:0.12},
        {x:nW*0.45,y:nH*0.4,w:nW*0.4,h:nH*0.1,a:0.025,rot:-0.05}
      ]
      for (const d of dustClouds) {
        nCtx.save()
        nCtx.translate(d.x+d.w/2, d.y+d.h/2)
        nCtx.rotate(d.rot)
        let dg = nCtx.createRadialGradient(0,0,0,0,0,d.w*0.5)
        dg.addColorStop(0,'rgba(20,15,30,'+d.a+')')
        dg.addColorStop(0.5,'rgba(12,8,18,'+(d.a*0.6)+')')
        dg.addColorStop(1,'rgba(0,0,0,0)')
        nCtx.fillStyle = dg
        nCtx.scale(1, d.h/d.w)
        nCtx.beginPath(); nCtx.arc(0,0,d.w*0.5,0,Math.PI*2); nCtx.fill()
        nCtx.restore()
      }

      nCtx.save()
      nCtx.translate(nW/2, nH/2)
      nCtx.rotate(bandAngle)
      const bandW = nW*1.6, bandH = nH*0.35
      let bandGrd = nCtx.createLinearGradient(0,-bandH,0,bandH)
      bandGrd.addColorStop(0,'rgba(0,0,0,0)')
      bandGrd.addColorStop(0.25,'rgba(30,18,8,0.03)')
      bandGrd.addColorStop(0.4,'rgba(60,30,10,0.06)')
      bandGrd.addColorStop(0.5,'rgba(80,40,14,0.08)')
      bandGrd.addColorStop(0.6,'rgba(60,30,10,0.06)')
      bandGrd.addColorStop(0.75,'rgba(30,18,8,0.03)')
      bandGrd.addColorStop(1,'rgba(0,0,0,0)')
      nCtx.fillStyle = bandGrd
      nCtx.fillRect(-bandW/2,-bandH,bandW,bandH*2)

      const coreH = nH*0.1
      let coreGrd = nCtx.createLinearGradient(0,-coreH,0,coreH)
      coreGrd.addColorStop(0,'rgba(0,0,0,0)')
      coreGrd.addColorStop(0.3,'rgba(100,45,12,0.04)')
      coreGrd.addColorStop(0.5,'rgba(130,55,18,0.06)')
      coreGrd.addColorStop(0.7,'rgba(100,45,12,0.04)')
      coreGrd.addColorStop(1,'rgba(0,0,0,0)')
      nCtx.fillStyle = coreGrd
      nCtx.fillRect(-bandW/2,-coreH,bandW,coreH*2)

      for (const bs of bandStars) {
        nCtx.globalAlpha = bs.o
        nCtx.fillStyle = '#fff'
        nCtx.beginPath(); nCtx.arc(bs.x,bs.y,bs.r,0,Math.PI*2); nCtx.fill()
      }
      nCtx.globalAlpha = 1
      nCtx.restore()

      const nebulae = [
        {x:nW*0.2,y:nH*0.2,r:nW*0.1,c:'rgba(100,35,5,0.02)'},
        {x:nW*0.75,y:nH*0.55,r:nW*0.08,c:'rgba(80,30,8,0.018)'},
        {x:nW*0.5,y:nH*0.45,r:nW*0.12,c:'rgba(90,40,10,0.02)'},
        {x:nW*0.85,y:nH*0.8,r:nW*0.07,c:'rgba(120,45,10,0.02)'},
        {x:nW*0.3,y:nH*0.78,r:nW*0.09,c:'rgba(100,35,5,0.018)'}
      ]
      for (const n of nebulae) {
        let ng = nCtx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r)
        ng.addColorStop(0, n.c)
        ng.addColorStop(1,'rgba(0,0,0,0)')
        nCtx.fillStyle = ng
        nCtx.beginPath(); nCtx.arc(n.x,n.y,n.r,0,Math.PI*2); nCtx.fill()
      }
    }

    let galaxyAngle = 0, scrollY = 0, scrollX = 0

    function draw() {
      time += 1
      ctx.clearRect(0,0,W,H)
      scrollY += 0.3*dpr
      scrollX += 0.1*dpr
      galaxyAngle += 0.00005

      const breathX = Math.sin(time*0.0004)*20*dpr
      const breathY = Math.sin(time*0.0003)*15*dpr
      const zoomPhase = time*0.0006
      const zoomBase = 0.08*Math.sin(zoomPhase)

      const nebulaZoom = 1.25 + zoomBase*0.4
      const nW = nebulaCanvas.width, nH = nebulaCanvas.height
      ctx.save()
      ctx.translate(W/2, H/2)
      ctx.rotate(galaxyAngle)
      ctx.scale(nebulaZoom, nebulaZoom)
      ctx.translate(-nW/2+breathX*0.05, -nH/2+breathY*0.05)
      ctx.drawImage(nebulaCanvas, 0, 0)
      ctx.restore()

      const cx = W/2, cy = H/2

      for (let l=0; l<layers.length; l++) {
        const ly = layers[l]
        const spd = ly.speed
        const layerZoom = 1 + zoomBase*spd*5

        for (let i=0; i<ly.stars.length; i++) {
          const s = ly.stars[i]
          s.twinklePhase += s.twinkleSpeed
          const flicker = 0.5 + 0.5*Math.sin(s.twinklePhase)
          const alpha = s.o * flicker
          if (alpha < 0.03) continue

          let dx = s.x + scrollX*spd + breathX*spd
          let dy = s.y - scrollY*spd + breathY*spd

          const padX = 40*dpr, padY = 60*dpr
          const wrapW = W+padX*2, wrapH = H+padY*2
          dx = ((dx+padX)%wrapW+wrapW)%wrapW - padX
          dy = ((dy+padY)%wrapH+wrapH)%wrapH - padY

          const offX = (dx-cx)*layerZoom + cx
          const offY = (dy-cy)*layerZoom + cy
          const starR = s.r * layerZoom

          const edgeDist = Math.min(offX, W-offX, offY, H-offY)
          const edgeFade = Math.min(edgeDist/(50*dpr), 1)
          if (edgeFade < 0.01) continue

          ctx.save()
          ctx.globalAlpha = alpha * edgeFade
          ctx.beginPath()
          ctx.arc(offX, offY, starR, 0, Math.PI*2)
          ctx.fillStyle = '#fff'
          if (ly.bright && flicker > 0.55) {
            ctx.shadowColor = 'rgba(255,255,255,0.9)'
            ctx.shadowBlur = starR*5
          }
          ctx.fill()
          ctx.restore()
        }
      }

      for (let i=0; i<sparks.length; i++) {
        const sp = sparks[i]
        sp.phase += sp.speed
        const life = Math.abs(Math.sin(sp.phase)) * sp.maxLife
        if (sp.phase > Math.PI*6) { sp.x=Math.random()*W; sp.y=Math.random()*H; sp.phase=0 }
        if (life < 0.02) continue
        const spp = layers[sp.layer].speed
        const spLayerZoom = 1 + zoomBase*spp*5
        let spX = sp.x + scrollX*spp + breathX*spp
        let spY = sp.y - scrollY*spp + breathY*spp
        const padX2=40*dpr, padY2=60*dpr
        const wW2=W+padX2*2, wH2=H+padY2*2
        spX = ((spX+padX2)%wW2+wW2)%wW2 - padX2
        spY = ((spY+padY2)%wH2+wH2)%wH2 - padY2
        spX = (spX-cx)*spLayerZoom + cx
        spY = (spY-cy)*spLayerZoom + cy

        ctx.save()
        ctx.globalAlpha = life
        ctx.beginPath()
        ctx.arc(spX, spY, sp.r*spLayerZoom, 0, Math.PI*2)
        ctx.fillStyle = '#fff'
        if (life > 0.5) { ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=sp.r*4 }
        ctx.fill()
        ctx.restore()
      }

      requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    requestAnimationFrame(draw)
    return () => window.removeEventListener('resize', resize)
  }, [])

  /* ═══ THREE.JS SPHERE — top-right corner ═══ */
  useEffect(() => {
    const wrap = sphereRef.current
    if (!wrap) return

    // Prevent duplicate spheres on re-render
    if (wrap.querySelector('canvas')) return

    const loadSphere = () => {
      const THREE = window.THREE
      if (!wrap || wrap.querySelector('canvas')) return

      /*
       * Sphere sizing: we want ~55-60% of the sphere visible in the corner.
       * The sphere container is large (1100px), positioned so its center 
       * is near the top-right corner of the viewport.
       * right:-18% and top:-18% puts the center just outside the corner,
       * showing roughly 55-60% of the sphere.
       */
      const SIZE = Math.min(window.innerWidth * 0.55, 1100)
      wrap.style.width = SIZE + 'px'
      wrap.style.height = SIZE + 'px'

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
      camera.position.z = 3

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })
      } catch(e) {
        return;
      }
      if (!renderer) return;
      renderer.setSize(SIZE, SIZE)
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      wrap.appendChild(renderer.domElement)

      // White shell dots
      const sphereParticles = 3500
      const sGeo = new THREE.BufferGeometry()
      const sPos = new Float32Array(sphereParticles*3)
      for (let i=0; i<sphereParticles; i++) {
        const theta = Math.random()*Math.PI*2
        const phi = Math.acos(Math.random()*2-1)
        sPos[i*3]   = Math.sin(phi)*Math.cos(theta)
        sPos[i*3+1] = Math.sin(phi)*Math.sin(theta)
        sPos[i*3+2] = Math.cos(phi)
      }
      sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
      const sphere = new THREE.Points(sGeo, new THREE.PointsMaterial({ color:0xffffff, size:0.008 }))
      scene.add(sphere)

      // Orange world map dots — same projection as landing page
      let preRunning = true
      const loader = new THREE.TextureLoader()
      loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg', texture => {
        const mc = document.createElement('canvas')
        const mctx = mc.getContext('2d')
        mc.width = texture.image.width
        mc.height = texture.image.height
        mctx.drawImage(texture.image, 0, 0)
        const d = mctx.getImageData(0, 0, mc.width, mc.height).data

        const mp = []
        const texW = mc.width, texH = mc.height
        for (let y=2; y<texH-2; y+=3) {
          for (let x=2; x<texW-2; x+=3) {
            const idx = (y*texW+x)*4
            if (d[idx]+d[idx+1]+d[idx+2] > 200) {
              const lat = (y/texH)*Math.PI - Math.PI/2
              const lon = (x/texW)*Math.PI*2 - Math.PI
              const rad = 1.01
              mp.push(
                rad*Math.cos(lat)*Math.sin(lon),
                rad*Math.sin(lat),
                rad*Math.cos(lat)*Math.cos(lon)
              )
            }
          }
        }

        const mg = new THREE.BufferGeometry()
        mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3))
        const mapDots = new THREE.Points(mg, new THREE.PointsMaterial({
          color: 0xfd1c00,
          size: 0.013,
          transparent: true,
          opacity: 0.25
        }))
        scene.add(mapDots)

        preRunning = false

        const clock = new THREE.Clock()
        const animate = () => {
          requestAnimationFrame(animate)
          const t = clock.getElapsedTime()
          sphere.rotation.y += 0.0012
          mapDots.rotation.y += 0.0012
          sphere.rotation.x = Math.sin(t*0.08)*0.03
          mapDots.rotation.x = Math.sin(t*0.08)*0.03
          renderer.render(scene, camera)
        }
        animate()
      })

      const preAnimate = () => {
        if (!preRunning) return
        requestAnimationFrame(preAnimate)
        sphere.rotation.y += 0.0012
        renderer.render(scene, camera)
      }
      preAnimate()

      window.addEventListener('resize', () => {
        const newSize = Math.min(window.innerWidth * 0.85, 1100)
        wrap.style.width = newSize + 'px'
        wrap.style.height = newSize + 'px'
        renderer.setSize(newSize, newSize)
      })
    }

    if (window.THREE) { loadSphere() }
    else if (!document.querySelector('script[src*="three.min.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      script.onload = loadSphere
      document.head.appendChild(script)
    } else {
      const check = setInterval(() => {
        if (window.THREE) { clearInterval(check); loadSphere() }
      }, 100)
    }
  }, [])

  return (
    <>
      <style>{`
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html,body{width:100%;height:100%;background:#000000;overflow:hidden;}

        .auth-galaxy { position:fixed;inset:0;width:100%;height:100%;z-index:0; }

        .auth-scanline {
          position:fixed;inset:0;
          background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,0.014) 2px,rgba(0,0,0,0.014) 4px);
          pointer-events:none;z-index:1;
        }

        .auth-sphere-clip {
          position:fixed;
          inset:0;
          overflow:hidden;
          z-index:2;
          pointer-events:none;
        }
        .auth-sphere-wrap {
          position:absolute;
          top:0;
          right:0;
          transform:translate(42%, -42%);
        }
        .auth-sphere-wrap canvas { display:block; }

        .auth-content { position:relative;z-index:10;width:100%;height:100vh; }
      `}</style>

      <canvas ref={galaxyRef} className="auth-galaxy" />
      <div className="auth-scanline" />
      <div className="auth-sphere-clip">
        <div ref={sphereRef} className="auth-sphere-wrap" />
      </div>
      <div className="auth-content">{children}</div>
    </>
  )
}