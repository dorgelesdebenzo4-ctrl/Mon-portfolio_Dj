document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navbar = document.getElementById('navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.getElementById('main-navigation');
    const scrollProgress = document.getElementById('scroll-progress');
    const toggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    const saved = getStoredTheme();
    html.setAttribute('data-theme', saved);
    updateIcon(saved);

    toggle?.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        try {
            localStorage.setItem('theme', next);
        } catch (error) {
            // Theme still changes for the current visit if storage is blocked.
        }
        updateIcon(next);
        toggle.classList.add('spin');
        setTimeout(() => toggle.classList.remove('spin'), 400);
    });

    function getStoredTheme() {
        try {
            return localStorage.getItem('theme') || 'dark';
        } catch (error) {
            return 'dark';
        }
    }

    function updateIcon(theme) {
        if (!toggle) return;
        toggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    function closeMobileMenu() {
        navToggle?.classList.remove('active');
        navToggle?.setAttribute('aria-expanded', 'false');
        navLinks?.classList.remove('active');
        document.body.classList.remove('menu-open');
    }

    navToggle?.addEventListener('click', () => {
        const isOpen = navLinks?.classList.toggle('active');
        navToggle.classList.toggle('active', Boolean(isOpen));
        navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
        document.body.classList.toggle('menu-open', Boolean(isOpen));
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
            closeMobileMenu();
        });
    });

    const setNavState = () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 24);
    };

    const updateScrollProgress = () => {
        if (!scrollProgress) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        scrollProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };

    const sectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const linkedSections = sectionLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    const setActiveLink = () => {
        const passedSections = linkedSections.filter(section => section.getBoundingClientRect().top <= 140);
        const current = passedSections[passedSections.length - 1] || linkedSections[0];

        sectionLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${current?.id}`);
        });
    };

    let scrollTicking = false;
    const updateScrollUi = () => {
        setNavState();
        updateScrollProgress();
        setActiveLink();
        scrollTicking = false;
    };

    updateScrollUi();
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        window.requestAnimationFrame(updateScrollUi);
        scrollTicking = true;
    }, { passive: true });
    window.addEventListener('resize', updateScrollUi);

    const typedTarget = document.getElementById('typed-text');
    const typedPhrases = [
        'Identités visuelles haut de gamme.',
        'Branding, print et social media.',
        'Design graphique basé à Abidjan.'
    ];

    if (typedTarget) {
        if (prefersReducedMotion) {
            typedTarget.textContent = typedPhrases[0];
        } else {
            let phraseIndex = 0;
            let charIndex = 0;
            let deleting = false;

            const type = () => {
                const currentPhrase = typedPhrases[phraseIndex];
                typedTarget.textContent = currentPhrase.slice(0, charIndex);

                if (!deleting && charIndex < currentPhrase.length) {
                    charIndex += 1;
                    setTimeout(type, 62);
                    return;
                }

                if (!deleting && charIndex === currentPhrase.length) {
                    deleting = true;
                    setTimeout(type, 1250);
                    return;
                }

                if (deleting && charIndex > 0) {
                    charIndex -= 1;
                    setTimeout(type, 34);
                    return;
                }

                deleting = false;
                phraseIndex = (phraseIndex + 1) % typedPhrases.length;
                setTimeout(type, 280);
            };

            type();
        }
    }

    const revealItems = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach(item => item.classList.add('is-visible'));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.16,
            rootMargin: '0px 0px -70px 0px'
        });

        revealItems.forEach((item, index) => {
            item.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
            observer.observe(item);
        });
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-item, .portfolio-note');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterButtons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');

            galleryCards.forEach(card => {
                const shouldShow = filter === 'all' || card.dataset.category === filter;
                card.classList.toggle('is-hidden', !shouldShow);
            });

            const grid = document.getElementById('portfolio-grid');
            grid?.classList.remove('filtering');
            window.requestAnimationFrame(() => {
                grid?.classList.add('filtering');
                window.setTimeout(() => grid?.classList.remove('filtering'), 460);
            });
        });
    });

    if (!prefersReducedMotion && window.matchMedia('(min-width: 900px)').matches) {
        const parallaxImages = document.querySelectorAll('.gallery-item img');
        let ticking = false;

        const updateParallax = () => {
            parallaxImages.forEach(image => {
                const rect = image.getBoundingClientRect();
                const viewportMid = window.innerHeight / 2;
                const imageMid = rect.top + rect.height / 2;
                const offset = (viewportMid - imageMid) * 0.035;
                image.style.setProperty('--parallax', `${Math.max(-16, Math.min(16, offset))}px`);
            });
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (ticking) return;
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }, { passive: true });

        updateParallax();
    }

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const galleryImages = Array.from(document.querySelectorAll('.gallery-item img, .mockup-card img'));
    let currentImageIndex = 0;

    function openLightbox(index) {
        const image = galleryImages[index];
        if (!lightbox || !lightboxImg || !image) return;

        currentImageIndex = index;
        lightboxImg.src = image.currentSrc || image.src;
        lightboxImg.alt = image.alt;
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function showImage(direction) {
        currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
        const image = galleryImages[currentImageIndex];
        if (!image || !lightboxImg) return;
        lightboxImg.src = image.currentSrc || image.src;
        lightboxImg.alt = image.alt;
    }

    galleryImages.forEach((image, index) => {
        image.closest('.gallery-item, .mockup-card')?.addEventListener('click', () => openLightbox(index));
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', () => showImage(-1));
    lightboxNext?.addEventListener('click', () => showImage(1));
    lightbox?.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', event => {
        if (!lightbox?.classList.contains('active')) return;

        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') showImage(-1);
        if (event.key === 'ArrowRight') showImage(1);
    });

    const cursor = document.querySelector('.cursor');
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    if (cursor && !isTouchDevice && !prefersReducedMotion) {
        window.addEventListener('mousemove', event => {
            cursor.classList.add('is-visible');
            cursor.style.left = `${event.clientX}px`;
            cursor.style.top = `${event.clientY}px`;
        });

        window.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));

        document.querySelectorAll('a, button, .gallery-item, .brand-card, .project-card, video').forEach(item => {
            item.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
            item.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
        });
    }

    if (!isTouchDevice && !prefersReducedMotion && window.matchMedia('(min-width: 900px)').matches) {
        document.querySelectorAll('.skill-card, .brand-card, .project-card, .portfolio-note').forEach(card => {
            card.classList.add('tilt-ready');

            card.addEventListener('mousemove', event => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty('--tilt-x', `${(-y * 8).toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${(x * 8).toFixed(2)}deg`);
                card.classList.add('is-tilting');
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('is-tilting');
                card.style.removeProperty('--tilt-x');
                card.style.removeProperty('--tilt-y');
            });
        });

        document.querySelectorAll('.btn, .social-pill, .filter-btn').forEach(item => {
            item.classList.add('magnetic-ready');

            item.addEventListener('mousemove', event => {
                const rect = item.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                item.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = '';
            });
        });
    }
});
