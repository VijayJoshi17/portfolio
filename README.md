Portfolio Website

## Routes

The root path shows the full portfolio. Sections also have individual paths: `/about`, `/experience`, `/education`, `/skills`, `/projects`, `/achievements`, `/blogs`, and `/contact`. Individual posts use `/blogs/<slug>`, such as `/blogs/llm-evals`.

GitHub Pages uses `404.html` to send direct route visits back through the app, including project pages hosted under a repository subpath. Client-side navigation and refreshable routes work without a backend or Node.js.

## Writing blog posts

Add each post as an object in `blogs/posts.js`. Give it a unique URL-safe `slug`, a `title`, `date` (`YYYY-MM-DD`), `readingTime` (minutes), `excerpt`, `tags`, and a `content` array. Content blocks support `paragraph`, `heading`, `list` (with an `items` array), and `callout` (with `text`). `sections/blogs.js` renders the listing and individual pages, including Copy link and Share actions. A post at slug `my-post` is available at `/blogs/my-post`. No backend is required.
