/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#8B6F4E",
          dark: "#6B5337",
          light: "#F5EDE3",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        memo: {
          bg: "#FAF6F1",
          surface: "#FFFFFF",
          text: "#2D2A26",
          "text-secondary": "#6B6560",
          "text-tertiary": "#9B9590",
          sleep: "#7B9EA8",
          heart: "#C4706B",
          activity: "#7BA87B",
          hrv: "#9B8BB5",
          spo2: "#6BA8C4",
          stress: "#C4A46B",
          resilience: "#8BB5A0",
          success: "#5A9B6B",
          warning: "#C9A050",
          danger: "#C4706B",
          info: "#6B9BC4",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(45, 42, 38, 0.06)',
        'card-hover': '0 4px 20px rgba(45, 42, 38, 0.10)',
        'elevated': '0 8px 32px rgba(45, 42, 38, 0.12)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
