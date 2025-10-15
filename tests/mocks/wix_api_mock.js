/**
 * Mock Wix API Functions
 * 
 * This file simulates Wix platform APIs for local testing,
 * including window management, location, and other Wix-specific features.
 */

// Mock Wix Window API
window.$w = function(selector) {
  const element = document.querySelector(selector);
  
  if (!element) {
    console.warn(`[Mock Wix API] Element not found: ${selector}`);
    return null;
  }

  // Return a mock Wix element wrapper
  return {
    // Core properties
    id: element.id,
    type: element.tagName.toLowerCase(),
    
    // Visibility
    show: () => {
      element.style.display = '';
      return this;
    },
    hide: () => {
      element.style.display = 'none';
      return this;
    },
    collapse: () => {
      element.style.display = 'none';
      return this;
    },
    expand: () => {
      element.style.display = '';
      return this;
    },
    
    // Text content
    text: element.textContent,
    html: element.innerHTML,
    
    // Value (for inputs)
    value: element.value || '',
    
    // Click handler
    onClick: (handler) => {
      element.addEventListener('click', handler);
      return this;
    },
    
    // Change handler
    onChange: (handler) => {
      element.addEventListener('change', handler);
      return this;
    },
    
    // Input handler
    onInput: (handler) => {
      element.addEventListener('input', handler);
      return this;
    },
    
    // Enable/disable
    enable: () => {
      element.disabled = false;
      return this;
    },
    disable: () => {
      element.disabled = true;
      return this;
    },
    
    // Style
    style: element.style,
    
    // Get the actual DOM element
    _element: element
  };
};

// Mock Wix Location API
window.wixLocation = {
  url: window.location.href,
  path: window.location.pathname,
  query: {},
  
  to: (url) => {
    console.log(`[Mock Wix API] Navigate to: ${url}`);
    window.location.href = url;
  },
  
  queryParams: {
    add: (params) => {
      Object.assign(window.wixLocation.query, params);
      console.log('[Mock Wix API] Query params added:', params);
    },
    remove: (keys) => {
      keys.forEach(key => delete window.wixLocation.query[key]);
      console.log('[Mock Wix API] Query params removed:', keys);
    }
  }
};

// Mock Wix Storage API
window.wixStorage = {
  local: {
    getItem: (key) => {
      return localStorage.getItem(key);
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value);
      console.log(`[Mock Wix API] Local storage set: ${key}`);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
      console.log(`[Mock Wix API] Local storage removed: ${key}`);
    },
    clear: () => {
      localStorage.clear();
      console.log('[Mock Wix API] Local storage cleared');
    }
  },
  
  session: {
    getItem: (key) => {
      return sessionStorage.getItem(key);
    },
    setItem: (key, value) => {
      sessionStorage.setItem(key, value);
      console.log(`[Mock Wix API] Session storage set: ${key}`);
    },
    removeItem: (key) => {
      sessionStorage.removeItem(key);
      console.log(`[Mock Wix API] Session storage removed: ${key}`);
    },
    clear: () => {
      sessionStorage.clear();
      console.log('[Mock Wix API] Session storage cleared');
    }
  }
};

// Mock Wix Window API
window.wixWindow = {
  formFactor: 'Desktop', // or 'Mobile', 'Tablet'
  
  getBoundingRect: () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      x: 0,
      y: 0
    };
  },
  
  scrollTo: (x, y) => {
    window.scrollTo(x, y);
    console.log(`[Mock Wix API] Scrolled to: ${x}, ${y}`);
  },
  
  openLightbox: (lightboxName) => {
    console.log(`[Mock Wix API] Open lightbox: ${lightboxName}`);
    // Could implement actual modal logic here if needed
  },
  
  closeLightbox: () => {
    console.log('[Mock Wix API] Close lightbox');
  }
};

// Mock Wix Site API
window.wixSite = {
  currentPage: {
    id: 'test-page',
    name: 'Test Page',
    title: 'Test Page Title',
    url: window.location.href
  },
  
  language: 'en',
  
  regionalSettings: {
    locale: 'en-US',
    currency: 'USD',
    timeZone: 'America/Denver'
  }
};

// Mock Wix Animations API
window.wixAnimations = {
  timeline: () => {
    return {
      add: (element, animation) => {
        console.log('[Mock Wix API] Animation added');
        return this;
      },
      play: () => {
        console.log('[Mock Wix API] Animation played');
        return Promise.resolve();
      },
      pause: () => {
        console.log('[Mock Wix API] Animation paused');
      },
      reverse: () => {
        console.log('[Mock Wix API] Animation reversed');
      }
    };
  }
};

// Mock Wix SEO API
window.wixSeo = {
  title: document.title,
  
  setTitle: (title) => {
    document.title = title;
    console.log(`[Mock Wix API] SEO title set: ${title}`);
  },
  
  links: [],
  
  metaTags: []
};

// Helper function to simulate Wix page ready
window.wixReady = () => {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
};

// Simulate Wix onReady callback
window.$w.onReady = (callback) => {
  window.wixReady().then(callback);
};

console.log('[Mock Wix API] Wix API mock loaded');
