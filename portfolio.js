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

    // Active sidebar link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    function setActive() {
        const scrollY = window.scrollY + window.innerHeight * 0.3;
        let current = sections[0].id;
        sections.forEach(sec => {
            if (sec.offsetTop <= scrollY) current = sec.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }

    window.addEventListener('scroll', setActive, { passive: true });
    setActive();

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
