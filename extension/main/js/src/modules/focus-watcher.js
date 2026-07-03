// Checks the currently focused element.
// We use a combination of focus/blur (capture) + lightweight polling fallback.
// This is more efficient than pure polling while remaining robust against
// pages that cancel focus events.

var EventEmitter = require('event-emitter');
var INTERVAL = 400;

var emitter = EventEmitter();
var _focusedElement = null;

function checkFocus() {
    const current = document.activeElement;
    if (current !== _focusedElement) {
        _focusedElement = current;
        emitter.emit('change', current);
    }
}

// Primary: use capture-phase listeners (more reliable than focusin in many cases)
document.addEventListener('focus', checkFocus, true);
document.addEventListener('blur', checkFocus, true);

// Fallback polling for pages that suppress focus events
setInterval(checkFocus, INTERVAL);

// Initial check
checkFocus();

module.exports = emitter;