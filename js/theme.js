(function () {
    'use strict';

    // 1. Aplicar el tema de inmediato para evitar destellos blancos
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark-theme');
    } else {
        document.documentElement.classList.remove('dark-theme');
    }

    // 2. Estilos inyectados para el tema oscuro y el botón de toggle
    const styles = `
        /* Botón de cambio de tema */
        .theme-toggle-btn {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            outline: none;
        }
        .theme-toggle-btn:hover {
            transform: scale(1.1) rotate(15deg);
            background: rgba(255, 255, 255, 0.35);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }
        .theme-toggle-btn:active {
            transform: scale(0.95);
        }

        /* -----------------------------------------
           Variables CSS del Tema Oscuro Global
        ----------------------------------------- */
        html.dark-theme {
            --bg-body: #0b0f17 !important;
            --bg-white: #121d2a !important;
            --bg-alt: #0e1724 !important;
            --bg-dark: #070b12 !important;
            --bg-dark-card: #121d2a !important;
            --text-primary: #f3f4f6 !important;
            --text-secondary: #9ca3af !important;
            --text-muted: #6b7280 !important;
            --border-subtle: rgba(255, 255, 255, 0.08) !important;
            background-color: #0b0f17 !important;
            color: #f3f4f6 !important;
        }

        /* Ajustes específicos del cuerpo de la página */
        html.dark-theme body {
            background-color: #0b0f17 !important;
            color: #f3f4f6 !important;
        }

        /* Encabezados y barras de navegación */
        html.dark-theme .Arriba {
            background: rgba(18, 29, 42, 0.85) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
        }
        html.dark-theme .Ajustes-barra {
            background: #0e1724 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        html.dark-theme footer {
            background: #070b12 !important;
            border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        /* Tarjeta de Producto */
        html.dark-theme .tarjeta-producto {
            background: #121d2a !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        }
        html.dark-theme .tarjeta-producto:hover {
            box-shadow: 0 8px 30px rgba(249, 115, 22, 0.22) !important;
        }
        html.dark-theme .nombre-producto,
        html.dark-theme .producto h3 {
            color: #f3f4f6 !important;
        }
        html.dark-theme .boton-carrito {
            background: #121d2a !important;
            border-color: var(--accent) !important;
            color: var(--accent) !important;
        }
        html.dark-theme .boton-carrito:hover {
            background: var(--accent) !important;
            color: white !important;
        }

        /* Formularios y Inputs */
        html.dark-theme input:not([type="submit"]),
        html.dark-theme select,
        html.dark-theme textarea {
            background-color: #1a2736 !important;
            color: #f3f4f6 !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        html.dark-theme input::placeholder {
            color: rgba(255, 255, 255, 0.4) !important;
        }

        /* Página de login y registro */
        html.dark-theme body::before {
            background: rgba(0, 0, 0, 0.75) !important;
        }
        html.dark-theme .Login {
            background: rgba(18, 29, 42, 0.6) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
        }

        /* Panel de Administración */
        html.dark-theme .admin-sidebar {
            background: #121d2a !important;
            border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        html.dark-theme .admin-main-header {
            background: #0e1724 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        html.dark-theme .stat-card {
            background: #121d2a !important;
            border: 1px solid rgba(255, 255, 255, 0.06) !important;
            color: #f3f4f6 !important;
        }
        html.dark-theme .stat-card .card-value {
            color: #ffffff !important;
        }
        html.dark-theme table {
            color: #f3f4f6 !important;
        }
        html.dark-theme th {
            background: #0e1724 !important;
            color: #9ca3af !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        html.dark-theme td {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        html.dark-theme tr.stock-low {
            background: rgba(239, 68, 68, 0.1) !important;
        }
        html.dark-theme .admin-section {
            background: #0b0f17 !important;
        }
        html.dark-theme .chart-card {
            background: #121d2a !important;
            border-color: rgba(255, 255, 255, 0.06) !important;
        }

        /* Formulario de Pago (metpa.html) */
        html.dark-theme main.pago-form {
            background: #121d2a !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
            color: #f3f4f6 !important;
        }
        html.dark-theme main.pago-form h2, 
        html.dark-theme main.pago-form label {
            color: #f3f4f6 !important;
        }

        /* Lista de Deseos (deseos.html) */
        html.dark-theme .empty-deseos {
            background: rgba(255, 255, 255, 0.01) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
        }
        html.dark-theme .deseos-panel-contenedor {
            background: #121d2a !important;
            border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        /* Nosotros y Contáctanos */
        html.dark-theme .valor-card,
        html.dark-theme .miembro,
        html.dark-theme .contacto-info-card,
        html.dark-theme .formulario-contacto {
            background: #121d2a !important;
            border: 1px solid rgba(255, 255, 255, 0.06) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
        }
        html.dark-theme .valor-card h3,
        html.dark-theme .miembro h3,
        html.dark-theme .contacto-info-card h3,
        html.dark-theme .formulario-contacto h2 {
            color: #f3f4f6 !important;
        }

        /* Ajustes específicos del botón de tema en modo oscuro */
        html.dark-theme .theme-toggle-btn {
            background: rgba(18, 29, 42, 0.4);
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            color: #f3f4f6;
        }
        html.dark-theme .theme-toggle-btn:hover {
            background: rgba(18, 29, 42, 0.7);
            box-shadow: 0 6px 28px rgba(0, 0, 0, 0.6);
        }
    `;

    // 3. Insertar estilos dinámicamente
    const injectStyles = () => {
        const styleEl = document.createElement('style');
        styleEl.id = 'theme-dynamic-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    };

    if (document.head) {
        injectStyles();
    } else {
        document.addEventListener('DOMContentLoaded', injectStyles);
    }

    // 4. Crear y montar el botón de cambio de tema
    const setupToggle = () => {
        if (document.getElementById('themeToggleBtn')) return; // Evitar duplicados

        const btn = document.createElement('button');
        btn.className = 'theme-toggle-btn';
        btn.id = 'themeToggleBtn';
        btn.setAttribute('aria-label', 'Cambiar tema');
        btn.innerHTML = document.documentElement.classList.contains('dark-theme') ? '☀️' : '🌙';

        btn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            btn.innerHTML = isDark ? '☀️' : '🌙';
        });

        document.body.appendChild(btn);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupToggle);
    } else {
        setupToggle();
    }
})();
