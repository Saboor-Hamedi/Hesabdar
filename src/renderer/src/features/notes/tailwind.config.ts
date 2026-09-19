import type { Config } from 'tailwindcss';

// Tailwind v3. (For v4, see the README.)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Handwriting for the note text
        hand: ['"Patrick Hand"', '"Comic Sans MS"', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config;
