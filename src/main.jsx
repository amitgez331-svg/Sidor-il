import React from 'react'
import ReactDOM from 'react-dom/client'

// אורח שפותח הזמנה (או קישור קצר) מוריד רק את דף ההזמנה. כל השאר — האתר המלא
const p = window.location.pathname, h = window.location.hash
const guest = /^\/invite\/[a-z0-9]+/i.test(p) || /^#\/invite\/[a-z0-9]+/i.test(h) || /^\/i\/[a-z0-9]+\/?$/i.test(p)
const root = ReactDOM.createRoot(document.getElementById('root'))
const show = el => root.render(<React.StrictMode>{el}</React.StrictMode>)

// אם עלתה גרסה חדשה בזמן שהדף היה פתוח, הקובץ הישן כבר לא קיים: מרעננים פעם אחת כדי לקבל את החדש
const retry = () => {
  try {
    if (sessionStorage.getItem('sidor_reloaded')) return
    sessionStorage.setItem('sidor_reloaded', '1')
  } catch { return }
  window.location.reload()
}
const loaded = () => { try { sessionStorage.removeItem('sidor_reloaded') } catch {} }

if (guest) {
  import('./invite-core.jsx').then(m => {
    loaded()
    const s = m.shortRouteMatch()
    show(s ? <m.ShortLinkRedirect short={s[1]} /> : <m.InviteRoute />)
  }).catch(retry)
} else {
  import('./App.jsx').then(m => { loaded(); show(<m.default />) }).catch(retry)
}
