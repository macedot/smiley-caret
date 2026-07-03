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
            // Use event.key for the character; ignore space here (handled in keydown)
            if (event.key !== ' ') {
                return buffer + event.key;
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

        // Clear on arrow keys or when selection is not collapsed (e.g. ctrl+A)
        if (Keys.isArrowKey(which) || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' || !(window.getSelection().isCollapsed)) {
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