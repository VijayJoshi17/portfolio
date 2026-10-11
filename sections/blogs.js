const blogPosts = [];

function escapeBlogText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function renderBlogPosts() {
    if (blogPosts.length === 0) {
        return '<p class="blog-empty">No posts yet.</p>';
    }

    return blogPosts.map(post => `
        <article class="entry blog-entry">
            <time class="entry-date" datetime="${escapeBlogText(post.date)}">${escapeBlogText(post.date)}</time>
            <div class="entry-body">
                <h3 class="entry-title">${escapeBlogText(post.title)}</h3>
                <p class="blog-excerpt">${escapeBlogText(post.excerpt)}</p>
                ${(post.content || []).map(paragraph => `<p>${escapeBlogText(paragraph)}</p>`).join('')}
                ${(post.tags || []).length ? `<div class="entry-tags">${post.tags.map(tag => `<span>${escapeBlogText(tag)}</span>`).join('')}</div>` : ''}
            </div>
        </article>
    `).join('');
}

registerSection('blogs', `
    <h2 class="section-title">Blogs</h2>
    <div class="blog-list">${renderBlogPosts()}</div>
`);