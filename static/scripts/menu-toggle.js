document.addEventListener('DOMContentLoaded', () => {
    const menu = document.querySelector('.menu');
    const toggle = menu?.querySelector('.menu-toggle');
    const navList = menu?.querySelector('ul');

    if (!menu || !toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        menu.classList.toggle('open', !expanded);
    });

    navList.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (menu.classList.contains('open')) {
                menu.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
});
