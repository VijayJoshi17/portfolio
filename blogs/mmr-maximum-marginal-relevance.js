window.registerBlog({
    slug: 'mmr-maximum-marginal-relevance',
    title: 'MMR (Maximum Marginal Relevance): A Better Retrieval Strategy for RAG',
    date: '2026-10-15',
    readingTime: 6,
    excerpt: 'MMR helps RAG systems retrieve documents that are both relevant and diverse, reducing redundancy and improving coverage for multi-part questions.',
    tags: ['RAG', 'Retrieval', 'LLMs', 'Information Retrieval'],
    content: [
        {
            type: 'paragraph',
            text: 'Retrieval-augmented generation works best when the system finds the right context, not just the most similar chunk. In many production RAG pipelines, a simple semantic search returns the top-k passages based on similarity to the user query. That sounds sensible, but it often creates a familiar problem: the retrieved results are all near-duplicate or all oriented around the same subtopic.'
        },
        {
            type: 'paragraph',
            text: 'This is especially common in real-world knowledge bases where one topic appears across many documents, and the same concept is repeated with slightly different phrasing. When that happens, the final answer may be narrow, repetitive, or biased toward the most obvious documents instead of the full space of useful evidence.'
        },
        { type: 'heading', text: 'Why top-k retrieval is not always enough' },
        {
            type: 'paragraph',
            text: 'A naive retriever often prioritizes documents with the highest similarity to the query. That is useful when the question is precise and the answer lives in one canonical source. But many real questions are multi-faceted: they ask for trade-offs, comparisons, examples, failure modes, and supporting evidence from different parts of the corpus.'
        },
        {
            type: 'list',
            items: [
                'The top results may be redundant and cover only one angle of the question.',
                'Important but less obvious documents can be skipped if they are slightly less similar.',
                'The answer may become too narrow because the system over-optimizes for similarity alone.',
                'Multi-hop or multi-aspect queries need context diversity, not just a high score.'
            ]
        },
        {
            type: 'callout',
            text: 'A good RAG retrieval strategy should balance relevance and diversity. Answers improve when the system gathers evidence that is both useful and complementary.'
        },
        { type: 'heading', text: 'What is MMR?' },
        {
            type: 'paragraph',
            text: 'Maximum Marginal Relevance, or MMR, is a ranking strategy designed to reduce redundancy while preserving relevance. Instead of simply picking the documents with the highest query similarity, MMR selects each new item by balancing two signals: how relevant it is to the query and how different it is from what has already been selected.'
        },
        {
            type: 'paragraph',
            text: 'The idea is simple but powerful. For a query q and a selected set S, MMR scores a candidate document d as follows: MMR(q, S) = argmax_{d in R \ S} [ λ · Sim(d, q) - (1 - λ) · max_{s in S} Sim(d, s) ] where Sim measures similarity, and λ controls the trade-off between relevance and diversity.'
        },
        {
            type: 'paragraph',
            text: 'If λ is high, the retriever behaves more like standard similarity search. If λ is lower, the retriever penalizes candidates that are too similar to what is already in the set, encouraging broader coverage. This makes MMR especially useful for retrieval in RAG pipelines where the final answer must synthesize different evidence rather than echo a single narrow source.'
        },
        { type: 'heading', text: 'Why MMR matters for RAG' },
        {
            type: 'list',
            items: [
                'It reduces redundancy when the corpus contains multiple versions of the same idea.',
                'It improves coverage for questions with several subtopics or decision criteria.',
                'It helps the generator see complementary context rather than repeating one theme.',
                'It is often more robust when the user asks for comparisons, trade-offs, or multi-step explanations.'
            ]
        },
        {
            type: 'paragraph',
            text: 'Consider a user asking: “Compare the benefits and limitations of using vector databases versus graph databases for enterprise search.” A naive retrieval pipeline might fetch several passages all about vector search, all from similar blog posts, and miss the graph side or the trade-off discussion. MMR helps by selecting documents that are relevant to the question while avoiding near-identical coverage, making the final answer richer and more balanced.'
        },
        { type: 'heading', text: 'How MMR fits into a RAG pipeline' },
        {
            type: 'paragraph',
            text: 'MMR is usually applied after an initial candidate set is generated. The retriever first gathers a larger pool of relevant documents, then iteratively chooses items that maximize relevance while penalizing overlap. In many systems, this happens at the chunk-selection stage before the language model reads the final context.'
        },
        {
            type: 'list',
            items: [
                'Generate the candidate set using a vector search or hybrid retrieval step.',
                'Score each candidate for query relevance.',
                'Select the first item based on highest relevance.',
                'For each remaining item, compute the MMR score using both relevance and dissimilarity from the selected set.',
                'Continue until the context window is filled or the diversity threshold is satisfied.'
            ]
        },
        {
            type: 'paragraph',
            text: 'The λ parameter is important here. A value around 0.7 is a common starting point, but the best value depends on how much redundancy exists in your corpus and how broad or precise the user questions tend to be. This is one of those retrieval settings that is worth tuning with real queries and domain-specific evaluation.'
        },
        { type: 'heading', text: 'When MMR is especially useful' },
        {
            type: 'list',
            items: [
                'Your document set contains repeated concepts with similar wording.',
                'Users ask comparison, synthesis, or multi-aspect questions.',
                'You want the answer to include multiple angles instead of one dominant theme.',
                'The knowledge base is large and diverse, but the context window is small.'
            ]
        },
        {
            type: 'paragraph',
            text: 'MMR is not a silver bullet. If the user asks for a very specific fact from a single canonical source, conventional top-k retrieval may be enough. But when the objective is to produce a grounded, comprehensive answer from a large knowledge base, MMR often gives better results because it keeps the context both relevant and diverse.'
        },
        { type: 'heading', text: 'The practical takeaway' },
        {
            type: 'paragraph',
            text: 'In production RAG systems, retrieval quality is often the difference between a helpful answer and a shallow one. MMR is a useful retrieval strategy because it recognizes that relevance and diversity are both important. It helps the model see the full story, not just the most obvious fragments.'
        },
        {
            type: 'paragraph',
            text: 'If you are building a retrieval pipeline, try comparing standard top-k retrieval with an MMR-based reranking step on a small set of real user queries. You may find that the improvement is not just in answer quality, but in how well the system handles ambiguity, multi-part reasoning, and broad knowledge synthesis.'
        }
    ]
});
