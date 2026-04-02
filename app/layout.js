import "./globals.css"
import "@/lib/responsive.css"

export var metadata = {
  title: "Project Space",
  description: "Hackathon Event Management Platform — May 6–12, 2026",
  verification: {
    google: ['TNHqCAUTfHX93gZTtWI5-UALEPnzonSjiNp7-izjL-Y', 'tj5MxaJ7ul1Ux-iB7wPGuF3Uzk6aeBJLMnRjBUdDCu8'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300;1,9..40,400&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/astro-futuristic-font" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}