"use client"

import { useEffect, useRef } from "react"

export default function SpaceBackground() {
  var canvasRef = useRef(null)
  var sphereRef = useRef(null)
  var threeLoaded = useRef(false)

  /* ═══ GALAXY STARFIELD BACKGROUND (from landing page HTML) ═══ */
  useEffect(function () {
    var cv = canvasRef.current
    if (!cv) return
    var ctx = cv.getContext("2d")
    var W, H
    var dpr = Math.min(window.devicePixelRatio, 2)
    var nebulaCanvas = document.createElement("canvas")
    var nCtx = nebulaCanvas.getContext("2d")
    var layers = [
      { stars: [], count: 600, rMin: 0.15, rMax: 0.5, oMin: 0.1, oMax: 0.35, speed: 0.08 },
      { stars: [], count: 300, rMin: 0.3, rMax: 0.9, oMin: 0.15, oMax: 0.5, speed: 0.18 },
      { stars: [], count: 80, rMin: 0.5, rMax: 1.4, oMin: 0.25, oMax: 0.7, speed: 0.35, bright: true }
    ]
    var bandStars = [], sparks = [], NUM_SPARK = 18, bandAngle = -0.15, time = 0
    var galaxyAngle = 0, scrollY = 0, scrollX = 0
    var animId

    function resize() {
      W = cv.width = window.innerWidth * dpr
      H = cv.height = window.innerHeight * dpr
      cv.style.width = window.innerWidth + "px"
      cv.style.height = window.innerHeight + "px"
      nebulaCanvas.width = W + 80 * dpr
      nebulaCanvas.height = H + 80 * dpr
      initStars()
      renderNebula()
    }

    function initStars() {
      for (var l = 0; l < layers.length; l++) {
        var ly = layers[l]; ly.stars = []
        for (var i = 0; i < ly.count; i++) {
          ly.stars.push({ x: Math.random() * W, y: Math.random() * (H + 100 * dpr), r: (Math.random() * (ly.rMax - ly.rMin) + ly.rMin) * dpr, o: Math.random() * (ly.oMax - ly.oMin) + ly.oMin, twinklePhase: Math.random() * Math.PI * 2, twinkleSpeed: Math.random() * 0.003 + 0.001 })
        }
      }
      bandStars = []
      for (var i = 0; i < 500; i++) { bandStars.push({ x: (Math.random() - 0.5) * W * 1.4, y: (Math.random() - 0.5) * H * 0.2, r: (Math.random() * 0.5 + 0.15) * dpr, o: Math.random() * 0.3 + 0.08 }) }
      sparks = []
      for (var i = 0; i < NUM_SPARK; i++) { sparks.push({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.0 + 0.4) * dpr, phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.008 + 0.004, maxLife: Math.random() * 0.7 + 0.3, layer: Math.floor(Math.random() * 3) }) }
    }

    function renderNebula() {
      var nW = nebulaCanvas.width, nH = nebulaCanvas.height
      nCtx.clearRect(0, 0, nW, nH)
      nCtx.fillStyle = "#000000"; nCtx.fillRect(0, 0, nW, nH)

      var topGrd = nCtx.createLinearGradient(0, 0, 0, nH * 0.15)
      topGrd.addColorStop(0, "rgba(180,50,0,0.18)"); topGrd.addColorStop(0.4, "rgba(100,25,0,0.08)"); topGrd.addColorStop(1, "rgba(0,0,0,0)")
      nCtx.fillStyle = topGrd; nCtx.fillRect(0, 0, nW, nH * 0.15)

      var botGrd = nCtx.createLinearGradient(0, nH * 0.85, 0, nH)
      botGrd.addColorStop(0, "rgba(0,0,0,0)"); botGrd.addColorStop(0.6, "rgba(100,25,0,0.08)"); botGrd.addColorStop(1, "rgba(180,50,0,0.18)")
      nCtx.fillStyle = botGrd; nCtx.fillRect(0, nH * 0.85, nW, nH * 0.15)

      var skyHaze = nCtx.createRadialGradient(nW * 0.5, nH * 0.45, 0, nW * 0.5, nH * 0.45, Math.max(nW, nH) * 0.55)
      skyHaze.addColorStop(0, "rgba(8,8,20,0.15)"); skyHaze.addColorStop(0.5, "rgba(5,4,12,0.08)"); skyHaze.addColorStop(1, "rgba(0,0,0,0)")
      nCtx.fillStyle = skyHaze; nCtx.fillRect(0, 0, nW, nH)

      var dustClouds = [
        { x: nW * 0.15, y: nH * 0.3, w: nW * 0.3, h: nH * 0.08, a: 0.04, rot: -0.1 },
        { x: nW * 0.55, y: nH * 0.5, w: nW * 0.35, h: nH * 0.06, a: 0.035, rot: 0.05 },
        { x: nW * 0.3, y: nH * 0.65, w: nW * 0.25, h: nH * 0.05, a: 0.03, rot: -0.08 },
        { x: nW * 0.7, y: nH * 0.25, w: nW * 0.2, h: nH * 0.07, a: 0.03, rot: 0.12 },
        { x: nW * 0.45, y: nH * 0.4, w: nW * 0.4, h: nH * 0.1, a: 0.025, rot: -0.05 }
      ]
      for (var i = 0; i < dustClouds.length; i++) {
        var d = dustClouds[i]; nCtx.save(); nCtx.translate(d.x + d.w / 2, d.y + d.h / 2); nCtx.rotate(d.rot)
        var dg = nCtx.createRadialGradient(0, 0, 0, 0, 0, d.w * 0.5)
        dg.addColorStop(0, "rgba(20,15,30," + d.a + ")"); dg.addColorStop(0.5, "rgba(12,8,18," + (d.a * 0.6) + ")"); dg.addColorStop(1, "rgba(0,0,0,0)")
        nCtx.fillStyle = dg; nCtx.scale(1, d.h / d.w); nCtx.beginPath(); nCtx.arc(0, 0, d.w * 0.5, 0, Math.PI * 2); nCtx.fill(); nCtx.restore()
      }

      nCtx.save(); nCtx.translate(nW / 2, nH / 2); nCtx.rotate(bandAngle)
      var bandW = nW * 1.6, bandH = nH * 0.35
      var bandGrd = nCtx.createLinearGradient(0, -bandH, 0, bandH)
      bandGrd.addColorStop(0, "rgba(0,0,0,0)"); bandGrd.addColorStop(0.25, "rgba(30,18,8,0.03)"); bandGrd.addColorStop(0.4, "rgba(60,30,10,0.06)")
      bandGrd.addColorStop(0.5, "rgba(80,40,14,0.08)"); bandGrd.addColorStop(0.6, "rgba(60,30,10,0.06)"); bandGrd.addColorStop(0.75, "rgba(30,18,8,0.03)"); bandGrd.addColorStop(1, "rgba(0,0,0,0)")
      nCtx.fillStyle = bandGrd; nCtx.fillRect(-bandW / 2, -bandH, bandW, bandH * 2)

      var coreH = nH * 0.1
      var coreGrd = nCtx.createLinearGradient(0, -coreH, 0, coreH)
      coreGrd.addColorStop(0, "rgba(0,0,0,0)"); coreGrd.addColorStop(0.3, "rgba(100,45,12,0.04)"); coreGrd.addColorStop(0.5, "rgba(130,55,18,0.06)"); coreGrd.addColorStop(0.7, "rgba(100,45,12,0.04)"); coreGrd.addColorStop(1, "rgba(0,0,0,0)")
      nCtx.fillStyle = coreGrd; nCtx.fillRect(-bandW / 2, -coreH, bandW, coreH * 2)

      for (var i = 0; i < bandStars.length; i++) { var bs = bandStars[i]; nCtx.globalAlpha = bs.o; nCtx.fillStyle = "#fff"; nCtx.beginPath(); nCtx.arc(bs.x, bs.y, bs.r, 0, Math.PI * 2); nCtx.fill() }
      nCtx.globalAlpha = 1; nCtx.restore()

      var nebulae = [
        { x: nW * 0.2, y: nH * 0.2, r: nW * 0.1, c: "rgba(100,35,5,0.02)" },
        { x: nW * 0.75, y: nH * 0.55, r: nW * 0.08, c: "rgba(80,30,8,0.018)" },
        { x: nW * 0.5, y: nH * 0.45, r: nW * 0.12, c: "rgba(90,40,10,0.02)" },
        { x: nW * 0.85, y: nH * 0.8, r: nW * 0.07, c: "rgba(120,45,10,0.02)" },
        { x: nW * 0.3, y: nH * 0.78, r: nW * 0.09, c: "rgba(100,35,5,0.018)" }
      ]
      for (var i = 0; i < nebulae.length; i++) { var n = nebulae[i]; var ng = nCtx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r); ng.addColorStop(0, n.c); ng.addColorStop(1, "rgba(0,0,0,0)"); nCtx.fillStyle = ng; nCtx.beginPath(); nCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2); nCtx.fill() }
    }

    function draw() {
      time += 1; ctx.clearRect(0, 0, W, H)
      scrollY += 0.3 * dpr; scrollX += 0.1 * dpr; galaxyAngle += 0.00005
      var breathX = Math.sin(time * 0.0004) * 20 * dpr, breathY = Math.sin(time * 0.0003) * 15 * dpr
      var zoomPhase = time * 0.0006, zoomBase = 0.08 * Math.sin(zoomPhase)
      var nebulaZoom = 1.25 + zoomBase * 0.4
      var nW = nebulaCanvas.width, nH = nebulaCanvas.height
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(galaxyAngle); ctx.scale(nebulaZoom, nebulaZoom)
      ctx.translate(-nW / 2 + breathX * 0.05, -nH / 2 + breathY * 0.05); ctx.drawImage(nebulaCanvas, 0, 0); ctx.restore()
      var cx = W / 2, cy = H / 2

      for (var l = 0; l < layers.length; l++) {
        var ly = layers[l]; var spd = ly.speed; var layerZoom = 1 + zoomBase * spd * 5
        for (var i = 0; i < ly.stars.length; i++) {
          var s = ly.stars[i]; s.twinklePhase += s.twinkleSpeed; var flicker = 0.5 + 0.5 * Math.sin(s.twinklePhase); var alpha = s.o * flicker
          if (alpha < 0.03) continue
          var dx = s.x + scrollX * spd + breathX * spd, dy = s.y - scrollY * spd + breathY * spd
          var padX = 40 * dpr, padY = 60 * dpr, wrapW = W + padX * 2, wrapH = H + padY * 2
          dx = ((dx + padX) % wrapW + wrapW) % wrapW - padX; dy = ((dy + padY) % wrapH + wrapH) % wrapH - padY
          var offX = (dx - cx) * layerZoom + cx, offY = (dy - cy) * layerZoom + cy
          var starR = s.r * layerZoom
          var edgeDist = Math.min(offX, W - offX, offY, H - offY); var edgeFade = Math.min(edgeDist / (50 * dpr), 1)
          if (edgeFade < 0.01) continue
          ctx.save(); ctx.globalAlpha = alpha * edgeFade; ctx.beginPath(); ctx.arc(offX, offY, starR, 0, Math.PI * 2); ctx.fillStyle = "#fff"
          if (ly.bright && flicker > 0.55) { ctx.shadowColor = "rgba(255,255,255,0.9)"; ctx.shadowBlur = starR * 5 }
          ctx.fill(); ctx.restore()
        }
      }

      for (var i = 0; i < sparks.length; i++) {
        var sp = sparks[i]; sp.phase += sp.speed; var life = Math.abs(Math.sin(sp.phase)) * sp.maxLife
        if (sp.phase > Math.PI * 6) { sp.x = Math.random() * W; sp.y = Math.random() * H; sp.phase = 0 }
        if (life < 0.02) continue
        var spp = layers[sp.layer].speed; var spLayerZoom = 1 + zoomBase * spp * 5
        var spX = sp.x + scrollX * spp + breathX * spp, spY = sp.y - scrollY * spp + breathY * spp
        var padX2 = 40 * dpr, padY2 = 60 * dpr, wW2 = W + padX2 * 2, wH2 = H + padY2 * 2
        spX = ((spX + padX2) % wW2 + wW2) % wW2 - padX2; spY = ((spY + padY2) % wH2 + wH2) % wH2 - padY2
        spX = (spX - cx) * spLayerZoom + cx; spY = (spY - cy) * spLayerZoom + cy
        ctx.save(); ctx.globalAlpha = life; ctx.beginPath(); ctx.arc(spX, spY, sp.r * spLayerZoom, 0, Math.PI * 2); ctx.fillStyle = "#fff"
        if (life > 0.5) { ctx.shadowColor = "rgba(255,255,255,0.8)"; ctx.shadowBlur = sp.r * 4 }
        ctx.fill(); ctx.restore()
      }
      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)
    animId = requestAnimationFrame(draw)
    return function () { window.removeEventListener("resize", resize); cancelAnimationFrame(animId) }
  }, [])

  /* ═══ PARTIAL SPHERE IN TOP-RIGHT CORNER ═══ */
  function initSphere() {
    if (threeLoaded.current || !window.THREE) return
    threeLoaded.current = true
    var mount = sphereRef.current
    if (!mount) return
    var THREE = window.THREE
    var scene = new THREE.Scene()
    var size = 560
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    camera.position.z = 2.4
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    var sphereParticles = 5000
    var sphereGeo = new THREE.BufferGeometry()
    var spherePos = new Float32Array(sphereParticles * 3)
    for (var i = 0; i < sphereParticles; i++) {
      var theta = Math.random() * Math.PI * 2, phi = Math.acos((Math.random() * 2) - 1)
      spherePos[i * 3] = Math.sin(phi) * Math.cos(theta); spherePos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta); spherePos[i * 3 + 2] = Math.cos(phi)
    }
    sphereGeo.setAttribute("position", new THREE.BufferAttribute(spherePos, 3))
    var sphereMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.016 })
    var sphere = new THREE.Points(sphereGeo, sphereMat)
    scene.add(sphere)

    var loader = new THREE.TextureLoader()
    loader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg", function (texture) {
      var cv2 = document.createElement("canvas"); var ctx2 = cv2.getContext("2d")
      cv2.width = texture.image.width; cv2.height = texture.image.height
      ctx2.drawImage(texture.image, 0, 0)
      var imgData = ctx2.getImageData(0, 0, cv2.width, cv2.height).data
      var mapPos = []
      for (var y = 0; y < cv2.height; y += 4) {
        for (var x = 0; x < cv2.width; x += 4) {
          var idx = (y * cv2.width + x) * 4
          var brightness = imgData[idx] + imgData[idx + 1] + imgData[idx + 2]
          if (brightness > 200) {
            var lat = (y / cv2.height) * Math.PI - Math.PI / 2
            var lon = (x / cv2.width) * Math.PI * 2 - Math.PI
            var r = 1.01
            mapPos.push(r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon))
          }
        }
      }
      var mapGeo = new THREE.BufferGeometry()
      mapGeo.setAttribute("position", new THREE.Float32BufferAttribute(mapPos, 3))
      var mapMat = new THREE.PointsMaterial({ color: 0xff7a00, size: 0.013, transparent: true, opacity: 0.25 })
      var mapDots = new THREE.Points(mapGeo, mapMat); scene.add(mapDots)
      var clock = new THREE.Clock()
      function animate() {
        requestAnimationFrame(animate); var t = clock.getElapsedTime()
        sphere.rotation.y += 0.0012; mapDots.rotation.y += 0.0012
        sphere.rotation.x = Math.sin(t * 0.08) * 0.03; mapDots.rotation.x = Math.sin(t * 0.08) * 0.03
        renderer.render(scene, camera)
      }
      animate()
    })

    function preAnimate() { requestAnimationFrame(preAnimate); sphere.rotation.y += 0.0012; renderer.render(scene, camera) }
    preAnimate()
  }

  /* Load Three.js dynamically */
  useEffect(function () {
    if (window.THREE) { initSphere(); return }
    var script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    script.onload = function () { initSphere() }
    document.head.appendChild(script)
  }, [])

  return (
    <>
      {/* Galaxy canvas background */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />
      {/* Scanline overlay */}
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,0.014) 2px,rgba(0,0,0,0.014) 4px)", pointerEvents: "none", zIndex: 1 }} />
      {/* Partial sphere — 50% arc at top right corner */}
      <div ref={sphereRef} style={{ position: "fixed", top: -280, right: -280, width: 560, height: 560, zIndex: 2, opacity: 0, pointerEvents: "none", animation: "sphereCornerIn 1s ease 0.3s forwards" }} />
      {/* Subtle orange glow at corner */}
      <div style={{ position: "fixed", top: -20, right: -20, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,80,10,0.08) 0%, transparent 70%)", zIndex: 1, pointerEvents: "none" }} />

      <style jsx>{`
        @keyframes sphereCornerIn{from{opacity:0}to{opacity:0.6}}
      `}</style>
    </>
  )
}