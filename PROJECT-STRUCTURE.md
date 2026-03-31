project-space/
│
├── 📁 app/                          # Next.js App Router (Frontend + Backend)
│   │
│   ├── 📁 api/                      # ══════ BACKEND API ROUTES ══════
│   │   └── 📁 auth/                 # All authentication & data APIs
│   │       ├── 📁 area-counts/      # GET  - Project area selection counts
│   │       │   └── route.js
│   │       ├── 📁 chat/             # POST - SpaceBot Claude AI chat
│   │       │   └── route.js
│   │       ├── 📁 login/            # POST - Leader & member login
│   │       │   └── route.js
│   │       ├── 📁 maya-coding/      # POST - Maya coding data (external API)
│   │       │   └── route.js
│   │       ├── 📁 mentor-action/    # POST - Mentor accept/comment actions
│   │       │   └── route.js
│   │       ├── 📁 mentor-request/   # POST - Submit mentor request
│   │       │   └── route.js
│   │       ├── 📁 notify-team/      # POST - Send registration emails to team
│   │       │   └── route.js
│   │       ├── 📁 register-team/    # POST - Register team (sets registered=true)
│   │       │   └── route.js
│   │       ├── 📁 send-otp/         # POST - Send OTP to student email
│   │       │   └── route.js
│   │       ├── 📁 set-password/     # POST - Create account password
│   │       │   └── route.js
│   │       ├── 📁 student-profile/  # POST - Fetch student profile from Supabase
│   │       │   └── route.js
│   │       ├── 📁 team-data/        # POST - Get team info + members
│   │       │   └── route.js
│   │       ├── 📁 verify-otp/       # POST - Verify OTP code
│   │       │   └── route.js
│   │       └── 📁 video-ratings/    # POST - Fetch video ratings from MongoDB
│   │           └── route.js
│   │
│   ├── 📁 auth/                     # ══════ AUTH PAGES (Frontend) ══════
│   │   ├── 📁 leader-login/         # Leader-only login (after registration)
│   │   │   └── page.js
│   │   ├── 📁 login/                # Role selection → Leader/Member login
│   │   │   └── page.js
│   │   ├── 📁 member-login/         # Member login (OTP → password)
│   │   │   └── page.js
│   │   └── 📁 register/             # Team leader account creation
│   │       └── page.js
│   │
│   ├── 📁 dashboard/                # ══════ DASHBOARD PAGES (Frontend) ══════
│   │   ├── page.js                  # Main dashboard (My Profile, Team, etc.)
│   │   └── 📁 register-team/        # Team registration form (5-step stepper)
│   │       └── page.js
│   │
│   ├── 📁 mentor-panel/             # ══════ MENTOR PAGES ══════
│   │   └── 📁 [requestId]/          # Mentor action page (dynamic route)
│   │       └── page.js
│   │
│   ├── 📁 mentor-request/           # ══════ MENTOR REQUEST PAGES ══════
│   │   └── 📁 [teamNumber]/         # Team's mentor request page
│   │       └── page.js
│   │
│   ├── layout.js                    # Root layout
│   ├── page.js                      # Landing page (Three.js sphere, aurora)
│   └── globals.css                  # Global styles
│
├── 📁 components/                   # ══════ REUSABLE UI COMPONENTS ══════
│   ├── AuthBackground.js            # Auth pages background (sphere, stars)
│   ├── FloatingField.js             # Animated floating label input/textarea
│   ├── MultiDropdown.js             # Multi-select dropdown with counts
│   └── SpaceBot.js                  # AI chatbot panel (Claude API)
│
├── 📁 lib/                          # ══════ SHARED UTILITIES ══════
│   ├── mailer.js                    # Gmail Nodemailer (OTP emails)
│   ├── rate-limit.js                # Rate limiting for API routes
│   ├── session.js                   # Client-side session (24hr expiry)
│   ├── supabase.js                  # Supabase client instance
│   └── theme.js                     # Colors, fonts, CSS, tech stack options
│
├── 📁 public/                       # ══════ STATIC ASSETS ══════
│   └── 📁 fonts/                    # Custom fonts (DM Sans, Astro Futuristic)
│
├── 📁 scripts/                      # ══════ DATA SCRIPTS (run manually) ══════
│   ├── fetch-maya-data.js           # Fetch Maya coding data → Supabase
│   ├── upload-profiles.js           # Upload student profiles → Supabase
│   └── student-profiles-data.json   # 680 student profile records
│
├── .env.local                       # Environment variables
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
└── package-lock.json


# ══════════════════════════════════════════════════════
#  EXTERNAL SERVICES & DATABASES
# ══════════════════════════════════════════════════════
#
#  Supabase (PostgreSQL):
#    ├── students              - Master student data (roll, name, email, etc.)
#    ├── teams                 - Team info (project, registration status)
#    ├── team_members          - Roll → team mapping, is_leader flag
#    ├── user_passwords        - Hashed passwords for login
#    ├── otp_codes             - Temporary OTP codes
#    ├── student_profiles      - Detailed profiles (680 students + maya data)
#    ├── mentor_requests       - Mentor request tickets
#    ├── mentor_request_logs   - Request action logs
#    ├── mentor_comments       - Mentor comments on requests
#    └── technology_images     - Track images
#
#  MongoDB (Video Portal):
#    └── video_portal.students - Self-intro video AI ratings
#         ├── ai_full_report   (Gemini)
#         ├── openai_report    (ChatGPT)
#         ├── anthropic_report (Claude)
#         └── mentor_score     (Mentor)
#
#  External APIs:
#    ├── node.technicalhub.io:4001/api/get-students-data-by-acet  (Maya coding)
#    ├── node.technicalhub.io:4001/api/get-students-data-by-aec   (Maya coding)
#    └── api.anthropic.com (Claude API for SpaceBot)
#
# ══════════════════════════════════════════════════════
