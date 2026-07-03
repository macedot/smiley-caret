var getCaretCoordinates = require('textarea-caret');

module.exports = {
    searchInput: function (elem, search, callback) {
        if (
            !elem ||
            typeof elem.value != "string" ||
            typeof elem.selectionEnd != "number"
        ) {
            return false;
        }

        var value = elem.value
        ,   endIndex = elem.selectionEnd
        ,   len = search.length
        ,   startIndex = Math.max(0, endIndex - len);

        // Always replace the preceding N chars based on the buffer. No strict match check.
        // This ensures it works even when the shortcode is the very first thing (startIndex=0).
        return callback({
            start: startIndex,
            end: endIndex,
            before: value.substring(0, startIndex),
            after: value.substring(endIndex)
        });
    },

    searchSelection: function (search, callback) {
        var selection = window.getSelection();

        if (
            !selection ||
            !selection.focusNode ||
            !selection.focusNode.nodeValue
        ) {
            return false;
        }

        var node = selection.focusNode
        ,   endIndex = selection.focusOffset;

        if (!node || !node.nodeValue || selection.rangeCount == 0) {
            return false;
        }

        var len = search.length;
        var startIndex = Math.max(0, endIndex - len);

        // Always replace the preceding N chars in the current text node based on the buffer.
        // This fixes cases where the shortcode is the very first thing on the line (start of text node).
        return callback({
            selection: selection,
            node: node,
            start: startIndex,
            end: endIndex
        });
    },

    isElementEditable: function (elem) {
        return (elem && (
            elem.hasAttribute("contenteditable") ||
            elem.tagName === "TEXTAREA" ||
            elem.tagName === "INPUT"
        ));
    },

    isElementEmojiEligible: function (elem) {
        var forbidden = ["email", "password", "tel"]
        ,   type = elem.getAttribute("type")
        ,   name = elem.getAttribute("name");

        return (
            this.isElementEditable(elem) &&
            forbidden.indexOf(type) == -1 &&
            forbidden.indexOf(name) == -1
        );
    },

    getElementBodyOffset: function (elem) {
        var viewportOffset = elem.getBoundingClientRect()
        ,   scrollTop = document.documentElement.scrollTop + document.body.scrollTop
        ,   scrollLeft = document.documentElement.scrollLeft + document.body.scrollLeft
        ,   offsetElem = elem
        ,   result = {
                top: 0,
                left: 0,
                fixed: false
            };

        do {
            var computed = window.getComputedStyle(offsetElem);

            if (computed && computed.position == "fixed") {
                result.fixed = true;
                break;
            }
        } while (offsetElem = offsetElem.offsetParent);

        result.top = viewportOffset.top;
        result.left = viewportOffset.left;

        if (!result.fixed) {
            result.top += scrollTop;
            result.left += scrollLeft;
        }

        return result;
    },

    getElementCaretOffset: function (elem) {
        var offset = null;

        if (elem.hasAttribute('contenteditable')) {
            var selection = window.getSelection()
            ,   range = selection.getRangeAt(selection.rangeCount - 1)
            ,   clonedRange = range.cloneRange();

            var node = document.createElement('span');
            clonedRange.insertNode(node);

            offset = this.getElementBodyOffset(node);

            var parent = node.parentNode;
            parent.removeChild(node);
            parent.normalize();
        } else {
            offset = this.getElementBodyOffset(elem);

            var caretOffset = getCaretCoordinates(elem, elem.selectionEnd);
            offset.top += caretOffset.top - elem.scrollTop;
            offset.left += caretOffset.left;
        }

        return offset;
    },

    // Modern Clipboard API replacement for execCommand (MV3 best practice).
    // Must be called in a user gesture context.
    clipWithInput: async function (text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            // Fallback (rare): create temp input (less reliable without focus)
            var input = document.createElement("input");
            document.body.appendChild(input);
            input.value = text;
            input.select();
            document.execCommand("copy"); // legacy fallback only
            document.body.removeChild(input);
        }
    },

    clipWithSelection: async function (text) {
        try {
            await navigator.clipboard.writeText(text);
            // Selection restore not strictly needed for plain emoji copy; keep simple.
        } catch (e) {
            // Legacy fallback (selection dance)
            var node = document.createTextNode(text),
                selection = window.getSelection(),
                range = document.createRange(),
                clone = null;

            if (selection.rangeCount > 0) {
                clone = selection.getRangeAt(selection.rangeCount - 1).cloneRange();
            }

            document.body.appendChild(node);
            selection.removeAllRanges();
            range.selectNodeContents(node);
            selection.addRange(range);
            document.execCommand("copy");

            selection.removeAllRanges();
            document.body.removeChild(node);

            if (clone !== null) {
                selection.addRange(clone);
            }
        }
    }
};