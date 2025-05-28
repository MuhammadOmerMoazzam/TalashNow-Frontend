console.log('Script loaded'); // Debug: Confirm script runs
document.getElementById('lostItemForm').addEventListener('submit', function (event) {
  event.preventDefault();
  alert("Lost item reported successfully!");
});

document.getElementById('foundItemForm').addEventListener('submit', function (event) {
  event.preventDefault();
  alert("Found item reported successfully!");
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('external hamburger.js: Script loaded');
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking a nav link
    document.querySelectorAll('.nav-menu li a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });
  }
});