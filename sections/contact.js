registerSection('contact', `
    <h2 class="section-title">Contact</h2>
    <p class="section-text">I am currently looking for new opportunities in AI/ML and Data Science. Whether you have a question or just want to say hi, feel free to drop a message!</p>
    <div class="contact-links">
        <a href="mailto:joshivijay2004@gmail.com"><i class="fas fa-envelope"></i> joshivijay2004@gmail.com</a>
        <a href="https://www.linkedin.com/in/vijay-joshi-4b5474244/" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i> LinkedIn</a>
        <a href="https://github.com/VijayJoshi17" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> GitHub</a>
        <a href="https://www.datascienceportfol.io/VijayJoshi" target="_blank" rel="noopener noreferrer"><i class="fas fa-chart-bar"></i> Data Science Portfolio</a>
    </div>
    <form class="contact-form" id="contactForm">
        <h3 class="form-heading">Send a message</h3>
        <div class="form-row">
            <input type="text" placeholder="Name" name="name" required>
            <input type="email" placeholder="Email" name="email" required>
        </div>
        <input type="text" placeholder="Subject" name="subject" required>
        <textarea placeholder="Message" name="message" required></textarea>
        <button type="submit" class="form-submit">Send Message</button>
        <div class="form-message" id="formMessage"></div>
    </form>
`);
