var EventEmitter = require('event-emitter');
var State = require('./state.js');
var Utils = require('./utils.js');
var Keys = require('./keys.js');

module.exports = (function () {
    var exports = EventEmitter();

    var _buffer = "";

    function change(mutator, silent) {
        var cache = _buffer;
        _buffer = mutator(_buffer);

        if (
            _buffer !== cache &&
            typeof _buffer == "string"
        ) {
            if (silent !== true) {
                exports.emit('change', _buffer, cache);
            }

            if (_buffer.length === 0) {
                exports.emit('clear');
            }
        }
    }

    exports.clear = function () {
        change(function () {
            return "";
        }, true);
    };

    exports.handleKeyPress = function (event) {
        // Skip IME composition to avoid breaking non-Latin input methods
        if (event.isComposing) return;

        change(function (buffer) {
            // Use event.key for the character; ignore space (and other non-char like Enter from keypress)
            // here (handled in keydown for break). Only append actual single-char input.
            const k = event.key;
            if (k.length === 1 && k !== ' ') {
                return buffer + k;
            } else {
                return buffer;
            }
        });
    };

    exports.handleKeyDown = function (event) {
        if (event.isComposing) return;

        const key = event.key;
        const which = event.which; // fallback for very old browsers

        if (key === 'Enter' || key === ' ' || which === Keys.codes.enter || which === Keys.codes.space) {
            exports.emit('break', _buffer);
            exports.clear();
            return;
        }

        // Clear on arrow keys (and other navigation). 
        // We intentionally do not clear on "not collapsed" here to avoid false positives
        // at the start of a field (where window.getSelection().isCollapsed can be unreliable
        // in contenteditable or empty inputs), which was causing the buffer to lose chars
        // for the very first shortcode on the line.
        // Selection changes are handled by other events (click, arrows, blur, etc.).
        if (Keys.isArrowKey(which) || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
            exports.clear();
            return;
        }

        if (key === 'Backspace' || which === Keys.codes.backspace) {
            change(function (buffer) {
                return buffer.slice(0, -1);
            });
        }
    };

    exports.getBuffer = function () {
        return _buffer;
    };

    return exports;
})();

State.on('behavior_change', function (key, value) {
    if (key == 'active' && value == false) {
        module.exports.clear();
    }
});