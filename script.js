// Security Features - Block right-click, prevent inspect, disable F12
(function() {
    'use strict';
    
    // Block right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Block keyboard shortcuts for developer tools
    document.addEventListener('keydown', function(e) {
        // Block F12 key
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        
        // Block Ctrl+Shift+I (Chrome/Firefox DevTools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }
        
        // Block Ctrl+Shift+J (Chrome Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
        
        // Block Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }
        
        // Block Ctrl+Shift+C (Chrome Elements Inspector)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }
        
        // Block Ctrl+Shift+K (Firefox Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'K') {
            e.preventDefault();
            return false;
        }
    });
    
    // Block developer tools detection
    let devtools = {
        open: false,
        orientation: null
    };
    
    setInterval(() => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtools.open) {
                devtools.open = true;
                devtools.orientation = widthThreshold ? 'vertical' : 'horizontal';
                // Redirect or show warning when devtools is detected
                window.location.href = 'about:blank';
            }
        } else {
            devtools.open = false;
            devtools.orientation = null;
        }
    }, 500);
    
    // Block console access
    console.log = function() {};
    console.warn = function() {};
    console.error = function() {};
    console.info = function() {};
    console.debug = function() {};
    
    // Block debugger statement
    setInterval(() => {
        debugger;
    }, 100);
    
    // Additional security measures
    // Block view source
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            return false;
        }
    });
    
    // Block print screen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            return false;
        }
    });
    
    // Block save page
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable browser back button
    history.pushState(null, null, location.href);
    window.onpopstate = function() {
        history.go(1);
    };
    
    // Block iframe embedding
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }
    
})();

// Add smooth scrolling to all links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add intersection observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated');
            entry.target.classList.add(entry.target.dataset.animation || 'animate__fadeIn');
        }
    });
}, {
    threshold: 0.1
});

// Observe all elements with animation classes
document.querySelectorAll('.animate__animated').forEach(element => {
    observer.observe(element);
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add hover effect to buttons
document.querySelectorAll('.nav-button, .grade-button, .media-button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
});

// Add ripple effect to buttons
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    ripple.classList.add('ripple');
    
    const rippleContainer = document.createElement('span');
    rippleContainer.classList.add('ripple-container');
    
    rippleContainer.appendChild(ripple);
    button.appendChild(rippleContainer);
    
    setTimeout(() => {
        rippleContainer.remove();
    }, 1000);
}

document.querySelectorAll('.nav-button, .grade-button, .media-button').forEach(button => {
    button.addEventListener('click', createRipple);
});

// Remove global link interception for .download-button and .play-button
// Only show popup and do not allow any content to be accessed until code is verified

// Remove any global link interception in script.js that could cause content to appear before code verification

// Handle form submissions (if any)
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your form handling logic here
    });
});