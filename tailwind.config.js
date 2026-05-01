/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0f',
        panel: '#14141c',
        elevated: '#1c1c28',
        border: '#2a2a3a',
        primary: '#f4f4f8',
        secondary: '#9090a8',
        dim: '#5a5a70',
        accent: '#ff5b3a',
        track: {
          kick: '#ff5b3a',
          snare: '#ffb73a',
          hihat: '#ffe83a',
          openhat: '#a3ff3a',
          clap: '#3affc8',
          bass: '#3a8aff',
          lead: '#b13aff',
          pad: '#ff3a9b',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
