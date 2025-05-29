console.log('Script loaded'); 

// Only add form listeners if the forms exist
const lostItemForm = document.getElementById('lostItemForm');
const foundItemForm = document.getElementById('foundItemForm');

if (lostItemForm) {
  lostItemForm.addEventListener('submit', function (event) {
    event.preventDefault();
    alert("Lost item reported successfully!");
  });
}

if (foundItemForm) {
  foundItemForm.addEventListener('submit', function (event) {
    event.preventDefault();
    alert("Found item reported successfully!");
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Setting up event listeners');
  
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  
  console.log('Hamburger element:', hamburger);
  console.log('Nav menu element:', navMenu);

  if (hamburger && navMenu) {
    console.log('Adding hamburger click listener');
    hamburger.addEventListener('click', () => {
      console.log('Hamburger clicked');
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

  // Filter setup
  const filterToggle = document.getElementById('filter-toggle');
  const filterSection = document.getElementById('filter-section');
  const clearFilters = document.getElementById('clear-filters');

  console.log('Filter elements:', { filterToggle, filterSection, clearFilters });

  if (filterToggle && filterSection) {
    // Set initial state
    filterSection.style.display = 'none';
    
    filterToggle.addEventListener('click', () => {
      console.log('Filter toggle clicked');
      const isExpanded = filterSection.style.display === 'block';
      filterSection.style.display = isExpanded ? 'none' : 'block';
      filterToggle.textContent = isExpanded ? 'Show Filters' : 'Hide Filters';
    });
  }

  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      console.log('Clear filters clicked');
      document.getElementById('category').value = '';
      document.getElementById('location').value = '';
      document.getElementById('from-date').value = '';
      document.getElementById('to-date').value = '';
    });
  }
});