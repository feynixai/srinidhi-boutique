import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'rose-gold': '#c5a55a',
        'gold': '#c5a55a',
        'charcoal': '#1a1a2e',
        'accent-gold': '#c5a55a',
        'accent-navy': '#1a1a2e',
        'bg-main': '#f5f5f0',
      },
      fontSize: {
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '30px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
        '4xl': ['36px', '44px'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 8px 32px rgba(0, 0, 0, 0.08)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
