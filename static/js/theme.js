(function () {
    const STORAGE_KEY = 'meropredict-theme';

    function getThemeRoot() {
        return document.querySelector('.dashboard-layout')
            || document.querySelector('.company-details-page');
    }

    function applyTheme(theme) {
        const root = getThemeRoot();
        if (!root) return;

        const icon = document.querySelector('#themeToggle i');
        const label = document.querySelector('#themeToggle span');

        if (theme === 'light') {
            root.classList.add('light-mode');
            if (icon) {
                icon.classList.remove('bi-sun');
                icon.classList.add('bi-moon');
            }
            if (label) label.textContent = 'Dark Mode';
        } else {
            root.classList.remove('light-mode');
            if (icon) {
                icon.classList.remove('bi-moon');
                icon.classList.add('bi-sun');
            }
            if (label) label.textContent = 'Light Mode';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
        applyTheme(saved);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                const root = getThemeRoot();
                const isLight = root.classList.contains('light-mode');
                const next = isLight ? 'dark' : 'light';

                applyTheme(next);
                localStorage.setItem(STORAGE_KEY, next);
            });
        }
    });
})();