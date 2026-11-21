import React from 'react'
import ReactDOM from 'react-dom/client'

// אורח שפותח הזמנה (או קישור קצר) מוריד רק את דף ההזמנה. כל השאר — האתר המלא
const p = window.location.pathname, h = window.location.hash
const guest = /^\/invite\/[a-z0-9]+/i.test(p) || /^#\/invite\/[a-z0-9]+/i.test(h) || /^\/i\/[a-z0-9]+\/?$/i.test(p)
const root = ReactDOM.createRoot(document.getElementById('root'))

// ─── במקום דף לבן: אם משהו במסך נשבר, מראים הודעה ברורה עם פרטי השגיאה ודרך לצאת ───
const btn = { border: 'none', borderRadius: 100, padding: '12px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
function Oops({ error }) {
  const msg = String((error && (error.message || error)) || '').slice(0, 300)
  // "פתיחה מחדש": מוחקים רק את המסך האחרון שנשמר במכשיר (לא את ההתחברות), וחוזרים להתחלה
  const fresh = () => { try { ['sidor_last_screen', 'sidor_event_id', 'sidor_reloaded'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) }) } catch {} window.location.href = '/' }
  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#FBF7FC', fontFamily: "'Heebo',sans-serif", boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 22, padding: '26px 22px', boxShadow: '0 18px 40px -20px rgba(91,60,140,.45)', textAlign: 'center' }}>
        <div style={{ fontSize: 40 }} aria-hidden="true">🛠️</div>
        <h1 style={{ fontSize: 20, margin: '8px 0 6px', color: '#2B1D3F' }}>משהו השתבש בטעינת המסך</h1>
        <p style={{ fontSize: 15, color: '#5E5470', margin: '0 0 16px', lineHeight: 1.6 }}>הנתונים שלכם שמורים. נסו לרענן, או לפתוח מחדש מההתחלה.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => window.location.reload()} style={{ ...btn, background: 'linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)', color: '#fff' }}>רענון</button>
          <button type="button" onClick={fresh} style={{ ...btn, background: '#F4EEFC', color: '#3A2464' }}>פתיחה מחדש</button>
        </div>
        {msg && <div dir="ltr" style={{ marginTop: 16, fontSize: 12, color: '#6E6585', background: '#F7F3FB', borderRadius: 10, padding: '8px 10px', textAlign: 'left', wordBreak: 'break-word' }}>{msg}</div>}
      </div>
    </div>
  )
}
class Guard extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { try { console.error('Sidor-IL screen error:', error, info && info.componentStack) } catch {} }
  render() { return this.state.error ? <Oops error={this.state.error} /> : this.props.children }
}
const show = el => root.render(<React.StrictMode><Guard>{el}</Guard></React.StrictMode>)

// אם עלתה גרסה חדשה בזמן שהדף היה פתוח, הקובץ הישן כבר לא קיים: מרעננים פעם אחת כדי לקבל את החדש.
// נכשל גם אחרי הריענון — מראים הודעה (ולא דף לבן)
const failed = err => {
  let again = false
  try { again = !!sessionStorage.getItem('sidor_reloaded'); if (!again) sessionStorage.setItem('sidor_reloaded', '1') } catch { again = true }
  if (again) show(<Oops error={err} />)
  else window.location.reload()
}
const loaded = () => { try { sessionStorage.removeItem('sidor_reloaded') } catch {} }

if (guest) {
  import('./invite-core.jsx').then(m => {
    loaded()
    const s = m.shortRouteMatch()
    show(s ? <m.ShortLinkRedirect short={s[1]} /> : <m.InviteRoute />)
  }).catch(failed)
} else {
  import('./App.jsx').then(m => { loaded(); show(<m.default />) }).catch(failed)
}
