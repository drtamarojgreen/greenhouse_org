'use strict';

const { html, safeUrl } = require('../html');
const { containerId } = require('../site');

function image(src, alt, className) {
    const url = safeUrl(src, '');
    return url ? html`<img class="${className}" src="${url}" alt="${alt}" loading="lazy">` : '';
}

function homePage() {
    return {
        key: 'home',
        title: null,
        description: 'Providing supportive mental health growth in person and virtually in Mountain Lakes, New Jersey.',
        body: html`
        <section class="home-hero" aria-labelledby="hero-title">
            <div class="home-hero-content">
                <p class="hero-eyebrow">Greenhouse for Mental Health Development</p>
                <h1 id="hero-title">Bloom into your better self</h1>
                <p>Providing supportive mental health growth — in person and virtually</p>
                <a class="button button-light" href="#contact">Get in touch</a>
            </div>
        </section>
        <section class="welcome-section home-section" id="welcome">
            <p class="section-kicker">Welcome</p>
            <h2>About Greenhouse For Mental Health Development P.C.</h2>
            <p>Greenhouse For Mental Health Development provides mental health treatment utilizing psychotherapy and/or medication management. Ayodele Green, MD is the Board-Certified Psychiatrist at Greenhouse For Mental Health Development.</p>
        </section>
        <section class="about-section home-section" id="about">
            <div class="about-copy">
                <p class="section-kicker">About</p>
                <h2>A thoughtful, patient-centered approach</h2>
                <p>Ayodele Green, MD graduated from Temple University Medical School in Philadelphia, PA and completed a Psychiatry Residency at Harlem Hospital of Columbia University in New York City. She then completed a Fellowship in Child and Adolescent Psychiatry at UMDNJ in Newark, NJ.</p>
                <p>She sees both adults and children using a patient-centered, holistic approach with psychotherapy as well as medication management.</p>
                <a class="text-link" href="/schedule">Appointments and scheduling <span aria-hidden="true">→</span></a>
            </div>
            <div class="about-gallery" aria-label="Greenhouse office">
                ${image('/images/greenhouse-exterior.jpg', 'The Greenhouse office exterior', 'gallery-image gallery-image-tall')}
                ${image('/images/greenhouse-office.jpg', 'A room at the Greenhouse office', 'gallery-image')}
                ${image('/images/greenhouse-interior.jpg', 'The Greenhouse office interior', 'gallery-image')}
            </div>
        </section>
        <section class="hours-section home-section" id="hours">
            <div class="hours-photo">${image('/images/lavender-flowers.jpg', 'Lavender flowers', 'hours-image')}</div>
            <div class="hours-copy">
                <p class="section-kicker">Hours</p>
                <h2>Care that fits your life</h2>
                <p>Appointments are available in person and online. Weekend hours in person and online are also available.</p>
                <ul class="hours-list">
                    <li><span>Monday</span><span>9:00 am – 5:00 pm</span></li>
                    <li><span>Tuesday</span><span>9:00 am – 5:00 pm</span></li>
                    <li><span>Wednesday</span><span>9:00 am – 7:00 pm</span></li>
                </ul>
                <p class="hours-note">Please call or email to ask about availability.</p>
            </div>
        </section>
        <section class="contact-section home-section" id="contact">
            <div class="contact-copy">
                <p class="section-kicker">Contact</p>
                <h2>We’re here to help you grow</h2>
                <p>Call or email Greenhouse for Mental Health Development to get started.</p>
                <p class="contact-details"><a href="tel:+19733166047">973-316-6047</a><br><a href="mailto:officemanager@greenhousemd.org">officemanager@greenhousemd.org</a></p>
                <address>115 Route 46 West, Building F #14<br>Mountain Lakes, NJ 07046</address>
                <a class="button button-primary" href="/schedule">Schedule an appointment</a>
            </div>
            ${image('/images/greenhouse-location.jpg', 'Greenhouse office location, Building F #14', 'contact-image')}
        </section>`
    };
}

function booksPage({ books }) {
    const summary = books.summary || {};
    const list = Array.isArray(books.books) ? books.books : [];
    const intro = summary.Section1RegularLongtext1 || summary.Section1RgularLongtext1;

    return {
        key: 'books',
        title: 'Books',
        description: intro,
        body: html`
        <section class="page-header">
            <h1>${summary.text1 || 'Books'}</h1>
            ${intro ? html`<p class="lead">${intro}</p>` : ''}
        </section>
        <section class="content-section" aria-labelledby="featured-books">
            <h2 id="featured-books">${summary.Section2RegularTitle1 || 'Featured Books'}</h2>
            ${summary.Section2RegularSubtitle1 ? html`<p class="subtitle">${summary.Section2RegularSubtitle1}</p>` : ''}
            ${summary.Section2RegularLongtext1 ? html`<p>${summary.Section2RegularLongtext1}</p>` : ''}
            <ul class="card-grid book-list">
                ${list.map(book => html`
                <li class="card book">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <p class="book-description">${book.description}</p>
                </li>`)}
            </ul>
        </section>
        <section id="${containerId('books')}" class="app-host" aria-label="Recommended reading"></section>`
    };
}

function newsPage({ news }) {
    const header = news.header || {};
    const articles = Array.isArray(news.articles) ? news.articles : [];

    return {
        key: 'news',
        title: 'News',
        description: header.longText,
        body: html`
        <section class="page-header">
            <h1>${header.title || 'News'}</h1>
            ${header.longText ? html`<p class="lead">${header.longText}</p>` : ''}
        </section>
        <section class="content-section" aria-label="Articles">
            ${articles.map(article => html`
            <article class="feature news-article">
                ${image(article.imageUrl, '', 'feature-image')}
                <div class="feature-body">
                    <h2>${article.headline}</h2>
                    <p><time datetime="${article.date}">${article.date}</time> - ${article.content}</p>
                </div>
            </article>`)}
        </section>
        ${header.sectionSubtitle || header.sectionText ? html`
        <section class="content-section callout">
            <h2>${header.sectionSubtitle || ''}</h2>
            <p>${header.sectionText || ''}</p>
        </section>` : ''}
        <section id="${containerId('news')}" class="app-host" aria-label="Latest headlines"></section>`
    };
}

function videosPage({ videos }) {
    return {
        key: 'videos',
        title: 'Videos',
        description: 'Videos from the Greenhouse for Mental Health Development channel.',
        body: html`
        <section class="page-header">
            <h1>Videos</h1>
            <p class="lead">Watch the latest from the Greenhouse for Mental Health Development channel.</p>
        </section>
        <section class="content-section" aria-label="Videos">
            ${videos.length === 0 ? html`<p>No videos are available right now. Please check back soon.</p>` : ''}
            <ul class="card-grid video-list">
                ${videos.map(video => html`
                <li class="card video">
                    ${video.embeddable
                        ? html`<div class="video-frame"><iframe src="${safeUrl(video.embedUrl)}" title="${video.title}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
                        : ''}
                    <h2 class="video-title">${video.title}</h2>
                    <p>${video.description}</p>
                    <p><a href="${safeUrl(video.url)}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>
                </li>`)}
            </ul>
        </section>`
    };
}

function inspirationPage({ inspiration }) {
    const summary = inspiration.summary || {};
    const quotes = Array.isArray(inspiration.quotes) ? inspiration.quotes : [];

    return {
        key: 'inspiration',
        title: summary.pageTitle || 'Inspiration',
        description: summary.sectionText,
        body: html`
        <section class="page-header">
            <h1>${summary.pageTitle || 'Inspiration'}</h1>
            ${summary.sectionText ? html`<p class="lead">${summary.sectionText}</p>` : ''}
            ${summary.titleButton ? html`<a class="button button-primary" href="#quotes">${summary.titleButton}</a>` : ''}
        </section>
        <section id="quotes" class="content-section" aria-labelledby="quotes-heading">
            <h2 id="quotes-heading">${summary.sectionTitle || 'Quotes'}</h2>
            ${summary.sectionSubtitle ? html`<p class="subtitle">${summary.sectionSubtitle}</p>` : ''}
            <ul class="card-grid quote-list">
                ${quotes.map(quote => html`
                <li class="card">
                    <figure class="quote">
                        <blockquote><p>${quote.text}</p></blockquote>
                        <figcaption>${quote.author}</figcaption>
                    </figure>
                </li>`)}
            </ul>
        </section>`
    };
}

module.exports = { homePage, booksPage, newsPage, videosPage, inspirationPage };
