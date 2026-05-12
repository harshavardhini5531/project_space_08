// app/api/mentor/panel-view/route.js
//
// Mentor Panel View endpoint — read-only rich detail for finalist teams.
// AI scores: dev API first, falls back to MANUAL_AI_SCORES lookup by normalized title.

import { supabase } from '@/lib/supabase'

const FINALIST_TEAMS = ['PS-002', 'PS-007', 'PS-008', 'PS-012', 'PS-014', 'PS-016', 'PS-018', 'PS-022', 'PS-024', 'PS-027', 'PS-028', 'PS-032', 'PS-033', 'PS-034', 'PS-035', 'PS-036', 'PS-039', 'PS-040', 'PS-045', 'PS-047', 'PS-048', 'PS-050', 'PS-052', 'PS-055', 'PS-057', 'PS-061', 'PS-065', 'PS-079', 'PS-081', 'PS-089', 'PS-099', 'PS-103', 'PS-107', 'PS-109', 'PS-112', 'PS-113', 'PS-115', 'PS-119', 'PS-120', 'PS-130', 'PS-131', 'PS-132', 'PS-133', 'PS-134', 'PS-135', 'PS-139', 'PS-142', 'PS-144', 'PS-147', 'PS-149', 'PS-154']

// ─────────────────────────────────────────────────────────────────
// MANUAL AI SCORES — fallback when dev API has no score
// Keyed by normalized title (lowercase, ASCII-only, single spaces, no quotes)
// If duplicate titles existed, the HIGHEST score was kept.
// ─────────────────────────────────────────────────────────────────
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

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 25000

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
    console.error('[panel-view] dev API fetch failed:', e.message)
    return devCache.data || []
  }
}

function computeOverallScore(latestScore) {
  if (!latestScore || typeof latestScore !== 'object') return null
  const vals = Object.values(latestScore).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

async function verifyPanelMentor(mentorEmail) {
  if (!mentorEmail) return { ok: false, error: 'mentorEmail required', status: 400 }
  const email = String(mentorEmail).toLowerCase().trim()

  const { data: mentor } = await supabase
    .from('mentors')
    .select('id, name, email, technology, is_active')
    .eq('email', email)
    .maybeSingle()
  if (!mentor) return { ok: false, error: 'Mentor not found', status: 401 }
  if (mentor.is_active === false) return { ok: false, error: 'Mentor inactive', status: 403 }

  const { data: assignment } = await supabase
    .from('panel_assignments')
    .select('id, panel_name, is_active')
    .eq('mentor_email', email)
    .maybeSingle()
  if (!assignment || assignment.is_active === false) {
    return { ok: false, error: 'You are not assigned to a panel. Contact admin.', status: 403 }
  }

  return { ok: true, mentor, panel: assignment }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mentorEmail = searchParams.get('mentorEmail')

    const verify = await verifyPanelMentor(mentorEmail)
    if (!verify.ok) return Response.json({ ok: false, error: verify.error }, { status: verify.status })

    const { mentor, panel } = verify

    const [
      teamsRes, submissionsRes, membersRes,
      stagesRes, mentorEvalsRes, certsRes, pptsRes,
      attendanceRes, reviewSubsRes, panelScoresRes, devProjects,
    ] = await Promise.all([
      supabase.from('teams').select('team_number, project_title, technology, batch, mentor_assigned, leader_roll').in('team_number', FINALIST_TEAMS),
      supabase.from('project_review_submissions').select('*').in('team_number', FINALIST_TEAMS),
      supabase.from('team_members').select('team_number, roll_number, short_name, is_leader').in('team_number', FINALIST_TEAMS),
      supabase.from('milestone_submissions').select('team_number, stage_number, status, mentor_comment, submitted_at, reviewed_at, reviewed_by_name, credits_earned').in('team_number', FINALIST_TEAMS),
      supabase.from('mentor_evaluations').select('*').in('team_number', FINALIST_TEAMS),
      supabase.from('team_certificates').select('team_number, roll_number, cert_type').in('team_number', FINALIST_TEAMS),
      supabase.from('team_ppts').select('team_number, file_name, storage_path, uploaded_at, uploaded_by_name').in('team_number', FINALIST_TEAMS),
      supabase.from('attendance_logs').select('roll_number, punch_date, punch_mode'),
      supabase.from('project_review_submissions').select('team_number, dev_api_id').in('team_number', FINALIST_TEAMS),
      supabase.from('panel_scores').select('team_number, mentor_email, total_score'),
      fetchDevProjects(),
    ])

    const teams = teamsRes.data || []
    if (teams.length === 0) {
      return Response.json({
        ok: true,
        mentor: { name: mentor.name, technology: mentor.technology },
        panel: { name: panel.panel_name },
        teams: [],
        summary: { total_finalists: 0 },
      })
    }

    const submissionsByTeam = {}
    ;(submissionsRes.data || []).forEach(s => { submissionsByTeam[s.team_number] = s })

    const membersByTeam = {}
    ;(membersRes.data || []).forEach(m => {
      if (!membersByTeam[m.team_number]) membersByTeam[m.team_number] = []
      membersByTeam[m.team_number].push(m)
    })

    const stagesByTeam = {}
    ;(stagesRes.data || []).forEach(s => {
      if (!stagesByTeam[s.team_number]) stagesByTeam[s.team_number] = []
      stagesByTeam[s.team_number].push(s)
    })

    const mentorEvalByTeam = {}
    ;(mentorEvalsRes.data || []).forEach(e => { mentorEvalByTeam[e.team_number] = e })

    const certsByTeamRoll = {}
    ;(certsRes.data || []).forEach(c => {
      if (!certsByTeamRoll[c.team_number]) certsByTeamRoll[c.team_number] = {}
      if (!certsByTeamRoll[c.team_number][c.roll_number]) certsByTeamRoll[c.team_number][c.roll_number] = new Set()
      certsByTeamRoll[c.team_number][c.roll_number].add(c.cert_type)
    })

    const pptByTeam = {}
    ;(pptsRes.data || []).forEach(p => { pptByTeam[p.team_number] = p })

    const devById = {}
    ;(devProjects || []).forEach(p => { devById[p._id] = p })

    const devApiIdByTeam = {}
    ;(reviewSubsRes.data || []).forEach(s => {
      if (s.dev_api_id) devApiIdByTeam[s.team_number] = s.dev_api_id
    })

    const rollsToTrack = new Set()
    Object.values(membersByTeam).forEach(arr => arr.forEach(m => rollsToTrack.add(m.roll_number.toUpperCase())))

    const modesByRollDate = {}
    ;(attendanceRes.data || []).forEach(a => {
      if (!a.roll_number || !a.punch_date || !a.punch_mode) return
      const r = a.roll_number.toUpperCase()
      if (!rollsToTrack.has(r)) return
      if (!modesByRollDate[r]) modesByRollDate[r] = {}
      if (!modesByRollDate[r][a.punch_date]) modesByRollDate[r][a.punch_date] = new Set()
      modesByRollDate[r][a.punch_date].add(a.punch_mode)
    })

    const modesHitByRoll = {}
    for (const roll of Object.keys(modesByRollDate)) {
      let total = 0
      for (const date of Object.keys(modesByRollDate[roll])) total += modesByRollDate[roll][date].size
      modesHitByRoll[roll] = total
    }

    const panelStatsByTeam = {}
    ;(panelScoresRes.data || []).forEach(ps => {
      if (!panelStatsByTeam[ps.team_number]) panelStatsByTeam[ps.team_number] = { count: 0, total: 0 }
      panelStatsByTeam[ps.team_number].count += 1
      panelStatsByTeam[ps.team_number].total += Number(ps.total_score)
    })

    const myScoredTeams = new Set()
    ;(panelScoresRes.data || [])
      .filter(ps => ps.mentor_email === mentor.email.toLowerCase())
      .forEach(ps => myScoredTeams.add(ps.team_number))

    const EVENT_DAYS = 7
    const CERTS_PER_STUDENT = 4

    const result = teams.map(t => {
      const submission = submissionsByTeam[t.team_number] || {}
      const members = membersByTeam[t.team_number] || []
      const memberCount = members.length || 1
      const leader = members.find(m => m.is_leader) || members[0]

      const stages = stagesByTeam[t.team_number] || []
      const stageMap = {}
      for (let i = 1; i <= 7; i++) stageMap[i] = null
      stages.forEach(s => {
        if (s.stage_number >= 1 && s.stage_number <= 7) stageMap[s.stage_number] = s
      })
      const stagesCompleted = stages.filter(s => s.status === 'completed').length

      // AI review: dev API first, then manual fallback
      const devApiId = devApiIdByTeam[t.team_number]
      const devProj = devApiId ? devById[devApiId] : null
      let aiScore = devProj ? computeOverallScore(devProj.latestScore) : null
      let aiDimensions = devProj?.latestScore || null
      let aiFeedback = devProj?.latestReview || null
      let aiSource = aiScore != null ? 'dev_api' : null

      if (aiScore == null) {
        const manual = lookupManualScore(t.project_title, submission.name)
        if (manual) {
          aiScore = manual.score
          aiDimensions = manual.dims
          aiFeedback = null
          aiSource = 'manual'
        }
      }

      const mentorEval = mentorEvalByTeam[t.team_number] || null

      const teamMembersAttendance = members.map(m => {
        const roll = m.roll_number.toUpperCase()
        const modes = modesHitByRoll[roll] || 0
        const maxModes = EVENT_DAYS * 4
        return {
          roll: m.roll_number,
          short_name: m.short_name,
          is_leader: m.is_leader,
          modes_hit: modes,
          max_modes: maxModes,
          pct: maxModes > 0 ? Math.round((modes / maxModes) * 100) : 0,
        }
      })
      const teamTotalModes = teamMembersAttendance.reduce((s, m) => s + m.modes_hit, 0)
      const teamMaxModes = memberCount * EVENT_DAYS * 4

      const teamMembersCerts = members.map(m => {
        const types = certsByTeamRoll[t.team_number]?.[m.roll_number] || new Set()
        return {
          roll: m.roll_number,
          short_name: m.short_name,
          uploaded: types.size,
          max: CERTS_PER_STUDENT,
          types: Array.from(types),
        }
      })
      const totalCerts = teamMembersCerts.reduce((s, c) => s + c.uploaded, 0)
      const maxCerts = memberCount * CERTS_PER_STUDENT

      const panelStats = panelStatsByTeam[t.team_number] || { count: 0, total: 0 }
      const panelAvg = panelStats.count > 0 ? Math.round((panelStats.total / panelStats.count) * 10) / 10 : null

      const ppt = pptByTeam[t.team_number]

      return {
        team_number: t.team_number,
        project_title: t.project_title || '—',
        technology: t.technology || '—',
        batch: t.batch || '—',
        mentor: t.mentor_assigned || '—',
        leader: leader ? { roll: leader.roll_number, short_name: leader.short_name } : null,
        members: members.map(m => ({ roll: m.roll_number, short_name: m.short_name, is_leader: m.is_leader })),
        member_count: memberCount,

        documentation: {
          name: submission.name || t.project_title,
          description: submission.description || null,
          problem_statement: submission.problem_statement || null,
          proposed_solution: submission.proposed_solution || null,
          requirements: submission.requirements || null,
          technologies_used: submission.technologies_used || null,
          system_architecture: submission.system_architecture || null,
          in_scope: submission.in_scope || null,
          out_scope: submission.out_scope || null,
          future_enhancements: submission.future_enhancements || null,
          conclusion: submission.conclusion || null,
          github_url: submission.github_url || null,
          submitted_at: submission.submitted_at || null,
        },

        ai_review: {
          score: aiScore,
          dimensions: aiDimensions,
          feedback: aiFeedback,
          has_data: aiScore != null,
          source: aiSource,
          status: submission.status || null,
        },

        mentor_evaluation: mentorEval ? {
          mentor_name: mentorEval.mentor_name,
          average: Number(mentorEval.average_score),
          innovation: Number(mentorEval.innovation_score),
          technical: Number(mentorEval.technical_score),
          uiux: Number(mentorEval.uiux_score),
          relevance: Number(mentorEval.relevance_score),
          demo: Number(mentorEval.demo_score),
          documentation: Number(mentorEval.documentation_score),
          comments: mentorEval.comments || null,
          updated_at: mentorEval.updated_at,
        } : null,

        stages: Object.entries(stageMap).map(([num, s]) => ({
          stage_number: Number(num),
          status: s?.status || 'not_started',
          mentor_comment: s?.mentor_comment || null,
          submitted_at: s?.submitted_at || null,
          reviewed_at: s?.reviewed_at || null,
          reviewed_by: s?.reviewed_by_name || null,
          credits_earned: s?.credits_earned || 0,
        })),
        stages_completed: stagesCompleted,
        stages_total: 7,

        attendance: {
          members: teamMembersAttendance,
          total_modes: teamTotalModes,
          max_modes: teamMaxModes,
          pct: teamMaxModes > 0 ? Math.round((teamTotalModes / teamMaxModes) * 100) : 0,
        },

        certificates: {
          members: teamMembersCerts,
          total: totalCerts,
          max: maxCerts,
          pct: maxCerts > 0 ? Math.round((totalCerts / maxCerts) * 100) : 0,
        },

        ppt: ppt ? {
          file_name: ppt.file_name,
          storage_path: ppt.storage_path,
          public_url: ppt.storage_path ? `https://yiwyfhdzgvlsmdeshdgv.supabase.co/storage/v1/object/public/team-uploads/${ppt.storage_path}` : null,
          uploaded_at: ppt.uploaded_at,
          uploaded_by: ppt.uploaded_by_name,
        } : null,

        panel_stats: {
          mentor_count: panelStats.count,
          avg_score: panelAvg,
          i_scored: myScoredTeams.has(t.team_number),
        },
      }
    })

    result.sort((a, b) => a.team_number.localeCompare(b.team_number))

    const summary = {
      total_finalists: result.length,
      with_ai_score: result.filter(r => r.ai_review.score != null).length,
      with_ai_score_dev: result.filter(r => r.ai_review.source === 'dev_api').length,
      with_ai_score_manual: result.filter(r => r.ai_review.source === 'manual').length,
      with_mentor_eval: result.filter(r => r.mentor_evaluation).length,
      with_ppt: result.filter(r => r.ppt).length,
      i_scored: result.filter(r => r.panel_stats.i_scored).length,
    }

    return Response.json({
      ok: true,
      mentor: { name: mentor.name, technology: mentor.technology, email: mentor.email },
      panel: { name: panel.panel_name },
      teams: result,
      summary,
    })
  } catch (err) {
    console.error('[mentor/panel-view] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}