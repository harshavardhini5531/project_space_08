"use client"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"

export default function MentorPanelPage() {
  var params = useParams()
  var searchParams = useSearchParams()
  var requestId = params.requestId
  var token = searchParams.get("token")

  var [loading, setLoading] = useState(true)
  var [error, setError] = useState("")
  var [req, setReq] = useState(null)
  var [comments, setComments] = useState([])
  var [newComment, setNewComment] = useState("")
  var [sending, setSending] = useState(false)
  var [resolving, setResolving] = useState(false)
  var [markingComing, setMarkingComing] = useState(false)

  var priColors = { Low: "#34d399", Medium: "#fbbf24", High: "#f97316", Critical: "#ff3020" }
  var statusColors = { Pending: "#fbbf24", "In Progress": "#60a5fa", "Self Resolved": "#34d399", "Mentor Resolved": "#34d399", Cancelled: "#888" }

  useEffect(function () {
    if (!requestId || !token) { setError("Invalid link"); setLoading(false); return }
    fetchData()
    var interval = setInterval(fetchData, 10000)
    return function () { clearInterval(interval) }
  }, [requestId, token])

  function fetchData() {
    fetch("/api/mentor-request?id=" + requestId + "&token=" + token)
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.error) { setError(data.error); setLoading(false); return }
        setReq(data.request); setComments(data.comments || []); setLoading(false)
      })
      .catch(function () { setError("Failed to load"); setLoading(false) })
  }

  function handleComing() {
    setMarkingComing(true)
    fetch("/api/mentor-request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "coming", requestId: requestId, token: token })
    }).then(function (r) { return r.json() }).then(function (data) {
      if (data.success) fetchData()
      setMarkingComing(false)
    }).catch(function () { setMarkingComing(false) })
  }

  function handleComment() {
    if (!newComment.trim()) return
    setSending(true)
    fetch("/api/mentor-request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", requestId: requestId, token: token, comment: newComment.trim() })
    }).then(function (r) { return r.json() }).then(function (data) {
      if (data.success) { setNewComment(""); fetchData() }
      setSending(false)
    }).catch(function () { setSending(false) })
  }

  function handleResolve() {
    setResolving(true)
    fetch("/api/mentor-request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mentor_resolve", requestId: requestId, token: token })
    }).then(function (r) { return r.json() }).then(function (data) {
      if (data.success) fetchData()
      else alert(data.error || "Failed")
      setResolving(false)
    }).catch(function () { setResolving(false) })
  }

  function timeAgo(d) {
    if (!d) return ""
    var diff = Date.now() - new Date(d).getTime()
    var m = Math.floor(diff / 60000)
    if (m < 1) return "Just now"
    if (m < 60) return m + "m ago"
    var h = Math.floor(m / 60)
    if (h < 24) return h + "h ago"
    return Math.floor(h / 24) + "d ago"
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(255,96,64,0.15)", borderTop: "3px solid #ff6040", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase" }}>Loading</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ textAlign: "center", padding: 48, maxWidth: 380, animation: "fadeUp 0.5s ease" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,48,32,0.08)", border: "1px solid rgba(255,48,32,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6040", marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{error}</div>
        </div>
      </div>
    )
  }

  var isPending = req.status === "Pending"
  var isInProgress = req.status === "In Progress"
  var isResolved = req.status === "Self Resolved" || req.status === "Mentor Resolved"
  var isCancelled = req.status === "Cancelled"
  var isActive = isPending || isInProgress
  var sc = statusColors[req.status] || "#888"
  var pc = priColors[req.priority] || "#fbbf24"

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'DM Sans',sans-serif", color: "#fff" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .mp-fade{animation:fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) forwards}
        .mp-d1{animation-delay:0.05s;opacity:0}.mp-d2{animation-delay:0.12s;opacity:0}.mp-d3{animation-delay:0.19s;opacity:0}.mp-d4{animation-delay:0.26s;opacity:0}
        .mp-btn{border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all 0.3s cubic-bezier(0.23,1,0.32,1)}
        .mp-btn:hover{transform:translateY(-2px)}
        .mp-btn:active{transform:translateY(0)}
        .mp-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .mp-input{width:100%;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;resize:vertical;outline:none;transition:all 0.3s;box-sizing:border-box}
        .mp-input:focus{border-color:rgba(255,96,64,0.3);background:rgba(255,96,64,0.02);box-shadow:0 0 0 3px rgba(255,96,64,0.06)}
        .mp-cmt{animation:slideDown 0.3s ease forwards}
      `}</style>

      {/* Minimal Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>PS</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>Project Space</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Mentor Panel</div>
            </div>
          </div>
          <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 600, color: sc, background: sc + "18", border: "1px solid " + sc + "30" }}>{req.status}</span>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* Ticket Card */}
        <div className="mp-fade mp-d1" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3020,#ff6040,transparent)" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#ff6040" }}>{req.team_number}</span>
              <span style={{ padding: "3px 10px", borderRadius: 16, fontSize: 10, fontWeight: 600, color: pc, background: pc + "18", border: "1px solid " + pc + "30" }}>{req.priority}</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{timeAgo(req.created_at)}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Student</div>
              <div style={{ fontSize: 14, color: "#BEBEBE" }}>{req.requested_by_name || "Team Leader"}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Technology</div>
              <div style={{ fontSize: 14, color: "#BEBEBE" }}>{req.technology}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Issue</div>
            <div style={{ fontSize: 14, color: "#BEBEBE", lineHeight: 1.7, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>{req.issue_description}</div>
          </div>
        </div>

        {/* Actions */}
        {isActive && (
          <div className="mp-fade mp-d2" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {isPending && (
              <button className="mp-btn" onClick={handleComing} disabled={markingComing} style={{ flex: 1, padding: "14px 20px", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 14, boxShadow: "0 4px 20px rgba(34,197,94,0.25)" }}>
                {markingComing ? "Updating..." : "I'm Coming"}
              </button>
            )}
            {isInProgress && (
              <button className="mp-btn" onClick={handleResolve} disabled={resolving} style={{ flex: 1, padding: "14px 20px", borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: 14, boxShadow: "0 4px 20px rgba(59,130,246,0.25)" }}>
                {resolving ? "Resolving..." : "Mark Resolved"}
              </button>
            )}
          </div>
        )}

        {(isResolved || isCancelled) && (
          <div className="mp-fade mp-d2" style={{ padding: 16, borderRadius: 12, background: isResolved ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)", border: "1px solid " + (isResolved ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)"), textAlign: "center", marginBottom: 20 }}>
            {isResolved && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}><polyline points="20 6 9 17 4 12"/></svg>}
            <span style={{ fontSize: 13, color: isResolved ? "#34d399" : "#888", fontWeight: 600 }}>{req.status}</span>
          </div>
        )}

        {/* Comments */}
        <div className="mp-fade mp-d3">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.2)", marginBottom: 14, paddingLeft: 12, borderLeft: "3px solid #ff3020" }}>Comments ({comments.length})</div>

          {comments.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.12)", fontSize: 13, background: "rgba(255,255,255,0.015)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>No comments yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {comments.map(function (c) {
                var isSystem = c.author_type === "system"
                var isMentor = c.author_type === "mentor"
                return (
                  <div key={c.id} className="mp-cmt" style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.015)", borderLeft: "3px solid " + (isSystem ? "rgba(255,255,255,0.06)" : isMentor ? "#ff6040" : "#60a5fa") }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isSystem ? "rgba(255,255,255,0.2)" : isMentor ? "#ff6040" : "#60a5fa" }}>{c.author_name}</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: isSystem ? "rgba(255,255,255,0.3)" : "#BEBEBE", fontStyle: isSystem ? "italic" : "normal", lineHeight: 1.6 }}>{c.comment}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Comment Input */}
        {isActive && (
          <div className="mp-fade mp-d4" style={{ marginTop: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
            <textarea className="mp-input" value={newComment} onChange={function (e) { setNewComment(e.target.value) }} placeholder="Type a message to the student..." rows={3} maxLength={500} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>{newComment.length}/500</span>
              <button className="mp-btn" onClick={handleComment} disabled={sending || !newComment.trim()} style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", fontSize: 13, boxShadow: "0 4px 16px rgba(255,48,32,0.2)" }}>
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
