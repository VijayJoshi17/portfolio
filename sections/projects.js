(function () {
    const node = (id, num, label, x, y, extra = '') => `
        <g class="pl-node${extra}" data-node="${id}">
            <text class="pl-num" x="${x}" y="${y - 7}">${num}</text>
            <rect x="${x}" y="${y}" width="76" height="32" rx="2"></rect>
            <text class="pl-label" x="${x + 38}" y="${y + 20}" text-anchor="middle">${label}</text>
        </g>`;

    const pipeline = `
        <figure class="fig pipeline-fig">
            <div class="pipeline-scroll">
                <svg class="pipeline" viewBox="0 0 760 210" role="img" aria-labelledby="pipelineTitle">
                    <title id="pipelineTitle">Pipeline of the local multi-agent RAG system: query, router, vector and BM25 retrieval, reranker, reasoner, verifier with a retry loop, and answer.</title>
                    <g class="pl-edges">
                        <path d="M46 105 L156 105"/>
                        <path d="M156 105 C 211 105, 211 61, 266 61"/>
                        <path d="M156 105 C 211 105, 211 149, 266 149"/>
                        <path d="M266 61 C 321 61, 321 105, 376 105"/>
                        <path d="M266 149 C 321 149, 321 105, 376 105"/>
                        <path d="M376 105 L706 105"/>
                        <path class="pl-retry" d="M596 89 C 596 40, 486 40, 486 89"/>
                    </g>
                    <text class="pl-note" x="541" y="36" text-anchor="middle">retry if unsupported</text>
                    <path id="plPathA" class="pl-motion" d="M46 105 L156 105 C 211 105, 211 61, 266 61 C 321 61, 321 105, 376 105 L706 105"/>
                    <path id="plPathB" class="pl-motion" d="M46 105 L156 105 C 211 105, 211 149, 266 149 C 321 149, 321 105, 376 105 L706 105"/>
                    <circle class="pl-packet" r="3.5"><animateMotion dur="4.2s" repeatCount="indefinite"><mpath href="#plPathA"/></animateMotion></circle>
                    <circle class="pl-packet" r="3.5"><animateMotion dur="4.2s" begin="1.4s" repeatCount="indefinite"><mpath href="#plPathB"/></animateMotion></circle>
                    <circle class="pl-packet alt" r="3"><animateMotion dur="4.2s" begin="2.8s" repeatCount="indefinite"><mpath href="#plPathA"/></animateMotion></circle>
                    ${node('query', '10', 'Query', 8, 89)}
                    ${node('router', '12', 'Router', 118, 89)}
                    ${node('vector', '14', 'Vector', 228, 45)}
                    ${node('bm25', '16', 'BM25', 228, 133)}
                    ${node('rerank', '18', 'Rerank', 338, 89)}
                    ${node('reason', '20', 'Reason', 448, 89)}
                    ${node('verify', '22', 'Verify', 558, 89)}
                    ${node('answer', '24', 'Answer', 668, 89, ' pl-out')}
                </svg>
            </div>
            <figcaption class="fig-caption">
                <div class="fig-head"><span class="fig-num">Fig. 3</span><span class="fig-title">Local multi-agent RAG, end to end</span></div>
                <div class="callouts">
                    <span><b>10</b>Query</span><span><b>12</b>Router agent</span><span><b>14</b>Qdrant vectors</span><span><b>16</b>BM25 keywords</span><span><b>18</b>Cross-encoder</span><span><b>20</b>Reasoner</span><span><b>22</b>Verifier</span><span><b>24</b>Grounded answer</span>
                </div>
            </figcaption>
        </figure>`;

    const projects = [
        {
            year: '2025',
            title: 'Local Multi-Agent RAG System',
            summary: 'A privacy-first retrieval system where every token stays on your machine.',
            points: [
                'Designed a privacy-first multi-agent RAG system using <strong>LangGraph</strong>, <strong>Ollama</strong>, and <strong>Qdrant</strong> enabling 100% local LLM inference.',
                'Implemented Hybrid Retrieval (<strong>Vector + BM25</strong>) with cross-encoder reranking, improving retrieval relevance by <strong>35%</strong>.',
                'Built a <strong>10+ agent</strong> AI pipeline for routing, reasoning, and verification, reducing hallucinations by <strong>30%</strong>.',
                'Developed a <strong>FastAPI</strong> backend and <strong>Streamlit</strong> UI supporting 4+ document formats with sub-2s query latency.'
            ],
            stack: ['LangGraph', 'RAG', 'Qdrant', 'FastAPI', 'Streamlit'],
            links: [{ label: 'Code', href: 'https://github.com/VijayJoshi17/multi_agent_rag_local' }],
            figure: pipeline
        },
        {
            year: '2024',
            title: 'Drowsiness Detection using CNN',
            summary: 'Watching for the moment attention slips, from posture as well as eyes.',
            points: [
                'Engineered a robust CNN-based drowsiness detection system in Python, achieving <strong>89.9% accuracy</strong>.',
                'Created a custom dataset incorporating posture and traditional drowsiness indicators.',
                'Applied preprocessing and evaluation techniques including confusion matrix, ROC, and learning curves to improve reliability.'
            ],
            stack: ['Python', 'Deep Learning', 'OpenCV'],
            links: [{ label: 'Code', href: 'https://github.com/VijayJoshi17/Drowsiness-Detection' }]
        },
        {
            year: '2023',
            title: 'Disaster Tweets Analysis and Prediction',
            summary: 'Separating real emergencies from figures of speech, with a live app to explore the data.',
            points: [
                'Built a <strong>Streamlit</strong> application for data exploration, visualization, and tweet classification.',
                'Implemented ML models including Logistic Regression, Naive Bayes, SVM, Random Forest, and Gradient Boosting.',
                'Achieved the highest test accuracy of <strong>98.52%</strong> using Random Forest.'
            ],
            stack: ['Python', 'NLP', 'Streamlit'],
            links: [
                { label: 'Code', href: 'https://github.com/VijayJoshi17/Disaster-Tweets-Streamlit' },
                { label: 'Live demo', href: 'https://disaster-tweets-app-l39ecbvvaynfigtapzppfk.streamlit.app/' }
            ]
        }
    ];

    const renderProject = (project, index) => `
        <article class="project${project.figure ? ' project-featured' : ''} reveal">
            <div class="project-text">
                <div class="project-meta"><span class="project-num">${String(index + 1).padStart(2, '0')}</span><span>${project.year}</span></div>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-summary">${project.summary}</p>
                <ul class="dash-list">${project.points.map(point => `<li>${point}</li>`).join('')}</ul>
                <p class="stack-line">${project.stack.join(' · ')}</p>
                <div class="project-links">${project.links.map(link => `<a class="ulink" href="${link.href}" target="_blank" rel="noopener noreferrer">${link.label} ↗</a>`).join('')}</div>
            </div>
            ${project.figure || ''}
        </article>
    `;

    registerSection('projects', `
        <header class="sec-head">
            <span class="sec-idx">05</span>
            <h2 class="sec-title">Projects</h2>
            <p class="sec-sub">Things built outside of work, mostly to understand something properly.</p>
        </header>
        <div class="projects">${projects.map(renderProject).join('')}</div>
    `);
})();
