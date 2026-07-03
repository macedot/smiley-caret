var EventEmitter = require('event-emitter');
var State = require('./state.js');

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

        // Break (attempt shortcode match) on Enter/Space.
        if (key === 'Enter' || key === ' ') {
            exports.emit('break', _buffer);
            exports.clear();
            return;
        }

        // Clear on navigation / selection-changing keys.
        if (key === 'Backspace') {
            change(function (buffer) {
                return buffer.slice(0, -1);
            });
        } else if (
            key.startsWith('Arrow') ||
            key === 'Tab' ||
            key === 'Escape' ||
            key === 'Home' ||
            key === 'End' ||
            key === 'PageUp' ||
            key === 'PageDown' ||
            (key === 'a' && (event.ctrlKey || event.metaKey)) // select-all
        ) {
            exports.clear();
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