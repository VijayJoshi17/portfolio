(function () {
    const roles = [
        {
            role: 'AI Engineer',
            company: 'AIVantage',
            dates: 'Sept 2025 – Present',
            start: [2025, 9],
            end: null,
            stack: 'LangGraph · RAG · PostgreSQL · OCR · FastAPI · Azure Functions · Microsoft Fabric',
            points: [
                'Developed enterprise <strong>RAG-based conversational AI systems</strong> integrating PostgreSQL and LLMs for natural-language querying across structured financial datasets.',
                'Built <strong>multi-agent AI workflows</strong> using LangGraph, implementing fan-out architecture supporting <strong>10 parallel model calls</strong> with model routing and response evaluation.',
                'Developed an AI-powered <strong>Clinical Case Review system</strong> for analyzing medical records spanning <strong>1,000+ pages</strong>, incorporating OCR, multilingual translation, and LLM-based analysis.',
                'Engineered <strong>4+ enterprise automation integrations</strong> using FastAPI, Azure Functions, Microsoft Fabric, Graph API, and SharePoint for data processing, reporting, and workflow automation.'
            ]
        },
        {
            role: 'Software Engineer',
            company: 'Kevision Systems',
            dates: 'Jan 2025 – Aug 2025',
            start: [2025, 1],
            end: [2025, 8],
            stack: 'Computer vision · Detection · Segmentation · OpenCV',
            points: [
                'Developed industrial object detection and segmentation models achieving <strong>92% accuracy</strong>.',
                'Implemented feature matching algorithms including <strong>ORB</strong>, <strong>SIFT</strong>, and <strong>SURF</strong>, improving matching accuracy by <strong>35%</strong>.',
                'Optimized image-processing pipelines, reducing frame processing time by <strong>45%</strong> and achieving sub-10ms latency in real-time systems.'
            ]
        },
        {
            role: '.NET Trainee',
            company: 'Netsol IT Solutions Pvt. Ltd.',
            dates: 'May 2024 – Jul 2024',
            start: [2024, 5],
            end: [2024, 7],
            stack: 'ASP.NET · MVC · .NET Framework',
            points: [
                'Developed web applications using <strong>ASP.NET</strong> and <strong>ASP.NET MVC</strong>.',
                'Worked with the <strong>.NET Framework</strong> to integrate backend systems and APIs.',
                'Implemented secure communication practices using <strong>HTTPS</strong> and managed <strong>SSL Certificates</strong> for secure data transfer.'
            ]
        },
        {
            role: 'Data Science Intern',
            company: 'AICAN Private Limited',
            dates: 'Feb 2023 – Mar 2023',
            start: [2023, 2],
            end: [2023, 3],
            stack: 'EDA · CNNs · Python automation',
            points: [
                'Performed data preprocessing, visualization, and <strong>exploratory data analysis (EDA)</strong> to identify insights and trends.',
                'Developed and evaluated <strong>Convolutional Neural Network (CNN)</strong> models for image classification tasks.',
                'Created Python automation scripts to streamline analytical workflows and improve reporting efficiency.'
            ]
        }
    ];

    // Timeline axis: Jan 2021 to Jan 2027
    const axisStart = 2021;
    const axisEnd = 2027;
    const totalMonths = (axisEnd - axisStart) * 12;
    const now = new Date();
    const nowMonth = Math.min(totalMonths, (now.getFullYear() - axisStart) * 12 + now.getMonth() + 1);
    const pos = ([year, month]) => ((year - axisStart) * 12 + (month - 1)) / totalMonths * 100;
    const nowPct = nowMonth / totalMonths * 100;

    const lanes = [
        { label: 'B.Tech, Nirma University', start: [2021, 11], end: [2025, 6], kind: 'study' },
        ...roles.slice().reverse().map(item => ({ label: item.company, start: item.start, end: item.end, kind: 'work' }))
    ];

    const years = [];
    for (let year = axisStart; year < axisEnd; year++) years.push(year);

    const timeline = `
        <figure class="fig timeline-fig reveal">
            <div class="timeline" style="--now:${nowPct.toFixed(2)}%">
                <div class="timeline-years">${years.map(year => `<span style="left:${pos([year, 1]).toFixed(2)}%">${year}</span>`).join('')}</div>
                <div class="timeline-now" aria-hidden="true"><span>Now</span></div>
                ${lanes.map((lane, index) => {
                    const left = pos(lane.start);
                    const right = lane.end ? pos(lane.end) + 100 / totalMonths : nowPct;
                    const width = Math.max(right - left, 0.9);
                    // Long bars carry their label inside; late bars put it on the left; others on the right.
                    const placement = width > 30 ? 'inside' : left > 55 ? 'flip' : 'after';
                    const labelStyle = placement === 'inside'
                        ? `left:${(left + 1).toFixed(2)}%`
                        : placement === 'flip'
                        ? `right:${(100 - left + 0.8).toFixed(2)}%`
                        : `left:${(left + width + 0.8).toFixed(2)}%`;
                    return `<div class="timeline-lane">
                        <span class="timeline-bar ${lane.kind}${lane.end ? '' : ' ongoing'}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;--i:${index}"></span>
                        <span class="timeline-label ${placement}" style="${labelStyle};--i:${index}">${lane.label}</span>
                    </div>`;
                }).join('')}
            </div>
            <figcaption class="fig-caption">
                <div class="fig-head"><span class="fig-num">Fig. 2</span><span class="fig-title">Where the time went, 2021 to now</span></div>
                <div class="legend"><span><i class="sw work"></i>Work</span><span><i class="sw study"></i>Study</span></div>
            </figcaption>
        </figure>
    `;

    const entries = roles.map((item, index) => `
        <article class="role reveal">
            <div class="role-meta">
                <span class="role-num">${String(index + 1).padStart(2, '0')}</span>
                <span class="role-dates">${item.dates}</span>
                <span class="role-company">${item.company}</span>
            </div>
            <div class="role-body">
                <h3 class="role-title">${item.role} <span class="role-at">at ${item.company}</span></h3>
                <ul class="dash-list">${item.points.map(point => `<li>${point}</li>`).join('')}</ul>
                <p class="stack-line">${item.stack}</p>
            </div>
        </article>
    `).join('');

    registerSection('experience', `
        <header class="sec-head">
            <span class="sec-idx">02</span>
            <h2 class="sec-title">Experience</h2>
            <p class="sec-sub">Four roles across enterprise AI, industrial vision, web platforms and data science.</p>
        </header>
        ${timeline}
        <div class="roles">${entries}</div>
    `);
})();
