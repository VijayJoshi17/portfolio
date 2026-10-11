Portfolio Website

## Routes

The root path shows the full portfolio. Sections also have individual paths: `/about`, `/experience`, `/education`, `/skills`, `/projects`, `/achievements`, `/blogs`, and `/contact`.

GitHub Pages uses `404.html` to send direct route visits back through the app, including project pages hosted under a repository subpath. Client-side navigation and refreshable routes work without a backend or Node.js.

## Writing blog posts

Add posts to the `blogPosts` array in `sections/blogs.js`. Each post uses `title`, `date` (`YYYY-MM-DD`), `excerpt`, and `content` (an array of paragraphs). `tags` is optional. The page renders all posts from this array; no backend is required.
