// Homebase Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar background on scroll
    const nav = document.querySelector('.nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            nav.style.boxShadow = '0 1px 0 rgba(0,0,0,0.08)';
        }
        
        lastScroll = currentScroll;
    });
    
    // Form submission handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const statusEl = contactForm.querySelector('.form-status');
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const setStatus = (msg, kind) => {
            if (!statusEl) return;
            statusEl.textContent = msg;
            statusEl.dataset.kind = kind || '';
        };

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);

            if (!data.name || !data.email) {
                setStatus('Please fill in your name and email.', 'error');
                return;
            }

            const originalLabel = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
            setStatus('Sending…', 'pending');

            try {
                const res = await fetch(this.action || '/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data),
                });
                const payload = await res.json().catch(() => ({}));
                if (res.ok && payload.ok) {
                    setStatus('Thanks — we\'ll be in touch soon.', 'success');
                    this.reset();
                } else {
                    setStatus(payload.error || 'Something went wrong. Please email sales@homebasegarage.com directly.', 'error');
                }
            } catch (err) {
                setStatus('Network error. Please email sales@homebasegarage.com directly.', 'error');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
            }
        });
    }
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .use-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
    
    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `
        .feature-card.visible,
        .use-card.visible,
        .testimonial-card.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});


// ========================================
// Interactive Site Plan + Inventory
// ========================================

(function() {
    'use strict';

    // Unit data
    var UNITS = {
        '16': {
            id: '16',
            label: 'Unit 16',
            dims: "19' × 40'",
            sqft: '760 SF',
            price: '$150,000',
            building: 'A (West)'
        },
        '49': {
            id: '49',
            label: 'Unit 49',
            dims: "24' × 40'",
            sqft: '960 SF',
            price: '$192,000',
            building: 'B (Center)'
        },
        '54': {
            id: '54',
            label: 'Unit 54',
            dims: "20' × 50'",
            sqft: '1,000 SF',
            price: '$200,000',
            building: 'C (East)'
        }
    };

    var activeUnitId = null;
    var tooltip = null;

    function init() {
        var svg = document.getElementById('homebase-siteplan');
        if (!svg) return;

        tooltip = document.getElementById('siteplan-tooltip');

        // --- SVG event delegation ---
        svg.addEventListener('click', function(e) {
            var rect = e.target.closest('[data-unit-id]');
            if (!rect) return;
            var id = rect.getAttribute('data-unit-id');
            if (UNITS[id]) {
                var wasActive = (activeUnitId === id);
                selectUnit(wasActive ? null : id, 'svg');
            }
        });

        svg.addEventListener('mousemove', function(e) {
            var rect = e.target.closest('.unit-available[data-unit-id]');
            if (rect && tooltip) {
                var id = rect.getAttribute('data-unit-id');
                var unit = UNITS[id];
                if (unit) {
                    tooltip.textContent = unit.label + ' — ' + unit.dims + ' · ' + unit.price;
                    positionTooltip(e);
                    tooltip.classList.add('visible');
                    tooltip.setAttribute('aria-hidden', 'false');
                }
            }
        });

        svg.addEventListener('mouseover', function(e) {
            var rect = e.target.closest('.unit-available[data-unit-id]');
            if (!rect && tooltip) {
                tooltip.classList.remove('visible');
                tooltip.setAttribute('aria-hidden', 'true');
            }
        });

        svg.addEventListener('mouseout', function(e) {
            var related = e.relatedTarget;
            if (!related || !related.closest || !related.closest('.unit-available[data-unit-id]')) {
                if (tooltip) {
                    tooltip.classList.remove('visible');
                    tooltip.setAttribute('aria-hidden', 'true');
                }
            }
        });

        // --- Inventory card click ---
        document.querySelectorAll('.inventory-card').forEach(function(card) {
            card.addEventListener('click', function(e) {
                // Don't toggle if clicking the reserve link
                if (e.target.closest('.reserve-btn')) return;
                var id = card.getAttribute('data-unit-id');
                var wasActive = (activeUnitId === id);
                selectUnit(wasActive ? null : id, 'card');
            });

            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var id = card.getAttribute('data-unit-id');
                    var wasActive = (activeUnitId === id);
                    selectUnit(wasActive ? null : id, 'card');
                }
            });
        });

        // Close tooltip on scroll
        window.addEventListener('scroll', function() {
            if (tooltip) {
                tooltip.classList.remove('visible');
                tooltip.setAttribute('aria-hidden', 'true');
            }
        }, { passive: true });
    }

    function positionTooltip(e) {
        if (!tooltip) return;
        var x = e.clientX;
        var y = e.clientY;
        var tw = tooltip.offsetWidth || 160;
        var vw = window.innerWidth;
        var left = x - tw / 2;
        if (left < 8) left = 8;
        if (left + tw > vw - 8) left = vw - tw - 8;
        tooltip.style.left = left + 'px';
        tooltip.style.top = (y - 44) + 'px';
    }

    function selectUnit(id, source) {
        // Deselect previous
        clearSelection();

        if (!id) return;

        activeUnitId = id;

        // Highlight SVG unit
        var svgRect = document.querySelector('#homebase-siteplan [data-unit-id="' + id + '"]');
        if (svgRect) {
            svgRect.classList.add('unit-selected');
        }

        // Highlight inventory card + open detail panel
        var card = document.querySelector('.inventory-card[data-unit-id="' + id + '"]');
        if (card) {
            card.classList.add('card-selected');
            card.setAttribute('aria-expanded', 'true');
            var detailPanel = card.querySelector('.unit-detail-panel');
            if (detailPanel) {
                detailPanel.classList.add('panel-open');
                detailPanel.setAttribute('aria-hidden', 'false');
            }

            // Cross-link: if click came from SVG, scroll to card
            if (source === 'svg') {
                scrollToCard(card);
            }
            // If click came from card, scroll SVG unit into view (best-effort)
            if (source === 'card' && svgRect) {
                scrollToSvgUnit(svgRect);
            }
        }
    }

    function clearSelection() {
        activeUnitId = null;

        // Clear SVG highlights
        document.querySelectorAll('#homebase-siteplan .unit-selected').forEach(function(el) {
            el.classList.remove('unit-selected');
        });

        // Clear card highlights + close panels
        document.querySelectorAll('.inventory-card.card-selected').forEach(function(card) {
            card.classList.remove('card-selected');
            card.setAttribute('aria-expanded', 'false');
            var panel = card.querySelector('.unit-detail-panel');
            if (panel) {
                panel.classList.remove('panel-open');
                panel.setAttribute('aria-hidden', 'true');
            }
        });
    }

    function scrollToCard(card) {
        var nav = document.querySelector('.nav');
        var navH = nav ? nav.offsetHeight : 70;
        var top = card.getBoundingClientRect().top + window.pageYOffset - navH - 20;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function scrollToSvgUnit(svgRect) {
        var svg = document.getElementById('homebase-siteplan');
        if (!svg) return;
        var nav = document.querySelector('.nav');
        var navH = nav ? nav.offsetHeight : 70;
        var top = svg.getBoundingClientRect().top + window.pageYOffset - navH - 20;
        // Only scroll if SVG is not already visible
        var rect = svg.getBoundingClientRect();
        if (rect.top < navH || rect.bottom > window.innerHeight) {
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    }

    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();


// v2: "Request Tour of Unit X" pre-selects that unit in the form
document.addEventListener('click', function(e) {
    var btn = e.target.closest && e.target.closest('.reserve-btn[data-unit]');
    if (!btn) return;
    var sel = document.getElementById('interest');
    if (sel) sel.value = btn.getAttribute('data-unit');
    var msg = document.getElementById('message');
    if (msg && !msg.value) msg.focus({preventScroll: true});
});
