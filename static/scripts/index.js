const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

smoothScrollLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const targetSection = document.querySelector(targetId);
        if (!targetSection) return;

        event.preventDefault();
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

const navLinks = document.querySelectorAll('.menu a[href^="#"]');
const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

const updateActiveLink = () => {
    const fromTop = window.scrollY + 120;

    sections.forEach((section, index) => {
        const link = navLinks[index];
        if (
            section.offsetTop <= fromTop &&
            section.offsetTop + section.offsetHeight > fromTop
        ) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
};

window.addEventListener('scroll', updateActiveLink);
window.addEventListener('load', updateActiveLink);
