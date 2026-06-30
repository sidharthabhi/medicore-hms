import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas:   "#FBFBFC",
        surface:  "#FFFFFF",
        ink:      "#15181E",
        muted:    "#697283",
        faint:    "#9AA1AD",
        hairline: "#EBEDF0",
        accent:   "#2B6CB0",   // calm medical blue
        accentlt: "#EBF2FA",   // accent wash
        ok:       "#2F855A",
        okwash:   "#EAF4EE",
        warn:     "#B7791F",
        warnwash: "#FBF3E3",
        alert:    "#B4413C",
        alertwash:"#F8ECEB",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Newsreader", "Georgia", "serif"],
        sans:  ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono:  ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,24,30,0.04), 0 1px 1px rgba(21,24,30,0.03)",
      },
    },
  },
  plugins: [],
};
export default config;
