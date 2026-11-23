Portfolio Website

## Routes

The root path shows the full portfolio. Sections also have individual paths: `/about`, `/experience`, `/education`, `/skills`, `/projects`, `/achievements`, `/blogs`, and `/contact`. Individual posts use `/blogs/<slug>`, such as `/blogs/llm-evals`.

GitHub Pages uses static route entry points to provide social link metadata and redirect visitors into the app. `404.html` handles unknown routes and project pages hosted under a repository subpath. Client-side navigation and refreshable routes work without a backend or Node.js.

Each section and blog post has its own static entry point so social link previews can read route-specific Open Graph metadata before the app loads.

## Writing blog posts

Add each post as an object in `blogs/posts.js`. Give it a unique URL-safe `slug`, a `title`, `date` (`YYYY-MM-DD`), `readingTime` (minutes), `excerpt`, `tags`, and a `content` array. Content blocks support `paragraph`, `heading`, `list` (with an `items` array), `callout` (with `text`), `image` (with `src`, `alt`, `caption`), and `figure` (an interactive figure from `figures.js`: `name` is `mmr`, `grader`, `drowsy` or `tweets`, plus a `caption`). `sections/blogs.js` renders the listing and individual pages, including Copy link and Share actions. A post at slug `my-post` is available at `/blogs/my-post`. No backend is required.

## Link-preview cards

Social previews use 1200×630 images in `images/og/`, rendered from `tools/og-card.html`. After adding a blog post, regenerate them and point the post's static entry point (`blogs/<slug>/index.html`) at `images/og/<slug>.jpg`:

```
npm install --no-save playwright && npx playwright install chromium
node tools/make-og-cards.js
```
