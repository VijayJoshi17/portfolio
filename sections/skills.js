(function () {
    const groups = [
        ['Programming', ['Python', 'C++', 'C', 'Java', 'JavaScript']],
        ['Machine Learning', ['TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy', 'OpenCV', 'Seaborn', 'Matplotlib', 'XGBoost', 'LightGBM']],
        ['AI Systems', ['LLMs', 'LangChain', 'LlamaIndex', 'LangGraph', 'RAG', 'Prompt Engineering', 'Multi-Agent Systems', 'ReAct', 'CoT']],
        ['Retrieval & Data', ['Vector Embeddings', 'FAISS', 'Pinecone', 'ChromaDB', 'Weaviate', 'MySQL', 'MongoDB', 'PostgreSQL']],
        ['Deployment & MLOps', ['FastAPI', 'Flask', 'Docker', 'MLflow', 'CI/CD', 'REST APIs']],
        ['Tools & Platforms', ['Git', 'GitHub', 'VS Code', 'Jupyter', 'Linux', 'AWS', 'GCP', 'Streamlit', 'Gradio']]
    ];

    registerSection('skills', `
        <header class="sec-head">
            <span class="sec-idx">04</span>
            <h2 class="sec-title">Skills</h2>
            <p class="sec-sub">The toolkit, grouped by the layer of the system it lives in.</p>
        </header>
        <div class="skill-grid">
            ${groups.map(([label, items], index) => `
                <div class="skill-card reveal" style="--i:${index}">
                    <div class="skill-card-head">
                        <span class="skill-label">${label}</span>
                        <span class="skill-count">${String(items.length).padStart(2, '0')}</span>
                    </div>
                    <p class="skill-items">${items.map(item => `<span>${item}</span>`).join('')}</p>
                </div>
            `).join('')}
        </div>
    `);
})();
