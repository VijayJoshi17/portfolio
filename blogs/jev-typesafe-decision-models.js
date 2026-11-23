window.registerBlog({
    slug: 'jev-typesafe-decision-models',
    title: 'Jev by TypeSafe: When Your AI Needs a Decision, Not an Essay',
    date: '2026-11-23',
    readingTime: 7,
    excerpt: 'Jev is a decision model: instead of generating text, it answers typed questions with calibrated probabilities. A practical look at how it works, where it fits in an AI system, and where it does not.',
    tags: ['LLMs', 'Decision Models', 'Evaluation', 'AI Engineering'],
    content: [
        {
            type: 'paragraph',
            text: 'A surprising number of LLM calls in production are not really asking for writing. Should this support ticket go to billing or technical? Is this answer grounded in the retrieved context? How risky is this account action, on a scale of one to five? We usually send these questions to a model that generates text, ask it politely for JSON, parse the result, and retry when the format breaks. The model writes an answer so that our code can read a decision out of it.'
        },
        {
            type: 'paragraph',
            text: 'Jev, released by TypeSafe AI in September 2026, takes a different approach. TypeSafe describes it as the first "System One" model: a model that evaluates typed questions against an input and returns structured results directly, with no text generation and no parsing. The name borrows from the System 1 and System 2 distinction in Daniel Kahneman\'s Thinking, Fast and Slow, where System 1 makes fast, intuitive judgments and System 2 does slow, deliberate reasoning.'
        },
        { type: 'heading', text: 'The contract: a state and typed questions' },
        {
            type: 'paragraph',
            text: 'A Jev request has two parts. The state is the thing being judged: a string, a JSON object, or an array, such as a support ticket, a retrieved passage, or an agent\'s proposed action. Alongside it you send any number of questions. Each question is evaluated independently and in parallel against the same state, and each one declares what type of answer it expects.'
        },
        {
            type: 'list',
            items: [
                'Choice: pick one option from a set of up to 255, each with an optional description. Returns the chosen option, a probability for every option, and a confidence value.',
                'Score: place the state on an ordered rubric of 2 to 10 levels. Returns a probability-weighted score along with the full distribution across levels.',
                'Noul: a yes or no question. Returns the probability that the answer is yes.',
                'Box: locate something in an image and return its bounding box. Image input is newer, and integrations such as Cloudflare still label it beta.'
            ]
        },
        {
            type: 'paragraph',
            text: 'For example, a routing question might ask which department should handle a ticket, with billing, technical, and sales as the options. Instead of a sentence, the response carries the answer and the evidence behind it: billing, with probabilities of 0.87 for billing and 0.13 for technical, and a confidence of 0.8. Because the output is constrained to the declared type, there is no malformed JSON to catch, no extra prose to strip, and no option the model invented on its own.'
        },
        {
            type: 'callout',
            text: 'The useful output is not just the answer. It is the probability distribution behind the answer, because that is what lets your code decide when to trust it.'
        },
        { type: 'heading', text: 'Why calibration is the real feature' },
        {
            type: 'paragraph',
            text: 'A probability is only useful if it is calibrated: when the model says 0.8, it should be right about 80% of the time. TypeSafe says Jev is trained with a method it calls Reinforcement Learning for Calibrated Decisions (RLCD), and that higher confidence means higher accuracy. If that holds for your task, confidence becomes a control signal. You can act automatically above a threshold, escalate to a stronger model or a person below it, and log the uncertain middle for review. Pydantic AI\'s integration suggests exactly this pattern: use Jev for the decision and fall back to an LLM when confidence is low.'
        },
        {
            type: 'paragraph',
            text: 'Thresholds always trade one kind of error for another. Set the bar too low and wrong answers pass; set it too high and good answers get escalated for no reason. A noisy or biased judge makes every threshold worse. That is why calibration claims need to be checked on your own labelled examples before a confidence gate goes into production.'
        },
        { type: 'figure', name: 'grader', caption: 'Thresholds on a judge\'s confidence trade false passes for false fails' },
        { type: 'heading', text: 'Speed and cost, with caveats' },
        {
            type: 'paragraph',
            text: 'Because Jev produces all of its answers in a single query instead of generating tokens one at a time, TypeSafe reports end-to-end response times of roughly 70 to 500 milliseconds and claims it is 40 to 200 times faster than frontier LLMs for decision-shaped queries. Pricing is based on input only: $0.042 per million input tokens, with output tokens free. A request can hold up to 64k tokens in total and 32k for the state plus any single question; an opt-in long-context header raises the limit at the cost of speed and accuracy.'
        },
        {
            type: 'paragraph',
            text: 'Treat these figures as a reason to test rather than a conclusion. Most of the published benchmarks come from TypeSafe itself, and its launch post is candid that its speed tests are run from laptops on the US West Coast and that its reference answers lean toward OpenAI and Anthropic models. Third-party write-ups of a community leaderboard suggest Jev performs near the top but with a narrow lead, and not as the best-calibrated entrant. The model is also closed: there are no open weights, no paper, and the same weights serve every customer.'
        },
        { type: 'heading', text: 'Where it fits in an AI system' },
        {
            type: 'paragraph',
            text: 'TypeSafe pitches Jev as "smart if-statements": the many small judgments inside software that are too fuzzy for rules but do not need an essay. In practice, that maps onto several familiar pieces of an AI system.'
        },
        {
            type: 'list',
            items: [
                'Routing: send tickets to the right queue, or choose which tool or sub-agent an agent should call next.',
                'Guardrails: flag prompt injection, jailbreak attempts, or unsafe actions before an agent executes them.',
                'Evaluation: score outputs against a rubric as a fast, cheap judge. DeepEval already supports Jev as an evaluation model.',
                'RAG checks: grade whether retrieved passages are relevant and whether an answer is supported by them, on every request rather than in an offline batch.',
                'Bulk classification: map one question over thousands of records where per-call latency and cost would make an LLM impractical.'
            ]
        },
        {
            type: 'paragraph',
            text: 'The common thread is that each of these is a decision with a known set of outcomes. When the answer space is defined in advance, a model that only ever returns a valid answer, with a probability attached, removes a whole class of parsing and validation code.'
        },
        { type: 'heading', text: 'Where it does not fit' },
        {
            type: 'paragraph',
            text: 'Jev does not write. It cannot draft a reply, summarize a document, or explain its reasoning, so it gives you no written rationale for audits. Pydantic AI\'s documentation also lists the kinds of questions it handles badly: arithmetic, counting, and date comparisons; multi-hop indirection; very large state that is mostly irrelevant; adversarial text designed to steer the answer; and literal reading of negations and scoped words. A few practical rules follow from that.'
        },
        {
            type: 'list',
            items: [
                'Compute numbers and dates in code, then ask Jev about the result.',
                'Keep the state small and relevant instead of passing a whole document.',
                'Ask one judgment per question rather than hiding several inside one.',
                'Route anything that needs generated text to an LLM.'
            ]
        },
        { type: 'heading', text: 'Trying it out' },
        {
            type: 'paragraph',
            text: 'Jev is available through TypeSafe\'s API in early access, and it also appears in Cloudflare Workers AI as typesafe/jev, in Pydantic AI as typesafe:jev-latest, and in DeepEval. TypeSafe\'s documentation lists jev-1.14.0 as the current release from October 2026, with jev-1.13.0 as the previous one; some integrations still reference 1.13, so check which version you are actually calling.'
        },
        {
            type: 'paragraph',
            text: 'A good first experiment is to take an existing LLM classification or routing call and label 100 to 200 real examples. Run both models on the same set and compare accuracy, latency, and cost. Then group Jev\'s answers by confidence and check whether the high-confidence buckets really are more accurate. That last step tells you whether a confidence threshold is safe to rely on.'
        },
        { type: 'heading', text: 'The takeaway' },
        {
            type: 'paragraph',
            text: 'Jev is a bet that much of what we ask LLMs to do is not writing but deciding, and that a model built for decisions can answer faster, cheaper, and in a form software can use directly. Typed answers with calibrated probabilities are a genuinely useful contract for routing, guardrails, and evaluation.'
        },
        {
            type: 'paragraph',
            text: 'It is also young, closed, and mostly benchmarked by its own vendor. The same lesson from evaluating any model applies here: define the decisions you care about, build a small labelled set, and measure. If the confidence holds up on your data, a decision model can take a lot of slow, expensive calls off your critical path.'
        }
    ]
});
