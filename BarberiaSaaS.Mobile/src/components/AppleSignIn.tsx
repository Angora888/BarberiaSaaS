import { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import api from "@/src/services/api";
import { guardarSesion } from "@/src/services/session";
import { registrarPushNotifications } from "@/src/services/push";

type Props = {
  mode: "login" | "link";
  onSuccess?: (role?: string) => void;
};

export default function AppleSignIn({ mode, onSuccess }: Props) {
  const [disponible, setDisponible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setDisponible)
      .catch(() => setDisponible(false));
  }, []);

  const autenticar = async () => {
    if (cargando) return;
    setError("");
    setCargando(true);
    try {
      const resultado = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!resultado.identityToken) throw new Error("Apple no devolvió un token de identidad.");

      if (mode === "link") {
        const respuesta = await api.post("/auth/apple/link", {
          identityToken: resultado.identityToken,
        });
        Alert.alert("Cuenta vinculada", respuesta.data?.mensaje || "Ahora podés ingresar con Apple.");
      } else {
        const { data } = await api.post("/auth/apple/login", {
          identityToken: resultado.identityToken,
        });
        await guardarSesion(data.token, data.usuario);
        try { await registrarPushNotifications(); }
        catch (pushError) { console.warn("Push iOS:", pushError); }
        onSuccess?.(data.usuario?.rol);
      }
    } catch (err: any) {
      if (err?.code !== "ERR_REQUEST_CANCELED") {
        setError(err?.response?.data?.mensaje || err?.message || "No se pudo autenticar con Apple.");
      }
    } finally {
      setCargando(false);
    }
  };

  if (Platform.OS !== "ios" || !disponible) return null;
  return (
    <View style={styles.contenedor}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={mode === "link"
          ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
          : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={styles.boton}
        onPress={autenticar}
      />
      {cargando ? <Text style={styles.info}>Verificando con Apple...</Text> : null}
      {mode === "login"
        ? <Text style={styles.info}>Si es tu primera vez, iniciá con correo y vinculá Apple en Configuración.</Text>
        : <Text style={styles.info}>Vinculá Apple a tu cuenta actual para usarlo en próximos ingresos.</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 18, alignItems: "center", gap: 8 },
  boton: { width: "100%", height: 50 },
  info: { color: "#64748b", fontSize: 12, textAlign: "center", lineHeight: 17 },
  error: { color: "#be123c", fontSize: 13, textAlign: "center" },
});
