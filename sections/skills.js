(function () {
    // Résumé categories first; site-only extras appended to the closest group.
    const groups = [
        ['Languages', ['Python', 'C++', 'SQL', 'Bash', 'C', 'Java', 'JavaScript']],
        ['GenAI & LLMs', ['Generative AI', 'LLMs', 'RAG', 'Agentic AI', 'Multi-Agent Systems', 'Prompt Engineering', 'Text-to-SQL', 'ReAct', 'CoT']],
        ['AI / ML', ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'OCR', 'Image Processing']],
        ['Frameworks', ['LangChain', 'LangGraph', 'CrewAI', 'Hugging Face Transformers', 'Ollama', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'LlamaIndex', 'OpenCV', 'Pandas', 'NumPy', 'XGBoost', 'LightGBM']],
        ['RAG & Retrieval', ['Hybrid Search', 'BM25', 'Vector Search', 'Semantic Search', 'Cross-Encoder Reranking', 'Qdrant', 'FAISS', 'Chroma', 'Pinecone', 'Weaviate']],
        ['Cloud & Backend', ['Microsoft Azure', 'Azure OpenAI', 'Azure Functions', 'Azure App Service', 'FastAPI', 'Docker', 'REST APIs', 'Flask', 'AWS', 'GCP', 'MLflow', 'CI/CD']],
        ['Databases', ['PostgreSQL', 'MySQL', 'MongoDB', 'Microsoft Fabric']],
        ['Automation & Tools', ['Playwright', 'RPA', 'Microsoft Graph API', 'SharePoint', 'Git', 'GitHub', 'Power BI', 'Jupyter', 'Linux', 'Streamlit', 'Gradio']]
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
