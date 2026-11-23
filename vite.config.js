import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'

// הורדה במקביל: main.jsx בוחר בזמן ריצה איזה קובץ לטעון (האתר או דף ההזמנה לאורחים), ולכן הדפדפן
// היה מגלה אותו רק אחרי שהקובץ הקטן הראשון ירד ורץ. כאן מוסיפים לדף הוראה להתחיל להוריד את הקובץ הנכון
// (ואת מה שהוא צריך) כבר מההתחלה, במקביל — לפי הכתובת: הזמנה לאורחים או האתר הרגיל
function preloadEntry() {
  return {
    name: 'sidor-preload-entry',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const b = ctx.bundle || {}
        const chunks = Object.values(b).filter(c => c.type === 'chunk')
        const of = re => chunks.find(c => c.facadeModuleId && re.test(c.facadeModuleId.replace(/\\/g, '/')))
        const deps = c => c ? [c.fileName, ...(c.imports || [])] : []
        const site = deps(of(/\/src\/App\.jsx$/)), guest = deps(of(/\/src\/invite-core\.jsx$/))
        if (!site.length) return html
        const js = `(function(){var p=location.pathname,h=location.hash;var g=/^\\/invite\\/[a-z0-9]+/i.test(p)||/^#\\/invite\\/[a-z0-9]+/i.test(h)||/^\\/i\\/[a-z0-9]+\\/?$/i.test(p);`
          + `(g?${JSON.stringify(guest)}:${JSON.stringify(site)}).forEach(function(f){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href='/'+f;document.head.appendChild(l);});})();`
        return html.replace('</head>', `<script>${js}</script>\n</head>`)
      },
    },
  }
}

// ─── מדיניות אבטחת תוכן (CSP) ───
// הדפדפן מריץ רק קוד מהאתר שלנו (ומ-SheetJS לקובצי אקסל), ושולח נתונים רק ל-Supabase שלנו.
// כך קוד זדוני שיוחדר לדף לא יוכל לרוץ או לשלוח מידע החוצה. הסקריפטים שכתובים בתוך הדף (פתיחת האפליקציה,
// טעינה מוקדמת) מאושרים לפי טביעת אצבע (sha256) שמחושבת כאן בכל בנייה — שינוי בהם מעדכן אותה לבד.
// (frame-ancestors לא עובד בתגית meta; את ההגנה מהטמעה נותן X-Frame-Options ב-vercel.json)
const SUPABASE_HOST = 'zcfosfaazvljnzipyzon.supabase.co'
function cspMeta() {
  return {
    name: 'sidor-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
          .filter(m => !/application\/ld\+json/.test(m[1]))
          .map(m => `'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'`)
        const csp = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')} https://cdn.sheetjs.com`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "media-src 'self' data: blob: https:",
          "font-src 'self' data:",
          `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://cdn.sheetjs.com`,
          "worker-src 'self'",
          "manifest-src 'self'",
          "frame-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
        return html.replace(/(<meta charset="UTF-8"\s*\/?>)/i, `$1\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadEntry(), cspMeta()],
  build: {
    rollupOptions: {
      output: {
        // ספריות בקבצים נפרדים: הן כמעט לא משתנות, אז הדפדפן שומר אותן בין עדכונים
        // ומוריד מחדש רק את קוד האתר
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
        },
      },
    },
  },
})
