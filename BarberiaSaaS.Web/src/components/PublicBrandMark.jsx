import { FaCalendarCheck } from "react-icons/fa";
export const isMiAgendaDomain = typeof window !== "undefined" &&
  ["miagendacr.app", "www.miagendacr.app"].includes(window.location.hostname.toLowerCase());
export const publicBrandName = isMiAgendaDomain ? "Mi Agenda CR" : "Barbería SaaS";

/** Text-based mark until a final accessible logo asset is approved. */
export function PublicBrandMark({ fallbackLogo, className = "", iconOnly = false }) {
  if (!isMiAgendaDomain) return fallbackLogo || null;
  return <span className={`macr-wordmark ${className}`}>
    <span className="macr-wordmark-mark"><FaCalendarCheck aria-hidden="true" /></span>
    {!iconOnly && <span>Mi Agenda <strong>CR</strong></span>}
  </span>;
}
