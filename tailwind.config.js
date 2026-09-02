/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#29327c", // 替换成了你的新深蓝色
          800: "#202763",   // 稍深一点的配饰蓝
          700: "#343f99",   // 稍浅一点的配饰蓝
        },
        ice: "#f8fafc",
        gold: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
        },
        mint: "#14b8a6",
        cyanGlow: "#06b6d4",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 40px rgba(41, 50, 124, 0.08)", // 这里的阴影透明色也跟新色调统一
        glow: "0 0 24px rgba(245, 158, 11, 0.45)",
        mint: "0 0 24px rgba(20, 184, 166, 0.4)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(20, 184, 166, 0.35)" },
          "50%": { boxShadow: "0 0 28px rgba(245, 158, 11, 0.55)" },
        },
      },
      animation: {
        pop: "pop 0.45s ease-out",
        confetti: "confetti 2.4s ease-in forwards",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};