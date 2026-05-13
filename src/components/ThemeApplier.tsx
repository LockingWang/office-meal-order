import { useEffect } from "react";
import type { MonthlyTheme } from "../themes";

export function ThemeApplier({ theme }: { theme: MonthlyTheme }) {
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    const map: Record<string, string> = {
      "--bg": c.bg,
      "--bg-soft": c.bgSoft,
      "--bg-pattern": `${c.bgPattern}, linear-gradient(180deg, ${c.bg} 0%, ${c.bgSoft} 100%)`,
      "--surface": c.surface,
      "--surface-hover": c.bgSoft,
      "--border": c.border,
      "--border-soft": c.borderSoft,
      "--text": c.text,
      "--text-soft": c.textSoft,
      "--muted": c.muted,
      "--accent": c.accent,
      "--accent-strong": c.accentStrong,
      "--accent-soft": c.accentSoft,
      "--accent-glow": c.accentGlow,
      "--secondary": c.secondary,
      "--secondary-strong": c.secondaryStrong,
      "--secondary-soft": c.secondarySoft,
      "--success": c.accentStrong,
    };
    const previous: Record<string, string> = {};
    Object.keys(map).forEach((k) => {
      previous[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, map[k]);
    });
    root.setAttribute("data-month", String(theme.month));
    return () => {
      Object.keys(previous).forEach((k) => {
        if (previous[k]) {
          root.style.setProperty(k, previous[k]);
        } else {
          root.style.removeProperty(k);
        }
      });
      root.removeAttribute("data-month");
    };
  }, [theme]);

  return null;
}
