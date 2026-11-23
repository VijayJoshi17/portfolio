registerSection('about', `
    <div class="hero">
        <div class="hero-copy">
            <p class="eyebrow"><span class="live-dot" aria-hidden="true"></span>AI Engineer at AIVantage · Ahmedabad, India</p>
            <h1 class="hero-title" aria-label="Vijay Joshi builds systems that retrieve, reason, see and ship.">
                <span class="hero-line" aria-hidden="true">Vijay Joshi</span>
                <span class="hero-line dim" aria-hidden="true">builds systems</span>
                <span class="hero-line dim" aria-hidden="true">that <em class="rotator" id="heroRotator" data-words="retrieve.|reason.|see.|ship.">retrieve.</em></span>
            </h1>
            <p class="lede">I work across the stack of applied AI: the retrieval that finds the right context, the agents that reason over it, the vision models that read the physical world, and the infrastructure that keeps all of it fast and correct in production.</p>
            <div class="hero-actions">
                <a class="btn-primary" href="mailto:joshivijay2004@gmail.com">Write to me</a>
                <a class="ulink" data-resume hidden download="Vijay_Joshi_Resume.pdf">Résumé ↓</a>
                <a class="ulink" href="https://github.com/VijayJoshi17" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a class="ulink" href="https://www.linkedin.com/in/vijay-joshi-4b5474244/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a class="ulink" href="https://www.datascienceportfol.io/VijayJoshi" target="_blank" rel="noopener noreferrer">DS Portfolio</a>
            </div>
        </div>

        <figure class="fig fig-mmr" id="mmrFig" data-figure="mmr" data-fig-num="Fig. 1" data-fig-title="Retrieval in a toy embedding space" data-fig-link="blogs/mmr-maximum-marginal-relevance"></figure>
    </div>

    <div class="marquee" aria-hidden="true">
        <div class="marquee-track">
            <span>LangGraph</span><span>RAG</span><span>PyTorch</span><span>Qdrant</span><span>FastAPI</span><span>OpenCV</span><span>Multi-agent systems</span><span>Azure</span><span>Docker</span><span>Hybrid search</span><span>Cross-encoders</span><span>LLM evals</span><span>TensorFlow</span><span>Ollama</span>
            <span>LangGraph</span><span>RAG</span><span>PyTorch</span><span>Qdrant</span><span>FastAPI</span><span>OpenCV</span><span>Multi-agent systems</span><span>Azure</span><span>Docker</span><span>Hybrid search</span><span>Cross-encoders</span><span>LLM evals</span><span>TensorFlow</span><span>Ollama</span>
        </div>
    </div>

    <div class="split about-block">
        <header class="sec-head sec-head-side">
            <span class="sec-idx">01</span>
            <h2 class="sec-title">About</h2>
        </header>
        <div class="about-body reveal">
            <img src="images/profile.png" alt="Portrait of Vijay Joshi" class="portrait" width="112" height="112">
            <p class="big-text">I'm an AI engineer who likes the unglamorous parts: retrieval that actually finds the right paragraph, agents that know when to stop, and latency budgets measured in milliseconds.</p>
            <p>I have shipped LLM, RAG and multi-agent systems for finance and healthcare, real-time computer-vision pipelines for industrial inspection, and the cloud plumbing that keeps them running. I'm currently building intelligent systems at <strong>AIVantage</strong>.</p>
            <div class="stats">
                <div class="stat reveal"><span class="stat-num" data-count="10">10</span><span class="stat-label">parallel model calls in a LangGraph fan-out workflow</span></div>
                <div class="stat reveal"><span class="stat-num" data-count="1000" data-group="true" data-suffix="+">1,000+</span><span class="stat-label">page medical records analysed by a clinical review system</span></div>
                <div class="stat reveal"><span class="stat-num" data-count="4" data-suffix="+">4+</span><span class="stat-label">enterprise automation integrations on Azure and Fabric</span></div>
                <div class="stat reveal"><span class="stat-num" data-count="10" data-prefix="&lt;" data-suffix="ms">&lt;10ms</span><span class="stat-label">frame latency in real-time vision systems</span></div>
            </div>
        </div>
    </div>
`);
