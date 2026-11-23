/* =========================================================
   "Ask my portfolio": a small retrieval engine, no LLM.

   1. The site's own text (sections + blog posts) is split into passages.
   2. Questions are tokenized, stemmed, typo-corrected and expanded with synonyms.
   3. BM25 ranks passages; MMR picks a relevant but non-redundant top 3.
   4. Answers quote the passages verbatim, with links back to the source.
   ========================================================= */

const portfolioFaqs = [
    {
        question: 'What does Vijay specialize in?',
        answer: 'Vijay is an AI Engineer in Ahmedabad focused on machine learning, deep learning, LLMs, RAG, computer vision, and scalable systems. He currently builds intelligent systems at AIVantage.',
        links: [{ label: 'About Vijay', route: 'about' }]
    },
    {
        question: 'What projects has Vijay built?',
        answer: 'Featured work includes a local multi-agent RAG system using LangGraph, Ollama, and Qdrant; a CNN-based drowsiness detector; and a disaster-tweet classifier.',
        links: [
            { label: 'See projects', route: 'projects' },
            { label: 'GitHub', href: 'https://github.com/VijayJoshi17' }
        ]
    },
    {
        question: 'What technologies does Vijay use?',
        answer: 'His toolkit includes Python, PyTorch, TensorFlow, LangChain, LangGraph, RAG frameworks, vector databases, FastAPI, Docker, and cloud platforms.',
        links: [{ label: 'View skills', route: 'skills' }]
    },
    {
        question: 'How can I contact Vijay?',
        answer: 'Vijay is open to opportunities in AI/ML and Data Science. You can email him or use the contact section.',
        links: [
            { label: 'Contact section', route: 'contact' },
            { label: 'Email Vijay', mail: true }
        ]
    }
];

const starterQuestions = ['What is MMR?', 'Where has he used computer vision?'];

const followUps = {
    about: ['What is he working on now?', 'What are his biggest results?'],
    experience: ['What did he do at Kevision Systems?', 'How much time did his automation save?'],
    education: ['What was his GPA?', 'Where did he study?'],
    skills: ['Which vector databases does he know?', 'Does he know cloud platforms?'],
    projects: ['How does the RAG system reduce hallucinations?', 'Which projects have a live demo?'],
    blogs: ['What is MMR?', 'How should LLM apps be evaluated?'],
    achievements: ['How did he do on Kaggle?', 'What clubs was he part of?'],
    contact: ['Is he open to new roles?', 'What does Vijay specialize in?']
};

const sectionNames = {
    about: '§01 About', experience: '§02 Experience', education: '§03 Education', skills: '§04 Skills',
    projects: '§05 Projects', blogs: '§06 Writing', achievements: '§07 Achievements', contact: '§08 Contact'
};

const STOPWORDS = new Set(('a an and are as at be been but by can could did do does done for from had has have he her him his how i if in into is it its just me my of on or our she so than that the their them then there these they this those to tell us was we were what when where which who whom why will with would you your yours about show give know any some much many vijay joshi joshi\'s vijay\'s please also more')
    .split(/\s+/));

const SYNONYMS = {
    cv: ['resume', 'experience'], resume: ['experience', 'education'], hire: ['opportunity', 'contact'], hiring: ['opportunity', 'contact'],
    job: ['experience', 'opportunity'], role: ['experience', 'opportunity'], work: ['experience'], company: ['experience'], employer: ['experience'],
    based: ['ahmedabad', 'india'], live: ['ahmedabad'], city: ['ahmedabad'],
    college: ['university', 'education'], university: ['education', 'b.tech'], degree: ['b.tech', 'education'], btech: ['b.tech'],
    study: ['education', 'b.tech', 'university'], school: ['secondary'], cgpa: ['gpa'], grade: ['gpa', 'percentage'],
    tech: ['skill', 'stack'], stack: ['skill'], tool: ['skill', 'platform'], technology: ['skill', 'stack'], language: ['programming'],
    llm: ['language', 'model'], genai: ['llm', 'rag'], ml: ['machine', 'learning'], dl: ['deep', 'learning'],
    vision: ['opencv', 'detection', 'image'], nlp: ['tweet', 'text'], chatbot: ['rag', 'llm'], retrieval: ['rag', 'search'],
    search: ['retrieval'], vector: ['qdrant', 'faiss', 'embedding'], database: ['vector', 'mysql', 'postgresql'],
    agentic: ['agent'], email: ['contact', 'email'], mail: ['email'], reach: ['contact', 'email'], contact: ['email', 'linkedin'],
    github: ['code'], code: ['github'], demo: ['live', 'demo'], blog: ['writing', 'post'], article: ['post', 'writing'], wrote: ['writing'],
    award: ['achievement', 'kaggle', 'rank'], achievement: ['award', 'rank'], competition: ['kaggle'], rank: ['percentile', 'rank'],
    cloud: ['azure', 'aws', 'gcp'], deploy: ['docker', 'deployment', 'production'], mlops: ['mlflow', 'docker'],
    now: ['present', 'currently'], current: ['present', 'currently'], currently: ['present'],
    result: ['reduc', 'improv', 'accuracy'], impact: ['reduc', 'improv', 'saving'], club: ['leadership', 'club'],
    open: ['opportunity'], new: ['opportunity'], eval: ['evalu'], hallucination: ['hallucination', 'verification']
};

// Words that mean something other than their literal text: searched only via their rewrite.
const REWRITES = {
    based: ['ahmedabad', 'india', 'location'], located: ['ahmedabad', 'india'], location: ['ahmedabad', 'india'],
    now: ['present', 'currently', 'aivantage'], currently: ['present', 'currently', 'aivantage'], current: ['present', 'currently', 'aivantage'],
    biggest: ['result', 'impact', 'saving', 'reduc'], best: ['result', 'impact', 'accuracy'], proud: ['result', 'achievement']
};

// Topics the portfolio deliberately doesn't cover: answer honestly instead of retrieving noise.
const OUT_OF_SCOPE = /\b(salary|salaries|ctc|compensation|pay|package|stipend|notice period|visa|relocat\w*|age|married|phone|number|address|religion|caste)\b/i;

function stemToken(word) {
    let w = word;
    if (w.length <= 3) return w;
    if (w.endsWith('ies') && w.length > 4) w = `${w.slice(0, -3)}y`;
    else if (/(sses|xes|ches|shes)$/.test(w)) w = w.slice(0, -2);
    else if (w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
    if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
    else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
    if (w.endsWith('ation') && w.length > 7) w = w.slice(0, -5);
    else if (w.endsWith('e') && w.length > 3) w = w.slice(0, -1);
    if (w.endsWith('at') && w.length > 5) w = w.slice(0, -2);
    return w;
}

function rawWords(text) {
    return (String(text).toLowerCase().match(/[a-z0-9+#.']+/g) || [])
        .map(word => word.replace(/^[.']+|[.']+$/g, '').replace(/'s$/, ''))
        .filter(Boolean);
}

function tokenize(text) {
    return rawWords(text).filter(word => !STOPWORDS.has(word)).map(stemToken);
}

function editDistance(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
            rowMin = Math.min(rowMin, current[j]);
        }
        if (rowMin > limit) return limit + 1;
        previous = current;
    }
    return previous[b.length];
}

class PortfolioIndex {
    constructor(chunks) {
        this.k1 = 1.2;
        this.b = 0.75;
        this.chunks = chunks;
        this.df = new Map();
        chunks.forEach(chunk => {
            chunk.terms = tokenize(chunk.indexText);
            chunk.tf = new Map();
            chunk.terms.forEach(term => chunk.tf.set(term, (chunk.tf.get(term) || 0) + 1));
            chunk.tf.forEach((_, term) => this.df.set(term, (this.df.get(term) || 0) + 1));
        });
        this.N = chunks.length;
        this.avgdl = chunks.reduce((total, chunk) => total + chunk.terms.length, 0) / Math.max(1, this.N);
        // Unit-length tf-idf vectors for MMR's passage-to-passage similarity.
        chunks.forEach(chunk => {
            chunk.vec = new Map();
            let norm = 0;
            chunk.tf.forEach((count, term) => {
                const weight = (1 + Math.log(count)) * this.idf(term);
                chunk.vec.set(term, weight);
                norm += weight * weight;
            });
            norm = Math.sqrt(norm) || 1;
            chunk.vec.forEach((weight, term) => chunk.vec.set(term, weight / norm));
        });
    }

    idf(term) {
        const df = this.df.get(term) || 0;
        return Math.log(1 + (this.N - df + 0.5) / (df + 0.5));
    }

    correct(term) {
        if (this.df.has(term) || term.length < 4 || /\d/.test(term)) return null;
        const limit = term.length >= 8 ? 2 : 1;
        let best = null, bestDistance = limit + 1, bestDf = 0;
        this.df.forEach((df, candidate) => {
            if (Math.abs(candidate.length - term.length) > limit) return;
            const distance = editDistance(term, candidate, limit);
            if (distance < bestDistance || (distance === bestDistance && df > bestDf)) {
                best = candidate; bestDistance = distance; bestDf = df;
            }
        });
        return bestDistance <= limit ? best : null;
    }

    analyzeQuery(question) {
        const terms = new Map();
        const notes = [];
        const add = (term, weight, kind, from) => {
            const existing = terms.get(term);
            if (!existing || existing.weight < weight) terms.set(term, { weight, kind, from });
        };
        rawWords(question).filter(word => !STOPWORDS.has(word)).forEach(word => {
            if (REWRITES[word]) {
                REWRITES[word].forEach(target => tokenize(target).forEach(token => add(token, 0.9, 'syn', word)));
                return;
            }
            const stem = stemToken(word);
            let base = stem;
            if (this.df.has(stem)) add(stem, 1, 'term');
            else {
                const fixed = this.correct(stem);
                if (fixed) { add(fixed, 0.85, 'typo', word); base = fixed; notes.push(`${word} → ${fixed}`); }
                else add(stem, 1, 'unknown');
            }
            const synonyms = SYNONYMS[word] || SYNONYMS[stem] || SYNONYMS[base] || [];
            synonyms.forEach(synonym => tokenize(synonym).forEach(token => {
                if (!terms.has(token)) add(token, 0.45, 'syn', word);
            }));
        });
        return { terms, notes };
    }

    bm25(chunk, terms) {
        let score = 0;
        const dl = chunk.terms.length;
        terms.forEach(({ weight }, term) => {
            const tf = chunk.tf.get(term);
            if (!tf) return;
            score += weight * this.idf(term) * (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * dl / this.avgdl));
        });
        return score;
    }

    similarity(a, b) {
        let dot = 0;
        const [small, large] = a.vec.size < b.vec.size ? [a.vec, b.vec] : [b.vec, a.vec];
        small.forEach((weight, term) => { if (large.has(term)) dot += weight * large.get(term); });
        return dot;
    }

    search(question, { k = 3, lambda = 0.7, pool = 8 } = {}) {
        const started = performance.now();
        const { terms, notes } = this.analyzeQuery(question);
        const questionWords = new Set(rawWords(question).map(stemToken));
        const headingBoost = chunk => {
            if (!chunk.leadsHeading || !chunk.headingWords) return 1;
            const shared = [...questionWords].filter(word => chunk.headingWords.has(word)).length;
            const jaccard = shared / new Set([...questionWords, ...chunk.headingWords]).size;
            return jaccard >= 0.6 ? 2 : 1;
        };
        const ranked = this.chunks
            .map(chunk => ({ chunk, score: this.bm25(chunk, terms) * headingBoost(chunk) }))
            .filter(item => item.score > 0)
            .sort((first, second) => second.score - first.score)
            .slice(0, pool);
        const max = ranked.length ? ranked[0].score : 0;

        // MMR over the BM25 pool: relevance vs. redundancy with what's already picked.
        const picked = [];
        const remaining = ranked.filter(item => item.score >= max * 0.3);
        while (picked.length < k && remaining.length) {
            let bestIndex = 0, bestValue = -Infinity;
            remaining.forEach((item, index) => {
                const relevance = item.score / max;
                const redundancy = picked.reduce((worst, chosen) => Math.max(worst, this.similarity(item.chunk, chosen.chunk)), 0);
                const value = lambda * relevance - (1 - lambda) * redundancy;
                if (value > bestValue) { bestValue = value; bestIndex = index; }
            });
            const [choice] = remaining.splice(bestIndex, 1);
            choice.mmr = bestValue;
            choice.pick = picked.length + 1;
            picked.push(choice);
        }
        const own = [...terms].filter(([, info]) => info.kind !== 'syn');
        const covered = ranked.length ? own.filter(([term]) => ranked[0].chunk.tf.has(term)).length : 0;
        const coverage = own.length ? covered / own.length : (ranked.length ? 1 : 0);
        return {
            terms, notes, ranked, picked, max, lambda,
            confident: max >= 1.8 && coverage >= 0.5,
            ms: performance.now() - started
        };
    }
}

/* ---------- Corpus: read the site's own content ---------- */

function finalText(element) {
    const clone = element.cloneNode(true);
    const counters = [...clone.querySelectorAll('[data-count]')];
    if (clone.matches && clone.matches('[data-count]')) counters.push(clone);
    counters.forEach(counter => {
        const decimals = parseInt(counter.dataset.decimals || '0', 10);
        counter.textContent = `${counter.dataset.prefix || ''}${parseFloat(counter.dataset.count).toFixed(decimals)}${counter.dataset.suffix || ''}`;
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
}

function buildPortfolioCorpus() {
    const chunks = [];
    const push = (route, context, text, locate, extraIndex = '', heading = '') => {
        if (!text) return;
        const section = route.startsWith('blogs/') ? 'blogs' : route;
        chunks.push({
            id: chunks.length,
            route, section, context, text,
            indexText: `${sectionNames[section] || ''} ${context} ${extraIndex} ${heading} ${heading} ${text}`,
            headingWords: heading ? new Set(rawWords(heading).map(stemToken)) : null,
            leadsHeading: false,
            locate
        });
    };
    const fromElement = (route, context, element, extraIndex) => push(route, context, finalText(element), () => element, extraIndex);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

    // About
    $$('#about .lede, #about .big-text, #about .about-body > p:not(.big-text)').forEach(element => fromElement('about', 'About Vijay', element));
    const eyebrow = document.querySelector('#about .eyebrow');
    if (eyebrow) fromElement('about', 'About Vijay', eyebrow, 'location based lives work current role present');
    $$('#about .stat').forEach(element => {
        const value = finalText(element.querySelector('.stat-num'));
        const label = finalText(element.querySelector('.stat-label'));
        push('about', 'Results', `${value} ${label}.`, () => element, 'result impact');
    });

    // Experience
    $$('#experience .role').forEach(role => {
        const title = finalText(role.querySelector('.role-title'));
        const dates = finalText(role.querySelector('.role-dates'));
        $$('.dash-list li', role).forEach(item => fromElement('experience', title, item, dates));
        const stack = role.querySelector('.stack-line');
        if (stack) fromElement('experience', title, stack, `${dates} stack skills`);
    });

    // Education
    $$('#education .row').forEach(row => fromElement('education', finalText(row.querySelector('.row-title')), row, 'education study'));

    // Skills
    $$('#skills .skill-card').forEach(card => {
        const label = finalText(card.querySelector('.skill-label'));
        const items = $$('.skill-items span', card).map(span => span.textContent.trim()).join(', ');
        push('skills', 'Skills', `${label}: ${items}.`, () => card, 'skill tools');
    });

    // Projects
    $$('#projects .project').forEach(project => {
        const title = finalText(project.querySelector('.project-title'));
        const summary = project.querySelector('.project-summary');
        if (summary) fromElement('projects', title, summary, 'project');
        $$('.dash-list li', project).forEach(item => fromElement('projects', title, item, 'project'));
        const stack = project.querySelector('.stack-line');
        const links = $$('.project-links a', project).map(link => link.textContent.replace('↗', '').trim().toLowerCase());
        if (stack) push('projects', title, `Built with ${finalText(stack).replace(/ · /g, ', ')}. Links: ${links.join(' and ')}.`, () => project, 'project stack');
    });

    // Achievements
    $$('#achievements .award').forEach(award => fromElement('achievements', 'Achievements', award, 'achievement award'));
    $$('#achievements .leadership li').forEach(item => fromElement('achievements', 'Leadership & clubs', item, 'club leadership'));

    // Contact
    const contactSub = document.querySelector('#contact .sec-sub');
    if (contactSub) fromElement('contact', 'Contact', contactSub, 'opportunity hire contact');
    const email = document.querySelector('#contact .contact-email');
    if (email) {
        push('contact', 'Contact', `The best way to reach Vijay is by email at ${email.textContent.trim()}. He is also on LinkedIn, GitHub and a Data Science Portfolio.`,
            () => document.querySelector('#contact .contact-side'), 'email contact reach linkedin github');
    }

    // Blog posts (from data; the article DOM is rendered on demand)
    (window.blogPosts || []).forEach(post => {
        const route = `blogs/${post.slug}`;
        push(route, post.title, post.excerpt, () => document.querySelector('.blog-article-excerpt'), 'blog post article writing');
        let heading = '';
        let headingOpen = false;
        post.content.forEach((block, blockIndex) => {
            const locate = () => document.querySelectorAll('.blog-article-content > *')[blockIndex];
            if (block.type === 'heading') { heading = block.text; headingOpen = true; return; }
            const before = chunks.length;
            if (block.type === 'list') {
                block.items.forEach((item, itemIndex) => push(route, post.title, item, () => {
                    const list = locate();
                    return list ? list.children[itemIndex] : null;
                }, 'blog', heading));
            } else if (block.type === 'paragraph' || block.type === 'callout') {
                push(route, post.title, block.text, locate, 'blog', heading);
            } else if (block.type === 'image' && block.caption) {
                push(route, post.title, block.caption, locate, `${heading} blog figure`);
            }
            if (headingOpen && chunks.length > before) { chunks[before].leadsHeading = true; headingOpen = false; }
        });
    });

    return chunks;
}

/* ---------- Widget ---------- */

function initPortfolioFaq() {
    const launcher = document.getElementById('faqLauncher');
    const panel = document.getElementById('faqPanel');
    const closeButton = document.getElementById('faqClose');
    const conversation = document.getElementById('faqConversation');
    const suggestions = document.getElementById('faqSuggestions');
    const form = document.getElementById('faqForm');
    const input = document.getElementById('faqInput');

    if (!launcher || !panel || !closeButton || !conversation || !suggestions || !form || !input) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const asked = new Set();
    let index = null;
    const getIndex = () => {
        if (!index) index = new PortfolioIndex(buildPortfolioCorpus());
        return index;
    };
    const mailHref = () => {
        const link = document.querySelector('#contact .contact-email');
        return link ? link.getAttribute('href') : '';
    };
    const routeHref = route => `${window.portfolioBasePath || ''}/${route}`;

    function scrollToLatest() {
        conversation.scrollTop = conversation.scrollHeight;
    }

    function setOpen(isOpen) {
        panel.hidden = !isOpen;
        launcher.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            input.focus();
            getIndex();
            const count = document.getElementById('faqPassageCount');
            if (count) count.textContent = String(getIndex().N);
        } else {
            launcher.focus();
        }
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function addUserMessage(text) {
        conversation.appendChild(el('div', 'faq-message faq-user-message', text));
        scrollToLatest();
    }

    function addAssistant() {
        const message = el('div', 'faq-message faq-assistant-message');
        conversation.appendChild(message);
        return message;
    }

    function linkRow(links) {
        const row = el('div', 'faq-message-links');
        links.forEach(info => {
            const link = el('a', '', info.label);
            if (info.route) {
                link.dataset.route = info.route;
                link.href = routeHref(info.route);
            } else if (info.mail) {
                link.href = info.mailBody ? `${mailHref()}?subject=${encodeURIComponent('Question from your portfolio')}&body=${encodeURIComponent(info.mailBody)}` : mailHref();
            } else {
                link.href = info.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
            row.appendChild(link);
        });
        return row;
    }

    // Verbatim snippet: the best window of up to two sentences, with query terms marked.
    function renderSnippet(text, termSet) {
        const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
        let bestStart = 0, bestHits = -1;
        sentences.forEach((_, start) => {
            const windowText = sentences.slice(start, start + 2).join(' ');
            const hits = tokenize(windowText).filter(term => termSet.has(term)).length;
            if (hits > bestHits) { bestHits = hits; bestStart = start; }
        });
        let snippet = sentences.slice(bestStart, bestStart + 2).join(' ');
        if (snippet.length > 320) snippet = `${snippet.slice(0, 317).replace(/\s+\S*$/, '')}…`;
        if (bestStart > 0) snippet = `…${snippet}`;
        else if (bestStart + 2 < sentences.length && !snippet.endsWith('…')) snippet = `${snippet} …`;

        const paragraph = el('p', 'faq-quote-text');
        snippet.split(/([A-Za-z0-9+#.']+)/).forEach(part => {
            if (!part) return;
            const word = part.toLowerCase().replace(/^[.']+|[.']+$/g, '').replace(/'s$/, '');
            if (/[a-z0-9]/.test(word) && !STOPWORDS.has(word) && termSet.has(stemToken(word))) {
                paragraph.appendChild(el('mark', '', part));
            } else {
                paragraph.appendChild(document.createTextNode(part));
            }
        });
        return paragraph;
    }

    function jumpTo(chunk) {
        const flash = () => {
            const target = chunk.locate();
            if (!target) return;
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
            target.classList.remove('faq-flash');
            void target.offsetWidth;
            target.classList.add('faq-flash');
            setTimeout(() => target.classList.remove('faq-flash'), 2600);
        };
        const page = document.body.dataset.page;
        const onBlog = chunk.route.startsWith('blogs/');
        const target = onBlog ? null : chunk.locate();
        const visible = target && !target.closest('[hidden]');
        if ((onBlog && page !== chunk.route) || (!onBlog && !visible)) {
            if (typeof window.portfolioNavigate === 'function') window.portfolioNavigate(onBlog ? chunk.route : chunk.section);
            requestAnimationFrame(() => requestAnimationFrame(flash));
        } else {
            flash();
        }
        if (window.innerWidth < 640) setOpen(false);
    }

    function renderTrace(result) {
        const details = el('details', 'faq-trace');
        details.appendChild(el('summary', '', `Retrieval trace · ${getIndex().N} passages · ${result.ms.toFixed(1)} ms`));

        const query = el('div', 'trace-query');
        query.appendChild(el('span', 'trace-key', 'query'));
        [...result.terms].sort((a, b) => b[1].weight - a[1].weight).forEach(([term, info]) => {
            const chip = el('span', `trace-term ${info.kind}`, term);
            chip.title = info.kind === 'syn' ? `synonym of "${info.from}" (weight ${info.weight})`
                : info.kind === 'typo' ? `corrected from "${info.from}"`
                : info.kind === 'unknown' ? 'not in the index' : 'query term (weight 1)';
            query.appendChild(chip);
        });
        details.appendChild(query);
        if (result.notes.length) details.appendChild(el('p', 'trace-note', `typo fix: ${result.notes.join(', ')}`));

        if (result.ranked.length) {
            const list = el('ol', 'trace-list');
            result.ranked.forEach((item, rank) => {
                const row = el('li', item.pick ? 'picked' : '');
                row.appendChild(el('span', 'trace-rank', String(rank + 1)));
                const bar = el('span', 'trace-bar');
                const fill = el('i');
                fill.style.width = `${(item.score / result.max * 100).toFixed(0)}%`;
                bar.appendChild(fill);
                row.appendChild(bar);
                row.appendChild(el('span', 'trace-score', item.score.toFixed(2)));
                row.appendChild(el('span', 'trace-src', sectionNames[item.chunk.section]));
                row.appendChild(el('span', 'trace-pick', item.pick ? `MMR #${item.pick}` : item.score < result.max * 0.3 ? 'cut' : 'redundant'));
                const snippet = el('span', 'trace-snip', item.chunk.text);
                row.appendChild(snippet);
                list.appendChild(row);
            });
            details.appendChild(list);
        } else {
            details.appendChild(el('p', 'trace-note', 'No passage contains any query term.'));
        }
        details.appendChild(el('p', 'trace-foot', `BM25 (k1=1.2, b=0.75) → top ${result.ranked.length} → MMR (λ=${result.lambda}) keeps ${result.picked.length}. Passages under 30% of the best score are cut.`));
        return details;
    }

    function addFollowUps(message, sections) {
        conversation.querySelectorAll('.faq-followups').forEach(node => node.remove());
        const options = [];
        sections.forEach(section => (followUps[section] || []).forEach(question => {
            if (!asked.has(question) && !options.includes(question)) options.push(question);
        }));
        if (!options.length) return;
        const row = el('div', 'faq-followups');
        options.slice(0, 3).forEach(question => {
            const chip = el('button', '', question);
            chip.type = 'button';
            chip.addEventListener('click', () => ask(question));
            row.appendChild(chip);
        });
        message.appendChild(row);
    }

    function curatedMatch(question) {
        const words = new Set(tokenize(question));
        let best = null, bestScore = 0;
        portfolioFaqs.forEach(faq => {
            const target = new Set(tokenize(faq.question));
            const overlap = [...words].filter(word => target.has(word)).length;
            const score = overlap / new Set([...words, ...target]).size;
            if (score > bestScore) { best = faq; bestScore = score; }
        });
        return bestScore >= 0.6 ? best : null;
    }

    function answerCurated(faq, message) {
        message.appendChild(el('p', '', faq.answer));
        message.appendChild(linkRow(faq.links));
        const result = getIndex().search(faq.question);
        const sections = [...new Set(result.picked.map(item => item.chunk.section))];
        message.appendChild(renderTrace(result));
        addFollowUps(message, sections.length ? sections : ['about']);
    }

    function answerRetrieval(question, message) {
        const result = getIndex().search(question);
        const termSet = new Set([...result.terms].filter(([, info]) => info.kind !== 'unknown').map(([term]) => term));

        if (!result.picked.length) {
            message.appendChild(el('p', '', "I couldn't find that anywhere in the portfolio. Vijay can answer it directly:"));
            message.appendChild(linkRow([{ label: 'Ask Vijay by email →', mail: true, mailBody: question }]));
            message.appendChild(renderTrace(result));
            addFollowUps(message, ['about', 'projects']);
            return;
        }

        message.appendChild(el('p', 'faq-lead', result.confident
            ? 'From the portfolio:'
            : "No strong match, but these passages came closest:"));

        result.picked.forEach(item => {
            const quote = el('blockquote', 'faq-quote');
            quote.appendChild(renderSnippet(item.chunk.text, termSet));
            const source = el('button', 'faq-source', `${sectionNames[item.chunk.section]} · ${item.chunk.context} →`);
            source.type = 'button';
            source.addEventListener('click', () => jumpTo(item.chunk));
            quote.appendChild(source);
            message.appendChild(quote);
        });

        if (!result.confident) {
            message.appendChild(linkRow([{ label: 'Ask Vijay directly →', mail: true, mailBody: question }]));
        }
        message.appendChild(renderTrace(result));
        addFollowUps(message, [...new Set(result.picked.map(item => item.chunk.section))]);
    }

    function ask(question, curated) {
        asked.add(question);
        suggestions.hidden = true;
        addUserMessage(question);

        const typing = el('div', 'faq-message faq-assistant-message faq-typing');
        typing.appendChild(el('span', '', `searching ${getIndex().N} passages`));
        typing.appendChild(el('i'));
        conversation.appendChild(typing);
        scrollToLatest();

        setTimeout(() => {
            typing.remove();
            const message = addAssistant();
            const greeting = /^(hi|hello|hey|yo|hola|namaste|thanks|thank you|thx|ok|okay|cool|nice|great)\b/i.test(question.trim()) && question.trim().split(/\s+/).length <= 4;
            if (greeting) {
                message.appendChild(el('p', '', /^(thanks|thank|thx)/i.test(question.trim())
                    ? 'Happy to help! Ask anything else about his work.'
                    : 'Hi! I search the text of this site and quote what I find. Try one of these:'));
                addFollowUps(message, ['about', 'projects', 'blogs']);
            } else {
                const faq = curated || curatedMatch(question);
                if (!faq && OUT_OF_SCOPE.test(question)) {
                    message.appendChild(el('p', '', "That isn't something this portfolio covers, so I won't guess. Vijay can answer it directly:"));
                    message.appendChild(linkRow([{ label: 'Ask Vijay by email →', mail: true, mailBody: question }]));
                    addFollowUps(message, ['contact', 'about']);
                } else if (faq) answerCurated(faq, message);
                else answerRetrieval(question, message);
            }
            scrollToLatest();
            const lastUser = [...conversation.querySelectorAll('.faq-user-message')].pop();
            if (lastUser) conversation.scrollTop = Math.max(0, lastUser.offsetTop - 12);
        }, reduceMotion ? 0 : 320);
    }

    portfolioFaqs.forEach(faq => {
        const button = el('button', '', faq.question);
        button.type = 'button';
        button.addEventListener('click', () => ask(faq.question, faq));
        suggestions.appendChild(button);
    });
    starterQuestions.forEach(question => {
        const button = el('button', 'faq-starter', question);
        button.type = 'button';
        button.addEventListener('click', () => ask(question));
        suggestions.appendChild(button);
    });

    launcher.addEventListener('click', () => setOpen(panel.hidden));
    closeButton.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) setOpen(false);
    });
    form.addEventListener('submit', event => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) return;
        ask(question);
        input.value = '';
        input.focus();
    });

    window.portfolioSearch = question => getIndex().search(question);
}

document.addEventListener('DOMContentLoaded', initPortfolioFaq);
