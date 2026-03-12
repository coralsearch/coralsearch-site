document.addEventListener('DOMContentLoaded', function() {

  // Hamburger menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', function() {
    navLinks.classList.toggle('nav-open');
    hamburger.classList.toggle('active');
  });

  // Scroll effect
  const nav = document.querySelector('.nav');

  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  });

  // Active link detection
  const currentPage = window.location.pathname.split('/').pop();
  const navLinksList = document.querySelectorAll('.nav-links li a');

  navLinksList.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    } else if (currentPage === '' || currentPage === 'index.html') {
      // Default to home link if on index or root
      const homeLink = document.querySelector('.nav-links li a[href="index.html"]');
      if (!homeLink) {
        const rootLink = document.querySelector('.nav-links li a[href="/"]');
        if (rootLink) {
          rootLink.classList.add('active');
        }
      } else {
        homeLink.classList.add('active');
      }
    }
  });

  // Close menu on link click
  navLinksList.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        navLinks.classList.remove('nav-open');
        hamburger.classList.remove('active');
      }
    });
  });

});