/** @type {import('tailwindcss').Config} */
export default {
    // Mode sombre via classe (activé par défaut si la classe 'dark' est présente sur html)
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Définition des couleurs via variables CSS pour flexibilité
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',

                // Couleurs sémantiques
                success: 'var(--color-success)', // Vert profit
                danger: 'var(--color-danger)',   // Rouge perte/sell
                warning: 'var(--color-warning)',
                info: 'var(--color-info)',

                // Fonds
                background: {
                    DEFAULT: 'var(--color-bg-main)',
                    card: 'var(--color-bg-card)',
                    input: 'var(--color-bg-input)',
                },
                border: 'var(--color-border)',

                // Texte
                text: {
                    primary: 'var(--color-text-main)',
                    secondary: 'var(--color-text-muted)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
                'glow-green': '0 0 10px rgba(14, 203, 129, 0.3)',
                'glow-red': '0 0 10px rgba(246, 70, 93, 0.3)',
            }
        },
    },
    plugins: [],
}
