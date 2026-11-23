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
    function initMmr(fig) {
        const canvas = fig.querySelector('.mmr-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const stage = canvas.parentElement;
        const hint = fig.querySelector('.mmr-hint');
        const lambdaInput = fig.querySelector('.mmr-lambda input');
        const lambdaOut = fig.querySelector('.mmr-lambda output');
        const readout = fig.querySelector('.mmr-readout');
        const modeButtons = fig.querySelectorAll('[data-mmr-mode]');

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
            const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000) || 0.016);
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
            if (state.visible && !document.hidden && canvas.isConnected) requestAnimationFrame(frame);
            else running = false;
        }
        function start() {
            if (running || !canvas.isConnected) return;
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
                fig.classList.toggle('mode-sim', state.mode === 'sim');
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
            const number = element.dataset.group ? Number(value.toFixed(decimals)).toLocaleString('en-US', { minimumFractionDigits: decimals }) : value.toFixed(decimals);
            return `${element.dataset.prefix || ''}${number}${element.dataset.suffix || ''}`;
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

    // ------------------------------------------------------------------
    // Shared helpers for the self-assembling figures
    // ------------------------------------------------------------------
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const escapeHtml = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const svgEl = (tag, attrs = {}) => {
        const node = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
        return node;
    };
    const figHead = (fig, fallbackNum, fallbackTitle) =>
        `<div class="fig-head"><span class="fig-num">${escapeHtml(fig.dataset.figNum || fallbackNum)}</span><span class="fig-title">${escapeHtml(fig.dataset.figTitle || fallbackTitle)}</span></div>`;
    const smooth = (a, b, x) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
    };

    // Runs step(dt) every frame while the element is on screen and attached.
    function runWhileVisible(root, step) {
        let running = false, visible = true, last = 0;
        function frame(now) {
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
            last = now;
            step(dt);
            if (visible && !document.hidden && root.isConnected) requestAnimationFrame(frame);
            else running = false;
        }
        function start() {
            if (running || reduceMotion || !root.isConnected) return;
            running = true;
            last = performance.now();
            requestAnimationFrame(frame);
        }
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                visible = entries[0].isIntersecting;
                if (visible) start();
            }).observe(root);
        }
        document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
        start();
    }

    const templates = {
        mmr: fig => {
            const link = fig.dataset.figLink;
            const base = window.portfolioBasePath || '';
            return `
            <div class="mmr-stage">
                <canvas class="mmr-canvas" role="img" aria-label="Interactive figure: a field of characters shows how similar each point of a toy embedding space is to a query. Five documents are selected by either top-k similarity or maximal marginal relevance."></canvas>
                <span class="mmr-hint" aria-hidden="true">click or drag to move the query</span>
            </div>
            <figcaption class="fig-caption">
                ${figHead(fig, 'Fig.', 'Retrieval in a toy embedding space')}
                <div class="mmr-controls">
                    <div class="seg-toggle" role="group" aria-label="Selection strategy">
                        <button type="button" data-mmr-mode="sim" aria-pressed="false">Top-k similarity</button>
                        <button type="button" data-mmr-mode="mmr" aria-pressed="true">MMR</button>
                    </div>
                    <label class="mmr-lambda"><span>λ</span><input type="range" min="0" max="1" step="0.05" value="0.5" aria-label="MMR lambda: relevance versus diversity"><output>0.50</output></label>
                </div>
                <div class="mmr-readout" aria-live="polite"></div>
                <p class="fig-note">Each glyph is the query's similarity at that point. Top-k grabs the near-duplicates; MMR trades a little relevance for coverage.${link ? ` <a class="ulink" href="${base}/${escapeHtml(link)}" data-route="${escapeHtml(link)}">Read the post →</a>` : ''}</p>
            </figcaption>`;
        },

        grader: fig => `
            <div class="grader-stage">
                <svg class="grader" viewBox="0 0 640 232" role="img" aria-label="Interactive chart: sixty answers placed along an LLM judge's score, in two rows by human label. A threshold line decides which answers pass.">
                    <rect class="gr-pass-zone" y="24" height="174"></rect>
                    <line class="gr-mid" x1="40" x2="600" y1="120" y2="120"></line>
                    <text class="gr-lane" x="40" y="38">human label: good</text>
                    <text class="gr-lane" x="40" y="136">human label: bad</text>
                    <g class="gr-axis">
                        ${[0, 0.25, 0.5, 0.75, 1].map(v => `<line x1="${40 + v * 560}" x2="${40 + v * 560}" y1="198" y2="203"></line><text x="${40 + v * 560}" y="216" text-anchor="middle">${v.toFixed(2)}</text>`).join('')}
                        <text x="600" y="230" text-anchor="end">judge score →</text>
                    </g>
                    <g class="gr-dots"></g>
                    <line class="gr-th" y1="20" y2="200"></line>
                    <text class="gr-th-label" y="14" text-anchor="middle"></text>
                </svg>
            </div>
            <figcaption class="fig-caption">
                ${figHead(fig, 'Interactive', 'A toy LLM judge versus human labels')}
                <div class="mmr-controls">
                    <label class="mmr-lambda"><span>pass ≥</span><input type="range" min="0.2" max="0.9" step="0.01" value="0.55" aria-label="Pass threshold"><output>0.55</output></label>
                    <div class="seg-toggle" role="group" aria-label="Judge quality">
                        <button type="button" data-noise="sharp" aria-pressed="true">Calibrated</button>
                        <button type="button" data-noise="noisy" aria-pressed="false">Noisy</button>
                    </div>
                    <button type="button" class="chip-toggle" data-bias aria-pressed="false">+ length bias</button>
                </div>
                <div class="mmr-readout gr-readout" aria-live="polite"></div>
                <div class="legend gr-legend"><span><i class="gl ok"></i>correct pass</span><span><i class="gl ff"></i>false fail</span><span><i class="gl fp"></i>false pass</span><span><i class="gl rj"></i>correct reject</span><span><i class="gl lg"></i>long answer</span></div>
                <p class="fig-note">Sixty answers humans have already labelled, scored by a simulated judge. Every threshold trades false passes for false fails. Noise, or a taste for long answers, makes every threshold worse, which is why the judge itself needs testing against human labels.</p>
            </figcaption>`,

        drowsy: fig => `
            <div class="drowsy-stage">
                <svg class="drowsy" viewBox="0 0 640 200" role="img" aria-label="Animated, simulated driver monitor: a line-art face blinks and sometimes nods off. A chart of the model's drowsiness probability crosses the alert threshold only during sustained eye closure with a head tilt.">
                    <g transform="translate(100 104)">
                        <g class="dz-head">
                            <circle class="dz-outline" r="58"></circle>
                            <path class="dz-outline" d="M-50 -28 C -38 -72, 38 -72, 50 -28"></path>
                            <g transform="translate(-22 -6)"><ellipse class="dz-eye" rx="13" ry="7"></ellipse><circle class="dz-pupil" r="3.4"></circle><line class="dz-lid" x1="-14" x2="14"></line></g>
                            <g transform="translate(22 -6)"><ellipse class="dz-eye" rx="13" ry="7"></ellipse><circle class="dz-pupil" r="3.4"></circle><line class="dz-lid" x1="-14" x2="14"></line></g>
                            <path class="dz-outline" d="M-12 28 Q 0 33 12 28"></path>
                        </g>
                        <text class="dz-small" y="86" text-anchor="middle">camera frame</text>
                    </g>
                    <rect class="dz-frame" x="210" y="24" width="410" height="146"></rect>
                    <line class="dz-th" x1="210" x2="620" y1="${(170 - 0.7 * 146).toFixed(1)}" y2="${(170 - 0.7 * 146).toFixed(1)}"></line>
                    <text class="dz-small" x="614" y="${(170 - 0.7 * 146 - 6).toFixed(1)}" text-anchor="end">alert threshold 0.70</text>
                    <path class="dz-area"></path>
                    <polyline class="dz-line"></polyline>
                    <text class="dz-small" x="210" y="16">p(drowsy), last 8 s</text>
                    <text class="dz-small" x="210" y="188">−8 s</text>
                    <text class="dz-small" x="620" y="188" text-anchor="end">now</text>
                    <g class="dz-alert"><rect x="478" y="32" width="134" height="22" rx="2"></rect><text x="545" y="47" text-anchor="middle">DROWSY · ALERT</text></g>
                </svg>
            </div>
            <figcaption class="fig-caption">
                ${figHead(fig, 'Fig.', 'Blinks vs. nodding off')}
                <div class="mmr-readout dz-readout" aria-live="off"></div>
                <p class="fig-note">A normal blink barely moves the model's output; sustained eye closure plus a head tilt pushes it past the alert threshold. The signals here are simulated to show the behaviour, not recorded data.</p>
            </figcaption>`,

        tweets: fig => `
            <div class="tw-stage">
                <div class="tw-card">
                    <span class="tw-handle">@someone · just now</span>
                    <p class="tw-text"></p>
                </div>
                <div class="tw-meter">
                    <span class="tw-label">p(disaster)</span>
                    <span class="tw-bar"><i></i><b></b></span>
                    <output class="tw-p">0.00</output>
                </div>
                <div class="tw-row">
                    <span class="tw-verdict" aria-live="polite"></span>
                    <button type="button" class="chip-toggle tw-next">next tweet ↻</button>
                </div>
                <ol class="tw-log" aria-label="Recent classifications"></ol>
            </div>
            <figcaption class="fig-caption">
                ${figHead(fig, 'Fig.', 'Fire, but which kind?')}
                <div class="legend"><span><span class="tw-cue">cue word</span></span><span><span class="tw-amb">ambiguous word</span></span></div>
                <p class="fig-note">The same words (fire, drowning, wreck) turn up in both classes, so the classifier has to read the context. Example tweets and scores are illustrative; the trained model reached 98.52% test accuracy with a Random Forest.</p>
            </figcaption>`
    };

    // ------------------------------------------------------------------
    // Interactive: LLM judge vs. human labels (LLM Evals post)
    // ------------------------------------------------------------------
    function initGrader(fig) {
        const svg = fig.querySelector('.grader');
        const dotsLayer = svg.querySelector('.gr-dots');
        const zone = svg.querySelector('.gr-pass-zone');
        const line = svg.querySelector('.gr-th');
        const lineLabel = svg.querySelector('.gr-th-label');
        const slider = fig.querySelector('.mmr-lambda input');
        const output = fig.querySelector('.mmr-lambda output');
        const readout = fig.querySelector('.gr-readout');
        const noiseButtons = fig.querySelectorAll('[data-noise]');
        const biasButton = fig.querySelector('[data-bias]');

        const rng = mulberry32(7);
        const gauss = () => {
            let u = 0, v = 0;
            while (u === 0) u = rng();
            while (v === 0) v = rng();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        };
        const items = Array.from({ length: 60 }, () => {
            const good = rng() < 0.55;
            const long = rng() < 0.35;
            return {
                good, long,
                base: good ? 0.66 + gauss() * 0.08 : 0.4 + gauss() * 0.08,
                eps: gauss(),
                jitter: (rng() - 0.5) * 44
            };
        });
        items.forEach(item => {
            item.node = svgEl('g', { class: 'gr-dot' });
            if (item.long) item.node.appendChild(svgEl('circle', { r: 8.5, class: 'gr-ring' }));
            item.node.appendChild(svgEl('circle', { r: 5, class: 'gr-core' }));
            dotsLayer.appendChild(item.node);
        });

        const state = { th: 0.55, noise: 'sharp', bias: false };
        const X = score => 40 + Math.min(1, Math.max(0, score)) * 560;

        function update() {
            const counts = { ok: 0, ff: 0, fp: 0, rj: 0 };
            items.forEach(item => {
                const score = item.base + (state.noise === 'noisy' ? 0.17 : 0.045) * item.eps + (state.bias && item.long ? 0.2 : 0);
                const pass = score >= state.th;
                const kind = item.good ? (pass ? 'ok' : 'ff') : (pass ? 'fp' : 'rj');
                counts[kind]++;
                item.node.setAttribute('class', `gr-dot ${kind}`);
                item.node.style.transform = `translate(${X(score).toFixed(1)}px, ${((item.good ? 78 : 164) + item.jitter).toFixed(1)}px)`;
            });
            const x = X(state.th);
            line.setAttribute('x1', x); line.setAttribute('x2', x);
            zone.setAttribute('x', x); zone.setAttribute('width', Math.max(0, 600 - x));
            lineLabel.setAttribute('x', x);
            lineLabel.textContent = `pass ≥ ${state.th.toFixed(2)}`;
            output.textContent = state.th.toFixed(2);
            const passRate = (counts.ok + counts.fp) / items.length;
            const agreement = (counts.ok + counts.rj) / items.length;
            readout.innerHTML = `<span>pass rate <b>${Math.round(passRate * 100)}%</b></span><span>agrees with humans <b>${Math.round(agreement * 100)}%</b></span><span>false passes <b class="acc">${counts.fp}</b></span><span>false fails <b>${counts.ff}</b></span>`;
        }

        slider.addEventListener('input', () => { state.th = parseFloat(slider.value); update(); });
        noiseButtons.forEach(button => button.addEventListener('click', () => {
            state.noise = button.dataset.noise;
            noiseButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
            update();
        }));
        biasButton.addEventListener('click', () => {
            state.bias = !state.bias;
            biasButton.setAttribute('aria-pressed', String(state.bias));
            update();
        });
        update();
    }

    // ------------------------------------------------------------------
    // Fig. 4: simulated driver monitor (drowsiness detection project)
    // ------------------------------------------------------------------
    function initDrowsy(fig) {
        const svg = fig.querySelector('.drowsy');
        const head = svg.querySelector('.dz-head');
        const eyes = svg.querySelectorAll('.dz-eye');
        const pupils = svg.querySelectorAll('.dz-pupil');
        const lids = svg.querySelectorAll('.dz-lid');
        const polyline = svg.querySelector('.dz-line');
        const area = svg.querySelector('.dz-area');
        const alert = svg.querySelector('.dz-alert');
        const readout = fig.querySelector('.dz-readout');

        const period = 14;
        const blinks = [1.5, 4.2, 6.8, 13.1];
        const openness = tm => {
            for (const b of blinks) if (tm >= b && tm < b + 0.2) return 0.06;
            if (tm >= 8.6 && tm < 9.6) return 1 - 0.85 * smooth(8.6, 9.6, tm);
            if (tm >= 9.6 && tm < 11.8) return 0.15 + 0.04 * Math.sin(tm * 9);
            if (tm >= 11.8 && tm < 12.3) return 0.15 + 0.85 * smooth(11.8, 12.3, tm);
            return 1;
        };
        const tilt = tm => 16 * smooth(8.9, 10.2, tm) * (1 - smooth(11.7, 12.4, tm));

        const samples = 240;
        const history = new Array(samples).fill(0.05);
        let t = 0, closure = 0, sampleClock = 0, p = 0.05;

        function step(dt) {
            t += dt;
            const tm = t % period;
            const open = openness(tm);
            const angle = tilt(tm);
            closure = open < 0.35 ? Math.min(2.2, closure + dt) : Math.max(0, closure - dt * 2);
            const target = 0.04 + 0.86 / (1 + Math.exp(-5 * (closure - 0.75))) + (angle / 16) * 0.1;
            p += (Math.min(0.99, target) - p) * Math.min(1, dt * 6);
            sampleClock += dt;
            while (sampleClock >= 1 / 30) {
                sampleClock -= 1 / 30;
                history.push(p + Math.sin(t * 13) * 0.008);
                history.shift();
            }
            return { open, angle };
        }

        function render({ open, angle }) {
            head.setAttribute('transform', `translate(0 ${(angle * 0.5).toFixed(2)}) rotate(${angle.toFixed(2)})`);
            eyes.forEach(eye => eye.setAttribute('ry', Math.max(0.6, 7 * open).toFixed(2)));
            pupils.forEach(pupil => pupil.setAttribute('opacity', open > 0.35 ? 1 : 0));
            lids.forEach(lid => lid.setAttribute('opacity', open < 0.35 ? 1 : 0));
            const pts = history.map((value, i) => `${(210 + i * 410 / (samples - 1)).toFixed(1)},${(170 - Math.min(1, value) * 146).toFixed(1)}`);
            polyline.setAttribute('points', pts.join(' '));
            area.setAttribute('d', `M210,170 L${pts.join(' L')} L620,170 Z`);
            const on = p >= 0.7;
            alert.classList.toggle('on', on);
            fig.classList.toggle('alerting', on);
            readout.innerHTML = `<span>eye openness <b>${open.toFixed(2)}</b></span><span>head tilt <b>${Math.round(angle)}°</b></span><span>p(drowsy) <b class="${on ? 'acc' : ''}">${p.toFixed(2)}</b></span>`;
        }

        if (reduceMotion) {
            // Static frame: simulate up to the middle of a drowsy episode.
            let last;
            for (let i = 0; i < 11.2 * 30; i++) last = step(1 / 30);
            render(last);
            return;
        }
        // Warm up so the chart starts full.
        for (let i = 0; i < 4 * 30; i++) step(1 / 30);
        runWhileVisible(svg, dt => render(step(dt)));
    }

    // ------------------------------------------------------------------
    // Fig. 5: disaster tweets, literal vs. figurative
    // ------------------------------------------------------------------
    function initTweets(fig) {
        const tweets = [
            { text: 'Wildfire jumped the highway overnight, three villages evacuated', p: 0.97, cue: ['wildfire', 'evacuated', 'highway'], amb: [] },
            { text: 'This new album is straight fire, my speakers are ablaze', p: 0.06, cue: [], amb: ['fire', 'ablaze'] },
            { text: 'Flood water rising fast near the river bridge, avoid the area', p: 0.94, cue: ['flood', 'rising', 'bridge'], amb: [] },
            { text: "I'm drowning in assignments this week lol", p: 0.09, cue: [], amb: ['drowning'] },
            { text: 'Magnitude 6.1 earthquake felt across the region, buildings damaged', p: 0.98, cue: ['magnitude', 'earthquake', 'damaged'], amb: [] },
            { text: 'That exam was a total train wreck', p: 0.21, cue: [], amb: ['wreck'] },
            { text: 'Smoke everywhere after the factory fire, roads closed', p: 0.91, cue: ['smoke', 'roads', 'closed'], amb: ['fire'] }
        ];
        const textNode = fig.querySelector('.tw-text');
        const fill = fig.querySelector('.tw-bar i');
        const out = fig.querySelector('.tw-p');
        const verdict = fig.querySelector('.tw-verdict');
        const log = fig.querySelector('.tw-log');
        const next = fig.querySelector('.tw-next');
        let index = -1, timer = null, valueTimer = null, paused = false, visible = true;

        function show() {
            if (!fig.isConnected) return;
            index = (index + 1) % tweets.length;
            const tweet = tweets[index];
            textNode.innerHTML = '';
            tweet.text.split(/(\s+)/).forEach((part, i) => {
                if (/^\s+$/.test(part)) { textNode.appendChild(document.createTextNode(part)); return; }
                const word = part.toLowerCase().replace(/[^a-z0-9']/g, '');
                const span = document.createElement('span');
                span.textContent = part;
                span.className = `tw-word${tweet.cue.includes(word) ? ' tw-cue' : tweet.amb.includes(word) ? ' tw-amb' : ''}`;
                span.style.animationDelay = `${i * 28}ms`;
                textNode.appendChild(span);
            });
            fill.style.transition = 'none';
            fill.style.width = '0%';
            out.textContent = '0.00';
            verdict.className = 'tw-verdict';
            verdict.textContent = 'classifying…';
            clearInterval(valueTimer);
            setTimeout(() => {
                fill.style.transition = '';
                fill.style.width = `${tweet.p * 100}%`;
                fill.classList.toggle('hot', tweet.p >= 0.5);
                const begin = performance.now();
                valueTimer = setInterval(() => {
                    const k = Math.min(1, (performance.now() - begin) / 900);
                    out.textContent = (tweet.p * (1 - Math.pow(1 - k, 3))).toFixed(2);
                    if (k >= 1) clearInterval(valueTimer);
                }, 40);
            }, reduceMotion ? 0 : 700);
            setTimeout(() => {
                const disaster = tweet.p >= 0.5;
                verdict.className = `tw-verdict ${disaster ? 'yes' : 'no'}`;
                verdict.textContent = disaster ? 'Disaster' : 'Not a disaster';
                const item = document.createElement('li');
                item.className = disaster ? 'yes' : 'no';
                item.textContent = `${disaster ? 'disaster' : 'not'} ${tweet.p.toFixed(2)} · ${tweet.text.slice(0, 34)}…`;
                log.prepend(item);
                while (log.children.length > 4) log.lastChild.remove();
            }, reduceMotion ? 0 : 1650);
        }
        function schedule() {
            clearTimeout(timer);
            if (reduceMotion || paused || !visible || !fig.isConnected) return;
            timer = setTimeout(() => { if (!document.hidden) show(); schedule(); }, 3800);
        }
        next.addEventListener('click', () => { show(); schedule(); });
        fig.addEventListener('mouseenter', () => { paused = true; clearTimeout(timer); });
        fig.addEventListener('mouseleave', () => { paused = false; schedule(); });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                visible = entries[0].isIntersecting;
                if (visible) schedule(); else clearTimeout(timer);
            }).observe(fig);
        }
        show();
        schedule();
    }

    const initializers = { mmr: initMmr, grader: initGrader, drowsy: initDrowsy, tweets: initTweets };

    function initFigures(scope) {
        scope.querySelectorAll('[data-figure]:not([data-ready])').forEach(fig => {
            const name = fig.dataset.figure;
            if (!initializers[name]) return;
            fig.dataset.ready = 'true';
            if (!fig.children.length && templates[name]) fig.innerHTML = templates[name](fig);
            initializers[name](fig);
        });
    }
    window.initFigures = initFigures;

    function boot() {
        initFigures(document);
        window.addEventListener('routechange', () => initFigures(document));
        initRotator();
        initCounters();
        initClock();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
