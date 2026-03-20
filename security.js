/**
 * Security Protection Script
 * Disables right-click, text selection, and dev tools
 */
(function() {
    'use strict';
    
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable copy
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable cut
    document.addEventListener('cut', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable paste
    document.addEventListener('paste', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable keyboard shortcuts for dev tools
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable dragging
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Obfuscate console output
    if (typeof console !== 'undefined') {
        const noop = function() {};
        const methods = ['log', 'debug', 'info', 'warn', 'error', 'trace'];
        // Comment out to allow console for debugging:
        // methods.forEach(function(method) {
        //     console[method] = noop;
        // });
    }
    
    // Detect dev tools (visual deterrent only)
    let devtoolsOpen = false;
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                // Optional: show warning
                // document.body.innerHTML = '<h1 style="text-align:center;margin-top:20%">Developer tools detected</h1>';
            }
        } else {
            devtoolsOpen = false;
        }
    }, 500);
    
})();
