/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        pastel: {
          lavender: "#e9e7ff",
          blue: "#dff3ff",
          mint: "#def7ef",
          peach: "#ffe6d8",
          rose: "#ffe5ec",
        },
        brand: {
          50: "#eef2ff",
          100: "#dbe4ff",
          500: "#6f6cff",
          600: "#5a55f5",
          700: "#4a44d6",
        },
        surface: {
          50: "#f7f9ff",
          100: "#eff3ff",
          200: "#e4e9fb",
          800: "#1b2030",
          900: "#141927",
        },
      },
      borderRadius: {
        "sm": "0.5rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.25rem",
        "2xl": "1.35rem",
        "3xl": "1.55rem",
        "4xl": "1.9rem",
        "card": "1.55rem",
        "pill": "9999px",
        "field": "1.35rem",
        "panel": "1.9rem",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      fontSize: {
        hero: ["2.75rem", { lineHeight: "0.98", letterSpacing: "-0.05em", fontWeight: "700" }],
        display: ["3.5rem", { lineHeight: "0.92", letterSpacing: "-0.06em", fontWeight: "700" }],
      },
      boxShadow: {
        soft: "0 18px 45px -28px rgba(15, 23, 42, 0.34), 0 10px 24px -18px rgba(90, 85, 245, 0.18)",
        panel: "0 30px 70px -38px rgba(15, 23, 42, 0.46), 0 18px 32px -24px rgba(148, 163, 184, 0.28)",
        neumorph: "10px 10px 22px rgba(148, 163, 184, 0.25), -10px -10px 22px rgba(255, 255, 255, 0.8)",
        "neumorph-dark":
          "10px 10px 22px rgba(2, 6, 23, 0.7), -8px -8px 20px rgba(51, 65, 85, 0.35)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)",
        "glow-teal": "0 0 20px rgba(20, 184, 166, 0.4), 0 0 40px rgba(20, 184, 166, 0.2)",
      },
      backgroundImage: {
        "hero-soft":
          "radial-gradient(circle at top left, rgba(255,255,255,0.78), transparent 30%), linear-gradient(145deg, #eff2ff 0%, #e4f1ff 42%, #ffe8dd 100%)",
        "card-lavender":
          "radial-gradient(circle at top left, rgba(255,255,255,0.38), transparent 48%), linear-gradient(140deg, #ece9ff 0%, #dff4ff 100%)",
        "card-mint":
          "radial-gradient(circle at top left, rgba(255,255,255,0.34), transparent 48%), linear-gradient(140deg, #def7ef 0%, #e7f7ff 100%)",
        "card-peach":
          "radial-gradient(circle at top left, rgba(255,255,255,0.36), transparent 46%), linear-gradient(140deg, #ffe9de 0%, #ffeef5 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(16px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "float-soft": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-6px)",
          },
        },
        "timer-glow": {
          "0%, 100%": {
            boxShadow: "0 0 18px rgba(59,130,246,0.25), 0 0 40px rgba(59,130,246,0.1)",
          },
          "50%": {
            boxShadow: "0 0 32px rgba(59,130,246,0.45), 0 0 60px rgba(59,130,246,0.2)",
          },
        },
        "pulse-ring": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.35",
          },
          "50%": {
            transform: "scale(1.06)",
            opacity: "0.15",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "0.35",
          },
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
        "float-soft": "float-soft 7s ease-in-out infinite",
        "timer-glow": "timer-glow 2.5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
}
