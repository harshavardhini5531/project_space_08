'use client'
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Mic, MicOff, Plus, Check } from "lucide-react";

const ROCKET_ICON = "https://cdn4.iconfinder.com/data/icons/space-and-astronomy-1/800/rocket-1024.png";
const MESSENGER_ICON = "https://cdn-icons-png.freepik.com/512/8649/8649607.png";

const QUICK_ACTIONS = [
  { label: "Suggest Project Title", icon: "💡", key: "title" },
  { label: "Write Description", icon: "📝", key: "desc" },
  { label: "Problem Statement", icon: "🎯", key: "problem" },
  { label: "AI Suggestions", icon: "🤖", key: "ai" },
  { label: "Tech Stack Help", icon: "⚙️", key: "tech" },
];

// Detect field type from user message
function detectFieldType(text) {
  const l = text.toLowerCase();
  if (l.includes("desc")||l.includes("description")||l.includes("write about")||l.includes("explain project")) return "desc";
  if (l.includes("problem")||l.includes("statement")||l.includes("issue")||l.includes("challenge")) return "problem";
  if (l.includes("title")||l.includes("suggest name")||l.includes("project name")) return "title";
  if (l.includes("ai")||l.includes("capability")||l.includes("artificial")||l.includes("intelligence")||l.includes("ml")) return "ai";
  if (l.includes("tech")||l.includes("stack")||l.includes("framework")||l.includes("language")||l.includes("tools to use")) return "tech";
  return null;
}

// Parse numbered list items from response
function parseNumberedList(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const items = [];
  for (const line of lines) {
    const match = line.match(/^\d+[\.\)\-\:]\s*\**(.+?)\**\s*$/);
    if (match) items.push(match[1].replace(/^\*\*|\*\*$/g, '').trim());
  }
  return items.length >= 2 ? items : null;
}

export default function SpaceBot({ teamData = {}, onToggle, onAddToField }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pickedItems, setPickedItems] = useState(new Set());
  const [chatHistory, setChatHistory] = useState([]);
  const [titleFlowStep, setTitleFlowStep] = useState(null); // null | 'asked' | 'waiting_desc'
  const [msgs, setMsgs] = useState([
    { from: "bot", text: `Hi ${teamData.leaderName?.split(" ")[0] || "there"}! 👋\nI'm **SpaceBot**, your AI project buddy.\n\nTeam **${teamData.teamNumber || ''}** · **${teamData.technology || ''}**\n\nAsk me anything or use the quick actions!`, time: new Date(), data: null },
  ]);
  const endRef = useRef(null);
  const inRef = useRef(null);
  const recRef = useRef(null);

  const toggleOpen = (val) => { setOpen(val); onToggle?.(val); };
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { if (open) inRef.current?.focus(); }, [open]);

  const addBotMsg = (text, data = null) => {
    setMsgs(p => [...p, { from: "bot", text, time: new Date(), data }]);
  };

  const callClaude = async (userMessage, fieldType) => {
    const newHistory = [...chatHistory, { role: "user", content: userMessage }];
    setChatHistory(newHistory);
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, teamData, fieldType }),
      });
      const data = await res.json();
      setTyping(false);

      if (!res.ok || data.error) {
        addBotMsg(data.error || 'Something went wrong. Try again.');
        return;
      }

      const reply = data.reply;
      setChatHistory(prev => [...prev, { role: "assistant", content: reply }]);

      // Parse response based on field type
      if (fieldType === "title") {
        const titles = parseNumberedList(reply);
        if (titles) {
          addBotMsg("Pick a title:", { type: "title_options", titles });
        } else {
          addBotMsg(reply);
        }
      } else if (fieldType === "desc") {
        addBotMsg(reply, { type: "addable", key: "desc", text: reply });
      } else if (fieldType === "problem") {
        addBotMsg(reply, { type: "addable", key: "problem", text: reply });
      } else if (fieldType === "ai" || fieldType === "tech") {
        const items = parseNumberedList(reply);
        if (items) {
          addBotMsg("Pick what you need:", { type: "item_options", key: fieldType, items });
        } else {
          addBotMsg(reply);
        }
      } else {
        addBotMsg(reply);
      }
    } catch {
      setTyping(false);
      addBotMsg("Network error. Please try again.");
    }
  };

  // Smart title flow
  const handleTitleQuickAction = () => {
    const name = teamData.leaderName?.split(" ")[0] || "there";
    
    // Check if team already has a title from DB
    if (teamData.currentTitle?.trim()) {
      setMsgs(p => [...p, { from: "user", text: "Suggest Project Title", time: new Date(), data: null }]);
      addBotMsg(`${name}, your project already has a title: **"${teamData.currentTitle}"**\n\nDo you want to change it?`, { type: "yes_no", action: "change_title" });
      setTitleFlowStep('asked');
    } else {
      // No title yet — ask about the project first
      setMsgs(p => [...p, { from: "user", text: "Suggest Project Title", time: new Date(), data: null }]);
      addBotMsg(`${name}, to suggest the best titles for your **${teamData.technology || ''}** project, describe your project idea in 1-2 sentences. What does it do?`);
      setTitleFlowStep('waiting_desc');
    }
  };

  const handleYesNo = (answer, action) => {
    setMsgs(p => [...p, { from: "user", text: answer, time: new Date(), data: null }]);
    
    if (action === "change_title") {
      if (answer === "Yes") {
        addBotMsg("Tell me about your project in 1-2 sentences so I can suggest better titles.");
        setTitleFlowStep('waiting_desc');
      } else {
        addBotMsg("Great, keeping your current title! 👍");
        setTitleFlowStep(null);
      }
    }
  };

  const onQuick = (k) => {
    if (k === "title") {
      handleTitleQuickAction();
      return;
    }
    
    const a = QUICK_ACTIONS.find(x => x.key === k);
    setMsgs(p => [...p, { from: "user", text: a.label, time: new Date(), data: null }]);
    
    // Build smart prompts based on existing data
    let prompt = "";
    if (k === "desc") {
      prompt = teamData.currentTitle 
        ? `Write a 2-3 sentence project description for my project titled "${teamData.currentTitle}".`
        : "Write a 2-3 sentence project description for my hackathon project.";
    } else if (k === "problem") {
      prompt = teamData.currentTitle
        ? `Write a problem statement for my project "${teamData.currentTitle}".`
        : "Write a problem statement for my hackathon project.";
    } else if (k === "ai") {
      prompt = "Suggest 5 AI capabilities I could use in my project, numbered 1-5, one per line.";
    } else if (k === "tech") {
      prompt = "Suggest 5 technologies for my tech stack, numbered 1-5, one per line.";
    }
    
    callClaude(prompt, k);
  };

  const onSend = () => {
    const m = input.trim(); if (!m) return;
    setMsgs(p => [...p, { from: "user", text: m, time: new Date(), data: null }]); setInput("");

    // If we're in title flow waiting for project description
    if (titleFlowStep === 'waiting_desc') {
      setTitleFlowStep(null);
      callClaude(`Based on this project idea: "${m}", suggest 5 creative project titles numbered 1-5, one per line. Just the titles, nothing else.`, "title");
      return;
    }

    const fieldType = detectFieldType(m);
    
    // If asking for title via text input
    if (fieldType === "title" && !teamData.currentTitle?.trim()) {
      addBotMsg(`To suggest the best titles, describe your project idea in 1-2 sentences. What does it do?`);
      setTitleFlowStep('waiting_desc');
      return;
    }

    callClaude(m, fieldType);
  };

  const handlePickTitle = (title, msgIdx) => {
    if (!onAddToField) return;
    const clean = title.replace(/\*\*/g, '').split('—')[0].split(' - ')[0].trim();
    onAddToField('title', clean);
    setPickedItems(prev => new Set([...prev, `${msgIdx}-${title}`]));
  };

  const handleAddText = (key, text, msgIdx) => {
    if (!onAddToField) return;
    onAddToField(key, text.replace(/\*\*/g, '').trim());
    setPickedItems(prev => new Set([...prev, `${msgIdx}-${key}`]));
  };

  const handlePickItem = (key, item, msgIdx) => {
    if (!onAddToField) return;
    onAddToField(key, item);
    setPickedItems(prev => new Set([...prev, `${msgIdx}-${item}`]));
  };

  const startRec = useCallback(() => {
    const S = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!S) { alert("Voice not supported. Try Chrome."); return; }
    const r = new S(); r.lang="en-US"; r.interimResults=true; recRef.current=r;
    r.onresult=(e)=>{setInput(Array.from(e.results).map(x=>x[0].transcript).join(""))};
    r.onend=()=>setRecording(false); r.onerror=()=>setRecording(false);
    r.start(); setRecording(true);
  }, []);
  const stopRec = useCallback(() => { recRef.current?.stop(); setRecording(false); }, []);

  const ft = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const rTxt = (t) => t.split("\n").map((l, i) => (
    <div key={i} style={{ minHeight: l === "" ? "6px" : "auto" }}>
      {l.split(/(\*\*.*?\*\*)/).map((p, j) => p.startsWith("**") && p.endsWith("**")
        ? <strong key={j} style={{ color: "#fff", fontWeight: 600 }}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>)}
    </div>
  ));

  const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.sb-fab-wrap{position:fixed;bottom:32px;right:32px;z-index:999;display:flex;flex-direction:column;align-items:center;gap:6px;animation:fabIn .6s .3s cubic-bezier(.34,1.56,.64,1) both}
@keyframes fabIn{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
.sb-fab{width:56px;height:56px;border-radius:50%;border:none;background:rgba(8,3,14,0.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 4px 20px rgba(0,0,0,0.4),0 0 0 1px rgba(255,29,0,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s;position:relative;padding:0}
.sb-fab:hover{transform:scale(1.1)}
.sb-fab-icon{width:48px;height:48px;object-fit:contain;filter:sepia(1) saturate(5) hue-rotate(-10deg) brightness(1.1);animation:fabFloat 2.5s ease-in-out infinite}
@keyframes fabFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.sb-fab-title{font-family:'DM Sans',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff}
.sb-panel{position:fixed;z-index:999;width:350px;height:min(750px,calc(100vh - 48px));bottom:24px;right:24px;border-radius:16px;background:linear-gradient(180deg,rgba(15,8,24,0.98),rgba(8,3,14,0.99));border:1px solid rgba(255,170,0,.1);display:flex;flex-direction:column;animation:panelPop .35s cubic-bezier(.22,1,.36,1) both;box-shadow:0 8px 40px rgba(0,0,0,.5),0 0 30px rgba(255,170,0,.03),0 0 0 1px rgba(255,170,0,.06)}
@keyframes panelPop{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:none}}
.sb-hdr{padding:16px 18px;background:linear-gradient(135deg,rgba(255,29,0,.06),rgba(62,71,73,.06),transparent);border-bottom:1px solid rgba(255,170,0,.06);display:flex;align-items:center;gap:12px;flex-shrink:0}
.sb-rw{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#ff1d00,#ffaa00);box-shadow:0 0 14px rgba(255,170,0,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-ri{width:24px;height:24px;object-fit:contain;filter:brightness(0) invert(1);animation:rf 2.5s ease-in-out infinite}
@keyframes rf{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-5px) rotate(5deg)}}
.sb-hi{flex:1}.sb-hn{font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:6px}
.sb-hn span{font-size:.62rem;font-weight:400;color:#879499}
.sb-hs{font-size:.6rem;color:#4ade80;display:flex;align-items:center;gap:5px;margin-top:2px}
.sb-hs::before{content:'';width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0}
.sb-cl{background:none;border:none;color:#879499;cursor:pointer;padding:6px;border-radius:8px;transition:all .2s}
.sb-cl:hover{color:#fff;background:rgba(135,148,153,.1)}
.sb-body{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:14px;font-family:'DM Sans',sans-serif;min-height:0}
.sb-body::-webkit-scrollbar{width:3px}.sb-body::-webkit-scrollbar-thumb{background:rgba(255,170,0,.1);border-radius:3px}
.cb-wrap{display:flex;flex-direction:column;gap:4px}.cb-wrap.bot{align-items:flex-start}.cb-wrap.user{align-items:flex-end}
.cb-time{font-size:.56rem;color:#879499;padding:0 6px;letter-spacing:.3px}
.cb-row{position:relative;display:flex;align-items:center;max-width:88%}
.cb-wrap.bot .cb-row{animation:bIn .5s cubic-bezier(.22,1,.36,1) both}
.cb-wrap.user .cb-row{animation:uIn .5s cubic-bezier(.22,1,.36,1) both}
@keyframes bIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
@keyframes uIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
.cb-pill{padding:14px 20px;border-radius:16px;font-size:.82rem;line-height:1.6;word-break:break-word}
.cb-wrap.bot .cb-pill{border-top-left-radius:4px;background:linear-gradient(145deg,rgba(62,71,73,.35),rgba(62,71,73,.15));border:1px solid rgba(135,148,153,.08);color:rgba(255,255,255,.8);box-shadow:0 2px 16px rgba(62,71,73,.2),0 0 24px rgba(62,71,73,.08)}
.cb-wrap.user .cb-pill{border-top-right-radius:4px;background:linear-gradient(135deg,#ff1d00,#ffaa00);border:none;color:#fff;box-shadow:0 4px 20px rgba(255,29,0,.18),0 0 30px rgba(255,170,0,.08)}
.sb-quicks{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 18px;margin-top:14px;animation:bIn .4s .15s ease both}
.sb-quick{padding:10px 4px;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:500;cursor:pointer;border:1px solid rgba(255,170,0,.12);background:rgba(255,170,0,.04);color:#879499;transition:all .25s;display:flex;align-items:center;gap:6px;justify-content:center;text-align:center}
.sb-quick:hover{background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.25);color:#fff;transform:translateY(-1px)}

.cb-titles{display:flex;flex-direction:column;gap:6px;margin-top:10px;max-width:88%;animation:bIn .4s .1s ease both}
.cb-title-btn{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1px solid rgba(255,170,0,.15);background:rgba(255,170,0,.04);color:rgba(255,255,255,.8);font-family:'DM Sans',sans-serif;font-size:.74rem;font-weight:500;cursor:pointer;transition:all .25s;text-align:left}
.cb-title-btn:hover{background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.3);color:#fff;transform:translateX(4px)}
.cb-title-btn.picked{border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.06);color:#4ade80;cursor:default}
.cb-title-btn.picked:hover{transform:none}
.cb-title-btn svg{flex-shrink:0}

.cb-add-btn{display:flex;align-items:center;gap:6px;margin-top:8px;padding:7px 14px;border-radius:10px;border:1px solid rgba(255,170,0,.2);background:rgba(255,170,0,.06);color:#ffaa00;font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .25s;animation:bIn .4s .1s ease both}
.cb-add-btn:hover{background:rgba(255,170,0,.12);border-color:rgba(255,170,0,.35);transform:translateY(-1px);box-shadow:0 4px 12px rgba(255,170,0,.1)}
.cb-add-btn.added{border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.08);color:#4ade80;cursor:default}
.cb-add-btn.added:hover{transform:none;box-shadow:none}
.cb-add-btn svg{flex-shrink:0}

.cb-items{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;max-width:88%;animation:bIn .4s .1s ease both}
.cb-item-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid rgba(255,170,0,.15);background:rgba(255,170,0,.04);color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:500;cursor:pointer;transition:all .25s}
.cb-item-btn:hover{background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.3);color:#fff}
.cb-item-btn.picked{border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.06);color:#4ade80;cursor:default}
.cb-item-btn svg{flex-shrink:0;width:12px;height:12px}

.cb-yn{display:flex;gap:8px;margin-top:10px;animation:bIn .4s .1s ease both}
.cb-yn-btn{padding:8px 20px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .25s;border:1px solid}
.cb-yn-btn.yes{border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.06);color:#4ade80}
.cb-yn-btn.yes:hover{background:rgba(74,222,128,.12);transform:translateY(-1px)}
.cb-yn-btn.no{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:rgba(255,255,255,.6)}
.cb-yn-btn.no:hover{background:rgba(255,255,255,.06);transform:translateY(-1px)}

.cb-typing{align-self:flex-start;animation:bIn .3s ease both}
.cb-typing-dots{display:inline-flex;align-items:center;gap:5px;padding:14px 22px;background:linear-gradient(145deg,rgba(62,71,73,.3),rgba(62,71,73,.1));border:1px solid rgba(135,148,153,.06);border-radius:16px;border-top-left-radius:4px;box-shadow:0 2px 16px rgba(62,71,73,.15)}
.td{width:6px;height:6px;border-radius:50%;background:#ffaa00;animation:tb 1.2s ease-in-out infinite}
.td:nth-child(2){animation-delay:.15s}.td:nth-child(3){animation-delay:.3s}
@keyframes tb{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-6px);opacity:1}}
.sb-bottom{flex-shrink:0;display:flex;flex-direction:column;border-top:1px solid rgba(255,170,0,.08);background:rgba(8,3,14,.95)}
.sb-iw{padding:10px 12px;display:flex;gap:8px;align-items:center;width:100%;box-sizing:border-box}
.sb-ip{flex:1 1 auto;min-width:0;padding:10px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:22px;font-family:'DM Sans',sans-serif;font-size:.8rem;color:#fff;outline:none;transition:border-color .2s,background .2s;box-sizing:border-box}
.sb-ip::placeholder{color:rgba(255,255,255,.25)}.sb-ip:focus{border-color:rgba(255,170,0,.35);background:rgba(255,255,255,.08)}
.sb-ip.rec{border-color:rgba(255,29,0,.5);background:rgba(255,29,0,.06)}
.sb-mc{width:34px;height:34px;min-width:34px;border-radius:50%;border:none;background:rgba(255,255,255,.06);color:#879499;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex:0 0 34px}
.sb-mc:hover{background:rgba(255,255,255,.1);color:#fff}
.sb-mc.on{background:linear-gradient(135deg,#ff1d00,#ff4520);color:#fff;box-shadow:0 0 16px rgba(255,29,0,.3)}
.sb-sn{width:34px;height:34px;min-width:34px;border-radius:50%;border:none;background:linear-gradient(135deg,#ff1d00,#ffaa00);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex:0 0 34px;box-shadow:0 0 10px rgba(255,170,0,.15)}
.sb-sn:hover{transform:scale(1.06)}.sb-sn:disabled{opacity:.2;cursor:default;transform:none;box-shadow:none}
.sb-pw{text-align:center;padding:6px;font-size:.5rem;color:rgba(255,255,255,.12)}
@media(max-width:440px){.sb-panel{width:100vw;height:100vh;bottom:0;right:0;border-radius:0}}
`;

  return (
    <>
      <style>{css}</style>
      {!open && (
        <div className="sb-fab-wrap">
          <button className="sb-fab" onClick={() => toggleOpen(true)}>
            <img src={MESSENGER_ICON} alt="Chat" className="sb-fab-icon" />
          </button>
          <div className="sb-fab-title">SpaceBot</div>
        </div>
      )}
      {open && (
        <div className="sb-panel">
          <div className="sb-hdr">
            <div className="sb-rw"><img src={ROCKET_ICON} alt="" className="sb-ri" /></div>
            <div className="sb-hi">
              <div className="sb-hn">SpaceBot <span>AI</span></div>
              <div className="sb-hs">Online · {teamData.teamNumber}</div>
            </div>
            <button className="sb-cl" onClick={() => toggleOpen(false)}><X size={18} /></button>
          </div>
          <div className="sb-body">
            {msgs.map((m, i) => (
              <div key={i}>
                <div className={`cb-wrap ${m.from}`}>
                  <div className="cb-time">{ft(m.time)}</div>
                  <div className="cb-row"><div className="cb-pill">{rTxt(m.text)}</div></div>
                </div>

                {/* Yes/No buttons */}
                {m.from === "bot" && m.data?.type === "yes_no" && (
                  <div className="cb-yn">
                    <button className="cb-yn-btn yes" onClick={() => handleYesNo("Yes", m.data.action)}>Yes</button>
                    <button className="cb-yn-btn no" onClick={() => handleYesNo("No", m.data.action)}>No</button>
                  </div>
                )}

                {/* Title options */}
                {m.from === "bot" && m.data?.type === "title_options" && onAddToField && (
                  <div className="cb-titles">
                    {m.data.titles.map((t, ti) => {
                      const picked = pickedItems.has(`${i}-${t}`);
                      return (
                        <button key={ti} className={`cb-title-btn${picked ? ' picked' : ''}`} onClick={() => !picked && handlePickTitle(t, i)}>
                          {picked ? <Check size={14}/> : <Plus size={14}/>} {t}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Add description / problem */}
                {m.from === "bot" && m.data?.type === "addable" && onAddToField && (
                  <button
                    className={`cb-add-btn${pickedItems.has(`${i}-${m.data.key}`) ? ' added' : ''}`}
                    onClick={() => !pickedItems.has(`${i}-${m.data.key}`) && handleAddText(m.data.key, m.data.text, i)}
                  >
                    {pickedItems.has(`${i}-${m.data.key}`) ? <><Check size={13}/> Added!</> : <><Plus size={13}/> Add to {m.data.key === 'desc' ? 'Description' : 'Problem Statement'}</>}
                  </button>
                )}

                {/* AI / Tech items */}
                {m.from === "bot" && m.data?.type === "item_options" && onAddToField && (
                  <div className="cb-items">
                    {m.data.items.map((item, ii) => {
                      const picked = pickedItems.has(`${i}-${item}`);
                      return (
                        <button key={ii} className={`cb-item-btn${picked ? ' picked' : ''}`} onClick={() => !picked && handlePickItem(m.data.key, item, i)}>
                          {picked ? <Check size={12}/> : <Plus size={12}/>} {item}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quick actions after first message */}
                {i === 0 && m.from === "bot" && (
                  <div className="sb-quicks">
                    {QUICK_ACTIONS.map(a => (
                      <button key={a.key} className="sb-quick" onClick={() => onQuick(a.key)}>{a.icon} {a.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && (<div className="cb-typing"><div className="cb-typing-dots"><div className="td"/><div className="td"/><div className="td"/></div></div>)}
            <div ref={endRef} />
          </div>
          <div className="sb-bottom">
            <div className="sb-iw">
              <button className={`sb-mc${recording?" on":""}`} onClick={recording?stopRec:startRec}>{recording?<MicOff size={16}/>:<Mic size={16}/>}</button>
              <input ref={inRef} className={`sb-ip${recording?" rec":""}`} placeholder={recording?"Listening...":"Ask SpaceBot anything..."} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&onSend()} readOnly={recording}/>
              <button className="sb-sn" onClick={onSend} disabled={!input.trim()||typing}><Send size={15}/></button>
            </div>
            <div className="sb-pw">Powered by Claude AI</div>
          </div>
        </div>
      )}
    </>
  );
}