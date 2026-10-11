const portfolioFaqs = [
    {
        question: 'What does Vijay specialize in?',
        keywords: ['specialize', 'specialty', 'focus', 'role', 'machine learning', 'deep learning', 'computer vision', 'llm', 'rag', 'ai engineer'],
        answer: 'Vijay is an AI Engineer in Ahmedabad focused on machine learning, deep learning, LLMs, RAG, computer vision, and scalable systems. He currently builds intelligent systems at AIVantage.',
        links: [{ label: 'About Vijay', href: './about', route: 'about' }]
    },
    {
        question: 'What projects has Vijay built?',
        keywords: ['project', 'projects', 'built', 'developed', 'rag system', 'drowsiness', 'disaster tweets', 'github'],
        answer: 'Featured work includes a local multi-agent RAG system using LangGraph, Ollama, and Qdrant; a CNN-based drowsiness detector; and a disaster-tweet classifier.',
        links: [
            { label: 'See projects', href: './projects', route: 'projects' },
            { label: 'GitHub', href: 'https://github.com/VijayJoshi17' }
        ]
    },
    {
        question: 'What technologies does Vijay use?',
        keywords: ['technology', 'technologies', 'tech stack', 'tools', 'framework', 'language', 'skills', 'python', 'pytorch', 'tensorflow', 'langgraph', 'fastapi', 'qdrant', 'opencv'],
        answer: 'His toolkit includes Python, PyTorch, TensorFlow, LangChain, LangGraph, RAG frameworks, vector databases, FastAPI, Docker, and cloud platforms.',
        links: [{ label: 'View skills', href: './skills', route: 'skills' }]
    },
    {
        question: 'How can I contact Vijay?',
        keywords: ['contact', 'email', 'reach', 'hire', 'opportunity', 'linkedin', 'message'],
        answer: 'Vijay is open to opportunities in AI/ML and Data Science. You can email him or use the contact section.',
        links: [
            { label: 'Contact section', href: './contact', route: 'contact' },
            { label: 'Email Vijay', href: 'mailto:joshivijay2004@gmail.com' }
        ]
    }
];

function initPortfolioFaq() {
    const launcher = document.getElementById('faqLauncher');
    const panel = document.getElementById('faqPanel');
    const closeButton = document.getElementById('faqClose');
    const conversation = document.getElementById('faqConversation');
    const suggestions = document.getElementById('faqSuggestions');
    const form = document.getElementById('faqForm');
    const input = document.getElementById('faqInput');

    if (!launcher || !panel || !closeButton || !conversation || !suggestions || !form || !input) return;

    function scrollToLatest() {
        conversation.scrollTop = conversation.scrollHeight;
    }

    function setOpen(isOpen) {
        panel.hidden = !isOpen;
        launcher.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) input.focus();
        else launcher.focus();
    }

    function addMessage(text, isUser = false, links = []) {
        const message = document.createElement('div');
        message.className = `faq-message ${isUser ? 'faq-user-message' : 'faq-assistant-message'}`;
        message.textContent = text;

        if (links.length) {
            const linkList = document.createElement('div');
            linkList.className = 'faq-message-links';
            links.forEach(linkInfo => {
                const link = document.createElement('a');
                link.textContent = linkInfo.label;
                if (linkInfo.route) {
                    link.dataset.route = linkInfo.route;
                    const navLink = document.querySelector(`.sidebar-nav a[data-route="${linkInfo.route}"]`);
                    link.href = navLink ? navLink.href : linkInfo.href;
                } else {
                    link.href = linkInfo.href;
                    if (linkInfo.href.startsWith('http')) {
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    }
                }
                linkList.appendChild(link);
            });
            message.appendChild(linkList);
        }

        conversation.appendChild(message);
        scrollToLatest();
    }

    function findFaq(question) {
        const normalizedQuestion = question.toLowerCase().replace(/[^a-z0-9+#\s]/g, ' ').replace(/\s+/g, ' ').trim();
        let bestMatch = null;
        let bestScore = 0;

        portfolioFaqs.forEach(faq => {
            const score = faq.keywords.reduce((total, keyword) => {
                const normalizedKeyword = keyword.toLowerCase();
                return total + (normalizedQuestion.includes(normalizedKeyword) ? normalizedKeyword.split(' ').length : 0);
            }, 0);
            if (score > bestScore) {
                bestMatch = faq;
                bestScore = score;
            }
        });

        return bestMatch;
    }

    function answerQuestion(question, selectedFaq) {
        addMessage(question, true);
        const faq = selectedFaq || findFaq(question);
        if (faq) {
            suggestions.hidden = true;
            addMessage(faq.answer, false, faq.links);
        } else {
            addMessage("I don't have that detail in the portfolio yet. Try a question about Vijay's focus, projects, skills, or contact details.", false, [
                { label: 'Projects', href: './projects', route: 'projects' },
                { label: 'Contact', href: './contact', route: 'contact' }
            ]);
            suggestions.hidden = false;
        }
    }

    portfolioFaqs.forEach(faq => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = faq.question;
        button.addEventListener('click', () => answerQuestion(faq.question, faq));
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
        answerQuestion(question);
        input.value = '';
        input.focus();
    });
}

document.addEventListener('DOMContentLoaded', initPortfolioFaq);