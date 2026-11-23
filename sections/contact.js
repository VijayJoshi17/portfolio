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
                <li hidden><a class="ulink" data-resume download="Vijay_Joshi_Resume.pdf">Résumé (PDF) ↓</a></li>
            </ul>
        </div>
        <!-- Paste your Web3Forms access key into data-web3forms-key (it is public by design).
             While it is empty, the form falls back to opening the visitor's email app. -->
        <form class="contact-form reveal" id="contactForm" data-web3forms-key="220efc72-3a84-4cb6-8b10-2d04ae03c39c" novalidate>
            <p class="mono-label">Send a message</p>
            <div class="form-row">
                <label><span>Name</span><input type="text" name="name" autocomplete="name" required></label>
                <label><span>Your email</span><input type="email" name="email" autocomplete="email" required></label>
            </div>
            <label><span>Subject</span><input type="text" name="subject" required></label>
            <label><span>Message</span><textarea name="message" rows="5" required></textarea></label>
            <input type="checkbox" name="botcheck" class="sr-only" tabindex="-1" autocomplete="off" aria-hidden="true">
            <div class="form-foot">
                <button type="submit" class="btn-primary" id="contactSubmit">Send message</button>
                <span class="form-note" id="contactNote" role="status" aria-live="polite"></span>
            </div>
        </form>
    </div>
`);
