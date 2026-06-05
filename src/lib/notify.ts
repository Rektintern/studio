/**
 * Request OS notification permission so proximity pings can fire.
 *
 * MUST be called from a user gesture (a tap/click) — mobile browsers (iOS Safari
 * especially) silently ignore `Notification.requestPermission()` outside of one.
 * Safe to call repeatedly: it no-ops once permission is granted or denied. Also
 * ensures the service worker that actually shows notifications on mobile is
 * registered.
 */
export async function requestNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";

  // The SW is what displays notifications on mobile; make sure it's registered.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}
