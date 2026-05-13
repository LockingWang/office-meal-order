export type MonthlyTheme = {
  month: number;
  label: string;
  seasonLabel: string;
  accentEmoji: string;
  floaters: string[];
  colors: {
    bg: string;
    bgSoft: string;
    bgPattern: string;
    surface: string;
    border: string;
    borderSoft: string;
    text: string;
    textSoft: string;
    muted: string;
    accent: string;
    accentStrong: string;
    accentSoft: string;
    accentGlow: string;
    secondary: string;
    secondaryStrong: string;
    secondarySoft: string;
  };
};

export const MONTHLY_THEMES: Record<number, MonthlyTheme> = {
  1: {
    month: 1,
    label: "一月",
    seasonLabel: "新春團圓",
    accentEmoji: "🧧",
    floaters: ["🧧", "🐉", "🏮", "🎆", "🥮"],
    colors: {
      bg: "#fff5ee",
      bgSoft: "#ffe8d6",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(231, 105, 92, 0.16) 0, transparent 45%),\n   radial-gradient(circle at 85% 75%, rgba(243, 169, 86, 0.18) 0, transparent 42%)",
      surface: "#fffdf6",
      border: "#f3d6b8",
      borderSoft: "#fde9d2",
      text: "#5a2f24",
      textSoft: "#88554a",
      muted: "#b48a7a",
      accent: "#d9624e",
      accentStrong: "#b6442f",
      accentSoft: "#fde2d6",
      accentGlow: "rgba(217, 98, 78, 0.25)",
      secondary: "#e6a14a",
      secondaryStrong: "#b87421",
      secondarySoft: "#fde6c5",
    },
  },
  2: {
    month: 2,
    label: "二月",
    seasonLabel: "甜蜜情人月",
    accentEmoji: "💗",
    floaters: ["💗", "🌸", "🍫", "💌", "🌷"],
    colors: {
      bg: "#fff5f7",
      bgSoft: "#ffe1ea",
      bgPattern:
        "radial-gradient(circle at 18% 20%, rgba(233, 137, 169, 0.22) 0, transparent 48%),\n   radial-gradient(circle at 82% 80%, rgba(247, 184, 200, 0.22) 0, transparent 45%)",
      surface: "#fffafc",
      border: "#f5cad8",
      borderSoft: "#ffe1ea",
      text: "#5b2a3c",
      textSoft: "#894a5e",
      muted: "#b88a99",
      accent: "#e07a9c",
      accentStrong: "#b3517a",
      accentSoft: "#fde0ea",
      accentGlow: "rgba(224, 122, 156, 0.25)",
      secondary: "#f3a7b5",
      secondaryStrong: "#c66e84",
      secondarySoft: "#ffe0e6",
    },
  },
  3: {
    month: 3,
    label: "三月",
    seasonLabel: "櫻花初綻",
    accentEmoji: "🌸",
    floaters: ["🌸", "🌷", "🐰", "🌿", "🦋"],
    colors: {
      bg: "#fff7fa",
      bgSoft: "#ffe5ee",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(243, 200, 220, 0.32) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(186, 215, 154, 0.22) 0, transparent 48%)",
      surface: "#fffcfe",
      border: "#f3c8da",
      borderSoft: "#ffe1ec",
      text: "#5b3949",
      textSoft: "#8d5d72",
      muted: "#b08fa1",
      accent: "#e08fb1",
      accentStrong: "#b8678d",
      accentSoft: "#ffe1ec",
      accentGlow: "rgba(224, 143, 177, 0.25)",
      secondary: "#a7c98a",
      secondaryStrong: "#6f9456",
      secondarySoft: "#e1f0d2",
    },
  },
  4: {
    month: 4,
    label: "四月",
    seasonLabel: "春日野餐",
    accentEmoji: "🌷",
    floaters: ["🌷", "🐝", "🌼", "🍃", "🐞"],
    colors: {
      bg: "#fbfaee",
      bgSoft: "#f3eed3",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(177, 198, 124, 0.25) 0, transparent 50%),\n   radial-gradient(circle at 85% 70%, rgba(243, 211, 142, 0.22) 0, transparent 48%)",
      surface: "#fffcef",
      border: "#e0d8b0",
      borderSoft: "#efeacb",
      text: "#3f4a23",
      textSoft: "#6c7846",
      muted: "#a09f7b",
      accent: "#a8c275",
      accentStrong: "#789449",
      accentSoft: "#e6efc7",
      accentGlow: "rgba(168, 194, 117, 0.28)",
      secondary: "#f1c75a",
      secondaryStrong: "#b58521",
      secondarySoft: "#fbe9b0",
    },
  },
  5: {
    month: 5,
    label: "五月",
    seasonLabel: "春末初夏",
    accentEmoji: "🌿",
    floaters: ["🌿", "🍵", "🐢", "🌱", "🦋"],
    colors: {
      bg: "#f7faf0",
      bgSoft: "#e6efc7",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(127, 168, 107, 0.18) 0, transparent 45%),\n   radial-gradient(circle at 85% 75%, rgba(243, 180, 119, 0.16) 0, transparent 42%)",
      surface: "#fbfaee",
      border: "#d7d6ab",
      borderSoft: "#e9e6c0",
      text: "#3d4b33",
      textSoft: "#5e6e54",
      muted: "#8a9082",
      accent: "#7fa86b",
      accentStrong: "#587e48",
      accentSoft: "#e1f0d2",
      accentGlow: "rgba(127, 168, 107, 0.22)",
      secondary: "#f3b477",
      secondaryStrong: "#c47a3a",
      secondarySoft: "#fde2c2",
    },
  },
  6: {
    month: 6,
    label: "六月",
    seasonLabel: "梅雨繡球",
    accentEmoji: "💧",
    floaters: ["💧", "☔", "🐌", "🌧️", "🌿"],
    colors: {
      bg: "#f1f6fa",
      bgSoft: "#dde9f3",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(140, 180, 217, 0.24) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(193, 173, 217, 0.22) 0, transparent 48%)",
      surface: "#f9fbfd",
      border: "#c7d4e0",
      borderSoft: "#dde9f3",
      text: "#2e3a4a",
      textSoft: "#536479",
      muted: "#869aaf",
      accent: "#6a9bd1",
      accentStrong: "#3e6da3",
      accentSoft: "#dbe8f4",
      accentGlow: "rgba(106, 155, 209, 0.28)",
      secondary: "#a991c8",
      secondaryStrong: "#6f5491",
      secondarySoft: "#e7dff1",
    },
  },
  7: {
    month: 7,
    label: "七月",
    seasonLabel: "盛夏海風",
    accentEmoji: "🌊",
    floaters: ["🌊", "🏖️", "🍉", "🐠", "⛵"],
    colors: {
      bg: "#eef7fb",
      bgSoft: "#cfeaf3",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(94, 168, 199, 0.22) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(243, 196, 110, 0.20) 0, transparent 48%)",
      surface: "#f5fbfd",
      border: "#bfdce6",
      borderSoft: "#d8ecf2",
      text: "#1f3e4a",
      textSoft: "#456a76",
      muted: "#86a3ad",
      accent: "#4ea8c4",
      accentStrong: "#2f7d97",
      accentSoft: "#cfe7ef",
      accentGlow: "rgba(78, 168, 196, 0.30)",
      secondary: "#f3b95f",
      secondaryStrong: "#b6772a",
      secondarySoft: "#fae3b8",
    },
  },
  8: {
    month: 8,
    label: "八月",
    seasonLabel: "夏日西瓜",
    accentEmoji: "🍉",
    floaters: ["🍉", "🍦", "🌻", "🍧", "🐬"],
    colors: {
      bg: "#fff7f5",
      bgSoft: "#ffe1d8",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(243, 137, 121, 0.20) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(143, 196, 138, 0.22) 0, transparent 48%)",
      surface: "#fffaf7",
      border: "#f4ccc1",
      borderSoft: "#fde1d8",
      text: "#5b2e2a",
      textSoft: "#8a514c",
      muted: "#b88a85",
      accent: "#e8716b",
      accentStrong: "#b94946",
      accentSoft: "#fde0db",
      accentGlow: "rgba(232, 113, 107, 0.26)",
      secondary: "#7fb86a",
      secondaryStrong: "#558a45",
      secondarySoft: "#dceec6",
    },
  },
  9: {
    month: 9,
    label: "九月",
    seasonLabel: "中秋月圓",
    accentEmoji: "🥮",
    floaters: ["🥮", "🌕", "🐰", "🍂", "🐶"],
    colors: {
      bg: "#fbf6ed",
      bgSoft: "#f1e3c4",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(214, 174, 94, 0.24) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(168, 132, 86, 0.18) 0, transparent 48%)",
      surface: "#fffaef",
      border: "#dec59a",
      borderSoft: "#ede1c2",
      text: "#4a3520",
      textSoft: "#7c5c3d",
      muted: "#a99275",
      accent: "#c79553",
      accentStrong: "#9a6a2c",
      accentSoft: "#f3e3c1",
      accentGlow: "rgba(199, 149, 83, 0.28)",
      secondary: "#b9844f",
      secondaryStrong: "#825a2b",
      secondarySoft: "#ecd3b0",
    },
  },
  10: {
    month: 10,
    label: "十月",
    seasonLabel: "南瓜萬聖",
    accentEmoji: "🎃",
    floaters: ["🎃", "🍁", "👻", "🦇", "🍂"],
    colors: {
      bg: "#fff4e8",
      bgSoft: "#fbdcb6",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(232, 130, 51, 0.22) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(122, 96, 145, 0.18) 0, transparent 48%)",
      surface: "#fffaf2",
      border: "#f0c894",
      borderSoft: "#fbdcb6",
      text: "#4d2c12",
      textSoft: "#7a4d24",
      muted: "#ab8c69",
      accent: "#e88234",
      accentStrong: "#b75a14",
      accentSoft: "#fadcbb",
      accentGlow: "rgba(232, 130, 52, 0.32)",
      secondary: "#7d6794",
      secondaryStrong: "#564172",
      secondarySoft: "#e3dbed",
    },
  },
  11: {
    month: 11,
    label: "十一月",
    seasonLabel: "深秋楓紅",
    accentEmoji: "🍁",
    floaters: ["🍁", "🍂", "🌰", "☕", "🧣"],
    colors: {
      bg: "#fbf2ec",
      bgSoft: "#f1d7c0",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(199, 99, 56, 0.20) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(170, 132, 80, 0.18) 0, transparent 48%)",
      surface: "#fef7f0",
      border: "#dfbb97",
      borderSoft: "#ecd2b8",
      text: "#4a2a18",
      textSoft: "#7b4c30",
      muted: "#a9826a",
      accent: "#c46838",
      accentStrong: "#923e16",
      accentSoft: "#f1d2b8",
      accentGlow: "rgba(196, 104, 56, 0.28)",
      secondary: "#a78262",
      secondaryStrong: "#785538",
      secondarySoft: "#ead1b3",
    },
  },
  12: {
    month: 12,
    label: "十二月",
    seasonLabel: "聖誕飄雪",
    accentEmoji: "🎄",
    floaters: ["🎄", "❄️", "☃️", "🎁", "⭐"],
    colors: {
      bg: "#f1f7f3",
      bgSoft: "#dbe8df",
      bgPattern:
        "radial-gradient(circle at 12% 18%, rgba(72, 132, 89, 0.20) 0, transparent 48%),\n   radial-gradient(circle at 85% 72%, rgba(204, 70, 70, 0.18) 0, transparent 48%)",
      surface: "#f8fcf9",
      border: "#bbd2c1",
      borderSoft: "#d4e3d8",
      text: "#22332a",
      textSoft: "#456154",
      muted: "#7a9484",
      accent: "#3e8458",
      accentStrong: "#235a37",
      accentSoft: "#d4e8dc",
      accentGlow: "rgba(62, 132, 88, 0.28)",
      secondary: "#cc4646",
      secondaryStrong: "#962323",
      secondarySoft: "#f4d3d3",
    },
  },
};

export function getThemeByMonth(month: number): MonthlyTheme {
  const m = Math.max(1, Math.min(12, Math.round(month)));
  return MONTHLY_THEMES[m] ?? MONTHLY_THEMES[5];
}
