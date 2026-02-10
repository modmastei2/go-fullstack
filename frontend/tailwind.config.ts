export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      // colors: {
      //   prisma: 'rgb(var(--color-prisma) / <alpha-value>)',
      // },
      animation: {
        'text-flow': 'key-text-flow 4s',
        'shine': 'shine 1.5s linear infinite',
      },
      keyframes: {
        'key-text-flow': {
          '0%, 15%': { transform: 'translateY(0%)' },
          '20%, 35%': { transform: 'translateY(-100%)' },
          '40%, 55%': { transform: 'translateY(-200%)' },
          '60%, 75%': { transform: 'translateY(-300%)' },
          '80%, 95%': { transform: 'translateY(-400%)' },
          '100%': { transform: 'translateY(-500%)' },
        }
      }
    },
  }
}