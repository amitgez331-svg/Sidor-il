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

// לחיצה על ההתראה: עוברים לחלון פתוח של האתר, או פותחים חדש
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if ("focus" in w) return w.focus();
    return clients.openWindow(target);
  }));
});
