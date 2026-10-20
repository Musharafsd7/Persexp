// Local notification via Capacitor (Android). Silently does nothing in a plain browser.
export async function notify(title: string, body: string) {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions()
      if (req.display !== 'granted') return
    }
    await LocalNotifications.schedule({ notifications: [{ id: Math.floor(Date.now() / 1000) % 2_000_000_000, title, body }] })
  } catch {
    /* ignore */
  }
}
