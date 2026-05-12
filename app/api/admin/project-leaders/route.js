// app/api/admin/project-leaders/route.js
//
// Final ranking endpoint — admin sees grand total /150 per team.
//
//   For each team:
//     Panel scores: average all mentors' total_score → final /50
//     Leaderboard score: same /100 from /api/admin/leaderboard
//     Grand total: panel_avg + leaderboard = /150
//
// Returns one row per team with full breakdown including per-mentor panel scores.

import { supabase } from '@/lib/supabase'

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 30000

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

let devCache = { at: 0, data: null }
const DEV_TTL_MS = 60 * 1000

async function fetchDevProjects() {
  const now = Date.now()
  if (devCache.data && (now - devCache.at) < DEV_TTL_MS) return devCache.data
  try {
    const c = new AbortController()
    const t = setTimeout(() => c.abort(), FETCH_TIMEOUT_MS)
    const r = await fetch(`${DEV_API_BASE}/api/projects`, { signal: c.signal })
    clearTimeout(t)
    if (!r.ok) return []
    const d = await r.json()
    const projects = Array.isArray(d?.data) ? d.data : []
    devCache = { at: now, data: projects }
    return projects
  } catch (e) {
    return devCache.data || []
  }
}



// ── Manual AI score fallback (synced with mentor panel-view) ──
const MANUAL_AI_SCORES = {
  'academic intelligence': { score: 48.0, dims: { problem_statement: 55.0, architecture_design: 62.0, requirements_fulfillment: 45.0, code_quality: 38.0, future_scope: 40.0 } },
  'ace(active community events)': { score: 68.4, dims: { problem_statement: 78.0, architecture_design: 88.0, requirements_fulfillment: 74.0, code_quality: 62.0, future_scope: 40.0 } },
  'admit bridge': { score: 70.8, dims: { problem_statement: 72.0, architecture_design: 82.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 70.0 } },
  'admitai-enterprise voice-powered college admission system': { score: 68.0, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 58.0, code_quality: 70.0, future_scope: 72.0 } },
  'ai based grid camera': { score: 75.4, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 80.0, code_quality: 72.0, future_scope: 55.0 } },
  'ai crop disease detection': { score: 17.4, dims: { problem_statement: 20.0, architecture_design: 18.0, requirements_fulfillment: 15.0, code_quality: 22.0, future_scope: 12.0 } },
  'ai exam evaluation system': { score: 82.6, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 78.0, code_quality: 80.0, future_scope: 85.0 } },
  'ai image search engine': { score: 56.6, dims: { problem_statement: 68.0, architecture_design: 58.0, requirements_fulfillment: 55.0, code_quality: 62.0, future_scope: 40.0 } },
  'ai interview': { score: 66.8, dims: { problem_statement: 72.0, architecture_design: 62.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 70.0 } },
  'ai interview simulator': { score: 48.8, dims: { problem_statement: 62.0, architecture_design: 38.0, requirements_fulfillment: 42.0, code_quality: 62.0, future_scope: 40.0 } },
  'ai powered task analyst': { score: 54.6, dims: { problem_statement: 65.0, architecture_design: 58.0, requirements_fulfillment: 55.0, code_quality: 55.0, future_scope: 40.0 } },
  'ai sign interpreter': { score: 66.0, dims: { problem_statement: 82.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 40.0 } },
  'ai smart campus navigator': { score: 70.6, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 72.0, code_quality: 74.0, future_scope: 40.0 } },
  'ai smart travel assistant': { score: 64.4, dims: { problem_statement: 78.0, architecture_design: 72.0, requirements_fulfillment: 65.0, code_quality: 52.0, future_scope: 55.0 } },
  'ai team collab agent': { score: 64.2, dims: { problem_statement: 72.0, architecture_design: 70.0, requirements_fulfillment: 52.0, code_quality: 72.0, future_scope: 55.0 } },
  'ai video resume builder': { score: 53.0, dims: { problem_statement: 62.0, architecture_design: 60.0, requirements_fulfillment: 58.0, code_quality: 45.0, future_scope: 40.0 } },
  'ai voice admission system': { score: 69.4, dims: { problem_statement: 72.0, architecture_design: 74.0, requirements_fulfillment: 68.0, code_quality: 63.0, future_scope: 70.0 } },
  'ai-based object detection': { score: 51.0, dims: { problem_statement: 55.0, architecture_design: 52.0, requirements_fulfillment: 38.0, code_quality: 62.0, future_scope: 48.0 } },
  'ai-mentor': { score: 53.0, dims: { problem_statement: 62.0, architecture_design: 45.0, requirements_fulfillment: 52.0, code_quality: 48.0, future_scope: 58.0 } },
  'ai-navigator for blind': { score: 68.6, dims: { problem_statement: 72.0, architecture_design: 70.0, requirements_fulfillment: 65.0, code_quality: 58.0, future_scope: 78.0 } },
  'ai-powered helmet violation detection system with voice alerts': { score: 78.0, dims: { problem_statement: 90.0, architecture_design: 88.0, requirements_fulfillment: 85.0, code_quality: 72.0, future_scope: 55.0 } },
  'ai-powered security operations center (ai soc) for amazon web services': { score: 69.8, dims: { problem_statement: 70.0, architecture_design: 82.0, requirements_fulfillment: 74.0, code_quality: 68.0, future_scope: 55.0 } },
  'algotalk-ai-powered collaborative learning & competitive programming platform': { score: 77.4, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 78.0, code_quality: 84.0, future_scope: 55.0 } },
  'articulate hub': { score: 76.8, dims: { problem_statement: 82.0, architecture_design: 78.0, requirements_fulfillment: 72.0, code_quality: 78.0, future_scope: 74.0 } },
'articulatehub': { score: 76.8, dims: { problem_statement: 82.0, architecture_design: 78.0, requirements_fulfillment: 72.0, code_quality: 78.0, future_scope: 74.0 } },
  'attendinsights': { score: 44.0, dims: { problem_statement: 55.0, architecture_design: 40.0, requirements_fulfillment: 35.0, code_quality: 52.0, future_scope: 38.0 } },
  'auto assign & escalate': { score: 67.4, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 65.0, code_quality: 62.0, future_scope: 70.0 } },
  'automated service chatbot': { score: 58.8, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 62.0, code_quality: 52.0, future_scope: 40.0 } },
  'axi-apb hybrid interface': { score: 83.8, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 80.0, code_quality: 84.0, future_scope: 88.0 } },
  'banking kyc automation': { score: 12.4, dims: { problem_statement: 18.0, architecture_design: 14.0, requirements_fulfillment: 12.0, code_quality: 8.0, future_scope: 10.0 } },
  'campix': { score: 67.6, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 65.0, future_scope: 55.0 } },
  'campus affiliate marketplace': { score: 61.6, dims: { problem_statement: 72.0, architecture_design: 74.0, requirements_fulfillment: 70.0, code_quality: 52.0, future_scope: 40.0 } },
  'campus ai': { score: 60.0, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 42.0, future_scope: 40.0 } },
  'campus connect': { score: 54.2, dims: { problem_statement: 52.0, architecture_design: 58.0, requirements_fulfillment: 44.0, code_quality: 52.0, future_scope: 65.0 } },
  'campus path tracker': { score: 64.4, dims: { problem_statement: 62.0, architecture_design: 72.0, requirements_fulfillment: 58.0, code_quality: 62.0, future_scope: 68.0 } },
  'campus permission hub': { score: 68.2, dims: { problem_statement: 82.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 58.0, future_scope: 55.0 } },
  'campus reshare hub': { score: 44.8, dims: { problem_statement: 55.0, architecture_design: 38.0, requirements_fulfillment: 45.0, code_quality: 48.0, future_scope: 38.0 } },
  'careerverse ai': { score: 58.8, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 62.0, code_quality: 52.0, future_scope: 40.0 } },
  'carrer pilot': { score: 10.4, dims: { problem_statement: 10.0, architecture_design: 12.0, requirements_fulfillment: 8.0, code_quality: 12.0, future_scope: 10.0 } },
  'certihub': { score: 73.4, dims: { problem_statement: 78.0, architecture_design: 87.0, requirements_fulfillment: 79.0, code_quality: 68.0, future_scope: 55.0 } },
  'chanakyalink : the customized protocol': { score: 60.8, dims: { problem_statement: 62.0, architecture_design: 72.0, requirements_fulfillment: 60.0, code_quality: 58.0, future_scope: 52.0 } },
  'churn prediction system': { score: 49.8, dims: { problem_statement: 62.0, architecture_design: 40.0, requirements_fulfillment: 52.0, code_quality: 55.0, future_scope: 40.0 } },
  'ci/cd fusion cloud': { score: 54.0, dims: { problem_statement: 52.0, architecture_design: 68.0, requirements_fulfillment: 58.0, code_quality: 52.0, future_scope: 40.0 } },
  'cinehub-ai powered film collaboration & talent networking platform': { score: 64.8, dims: { problem_statement: 72.0, architecture_design: 74.0, requirements_fulfillment: 65.0, code_quality: 58.0, future_scope: 55.0 } },
  'cloud native eks hub': { score: 69.4, dims: { problem_statement: 78.0, architecture_design: 80.0, requirements_fulfillment: 72.0, code_quality: 62.0, future_scope: 55.0 } },
  'cloudcompare ai': { score: 69.4, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 70.0, code_quality: 82.0, future_scope: 55.0 } },
  'cloudsentinel ai': { score: 79.6, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 80.0, code_quality: 78.0, future_scope: 70.0 } },
  'cloudshield ai': { score: 58.6, dims: { problem_statement: 68.0, architecture_design: 65.0, requirements_fulfillment: 62.0, code_quality: 58.0, future_scope: 40.0 } },
  'codeverse': { score: 78.4, dims: { problem_statement: 78.0, architecture_design: 88.0, requirements_fulfillment: 82.0, code_quality: 74.0, future_scope: 70.0 } },
  'codewave': { score: 59.6, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 58.0, code_quality: 40.0, future_scope: 60.0 } },
  'cogniverse': { score: 68.0, dims: { problem_statement: 72.0, architecture_design: 82.0, requirements_fulfillment: 78.0, code_quality: 68.0, future_scope: 40.0 } },
  'cognivision': { score: 81.8, dims: { problem_statement: 82.0, architecture_design: 84.0, requirements_fulfillment: 82.0, code_quality: 80.0, future_scope: 81.0 } },
  'cohort connect: academic collaboration & resource sharing platform': { score: 64.0, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 40.0 } },
  'colon': { score: 79.0, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 80.0, future_scope: 70.0 } },
  'console sensei cloud ops': { score: 71.2, dims: { problem_statement: 72.0, architecture_design: 74.0, requirements_fulfillment: 68.0, code_quality: 72.0, future_scope: 70.0 } },
  'creatoros': { score: 76.6, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 76.0, code_quality: 70.0, future_scope: 70.0 } },
  'cybershield': { score: 53.4, dims: { problem_statement: 62.0, architecture_design: 58.0, requirements_fulfillment: 52.0, code_quality: 55.0, future_scope: 40.0 } },
  'dealance': { score: 63.0, dims: { problem_statement: 62.0, architecture_design: 72.0, requirements_fulfillment: 68.0, code_quality: 58.0, future_scope: 55.0 } },
  'debateforge': { score: 80.0, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 79.0, code_quality: 81.0, future_scope: 70.0 } },
  'decisioniq-ai': { score: 42.4, dims: { problem_statement: 52.0, architecture_design: 40.0, requirements_fulfillment: 38.0, code_quality: 42.0, future_scope: 40.0 } },
  'deepshield-ai': { score: 69.0, dims: { problem_statement: 78.0, architecture_design: 72.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 65.0 } },
  'design and implementation of an ai-driven 2d-mesh network-on-chip (noc) with predictive congestion control and neural arbitration.': { score: 69.8, dims: { problem_statement: 78.0, architecture_design: 80.0, requirements_fulfillment: 74.0, code_quality: 62.0, future_scope: 55.0 } },
  'devopsgpt phoenix': { score: 75.6, dims: { problem_statement: 72.0, architecture_design: 82.0, requirements_fulfillment: 76.0, code_quality: 78.0, future_scope: 70.0 } },
  'digital marketing': { score: 77.6, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 72.0, code_quality: 68.0, future_scope: 78.0 } },
  'disaster alert system': { score: 50.4, dims: { problem_statement: 62.0, architecture_design: 40.0, requirements_fulfillment: 38.0, code_quality: 72.0, future_scope: 40.0 } },
  'dynamic question mastery system': { score: 62.4, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 52.0, code_quality: 70.0, future_scope: 40.0 } },
  'edubridge': { score: 62.0, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 52.0, future_scope: 40.0 } },
  'eeeztrip-your personal ai travel companion': { score: 70.0, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 70.0 } },
  'employee onboarding': { score: 78.6, dims: { problem_statement: 78.0, architecture_design: 82.0, requirements_fulfillment: 75.0, code_quality: 80.0, future_scope: 78.0 } },
  'errlytics': { score: 62.4, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 65.0, code_quality: 52.0, future_scope: 55.0 } },
  'examvault': { score: 67.2, dims: { problem_statement: 72.0, architecture_design: 58.0, requirements_fulfillment: 62.0, code_quality: 74.0, future_scope: 70.0 } },
  'explora ai': { score: 45.0, dims: { problem_statement: 62.0, architecture_design: 38.0, requirements_fulfillment: 40.0, code_quality: 55.0, future_scope: 30.0 } },
  'exploremate': { score: 55.0, dims: { problem_statement: 72.0, architecture_design: 38.0, requirements_fulfillment: 58.0, code_quality: 52.0, future_scope: 55.0 } },
  'feedmind': { score: 61.2, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 62.0, code_quality: 74.0, future_scope: 30.0 } },
  'fitx-ai fitness trainer': { score: 49.4, dims: { problem_statement: 62.0, architecture_design: 38.0, requirements_fulfillment: 44.0, code_quality: 48.0, future_scope: 55.0 } },
  'graduway': { score: 72.4, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 70.0, code_quality: 72.0, future_scope: 70.0 } },
  'hacksphere': { score: 69.4, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 62.0, future_scope: 40.0 } },
  'hardware root-of-trust for secure system operation': { score: 77.6, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 85.0, code_quality: 78.0, future_scope: 55.0 } },
  'hawk eye': { score: 64.0, dims: { problem_statement: 70.0, architecture_design: 68.0, requirements_fulfillment: 65.0, code_quality: 62.0, future_scope: 55.0 } },
  'healix': { score: 70.0, dims: { problem_statement: 82.0, architecture_design: 80.0, requirements_fulfillment: 76.0, code_quality: 72.0, future_scope: 40.0 } },
  'hirescore': { score: 63.2, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 58.0, future_scope: 40.0 } },
  'hoot path': { score: 65.6, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 70.0, code_quality: 68.0, future_scope: 40.0 } },
  'hoot-ai': { score: 66.4, dims: { problem_statement: 82.0, architecture_design: 70.0, requirements_fulfillment: 72.0, code_quality: 68.0, future_scope: 40.0 } },
  'hrgenie ai': { score: 53.0, dims: { problem_statement: 62.0, architecture_design: 63.0, requirements_fulfillment: 55.0, code_quality: 45.0, future_scope: 40.0 } },
  'intelliconnect': { score: 64.8, dims: { problem_statement: 72.0, architecture_design: 70.0, requirements_fulfillment: 65.0, code_quality: 62.0, future_scope: 55.0 } },
  'intellmind': { score: 73.2, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 84.0, code_quality: 72.0, future_scope: 40.0 } },
  'jaspergold formal vrf': { score: 67.4, dims: { problem_statement: 70.0, architecture_design: 68.0, requirements_fulfillment: 67.0, code_quality: 72.0, future_scope: 60.0 } },
  'joblens': { score: 70.6, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 68.0, future_scope: 40.0 } },
  'labmate ai': { score: 70.0, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 70.0 } },
  'lecture booking system': { score: 74.0, dims: { problem_statement: 78.0, architecture_design: 85.0, requirements_fulfillment: 80.0, code_quality: 72.0, future_scope: 55.0 } },
  'levelup ai': { score: 49.8, dims: { problem_statement: 62.0, architecture_design: 40.0, requirements_fulfillment: 52.0, code_quality: 55.0, future_scope: 40.0 } },
  'livetech-stay live with tech': { score: 71.6, dims: { problem_statement: 82.0, architecture_design: 72.0, requirements_fulfillment: 74.0, code_quality: 68.0, future_scope: 62.0 } },
  'local service connect': { score: 78.2, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 72.0, future_scope: 74.0 } },
  'mailora': { score: 79.8, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 79.0, code_quality: 80.0, future_scope: 70.0 } },
  'mealnexus': { score: 75.4, dims: { problem_statement: 82.0, architecture_design: 80.0, requirements_fulfillment: 72.0, code_quality: 68.0, future_scope: 75.0 } },
  'medinet': { score: 26.0, dims: { problem_statement: 25.0, architecture_design: 35.0, requirements_fulfillment: 22.0, code_quality: 18.0, future_scope: 30.0 } },
  'meetmind ai': { score: 63.2, dims: { problem_statement: 72.0, architecture_design: 74.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 40.0 } },
  'nexus': { score: 80.4, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 78.0, code_quality: 84.0, future_scope: 70.0 } },
  'ngo volunteer impact hub': { score: 66.4, dims: { problem_statement: 78.0, architecture_design: 82.0, requirements_fulfillment: 75.0, code_quality: 72.0, future_scope: 25.0 } },
  'offline emergency comms': { score: 63.4, dims: { problem_statement: 65.0, architecture_design: 65.0, requirements_fulfillment: 62.0, code_quality: 70.0, future_scope: 55.0 } },
  'omnimark.ai': { score: 77.8, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 80.0, code_quality: 72.0, future_scope: 70.0 } },
  'placement skill gap track': { score: 52.4, dims: { problem_statement: 62.0, architecture_design: 38.0, requirements_fulfillment: 48.0, code_quality: 62.0, future_scope: 52.0 } },
  'policyguard ai': { score: 64.6, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 65.0, code_quality: 68.0, future_scope: 40.0 } },
  'pulsetrack': { score: 69.8, dims: { problem_statement: 78.0, architecture_design: 82.0, requirements_fulfillment: 72.0, code_quality: 62.0, future_scope: 55.0 } },
  'qlue': { score: 81.2, dims: { problem_statement: 81.0, architecture_design: 82.0, requirements_fulfillment: 80.0, code_quality: 83.0, future_scope: 80.0 } },
  'quickcheck': { score: 65.4, dims: { problem_statement: 72.0, architecture_design: 80.0, requirements_fulfillment: 65.0, code_quality: 70.0, future_scope: 40.0 } },
  'recall': { score: 78.0, dims: { problem_statement: 82.0, architecture_design: 90.0, requirements_fulfillment: 78.0, code_quality: 72.0, future_scope: 68.0 } },
  'resume intelligence': { score: 40.6, dims: { problem_statement: 28.0, architecture_design: 44.0, requirements_fulfillment: 38.0, code_quality: 58.0, future_scope: 35.0 } },
  'rtl joules opt tools': { score: 79.8, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 84.0, future_scope: 70.0 } },
  'safecampus': { score: 46.0, dims: { problem_statement: 52.0, architecture_design: 48.0, requirements_fulfillment: 38.0, code_quality: 42.0, future_scope: 50.0 } },
  'safedrive alert system': { score: 71.0, dims: { problem_statement: 78.0, architecture_design: 72.0, requirements_fulfillment: 68.0, code_quality: 72.0, future_scope: 65.0 } },
  'safeher': { score: 71.2, dims: { problem_statement: 72.0, architecture_design: 74.0, requirements_fulfillment: 62.0, code_quality: 68.0, future_scope: 80.0 } },
  'safepulse': { score: 78.8, dims: { problem_statement: 88.0, architecture_design: 82.0, requirements_fulfillment: 78.0, code_quality: 76.0, future_scope: 70.0 } },
  'sanchari': { score: 83.4, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 84.0, code_quality: 78.0, future_scope: 85.0 } },
  'scheme finder': { score: 61.6, dims: { problem_statement: 72.0, architecture_design: 70.0, requirements_fulfillment: 68.0, code_quality: 58.0, future_scope: 40.0 } },
  'self-healing mac array': { score: 56.0, dims: { problem_statement: 62.0, architecture_design: 63.0, requirements_fulfillment: 60.0, code_quality: 55.0, future_scope: 40.0 } },
  'serverless ci/cd automation': { score: 24.4, dims: { problem_statement: 28.0, architecture_design: 22.0, requirements_fulfillment: 20.0, code_quality: 30.0, future_scope: 22.0 } },
  'shadowtrace travel ai': { score: 72.4, dims: { problem_statement: 78.0, architecture_design: 80.0, requirements_fulfillment: 72.0, code_quality: 62.0, future_scope: 70.0 } },
  'share sphere': { score: 66.4, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 62.0, code_quality: 52.0, future_scope: 68.0 } },
  'silentvoice ai translator': { score: 14.8, dims: { problem_statement: 18.0, architecture_design: 14.0, requirements_fulfillment: 16.0, code_quality: 12.0, future_scope: 14.0 } },
  'skillbridge': { score: 65.8, dims: { problem_statement: 72.0, architecture_design: 62.0, requirements_fulfillment: 60.0, code_quality: 70.0, future_scope: 65.0 } },
  'skillconnectai': { score: 79.6, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 78.0, code_quality: 80.0, future_scope: 70.0 } },
  'skillora': { score: 72.6, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 68.0, code_quality: 80.0, future_scope: 65.0 } },
  'skillstack ai': { score: 79.4, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 72.0, future_scope: 80.0 } },
  'skillsynth ai': { score: 79.0, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 80.0, future_scope: 70.0 } },
  'skilltrove': { score: 67.8, dims: { problem_statement: 72.0, architecture_design: 70.0, requirements_fulfillment: 68.0, code_quality: 74.0, future_scope: 55.0 } },
  'smart ai career guidances': { score: 59.4, dims: { problem_statement: 72.0, architecture_design: 65.0, requirements_fulfillment: 62.0, code_quality: 58.0, future_scope: 40.0 } },
  'smart airport management': { score: 73.4, dims: { problem_statement: 72.0, architecture_design: 82.0, requirements_fulfillment: 74.0, code_quality: 71.0, future_scope: 68.0 } },
  'smart apply-ai powered job assistant': { score: 82.2, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 79.0, code_quality: 84.0, future_scope: 78.0 } },
  'smart event assistant': { score: 67.0, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 62.0, code_quality: 68.0, future_scope: 55.0 } },
  'smart hire-aditya ai resume': { score: 58.6, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 55.0, code_quality: 58.0, future_scope: 40.0 } },
  'smart hotel service management': { score: 68.2, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 74.0, code_quality: 62.0, future_scope: 55.0 } },
  'smart review system': { score: 70.8, dims: { problem_statement: 72.0, architecture_design: 82.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 70.0 } },
  'smart scan': { score: 67.4, dims: { problem_statement: 78.0, architecture_design: 85.0, requirements_fulfillment: 72.0, code_quality: 62.0, future_scope: 40.0 } },
  'smart service finder with trust building and ai recommendation system': { score: 63.0, dims: { problem_statement: 78.0, architecture_design: 55.0, requirements_fulfillment: 68.0, code_quality: 52.0, future_scope: 62.0 } },
  'smart student connect': { score: 53.0, dims: { problem_statement: 62.0, architecture_design: 58.0, requirements_fulfillment: 52.0, code_quality: 45.0, future_scope: 48.0 } },
  'smart traffic navigator': { score: 75.8, dims: { problem_statement: 72.0, architecture_design: 85.0, requirements_fulfillment: 78.0, code_quality: 74.0, future_scope: 70.0 } },
  'social media analytics-engagement monitoring platform': { score: 52.8, dims: { problem_statement: 62.0, architecture_design: 52.0, requirements_fulfillment: 58.0, code_quality: 52.0, future_scope: 40.0 } },
  'sta of digital design': { score: 70.4, dims: { problem_statement: 82.0, architecture_design: 78.0, requirements_fulfillment: 80.0, code_quality: 72.0, future_scope: 40.0 } },
  'stack track': { score: 26.0, dims: { problem_statement: 28.0, architecture_design: 18.0, requirements_fulfillment: 20.0, code_quality: 42.0, future_scope: 22.0 } },
  'startwise ai (investor training platform)': { score: 67.0, dims: { problem_statement: 78.0, architecture_design: 72.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 55.0 } },
  'student-360': { score: 57.8, dims: { problem_statement: 70.0, architecture_design: 55.0, requirements_fulfillment: 62.0, code_quality: 62.0, future_scope: 40.0 } },
  'studysniper ai': { score: 68.2, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 72.0, code_quality: 62.0, future_scope: 40.0 } },
  'systolic hw accelerator': { score: 69.0, dims: { problem_statement: 82.0, architecture_design: 78.0, requirements_fulfillment: 75.0, code_quality: 55.0, future_scope: 55.0 } },
  'take me there': { score: 51.2, dims: { problem_statement: 62.0, architecture_design: 40.0, requirements_fulfillment: 52.0, code_quality: 62.0, future_scope: 40.0 } },
  'task marketplace': { score: 69.8, dims: { problem_statement: 72.0, architecture_design: 82.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 65.0 } },
  'tech nexus': { score: 49.4, dims: { problem_statement: 62.0, architecture_design: 38.0, requirements_fulfillment: 45.0, code_quality: 62.0, future_scope: 40.0 } },
  'thub prime-ai-powered student feedback & mentor improvement system': { score: 67.0, dims: { problem_statement: 82.0, architecture_design: 78.0, requirements_fulfillment: 70.0, code_quality: 65.0, future_scope: 40.0 } },
  'torus ai': { score: 64.6, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 70.0, code_quality: 58.0, future_scope: 55.0 } },
  'trana-trace': { score: 65.0, dims: { problem_statement: 78.0, architecture_design: 82.0, requirements_fulfillment: 72.0, code_quality: 68.0, future_scope: 25.0 } },
  'true tone': { score: 75.4, dims: { problem_statement: 70.0, architecture_design: 88.0, requirements_fulfillment: 84.0, code_quality: 80.0, future_scope: 55.0 } },
  'trusthire ai': { score: 62.4, dims: { problem_statement: 72.0, architecture_design: 70.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 40.0 } },
  'truthlens': { score: 63.8, dims: { problem_statement: 72.0, architecture_design: 55.0, requirements_fulfillment: 65.0, code_quality: 72.0, future_scope: 55.0 } },
  'trylume': { score: 36.6, dims: { problem_statement: 40.0, architecture_design: 30.0, requirements_fulfillment: 38.0, code_quality: 40.0, future_scope: 35.0 } },
  'unified campus community platform': { score: 78.4, dims: { problem_statement: 82.0, architecture_design: 88.0, requirements_fulfillment: 78.0, code_quality: 74.0, future_scope: 70.0 } },
  'univo': { score: 62.6, dims: { problem_statement: 72.0, architecture_design: 78.0, requirements_fulfillment: 65.0, code_quality: 58.0, future_scope: 40.0 } },
  'voltus insightai': { score: 57.0, dims: { problem_statement: 55.0, architecture_design: 58.0, requirements_fulfillment: 55.0, code_quality: 65.0, future_scope: 52.0 } },
  'work mithra': { score: 61.6, dims: { problem_statement: 72.0, architecture_design: 68.0, requirements_fulfillment: 58.0, code_quality: 55.0, future_scope: 55.0 } },
  'work ping': { score: 82.0, dims: { problem_statement: 82.0, architecture_design: 85.0, requirements_fulfillment: 84.0, code_quality: 81.0, future_scope: 78.0 } },
  'zenith-personal ai assistant': { score: 66.0, dims: { problem_statement: 72.0, architecture_design: 70.0, requirements_fulfillment: 65.0, code_quality: 68.0, future_scope: 55.0 } },
  'zonein': { score: 67.4, dims: { problem_statement: 72.0, architecture_design: 80.0, requirements_fulfillment: 68.0, code_quality: 62.0, future_scope: 55.0 } },
}

function normalizeTitle(s) {
  if (!s) return ''
  let out = String(s)
  // Replace mojibake en-dash/em-dash sequence (â + €) with a hyphen
  out = out.replace(/\u00e2\u20ac[\u2010-\u201f\u0022]/g, '-')
  // Replace real dashes (em, en, regular variants)
  out = out.replace(/[\u2010-\u2015]/g, '-')
  // Replace smart quotes
  out = out.replace(/[\u2018-\u2019]/g, "'").replace(/[\u201c-\u201f]/g, '"')
  // Strip non-ASCII
  out = out.split('').filter(c => c.charCodeAt(0) < 128).join('')
  // Tighten hyphens & whitespace
  out = out.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim().toLowerCase()
  // Strip remaining quote chars
  out = out.replace(/"/g, '').replace(/'/g, '')
  return out
}

function lookupManualScore(title, submissionName) {
  for (const candidate of [title, submissionName]) {
    if (!candidate) continue
    const key = normalizeTitle(candidate)
    if (MANUAL_AI_SCORES[key]) return MANUAL_AI_SCORES[key]
  }
  return null
}

function computeOverallScore(latestScore) {
  if (!latestScore || typeof latestScore !== 'object') return null
  const vals = Object.values(latestScore).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const safe = n => (typeof n === 'number' && !isNaN(n)) ? n : 0
const round1 = n => n == null || isNaN(n) ? null : Math.round(n * 10) / 10

export async function POST(request) {
  try {
    const { adminEmail } = await request.json().catch(() => ({}))
    if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ── Pull all the data we need ──
    const [
      teamsRes, membersRes, certsRes, pptsRes,
      attendanceRes, mentorEvalsRes, stagesRes,
      reviewSubsRes, devProjects,
      panelScoresRes, panelAssignmentsRes,
    ] = await Promise.all([
      supabase.from('teams').select('team_number, project_title, technology, batch, mentor_assigned, leader_roll'),
      supabase.from('team_members').select('team_number, roll_number'),
      supabase.from('team_certificates').select('team_number, roll_number'),
      supabase.from('team_ppts').select('team_number, uploaded_at'),
      supabase.from('attendance_logs').select('roll_number, punch_date, punch_mode'),
      supabase.from('mentor_evaluations').select('team_number, average_score'),
      supabase.from('milestone_submissions').select('team_number, status'),
      supabase.from('project_review_submissions').select('team_number, dev_api_id'),
      fetchDevProjects(),
      supabase.from('panel_scores').select('*').order('updated_at', { ascending: false }),
      supabase.from('panel_assignments').select('panel_name'),
    ])

    const teams = teamsRes.data || []
    if (teams.length === 0) {
      return Response.json({ ok: true, teams: [], summary: { total_teams: 0 }, allPanels: [] })
    }

    const membersByTeam = {}
    ;(membersRes.data || []).forEach(m => {
      if (!membersByTeam[m.team_number]) membersByTeam[m.team_number] = []
      membersByTeam[m.team_number].push(m.roll_number)
    })

    const certsByTeam = {}
    ;(certsRes.data || []).forEach(c => { certsByTeam[c.team_number] = (certsByTeam[c.team_number] || 0) + 1 })

    const pptByTeam = {}
    ;(pptsRes.data || []).forEach(p => { pptByTeam[p.team_number] = !!p.uploaded_at })

    const mentorEvalByTeam = {}
    ;(mentorEvalsRes.data || []).forEach(e => {
      if (e.average_score != null) mentorEvalByTeam[e.team_number] = Number(e.average_score)
    })

    const stagesApprovedByTeam = {}
    ;(stagesRes.data || []).forEach(s => {
      if (s.status === 'completed') {
        stagesApprovedByTeam[s.team_number] = (stagesApprovedByTeam[s.team_number] || 0) + 1
      }
    })

    // Attendance (Option B — proportional)
    const modesByRollDate = {}
    ;(attendanceRes.data || []).forEach(a => {
      if (!a.roll_number || !a.punch_date || !a.punch_mode) return
      const r = a.roll_number.toUpperCase()
      const d = a.punch_date
      if (!modesByRollDate[r]) modesByRollDate[r] = {}
      if (!modesByRollDate[r][d]) modesByRollDate[r][d] = new Set()
      modesByRollDate[r][d].add(a.punch_mode)
    })
    const modesHitByRoll = {}
    for (const roll of Object.keys(modesByRollDate)) {
      let total = 0
      for (const date of Object.keys(modesByRollDate[roll])) total += modesByRollDate[roll][date].size
      modesHitByRoll[roll] = total
    }

    const devById = {}
    ;(devProjects || []).forEach(p => { devById[p._id] = p })
    const reviewScoreByTeam = {}
    ;(reviewSubsRes.data || []).forEach(s => {
      if (!s.dev_api_id) return
      const proj = devById[s.dev_api_id]
      if (!proj) return
      const o = computeOverallScore(proj.latestScore)
      if (o != null) reviewScoreByTeam[s.team_number] = o
    })

    // Panel scores grouped by team
    const panelScores = panelScoresRes.data || []
    const panelByTeam = {}
    for (const ps of panelScores) {
      if (!panelByTeam[ps.team_number]) panelByTeam[ps.team_number] = []
      panelByTeam[ps.team_number].push(ps)
    }

    // All known panel names (for the column header in admin view)
    const allPanelsSet = new Set()
    ;(panelAssignmentsRes.data || []).forEach(a => { if (a.panel_name) allPanelsSet.add(a.panel_name) })
    panelScores.forEach(p => { if (p.panel_name) allPanelsSet.add(p.panel_name) })
    const allPanels = Array.from(allPanelsSet).sort()

    const EVENT_DAYS = 7
    const CERTS_PER_STUDENT = 4
    const TOTAL_STAGES = 7
    const MAX_REVIEW = 60
    const MAX_MENTOR = 20
    const MAX_STAGES = 8
    const MAX_ATT = 6
    const MAX_CERTS = 4
    const MAX_PPT = 2
    const MAX_PANEL = 50
    const MAX_GRAND = 150

    const result = teams.map(t => {
      const members = membersByTeam[t.team_number] || []
      const memberCount = members.length || 1

      // ── Auto-score /100 ──
      // Try dev API first; if missing, fall back to manual AI scores table
      let reviewScore = reviewScoreByTeam[t.team_number]
      let reviewSource = 'dev_api'
      if (reviewScore == null) {
        const manualHit = lookupManualScore(t.project_title, null)
        if (manualHit) {
          reviewScore = manualHit.score
          reviewSource = 'manual'
        }
      }
      const reviewPoints = reviewScore != null ? round1((reviewScore / 100) * MAX_REVIEW) : 0

      const mentorEvalScore = mentorEvalByTeam[t.team_number]
      const mentorEvalPoints = mentorEvalScore != null ? round1((mentorEvalScore / 10) * MAX_MENTOR) : 0

      const stagesApproved = stagesApprovedByTeam[t.team_number] || 0
      const stagePoints = round1((stagesApproved / TOTAL_STAGES) * MAX_STAGES)

      const teamModesHit = members.reduce((sum, r) => sum + (modesHitByRoll[r.toUpperCase()] || 0), 0)
      const maxModes = memberCount * EVENT_DAYS * 4
      const attPct = maxModes > 0 ? (teamModesHit / maxModes) : 0
      const attendancePoints = round1(attPct * MAX_ATT)

      const certsUploaded = certsByTeam[t.team_number] || 0
      const certsExpected = memberCount * CERTS_PER_STUDENT
      const certsPct = certsExpected > 0 ? (certsUploaded / certsExpected) : 0
      const certPoints = round1(certsPct * MAX_CERTS)

      const pptPoints = pptByTeam[t.team_number] ? MAX_PPT : 0

      const autoScore = round1(
        safe(reviewPoints) + safe(mentorEvalPoints) + safe(stagePoints) +
        safe(attendancePoints) + safe(certPoints) + safe(pptPoints)
      )

      // ── Panel scoring (average of all panels' totals) ──
      const teamPanels = panelByTeam[t.team_number] || []
      const panelBreakdown = teamPanels.map(p => ({
        panel_name: p.panel_name,
        mentor_name: p.mentor_name,
        mentor_email: p.mentor_email,
        scores: {
          project_idea: Number(p.score_project_idea),
          ai_usage: Number(p.score_ai_usage),
          presentation: Number(p.score_presentation),
          technical: Number(p.score_technical),
          qa_defense: Number(p.score_qa_defense),
        },
        total: Number(p.total_score),
        updated_at: p.updated_at,
      }))

      const panelCount = panelBreakdown.length
      const panelSum = panelBreakdown.reduce((s, p) => s + p.total, 0)
      const panelAvg = panelCount > 0 ? round1(panelSum / panelCount) : 0  // /50

      // ── Grand total /150 ──
      const grandTotal = round1(safe(autoScore) + safe(panelAvg))

      return {
        team_number: t.team_number,
        project_title: t.project_title || '—',
        technology: t.technology || '—',
        batch: t.batch || '—',
        mentor: t.mentor_assigned || '—',
        member_count: memberCount,

        // Auto-score subscores
        review_points: safe(reviewPoints),
        review_source: reviewSource,
        mentor_eval_points: safe(mentorEvalPoints),
        stage_points: safe(stagePoints),
        attendance_points: safe(attendancePoints),
        cert_points: safe(certPoints),
        ppt_points: safe(pptPoints),
        auto_score: safe(autoScore),  // /100

        // Panel data
        panel_count: panelCount,
        panel_breakdown: panelBreakdown,
        panel_avg: safe(panelAvg),  // /50

        // Grand total
        grand_total: safe(grandTotal),  // /150
      }
    })

    // Rank by grand_total descending
    result.sort((a, b) => b.grand_total - a.grand_total)
    result.forEach((r, idx) => { r.rank = idx + 1 })

    const summary = {
      total_teams: result.length,
      total_panels: allPanels.length,
      max_total: MAX_GRAND,
      max_auto: 100,
      max_panel: MAX_PANEL,
      teams_with_panel_scores: result.filter(r => r.panel_count > 0).length,
      avg_panel: round1(result.filter(r => r.panel_count > 0).reduce((s, r) => s + r.panel_avg, 0) / Math.max(result.filter(r => r.panel_count > 0).length, 1)),
      avg_grand: round1(result.reduce((s, r) => s + r.grand_total, 0) / Math.max(result.length, 1)),
    }

    return Response.json({ ok: true, teams: result, summary, allPanels })
  } catch (err) {
    console.error('[project-leaders] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}