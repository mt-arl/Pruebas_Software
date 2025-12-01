// frontend/postcss.config.js
import tailwindPostcss from '@tailwindcss/postcss';
import autoprefixer    from 'autoprefixer';

export default {
  plugins: {
    // Nuevo plugin PostCSS de Tailwind
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  }
};
