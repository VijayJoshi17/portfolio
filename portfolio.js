document.addEventListener('DOMContentLoaded', init);

function safeStorage(action, key, value) {
    try {
        if (action === 'get') return localStorage.getItem(key);
        localStorage.setItem(key, value);
    } catch (error) {
        return null;
    }
    return null;
}

function init() {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Theme ----------
    const themeBtn = document.getElementById('themeBtn');
    function toggleTheme() {
        const next = root.dataset.theme === 'light' ? 'dark' : 'light';
        root.dataset.theme = next;
        safeStorage('set', 'theme', next);
        window.dispatchEvent(new CustomEvent('themechange'));
    }
    themeBtn.addEventListener('click', toggleTheme);

    // ---------- Routing (static GitHub Pages friendly) ----------
    const sections = [...document.querySelectorAll('main > section[id]')];
    const navLinks = document.querySelectorAll('.site-nav a');
    const routeIds = sections.map(section => section.id).filter(id => id !== 'not-found');
    const blogPosts = window.blogPosts || [];
    const blogRoute = route => /^blogs\/[a-z0-9-]+$/.test(route) && blogPosts.some(post => `blogs/${post.slug}` === route);
    const latestPost = () => [...blogPosts].sort((first, second) => second.date.localeCompare(first.date))[0];
    const announcementDismissalKey = 'dismissedBlogAnnouncement';
    const announcementClose = document.getElementById('blogAnnouncementClose');
    if (announcementClose) {
        announcementClose.addEventListener('click', () => {
            const announcement = document.getElementById('blogAnnouncement');
            const post = latestPost();
            if (!announcement || !post) return;
            safeStorage('set', announcementDismissalKey, post.slug);
            announcement.hidden = true;
            buildProgress();
        });
    }
    const redirectRoute = new URLSearchParams(window.location.search).get('__route');
    const initialPath = window.location.pathname.replace(/\/+$/, '');
    let basePath;

    if (redirectRoute && (routeIds.includes(redirectRoute) || blogRoute(redirectRoute))) {
        basePath = initialPath;
        window.history.replaceState({}, '', `${basePath}/${redirectRoute}`);
    } else {
        const segments = initialPath.split('/').filter(Boolean);
        const blogIndex = segments.length > 1 && segments[segments.length - 2] === 'blogs'
            ? segments.length - 2
            : -1;
        const lastSegment = segments[segments.length - 1];
        if (blogIndex !== -1) {
            basePath = `/${segments.slice(0, blogIndex).join('/')}`.replace(/\/$/, '');
        } else if (routeIds.includes(lastSegment)) {
            basePath = initialPath.slice(0, -lastSegment.length).replace(/\/+$/, '');
        } else {
            basePath = initialPath;
        }
    }
    window.portfolioBasePath = basePath;
    const portfolioScript = document.querySelector('script[src$="portfolio.js"]');
    window.portfolioAssetBaseUrl = portfolioScript
        ? new URL('.', portfolioScript.src).href
        : new URL('.', window.location.href).href;

    const routeHref = route => (route === 'home' ? `${basePath}/` : `${basePath}/${route}`);
    document.querySelectorAll('a[data-route]').forEach(link => {
        if (link.dataset.route) link.href = routeHref(link.dataset.route);
    });

    // Images inside sections use paths relative to the site root.
    document.querySelectorAll('main img[src^="images/"]').forEach(image => {
        image.src = new URL(image.getAttribute('src'), window.portfolioAssetBaseUrl).href;
    });

    // ---------- Segmented scroll progress ----------
    const progress = document.getElementById('progress');
    let segments = [];

    function visibleSections() {
        return sections.filter(section => !section.hidden && section.id !== 'not-found');
    }

    function buildProgress() {
        progress.innerHTML = '';
        segments = visibleSections().map(section => {
            const segment = document.createElement('span');
            segment.className = 'progress-seg';
            segment.style.flexGrow = String(Math.max(1, section.offsetHeight));
            segment.innerHTML = '<i></i>';
            progress.appendChild(segment);
            return { section, fill: segment.firstChild, element: segment };
        });
        updateProgress();
    }

    function updateProgress() {
        const scrollY = window.scrollY;
        const viewport = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const atBottom = scrollY + viewport >= docHeight - 4;
        let current = segments.length ? segments[0].section.id : null;

        if (segments.length === 1) {
            const ratio = docHeight > viewport ? scrollY / (docHeight - viewport) : 1;
            segments[0].fill.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
        } else {
            const probe = scrollY + viewport * 0.35;
            segments.forEach(({ section, fill }) => {
                const top = section.getBoundingClientRect().top + scrollY;
                const ratio = atBottom ? 1 : (probe - top) / section.offsetHeight;
                fill.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
                if (top <= probe) current = section.id;
            });
            if (atBottom && segments.length) current = segments[segments.length - 1].section.id;
        }
        segments.forEach(({ section, element }) => element.classList.toggle('is-current', section.id === current));
        setActive(current);
    }

    function setActive(scrollCurrent) {
        const page = document.body.dataset.page;
        let current = page === 'home' ? scrollCurrent : page;
        if (current && current.startsWith('blogs/')) current = 'blogs';
        navLinks.forEach(link => {
            const active = link.dataset.route === current;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateProgress();
            document.body.classList.toggle('scrolled', window.scrollY > 8);
            ticking = false;
        });
    }, { passive: true });
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildProgress, 150);
    });

    // ---------- Reveal on scroll ----------
    const revealObserver = 'IntersectionObserver' in window && !reduceMotion
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
        : null;

    function observeReveals(scope) {
        scope.querySelectorAll('.reveal:not(.is-in)').forEach(element => {
            if (revealObserver) revealObserver.observe(element);
            else element.classList.add('is-in');
        });
    }
    window.observeReveals = observeReveals;

    // ---------- Route rendering ----------
    function renderRoute() {
        const path = window.location.pathname.replace(/\/+$/, '');
        const requestedPage = path.slice(basePath.length).replace(/^\/+/, '') || 'home';
        const page = requestedPage === 'home' || routeIds.includes(requestedPage) || blogRoute(requestedPage)
            ? requestedPage
            : 'not-found';

        document.body.dataset.page = page;
        sections.forEach(section => {
            section.hidden = page === 'home'
                ? section.id === 'not-found'
                : section.id !== (page.startsWith('blogs/') ? 'blogs' : page);
        });

        const announcement = document.getElementById('blogAnnouncement');
        const post = latestPost();
        if (announcement) {
            announcement.hidden = page !== 'home' || !post
                || safeStorage('get', announcementDismissalKey) === post.slug;
            if (post) {
                const route = `blogs/${post.slug}`;
                const link = announcement.querySelector('.blog-announcement-title');
                const date = announcement.querySelector('.blog-announcement-date');
                link.dataset.route = route;
                link.href = routeHref(route);
                link.textContent = post.title;
                date.dateTime = post.date;
                date.textContent = typeof formatBlogDate === 'function' ? formatBlogDate(post.date) : post.date;
            }
        }

        const blogPost = page.startsWith('blogs/') ? blogPosts.find(item => `blogs/${item.slug}` === page) : null;
        document.title = blogPost
            ? `${blogPost.title} | Vijay Joshi`
            : page === 'home'
            ? 'Vijay Joshi | AI Engineer'
            : `${page === 'not-found' ? 'Page not found' : page[0].toUpperCase() + page.slice(1)} | Vijay Joshi`;

        if (typeof renderBlogPage === 'function' && (page === 'home' || page === 'blogs' || page.startsWith('blogs/'))) {
            renderBlogPage(page.startsWith('blogs/') ? page.slice('blogs/'.length) : null);
            observeReveals(document.getElementById('blogs'));
        }
        buildProgress();
        window.dispatchEvent(new CustomEvent('routechange', { detail: { page } }));
    }

    function navigate(route) {
        const destination = routeHref(route);
        if (destination !== window.location.pathname) {
            window.history.pushState({}, '', destination);
            renderRoute();
        }
        window.scrollTo(0, 0);
    }
    window.portfolioNavigate = navigate;

    document.addEventListener('click', event => {
        const link = event.target.closest('a[data-route]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin) return;

        event.preventDefault();
        if (destination.pathname !== window.location.pathname) {
            window.history.pushState({}, '', destination.pathname);
            renderRoute();
        }
        window.scrollTo(0, 0);
    });
    window.addEventListener('popstate', renderRoute);
    renderRoute();
    observeReveals(document);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildProgress);
    window.addEventListener('load', buildProgress);

    // ---------- Command palette ----------
    const palette = document.getElementById('palette');
    const paletteInput = document.getElementById('paletteInput');
    const paletteList = document.getElementById('paletteList');
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';
    document.getElementById('paletteKey').textContent = shortcutLabel;
    document.getElementById('footerKey').textContent = shortcutLabel;

    // The contact address is defined once, in the contact section's mail link.
    const mailLink = document.querySelector('.contact-email');
    const mailHref = mailLink ? mailLink.getAttribute('href') : '';
    const contactAddress = mailHref.replace(/^mailto:/, '');

    const sectionLabels = {
        about: 'About', experience: 'Experience', education: 'Education', skills: 'Skills',
        projects: 'Projects', blogs: 'Writing', achievements: 'Achievements', contact: 'Contact'
    };
    const openExternal = url => window.open(url, '_blank', 'noopener');
    const copyText = async text => {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const temporary = document.createElement('textarea');
        temporary.value = text;
        temporary.style.position = 'fixed';
        temporary.style.opacity = '0';
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand('copy');
        temporary.remove();
        if (!copied) throw new Error('Clipboard unavailable');
    };
    const commands = [
        { group: 'Go to', label: 'Home', hint: 'top', run: () => navigate('home') },
        ...routeIds.map((id, index) => ({
            group: 'Go to', label: sectionLabels[id] || id, hint: String(index + 1).padStart(2, '0'), run: () => navigate(id)
        })),
        ...blogPosts.map(post => ({ group: 'Read', label: post.title, hint: `${post.readingTime} min`, run: () => navigate(`blogs/${post.slug}`) })),
        { group: 'Do', label: 'Toggle light / dark theme', hint: 'theme', run: toggleTheme },
        { group: 'Do', label: 'Copy email address', hint: 'clipboard', run: () => copyText(contactAddress).catch(() => {}) },
        { group: 'Do', label: 'Write an email', hint: 'mail app', run: () => { window.location.href = mailHref; } },
        { group: 'Do', label: 'Ask the portfolio FAQ', hint: 'faq', run: () => document.getElementById('faqLauncher').click() },
        { group: 'Open', label: 'GitHub', hint: 'VijayJoshi17', run: () => openExternal('https://github.com/VijayJoshi17') },
        { group: 'Open', label: 'LinkedIn', hint: 'profile', run: () => openExternal('https://www.linkedin.com/in/vijay-joshi-4b5474244/') },
        { group: 'Open', label: 'Data Science Portfolio', hint: 'datascienceportfol.io', run: () => openExternal('https://www.datascienceportfol.io/VijayJoshi') }
    ];
    let filtered = commands;
    let selected = 0;
    let lastFocus = null;

    function score(command, query) {
        if (!query) return 1;
        const text = `${command.group} ${command.label} ${command.hint}`.toLowerCase();
        if (text.includes(query)) return 2 + (command.label.toLowerCase().startsWith(query) ? 1 : 0);
        let position = 0;
        for (const character of query) {
            position = text.indexOf(character, position);
            if (position === -1) return 0;
            position++;
        }
        return 1;
    }

    function renderPalette() {
        const query = paletteInput.value.trim().toLowerCase();
        filtered = commands
            .map(command => ({ command, rank: score(command, query) }))
            .filter(item => item.rank > 0)
            .sort((first, second) => second.rank - first.rank)
            .map(item => item.command);
        selected = Math.min(selected, Math.max(0, filtered.length - 1));
        paletteList.innerHTML = '';
        if (!filtered.length) {
            const empty = document.createElement('li');
            empty.className = 'palette-empty';
            empty.textContent = 'No matches. Try "projects", "rag" or "theme".';
            paletteList.appendChild(empty);
            paletteInput.removeAttribute('aria-activedescendant');
            return;
        }
        let lastGroup = null;
        filtered.forEach((command, index) => {
            if (!query && command.group !== lastGroup) {
                const heading = document.createElement('li');
                heading.className = 'palette-group';
                heading.setAttribute('role', 'presentation');
                heading.textContent = command.group;
                paletteList.appendChild(heading);
                lastGroup = command.group;
            }
            const item = document.createElement('li');
            item.id = `palette-item-${index}`;
            item.className = 'palette-item';
            item.setAttribute('role', 'option');
            const label = document.createElement('span');
            label.textContent = command.label;
            const hint = document.createElement('span');
            hint.className = 'palette-hint';
            hint.textContent = command.hint;
            item.append(label, hint);
            item.addEventListener('mousemove', () => {
                if (selected !== index) { selected = index; updateSelection(); }
            });
            item.addEventListener('click', () => runCommand(index));
            paletteList.appendChild(item);
        });
        updateSelection();
    }

    function updateSelection() {
        paletteList.querySelectorAll('.palette-item').forEach(item => {
            const active = item.id === `palette-item-${selected}`;
            item.setAttribute('aria-selected', String(active));
            if (active) {
                paletteInput.setAttribute('aria-activedescendant', item.id);
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    function openPalette() {
        lastFocus = document.activeElement;
        palette.hidden = false;
        paletteInput.value = '';
        selected = 0;
        renderPalette();
        requestAnimationFrame(() => {
            palette.classList.add('open');
            paletteInput.focus();
        });
    }

    function closePalette() {
        palette.classList.remove('open');
        palette.hidden = true;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function runCommand(index) {
        const command = filtered[index];
        if (!command) return;
        closePalette();
        command.run();
    }

    document.getElementById('paletteBtn').addEventListener('click', openPalette);
    palette.addEventListener('click', event => {
        if (event.target.closest('[data-palette-close]')) closePalette();
    });
    paletteInput.addEventListener('input', () => { selected = 0; renderPalette(); });
    paletteInput.addEventListener('keydown', event => {
        const count = Math.max(1, filtered.length);
        if (event.key === 'ArrowDown') { event.preventDefault(); selected = (selected + 1) % count; updateSelection(); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); selected = (selected - 1 + count) % count; updateSelection(); }
        else if (event.key === 'Enter') { event.preventDefault(); runCommand(selected); }
        else if (event.key === 'Escape') { event.preventDefault(); closePalette(); }
        else if (event.key === 'Tab') { event.preventDefault(); }
    });
    document.addEventListener('keydown', event => {
        const active = document.activeElement;
        const typing = active && (/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable);
        if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            if (palette.hidden) openPalette(); else closePalette();
        } else if (event.key === '/' && !typing && palette.hidden) {
            event.preventDefault();
            openPalette();
        }
    });

    // ---------- Contact ----------
    const form = document.getElementById('contactForm');
    if (form) {
        const accessKey = (form.dataset.web3formsKey || '').trim();
        const submit = document.getElementById('contactSubmit');
        const note = document.getElementById('contactNote');
        const idleNote = accessKey
            ? 'Goes straight to Vijay’s inbox. He replies by email.'
            : 'Opens your mail client with this message filled in.';
        if (!accessKey) submit.textContent = 'Open in email app';
        note.textContent = idleNote;

        const mailtoFor = data => {
            const subject = encodeURIComponent(data.get('subject'));
            const body = encodeURIComponent(`${data.get('message')}\n\n- ${data.get('name')}${data.get('email') ? ` (${data.get('email')})` : ''}`);
            return `${mailHref}?subject=${subject}&body=${body}`;
        };

        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const data = new FormData(form);
            if (data.get('botcheck')) return;
            if (!accessKey) {
                window.location.href = mailtoFor(data);
                return;
            }
            submit.disabled = true;
            submit.textContent = 'Sending…';
            note.textContent = '';
            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        access_key: accessKey,
                        name: data.get('name'),
                        email: data.get('email'),
                        subject: `[Portfolio] ${data.get('subject')}`,
                        message: data.get('message'),
                        from_name: 'Portfolio contact form'
                    })
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok || !result.success) throw new Error(result.message || 'Send failed');
                form.reset();
                note.textContent = 'Sent ✓ Thanks! Vijay will reply by email.';
                submit.textContent = 'Send another';
            } catch (error) {
                note.textContent = 'Could not send right now. ';
                const fallback = document.createElement('a');
                fallback.className = 'ulink';
                fallback.href = mailtoFor(data);
                fallback.textContent = 'Email instead →';
                note.appendChild(fallback);
                submit.textContent = 'Try again';
            } finally {
                submit.disabled = false;
            }
        });
    }

    // ---------- Résumé: links appear only once the PDF is actually deployed ----------
    const resumeUrl = new URL('Vijay_Joshi_Resume.pdf', window.portfolioAssetBaseUrl).href;
    if (window.location.protocol.startsWith('http')) {
        fetch(resumeUrl, { method: 'HEAD' }).then(response => {
            const type = response.headers.get('content-type') || '';
            if (!response.ok || !type.includes('pdf')) return;
            document.querySelectorAll('[data-resume]').forEach(link => {
                link.href = resumeUrl;
                link.hidden = false;
                const item = link.closest('li');
                if (item) item.hidden = false;
            });
            commands.splice(1, 0, {
                group: 'Go to', label: 'Download résumé (PDF)', hint: 'resume cv', run: () => {
                    const link = document.createElement('a');
                    link.href = resumeUrl;
                    link.download = 'Vijay_Joshi_Resume.pdf';
                    link.click();
                }
            });
            window.portfolioResumeUrl = resumeUrl;
        }).catch(() => {});
    }

    const copyButton = document.getElementById('copyEmail');
    if (copyButton) {
        copyButton.addEventListener('click', async () => {
            const status = document.getElementById('copyEmailStatus');
            try {
                await copyText(contactAddress);
                status.textContent = 'Copied ✓';
            } catch (error) {
                status.textContent = 'Copy failed. Select the address instead.';
            }
            setTimeout(() => { status.textContent = ''; }, 2400);
        });
    }
}
