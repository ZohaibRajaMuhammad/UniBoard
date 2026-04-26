import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "./convex/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "#252533",
        input: "#1a1a24",
        ring: "#5b7cff",
        background: "#0a0a0f",
        foreground: "#f5f7fb",
        gray: {
          950: "#0a0a0f",
          900: "#111118",
          800: "#1a1a24",
          700: "#252533",
          600: "#43435a",
          500: "#767694",
          400: "#a3a3bc"
        },
        brand: {
          50: "#eef4ff",
          100: "#dae7ff",
          200: "#bdd2ff",
          300: "#90b3ff",
          400: "#5b7cff",
          500: "#3657f7",
          600: "#243fdb",
          700: "#1f34b1",
          800: "#1f308b",
          900: "#202e6d"
        }
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 60px rgba(8, 10, 20, 0.35)"
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(circle at top, rgba(91, 124, 255, 0.28), transparent 38%), radial-gradient(circle at 20% 20%, rgba(46, 191, 165, 0.16), transparent 22%)"
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fadeIn 180ms ease-out",
        "slide-up": "slideUp 240ms ease-out"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
