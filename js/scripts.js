console.log('Script loaded');

// Only add form listeners if the forms exist
const lostItemForm = document.getElementById('lostItemForm');
const foundItemForm = document.getElementById('foundItemForm');

if (lostItemForm) {
  lostItemForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    try {
      const formData = {
        type: 'LOST',
        title: document.getElementById('item-name').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        location: document.getElementById('lost-location').value,
        date: document.getElementById('lost-date').value,
        imageUrl: document.getElementById('photo').files[0] ? await uploadImage(document.getElementById('photo').files[0]) : null
      };

      const response = await itemsAPI.createItem(formData);
      showNotification('Lost item reported successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'lost.html';
      }, 1500);
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    }
  });
}

if (foundItemForm) {
  foundItemForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    try {
      const formData = {
        type: 'FOUND',
        title: document.getElementById('item-name').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        location: document.getElementById('found-location').value,
        date: document.getElementById('found-date').value,
        imageUrl: document.getElementById('photo').files[0] ? await uploadImage(document.getElementById('photo').files[0]) : null
      };

      const response = await itemsAPI.createItem(formData);
      showNotification('Found item reported successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'found.html';
      }, 1500);
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    }
  });
}

// Helper function to upload images
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  const data = await response.json();
  return data.imageUrl;
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
    clearFilters.addEventListener('click', async () => {
      console.log('Clear filters clicked');
      document.getElementById('category').value = '';
      document.getElementById('location').value = '';
      document.getElementById('from-date').value = '';
      document.getElementById('to-date').value = '';
      
      // Reload items without filters - use type-specific method instead of getItems
      try {
        // Determine the type based on the page URL
        const type = window.location.pathname.includes('lost') ? 'LOST' : 'FOUND';
        const itemsAPI = ApiSingleton.getInstance().items;
        
        let items = [];
        if (type === 'LOST') {
          items = await itemsAPI.getLostItems();
        } else {
          items = await itemsAPI.getFoundItems();
        }
        
        updateItemsList(items);
      } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
      }
    });
  }

  // Load items on lost.html and found.html pages
  const itemsContainer = document.getElementById('items-container');
  if (itemsContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const location = urlParams.get('location');
    
    // Determine the type based on the page URL
    const type = window.location.pathname.includes('lost') ? 'LOST' : 'FOUND';
    
    loadItems(type, category, location);
  }

  // Check authentication status
  checkAuthStatus();
});

// Function to load items
async function loadItems(type, category = null, location = null) {
  try {
    let items = [];
    
    // Use the appropriate API method based on type
    if (type === 'LOST') {
      items = await itemsAPI.getLostItems(category, location);
    } else if (type === 'FOUND') {
      items = await itemsAPI.getFoundItems(category, location);
    }
    
    updateItemsList(items);
  } catch (error) {
    showNotification(`Error loading items: ${error.message}`, 'error');
  }
}

// Function to update items list
function updateItemsList(items) {
  const itemsContainer = document.getElementById('items-container');
  if (!itemsContainer) return;

  if (items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="no-items-message">
        <i class="fas fa-search"></i>
        <p>No items found. Try different search criteria.</p>
      </div>
    `;
    return;
  }

  itemsContainer.innerHTML = items.map(item => `
    <div class="item-card">
      <img src="${item.photoBase64 || '../images/placeholder.jpg'}" alt="${item.title || item.itemName}">
      <div class="item-details">
        <h3>${item.title || item.itemName}</h3>
        <p class="category">${item.category}</p>
        <p class="location"><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
        <p class="date"><i class="fas fa-calendar"></i> ${new Date(item.date || item.dateLost || item.dateFound).toLocaleDateString()}</p>
        <a href="item-detail.html?id=${item.id}&type=${item.type || (window.location.pathname.includes('lost') ? 'LOST' : 'FOUND')}" class="view-details">View Details</a>
      </div>
    </div>
  `).join('');
}

// Function to show notification
function showNotification(message, type = 'success', duration = 4000) {
  clearAllNotifications();
  
  let notification = document.getElementById('notification');

  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    document.body.insertBefore(notification, document.body.firstChild);

    const style = document.createElement('style');
    style.textContent = `
      #notification {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 30px;
        border-radius: 5px;
        color: white;
        font-family: 'Roboto', sans-serif;
        font-size: 16px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        min-width: 200px;
        text-align: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      #notification.success {
        background-color: #4caf50;
      }
      #notification.error {
        background-color: #f44336;
      }
      #notification.warning {
        background-color: #ff9800;
      }
      #notification.info {
        background-color: #2196f3;
      }
      #notification.show {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  notification.textContent = message;
  notification.className = type;
  notification.classList.add('show');
  
  // Clear any existing timeout
  if (window._notificationTimeout) {
    clearTimeout(window._notificationTimeout);
  }
  
  // Set new timeout
  window._notificationTimeout = setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.textContent = '';
      notification.className = '';
    }, 500); // Extra time for fade out animation
  }, duration);
}

// Function to clear all notifications
function clearAllNotifications() {
  // Clear any existing notification
  const existingNotification = document.getElementById('notification');
  if (existingNotification) {
    existingNotification.classList.remove('show');
    existingNotification.textContent = '';
    existingNotification.className = '';
  }
  
  // Also clear any timeouts
  if (window._notificationTimeout) {
    clearTimeout(window._notificationTimeout);
    window._notificationTimeout = null;
  }
}

// Function to update navbar based on authentication status
async function updateNavbar(isAuthenticated) {
  const authButtons = document.getElementById('auth-buttons');
  const userButtons = document.getElementById('user-buttons');
  
  if (!authButtons || !userButtons) {
    // If we're not on a page with these elements, try the old selector
    const navButtons = document.querySelector('.nav-buttons.nav-menu');
    if (!navButtons) return;

    if (isAuthenticated) {
      navButtons.innerHTML = `
        <div id="user-buttons">
          <a href="/pages/dashboard.html"><button class="nav-btn">Dashboard</button></a>
          <button class="nav-btn" id="logout-btn">Logout</button>
        </div>
      `;
      // Add logout event listener
      addLogoutListener();
    } else {
      navButtons.innerHTML = `
        <div id="auth-buttons">
          <a href="/pages/auth.html?form=login"><button class="nav-btn" data-form="login">Login</button></a>
          <a href="/pages/auth.html?form=register"><button class="nav-btn" data-form="register">Register</button></a>
        </div>
      `;
    }
  } else {
    // We're on a page with the specific elements
    if (isAuthenticated) {
      authButtons.style.display = 'none';
      userButtons.style.display = 'block';
      // Add logout event listener
      addLogoutListener();
    } else {
      authButtons.style.display = 'block';
      userButtons.style.display = 'none';
    }
  }
  
  // Store authentication status
  localStorage.setItem('isAuthenticated', isAuthenticated);
}

// Function to add logout event listener
function addLogoutListener() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await authAPI.logout();
        localStorage.removeItem('isAuthenticated');
        showNotification('Logout successful!', 'success');
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1500);
      } catch (error) {
        showNotification(`Logout failed: ${error.message}`, 'error');
      }
    });
  }
}

// Function to check authentication status
async function checkAuthStatus() {
  try {
    // Check if auth-utils.js has already handled authentication
    if (window.TalashNow && typeof window.TalashNow.isAuthenticated !== 'undefined') {
      console.log('Using TalashNow global auth state:', window.TalashNow.isAuthenticated);
      return; // Let auth-utils.js handle everything
    }
    
    // First check localStorage for faster UI feedback
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    // Update UI immediately based on localStorage
    if (storedAuth) {
      console.log('Authenticated based on localStorage');
      updateNavbar(true);
      
      // Check if this is the login page and redirect if needed
      if (window.location.pathname.includes('/pages/auth.html')) {
        window.location.replace('/pages/dashboard.html');
        return; // Stop further execution
      }
    } else {
      console.log('Not authenticated based on localStorage');
      updateNavbar(false);
    }
    
    // Then verify with server (but don't override UI if server check fails)
    try {
      const result = await authAPI.checkAuth();
      console.log('Server auth check result:', result);
      
      if (result.isAuthenticated) {
        // Update localStorage and UI if server says authenticated
        localStorage.setItem('isAuthenticated', 'true');
        
        // Update global state
        window.TalashNow = window.TalashNow || {};
        window.TalashNow.isAuthenticated = true;
        
        updateNavbar(true);
      } else if (storedAuth) {
        // Only clear localStorage if we have a definitive "not authenticated" from server
        console.log('Server says not authenticated but localStorage says authenticated');
        localStorage.removeItem('isAuthenticated');
        
        // Update global state
        window.TalashNow = window.TalashNow || {};
        window.TalashNow.isAuthenticated = false;
        
        // Force page reload instead of just updating UI
        window.location.reload();
      }
    } catch (serverError) {
      // If server check fails, just log it but don't change the UI state
      console.error('Server auth check failed:', serverError);
      // Keep using the localStorage state
    }
  } catch (error) {
    console.error('Error in overall auth checking process:', error);
  }
}

// Function to check if current page requires authentication
function checkProtectedPage() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const protectedPaths = [
    '/pages/dashboard.html', 
    '/pages/lost-report.html', 
    '/pages/found-report.html'
  ];
  
  const currentPath = window.location.pathname;
  
  // Check if this is a protected page
  if (protectedPaths.some(path => currentPath.includes(path)) && !isAuthenticated) {
    console.log('Redirecting from protected page due to no authentication');
    showNotification('Please login to access this page', 'error');
    setTimeout(() => {
      window.location.href = '/pages/auth.html?form=login';
    }, 1500);
  }
}



