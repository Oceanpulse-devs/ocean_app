import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize with default closed state for SSR
export const isSidebarOpen = writable(false);

// Initialize client-side behavior
if (browser) {
  // Helper to check if we're on mobile
  const isMobile = () => window.innerWidth <= 768;
  
  // Set initial state based on screen width
  isSidebarOpen.set(!isMobile());
  
  // Update sidebar state on window resize
  window.addEventListener('resize', () => {
    isSidebarOpen.set(!isMobile());
  });
}

export const toggleSidebar = () => {
  isSidebarOpen.update(value => !value);
};

export const closeSidebar = () => {
  isSidebarOpen.set(false);
}; 