document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('#nav');

    hamburger.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true' || false;
      this.setAttribute('aria-expanded', !expanded);
      if (!expanded) {
        nav.style.display = 'flex';
      } else {
        nav.style.display = 'none';
      }
    });
  });