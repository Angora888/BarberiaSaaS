import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { obtenerUsuario } from "@/src/services/session";
import { brand, isMiAgendaIOS } from "@/src/theme/brand";

type Tab = "dashboard" | "agenda" | "clientes" | "configuracion";

const items: { key: Tab; symbol: string; label: string; path: "/dashboard" | "/agenda" | "/clientes" | "/configuracion" }[] = [
  { key: "dashboard", symbol: "⌂", label: "Inicio", path: "/dashboard" },
  { key: "agenda", symbol: "▦", label: "Agenda", path: "/agenda" },
  { key: "clientes", symbol: "♧", label: "Clientes", path: "/clientes" },
  { key: "configuracion", symbol: "⚙", label: "Ajustes", path: "/configuracion" },
];

export default function IosBottomNav({ active, professional = false }: { active: Tab; professional?: boolean }) {
  const insets = useSafeAreaInsets();
  const [rolProfesional, setRolProfesional] = useState(professional);

  useEffect(() => {
    if (!isMiAgendaIOS) return;
    let vigente = true;
    obtenerUsuario().then(usuario => {
      if (vigente) setRolProfesional(professional || usuario?.rol === "Profesional");
    }).catch(() => {
      if (vigente) setRolProfesional(professional);
    });
    return () => { vigente = false; };
  }, [professional]);

  if (!isMiAgendaIOS) return null;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.filter(item => !(professional || rolProfesional) || item.key !== "configuracion").map(item => (
        <Pressable
          key={item.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === item.key }}
          accessibilityLabel={item.label}
          onPress={() => { if (active !== item.key) router.replace(item.path); }}
          style={styles.tab}
        >
          <Text style={[styles.symbol, active === item.key && styles.selected]}>{item.symbol}</Text>
          <Text style={[styles.label, active === item.key && styles.selected]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: brand.stroke,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 9,
    paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 46 },
  symbol: { fontSize: 24, color: "#9B8690", fontWeight: "700" },
  label: { fontSize: 10, fontWeight: "700", color: "#9B8690" },
  selected: { color: brand.primary },
});
