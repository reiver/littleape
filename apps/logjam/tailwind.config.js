/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"sans-serif"'],
        body: ['"Open Sans"'],
      },
      colors: {
        primary: '#ffcc00',
        'secondary-1-a': '#1a1a1a',
        'white-f': '#fff',
        'white-f-9': '#f9f9f9',
        black: '#000',
        'black-50': '#000',
        'gray-0': '#ebebeb',
        'gray-1': '#a8a8a8',
        'gray-2': '#7e7e7e',
        'gray-3': '#666666',
        'red-distructive': '#c00006',
        'btn-disabled': '#a1a1a1',
      },
    },
  },
}
