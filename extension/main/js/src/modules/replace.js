var State = require('./state.js');
var Utils = require('./utils.js');
var ElementWatcher = require('./element-watcher.js');
var StringBuffer = require('./string-buffer.js');

module.exports = function (emoji) {
    var element = ElementWatcher.getElement();
    var search = StringBuffer.getBuffer();
    var copyBehavior = State.getBehavior('copy');

    if (!element) {
        return false;
    }

    if (element.hasAttribute("contenteditable")) {
        if (copyBehavior) {
            // Fire-and-forget; Clipboard API is async but we do not block selection logic.
            Utils.clipWithSelection(emoji);
        }

        Utils.searchSelection(search, function (result) {
            // Backstop: the buffer is the source of truth, but if it ever desyncs
            // from the DOM (split nodes, normalize races, etc.), don't clobber
            // unrelated text. Bail silently instead.
            var slice = result.node.nodeValue.substring(result.start, result.end);
            if (slice !== search) return;

            // Create a fresh range on the known node/indices for reliability,
            // especially at start of line/node (startIndex==0) or complex ce structures.
            var range = document.createRange();
            range.setStart(result.node, result.start);
            range.setEnd(result.node, result.end);

            // If the behavior is copy, it should only select the match (user pastes manually).
            // Otherwise replace with the emoji.
            if (!copyBehavior) {
                range.deleteContents();
                var inserted = document.createTextNode(emoji);
                range.insertNode(inserted);

                if (result.node.parentNode) {
                    result.node.parentNode.normalize();
                }

                // Place caret after the inserted emoji. Use the inserted node reference
                // rather than range.endContainer, which is UA-dependent after insertNode.
                range.setStartAfter(inserted);
                range.collapse(true);
                result.selection.removeAllRanges();
                result.selection.addRange(range);
            }
        });
    } else {
        Utils.searchInput(element, search, function (result) {
            if (copyBehavior) {
                Utils.clipWithSelection(emoji);
                // Restore selection to the matched text (user will paste).
                element.selectionStart = result.start;
                element.selectionEnd = result.end;
            } else {
                // Backstop: bail if the buffer desyncs from the field value.
                if (element.value.substring(result.start, result.end) !== search) return;

                element.value = result.before + emoji + result.after;
                var caret = result.before.length + emoji.length;
                element.selectionStart = caret;
                element.selectionEnd = caret;
            }
        });
    }

    StringBuffer.clear();
};