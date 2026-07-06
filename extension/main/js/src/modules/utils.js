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
        ,   endIndex = elem.selectionEnd;

        var pre = value.substring(0, endIndex);

        // Tolerant match for the same reasons as searchSelection (some fields/editors
        // may have trailing markers). For plain inputs this is usually not needed,
        // but keeps behavior consistent.
        let idx = pre.lastIndexOf(search);
        if (idx === -1) {
            return false;
        }
        const after = pre.substring(idx + search.length);
        if (!/^[\u200B\uFEFF\u00A0\u2028\u2029\s]*$/.test(after)) {
            return false;
        }

        var startIndex = idx;

        return callback({
            start: startIndex,
            end: idx + search.length,
            before: value.substring(0, startIndex),
            after: value.substring(endIndex)
        });
    },

    searchSelection: function (search, callback) {
        var selection = window.getSelection();

        if (!selection || !selection.focusNode) {
            return false;
        }

        let node = selection.focusNode;
        let offset = selection.focusOffset;

        // At the very beginning of a contenteditable (or start of a new line/block)
        // the selection often reports the container element (or a <br>) instead of
        // a text node. Resolve to a real text node so we can look for the typed
        // shortcode.
        if (node.nodeType === Node.ELEMENT_NODE) {
            // Prefer the child at/near the offset, or the previous one.
            let c = node.childNodes[offset] || node.childNodes[offset - 1];
            if (c && c.nodeType === Node.TEXT_NODE) {
                node = c;
                offset = (offset < node.childNodes.length ? 0 : c.nodeValue.length);
            } else {
                node = findFirstTextNode(node) || node;
                offset = (node.nodeValue ? Math.min(offset, node.nodeValue.length) : 0);
            }
        }

        if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue) {
            return false;
        }

        if (selection.rangeCount === 0) {
            return false;
        }

        const pre = node.nodeValue.substring(0, offset);

        // Use lastIndexOf + tolerant trailing chars. Some editors (WhatsApp, Lexical-based,
        // etc.) insert zero-width or other formatting chars ( \u200B, \uFEFF, &nbsp; etc.)
        // at the end of a text run, especially at the beginning of a new block/string.
        // Strict .endsWith(search) would fail, but the shortcode is still the "logical"
        // thing just typed.
        let idx = pre.lastIndexOf(search);
        if (idx === -1) {
            return false;
        }

        const after = pre.substring(idx + search.length);
        // Allow only "ignorable" trailing characters that editors use for caret management.
        if (!/^[\u200B\uFEFF\u00A0\u2028\u2029\s]*$/.test(after)) {
            return false;
        }

        const startIndex = idx;

        // The search string ends immediately before the caret (ignoring trailing markers).
        return callback({
            selection: selection,
            node: node,
            start: startIndex,
            end: idx + search.length
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

            try {
                offset = this.getElementBodyOffset(node);
            } finally {
                // Always clean up the temp node, even if measurement throws.
                var parent = node.parentNode;
                if (parent) {
                    parent.removeChild(node);
                    parent.normalize();
                }
            }
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

// Helper used by searchSelection to resolve a container element selection
// (very common at the absolute start of a contenteditable or new line)
// into a real text node so we can search for the just-typed shortcode.
function findFirstTextNode(el) {
    if (!el) return null;
    if (el.nodeType === Node.TEXT_NODE) return el;
    for (let i = 0; i < el.childNodes.length; i++) {
        const found = findFirstTextNode(el.childNodes[i]);
        if (found) return found;
    }
    return null;
}
