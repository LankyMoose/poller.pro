import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(220, 20, 60)",
        "primary-light": "rgb(228 50 86)",
        "primary-dark": "rgb(165 25 53)",
      },
    },
  },
  plugins: [],
} satisfies Config
