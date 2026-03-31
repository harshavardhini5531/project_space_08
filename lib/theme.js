// ============================================================
// PROJECT SPACE — UNIVERSAL THEME
// Import this in any page/component:
// import { colors, fonts, fontLinks } from '@/lib/theme'
// ============================================================

export const colors = {
  // Backgrounds
  bg:            '#050008',
  bgCard:        'rgba(15,10,20,0.85)',
  bgInput:       'rgba(255,255,255,0.05)',
  bgInputFocus:  'rgba(255,255,255,0.07)',
  bgHover:       'rgba(255,255,255,0.04)',

  // Primary — Red/Orange
  primary:       '#ff2800',
  primaryLight:  '#ff5535',
  primaryGlow:   'rgba(255,40,0,0.4)',
  primaryFaint:  'rgba(255,40,0,0.08)',

  // Accent — Orange
  accent:        '#ff7a00',
  accentLight:   '#ffaa45',

  // Borders
  border:        'rgba(255,255,255,0.09)',
  borderFocus:   'rgba(255,40,0,0.5)',
  borderAccent:  'rgba(255,40,0,0.2)',

  // Text
  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted:     'rgba(255,255,255,0.35)',
  textFaint:     'rgba(255,255,255,0.22)',

  // Status
  success:       '#4ade80',
  successBg:     'rgba(74,222,128,0.12)',
  successBorder: 'rgba(74,222,128,0.25)',
  warning:       '#facc15',
  warningBg:     'rgba(250,204,21,0.1)',
  error:         '#ff6040',
  errorBg:       'rgba(255,40,0,0.1)',
  errorBorder:   'rgba(255,40,0,0.25)',

  // Gradients (use in style strings)
  gradientPrimary:  'linear-gradient(135deg, #ff2800, #ff5535)',
  gradientAccent:   'linear-gradient(135deg, #ff7a20, #ffaa45)',
  gradientTitle:    'linear-gradient(90deg, #ffffff, #ff9ffc, #b19eef, #ff6040)',
}

export const fonts = {
  display: "'Orbitron', sans-serif",   // Titles, logo, brand
  body:    "'Poppins', sans-serif",    // All body text, inputs, buttons
}

export const fontLinks = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@300;400;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
`

// Use this string inside any <style> block at top of page
export const globalStyles = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: ${colors.bg}; overflow: hidden; }
  body { font-family: ${fonts.body}; color: ${colors.textPrimary}; }

  /* Scrollable pages override */
  .scrollable { overflow-y: auto !important; }
  .scrollable::-webkit-scrollbar { width: 4px; }
  .scrollable::-webkit-scrollbar-track { background: transparent; }
  .scrollable::-webkit-scrollbar-thumb { background: rgba(255,40,0,0.3); border-radius: 4px; }

  /* Reusable card */
  .ps-card {
    background: ${colors.bgCard};
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid ${colors.border};
    border-radius: 20px;
  }

  /* Reusable input */
  .ps-input {
    width: 100%;
    padding: 13px 16px;
    background: ${colors.bgInput};
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    font-family: ${fonts.body};
    font-size: 0.88rem;
    color: ${colors.textPrimary};
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .ps-input::placeholder { color: ${colors.textFaint}; }
  .ps-input:focus {
    border-color: ${colors.borderFocus};
    background: ${colors.bgInputFocus};
  }

  /* Reusable primary button */
  .ps-btn-primary {
    width: 100%;
    padding: 14px;
    background: ${colors.gradientPrimary};
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: ${fonts.body};
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 0 24px ${colors.primaryGlow};
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .ps-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 0 40px rgba(255,40,0,0.55);
  }
  .ps-btn-primary:active:not(:disabled) { transform: scale(0.97); }
  .ps-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Reusable ghost button */
  .ps-btn-ghost {
    padding: 13px 22px;
    background: rgba(255,255,255,0.07);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    font-family: ${fonts.body};
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.15s, background 0.15s, border-color 0.15s;
    backdrop-filter: blur(8px);
  }
  .ps-btn-ghost:hover {
    transform: translateY(-2px);
    background: rgba(255,255,255,0.11);
    border-color: rgba(255,255,255,0.28);
  }

  /* Field label */
  .ps-label {
    display: block;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 7px;
  }

  /* Error message */
  .ps-error {
    background: ${colors.errorBg};
    border: 1px solid ${colors.errorBorder};
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.78rem;
    color: ${colors.error};
    margin-bottom: 14px;
    animation: psShake 0.3s ease;
  }

  /* Success message */
  .ps-success {
    background: ${colors.successBg};
    border: 1px solid ${colors.successBorder};
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.78rem;
    color: ${colors.success};
    margin-bottom: 14px;
  }

  /* Info box */
  .ps-info {
    background: ${colors.primaryFaint};
    border: 1px solid ${colors.borderAccent};
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.65);
    margin-bottom: 16px;
  }
  .ps-info strong { color: ${colors.error}; }

  /* PS Logo badge */
  .ps-logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: ${colors.gradientPrimary};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${fonts.display};
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    box-shadow: 0 0 24px ${colors.primaryGlow};
    flex-shrink: 0;
  }

  /* Back button */
  .ps-back {
    position: fixed;
    top: 28px;
    left: 28px;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 7px;
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: ${fonts.body};
    transition: color 0.2s;
    padding: 8px 4px;
  }
  .ps-back:hover { color: #fff; }

  /* Notification toast */
  .ps-toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 0.82rem;
    font-family: ${fonts.body};
    white-space: nowrap;
    animation: psSlideDown 0.3s ease;
  }
  .ps-toast.success {
    background: ${colors.successBg};
    border: 1px solid ${colors.successBorder};
    color: ${colors.success};
  }
  .ps-toast.warning {
    background: ${colors.errorBg};
    border: 1px solid ${colors.errorBorder};
    color: ${colors.error};
  }
  .ps-toast.info {
    background: rgba(177,158,239,0.12);
    border: 1px solid rgba(177,158,239,0.25);
    color: #b19eef;
  }

  /* Step indicators */
  .ps-steps { display: flex; align-items: center; justify-content: center; margin-bottom: 28px; }
  .ps-step-dot {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600;
    transition: all 0.3s;
  }
  .ps-step-dot.active { background: ${colors.primary}; color: #fff; box-shadow: 0 0 14px ${colors.primaryGlow}; }
  .ps-step-dot.done   { background: rgba(255,40,0,0.2); color: ${colors.error}; }
  .ps-step-dot.pending{ background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.25); }
  .ps-step-line { width: 40px; height: 1px; background: rgba(255,255,255,0.1); }
  .ps-step-line.done  { background: rgba(255,96,64,0.35); }

  /* Divider */
  .ps-divider {
    display: flex; align-items: center; gap: 12px;
    color: rgba(255,255,255,0.2); font-size: 0.72rem;
    margin: 18px 0;
  }
  .ps-divider::before, .ps-divider::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255,255,255,0.08);
  }

  /* Animations */
  @keyframes psShake {
    0%,100% { transform: translateX(0); }
    25%      { transform: translateX(-5px); }
    75%      { transform: translateX(5px); }
  }
  @keyframes psSlideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes psFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes psCardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes psNeonPulse {
    0%,100% { text-shadow: 0 0 30px rgba(255,40,0,0.7), 0 0 60px rgba(255,40,0,0.4); }
    50%     { text-shadow: 0 0 40px rgba(255,40,0,0.9), 0 0 80px rgba(255,40,0,0.6); }
  }
  @keyframes psBlink {
    0%,100% { opacity: 1; }
    50%     { opacity: 0.2; }
  }
`

// Hackathon countdown target
export const HACKATHON_START = '2026-05-06T09:00:00'
export const HACKATHON_END   = '2026-05-12T18:00:00'

// Technology list
export const TECHNOLOGIES = [
  'Data Specialist',
  'AWS Development',
  'Full Stack',
  'Google Flutter',
  'ServiceNow',
  'VLSI',
]

// Project area options per technology
export const PROJECT_AREAS = {
  'Data Specialist':  ['Dashboard & Analytics', 'Machine Learning', 'Data Pipeline', 'Microsoft Power Platform', 'Business Intelligence', 'NLP / AI'],
  'AWS Development':  ['Cloud Infrastructure', 'Serverless Application', 'DevOps & CI/CD', 'Cloud Security', 'Microservices', 'Cloud-Native App'],
  'Full Stack':       ['Web Application', 'REST API', 'E-Commerce Platform', 'Admin Panel', 'SaaS Product', 'Portfolio / CMS'],
  'Google Flutter':   ['Mobile App (Android)', 'Mobile App (iOS)', 'Cross-Platform App', 'Flutter Web', 'IoT Dashboard'],
  'ServiceNow':       ['ITSM Workflow', 'Service Portal', 'HR Service Delivery', 'Custom Scoped App', 'Integration Hub'],
  'VLSI':             ['RTL Design', 'FPGA Implementation', 'Physical Design', 'Verification & Testing', 'Low Power Design'],
}

// Tech stack options — all technologies combined (shown to every team)
export const TECH_STACK_OPTIONS = [
  'React Native', 'React.js', 'Node.js', 'Express.js', 'MongoDB',
  'Flutter', 'Dart', 'Firebase', 'Firestore', 'Provider',
  'Verilog', 'SystemVerilog', 'VHDL', 'Cadence Virtuoso', 'Xilinx Vivado',
  'ServiceNow Platform', 'Flow Designer', 'REST API', 'Service Portal', 'Glide API',
  'Power Apps', 'Power Automate', 'Power BI', 'Dataverse', 'Power Fx',
  'AWS Lambda', 'EC2', 'S3', 'DynamoDB', 'API Gateway',
  'Python', 'JavaScript', 'TypeScript', 'SQL', 'Next.js',
  'PostgreSQL', 'Supabase', 'Docker', 'Tailwind CSS', 'GraphQL',
]

// AI tools options
export const AI_TOOLS = [
  'ChatGPT', 'GitHub Copilot', 'Gemini', 'Claude', 'Perplexity',
  'Cursor', 'Tabnine', 'Midjourney', 'Stable Diffusion',
  'Hugging Face', 'LangChain', 'AutoGPT', 'Copilot Studio',
  'Azure OpenAI', 'AWS Bedrock', 'Google Vertex AI',
]