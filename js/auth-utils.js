/**
 * Authentication utility functions
 * This file contains helper functions for managing authentication state
 */

// IMPORTANT: Run this code immediately, don't wait for DOMContentLoaded
(function() {
  console.log('Auth utils executing immediately');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  console.log('Initial auth state:', isAuthenticated);
  
  // Set a global variable that other scripts can check
  window.TalashNow = window.TalashNow || {};
  window.TalashNow.isAuthenticated = isAuthenticated;
  
  // Add a style element to hide auth buttons immediately if authenticated
  if (isAuthenticated) {
    const style = document.createElement('style');
    style.textContent = `
      #auth-buttons { display: none !important; }
      #user-buttons { display: block !important; }
    `;
    document.head.appendChild(style);
  }
  
  // Add a function to the window object to check elements before accessing them
  window.TalashNow.safeGetElement = function(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id "${id}" not found`);
      return null;
    }
    return element;
  };
})();

// Then do a more thorough check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Auth utils DOM loaded, applying authentication UI');
  try {
    checkAndUpdateAuthUI();
    
    // Force UI update one more time after a small delay to catch any race conditions
    setTimeout(checkAndUpdateAuthUI, 100);
    setTimeout(checkAndUpdateAuthUI, 500);
    setTimeout(checkAndUpdateAuthUI, 1000);
  } catch (error) {
    console.error('Error in auth-utils DOMContentLoaded:', error);
  }
});

// Check if user is authenticated and update UI accordingly
function checkAndUpdateAuthUI() {
  try {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    console.log('Updating auth UI, authenticated:', isAuthenticated);
    
    // Update global state
    window.TalashNow = window.TalashNow || {};
    window.TalashNow.isAuthenticated = isAuthenticated;
    
    const authButtons = document.getElementById('auth-buttons');
    const userButtons = document.getElementById('user-buttons');
    
    // Update visibility and display of auth buttons
    if (authButtons && userButtons) {
      if (isAuthenticated) {
        authButtons.style.display = 'none';
        userButtons.style.display = 'block';
        
        // Add auth-visible class for CSS transition
        authButtons.classList.remove('auth-visible');
        userButtons.classList.add('auth-visible');
        
        // Add logout event listener
        setupLogoutButton();
      } else {
        authButtons.style.display = 'block';
        userButtons.style.display = 'none';
        
        // Add auth-visible class for CSS transition
        authButtons.classList.add('auth-visible');
        userButtons.classList.remove('auth-visible');
      }
    } else {
      console.log('Auth buttons not found in DOM yet');
    }
    
    // Check if this is a protected page
    const protectedPages = [
      '/pages/dashboard.html',
      '/pages/lost-report.html',
      '/pages/found-report.html'
    ];
    
    const currentPath = window.location.pathname;
    const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
    
    if (isProtectedPage && !isAuthenticated) {
      console.log('Protected page detected, redirecting to login');
      
      // Show notification if notification element exists
      try {
        showNotification('Please login to access this page', 'error');
      } catch (notifError) {
        console.error('Error showing notification:', notifError);
      }
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/pages/auth.html?form=login';
      }, 1000);
    }
    
    // Check if this is auth page and user is already logged in
    if (currentPath.includes('/pages/auth.html') && isAuthenticated) {
      console.log('User already authenticated, redirecting from auth page');
      window.location.href = '/pages/dashboard.html';
    }
  } catch (error) {
    console.error('Error in checkAndUpdateAuthUI:', error);
  }
}

// Set up the logout button functionality
function setupLogoutButton() {
  try {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) {
      console.log('Logout button not found');
      return;
    }
    
    // Remove any existing event listeners
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    
    // Add new event listener
    newLogoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Logout button clicked');
      
      // Clear authentication state IMMEDIATELY
      localStorage.removeItem('isAuthenticated');
      window.TalashNow = window.TalashNow || {};
      window.TalashNow.isAuthenticated = false;
      
      // Update UI immediately
      const authButtons = document.getElementById('auth-buttons');
      const userButtons = document.getElementById('user-buttons');
      if (authButtons && userButtons) {
        authButtons.style.display = 'block';
        userButtons.style.display = 'none';
        
        // Update auth-visible classes
        authButtons.classList.add('auth-visible');
        userButtons.classList.remove('auth-visible');
      }
      
      try {
        // Call logout API (but don't wait for it before updating UI)
        if (window.authAPI && typeof window.authAPI.logout === 'function') {
          await window.authAPI.logout();
        }
        
        // Show notification
        try {
          showNotification('Logout successful!', 'success');
        } catch (notifError) {
          console.error('Error showing notification:', notifError);
        }
        
        // Redirect after a delay
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1500);
      } catch (error) {
        console.error('Logout error:', error);
        
        // Show notification
        try {
          showNotification(`Logout failed: ${error.message || 'An error occurred'}`, 'error');
        } catch (notifError) {
          console.error('Error showing notification:', notifError);
        }
      }
    });
  } catch (error) {
    console.error('Error in setupLogoutButton:', error);
  }
}

// Helper function to show notifications
function showNotification(message, type = 'success') {
  try {
    let notification = document.getElementById('notification');

    if (!notification) {
      // If body isn't available yet, don't try to create notification
      if (!document.body) {
        console.warn('Document body not available for notification');
        return;
      }
      
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
        #notification.show {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }

    notification.textContent = message;
    notification.className = type;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
      // Don't clear text content if it might have been changed
      // notification.textContent = '';
      // notification.className = '';
    }, 4000);
  } catch (error) {
    console.error('Error in showNotification:', error);
  }
} 