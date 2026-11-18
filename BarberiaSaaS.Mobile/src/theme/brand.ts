import { Platform } from "react-native";

/**
 * Una sola app Expo, dos identidades visuales por plataforma.
 * Android conserva Barbería SaaS; iOS es Mi Agenda CR.
 */
export const isMiAgendaIOS = Platform.OS === "ios";
export const brandName = isMiAgendaIOS ? "Mi Agenda CR" : "Barbería SaaS";
export const brand = {
  primary: isMiAgendaIOS ? "#CB2F72" : "#1F2937",
  primaryPressed: isMiAgendaIOS ? "#A91F59" : "#111827",
  canvas: isMiAgendaIOS ? "#FFF7FA" : "#F3F5F8",
  pale: isMiAgendaIOS ? "#FCE7F0" : "#F1F5F9",
  stroke: isMiAgendaIOS ? "#F5CBDE" : "#D9DEE7",
  ink: isMiAgendaIOS ? "#381526" : "#111827",
  muted: isMiAgendaIOS ? "#846575" : "#64748B",
  hero: isMiAgendaIOS ? "#691B42" : "#111827",
  white: "#FFFFFF",
} as const;
