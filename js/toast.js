/* ============================================
   🔔 ElectroShop — Toast Notifications
   Uso: showToast('Mensaje', 'success')
   Types: success, error, info, warning
============================================ */

(function () {
    'use strict';

    // Create toast container if it doesn't exist
    function getContainer() {
        let container = document.getElementById('es-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'es-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Inject styles once
    if (!document.getElementById('es-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'es-toast-styles';
        style.textContent = `
            #es-toast-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99999;
                display: flex;
                flex-direction: column-reverse;
                gap: 10px;
                pointer-events: none;
            }
            .es-toast {
                pointer-events: auto;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 20px;
                border-radius: 12px;
                color: #fff;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 8px 32px rgba(0,0,0,0.25);
                backdrop-filter: blur(10px);
                transform: translateX(120%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                max-width: 380px;
                min-width: 260px;
                cursor: pointer;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .es-toast.show {
                transform: translateX(0);
                opacity: 1;
            }
            .es-toast.hide {
                transform: translateX(120%);
                opacity: 0;
            }
            .es-toast--success {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            }
            .es-toast--error {
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            }
            .es-toast--warning {
                background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
            }
            .es-toast--info {
                background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            }
            .es-toast__icon {
                font-size: 18px;
                flex-shrink: 0;
            }
            .es-toast__msg {
                flex: 1;
                line-height: 1.4;
            }
            .es-toast__close {
                background: none;
                border: none;
                color: rgba(255,255,255,0.7);
                font-size: 16px;
                cursor: pointer;
                padding: 0 4px;
                transition: color 0.2s;
            }
            .es-toast__close:hover {
                color: #fff;
            }
            .es-toast__progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255,255,255,0.4);
                border-radius: 0 0 12px 12px;
                animation: es-toast-progress linear forwards;
            }
            @keyframes es-toast-progress {
                from { width: 100%; }
                to { width: 0%; }
            }
            @media (max-width: 480px) {
                #es-toast-container {
                    left: 12px;
                    right: 12px;
                    bottom: 12px;
                }
                .es-toast {
                    max-width: 100%;
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    const ICONS = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    window.showToast = function (message, type = 'info', duration = 3500) {
        const container = getContainer();

        const toast = document.createElement('div');
        toast.className = `es-toast es-toast--${type}`;
        toast.style.position = 'relative';
        toast.style.overflow = 'hidden';

        toast.innerHTML = `
            <span class="es-toast__icon">${ICONS[type] || ICONS.info}</span>
            <span class="es-toast__msg">${message}</span>
            <button class="es-toast__close">&times;</button>
            <div class="es-toast__progress" style="animation-duration: ${duration}ms"></div>
        `;

        container.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        // Click to dismiss
        toast.querySelector('.es-toast__close').addEventListener('click', () => dismiss(toast));
        toast.addEventListener('click', (e) => {
            if (!e.target.classList.contains('es-toast__close')) dismiss(toast);
        });

        // Auto dismiss
        const timer = setTimeout(() => dismiss(toast), duration);

        function dismiss(el) {
            clearTimeout(timer);
            el.classList.remove('show');
            el.classList.add('hide');
            setTimeout(() => el.remove(), 400);
        }
    };
})();
