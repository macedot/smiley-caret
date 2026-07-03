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
            var range = result.selection.getRangeAt(result.selection.rangeCount - 1);
            range.setStart(result.node, result.start);
            range.setEnd(result.node, result.end);

            // If the behavior is copy, it should only select the match (user pastes manually).
            // Otherwise replace with the emoji.
            if (!copyBehavior) {
                range.deleteContents();
                range.insertNode(document.createTextNode(emoji));

                if (result.node.parentNode) {
                    result.node.parentNode.normalize();
                }
                
                result.selection.collapseToEnd();
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
                element.value = result.before + emoji + result.after;
                element.selectionEnd = result.before.length + emoji.length;
            }
        });
    }

    StringBuffer.clear();
};