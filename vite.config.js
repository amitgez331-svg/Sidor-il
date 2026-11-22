import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

export default defineConfig({
  plugins: [react(), preloadEntry()],
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
