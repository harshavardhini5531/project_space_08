'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { globalStyles, colors, fonts, HACKATHON_START } from '@/lib/theme'

export default function LandingPage() {
  const routerHook  = useRouter()
  const galaxyRef   = useRef(null)
  const sphereMountRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  /* ═══ MOBILE DETECTION ═══ */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ═══ COUNTDOWN ═══ */
  useEffect(() => {
    const target = new Date(HACKATHON_START).getTime()
    const prev = { d:'', h:'', m:'', s:'' }
    const pad = n => n < 10 ? '0'+n : ''+n

    function flip(el) {
      el.classList.remove('flip')
      void el.offsetWidth
      el.classList.add('flip')
    }

    function tick() {
      const diff = Math.max(0, target - Date.now())
      const d = pad(Math.floor(diff/(1000*60*60*24)))
      const h = pad(Math.floor((diff%(1000*60*60*24))/(1000*60*60)))
      const m = pad(Math.floor((diff%(1000*60*60))/(1000*60)))
      const s = pad(Math.floor((diff%(1000*60))/1000))

      const dE = document.getElementById('cd-days')
      const hE = document.getElementById('cd-hours')
      const mE = document.getElementById('cd-mins')
      const sE = document.getElementById('cd-secs')
      if (!dE) return

      if (d !== prev.d) { dE.textContent = d; flip(dE); prev.d = d }
      if (h !== prev.h) { hE.textContent = h; flip(hE); prev.h = h }
      if (m !== prev.m) { mE.textContent = m; flip(mE); prev.m = m }
      if (s !== prev.s) { sE.textContent = s; flip(sE); prev.s = s }
    }
    // Small delay to ensure DOM elements exist after layout switch
    const startId = setTimeout(() => { tick() }, 100)
    const id = setInterval(tick, 1000)
    return () => { clearTimeout(startId); clearInterval(id) }
  }, [isMobile])

  /* ═══ TITLE GLOW TRIGGER ═══ */
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.title-main').forEach(el => el.classList.add('glow-active'))
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  /* ═══ GALAXY BACKGROUND ═══ */
  useEffect(() => {
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

  /* ═══ THREE.JS SPHERE ═══ */
  useEffect(() => {
    const mount = sphereMountRef.current
    if (!mount) return

    // Prevent duplicate spheres on re-render
    if (mount.querySelector('canvas')) return

    const loadSphere = () => {
      const THREE = window.THREE
      if (!mount || mount.querySelector('canvas')) return
      const scene = new THREE.Scene()
      let W = mount.offsetWidth, H = mount.offsetHeight
      const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 1000)
      camera.position.z = 3

      const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })
      renderer.setSize(W, H)
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      mount.appendChild(renderer.domElement)

      // ── Mouse tracking ──
      const mouse = new THREE.Vector2(9999, 9999)
      const raycaster = new THREE.Raycaster()
      const mouseWorld = new THREE.Vector3()
      let mouseOnSphere = false

      // Invisible sphere for raycasting
      const hitGeo = new THREE.SphereGeometry(1.05, 32, 32)
      const hitMat = new THREE.MeshBasicMaterial({ visible: false })
      const hitSphere = new THREE.Mesh(hitGeo, hitMat)
      scene.add(hitSphere)

      renderer.domElement.addEventListener('mousemove', (e) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      })
      renderer.domElement.addEventListener('mouseleave', () => {
        mouse.set(9999, 9999)
        mouseOnSphere = false
      })
      renderer.domElement.style.cursor = 'default'

      // ── Shell particles ──
      const sphereParticles = 3500
      const sGeo = new THREE.BufferGeometry()
      const sPos = new Float32Array(sphereParticles * 3)
      const sOriginal = new Float32Array(sphereParticles * 3)
      for (let i = 0; i < sphereParticles; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        const x = Math.sin(phi) * Math.cos(theta)
        const y = Math.sin(phi) * Math.sin(theta)
        const z = Math.cos(phi)
        sPos[i*3] = x; sPos[i*3+1] = y; sPos[i*3+2] = z
        sOriginal[i*3] = x; sOriginal[i*3+1] = y; sOriginal[i*3+2] = z
      }
      sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
      const sphere = new THREE.Points(sGeo, new THREE.PointsMaterial({ color:0xffffff, size:0.008 }))
      scene.add(sphere)

      // ── Repulsion settings ──
      const REPULSE_RADIUS = 0.35
      const REPULSE_STRENGTH = 0.12
      const RETURN_SPEED = 0.06

      function applyRepulsion(positions, originals, count, hitPoint) {
        for (let i = 0; i < count; i++) {
          const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2
          const ox = originals[ix], oy = originals[iy], oz = originals[iz]

          if (mouseOnSphere) {
            // Get rotated original position
            const v = new THREE.Vector3(ox, oy, oz)
            // Distance from mouse hit point to this dot (in world space after rotation)
            const dx = positions[ix] - hitPoint.x
            const dy = positions[iy] - hitPoint.y
            const dz = positions[iz] - hitPoint.z
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)

            if (dist < REPULSE_RADIUS && dist > 0.001) {
              const force = (1 - dist / REPULSE_RADIUS) * REPULSE_STRENGTH
              const nx = dx / dist, ny = dy / dist, nz = dz / dist
              positions[ix] += nx * force
              positions[iy] += ny * force
              positions[iz] += nz * force
            } else {
              // Return to original
              positions[ix] += (ox - positions[ix]) * RETURN_SPEED
              positions[iy] += (oy - positions[iy]) * RETURN_SPEED
              positions[iz] += (oz - positions[iz]) * RETURN_SPEED
            }
          } else {
            // No mouse — smoothly return all dots
            positions[ix] += (ox - positions[ix]) * RETURN_SPEED
            positions[iy] += (oy - positions[iy]) * RETURN_SPEED
            positions[iz] += (oz - positions[iz]) * RETURN_SPEED
          }
        }
      }

      // ── World map dots ──
      let preRunning = true
      let mapPositions = null
      let mapOriginals = null
      let mapCount = 0
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
        const mapPosArr = new Float32Array(mp)
        const mapOrigArr = new Float32Array(mp)
        mg.setAttribute('position', new THREE.BufferAttribute(mapPosArr, 3))
        const mapDots = new THREE.Points(mg, new THREE.PointsMaterial({
          color: 0xfd1c00,
          size: 0.013,
          transparent: true,
          opacity: 0.25
        }))
        scene.add(mapDots)

        mapPositions = mapPosArr
        mapOriginals = mapOrigArr
        mapCount = mp.length / 3

        preRunning = false

        const clock = new THREE.Clock()
        const animate = () => {
          requestAnimationFrame(animate)
          const t = clock.getElapsedTime()
          sphere.rotation.y += 0.0012
          mapDots.rotation.y += 0.0012
          hitSphere.rotation.y = sphere.rotation.y
          hitSphere.rotation.x = sphere.rotation.x
          sphere.rotation.x = Math.sin(t*0.08)*0.03
          mapDots.rotation.x = Math.sin(t*0.08)*0.03

          // Raycast mouse onto sphere
          raycaster.setFromCamera(mouse, camera)
          const intersects = raycaster.intersectObject(hitSphere)
          if (intersects.length > 0) {
            mouseOnSphere = true
            // Convert hit point to local sphere space
            const localPoint = hitSphere.worldToLocal(intersects[0].point.clone())
            mouseWorld.copy(localPoint)

            // Apply repulsion to shell dots
            applyRepulsion(sPos, sOriginal, sphereParticles, mouseWorld)
            sGeo.attributes.position.needsUpdate = true

            // Apply repulsion to map dots
            if (mapPositions) {
              applyRepulsion(mapPositions, mapOriginals, mapCount, mouseWorld)
              mg.attributes.position.needsUpdate = true
            }

            renderer.domElement.style.cursor = 'pointer'
          } else {
            mouseOnSphere = false
            renderer.domElement.style.cursor = 'default'

            // Return dots to original
            applyRepulsion(sPos, sOriginal, sphereParticles, mouseWorld)
            sGeo.attributes.position.needsUpdate = true
            if (mapPositions) {
              applyRepulsion(mapPositions, mapOriginals, mapCount, mouseWorld)
              mg.attributes.position.needsUpdate = true
            }
          }

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
        W = mount.offsetWidth; H = mount.offsetHeight
        camera.aspect = W/H; camera.updateProjectionMatrix(); renderer.setSize(W, H)
      })
    }

    if (window.THREE) { loadSphere() }
    else if (!document.querySelector('script[src*="three.min.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      script.onload = loadSphere
      document.head.appendChild(script)
    } else {
      // Script is loading, wait for it
      const check = setInterval(() => {
        if (window.THREE) { clearInterval(check); loadSphere() }
      }, 100)
    }
 }, [isMobile])

 /* ═══════════════════════════════════
     MOBILE LAYOUT
     ═══════════════════════════════════ */
  if (isMobile) {
    const tracks = ["DATA SPECIALIST","AWS DEVELOPMENT","FULL STACK","GOOGLE FLUTTER","SERVICENOW","VLSI"];
    const tTop = "DON'T JUST THINK".split("");
    const tBtm = "MAKE IT HAPPEN".split("");

    return (
      <>
        <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#050008;overflow:hidden;font-family:'DM Sans',sans-serif;color:#fff}
:root{--r:#fd1c00;--bg:#050008}

@keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.9) translateY(10px)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes spin3d{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
@keyframes shimmer{from{background-position:200% 50%}to{background-position:0% 50%}}
@keyframes gpulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.4) drop-shadow(0 0 4px rgba(177,158,239,.4))}}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes breathe{0%,100%{opacity:.2;transform:translate(-50%,-50%) scale(1)}50%{opacity:.5;transform:translate(-50%,-50%) scale(1.3)}}
@keyframes sweep{0%{left:-80%}100%{left:180%}}
@keyframes tReveal{0%{opacity:0;transform:translateY(12px);filter:blur(4px)}60%{filter:blur(0)}100%{opacity:1;transform:none}}
@keyframes tGR{0%,100%{text-shadow:0 0 4px rgba(253,28,0,.1)}50%{text-shadow:0 0 16px rgba(253,28,0,.35),0 0 36px rgba(253,28,0,.1)}}
@keyframes tGW{0%,100%{text-shadow:0 0 3px rgba(255,255,255,.03)}50%{text-shadow:0 0 12px rgba(255,255,255,.2),0 0 26px rgba(255,255,255,.05)}}
@keyframes lIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes tSweep{0%,100%{text-shadow:0 0 0 transparent}50%{text-shadow:0 0 8px rgba(253,28,0,.25)}}
@keyframes cGlow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 14px rgba(253,28,0,.06),inset 0 1px 6px rgba(253,28,0,.03)}}
@keyframes linePulse{0%,100%{opacity:.3}50%{opacity:.7}}

.ml{width:100%;height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden;position:relative;font-family:'DM Sans',sans-serif;color:#fff;padding:20px 0;background:#050008}

/* TOP: AI powered */
.ml-top{display:flex;justify-content:flex-end;padding:0 22px;flex-shrink:0;animation:fade .5s ease .1s both;z-index:2}
.ml-ai{display:flex;flex-direction:column;align-items:center}
.ml-ai-3d{width:32px;height:24px;perspective:400px}
.ml-ai-in{width:100%;height:100%;transform-style:preserve-3d;animation:spin3d 4s linear infinite}
.ml-ai-f{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;font-weight:300;font-size:16px;color:var(--r);text-shadow:0 0 12px rgba(253,28,0,.3);backface-visibility:hidden}
.ml-ai-f:last-child{transform:rotateY(180deg)}
.ml-ai-t{font-family:'Astro Futuristic Font','ASTRO',sans-serif;font-size:5px;letter-spacing:3.5px;font-weight:700;text-transform:uppercase;background:linear-gradient(90deg,#ff9ffc,#b19eef,var(--r),#ff9ffc);background-size:200%;background-clip:text;-webkit-background-clip:text;color:transparent;animation:shimmer 3s linear infinite,gpulse 2s ease-in-out infinite}

/* MIDDLE */
.ml-mid{flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 0 45px;z-index:2;min-height:0;gap:30px}

/* Hero */
.ml-hc{margin:0 18px;padding:20px 18px 16px;border-radius:16px;border:1px solid rgba(253,28,0,.1);background:linear-gradient(135deg,rgba(253,28,0,.04),rgba(253,28,0,.01) 60%,transparent);position:relative;overflow:visible;animation:up .6s ease .2s both,cGlow 5s ease-in-out 2s infinite}
.ml-hc-t{font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-weight:400;font-size:38px;line-height:1.06;text-transform:uppercase;color:var(--r);-webkit-text-stroke:1px rgba(253,28,0,.08);paint-order:stroke fill;position:relative;z-index:3;animation:tReveal .8s cubic-bezier(.16,1,.3,1) .3s both,tGR 4s ease-in-out 1.5s infinite}
.ml-hc-tw{color:#fff;-webkit-text-stroke:1px rgba(255,255,255,.05);animation:tReveal .8s cubic-bezier(.16,1,.3,1) .45s both,tGW 4s ease-in-out 1.8s infinite}
.ml-hc-tag{margin-top:10px;position:relative;z-index:3}
.ml-hc-tag-r{display:flex;gap:0;flex-wrap:wrap}
.ml-hc-tag-r span{display:inline-block;animation:lIn .3s ease both}
.ml-hc-tag-r.t1 span{font-family:'Poppins',sans-serif;font-size:8px;font-weight:300;letter-spacing:4.5px;text-transform:uppercase;color:rgba(255,255,255,.2)}
.ml-hc-tag-sep{width:24px;height:1px;background:linear-gradient(90deg,rgba(253,28,0,.5),transparent);margin:4px 0;animation:fade .4s ease .9s both}
.ml-hc-tag-r.t2 span{font-family:'Poppins',sans-serif;font-size:9px;font-weight:700;letter-spacing:4.5px;text-transform:uppercase;color:var(--r);animation:lIn .3s ease both,tSweep 3s ease-in-out 2s infinite}
.ml-hc-sp{position:absolute;right:-17px;top:-10px;width:150px;height:150px;z-index:2}
.ml-hc-sp canvas{display:block;width:100%!important;height:100%!important;border-radius:50%}
.ml-hc-sp-g{position:absolute;left:50%;top:50%;width:125px;height:125px;border-radius:50%;background:radial-gradient(circle,rgba(253,28,0,.12),transparent 60%);animation:breathe 4s ease-in-out infinite;pointer-events:none}

/* Buttons */
.ml-act{display:flex;gap:10px;margin:0 18px;animation:up .5s ease .4s both}
.ml-ab{display:flex;align-items:center;justify-content:center;gap:7px;flex:1;padding:13px;border-radius:12px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:transform .1s;-webkit-tap-highlight-color:transparent;position:relative;overflow:hidden}
.ml-ab:active{transform:scale(.97)}
.ml-ab-p{background:var(--r);color:#fff;box-shadow:0 4px 16px rgba(253,28,0,.25)}
.ml-ab-p::after{content:'';position:absolute;top:0;left:-80%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);animation:sweep 4s ease-in-out 2s infinite}
.ml-ab-s{background:rgba(255,255,255,.025);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.06)}
.ml-ab i{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-style:normal;flex-shrink:0}
.ml-ab-p i{background:rgba(255,255,255,.12)}
.ml-ab-s i{background:rgba(255,255,255,.04)}

/* Track badges */
.ml-trk{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:0 18px;animation:fade .5s ease .6s both}
.ml-trk-c{padding:7px 4px;border-radius:8px;border:1px solid rgba(253,28,0,.08);background:rgba(253,28,0,.02);font-family:'DM Sans',sans-serif;font-size:7px;font-weight:600;letter-spacing:1.5px;color:rgba(253,28,0,.45);text-align:center;text-transform:uppercase}

/* Stats 2x2 */
.ml-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 18px}
.ml-gc{padding:16px 12px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:11px;animation:pop .45s cubic-bezier(.3,1.5,.6,1) both,cGlow 5s ease-in-out infinite}
.ml-gc:nth-child(1){animation-delay:.5s,.5s}
.ml-gc:nth-child(2){animation-delay:.6s,.6s}
.ml-gc:nth-child(3){animation-delay:.7s,.7s}
.ml-gc:nth-child(4){animation-delay:.8s,.8s}
.ml-gc-ic{width:36px;height:36px;border-radius:10px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ml-gc-ic svg{stroke:var(--r);fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;width:17px;height:17px}
.ml-gc-v{font-size:16px;font-weight:800;color:#fff}
.ml-gc-l{font-size:7px;color:var(--r);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-top:1px}

/* BOTTOM: countdown */
.ml-bot{flex-shrink:0;padding:0 18px;z-index:2;animation:fade .6s ease .9s both;margin-top:30px}
.ml-cd{display:flex;flex-direction:column;align-items:center;padding:14px 14px 12px;border-radius:14px;background:rgba(253,28,0,.02);border:1px solid rgba(253,28,0,.08);box-shadow:0 0 16px rgba(253,28,0,.04);animation:cGlow 5s ease-in-out 2s infinite}
.ml-cd-row{display:flex;align-items:flex-start}
.ml-cd-u{display:flex;flex-direction:column;align-items:center;min-width:50px}
.ml-cd-n{font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-size:30px;font-weight:400;color:#fff;letter-spacing:2px;line-height:1;text-align:center}
.ml-cd-n.flip{animation:up .3s ease}
.ml-cd-c{font-family:'Poppins',sans-serif;font-size:22px;font-weight:300;color:var(--r);line-height:1;padding:0 2px;margin-top:1px;animation:pulse 2s ease-in-out infinite}
.ml-cd-lb{font-family:'DM Sans',sans-serif;font-size:7px;font-weight:600;color:var(--r);letter-spacing:1.5px;margin-top:4px;text-transform:uppercase}

.ml-bot-deco{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;animation:linePulse 3s ease-in-out infinite}
.ml-bot-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(253,28,0,.1),transparent)}
.ml-bot-dot{width:3px;height:3px;border-radius:50%;background:var(--r);opacity:.25}

/* Nebula */
.ml-nebula{position:absolute;bottom:0;left:0;right:0;height:35%;pointer-events:none;z-index:1;
  background:radial-gradient(ellipse at 30% 80%,rgba(253,28,0,.12),transparent 50%),radial-gradient(ellipse at 70% 90%,rgba(200,60,10,.1),transparent 45%),radial-gradient(ellipse at 50% 100%,rgba(253,28,0,.08),transparent 55%),radial-gradient(ellipse at 15% 95%,rgba(180,40,0,.06),transparent 40%),radial-gradient(ellipse at 85% 85%,rgba(220,50,5,.07),transparent 40%);
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.3) 25%,rgba(0,0,0,.7) 60%,rgba(0,0,0,1) 100%);
  mask-image:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.3) 25%,rgba(0,0,0,.7) 60%,rgba(0,0,0,1) 100%);
}
        `}</style>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.cdnfonts.com/css/astro-futuristic-font" rel="stylesheet"/>

        <div className="ml">

          {/* TOP: AI powered */}
          <div className="ml-top">
            <div className="ml-ai">
              <div className="ml-ai-3d"><div className="ml-ai-in"><div className="ml-ai-f">AI</div><div className="ml-ai-f">AI</div></div></div>
              <div className="ml-ai-t">POWERED</div>
            </div>
          </div>

          {/* MIDDLE */}
          <div className="ml-mid">

            <div className="ml-hc">
              <div className="ml-hc-t">PROJECT</div>
              <div className="ml-hc-t ml-hc-tw">SPACE</div>
              <div className="ml-hc-tag">
                <div className="ml-hc-tag-r t1">{tTop.map((c,i) => <span key={i} style={{animationDelay:`${.6+i*.03}s`}}>{c===" "?"\u00A0\u00A0":c}</span>)}</div>
                <div className="ml-hc-tag-sep"/>
                <div className="ml-hc-tag-r t2">{tBtm.map((c,i) => <span key={i} style={{animationDelay:`${.95+i*.04}s`}}>{c===" "?"\u00A0\u00A0":c}</span>)}</div>
              </div>
              <div className="ml-hc-sp" ref={sphereMountRef}><div className="ml-hc-sp-g"/></div>
            </div>

            <div className="ml-act">
              <button className="ml-ab ml-ab-p" onClick={()=>routerHook.push('/auth/register')}><i><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg></i>Create Account</button>
              <button className="ml-ab ml-ab-s" onClick={()=>routerHook.push('/auth/login')}><i><svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M6 2H3a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 4.5L12 7l-2.5 2.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="5.5" y2="7" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg></i>Login</button>
            </div>

            <div className="ml-trk">
              {tracks.map((tr,i) => <div key={i} className="ml-trk-c">{tr}</div>)}
            </div>

            <div className="ml-grid">
              <div className="ml-gc"><div className="ml-gc-ic"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><div className="ml-gc-v">7 Days</div><div className="ml-gc-l">May 6 – 12, 2026</div></div></div>
              <div className="ml-gc"><div className="ml-gc-ic"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div><div><div className="ml-gc-v">900+</div><div className="ml-gc-l">Students</div></div></div>
              <div className="ml-gc"><div className="ml-gc-ic"><svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg></div><div><div className="ml-gc-v">158</div><div className="ml-gc-l">Projects</div></div></div>
              <div className="ml-gc"><div className="ml-gc-ic"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div><div><div className="ml-gc-v">6 Tracks</div><div className="ml-gc-l">Technologies</div></div></div>
            </div>

          </div>

          {/* BOTTOM: countdown */}
          <div className="ml-bot">
            <div className="ml-cd">
              <div className="ml-cd-row">
                <div className="ml-cd-u"><div className="ml-cd-n" id="cd-days">00</div><div className="ml-cd-lb">Days</div></div>
                <div className="ml-cd-c">:</div>
                <div className="ml-cd-u"><div className="ml-cd-n" id="cd-hours">00</div><div className="ml-cd-lb">Hrs</div></div>
                <div className="ml-cd-c">:</div>
                <div className="ml-cd-u"><div className="ml-cd-n" id="cd-mins">00</div><div className="ml-cd-lb">Min</div></div>
                <div className="ml-cd-c">:</div>
                <div className="ml-cd-u"><div className="ml-cd-n" id="cd-secs">00</div><div className="ml-cd-lb">Sec</div></div>
              </div>
            </div>
            <div className="ml-bot-deco">
              <div className="ml-bot-line"/>
              <div className="ml-bot-dot"/>
              <div className="ml-bot-dot"/>
              <div className="ml-bot-dot"/>
              <div className="ml-bot-line"/>
            </div>
          </div>

          {/* Nebula */}
          <div className="ml-nebula"/>

        </div>
      </>
    )
  }
    /* ═══ DESKTOP LAYOUT ═══ */
  return (
    <>
      <style>{`
        ${globalStyles}

        #galaxy-bg { position:fixed;inset:0;width:100%;height:100%;z-index:0; }

        .scanline {
          position:fixed;inset:0;
          background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,0.014) 2px,rgba(0,0,0,0.014) 4px);
          pointer-events:none;z-index:2;
        }

        .page {
          position:relative;z-index:3;
          display:flex;align-items:center;justify-content:space-between;
          width:100%;height:100vh;padding:0 5vw;
          font-family:'Poppins',sans-serif;
        }

        /* ── AI POWERED — 3D spinner ── */
        .ai-powered-corner {
          position:fixed;top:clamp(14px,3vw,28px);right:clamp(16px,3vw,36px);z-index:100;
          display:flex;flex-direction:column;align-items:center;gap:0;
          animation:fadeIn 2s ease 1.4s both;
        }
        .ai-spinner {
          position:relative;width:clamp(40px,5.5vw,70px);height:clamp(34px,4.5vw,58px);
          perspective:400px;
        }
        .ai-spinner-inner {
          width:100%;height:100%;
          transform-style:preserve-3d;
          animation:aiSpin 4s linear infinite;
        }
        .ai-face {
          position:absolute;inset:0;
          display:flex;align-items:center;justify-content:center;
          font-family:'Poppins',sans-serif;font-weight:300;font-size:clamp(28px,4.2vw,54px);
          color:#fff;line-height:1;
          text-shadow:0 0 30px rgba(255,85,0,0.4),0 0 60px rgba(255,120,30,0.2),0 0 8px rgba(255,170,64,0.3);
          backface-visibility:hidden;
          -webkit-backface-visibility:hidden;
        }
        .ai-face-back { transform:rotateY(180deg); }
        @keyframes aiSpin { 0%{transform:rotateY(0deg);} 100%{transform:rotateY(360deg);} }

        .powered-text {
          font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-weight:700;font-size:clamp(6px,0.8vw,9.5px);
          letter-spacing:clamp(2px,0.5vw,5px);text-transform:uppercase;margin-top:-2px;
          background-image:linear-gradient(90deg,#ff9ffc,#b19eef,#fd1c00,#ff9ffc);
          background-size:200% 100%;
          background-clip:text;-webkit-background-clip:text;color:transparent;
          filter:brightness(1);
          animation:poweredShimmer 3s linear infinite, poweredGlow 2s ease-in-out infinite;
        }
        @keyframes poweredShimmer { 0%{background-position:0% 50%;} 100%{background-position:200% 50%;} }
        @keyframes poweredGlow {
          0%,100%{filter:brightness(1) drop-shadow(0 0 2px rgba(177,158,239,0.3));}
          50%{filter:brightness(1.4) drop-shadow(0 0 6px rgba(177,158,239,0.6));}
        }

        /* ── LEFT ── */
        .left { flex:0 0 44%;display:flex;flex-direction:column;justify-content:center;gap:0; }

        .title-wrap { margin-bottom:28px;display:flex;flex-direction:column;gap:28px; }

        .title-main {
          display:flex;align-items:center;
          font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-weight:400;
          font-size:clamp(36px,6vw,90px);text-transform:uppercase;
          white-space:nowrap;line-height:1.05;
          color:#fd1c00;
          -webkit-text-stroke:1px rgba(253,28,0,0.15);
          paint-order:stroke fill;
          opacity:0;
          animation:titleReveal 1.2s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .title-main span { display:inline-block; }
        .tl { margin-right:clamp(6px,1vw,14px); }
        .tl-tight { margin-right:clamp(4px,0.8vw,10px); }
        .tl-last { margin-right:0; }

        .title-main.glow-active {
          animation:titleReveal 1.2s cubic-bezier(0.16,1,0.3,1) forwards,
                    titlePulseRed 5s ease-in-out infinite;
        }
        .title-line2 {
          color:#ffffff;
          -webkit-text-stroke:1px rgba(255,255,255,0.15);
          animation-delay:0.35s;
        }
        .title-line2.glow-active {
          animation:titleReveal 1.2s cubic-bezier(0.16,1,0.3,1) 0.35s forwards,
                    titlePulseWhite 5s ease-in-out 0.35s infinite;
        }

        @keyframes titleReveal {
          0%{opacity:0;transform:translateY(40px) scale(0.92);filter:blur(8px);}
          60%{opacity:1;filter:blur(0);}
          100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);}
        }
        @keyframes titlePulseRed {
          0%,100%{ color:#fd1c00;text-shadow:0 0 4px rgba(253,28,0,0.2);transform:scale(1); }
          50%{ color:#fd1c00;text-shadow:0 0 15px rgba(253,28,0,0.5),0 0 40px rgba(253,28,0,0.2),0 0 80px rgba(253,28,0,0.08);transform:scale(1.008); }
        }
        @keyframes titlePulseWhite {
          0%,100%{ color:#ffffff;text-shadow:0 0 4px rgba(255,255,255,0.1);transform:scale(1); }
          50%{ color:#ffffff;text-shadow:0 0 12px rgba(255,255,255,0.4),0 0 35px rgba(255,255,255,0.12),0 0 60px rgba(255,255,255,0.05);transform:scale(1.008); }
        }

        /* ── TAGLINE ── */
        .tagline { margin-bottom:32px;opacity:0;animation:tagFade 1s ease 0.7s forwards; }
        @keyframes tagFade { to{opacity:1;} }
        .tagline-container { display:flex;flex-direction:column;gap:10px; }
        .tagline-top {
          display:flex;align-items:center;gap:0;
          font-family:'Poppins',sans-serif;font-weight:300;font-size:13px;
          letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,0.45);
        }
        .tagline-top span { opacity:0;animation:letterSlide 0.5s ease forwards; }
        @keyframes letterSlide { from{opacity:0;transform:translateX(-8px);} to{opacity:1;transform:translateX(0);} }

        .tagline-bottom {
          display:flex;align-items:center;gap:0;
          font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;
          letter-spacing:5px;text-transform:uppercase;
        }
        .tagline-make { color:#fd1c00;text-shadow:0 0 20px rgba(253,28,0,0.3); }
        .tagline-it { color:#fd4a30;margin:0 2px; }
        .tagline-happen { color:#fd1c00;text-shadow:0 0 20px rgba(253,28,0,0.3); }
        .tagline-bottom span { opacity:0;animation:letterSlide 0.5s ease forwards; }

        .tagline-line-sep {
          width:40px;height:1px;
          background:linear-gradient(90deg,rgba(253,28,0,0.6),rgba(253,28,0,0));
          margin:4px 0;opacity:0;animation:lineGrow 0.8s ease 1.2s forwards;
        }
        @keyframes lineGrow { from{opacity:0;width:0;} to{opacity:1;width:40px;} }

        /* ── BUTTONS ── */
        .buttons {
          display:flex;flex-direction:row;align-items:center;gap:14px;
          opacity:0;animation:btnReveal 0.8s ease 1s forwards;
        }
        @keyframes btnReveal { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

        .btn {
          display:flex;align-items:center;gap:10px;padding:12px 22px;border-radius:10px;
          font-family:'Poppins',sans-serif;font-size:13px;font-weight:500;
          cursor:pointer;border:none;white-space:nowrap;
          transition:transform 0.2s ease,box-shadow 0.2s ease;
          position:relative;overflow:hidden;
        }
        .btn:hover { transform:translateY(-3px); }
        .btn:active { transform:scale(0.97); }

        .btn-primary { background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff;box-shadow:0 4px 24px rgba(253,28,0,0.3); }
        .btn-primary:hover { box-shadow:0 8px 44px rgba(253,28,0,0.55); }
        .btn-secondary {
          background:rgba(255,255,255,0.06);color:#fff;box-shadow:none;
          border:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(10px);
        }
        .btn-secondary:hover { background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.25);box-shadow:0 4px 20px rgba(255,255,255,0.06); }

        .btn-icon {
          width:28px;height:28px;border-radius:6px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;background:rgba(255,255,255,0.14);
        }
        .btn-arrow { opacity:0.4;transition:transform 0.2s,opacity 0.2s; }
        .btn:hover .btn-arrow { transform:translateX(4px);opacity:1; }

        /* ── RIGHT — sphere ── */
        .right {
          flex:0 0 53%;position:relative;height:100vh;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
        }
        #sphere-mount {
          position:absolute;top:50%;left:50%;
          transform:translate(calc(-50% + 50px),-55%);
          width:min(120%,1100px);
          height:min(120%,1100px);
          display:flex;align-items:center;justify-content:center;
        }
        #sphere-mount canvas { display:block;width:100%!important;height:100%!important; }

        .sphere-glow {
          position:absolute;left:50%;top:50%;
          transform:translate(-50%,-50%);
          width:260px;height:260px;border-radius:50%;
          background:radial-gradient(circle,rgba(253,28,0,0.08) 0%,transparent 70%);
          animation:breathe 4s ease-in-out infinite;z-index:8;pointer-events:none;
        }

        /* ── COUNTDOWN — centered under sphere ── */
        .countdown-bar {
          position:fixed;bottom:13px;z-index:50;
          /* .right starts at 47% (left takes 44% + gap), sphere center is ~73.5% of viewport */
          left:75%;
          transform:translateX(-50%);
          display:flex;align-items:center;justify-content:center;gap:0;
          opacity:0;animation:countFade 1s ease 1.5s forwards;
        }
        @keyframes countFade { to{opacity:1;} }

        .cd-block {
          display:flex;flex-direction:column;align-items:center;
          min-width:clamp(50px,6vw,80px);
        }
        .cd-colon {
          display:flex;align-items:center;
          font-family:'Poppins',sans-serif;font-size:clamp(18px,2.2vw,28px);font-weight:400;
          color:#fd1c00;line-height:1;
          text-shadow:0 0 8px rgba(253,28,0,0.3);
          padding:0 2px;margin-bottom:clamp(10px,1.5vw,18px);
        }
        .cd-num {
          font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;
          font-size:clamp(24px,3vw,36px);font-weight:400;
          color:#fff;line-height:1;letter-spacing:2px;
          text-shadow:0 0 15px rgba(255,255,255,0.06);
          transition:transform 0.3s ease;
        }
        .cd-num.flip { animation:numFlip 0.3s ease; }
        @keyframes numFlip {
          0%{transform:translateY(0);opacity:1;}
          40%{transform:translateY(-4px);opacity:0.4;}
          100%{transform:translateY(0);opacity:1;}
        }
        .cd-label {
          font-family:'Poppins',sans-serif;font-size:clamp(7px,0.8vw,10px);font-weight:600;
          letter-spacing:clamp(1.5px,0.3vw,3px);text-transform:uppercase;
          color:#fd1c00;margin-top:5px;
          text-shadow:0 0 10px rgba(253,28,0,0.2);
        }

        @keyframes breathe { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.4;} 50%{transform:translate(-50%,-50%) scale(1.8);opacity:1;} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.88);} to{opacity:1;transform:scale(1);} }

        /* ══ FLUID RESPONSIVE — works at ANY window size ══ */

        /* When height is short (landscape or small window) */
        @media(max-height:600px) {
          .page { padding:0 3vw; }
          .title-main { font-size:clamp(24px,5vw,50px); }
          .tl { margin-right:clamp(4px,0.8vw,12px); }
          .tl-tight { margin-right:clamp(3px,0.6vw,9px); }
          .title-wrap { gap:clamp(8px,1.5vh,20px); margin-bottom:clamp(10px,2vh,24px); }
          .tagline { margin-bottom:clamp(12px,2vh,28px); }
          .tagline-top { font-size:clamp(8px,1.2vw,13px); }
          .tagline-bottom { font-size:clamp(9px,1.3vw,15px); }
          .btn { padding:clamp(8px,1.2vh,13px) clamp(14px,2vw,22px); font-size:clamp(11px,1.2vw,13px); }
          .countdown-bar { bottom:8px; }
          .cd-num { font-size:clamp(16px,2.5vw,28px); }
          .cd-colon { font-size:clamp(16px,2vw,24px); margin-bottom:12px; }
          .cd-label { font-size:clamp(6px,0.8vw,9px); }
          .cd-block { min-width:clamp(40px,6vw,70px); }
        }

        /* ── Narrow width (< 900px) — start adjusting layout ── */
        @media(max-width:900px) {
          .page { padding:0 4vw; }
          .left { flex:0 0 48%; }
          .right { flex:0 0 48%; }
          .title-main { font-size:clamp(32px,5.5vw,65px); }
          .tl { margin-right:clamp(6px,0.9vw,12px); }
          .tl-tight { margin-right:clamp(4px,0.7vw,9px); }
          #sphere-mount { width:min(140%,800px); height:min(140%,800px); }
          .ai-powered-corner { top:clamp(12px,2vw,28px); right:clamp(12px,2vw,28px); }
          .ai-face { font-size:clamp(28px,4.5vw,50px); }
          .ai-spinner { width:clamp(40px,6vw,65px); height:clamp(34px,5vw,55px); }
          .powered-text { font-size:clamp(6px,0.9vw,9px); letter-spacing:clamp(2px,0.5vw,5px); }
          .countdown-bar { left:clamp(60%,72%,75%); }
          .cd-block { min-width:clamp(50px,7vw,75px); }
          .cd-num { font-size:clamp(18px,2.8vw,32px); }
          .cd-colon { font-size:clamp(18px,2.5vw,26px); }
          .cd-label { font-size:clamp(7px,1vw,10px); }
        }

        /* ── Stack layout (< 700px) — column flow ── */
        @media(max-width:700px) {
          html,body { overflow:auto!important; }
          .page {
            flex-direction:column;
            justify-content:flex-start;
            align-items:flex-start;
            height:auto; min-height:100vh;
            padding:clamp(20px,5vw,40px) 5vw clamp(100px,18vh,140px);
            gap:clamp(12px,2.5vw,24px);
            overflow-y:auto;
          }
          .left {
            flex:none; width:100%;
            text-align:left; align-items:flex-start;
            display:flex; flex-direction:column;
          }
          .right {
            flex:none; width:100%;
            height:clamp(220px,55vw,380px);
            min-height:200px;
            overflow:visible;
            display:flex; align-items:center; justify-content:center;
          }
          #sphere-mount {
            position:relative;
            top:auto; left:auto;
            transform:none;
            width:clamp(220px,60vw,380px);
            height:clamp(220px,60vw,380px);
          }
          .sphere-glow { width:clamp(80px,20vw,160px); height:clamp(80px,20vw,160px); }
          .title-main { font-size:clamp(28px,9vw,52px); }
          .tl { margin-right:clamp(4px,1.2vw,10px); }
          .tl-tight { margin-right:clamp(3px,0.8vw,7px); }
          .title-wrap { gap:clamp(10px,3vw,20px); margin-bottom:clamp(12px,3vw,22px); }
          .tagline { margin-bottom:clamp(14px,3.5vw,26px); }
          .tagline-top { font-size:clamp(8px,2.2vw,12px); letter-spacing:clamp(2px,1vw,5px); }
          .tagline-bottom { font-size:clamp(9px,2.5vw,14px); letter-spacing:clamp(2px,1vw,5px); }
          .buttons { flex-wrap:wrap; gap:clamp(8px,2vw,12px); }
          .btn { padding:clamp(9px,2.2vw,13px) clamp(14px,3.5vw,22px); font-size:clamp(11px,2.8vw,13px); }
          .ai-powered-corner { top:10px; right:12px; }
          .ai-face { font-size:clamp(22px,6vw,36px); }
          .ai-spinner { width:clamp(32px,9vw,50px); height:clamp(26px,7vw,42px); }
          .powered-text { font-size:clamp(5px,1.5vw,8px); letter-spacing:clamp(1.5px,0.5vw,3px); }
          .countdown-bar {
            left:50%; right:auto;
            transform:translateX(-50%);
            bottom:clamp(10px,2.5vw,20px);
            width:90vw;
            max-width:400px;
            justify-content:center;
          }
          .cd-block { min-width:clamp(36px,9vw,60px); }
          .cd-num { font-size:clamp(16px,5.5vw,28px); }
          .cd-colon { font-size:clamp(14px,4vw,22px); margin-bottom:clamp(8px,2vw,14px); padding:0; }
          .cd-label { font-size:clamp(5px,1.5vw,8px); letter-spacing:clamp(1px,0.4vw,2.5px); }
          .scanline { display:none; }
        }

        /* ── Very narrow (< 400px) ── */
        @media(max-width:400px) {
          .page { padding:clamp(16px,4vw,30px) 4vw clamp(90px,16vh,130px); }
          .buttons { flex-direction:column; width:100%; }
          .btn { width:100%; justify-content:center; }
          .title-main { font-size:clamp(22px,8vw,38px); }
          .ai-powered-corner { top:8px; right:8px; }
          .cd-block { min-width:clamp(32px,8vw,50px); }
          .cd-num { font-size:clamp(14px,5vw,24px); }
          .cd-colon { font-size:clamp(12px,3.5vw,18px); }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet" />
      <link href="https://fonts.cdnfonts.com/css/astro" rel="stylesheet" />
      <link href="https://fonts.cdnfonts.com/css/astro-futuristic-font" rel="stylesheet" />

      <canvas ref={galaxyRef} id="galaxy-bg" />
      <div className="scanline" />

      {/* AI POWERED — 3D spinner */}
      <div className="ai-powered-corner">
        <div className="ai-spinner">
          <div className="ai-spinner-inner">
            <div className="ai-face">AI</div>
            <div className="ai-face ai-face-back">AI</div>
          </div>
        </div>
        <div className="powered-text">POWERED</div>
      </div>

      <div className="page">
        {/* LEFT */}
        <div className="left">
          <div className="title-wrap">
            <span className="title-main">
              <span className="tl">P</span><span className="tl">R</span><span className="tl">O</span><span className="tl">J</span><span className="tl">E</span><span className="tl-tight">C</span><span className="tl-last">T</span>
            </span>
            <span className="title-main title-line2">
              <span className="tl">S</span><span className="tl">P</span><span className="tl">A</span><span className="tl-tight">C</span><span className="tl-last">E</span>
            </span>
          </div>
          <div className="tagline">
            <div className="tagline-container">
              <div className="tagline-top">
                <span style={{animationDelay:'0.8s'}}>D</span><span style={{animationDelay:'0.84s'}}>O</span><span style={{animationDelay:'0.88s'}}>N</span><span style={{animationDelay:'0.92s'}}>&apos;</span><span style={{animationDelay:'0.96s'}}>T</span><span style={{animationDelay:'1s'}}>&nbsp;&nbsp;</span><span style={{animationDelay:'1.04s'}}>J</span><span style={{animationDelay:'1.08s'}}>U</span><span style={{animationDelay:'1.12s'}}>S</span><span style={{animationDelay:'1.16s'}}>T</span><span style={{animationDelay:'1.2s'}}>&nbsp;&nbsp;</span><span style={{animationDelay:'1.24s'}}>T</span><span style={{animationDelay:'1.28s'}}>H</span><span style={{animationDelay:'1.32s'}}>I</span><span style={{animationDelay:'1.36s'}}>N</span><span style={{animationDelay:'1.4s'}}>K</span>
              </div>
              <div className="tagline-line-sep" />
              <div className="tagline-bottom">
                <span className="tagline-make" style={{animationDelay:'1.3s'}}>M</span><span className="tagline-make" style={{animationDelay:'1.34s'}}>A</span><span className="tagline-make" style={{animationDelay:'1.38s'}}>K</span><span className="tagline-make" style={{animationDelay:'1.42s'}}>E</span><span style={{animationDelay:'1.46s'}}>&nbsp;&nbsp;</span><span className="tagline-it" style={{animationDelay:'1.5s'}}>I</span><span className="tagline-it" style={{animationDelay:'1.54s'}}>T</span><span style={{animationDelay:'1.58s'}}>&nbsp;&nbsp;</span><span className="tagline-happen" style={{animationDelay:'1.62s'}}>H</span><span className="tagline-happen" style={{animationDelay:'1.66s'}}>A</span><span className="tagline-happen" style={{animationDelay:'1.7s'}}>P</span><span className="tagline-happen" style={{animationDelay:'1.74s'}}>P</span><span className="tagline-happen" style={{animationDelay:'1.78s'}}>E</span><span className="tagline-happen" style={{animationDelay:'1.82s'}}>N</span>
              </div>
            </div>
          </div>
          <div className="buttons">
            <button className="btn btn-primary" onClick={() => routerHook.push('/auth/register')}>
              <div className="btn-icon">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Create Account</span>
              <svg className="btn-arrow" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5h8M7 3.5l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn btn-secondary" onClick={() => routerHook.push('/auth/login')}>
              <div className="btn-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M6 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 4.5L12 7l-2.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="7" x2="5.5" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Login</span>
              <svg className="btn-arrow" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5h8M7 3.5l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div id="sphere-mount" ref={sphereMountRef} />
          <div className="sphere-glow" />
        </div>
      </div>

      {/* COUNTDOWN — bottom bar */}
      <div className="countdown-bar">
        <div className="cd-block"><div className="cd-num" id="cd-days">00</div><div className="cd-label">Days</div></div>
        <div className="cd-colon">:</div>
        <div className="cd-block"><div className="cd-num" id="cd-hours">00</div><div className="cd-label">Hours</div></div>
        <div className="cd-colon">:</div>
        <div className="cd-block"><div className="cd-num" id="cd-mins">00</div><div className="cd-label">Minutes</div></div>
        <div className="cd-colon">:</div>
        <div className="cd-block"><div className="cd-num" id="cd-secs">00</div><div className="cd-label">Seconds</div></div>
      </div>
    </>
  )
}