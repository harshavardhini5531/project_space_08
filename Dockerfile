FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=https://yiwyfhdzgvlsmdeshdgv.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpd3lmaGR6Z3Zsc21kZXNoZGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjI1MDMsImV4cCI6MjA4OTIzODUwM30.ErRrZAOm37M9snprFG22uijMcypX3YhbQmcfh4LJMPY

RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
