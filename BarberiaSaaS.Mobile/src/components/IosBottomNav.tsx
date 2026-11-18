import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand, isMiAgendaIOS } from "@/src/theme/brand";

type Tab = "dashboard" | "agenda" | "clientes" | "configuracion";

const items: { key: Tab; emoji: string; label: string; path: "/dashboard" | "/agenda" | "/clientes" | "/configuracion" }[] = [
  { key: "dashboard", emoji: "⌂", label: "Inicio", path: "/dashboard" },
  { key: "agenda", emoji: "▦", label: "Agenda", path: "/agenda" },
  { key: "clientes", emoji: "♧", label: "Clientes", path: "/clientes" },
  { key: "configuracion", emoji: "⚙", label: "Ajustes", path: "/configuracion" },
];

export default function IosBottomNav({ active, professional = false }: { active: Tab; professional?: boolean }) {
  if (!isMiAgendaIOS) return null;
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {items.filter(item => !professional || item.key !== "configuracion").map(item => (
        <Pressable
          key={item.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === item.key }}
          accessibilityLabel={item.label}
          onPress={() => router.replace(item.path)}
          style={styles.tab}
        >
          <Text style={[styles.symbol, active === item.key && styles.selected]}>{item.emoji}</Text>
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
    paddingBottom: 9,
    paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 46 },
  symbol: { fontSize: 24, color: "#9B8690", fontWeight: "700" },
  label: { fontSize: 10, fontWeight: "700", color: "#9B8690" },
  selected: { color: brand.primary },
});
