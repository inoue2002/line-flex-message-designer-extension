import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{ts,tsx,js,jsx,html}',
    './manifest.json'
  ],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;
