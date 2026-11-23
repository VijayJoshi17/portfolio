(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // ------------------------------------------------------------------
    // Fig. 1: MMR vs top-k similarity over a toy 2D embedding space
    // ------------------------------------------------------------------
    function initMmr() {
        const canvas = document.getElementById('mmrCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const stage = canvas.parentElement;
        const hint = document.getElementById('mmrHint');
        const lambdaInput = document.getElementById('mmrLambda');
        const lambdaOut = document.getElementById('mmrLambdaOut');
        const readout = document.getElementById('mmrReadout');
        const modeButtons = document.querySelectorAll('[data-mmr-mode]');

        const rng = mulberry32(17);
        const gauss = () => {
            let u = 0, v = 0;
            while (u === 0) u = rng();
            while (v === 0) v = rng();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        };

        // Topic clusters. Cluster A has a tight knot of near-duplicates next to the query.
        const clusters = [
            { name: 'pricing', x: 0.30, y: 0.36, spread: 0.065, count: 11 },
            { name: 'refunds', x: 0.74, y: 0.27, spread: 0.07, count: 11 },
            { name: 'shipping', x: 0.23, y: 0.76, spread: 0.07, count: 10 },
            { name: 'accounts', x: 0.78, y: 0.74, spread: 0.065, count: 10 },
            { name: 'billing', x: 0.52, y: 0.52, spread: 0.06, count: 9 }
        ];
        const docs = [];
        clusters.forEach((cluster, clusterIndex) => {
            for (let i = 0; i < cluster.count; i++) {
                docs.push({
                    x: Math.min(0.97, Math.max(0.03, cluster.x + gauss() * cluster.spread)),
                    y: Math.min(0.95, Math.max(0.05, cluster.y + gauss() * cluster.spread)),
                    cluster: clusterIndex
                });
            }
        });
        // Near-duplicate chunks: the classic reason top-k retrieval returns five copies of one paragraph.
        for (let i = 0; i < 6; i++) {
            docs.push({ x: 0.36 + gauss() * 0.012, y: 0.43 + gauss() * 0.012, cluster: 0 });
        }
        docs.forEach((doc, index) => {
            doc.id = `d${String(index + 1).padStart(2, '0')}`;
            doc.glow = 0;
            doc.rank = 0;
        });

        const K = 5;
        const sigma = 0.2;
        const sim = (ax, ay, bx, by) => {
            const dx = ax - bx, dy = ay - by;
            return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        };

        const state = {
            mode: 'mmr',
            lambda: 0.5,
            query: { x: 0.42, y: 0.4 },
            target: { x: 0.42, y: 0.4 },
            interacted: false,
            dragging: false,
            hover: null,
            t: 0,
            width: 0,
            height: 0,
            dpr: 1,
            colors: {},
            visible: true,
            selection: []
        };

        function readColors() {
            state.colors = {
                ink: cssVar('--ink'),
                muted: cssVar('--muted'),
                faint: cssVar('--faint'),
                accent: cssVar('--accent'),
                bg: cssVar('--bg'),
                mono: cssVar('--mono') || 'monospace'
            };
        }

        function select() {
            const q = state.query;
            const scored = docs.map((doc, index) => ({ index, rel: sim(q.x, q.y, doc.x, doc.y) }));
            if (state.mode === 'sim') {
                return scored.sort((a, b) => b.rel - a.rel).slice(0, K);
            }
            const chosen = [];
            const remaining = scored.slice();
            while (chosen.length < K && remaining.length) {
                let best = -Infinity, bestAt = 0;
                remaining.forEach((candidate, at) => {
                    const doc = docs[candidate.index];
                    let redundancy = 0;
                    chosen.forEach(picked => {
                        const other = docs[picked.index];
                        redundancy = Math.max(redundancy, sim(doc.x, doc.y, other.x, other.y));
                    });
                    const score = state.lambda * candidate.rel - (1 - state.lambda) * redundancy;
                    if (score > best) { best = score; bestAt = at; }
                });
                chosen.push(remaining.splice(bestAt, 1)[0]);
            }
            return chosen;
        }

        // Layout: map unit square to the canvas with padding.
        const pad = 22;
        const toX = u => pad + u * (state.width - pad * 2);
        const toY = v => pad + v * (state.height - pad * 2);
        const fromX = x => (x - pad) / (state.width - pad * 2);
        const fromY = y => (y - pad) / (state.height - pad * 2);

        function resize() {
            const rect = stage.getBoundingClientRect();
            state.dpr = Math.min(window.devicePixelRatio || 1, 2);
            state.width = rect.width;
            state.height = rect.height;
            canvas.width = Math.round(rect.width * state.dpr);
            canvas.height = Math.round(rect.height * state.dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            draw();
        }

        const ramp = ' .·:-=+*#%@';

        function draw() {
            const { width, height, dpr, colors } = state;
            if (!width) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

            const q = state.query;
            const cell = width < 520 ? 13 : 12;
            const cols = Math.floor(width / cell);
            const rows = Math.floor(height / cell);
            const offsetX = (width - cols * cell) / 2;
            const offsetY = (height - rows * cell) / 2;

            // Glyph field: query similarity at every cell, shimmering slightly over time.
            ctx.font = `${cell - 2}px ${colors.mono}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = colors.ink;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const px = offsetX + c * cell + cell / 2;
                    const py = offsetY + r * cell + cell / 2;
                    const s = sim(q.x, q.y, fromX(px), fromY(py));
                    const shimmer = reduceMotion ? 0 : 0.04 * Math.sin(state.t * 1.6 + c * 0.45 + r * 0.31);
                    const level = Math.max(0, Math.min(0.999, s * 0.92 + shimmer));
                    const glyph = ramp[Math.floor(level * ramp.length)];
                    if (glyph === ' ') continue;
                    ctx.globalAlpha = 0.1 + level * 0.42;
                    ctx.fillText(glyph, px, py);
                }
            }
            ctx.globalAlpha = 1;

            // Links from query to selected documents.
            const selection = state.selection;
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 1;
            selection.forEach(item => {
                const doc = docs[item.index];
                ctx.globalAlpha = 0.25 + 0.55 * doc.glow;
                ctx.beginPath();
                ctx.moveTo(toX(q.x), toY(q.y));
                ctx.lineTo(toX(doc.x), toY(doc.y));
                ctx.stroke();
            });
            ctx.globalAlpha = 1;

            // Documents.
            docs.forEach(doc => {
                const x = toX(doc.x), y = toY(doc.y);
                ctx.fillStyle = doc.glow > 0.05 ? colors.accent : colors.muted;
                ctx.beginPath();
                ctx.arc(x, y, 2 + doc.glow * 1.6, 0, Math.PI * 2);
                ctx.fill();
                if (doc.glow > 0.05) {
                    ctx.strokeStyle = colors.accent;
                    ctx.globalAlpha = doc.glow;
                    ctx.beginPath();
                    ctx.arc(x, y, 6 + doc.glow * 3, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            });

            // Rank labels.
            ctx.font = `500 11px ${colors.mono}`;
            ctx.textAlign = 'left';
            selection.forEach((item, rank) => {
                const doc = docs[item.index];
                const x = toX(doc.x) + 11, y = toY(doc.y) - 9;
                const label = `${rank + 1} ${doc.id}`;
                const w = ctx.measureText(label).width + 8;
                ctx.globalAlpha = doc.glow;
                ctx.fillStyle = colors.bg;
                ctx.fillRect(x - 4, y - 8, w, 15);
                ctx.fillStyle = colors.ink;
                ctx.fillText(label, x, y);
            });
            ctx.globalAlpha = 1;

            // Hover tooltip.
            if (state.hover !== null && !state.dragging) {
                const doc = docs[state.hover];
                const label = `${doc.id} · ${clusters[doc.cluster].name} · sim ${sim(q.x, q.y, doc.x, doc.y).toFixed(2)}`;
                ctx.font = `11px ${colors.mono}`;
                const w = ctx.measureText(label).width + 12;
                let x = toX(doc.x) + 10, y = toY(doc.y) + 14;
                if (x + w > width - 4) x = width - 4 - w;
                ctx.fillStyle = colors.ink;
                ctx.fillRect(x, y, w, 18);
                ctx.fillStyle = colors.bg;
                ctx.fillText(label, x + 6, y + 9.5);
            }

            // Query crosshair.
            const qx = toX(q.x), qy = toY(q.y);
            ctx.strokeStyle = colors.ink;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(qx - 11, qy); ctx.lineTo(qx - 4, qy);
            ctx.moveTo(qx + 4, qy); ctx.lineTo(qx + 11, qy);
            ctx.moveTo(qx, qy - 11); ctx.lineTo(qx, qy - 4);
            ctx.moveTo(qx, qy + 4); ctx.lineTo(qx, qy + 11);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(qx, qy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = colors.ink;
            ctx.fill();
            ctx.font = `500 11px ${colors.mono}`;
            ctx.fillText('query', qx + 9, qy + 14);
        }

        let lastReadout = '';
        function updateReadout() {
            const selection = state.selection;
            const relevance = selection.reduce((total, item) => total + item.rel, 0);
            const topics = new Set(selection.map(item => docs[item.index].cluster));
            const ids = selection.map(item => docs[item.index].id).join(' ');
            const text = `<span><b>${state.mode === 'mmr' ? 'MMR' : 'Top-k'}</b> → ${ids}</span><span>relevance <b>${relevance.toFixed(2)}</b></span><span>topics covered <b>${topics.size}/${clusters.length}</b></span>`;
            if (text !== lastReadout) {
                readout.innerHTML = text;
                lastReadout = text;
            }
        }

        let running = false;
        let lastTime = 0;
        function frame(now) {
            const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
            lastTime = now;
            state.t += dt;

            if (!state.interacted && !reduceMotion) {
                // Idle demo: the query wanders slowly through the space until someone touches it.
                state.target.x = 0.48 + 0.26 * Math.sin(state.t * 0.23);
                state.target.y = 0.5 + 0.22 * Math.sin(state.t * 0.31 + 1.2);
            }
            const ease = 1 - Math.pow(0.0015, dt);
            state.query.x += (state.target.x - state.query.x) * ease;
            state.query.y += (state.target.y - state.query.y) * ease;

            state.selection = select();
            const chosen = new Set(state.selection.map(item => item.index));
            docs.forEach((doc, index) => {
                const goal = chosen.has(index) ? 1 : 0;
                doc.glow += (goal - doc.glow) * Math.min(1, dt * 9);
            });

            draw();
            updateReadout();
            if (state.visible && !document.hidden) requestAnimationFrame(frame);
            else running = false;
        }
        function start() {
            if (running) return;
            running = true;
            lastTime = performance.now();
            requestAnimationFrame(frame);
        }

        function pointerToQuery(event) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: Math.min(1, Math.max(0, fromX(event.clientX - rect.left))),
                y: Math.min(1, Math.max(0, fromY(event.clientY - rect.top)))
            };
        }
        function markInteracted() {
            if (!state.interacted) {
                state.interacted = true;
                hint.classList.add('gone');
            }
        }
        canvas.addEventListener('pointerdown', event => {
            markInteracted();
            state.dragging = true;
            canvas.setPointerCapture(event.pointerId);
            state.target = pointerToQuery(event);
            start();
        });
        canvas.addEventListener('pointermove', event => {
            const point = pointerToQuery(event);
            if (state.dragging) {
                state.target = point;
            } else {
                let nearest = null, best = 14;
                docs.forEach((doc, index) => {
                    const d = Math.hypot(toX(doc.x) - toX(point.x), toY(doc.y) - toY(point.y));
                    if (d < best) { best = d; nearest = index; }
                });
                state.hover = nearest;
                canvas.style.cursor = nearest !== null ? 'help' : 'crosshair';
            }
            start();
        });
        const endDrag = () => { state.dragging = false; };
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);
        canvas.addEventListener('pointerleave', () => { state.hover = null; start(); });

        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                state.mode = button.dataset.mmrMode;
                modeButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
                document.getElementById('mmrFig').classList.toggle('mode-sim', state.mode === 'sim');
                start();
            });
        });
        lambdaInput.addEventListener('input', () => {
            state.lambda = parseFloat(lambdaInput.value);
            lambdaOut.textContent = state.lambda.toFixed(2);
            if (state.mode !== 'mmr') modeButtons.forEach(b => b.dataset.mmrMode === 'mmr' && b.click());
            start();
        });

        readColors();
        window.addEventListener('themechange', () => { readColors(); start(); });
        if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
        else window.addEventListener('resize', resize);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                state.visible = entries[0].isIntersecting;
                if (state.visible) start();
            }).observe(canvas);
        }
        document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { readColors(); start(); });
        resize();
        start();
    }

    // ------------------------------------------------------------------
    // Hero: scrambled word rotation
    // ------------------------------------------------------------------
    function initRotator() {
        const element = document.getElementById('heroRotator');
        if (!element || reduceMotion) return;
        const words = element.dataset.words.split('|');
        const glyphs = 'abcdefghijklmnopqrstuvwxyz01<>/=+*';
        let index = 0;

        function scrambleTo(word) {
            const from = element.textContent;
            const length = Math.max(from.length, word.length);
            const queue = [];
            for (let i = 0; i < length; i++) {
                const start = Math.floor(Math.random() * 12);
                queue.push({ from: from[i] || '', to: word[i] || '', start, end: start + 10 + Math.floor(Math.random() * 14) });
            }
            let frameIndex = 0;
            function step() {
                let output = '';
                let done = 0;
                queue.forEach(item => {
                    if (frameIndex >= item.end) { done++; output += item.to; }
                    else if (frameIndex >= item.start) output += glyphs[Math.floor(Math.random() * glyphs.length)];
                    else output += item.from;
                });
                element.textContent = output;
                if (done < queue.length) { frameIndex++; requestAnimationFrame(step); }
            }
            step();
        }

        setInterval(() => {
            if (document.hidden) return;
            index = (index + 1) % words.length;
            scrambleTo(words[index]);
        }, 2800);
    }

    // ------------------------------------------------------------------
    // Count-up numbers
    // ------------------------------------------------------------------
    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const format = element => value => {
            const decimals = parseInt(element.dataset.decimals || '0', 10);
            return `${element.dataset.prefix || ''}${value.toFixed(decimals)}${element.dataset.suffix || ''}`;
        };
        if (reduceMotion || !('IntersectionObserver' in window)) return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                const element = entry.target;
                const target = parseFloat(element.dataset.count);
                const render = format(element);
                const duration = 1300;
                const begin = performance.now();
                function tick(now) {
                    const progress = Math.min(1, (now - begin) / duration);
                    const eased = 1 - Math.pow(1 - progress, 4);
                    element.textContent = render(target * eased);
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.6 });
        counters.forEach(element => {
            element.textContent = format(element)(0);
            observer.observe(element);
        });
    }

    // ------------------------------------------------------------------
    // Contact: Vijay's local time
    // ------------------------------------------------------------------
    function initClock() {
        const element = document.getElementById('localTime');
        if (!element) return;
        const formatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
        function update() {
            const time = formatter.format(new Date());
            const hour = parseInt(time.slice(0, 2), 10);
            const mood = hour < 7 ? 'probably asleep, replies in the morning' : hour < 10 ? 'probably on the first coffee' : hour < 19 ? 'probably building something' : hour < 23 ? 'probably reading papers' : 'probably still debugging';
            element.innerHTML = `<span class="live-dot" aria-hidden="true"></span>It's <b>${time}</b> in Ahmedabad (IST), ${mood}.`;
        }
        update();
        setInterval(update, 30000);
    }

    function boot() {
        initMmr();
        initRotator();
        initCounters();
        initClock();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
