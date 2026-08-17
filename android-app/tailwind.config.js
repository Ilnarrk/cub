/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../frontend/src/shared/**/*.{ts,tsx}",
    "../frontend/src/widgets/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
