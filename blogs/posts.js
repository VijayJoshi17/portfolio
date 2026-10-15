window.blogPosts = window.blogPosts || [];
window.registerBlog = function registerBlog(post) {
    if (!post || !post.slug || !post.title) return;
    if (!window.blogPosts.some(item => item.slug === post.slug)) {
        window.blogPosts.push(post);
    }
};