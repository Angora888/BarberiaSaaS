import { StyleSheet, Text, View } from "react-native";
import { brand, isMiAgendaIOS } from "@/src/theme/brand";

type Props = { size?: number };

export default function BrandEmblem({ size = 76 }: Props) {
  return (
    <View
      accessibilityLabel={isMiAgendaIOS ? "Logotipo de Mi Agenda CR" : "Logotipo de Barbería SaaS"}
      style={[
        styles.emblem,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: brand.primary,
        },
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "900",
          fontSize: Math.round(size * 0.29),
          letterSpacing: -1,
        }}
      >
        {isMiAgendaIOS ? "MA" : "BS"}
      </Text>
      {isMiAgendaIOS && <View style={[styles.petal, { right: size * 0.12, top: size * 0.1 }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  emblem: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#76204A",
    shadowOpacity: 0.17,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  petal: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD7E6",
  },
});
