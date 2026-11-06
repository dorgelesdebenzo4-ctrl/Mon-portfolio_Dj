(() => {
    const html = document.documentElement;
    html.classList.add('js-ok');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (window.lucide) {
        window.lucide.createIcons();
    }

    /* ------------------------------------------------------------------
       Découpage du texte : lettres (nom, contact) et mots (titres)
       ------------------------------------------------------------------ */
    document.querySelectorAll('.hero-title, .contact-title, .lynx-title').forEach(title => {
        let index = 0;
        title.querySelectorAll('[data-chars]').forEach(line => {
            const text = line.textContent.trim();
            line.textContent = '';
            line.setAttribute('aria-hidden', 'true');
            [...text].forEach(letter => {
                const span = document.createElement('span');
                span.className = letter === ' ' ? 'char space' : 'char';
                span.textContent = letter === ' ' ? ' ' : letter;
                span.style.setProperty('--i', index++);
                line.appendChild(span);
            });
        });
    });

    document.querySelectorAll('[data-split]').forEach(heading => {
        const words = heading.textContent.trim().split(/ +/);
        heading.setAttribute('aria-label', heading.textContent.trim());
        heading.innerHTML = words
            .map((word, i) => `<span class="w" aria-hidden="true"><span class="wi" style="--i:${i}">${word}</span></span>`)
            .join(' ');
    });

    /* ------------------------------------------------------------------
       Intro puis entrée du hero
       ------------------------------------------------------------------ */
    const intro = document.querySelector('.intro');
    const heroReady = new Promise(resolve => {
        if (!html.classList.contains('has-intro') || !intro || reduced) {
            requestAnimationFrame(() => {
                html.classList.add('is-ready');
                resolve();
            });
            return;
        }

        const count = intro.querySelector('.intro-count');
        const duration = 1300;
        const start = performance.now();

        const tick = now => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            intro.style.setProperty('--p', eased.toFixed(3));
            if (count) count.textContent = String(Math.round(eased * 100)).padStart(3, '0');

            if (t < 1) {
                requestAnimationFrame(tick);
                return;
            }

            setTimeout(() => {
                intro.classList.add('is-done');
                setTimeout(() => {
                    html.classList.add('is-ready');
                    resolve();
                }, 250);
                setTimeout(() => html.classList.remove('has-intro'), 1100);
            }, 200);
        };

        requestAnimationFrame(tick);
        try {
            sessionStorage.setItem('intro-seen', '1');
        } catch (error) {
            // Sans stockage, l'intro se rejoue simplement à chaque visite.
        }
    });

    /* ------------------------------------------------------------------
       Thème
       ------------------------------------------------------------------ */
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = theme => {
        html.setAttribute('data-theme', theme);
        themeToggle?.setAttribute('aria-label', theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre');
    };

    applyTheme(html.getAttribute('data-theme') || 'dark');
    themeToggle?.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try {
            localStorage.setItem('theme', next);
        } catch (error) {
            // Le thème change quand même pour cette visite.
        }
    });

    /* ------------------------------------------------------------------
       Navigation
       ------------------------------------------------------------------ */
    const navbar = document.getElementById('navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.getElementById('main-navigation');

    const closeMenu = () => {
        navToggle?.setAttribute('aria-expanded', 'false');
        navToggle?.setAttribute('aria-label', 'Ouvrir le menu');
        navLinks?.classList.remove('active');
        document.body.classList.remove('menu-open');
    };

    navToggle?.addEventListener('click', () => {
        const open = navLinks?.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(Boolean(open)));
        navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
        document.body.classList.toggle('menu-open', Boolean(open));
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
            closeMenu();
        });
    });

    /* ------------------------------------------------------------------
       Hero : métier qui défile, vague sur le nom, lumière et parallaxe
       ------------------------------------------------------------------ */
    const roles = [...document.querySelectorAll('.role-item')];
    if (roles.length > 1 && !reduced) {
        let current = 0;
        heroReady.then(() => {
            setInterval(() => {
                const prev = roles[current];
                current = (current + 1) % roles.length;
                const next = roles[current];
                prev.classList.remove('is-active');
                prev.classList.add('is-leaving');
                next.classList.remove('is-leaving');
                next.classList.add('is-active');
                setTimeout(() => prev.classList.remove('is-leaving'), 850);
            }, 2600);
        });
    }

    const heroChars = [...document.querySelectorAll('.hero-title .char:not(.space)')];
    const wave = () => {
        heroChars.forEach((char, i) => {
            setTimeout(() => {
                char.classList.add('is-hop');
                setTimeout(() => char.classList.remove('is-hop'), 620);
            }, i * 55);
        });
    };

    if (!reduced) {
        heroReady.then(() => {
            setTimeout(wave, 2200);
            setInterval(wave, 9000);
        });
    }

    const hero = document.querySelector('.hero');
    const spot = document.querySelector('.hero-spot');
    const heroVisual = document.getElementById('hero-visual');

    if (hero && finePointer && !reduced) {
        hero.addEventListener('mousemove', event => {
            const rect = hero.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            spot?.style.setProperty('--mx', `${x}px`);
            spot?.style.setProperty('--my', `${y}px`);
            heroVisual?.style.setProperty('--px', ((x / rect.width) - 0.5) * 2);
            heroVisual?.style.setProperty('--py', ((y / rect.height) - 0.5) * 2);
        });

        hero.addEventListener('mouseleave', () => {
            heroVisual?.style.setProperty('--px', 0);
            heroVisual?.style.setProperty('--py', 0);
        });
    }

    /* ------------------------------------------------------------------
       Extrait vidéo et timeline de montage
       ------------------------------------------------------------------ */
    const toTimecode = seconds => {
        const total = Math.max(0, Math.floor(seconds || 0));
        const h = String(Math.floor(total / 3600)).padStart(2, '0');
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const s = String(total % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const reel = document.getElementById('hero-reel');
    const track = document.querySelector('.tl-track');
    const timecode = document.getElementById('hero-timecode');

    if (reel) {
        const syncTimeline = () => {
            if (reel.duration) {
                track?.style.setProperty('--p', (reel.currentTime / reel.duration).toFixed(4));
                if (timecode) timecode.textContent = toTimecode(reel.currentTime);
            }
            requestAnimationFrame(syncTimeline);
        };
        requestAnimationFrame(syncTimeline);

        if (!reduced) {
            heroReady.then(() => reel.play().catch(() => {
                // Lecture automatique bloquée : la première image reste affichée.
            }));
        }
    }

    /* ------------------------------------------------------------------
       Bande défilante : accélère et change de sens avec le scroll
       ------------------------------------------------------------------ */
    const marqueeTrack = document.querySelector('.marquee-track');
    const marqueeGroup = document.querySelector('.marquee-group');
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let direction = 1;

    if (marqueeTrack && marqueeGroup && !reduced) {
        let x = 0;
        let last = performance.now();

        const loop = now => {
            const dt = Math.min(64, now - last) / 1000;
            last = now;
            const width = marqueeGroup.offsetWidth;
            const speed = (56 + Math.min(900, Math.abs(scrollVelocity) * 6)) * direction;
            x -= speed * dt;
            if (x <= -width) x += width;
            if (x > 0) x -= width;
            marqueeTrack.style.transform = `translate3d(${x}px, 0, 0)`;
            scrollVelocity *= 0.92;
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    /* ------------------------------------------------------------------
       Apparitions au scroll et compteurs
       ------------------------------------------------------------------ */
    document.querySelectorAll('[data-stagger]').forEach(group => {
        const columns = 6;
        [...group.querySelectorAll(':scope > [data-reveal]')].forEach((item, i) => {
            item.style.setProperty('--d', `${(i % columns) * 110}ms`);
        });
    });

    const animateCount = el => {
        const target = Number(el.dataset.count) || 0;
        const start = performance.now();
        const duration = 1400;
        const step = now => {
            const t = Math.min(1, (now - start) / duration);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
            if (t < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
    };

    const revealTargets = document.querySelectorAll('[data-reveal], [data-split], .contact-title, .lynx-title');
    const counters = document.querySelectorAll('[data-count]');

    if (reduced || !('IntersectionObserver' in window)) {
        revealTargets.forEach(el => el.classList.add('is-in'));
    } else {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
        revealTargets.forEach(el => observer.observe(el));

        const countObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                animateCount(entry.target);
                countObserver.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        counters.forEach(el => countObserver.observe(el));
    }

    /* ------------------------------------------------------------------
       Mur d'affiches : défilement horizontal piloté par le scroll
       ------------------------------------------------------------------ */
    const wall = document.querySelector('.poster-wall');
    const wallTrack = wall?.querySelector('.wall-track');
    const wallBar = wall?.querySelector('.wall-bar span');
    const wallIndex = document.getElementById('wall-index');
    const wallTotal = document.getElementById('wall-total');
    const wallHint = wall?.querySelector('.wall-hint');
    const narrow = window.matchMedia('(max-width: 860px)');
    let wallMax = 0;
    let wallStatic = false;

    const visiblePosters = () => [...(wallTrack?.children || [])].filter(item => !item.classList.contains('is-hidden'));

    const setWallProgress = progress => {
        const count = visiblePosters().length;
        wallBar?.style.setProperty('--p', progress.toFixed(4));
        if (wallIndex) wallIndex.textContent = String(Math.round(progress * Math.max(0, count - 1)) + 1).padStart(2, '0');
    };

    const updateWall = () => {
        if (!wall || !wallTrack || wallStatic) return;
        const rect = wall.getBoundingClientRect();
        const progress = wallMax > 0 ? Math.min(1, Math.max(0, -rect.top / wallMax)) : 0;
        wallTrack.style.transform = `translate3d(${(-progress * wallMax).toFixed(1)}px, 0, 0)`;
        setWallProgress(progress);
    };

    const layoutWall = () => {
        if (!wall || !wallTrack) return;
        wallStatic = reduced || narrow.matches;
        wall.classList.toggle('is-static', wallStatic);
        if (wallTotal) wallTotal.textContent = String(visiblePosters().length).padStart(2, '0');
        if (wallHint) wallHint.firstChild.textContent = wallStatic ? 'Faites glisser ' : 'Faites défiler ';

        if (wallStatic) {
            wall.style.height = '';
            wallTrack.style.transform = '';
            setWallProgress(0);
            return;
        }

        wallMax = Math.max(0, wallTrack.offsetWidth - document.documentElement.clientWidth);
        wall.style.height = `${window.innerHeight + wallMax}px`;
        updateWall();
    };

    if (wall && wallTrack) {
        layoutWall();
        window.addEventListener('resize', layoutWall);
        window.addEventListener('load', layoutWall);
        document.fonts?.ready.then(layoutWall);
        narrow.addEventListener?.('change', layoutWall);

        wallTrack.addEventListener('scroll', () => {
            if (!wallStatic) return;
            const max = wallTrack.scrollWidth - wallTrack.clientWidth;
            setWallProgress(max > 0 ? wallTrack.scrollLeft / max : 0);
        }, { passive: true });
    }

    /* ------------------------------------------------------------------
       Scroll : progression, navigation, lien actif, bouton flottant
       ------------------------------------------------------------------ */
    const progress = document.querySelector('.scroll-progress');
    const floatCta = document.querySelector('.float-cta');
    const contact = document.getElementById('contact');
    const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]:not(.btn)')];
    const sections = sectionLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    let ticking = false;

    const onScroll = () => {
        const y = window.scrollY;
        const delta = y - lastScrollY;
        scrollVelocity = delta;
        if (Math.abs(delta) > 1) direction = delta > 0 ? 1 : -1;

        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

        navbar?.classList.toggle('scrolled', y > 16);
        const menuOpen = navLinks?.classList.contains('active');
        navbar?.classList.toggle('is-hidden', !menuOpen && delta > 4 && y > 480);
        if (delta < -4) navbar?.classList.remove('is-hidden');

        const passed = sections.filter(section => section.getBoundingClientRect().top <= 140);
        const current = passed[passed.length - 1];
        sectionLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${current?.id}`));

        if (floatCta && hero && contact) {
            const pastHero = y > hero.offsetHeight * 0.7;
            const contactTop = contact.getBoundingClientRect().top;
            floatCta.classList.toggle('is-visible', pastHero && contactTop > window.innerHeight * 0.6);
            const wallRect = wall?.getBoundingClientRect();
            floatCta.classList.toggle('is-tucked', Boolean(wallRect && !wallStatic && wallRect.top <= 0 && wallRect.bottom >= window.innerHeight));
        }

        updateWall();
        lastScrollY = y;
        ticking = false;
    };

    onScroll();
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(onScroll);
    }, { passive: true });

    /* ------------------------------------------------------------------
       Filtres du portfolio avec indicateur glissant
       ------------------------------------------------------------------ */
    const filterButtons = [...document.querySelectorAll('.filter-btn')];
    const indicator = document.querySelector('.filter-indicator');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const grid = document.getElementById('portfolio-grid');

    const moveIndicator = () => {
        const active = filterButtons.find(button => button.classList.contains('active'));
        if (!active || !indicator) return;
        indicator.style.setProperty('--x', `${active.offsetLeft}px`);
        indicator.style.setProperty('--w', `${active.offsetWidth}px`);
    };

    moveIndicator();
    window.addEventListener('resize', moveIndicator);
    document.fonts?.ready.then(moveIndicator);

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterButtons.forEach(item => {
                item.classList.toggle('active', item === button);
                item.setAttribute('aria-pressed', String(item === button));
            });
            moveIndicator();

            galleryItems.forEach(item => {
                item.classList.toggle('is-hidden', filter !== 'all' && item.dataset.category !== filter);
                item.classList.add('is-in');
            });

            grid?.classList.remove('filtering');
            void grid?.offsetWidth;
            grid?.classList.add('filtering');

            layoutWall();
            if (wall && !wallStatic && wall.getBoundingClientRect().top < 0) {
                window.scrollTo({ top: wall.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
            }
            if (wallStatic) wallTrack?.scrollTo({ left: 0, behavior: 'smooth' });
        });
    });

    /* ------------------------------------------------------------------
       Vidéos : durée en timecode et aperçu muet au survol
       ------------------------------------------------------------------ */
    document.querySelectorAll('.video-row').forEach(row => {
        const video = row.querySelector('video');
        const media = row.querySelector('.media');
        const duration = row.querySelector('.video-duration');
        if (!video) return;

        const showDuration = () => {
            if (duration && Number.isFinite(video.duration)) duration.textContent = toTimecode(video.duration);
        };
        if (video.readyState >= 1) showDuration();
        video.addEventListener('loadedmetadata', showDuration);

        if (!finePointer || reduced || !media) return;

        const hint = document.createElement('button');
        hint.type = 'button';
        hint.className = 'preview-hint';
        hint.innerHTML = '<span>Aperçu muet · Cliquer pour lire avec le son</span><i data-lucide="volume-2"></i>';
        media.appendChild(hint);
        window.lucide?.createIcons({ nameAttr: 'data-lucide' });

        let previewing = false;
        let userStarted = false;

        video.addEventListener('play', () => {
            if (!previewing) userStarted = true;
        });

        media.addEventListener('mouseenter', () => {
            if (userStarted || !video.paused) return;
            previewing = true;
            video.muted = true;
            media.classList.add('is-previewing');
            video.play().catch(() => {
                previewing = false;
                media.classList.remove('is-previewing');
            });
        });

        media.addEventListener('mouseleave', () => {
            if (!previewing) return;
            previewing = false;
            video.pause();
            video.muted = false;
            media.classList.remove('is-previewing');
        });

        const leavePreviewForFullscreen = () => {
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (fsEl !== video || !previewing) return;
            previewing = false;
            userStarted = true;
            media.classList.remove('is-previewing');
            video.muted = false;
        };
        video.addEventListener('fullscreenchange', leavePreviewForFullscreen);
        video.addEventListener('webkitfullscreenchange', leavePreviewForFullscreen);

        hint.addEventListener('click', () => {
            previewing = false;
            userStarted = true;
            media.classList.remove('is-previewing');
            video.muted = false;
            video.currentTime = 0;
            video.play();
        });
    });

    /* ------------------------------------------------------------------
       Curseur, boutons magnétiques, cartes inclinables
       ------------------------------------------------------------------ */
    if (finePointer && !reduced) {
        html.classList.add('has-cursor');
        const cursor = document.querySelector('.cursor');
        const label = cursor?.querySelector('.cursor-text');
        let cx = window.innerWidth / 2;
        let cy = window.innerHeight / 2;
        let tx = cx;
        let ty = cy;

        window.addEventListener('mousemove', event => {
            tx = event.clientX;
            ty = event.clientY;
            cursor?.classList.add('is-active');

            const labelled = event.target.closest('[data-cursor]');
            const link = event.target.closest('a, button');
            cursor?.classList.toggle('is-label', Boolean(labelled));
            cursor?.classList.toggle('is-link', !labelled && Boolean(link));
            cursor?.classList.toggle('is-lynx', Boolean(event.target.closest('.lynx')));
            if (labelled && label) label.textContent = labelled.dataset.cursor;
        });

        document.addEventListener('mouseleave', () => cursor?.classList.remove('is-active'));

        const follow = () => {
            cx += (tx - cx) * 0.18;
            cy += (ty - cy) * 0.18;
            if (cursor) cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
            requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);

        document.querySelectorAll('.magnetic').forEach(el => {
            el.addEventListener('mousemove', event => {
                const rect = el.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
            });
        });

        document.querySelectorAll('.tilt').forEach(card => {
            card.addEventListener('mousemove', event => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
                card.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
            });
            card.addEventListener('mouseleave', () => {
                card.style.removeProperty('--rx');
                card.style.removeProperty('--ry');
            });
        });
    }

    /* ------------------------------------------------------------------
       Copier l'email
       ------------------------------------------------------------------ */
    const toast = document.querySelector('.toast');
    let toastTimer;
    const showToast = message => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
    };

    document.querySelectorAll('[data-copy]').forEach(button => {
        button.addEventListener('click', async () => {
            const value = button.dataset.copy;
            try {
                await navigator.clipboard.writeText(value);
                showToast(button.dataset.copyLabel || 'Adresse email copiée');
            } catch (error) {
                showToast(value);
            }
        });
    });

    /* ------------------------------------------------------------------
       Lynx Studio : film du logo, son, bande de la charte
       ------------------------------------------------------------------ */
    const lynxFilm = document.getElementById('lynx-film');
    const lynxSound = document.querySelector('.lynx-sound');

    if (lynxFilm && !reduced && 'IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    lynxFilm.play().catch(() => {});
                } else {
                    lynxFilm.pause();
                }
            });
        }, { threshold: 0.35 }).observe(lynxFilm);
    }

    lynxSound?.addEventListener('click', () => {
        const on = lynxFilm.muted;
        lynxFilm.muted = !on;
        if (on) {
            lynxFilm.currentTime = 0;
            lynxFilm.play().catch(() => {});
        }
        lynxSound.setAttribute('aria-pressed', String(on));
        lynxSound.querySelector('span').textContent = on ? 'Couper le son' : 'Activer le son';
    });

    const strip = document.querySelector('.charte-strip');
    const stripBar = document.querySelector('.strip-progress span');

    if (strip) {
        const updateStrip = () => {
            const max = strip.scrollWidth - strip.clientWidth;
            const visible = strip.clientWidth / strip.scrollWidth;
            const progress = max > 0 ? strip.scrollLeft / max : 1;
            stripBar?.style.setProperty('--p', Math.min(1, visible + progress * (1 - visible)).toFixed(3));
        };
        strip.addEventListener('scroll', updateStrip, { passive: true });
        window.addEventListener('resize', updateStrip);
        updateStrip();

        document.querySelectorAll('[data-strip]').forEach(button => {
            button.addEventListener('click', () => {
                const page = strip.querySelector('.charte-page');
                const step = page ? page.offsetWidth + 20 : strip.clientWidth * 0.8;
                strip.scrollBy({ left: step * Number(button.dataset.strip), behavior: reduced ? 'auto' : 'smooth' });
            });
        });

        /* Glisser à la souris pour feuilleter */
        let startX = 0;
        let startScroll = 0;
        let dragging = false;
        let moved = false;

        strip.addEventListener('pointerdown', event => {
            if (event.pointerType !== 'mouse') return;
            dragging = true;
            moved = false;
            startX = event.clientX;
            startScroll = strip.scrollLeft;
        });

        window.addEventListener('pointermove', event => {
            if (!dragging) return;
            const dx = event.clientX - startX;
            if (Math.abs(dx) > 6 && !moved) {
                moved = true;
                strip.classList.add('is-dragging');
            }
            if (moved) strip.scrollLeft = startScroll - dx;
        });

        window.addEventListener('pointerup', () => {
            if (!dragging) return;
            dragging = false;
            requestAnimationFrame(() => strip.classList.remove('is-dragging'));
        });

        strip.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight') strip.scrollBy({ left: 300, behavior: 'smooth' });
            if (event.key === 'ArrowLeft') strip.scrollBy({ left: -300, behavior: 'smooth' });
        });
    }

    /* ------------------------------------------------------------------
       Heure d'Abidjan en direct
       ------------------------------------------------------------------ */
    const clockTime = document.getElementById('abidjan-time');
    const clockDay = document.getElementById('abidjan-day');
    const clockStatus = document.getElementById('abidjan-status');
    const clockBox = clockTime?.closest('.clock');

    if (clockTime) {
        const zone = 'Africa/Abidjan';
        const timeFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
        const dayFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
        const weekdayFormat = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short' });

        clockTime.innerHTML = '<span class="clock-h">--</span><span class="clock-colon">:</span><span class="clock-m">--</span><span class="clock-sec">:--</span>';
        const hEl = clockTime.querySelector('.clock-h');
        const mEl = clockTime.querySelector('.clock-m');
        const sEl = clockTime.querySelector('.clock-sec');
        const statusText = clockStatus?.querySelector('span:last-child');
        let lastDay = '';

        const tick = () => {
            const now = new Date();
            const parts = Object.fromEntries(timeFormat.formatToParts(now).map(part => [part.type, part.value]));
            hEl.textContent = parts.hour;
            mEl.textContent = parts.minute;
            sEl.textContent = `:${parts.second}`;
            clockTime.setAttribute('aria-label', `Il est ${parts.hour} h ${parts.minute} à Abidjan`);

            const day = dayFormat.format(now);
            if (day !== lastDay && clockDay) {
                lastDay = day;
                clockDay.textContent = day.charAt(0).toUpperCase() + day.slice(1);
            }

            const hour = Number(parts.hour);
            const sunday = weekdayFormat.format(now) === 'Sun';
            const daytime = !sunday && hour >= 8 && hour < 19;
            clockBox?.classList.toggle('is-day', daytime);
            if (statusText) {
                statusText.textContent = daytime
                    ? "C'est la journée à Abidjan : bon moment pour m'écrire"
                    : 'Hors horaires à Abidjan : laissez-moi un message WhatsApp';
            }
        };

        tick();
        setInterval(tick, 1000);
    }

    /* ------------------------------------------------------------------
       Lightbox
       ------------------------------------------------------------------ */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const triggers = [...document.querySelectorAll('.gallery-open')];
    let currentIndex = 0;
    let lastTrigger = null;

    const visibleTriggers = () => triggers.filter(trigger => !trigger.closest('.is-hidden'));

    const showAt = index => {
        const list = visibleTriggers();
        if (!list.length || !lightboxImg) return;
        currentIndex = (index + list.length) % list.length;
        const image = list[currentIndex].querySelector('img');
        lightboxImg.src = image.currentSrc || image.src;
        lightboxImg.alt = image.alt;
        lightboxImg.style.animation = 'none';
        void lightboxImg.offsetWidth;
        lightboxImg.style.animation = '';
    };

    const openLightbox = trigger => {
        if (!lightbox) return;
        lastTrigger = trigger;
        showAt(visibleTriggers().indexOf(trigger));
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        document.getElementById('lightbox-close')?.focus();
    };

    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lastTrigger?.focus();
    };

    triggers.forEach(trigger => trigger.addEventListener('click', () => openLightbox(trigger)));
    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev')?.addEventListener('click', () => showAt(currentIndex - 1));
    document.getElementById('lightbox-next')?.addEventListener('click', () => showAt(currentIndex + 1));
    lightbox?.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', event => {
        if (!lightbox?.classList.contains('active')) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') showAt(currentIndex - 1);
        if (event.key === 'ArrowRight') showAt(currentIndex + 1);
    });
})();
