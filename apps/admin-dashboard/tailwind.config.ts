import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00FFFF',
        'neon-pink': '#FF007F',
        'neon-green': '#39FF14',
        'neon-orange': '#FF6B00',
        'neon-red': '#FF2020',
        gold: '#FFD700',
        'deep-black': '#0A0A0F',
        'panda-white': '#F8F8F8',
        'dark-card': '#12121A',
        'dark-border': '#1E1E2E',
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'neon-pulse-orange': 'neonPulseOrange 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.7', filter: 'brightness(1.5)' },
        },
        neonPulseOrange: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px #FF6B00)' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 16px #FF6B00)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.2)',
        'neon-pink': '0 0 20px rgba(255, 0, 127, 0.5), 0 0 60px rgba(255, 0, 127, 0.2)',
        'neon-orange': '0 0 20px rgba(255, 107, 0, 0.5), 0 0 60px rgba(255, 107, 0, 0.2)',
        'neon-red': '0 0 20px rgba(255, 32, 32, 0.5), 0 0 60px rgba(255, 32, 32, 0.2)',
        'neon-gold': '0 0 20px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.2)',
        'card-glow': '0 4px 32px rgba(255, 107, 0, 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid':
          'linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)',
        shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
