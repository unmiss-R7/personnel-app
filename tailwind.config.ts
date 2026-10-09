import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        army: {
          50: '#f4f6f8',
          100: '#e5e9ee',
          200: '#cbd4dd',
          300: '#a3b4c4',
          400: '#758ea6',
          500: '#536f89',
          600: '#415770',
          700: '#35465a',
          800: '#2e3c4c',
          900: '#1b242e',
          950: '#11171e',
        },
        navy: {
          800: '#0f172a',
          900: '#020617',
        }
      },
      fontFamily: {
        sans: ['var(--font-sarabun)', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
