document.addEventListener('DOMContentLoaded', () => {
    
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobilePanel = document.querySelector('.mobile-nav-panel');

    if (menuToggle && mobilePanel) {
        menuToggle.addEventListener('click', () => {
            mobilePanel.classList.toggle('open');
            // Animate hamburger icon
            const spans = menuToggle.querySelectorAll('span');
            if (mobilePanel.classList.contains('open')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-up');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply observer to sections and cards that should fade in
    const elementsToAnimate = document.querySelectorAll('.section h2, .section p, .card-lowest, .insight-block');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0'; // hide elements initially before they animate
        observer.observe(el);
    });
});
