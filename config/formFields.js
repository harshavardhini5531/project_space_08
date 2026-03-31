export var EVENT_CONFIG = {
  eventName: "Project Space",
  eventDates: "May 6–12, 2026",
  targetDate: "2026-05-06T00:00:00"
}

/* Project Area — friendly labels mapped to canonical technology names */
export var PROJECT_AREAS = [
  { label: "App Development", value: "Google Flutter", desc: "Mobile & cross-platform apps" },
  { label: "Web Development", value: "Full Stack", desc: "Full stack web applications" },
  { label: "Cloud Solutions", value: "AWS Development", desc: "AWS cloud-based projects" },
  { label: "Business Automation", value: "ServiceNow", desc: "Enterprise workflow automation" },
  { label: "Data & Analytics", value: "Data Specialist", desc: "Data dashboards & analytics" },
  { label: "Hardware & Embedded", value: "VLSI", desc: "VLSI & embedded systems" }
]

/* Tech stack options per technology */
export var TECH_STACK_OPTIONS = {
  "Google Flutter": [
    "Flutter", "Dart", "Firebase", "Android Studio", "Xcode",
    "Google Maps API", "REST API", "SQLite", "Hive", "Provider",
    "Riverpod", "GetX", "Bloc"
  ],
  "Full Stack": [
    "HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js",
    "Angular", "Vue.js", "Node.js", "Express.js", "Python", "Django",
    "Flask", "PHP", "Laravel", "MongoDB", "PostgreSQL", "MySQL",
    "Redis", "GraphQL", "REST API", "Tailwind CSS", "Bootstrap",
    "Power Apps", "Power Automate", "Power BI", "SharePoint",
    "Copilot Studio", "Dataverse"
  ],
  "AWS Development": [
    "AWS Lambda", "AWS S3", "AWS EC2", "AWS DynamoDB", "AWS RDS",
    "AWS API Gateway", "AWS CloudFront", "AWS SQS", "AWS SNS",
    "AWS Cognito", "AWS Amplify", "AWS SageMaker", "AWS Bedrock",
    "AWS Step Functions", "AWS ECS", "Terraform", "Docker",
    "Python", "Node.js", "React"
  ],
  "ServiceNow": [
    "ServiceNow Platform", "ServiceNow ITSM", "ServiceNow ITOM",
    "ServiceNow CSM", "ServiceNow HRSD", "Flow Designer",
    "IntegrationHub", "Service Portal", "UI Builder",
    "Scripted REST API", "GlideRecord", "Business Rules",
    "Client Scripts", "JavaScript", "AngularJS"
  ],
  "Data Specialist": [
    "Python", "Pandas", "NumPy", "Matplotlib", "Seaborn",
    "Scikit-learn", "TensorFlow", "PyTorch", "Jupyter Notebook",
    "Power BI", "Tableau", "SQL", "MongoDB", "Apache Spark",
    "Hadoop", "R", "Excel VBA", "Google Sheets API",
    "Streamlit", "Dash"
  ],
  "VLSI": [
    "Verilog", "VHDL", "SystemVerilog", "Xilinx Vivado",
    "Cadence Virtuoso", "Synopsys Design Compiler", "ModelSim",
    "MATLAB", "Simulink", "Arduino", "Raspberry Pi", "ESP32",
    "FPGA", "ASIC Design", "PCB Design", "KiCad", "Altium",
    "Embedded C", "Python", "LabVIEW"
  ]
}

/* AI Tools options */
export var AI_TOOLS_OPTIONS = [
  "ChatGPT", "GitHub Copilot", "Claude AI", "Google Gemini",
  "Midjourney", "DALL-E", "Stable Diffusion",
  "AWS Bedrock", "AWS SageMaker", "Google Vertex AI",
  "Hugging Face", "LangChain", "OpenAI API",
  "Copilot Studio", "AI Builder", "Azure OpenAI",
  "TensorFlow", "PyTorch", "Scikit-learn",
  "Google Colab", "Jupyter AI", "Cursor AI",
  "Perplexity AI", "Notion AI", "Figma AI",
  "v0 by Vercel", "Replit AI", "Tabnine"
]

/* AI Capabilities options */
export var AI_CAPABILITIES = [
  "Natural Language Processing",
  "Image Recognition / Computer Vision",
  "Text Generation / Content Creation",
  "Chatbot / Conversational AI",
  "Data Analysis & Prediction",
  "Code Generation / Assistance",
  "Speech Recognition / Text-to-Speech",
  "Recommendation System",
  "Anomaly Detection",
  "Document Processing / OCR",
  "Sentiment Analysis",
  "Workflow Automation with AI",
  "AI-Powered Search",
  "No AI Used"
]

/* Password validation rules */
export var PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
}

export function validatePassword(password) {
  var errors = []
  if (password.length < PASSWORD_RULES.minLength) errors.push("At least 8 characters")
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) errors.push("One uppercase letter")
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) errors.push("One lowercase letter")
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) errors.push("One number")
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push("One special character")
  return errors
}
