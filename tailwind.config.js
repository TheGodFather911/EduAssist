/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: '#374151',
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            h1: {
              fontWeight: '700',
              marginTop: '1.5em',
              marginBottom: '0.75em',
            },
            h2: {
              fontWeight: '600',
              marginTop: '1.25em',
              marginBottom: '0.75em',
            },
            h3: {
              fontWeight: '600',
              marginTop: '1.25em',
              marginBottom: '0.75em',
            },
            pre: {
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginTop: '1.5em',
              marginBottom: '1.5em',
            },
            code: {
              borderRadius: '0.375rem',
              padding: '0.2em 0.4em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            ':lang(ar)': {
              fontFamily: '"Noto Naskh Arabic", serif',
              direction: 'rtl',
            },
            ':lang(fr)': {
              fontFamily: '"Noto Sans", "Crimson Pro", serif',
            }
          },
        },
      },
      fontFamily: {
        serif: ['Crimson Pro', 'Noto Sans', 'Noto Naskh Arabic', 'Georgia', 'serif'],
        sans: ['Noto Sans', 'Noto Naskh Arabic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};