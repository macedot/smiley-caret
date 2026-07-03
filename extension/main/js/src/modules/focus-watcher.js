// Checks the currently focused element.
// Strategy: capture-phase focus/blur listeners as the primary signal, with a
// polling fallback that only runs while an editable element is focused (or
// briefly after a blur, to catch focus retargeting). This keeps the always-on
// footprint low on pages with no editable context (e.g. banking, readers).

var EventEmitter = require('event-emitter');
var Utils = require('./utils.js');
var INTERVAL = 400;
var IDLE_GRACE_MS = 1200; // keep polling briefly after losing focus

var emitter = EventEmitter();
var _focusedElement = null;
var _intervalId = null;
var _stopAt = 0; // timestamp after which the interval may shut off

function isEditable(elem) {
    return !!(elem && Utils.isElementEditable(elem));
}

function stopPollingSoon() {
    _stopAt = Date.now() + IDLE_GRACE_MS;
}

function maybeStartPolling() {
    if (_intervalId !== null) return;
    _intervalId = setInterval(checkFocus, INTERVAL);
}

function maybeStopPolling() {
    if (_intervalId === null) return;
    if (Date.now() < _stopAt) return; // still within grace window
    if (isEditable(_focusedElement)) return; // active editable, keep going
    clearInterval(_intervalId);
    _intervalId = null;
}

function checkFocus() {
    var current = document.activeElement;
    if (current !== _focusedElement) {
        _focusedElement = current;
        emitter.emit('change', current);
    }

    if (isEditable(_focusedElement)) {
        maybeStartPolling();
    } else {
        maybeStopPolling();
    }
}

// Primary: capture-phase listeners (more reliable than focusin in many cases).
document.addEventListener('focus', function () {
    checkFocus();
    if (isEditable(_focusedElement)) maybeStartPolling();
}, true);
document.addEventListener('blur', function () {
    checkFocus();
    stopPollingSoon();
    // Re-check shortly after to handle focus retargeting.
    setTimeout(checkFocus, 0);
}, true);

// Initial check (and start polling if the page loaded with an editable focused).
checkFocus();

module.exports = emitter;
