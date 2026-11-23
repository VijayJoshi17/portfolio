registerSection('contact', `
    <header class="sec-head">
        <span class="sec-idx">08</span>
        <h2 class="sec-title contact-title">Have a hard retrieval problem? <em>Let's talk.</em></h2>
        <p class="sec-sub">I'm open to new opportunities in AI/ML and Data Science. Questions, ideas, or just saying hi are all welcome.</p>
    </header>
    <div class="split contact-grid">
        <div class="contact-side reveal">
            <a class="contact-email" href="mailto:joshivijay2004@gmail.com">joshivijay2004@gmail.com</a>
            <button class="copy-btn" type="button" id="copyEmail">Copy address</button>
            <span class="copy-status" id="copyEmailStatus" role="status" aria-live="polite"></span>
            <p class="local-time" id="localTime"></p>
            <ul class="contact-links">
                <li><a class="ulink" href="https://www.linkedin.com/in/vijay-joshi-4b5474244/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></li>
                <li><a class="ulink" href="https://github.com/VijayJoshi17" target="_blank" rel="noopener noreferrer">GitHub ↗</a></li>
                <li><a class="ulink" href="https://www.datascienceportfol.io/VijayJoshi" target="_blank" rel="noopener noreferrer">Data Science Portfolio ↗</a></li>
            </ul>
        </div>
        <form class="contact-form reveal" id="contactForm">
            <p class="mono-label">Compose a message</p>
            <label><span>Name</span><input type="text" name="name" autocomplete="name" required></label>
            <label><span>Subject</span><input type="text" name="subject" required></label>
            <label><span>Message</span><textarea name="message" rows="5" required></textarea></label>
            <div class="form-foot">
                <button type="submit" class="btn-primary">Open in email app</button>
                <span class="form-note">Opens your mail client with this message filled in.</span>
            </div>
        </form>
    </div>
`);
