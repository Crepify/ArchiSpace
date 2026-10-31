import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/data/**/*.ts"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        panel: "#0b0d0c",
        accent: "#63f2a6",
        mist: "#9fb3a8",
        sky2: "#56ccf2",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { "4xl": "2rem" },
    },
  },
  plugins: [],
};
export default config;
