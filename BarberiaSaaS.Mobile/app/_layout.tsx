import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    const abrirDesdeNotificacion = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { citaId?: number | string } | undefined;
      const citaId = data?.citaId;
      if (citaId != null && String(citaId).trim()) {
        router.push(`/cita/${citaId}`);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(abrirDesdeNotificacion);

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) abrirDesdeNotificacion(response);
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
