import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0D0D0D",
        chalk: "#F5F2EC",
        "harper-gold": "#C9A84C",
        slate: "#4A5568",
        "score-green": "#2D6A4F",
        "score-amber": "#D4A017",
        "score-red": "#C0392B",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
