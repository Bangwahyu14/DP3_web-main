import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    red: '#db1a1a',       // Utama (Merah Dinas)
                    light: '#fff6f6',     // Sekunder (BG lembut & card)
                    teal: '#8cc7c4',      // Tersier (Border, highlight, badge)
                    deep: '#2c687b',      // Pelengkap (Sub-heading, tombol aksi pendukung)
                },
            },
        },
    },

    plugins: [forms],
};