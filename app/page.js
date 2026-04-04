'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { globalStyles, colors, fonts, HACKATHON_START } from '@/lib/theme'
import phase from '@/lib/phase'

export default function LandingPage() {
  const routerHook  = useRouter()
  const galaxyRef   = useRef(null)
  const sphereMountRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const target = new Date(HACKATHON_START).getTime()
    const prev = { d:'', h:'', m:'', s:'' }
    const pad = n => n < 10 ? '0'+n : ''+n
    function flip(el) { el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip') }
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
    const startId = setTimeout(() => { tick() }, 100)
    const id = setInterval(tick, 1000)
    return () => { clearTimeout(startId); clearInterval(id) }
  }, [isMobile])

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.title-main').forEach(el => el.classList.add('glow-active'))
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isMobile) return
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
    let bandStars = [], sparks = []
    const NUM_SPARK = 18, bandAngle = -0.15
    let time = 0
    function resize() {
      W = cv.width = window.innerWidth * dpr; H = cv.height = window.innerHeight * dpr
      cv.style.width = window.innerWidth + 'px'; cv.style.height = window.innerHeight + 'px'
      nebulaCanvas.width = W + 80*dpr; nebulaCanvas.height = H + 80*dpr
      initStars(); renderNebula()
    }
    function initStars() {
      for (let l=0;l<layers.length;l++) { const ly=layers[l]; ly.stars=[]
        for (let i=0;i<ly.count;i++) ly.stars.push({x:Math.random()*W,y:Math.random()*(H+100*dpr),r:(Math.random()*(ly.rMax-ly.rMin)+ly.rMin)*dpr,o:Math.random()*(ly.oMax-ly.oMin)+ly.oMin,twinklePhase:Math.random()*Math.PI*2,twinkleSpeed:Math.random()*0.003+0.001})
      }
      bandStars=[];for(let i=0;i<500;i++)bandStars.push({x:(Math.random()-0.5)*W*1.4,y:(Math.random()-0.5)*H*0.2,r:(Math.random()*0.5+0.15)*dpr,o:Math.random()*0.3+0.08})
      sparks=[];for(let i=0;i<NUM_SPARK;i++)sparks.push({x:Math.random()*W,y:Math.random()*H,r:(Math.random()*1.0+0.4)*dpr,phase:Math.random()*Math.PI*2,speed:Math.random()*0.008+0.004,maxLife:Math.random()*0.7+0.3,layer:Math.floor(Math.random()*3)})
    }
    function renderNebula() {
      const nW=nebulaCanvas.width,nH=nebulaCanvas.height;nCtx.clearRect(0,0,nW,nH);nCtx.fillStyle='#000000';nCtx.fillRect(0,0,nW,nH)
      let tG=nCtx.createLinearGradient(0,0,0,nH*0.15);tG.addColorStop(0,'rgba(180,20,0,0.18)');tG.addColorStop(0.4,'rgba(120,15,0,0.08)');tG.addColorStop(1,'rgba(0,0,0,0)');nCtx.fillStyle=tG;nCtx.fillRect(0,0,nW,nH*0.15)
      let bG=nCtx.createLinearGradient(0,nH*0.85,0,nH);bG.addColorStop(0,'rgba(0,0,0,0)');bG.addColorStop(0.6,'rgba(120,15,0,0.08)');bG.addColorStop(1,'rgba(180,20,0,0.18)');nCtx.fillStyle=bG;nCtx.fillRect(0,nH*0.85,nW,nH*0.15)
      let sH=nCtx.createRadialGradient(nW*0.5,nH*0.45,0,nW*0.5,nH*0.45,Math.max(nW,nH)*0.55);sH.addColorStop(0,'rgba(8,8,20,0.15)');sH.addColorStop(0.5,'rgba(5,4,12,0.08)');sH.addColorStop(1,'rgba(0,0,0,0)');nCtx.fillStyle=sH;nCtx.fillRect(0,0,nW,nH)
      const dC=[{x:nW*0.15,y:nH*0.3,w:nW*0.3,h:nH*0.08,a:0.04,rot:-0.1},{x:nW*0.55,y:nH*0.5,w:nW*0.35,h:nH*0.06,a:0.035,rot:0.05},{x:nW*0.3,y:nH*0.65,w:nW*0.25,h:nH*0.05,a:0.03,rot:-0.08}]
      for(const d of dC){nCtx.save();nCtx.translate(d.x+d.w/2,d.y+d.h/2);nCtx.rotate(d.rot);let dg=nCtx.createRadialGradient(0,0,0,0,0,d.w*0.5);dg.addColorStop(0,'rgba(20,15,30,'+d.a+')');dg.addColorStop(0.5,'rgba(12,8,18,'+(d.a*0.6)+')');dg.addColorStop(1,'rgba(0,0,0,0)');nCtx.fillStyle=dg;nCtx.scale(1,d.h/d.w);nCtx.beginPath();nCtx.arc(0,0,d.w*0.5,0,Math.PI*2);nCtx.fill();nCtx.restore()}
      nCtx.save();nCtx.translate(nW/2,nH/2);nCtx.rotate(bandAngle)
      const bW=nW*1.6,bH=nH*0.35;let bg=nCtx.createLinearGradient(0,-bH,0,bH);bg.addColorStop(0,'rgba(0,0,0,0)');bg.addColorStop(0.4,'rgba(60,30,10,0.06)');bg.addColorStop(0.5,'rgba(80,40,14,0.08)');bg.addColorStop(0.6,'rgba(60,30,10,0.06)');bg.addColorStop(1,'rgba(0,0,0,0)');nCtx.fillStyle=bg;nCtx.fillRect(-bW/2,-bH,bW,bH*2)
      for(const bs of bandStars){nCtx.globalAlpha=bs.o;nCtx.fillStyle='#fff';nCtx.beginPath();nCtx.arc(bs.x,bs.y,bs.r,0,Math.PI*2);nCtx.fill()}
      nCtx.globalAlpha=1;nCtx.restore()
    }
    let galaxyAngle=0,scrollY=0,scrollX=0
    let animId
    function draw(){
      time+=1;ctx.clearRect(0,0,W,H);scrollY+=0.3*dpr;scrollX+=0.1*dpr;galaxyAngle+=0.00005
      const breathX=Math.sin(time*0.0004)*20*dpr,breathY=Math.sin(time*0.0003)*15*dpr,zoomPhase=time*0.0006,zoomBase=0.08*Math.sin(zoomPhase)
      const nebulaZoom=1.25+zoomBase*0.4,nW=nebulaCanvas.width,nH=nebulaCanvas.height
      ctx.save();ctx.translate(W/2,H/2);ctx.rotate(galaxyAngle);ctx.scale(nebulaZoom,nebulaZoom);ctx.translate(-nW/2+breathX*0.05,-nH/2+breathY*0.05);ctx.drawImage(nebulaCanvas,0,0);ctx.restore()
      const cx=W/2,cy=H/2
      for(let l=0;l<layers.length;l++){const ly=layers[l],spd=ly.speed,lZ=1+zoomBase*spd*5
        for(let i=0;i<ly.stars.length;i++){const s=ly.stars[i];s.twinklePhase+=s.twinkleSpeed;const fl=0.5+0.5*Math.sin(s.twinklePhase),al=s.o*fl;if(al<0.03)continue
          let dx=s.x+scrollX*spd+breathX*spd,dy=s.y-scrollY*spd+breathY*spd;const pX=40*dpr,pY=60*dpr,wW=W+pX*2,wH=H+pY*2;dx=((dx+pX)%wW+wW)%wW-pX;dy=((dy+pY)%wH+wH)%wH-pY
          const oX=(dx-cx)*lZ+cx,oY=(dy-cy)*lZ+cy,sR=s.r*lZ,eD=Math.min(oX,W-oX,oY,H-oY),eF=Math.min(eD/(50*dpr),1);if(eF<0.01)continue
          ctx.save();ctx.globalAlpha=al*eF;ctx.beginPath();ctx.arc(oX,oY,sR,0,Math.PI*2);ctx.fillStyle='#fff'
          if(ly.bright&&fl>0.55){ctx.shadowColor='rgba(255,255,255,0.9)';ctx.shadowBlur=sR*5}
          ctx.fill();ctx.restore()
        }
      }
      for(let i=0;i<sparks.length;i++){const sp=sparks[i];sp.phase+=sp.speed;const life=Math.abs(Math.sin(sp.phase))*sp.maxLife;if(sp.phase>Math.PI*6){sp.x=Math.random()*W;sp.y=Math.random()*H;sp.phase=0}if(life<0.02)continue
        const spp=layers[sp.layer].speed,spZ=1+zoomBase*spp*5;let spX=sp.x+scrollX*spp+breathX*spp,spY=sp.y-scrollY*spp+breathY*spp;const p2=40*dpr,p3=60*dpr,w2=W+p2*2,h2=H+p3*2;spX=((spX+p2)%w2+w2)%w2-p2;spY=((spY+p3)%h2+h2)%h2-p3;spX=(spX-cx)*spZ+cx;spY=(spY-cy)*spZ+cy
        ctx.save();ctx.globalAlpha=life;ctx.beginPath();ctx.arc(spX,spY,sp.r*spZ,0,Math.PI*2);ctx.fillStyle='#fff';if(life>0.5){ctx.shadowColor='rgba(255,255,255,0.8)';ctx.shadowBlur=sp.r*4};ctx.fill();ctx.restore()
      }
      animId=requestAnimationFrame(draw)
    }
    resize();window.addEventListener('resize',resize);animId=requestAnimationFrame(draw)
    return()=>{window.removeEventListener('resize',resize);cancelAnimationFrame(animId)}
  }, [isMobile])

  useEffect(() => {
    const mount = sphereMountRef.current
    if (!mount||mount.querySelector('canvas')) return
    const loadSphere=()=>{
      const THREE=window.THREE;if(!mount||mount.querySelector('canvas'))return
      const scene=new THREE.Scene();let W=mount.offsetWidth,H=mount.offsetHeight
      const camera=new THREE.PerspectiveCamera(60,W/H,0.1,1000);camera.position.z=3
      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(W,H);renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));mount.appendChild(renderer.domElement)
      const mouse=new THREE.Vector2(9999,9999),raycaster=new THREE.Raycaster(),mouseWorld=new THREE.Vector3();let mouseOnSphere=false
      const hitGeo=new THREE.SphereGeometry(1.05,32,32),hitMat=new THREE.MeshBasicMaterial({visible:false}),hitSphere=new THREE.Mesh(hitGeo,hitMat);scene.add(hitSphere)
      renderer.domElement.addEventListener('mousemove',e=>{const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1})
      renderer.domElement.addEventListener('mouseleave',()=>{mouse.set(9999,9999);mouseOnSphere=false});renderer.domElement.style.cursor='default'
      const sCount=3500,sGeo=new THREE.BufferGeometry(),sPos=new Float32Array(sCount*3),sOrig=new Float32Array(sCount*3)
      for(let i=0;i<sCount;i++){const t=Math.random()*Math.PI*2,p=Math.acos(Math.random()*2-1),x=Math.sin(p)*Math.cos(t),y=Math.sin(p)*Math.sin(t),z=Math.cos(p);sPos[i*3]=x;sPos[i*3+1]=y;sPos[i*3+2]=z;sOrig[i*3]=x;sOrig[i*3+1]=y;sOrig[i*3+2]=z}
      sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));const sphere=new THREE.Points(sGeo,new THREE.PointsMaterial({color:0xffffff,size:0.008}));scene.add(sphere)
      const RR=0.35,RS=0.12,RT=0.06
      function repulse(pos,orig,cnt,hp){for(let i=0;i<cnt;i++){const ix=i*3,iy=i*3+1,iz=i*3+2,ox=orig[ix],oy=orig[iy],oz=orig[iz]
        if(mouseOnSphere){const dx=pos[ix]-hp.x,dy=pos[iy]-hp.y,dz=pos[iz]-hp.z,d=Math.sqrt(dx*dx+dy*dy+dz*dz);if(d<RR&&d>0.001){const f=(1-d/RR)*RS,nx=dx/d,ny=dy/d,nz=dz/d;pos[ix]+=nx*f;pos[iy]+=ny*f;pos[iz]+=nz*f}else{pos[ix]+=(ox-pos[ix])*RT;pos[iy]+=(oy-pos[iy])*RT;pos[iz]+=(oz-pos[iz])*RT}}
        else{pos[ix]+=(ox-pos[ix])*RT;pos[iy]+=(oy-pos[iy])*RT;pos[iz]+=(oz-pos[iz])*RT}}}
      let preRunning=true,mapPos=null,mapOrig=null,mapCnt=0
      const loader=new THREE.TextureLoader()
      loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',texture=>{
        const mc=document.createElement('canvas'),mctx=mc.getContext('2d');mc.width=texture.image.width;mc.height=texture.image.height;mctx.drawImage(texture.image,0,0)
        const d=mctx.getImageData(0,0,mc.width,mc.height).data,mp=[]
        for(let y=2;y<mc.height-2;y+=3)for(let x=2;x<mc.width-2;x+=3){const idx=(y*mc.width+x)*4;if(d[idx]+d[idx+1]+d[idx+2]>200){const lat=(y/mc.height)*Math.PI-Math.PI/2,lon=(x/mc.width)*Math.PI*2-Math.PI,rad=1.01;mp.push(rad*Math.cos(lat)*Math.sin(lon),rad*Math.sin(lat),rad*Math.cos(lat)*Math.cos(lon))}}
        const mg=new THREE.BufferGeometry(),mA=new Float32Array(mp),mO=new Float32Array(mp);mg.setAttribute('position',new THREE.BufferAttribute(mA,3))
        const mapDots=new THREE.Points(mg,new THREE.PointsMaterial({color:0xfd1c00,size:0.013,transparent:true,opacity:0.25}));scene.add(mapDots);mapPos=mA;mapOrig=mO;mapCnt=mp.length/3;preRunning=false
        const clock=new THREE.Clock()
        const animate=()=>{requestAnimationFrame(animate);const t=clock.getElapsedTime();sphere.rotation.y+=0.0012;mapDots.rotation.y+=0.0012;hitSphere.rotation.y=sphere.rotation.y;hitSphere.rotation.x=sphere.rotation.x;sphere.rotation.x=Math.sin(t*0.08)*0.03;mapDots.rotation.x=Math.sin(t*0.08)*0.03
          raycaster.setFromCamera(mouse,camera);const ints=raycaster.intersectObject(hitSphere)
          if(ints.length>0){mouseOnSphere=true;const lp=hitSphere.worldToLocal(ints[0].point.clone());mouseWorld.copy(lp);repulse(sPos,sOrig,sCount,mouseWorld);sGeo.attributes.position.needsUpdate=true;if(mapPos){repulse(mapPos,mapOrig,mapCnt,mouseWorld);mg.attributes.position.needsUpdate=true};renderer.domElement.style.cursor='pointer'}
          else{mouseOnSphere=false;renderer.domElement.style.cursor='default';repulse(sPos,sOrig,sCount,mouseWorld);sGeo.attributes.position.needsUpdate=true;if(mapPos){repulse(mapPos,mapOrig,mapCnt,mouseWorld);mg.attributes.position.needsUpdate=true}}
          renderer.render(scene,camera)}
        animate()
      })
      const preAnim=()=>{if(!preRunning)return;requestAnimationFrame(preAnim);sphere.rotation.y+=0.0012;renderer.render(scene,camera)};preAnim()
      window.addEventListener('resize',()=>{W=mount.offsetWidth;H=mount.offsetHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H)})
    }
    if(window.THREE)loadSphere();else if(!document.querySelector('script[src*="three.min.js"]')){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=loadSphere;document.head.appendChild(s)}else{const c=setInterval(()=>{if(window.THREE){clearInterval(c);loadSphere()}},100)}
  }, [isMobile])

  /* ═══ MOBILE LAYOUT ═══ */
  if (isMobile) {
    return (
      <>
        <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#050008;overflow:hidden;font-family:'DM Sans',sans-serif;color:#fff}

@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes mFlip{0%{transform:translateY(0)}40%{transform:translateY(-3px);opacity:.4}100%{transform:translateY(0);opacity:1}}
@keyframes breathe{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.25}50%{transform:translate(-50%,-50%) scale(1.6);opacity:.55}}
@keyframes spin3d{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
@keyframes shimmer{from{background-position:0% 50%}to{background-position:200% 50%}}
@keyframes glowPulse{0%,100%{filter:brightness(1) drop-shadow(0 0 2px rgba(177,158,239,.3))}50%{filter:brightness(1.3) drop-shadow(0 0 6px rgba(177,158,239,.5))}}
@keyframes lineSweep{0%{left:-40%}100%{left:140%}}
@keyframes ringPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.12}50%{transform:translate(-50%,-50%) scale(1.08);opacity:.25}}
@keyframes cardPop{from{opacity:0;transform:translateY(16px) scale(.92)}to{opacity:1;transform:none}}
@keyframes dust{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-80px) translateX(20px);opacity:0}}
@keyframes btnShimmer{0%{left:-100%}100%{left:200%}}
@keyframes sepPulse{0%,100%{opacity:.15}50%{opacity:.4}}

.ml{width:100%;height:100vh;height:100dvh;position:relative;overflow:hidden;background:#050008;display:flex;flex-direction:column}

.ml-stars{position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:
    radial-gradient(1px 1px at 10% 8%,rgba(255,255,255,.2),transparent),
    radial-gradient(1px 1px at 25% 35%,rgba(255,255,255,.15),transparent),
    radial-gradient(1px 1px at 45% 12%,rgba(255,255,255,.25),transparent),
    radial-gradient(1px 1px at 60% 28%,rgba(255,255,255,.12),transparent),
    radial-gradient(1px 1px at 80% 50%,rgba(255,255,255,.18),transparent),
    radial-gradient(1px 1px at 92% 15%,rgba(255,255,255,.2),transparent),
    radial-gradient(1px 1px at 15% 65%,rgba(255,255,255,.1),transparent),
    radial-gradient(1.5px 1.5px at 70% 80%,rgba(255,255,255,.15),transparent),
    radial-gradient(1px 1px at 35% 90%,rgba(255,255,255,.12),transparent)
}
.ml-glow-amb{position:absolute;top:-5%;left:50%;transform:translateX(-50%);width:320px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(253,28,0,.12),rgba(253,28,0,.03) 55%,transparent 75%);pointer-events:none;z-index:0}

.ml-dust{position:absolute;z-index:1;pointer-events:none;inset:0}
.ml-dust-p{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(253,28,0,.4);animation:dust 6s ease-in-out infinite}
.ml-dust-p:nth-child(1){left:12%;bottom:45%;animation-delay:0s;animation-duration:5s}
.ml-dust-p:nth-child(2){left:28%;bottom:38%;animation-delay:1.2s;animation-duration:7s;width:1.5px;height:1.5px;background:rgba(255,255,255,.2)}
.ml-dust-p:nth-child(3){right:18%;bottom:50%;animation-delay:2.5s;animation-duration:6s}
.ml-dust-p:nth-child(4){right:32%;bottom:42%;animation-delay:0.8s;animation-duration:8s;width:1px;height:1px;background:rgba(255,255,255,.15)}
.ml-dust-p:nth-child(5){left:50%;bottom:35%;animation-delay:3s;animation-duration:5.5s;width:1.5px;height:1.5px}
.ml-dust-p:nth-child(6){left:65%;bottom:48%;animation-delay:1.8s;animation-duration:6.5s;width:1px;height:1px;background:rgba(255,255,255,.18)}

.ml-topbar{position:relative;z-index:5;display:flex;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 24px 0;animation:fadeIn .6s ease .2s both}
.ml-ai{display:flex;flex-direction:column;align-items:center}
.ml-ai-spin{width:38px;height:30px;perspective:400px}
.ml-ai-spin-in{width:100%;height:100%;transform-style:preserve-3d;animation:spin3d 4s linear infinite}
.ml-ai-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;font-weight:300;font-size:22px;color:#fff;text-shadow:0 0 18px rgba(255,85,0,.35),0 0 35px rgba(255,120,30,.12);backface-visibility:hidden}
.ml-ai-face-b{transform:rotateY(180deg)}
.ml-ai-lb{font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-size:6px;letter-spacing:4px;font-weight:700;text-transform:uppercase;margin-top:-1px;background:linear-gradient(90deg,#ff9ffc,#b19eef,#fd1c00,#ff9ffc);background-size:200% 100%;background-clip:text;-webkit-background-clip:text;color:transparent;animation:shimmer 3s linear infinite,glowPulse 2s ease-in-out infinite}

.ml-sphere-area{position:relative;z-index:2;flex:0 0 auto;display:flex;align-items:center;justify-content:center;height:36%;animation:fadeIn .8s ease .3s both}
.ml-sphere-box{width:210px;height:210px;position:relative}
.ml-sphere-box canvas{display:block;width:100%!important;height:100%!important}
.ml-sphere-halo{position:absolute;left:50%;top:50%;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(253,28,0,.1),transparent 60%);animation:breathe 4s ease-in-out infinite;pointer-events:none}
.ml-sphere-ring{position:absolute;left:50%;top:50%;width:230px;height:230px;border-radius:50%;border:1px solid rgba(253,28,0,.1);animation:ringPulse 3s ease-in-out infinite;pointer-events:none}

.ml-title-block{position:relative;z-index:5;padding:0 28px;animation:fadeUp .7s ease .3s both}
.ml-title{font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-weight:400;font-size:clamp(38px,11vw,48px);line-height:1.05;text-transform:uppercase;color:#fd1c00;-webkit-text-stroke:1px rgba(253,28,0,.12);paint-order:stroke fill}
.ml-title-w{color:#fff;-webkit-text-stroke:1px rgba(255,255,255,.08)}
.ml-tagline{margin-top:8px;animation:fadeUp .7s ease .5s both}
.ml-tag-top{font-family:'Poppins',sans-serif;font-size:9px;font-weight:300;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,.25)}
.ml-tag-sep{width:30px;height:1px;margin:5px 0;background:linear-gradient(90deg,rgba(253,28,0,.5),transparent)}
.ml-tag-btm{font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:#fd1c00;text-shadow:0 0 12px rgba(253,28,0,.15)}

.ml-divider{position:relative;z-index:5;margin:18px 28px 0;height:1px;animation:fadeIn .8s ease .6s both;overflow:visible}
.ml-divider-line{width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(253,28,0,.45) 15%,rgba(253,28,0,.45) 85%,transparent);border-radius:1px}
.ml-divider-glow{position:absolute;top:-3px;left:8%;right:8%;height:7px;background:linear-gradient(90deg,transparent,rgba(253,28,0,.12) 25%,rgba(253,28,0,.12) 75%,transparent);border-radius:4px;filter:blur(3px)}
.ml-divider-sweep{position:absolute;top:-1px;width:40px;height:3px;border-radius:3px;background:radial-gradient(ellipse,rgba(255,200,150,.5),transparent);animation:lineSweep 4s ease-in-out infinite;pointer-events:none;filter:blur(1px)}

.ml-bottom{position:relative;z-index:5;flex:1;display:flex;flex-direction:column;justify-content:space-evenly;padding:10px 22px max(14px,env(safe-area-inset-bottom))}

.ml-btns{display:flex;gap:10px;animation:fadeUp .6s ease .65s both}
.ml-btn{display:flex;align-items:center;justify-content:center;gap:8px;flex:1;padding:14px;border-radius:14px;font-family:'Poppins','DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:transform .12s;-webkit-tap-highlight-color:transparent;position:relative;overflow:hidden}
.ml-btn:active{transform:scale(.96)}
.ml-btn-go{background:linear-gradient(135deg,#fd1c00,#e81600);color:#fff;box-shadow:0 4px 24px rgba(253,28,0,.3),inset 0 1px 0 rgba(255,255,255,.12)}
.ml-btn-go::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:btnShimmer 3s ease-in-out 2s infinite}
.ml-btn-in{background:rgba(255,255,255,.04);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.08)}
.ml-btn-ic{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ml-btn-go .ml-btn-ic{background:rgba(255,255,255,.14)}
.ml-btn-in .ml-btn-ic{background:rgba(255,255,255,.05)}

.ml-stats{display:flex;gap:8px}
.ml-stat{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 6px;border-radius:14px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.04);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:cardPop .5s cubic-bezier(.34,1.56,.64,1) both}
.ml-stat:nth-child(1){animation-delay:.75s}
.ml-stat:nth-child(2){animation-delay:.85s}
.ml-stat:nth-child(3){animation-delay:.95s}
.ml-stat-icon svg{stroke:#fd1c00;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;width:18px;height:18px}
.ml-stat-val{font-size:13px;font-weight:700;color:#fff;letter-spacing:.3px}
.ml-stat-lb{font-size:7px;color:#fd1c00;text-transform:uppercase;letter-spacing:1.5px;font-weight:600}

.ml-cd{display:flex;align-items:center;justify-content:center;gap:2px;animation:fadeIn .8s ease 1.1s both}
.ml-cd-unit{display:flex;flex-direction:column;align-items:center;min-width:52px}
.ml-cd-n{font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-size:clamp(20px,6vw,26px);font-weight:400;color:#fff;letter-spacing:1px;text-shadow:0 0 8px rgba(255,255,255,.04)}
.ml-cd-n.flip{animation:mFlip .3s ease}
.ml-cd-lb{font-family:'Poppins',sans-serif;font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(253,28,0,.6);margin-top:2px}
.ml-cd-sep{font-family:'Poppins',sans-serif;font-size:18px;color:rgba(253,28,0,.15);font-weight:300;margin-bottom:8px;animation:sepPulse 2s ease-in-out infinite}
        `}</style>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.cdnfonts.com/css/astro-futuristic-font" rel="stylesheet"/>

        <div className="ml">
          <div className="ml-stars"/>
          <div className="ml-glow-amb"/>
          <div className="ml-dust">
            <div className="ml-dust-p"/><div className="ml-dust-p"/><div className="ml-dust-p"/>
            <div className="ml-dust-p"/><div className="ml-dust-p"/><div className="ml-dust-p"/>
          </div>

          <div className="ml-topbar">
            <div className="ml-ai">
              <div className="ml-ai-spin"><div className="ml-ai-spin-in"><div className="ml-ai-face">AI</div><div className="ml-ai-face ml-ai-face-b">AI</div></div></div>
              <div className="ml-ai-lb">POWERED</div>
            </div>
          </div>

          <div className="ml-sphere-area">
            <div className="ml-sphere-halo"/>
            <div className="ml-sphere-ring"/>
            <div className="ml-sphere-box" ref={sphereMountRef}/>
          </div>

          <div className="ml-title-block">
            <div className="ml-title">PROJECT</div>
            <div className="ml-title ml-title-w">SPACE</div>
            <div className="ml-tagline">
              <div className="ml-tag-top">DON&apos;T JUST THINK</div>
              <div className="ml-tag-sep"/>
              <div className="ml-tag-btm">MAKE IT HAPPEN</div>
            </div>
          </div>

          <div className="ml-divider">
            <div className="ml-divider-glow"/>
            <div className="ml-divider-line"/>
            <div className="ml-divider-sweep"/>
          </div>

          <div className="ml-bottom">
            <div className="ml-btns">
              <button className="ml-btn ml-btn-go" onClick={()=>routerHook.push('/auth/register')}>
                <div className="ml-btn-ic"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
                Create Account
              </button>
              {phase.showLogin && (
              <button className="ml-btn ml-btn-in" onClick={()=>routerHook.push('/auth/login')}>
                <div className="ml-btn-ic"><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M6 2H3a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 4.5L12 7l-2.5 2.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="5.5" y2="7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg></div>
                Login
              </button>
              )}
            </div>

            <div className="ml-stats">
              <div className="ml-stat"><div className="ml-stat-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div className="ml-stat-val">May 6–12</div><div className="ml-stat-lb">Event Date</div></div>
              <div className="ml-stat"><div className="ml-stat-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div><div className="ml-stat-val">684+</div><div className="ml-stat-lb">Students</div></div>
              <div className="ml-stat"><div className="ml-stat-icon"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div><div className="ml-stat-val">6 Tracks</div><div className="ml-stat-lb">Technologies</div></div>
            </div>

            <div className="ml-cd">
              <div className="ml-cd-unit"><div className="ml-cd-n" id="cd-days">00</div><div className="ml-cd-lb">Days</div></div>
              <div className="ml-cd-sep">:</div>
              <div className="ml-cd-unit"><div className="ml-cd-n" id="cd-hours">00</div><div className="ml-cd-lb">Hrs</div></div>
              <div className="ml-cd-sep">:</div>
              <div className="ml-cd-unit"><div className="ml-cd-n" id="cd-mins">00</div><div className="ml-cd-lb">Min</div></div>
              <div className="ml-cd-sep">:</div>
              <div className="ml-cd-unit"><div className="ml-cd-n" id="cd-secs">00</div><div className="ml-cd-lb">Sec</div></div>
            </div>
          </div>
        </div>
      </>
    )
  }


  /* ═══ DESKTOP LAYOUT ═══ */
  return (
    <>
      <style>{`
        ${globalStyles}
        #galaxy-bg{position:fixed;inset:0;width:100%;height:100%;z-index:0}
        .scanline{position:fixed;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,0.014) 2px,rgba(0,0,0,0.014) 4px);pointer-events:none;z-index:2}
        .page{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;width:100%;height:100vh;padding:0 5vw;font-family:'Poppins',sans-serif}
        .ai-powered-corner{position:fixed;top:clamp(14px,3vw,28px);right:clamp(16px,3vw,36px);z-index:100;display:flex;flex-direction:column;align-items:center;gap:0;animation:fadeIn 2s ease 1.4s both}
        .ai-spinner{position:relative;width:clamp(40px,5.5vw,70px);height:clamp(34px,4.5vw,58px);perspective:400px}
        .ai-spinner-inner{width:100%;height:100%;transform-style:preserve-3d;animation:aiSpin 4s linear infinite}
        .ai-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;font-weight:300;font-size:clamp(28px,4.2vw,54px);color:#fff;line-height:1;text-shadow:0 0 30px rgba(255,85,0,0.4),0 0 60px rgba(255,120,30,0.2),0 0 8px rgba(255,170,64,0.3);backface-visibility:hidden;-webkit-backface-visibility:hidden}
        .ai-face-back{transform:rotateY(180deg)}
        @keyframes aiSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
        .powered-text{font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-weight:700;font-size:clamp(6px,0.8vw,9.5px);letter-spacing:clamp(2px,0.5vw,5px);text-transform:uppercase;margin-top:-2px;background-image:linear-gradient(90deg,#ff9ffc,#b19eef,#fd1c00,#ff9ffc);background-size:200% 100%;background-clip:text;-webkit-background-clip:text;color:transparent;filter:brightness(1);animation:poweredShimmer 3s linear infinite,poweredGlow 2s ease-in-out infinite}
        @keyframes poweredShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
        @keyframes poweredGlow{0%,100%{filter:brightness(1) drop-shadow(0 0 2px rgba(177,158,239,0.3))}50%{filter:brightness(1.4) drop-shadow(0 0 6px rgba(177,158,239,0.6))}}
        .left{flex:0 0 44%;display:flex;flex-direction:column;justify-content:center;gap:0}
        .title-wrap{margin-bottom:28px;display:flex;flex-direction:column;gap:28px}
        .title-main{display:flex;align-items:center;font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-weight:400;font-size:clamp(36px,6vw,90px);text-transform:uppercase;white-space:nowrap;line-height:1.05;color:#fd1c00;-webkit-text-stroke:1px rgba(253,28,0,0.15);paint-order:stroke fill;opacity:0;animation:titleReveal 1.2s cubic-bezier(0.16,1,0.3,1) forwards}
        .title-main span{display:inline-block}.tl{margin-right:clamp(6px,1vw,14px)}.tl-tight{margin-right:clamp(4px,0.8vw,10px)}.tl-last{margin-right:0}
        .title-main.glow-active{animation:titleReveal 1.2s cubic-bezier(0.16,1,0.3,1) forwards,titlePulseRed 5s ease-in-out infinite}
        .title-line2{color:#ffffff;-webkit-text-stroke:1px rgba(255,255,255,0.15);animation-delay:0.35s}
        .title-line2.glow-active{animation:titleReveal 1.2s cubic-bezier(0.16,1,0.3,1) 0.35s forwards,titlePulseWhite 5s ease-in-out 0.35s infinite}
        @keyframes titleReveal{0%{opacity:0;transform:translateY(40px) scale(0.92);filter:blur(8px)}60%{opacity:1;filter:blur(0)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
        @keyframes titlePulseRed{0%,100%{color:#fd1c00;text-shadow:0 0 4px rgba(253,28,0,0.2);transform:scale(1)}50%{color:#fd1c00;text-shadow:0 0 15px rgba(253,28,0,0.5),0 0 40px rgba(253,28,0,0.2),0 0 80px rgba(253,28,0,0.08);transform:scale(1.008)}}
        @keyframes titlePulseWhite{0%,100%{color:#ffffff;text-shadow:0 0 4px rgba(255,255,255,0.1);transform:scale(1)}50%{color:#ffffff;text-shadow:0 0 12px rgba(255,255,255,0.4),0 0 35px rgba(255,255,255,0.12),0 0 60px rgba(255,255,255,0.05);transform:scale(1.008)}}
        .tagline{margin-bottom:32px;opacity:0;animation:tagFade 1s ease 0.7s forwards}
        @keyframes tagFade{to{opacity:1}}
        .tagline-container{display:flex;flex-direction:column;gap:10px}
        .tagline-top{display:flex;align-items:center;gap:0;font-family:'Poppins',sans-serif;font-weight:300;font-size:13px;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,0.45)}
        .tagline-top span{opacity:0;animation:letterSlide 0.5s ease forwards}
        @keyframes letterSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .tagline-bottom{display:flex;align-items:center;gap:0;font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;letter-spacing:5px;text-transform:uppercase}
        .tagline-make{color:#fd1c00;text-shadow:0 0 20px rgba(253,28,0,0.3)}.tagline-it{color:#fd4a30;margin:0 2px}.tagline-happen{color:#fd1c00;text-shadow:0 0 20px rgba(253,28,0,0.3)}
        .tagline-bottom span{opacity:0;animation:letterSlide 0.5s ease forwards}
        .tagline-line-sep{width:40px;height:1px;background:linear-gradient(90deg,rgba(253,28,0,0.6),rgba(253,28,0,0));margin:4px 0;opacity:0;animation:lineGrow 0.8s ease 1.2s forwards}
        @keyframes lineGrow{from{opacity:0;width:0}to{opacity:1;width:40px}}
        .buttons{display:flex;flex-direction:row;align-items:center;gap:14px;opacity:0;animation:btnReveal 0.8s ease 1s forwards}
        @keyframes btnReveal{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .btn{display:flex;align-items:center;gap:10px;padding:12px 22px;border-radius:10px;font-family:'Poppins',sans-serif;font-size:13px;font-weight:500;cursor:pointer;border:none;white-space:nowrap;transition:transform 0.2s ease,box-shadow 0.2s ease;position:relative;overflow:hidden}
        .btn:hover{transform:translateY(-3px)}.btn:active{transform:scale(0.97)}
        .btn-primary{background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff;box-shadow:0 4px 24px rgba(253,28,0,0.3)}
        .btn-primary:hover{box-shadow:0 8px 44px rgba(253,28,0,0.55)}
        .btn-secondary{background:rgba(255,255,255,0.06);color:#fff;box-shadow:none;border:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(10px)}
        .btn-secondary:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.25);box-shadow:0 4px 20px rgba(255,255,255,0.06)}
        .btn-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,255,255,0.14)}
        .btn-arrow{opacity:0.4;transition:transform 0.2s,opacity 0.2s}.btn:hover .btn-arrow{transform:translateX(4px);opacity:1}
        .right{flex:0 0 53%;position:relative;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
        #sphere-mount{position:absolute;top:50%;left:50%;transform:translate(calc(-50% + 50px),-55%);width:min(120%,1100px);height:min(120%,1100px);display:flex;align-items:center;justify-content:center}
        #sphere-mount canvas{display:block;width:100%!important;height:100%!important}
        .sphere-glow{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(253,28,0,0.08) 0%,transparent 70%);animation:breathe 4s ease-in-out infinite;z-index:8;pointer-events:none}
        .countdown-bar{position:fixed;bottom:13px;z-index:50;left:75%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:0;opacity:0;animation:countFade 1s ease 1.5s forwards}
        @keyframes countFade{to{opacity:1}}
        .cd-block{display:flex;flex-direction:column;align-items:center;min-width:clamp(50px,6vw,80px)}
        .cd-colon{display:flex;align-items:center;font-family:'Poppins',sans-serif;font-size:clamp(18px,2.2vw,28px);font-weight:400;color:#fd1c00;line-height:1;text-shadow:0 0 8px rgba(253,28,0,0.3);padding:0 2px;margin-bottom:clamp(10px,1.5vw,18px)}
        .cd-num{font-family:'Astro Futuristic Font','ASTRO','Orbitron',sans-serif;font-size:clamp(24px,3vw,36px);font-weight:400;color:#fff;line-height:1;letter-spacing:2px;text-shadow:0 0 15px rgba(255,255,255,0.06);transition:transform 0.3s ease}
        .cd-num.flip{animation:numFlip 0.3s ease}
        @keyframes numFlip{0%{transform:translateY(0);opacity:1}40%{transform:translateY(-4px);opacity:0.4}100%{transform:translateY(0);opacity:1}}
        .cd-label{font-family:'Poppins',sans-serif;font-size:clamp(7px,0.8vw,10px);font-weight:600;letter-spacing:clamp(1.5px,0.3vw,3px);text-transform:uppercase;color:#fd1c00;margin-top:5px;text-shadow:0 0 10px rgba(253,28,0,0.2)}
        @keyframes breathe{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.4}50%{transform:translate(-50%,-50%) scale(1.8);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
        @media(max-height:600px){.page{padding:0 3vw}.title-main{font-size:clamp(24px,5vw,50px)}.title-wrap{gap:clamp(8px,1.5vh,20px);margin-bottom:clamp(10px,2vh,24px)}.tagline{margin-bottom:clamp(12px,2vh,28px)}.btn{padding:clamp(8px,1.2vh,13px) clamp(14px,2vw,22px);font-size:clamp(11px,1.2vw,13px)}.countdown-bar{bottom:8px}.cd-num{font-size:clamp(16px,2.5vw,28px)}}
        @media(max-width:900px){.page{padding:0 4vw}.left{flex:0 0 48%}.right{flex:0 0 48%}.title-main{font-size:clamp(32px,5.5vw,65px)}#sphere-mount{width:min(140%,800px);height:min(140%,800px)}.countdown-bar{left:clamp(60%,72%,75%)}}
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet"/>
      <link href="https://fonts.cdnfonts.com/css/astro" rel="stylesheet"/>
      <link href="https://fonts.cdnfonts.com/css/astro-futuristic-font" rel="stylesheet"/>
      <canvas ref={galaxyRef} id="galaxy-bg"/>
      <div className="scanline"/>
      <div className="ai-powered-corner"><div className="ai-spinner"><div className="ai-spinner-inner"><div className="ai-face">AI</div><div className="ai-face ai-face-back">AI</div></div></div><div className="powered-text">POWERED</div></div>
      <div className="page">
        <div className="left">
          <div className="title-wrap">
            <span className="title-main"><span className="tl">P</span><span className="tl">R</span><span className="tl">O</span><span className="tl">J</span><span className="tl">E</span><span className="tl-tight">C</span><span className="tl-last">T</span></span>
            <span className="title-main title-line2"><span className="tl">S</span><span className="tl">P</span><span className="tl">A</span><span className="tl-tight">C</span><span className="tl-last">E</span></span>
          </div>
          <div className="tagline"><div className="tagline-container">
            <div className="tagline-top"><span style={{animationDelay:'0.8s'}}>D</span><span style={{animationDelay:'0.84s'}}>O</span><span style={{animationDelay:'0.88s'}}>N</span><span style={{animationDelay:'0.92s'}}>&apos;</span><span style={{animationDelay:'0.96s'}}>T</span><span style={{animationDelay:'1s'}}>&nbsp;&nbsp;</span><span style={{animationDelay:'1.04s'}}>J</span><span style={{animationDelay:'1.08s'}}>U</span><span style={{animationDelay:'1.12s'}}>S</span><span style={{animationDelay:'1.16s'}}>T</span><span style={{animationDelay:'1.2s'}}>&nbsp;&nbsp;</span><span style={{animationDelay:'1.24s'}}>T</span><span style={{animationDelay:'1.28s'}}>H</span><span style={{animationDelay:'1.32s'}}>I</span><span style={{animationDelay:'1.36s'}}>N</span><span style={{animationDelay:'1.4s'}}>K</span></div>
            <div className="tagline-line-sep"/>
            <div className="tagline-bottom"><span className="tagline-make" style={{animationDelay:'1.3s'}}>M</span><span className="tagline-make" style={{animationDelay:'1.34s'}}>A</span><span className="tagline-make" style={{animationDelay:'1.38s'}}>K</span><span className="tagline-make" style={{animationDelay:'1.42s'}}>E</span><span style={{animationDelay:'1.46s'}}>&nbsp;&nbsp;</span><span className="tagline-it" style={{animationDelay:'1.5s'}}>I</span><span className="tagline-it" style={{animationDelay:'1.54s'}}>T</span><span style={{animationDelay:'1.58s'}}>&nbsp;&nbsp;</span><span className="tagline-happen" style={{animationDelay:'1.62s'}}>H</span><span className="tagline-happen" style={{animationDelay:'1.66s'}}>A</span><span className="tagline-happen" style={{animationDelay:'1.7s'}}>P</span><span className="tagline-happen" style={{animationDelay:'1.74s'}}>P</span><span className="tagline-happen" style={{animationDelay:'1.78s'}}>E</span><span className="tagline-happen" style={{animationDelay:'1.82s'}}>N</span></div>
          </div></div>
          <div className="buttons">
            <button className="btn btn-primary" onClick={()=>routerHook.push('/auth/register')}><div className="btn-icon"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg></div><span>Create Account</span><svg className="btn-arrow" width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3.5l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            {phase.showLogin && <button className="btn btn-secondary" onClick={()=>routerHook.push('/auth/login')}><div className="btn-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 4.5L12 7l-2.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="5.5" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></div><span>Login</span><svg className="btn-arrow" width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3.5l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          </div>
        </div>
        <div className="right"><div id="sphere-mount" ref={sphereMountRef}/><div className="sphere-glow"/></div>
      </div>
      <div className="countdown-bar">
        <div className="cd-block"><div className="cd-num" id="cd-days">00</div><div className="cd-label">Days</div></div><div className="cd-colon">:</div>
        <div className="cd-block"><div className="cd-num" id="cd-hours">00</div><div className="cd-label">Hours</div></div><div className="cd-colon">:</div>
        <div className="cd-block"><div className="cd-num" id="cd-mins">00</div><div className="cd-label">Minutes</div></div><div className="cd-colon">:</div>
        <div className="cd-block"><div className="cd-num" id="cd-secs">00</div><div className="cd-label">Seconds</div></div>
      </div>
    </>
  )
}