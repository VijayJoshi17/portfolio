document.addEventListener('DOMContentLoaded', init);

function init() {
    const themeBtn = document.getElementById('themeBtn');
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light');
        const isLight = document.body.classList.contains('light');
        themeBtn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    const sections = [...document.querySelectorAll('main > section[id]')];
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const routeIds = sections.map(section => section.id).filter(id => id !== 'not-found');
    const redirectRoute = new URLSearchParams(window.location.search).get('__route');
    const initialPath = window.location.pathname.replace(/\/+$/, '');
    let basePath;

    if (redirectRoute && /^[a-z0-9-]+$/.test(redirectRoute)) {
        basePath = initialPath;
        window.history.replaceState({}, '', `${basePath}/${redirectRoute}`);
    } else {
        const lastSegment = initialPath.split('/').pop();
        basePath = routeIds.includes(lastSegment)
            ? initialPath.slice(0, -lastSegment.length).replace(/\/+$/, '')
            : initialPath;
    }

    document.querySelectorAll('a[data-route]').forEach(link => {
        const route = link.dataset.route;
        link.href = route === 'home' ? `${basePath}/` : `${basePath}/${route}`;
    });

    function setActive() {
        const page = document.body.dataset.page;
        let current = page;
        if (page === 'home') {
            const scrollY = window.scrollY + window.innerHeight * 0.3;
            current = 'about';
            sections.filter(section => section.id !== 'not-found').forEach(section => {
                if (section.offsetTop <= scrollY) current = section.id;
            });
        }
        navLinks.forEach(link => {
            const active = link.dataset.route === current;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    window.addEventListener('scroll', setActive, { passive: true });

    function renderRoute() {
        const path = window.location.pathname.replace(/\/+$/, '');
        const requestedPage = path.slice(basePath.length).replace(/^\/+/, '') || 'home';
        const page = requestedPage === 'home' || routeIds.includes(requestedPage)
            ? requestedPage
            : 'not-found';

        document.body.dataset.page = page;
        sections.forEach(section => {
            section.hidden = page === 'home'
                ? section.id === 'not-found'
                : section.id !== page;
        });
        document.querySelectorAll('.main > .divider').forEach(divider => {
            divider.hidden = page !== 'home';
        });

        const pageTitle = page === 'home'
            ? 'Vijay Joshi | AI Engineer'
            : `${page === 'not-found' ? 'Page not found' : page[0].toUpperCase() + page.slice(1)} | Vijay Joshi`;
        document.title = pageTitle;
        setActive();
    }

    document.addEventListener('click', event => {
        const link = event.target.closest('a[data-route]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin) return;

        event.preventDefault();
        if (destination.pathname !== window.location.pathname) {
            window.history.pushState({}, '', destination.pathname);
            renderRoute();
            window.scrollTo(0, 0);
        }
    });
    window.addEventListener('popstate', renderRoute);
    renderRoute();

    // Scroll animations
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.entry, .skill-row').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        animObserver.observe(el);
    });

    // Contact Form
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = document.getElementById('formMessage');
            const btn = form.querySelector('.form-submit');
            btn.disabled = true;
            btn.textContent = 'Sending...';
            setTimeout(() => {
                msg.className = 'form-message success';
                msg.textContent = "Message sent! I'll get back to you soon.";
                form.reset();
                btn.disabled = false;
                btn.textContent = 'Send Message';
                setTimeout(() => msg.style.display = 'none', 5000);
            }, 1500);
        });
    }
}
