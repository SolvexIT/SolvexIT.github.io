// Icon Configuration for SolvexIT Site
// This file defines the mapping between names/types and FontAwesome icons.

const iconMap = {
    'download': 'fas fa-download',
    'source_thread': 'fas fa-external-link-alt',
    'telegram': 'fab fa-telegram-plane',
    'plugin': 'fas fa-plug',
    'github': 'fab fa-github',
    'link': 'fas fa-link',
    'default': 'fas fa-link',
    
    // OS & Platforms
    'android': 'fab fa-android',
    'windows': 'fab fa-windows',
    'linux': 'fab fa-linux',
    'macos': 'fab fa-apple',
    'apple': 'fab fa-apple',
    
    // Linux Distros
    'ubuntu': 'fab fa-ubuntu',
    'debian': 'fab fa-debian',
    'fedora': 'fab fa-fedora',
    'redhat': 'fab fa-redhat',
    'suse': 'fab fa-suse',
    'centos': 'fab fa-centos',
    'arch': 'fab fa-linux' // Arch doesn't have a specific FA icon, fallback to linux
};

// Make it available globally
window.iconMap = iconMap;
