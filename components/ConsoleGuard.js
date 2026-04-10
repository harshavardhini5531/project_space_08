'use client'
import { useEffect } from 'react'

export default function ConsoleGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e) => {
      if (e.key === 'F12') { e.preventDefault(); return false }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return false }
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); return false }
    }

    // Console warning message
    const warningStyle = 'color:#fd1c00;font-size:24px;font-weight:bold;'
    const msgStyle = 'color:#fff;font-size:14px;'
    console.clear()
    console.log('%c⚠️ STOP!', warningStyle)
    console.log('%cThis is a restricted area. Any unauthorized activity is monitored and logged.', msgStyle)
    console.log('%cIf someone told you to paste something here, they are trying to compromise your account.', msgStyle)

    // Detect DevTools open (debugger trick)
    let devtoolsOpen = false
    const detectDevTools = () => {
      const threshold = 160
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true
          document.body.style.display = 'none'
          document.title = '⚠️ Access Denied'
        }
      } else {
        if (devtoolsOpen) {
          devtoolsOpen = false
          document.body.style.display = ''
          document.title = 'Project Space'
        }
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    const interval = setInterval(detectDevTools, 1000)

    // Disable drag
    document.addEventListener('dragstart', (e) => e.preventDefault())

    // Disable text selection on sensitive elements
    document.body.style.webkitUserSelect = 'none'
    document.body.style.userSelect = 'none'

    // Re-enable selection for inputs and textareas
    const enableSelection = () => {
      document.querySelectorAll('input, textarea').forEach(el => {
        el.style.webkitUserSelect = 'text'
        el.style.userSelect = 'text'
      })
    }
    enableSelection()
    const observer = new MutationObserver(enableSelection)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  return null
}