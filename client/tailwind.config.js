export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#e7f1ff', 100:'#cfe3ff', 200:'#9fc6ff', 300:'#6fa9ff',
          400:'#3f8cff', 500:'#0f6fff', 600:'#0c59cc', 700:'#094399',
          800:'#062c66', 900:'#041633', 950:'#020b1a'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,.25)'
      }
    }
  },
  plugins: []
};