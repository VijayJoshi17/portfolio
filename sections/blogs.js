function escapeBlogText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function blogRouteHref(route) {
    const basePath = window.portfolioBasePath || '';
    return `${basePath}/${route}`;
}

function formatBlogDate(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const blogSectionHead = `
    <header class="sec-head">
        <span class="sec-idx">06</span>
        <h2 class="sec-title">Writing</h2>
        <p class="sec-sub">Notes on retrieval, evaluation and building with LLMs.</p>
    </header>`;

function renderBlogPosts() {
    const blogPosts = window.blogPosts || [];
    if (blogPosts.length === 0) {
        return '<p class="blog-empty">No posts yet.</p>';
    }

    const sorted = [...blogPosts].sort((first, second) => second.date.localeCompare(first.date));
    return sorted.map((post, index) => `
        <article class="post-row">
            <time class="post-date" datetime="${escapeBlogText(post.date)}">${escapeBlogText(formatBlogDate(post.date))}</time>
            <div class="post-body">
                <h3 class="post-title"><a href="${escapeBlogText(blogRouteHref(`blogs/${post.slug}`))}" data-route="blogs/${escapeBlogText(post.slug)}">${escapeBlogText(post.title)}</a></h3>
                <p class="post-excerpt">${escapeBlogText(post.excerpt)}</p>
                <p class="stack-line">${escapeBlogText(post.readingTime)} min read${(post.tags || []).length ? ` · ${post.tags.map(escapeBlogText).join(' · ')}` : ''}</p>
            </div>
            <span class="post-arrow" aria-hidden="true">↗</span>
        </article>
    `).join('');
}

function renderBlogContent(blocks) {
    return blocks.map(block => {
        if (block.type === 'heading') return `<h2 class="blog-subheading">${escapeBlogText(block.text)}</h2>`;
        if (block.type === 'list') return `<ul class="blog-list-items">${block.items.map(item => `<li>${escapeBlogText(item)}</li>`).join('')}</ul>`;
        if (block.type === 'figure') return `<figure class="fig blog-interactive fig-${escapeBlogText(block.name)}" data-figure="${escapeBlogText(block.name)}" data-fig-num="Interactive" data-fig-title="${escapeBlogText(block.caption)}"></figure>`;
        if (block.type === 'callout') return `<blockquote class="blog-callout">${escapeBlogText(block.text)}</blockquote>`;
        if (block.type === 'image') {
            const imageUrl = new URL(block.src, window.portfolioAssetBaseUrl).href;
            return `<figure class="blog-figure"><img src="${escapeBlogText(imageUrl)}" alt="${escapeBlogText(block.alt)}" loading="lazy"><figcaption>${escapeBlogText(block.caption)}</figcaption></figure>`;
        }
        return `<p>${escapeBlogText(block.text)}</p>`;
    }).join('');
}

function renderBlogPage(slug) {
    const blogPosts = window.blogPosts || [];
    const section = document.getElementById('blogs');
    if (!section) return;

    const post = slug ? blogPosts.find(item => item.slug === slug) : null;
    if (slug && !post) {
        section.innerHTML = `
            <h2 class="sec-title">Article not found</h2>
            <p class="sec-sub">This blog post could not be found.</p>
            <p class="blog-back-link"><a href="${escapeBlogText(blogRouteHref('blogs'))}" data-route="blogs">Back to blogs</a></p>
        `;
        return;
    }

    if (!post) {
        section.innerHTML = `
            ${blogSectionHead}
            <div class="post-list">${renderBlogPosts()}</div>
        `;
        return;
    }

    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    section.innerHTML = `
        <article class="blog-article">
            <a class="blog-back-link" href="${escapeBlogText(blogRouteHref('blogs'))}" data-route="blogs">← All writing</a>
            <p class="blog-article-meta">${escapeBlogText(formatBlogDate(post.date))} <span aria-hidden="true">·</span> ${escapeBlogText(post.readingTime)} min read</p>
            <h1 class="blog-article-title">${escapeBlogText(post.title)}</h1>
            <p class="blog-article-excerpt">${escapeBlogText(post.excerpt)}</p>
            ${(post.tags || []).length ? `<p class="stack-line">${post.tags.map(escapeBlogText).join(' · ')}</p>` : ''}
            <div class="blog-article-content">${renderBlogContent(post.content)}</div>
            <div class="blog-actions" data-blog-url="${escapeBlogText(canonicalUrl)}" data-blog-title="${escapeBlogText(post.title)}">
                <button class="blog-action-button" type="button" data-copy-blog-link title="Copy a link to this article">Copy link</button>
                <button class="blog-action-button" type="button" data-share-blog title="Share this article">Share ↗</button>
                <span class="blog-action-status" role="status" aria-live="polite"></span>
            </div>
        </article>
    `;
}

registerSection('blogs', blogSectionHead);

document.addEventListener('click', async event => {
    const action = event.target.closest('[data-copy-blog-link], [data-share-blog]');
    if (!action) return;

    const actions = action.closest('.blog-actions');
    const url = actions.dataset.blogUrl;
    const status = actions.querySelector('.blog-action-status');
    const copyLink = async () => {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
            return;
        }

        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = url;
        temporaryInput.setAttribute('readonly', '');
        temporaryInput.style.position = 'fixed';
        temporaryInput.style.opacity = '0';
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand('copy');
        temporaryInput.remove();
        if (!copied) throw new Error('Clipboard unavailable');
    };

    try {
        if (action.hasAttribute('data-share-blog') && navigator.share) {
            await navigator.share({ title: actions.dataset.blogTitle, url });
            status.textContent = 'Shared';
        } else {
            await copyLink();
            status.textContent = action.hasAttribute('data-share-blog') ? 'Link copied to clipboard' : 'Link copied';
        }
    } catch (error) {
        status.textContent = error.name === 'AbortError' ? '' : 'Could not copy the link';
    }
});