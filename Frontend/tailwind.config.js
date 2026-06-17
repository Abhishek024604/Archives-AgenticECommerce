// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1c1917", // stone-900
        background: "#f5f5f4", // stone-100
        accent: "#a16207",
      },
    },
  },
  plugins: [],
};