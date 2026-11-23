// Service worker להתראות Push בלבד (בלי שמירת קבצים במטמון)
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Sidor-IL", {
    body: d.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    dir: "rtl",
    lang: "he",
    data: { url: d.url || "/" },
  }));
});

// לחיצה על ההתראה: עוברים לחלון פתוח של האתר, או פותחים חדש.
// התראה עם כתובת מסוימת (למשל מסך האדמין "/#/admin"): החלון הפתוח עובר אליה
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(async ws => {
    for (const w of ws) {
      if (!("focus" in w)) continue;
      if (target !== "/" && "navigate" in w) { try { const n = await w.navigate(target); if (n) return n.focus(); } catch {} return clients.openWindow(target); }
      return w.focus();
    }
    return clients.openWindow(target);
  }));
});
// גרסה חדשה של הקובץ נכנסת לפעולה מיד (בלי לחכות שכל החלונות ייסגרו)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
