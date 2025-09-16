/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marian Blues - Inspired by the Virgin Mary's mantle
        'marian-blue': '#4a6fa5',
        'celestial-blue': '#87ceeb',
        'heavenly-blue': '#b3d9ff',
        'divine-blue': '#e8f4fd',
        
        // Sacred Whites and Creams
        'sacred-white': '#fefefe',
        'pearl-white': '#f8f9fa',
        'divine-light': '#fff8dc',
        'holy-cream': '#faf7f0',
        
        // Gentle Golds - Representing divine light
        'divine-gold': '#f4d03f',
        'light-gold': '#fef9e7',
        'golden-light': '#fff4d6',
        'aureola-gold': '#f7dc6f',
        
        // Soft Pastels
        'rose-prayer': '#f8e8e8',
        'lavender-peace': '#f0f0ff',
        'mint-serenity': '#f0fff0',
        
        // Deep Sacred Tones
        'navy-devotion': '#2c5aa0',
        'midnight-prayer': '#1e3a8a',
        'sacred-purple': '#6b46c1',
        
        // Neutral Sacred Tones
        'stone-prayer': '#6b7280',
        'dove-gray': '#9ca3af',
        'whisper-gray': '#f3f4f6',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'crimson': ['Crimson Text', 'serif'],
        'source': ['Source Sans Pro', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        // Celestial Gradients
        'celestial-gradient': 'linear-gradient(135deg, #e8f4fd 0%, #b3d9ff 50%, #87ceeb 100%)',
        'divine-gradient': 'linear-gradient(to bottom, #fefefe, #f8f9fa, #f0f0ff)',
        'marian-gradient': 'linear-gradient(135deg, #fefefe 0%, #e8f4fd 25%, #b3d9ff 75%, #87ceeb 100%)',
        'prayer-gradient': 'linear-gradient(45deg, #fff8dc, #fef9e7, #f8f9fa)',
        'sacred-gradient': 'linear-gradient(to right, #fefefe, #f8f9fa, #e8f4fd)',
        
        // Radial Glows
        'divine-glow': 'radial-gradient(circle, rgba(244,208,63,0.1) 0%, transparent 70%)',
        'marian-glow': 'radial-gradient(ellipse at center, rgba(135,206,235,0.2) 0%, transparent 70%)',
        'holy-glow': 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(248,249,250,0.4) 100%)',
        'aureola-glow': 'radial-gradient(circle, rgba(247,220,111,0.3) 0%, transparent 60%)',
        
        // Texture Patterns
        'prayer-texture': 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%)',
        'sacred-texture': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
      },
      boxShadow: {
        'divine': '0 4px 20px rgba(135, 206, 235, 0.3)',
        'sacred': '0 8px 32px rgba(44, 90, 160, 0.15)',
        'golden': '0 4px 15px rgba(244, 208, 63, 0.2)',
        'holy': '0 2px 10px rgba(255, 255, 255, 0.5)',
        'prayer': '0 6px 25px rgba(0, 0, 0, 0.08)',
        'aureola': '0 0 20px rgba(247, 220, 111, 0.4)',
        'marian': '0 4px 20px rgba(74, 111, 165, 0.2)',
      },
      animation: {
        'gentle-glow': 'gentle-glow 4s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'prayer-pulse': 'prayer-pulse 3s ease-in-out infinite',
        'divine-shimmer': 'divine-shimmer 8s ease-in-out infinite',
      },
      backdropBlur: {
        'divine': '10px',
        'sacred': '5px',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-soft': {
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        '.text-shadow-divine': {
          textShadow: '0 0 10px rgba(244,208,63,0.5)',
        },
        '.text-shadow-sacred': {
          textShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
        '.backdrop-blur-divine': {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        },
        '.backdrop-blur-sacred': {
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(248, 249, 250, 0.9)',
        },
        '.border-sacred': {
          borderImage: 'linear-gradient(45deg, rgba(244,208,63,0.3), rgba(135,206,235,0.3)) 1',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};