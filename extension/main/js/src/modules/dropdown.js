var EventEmitter = require('event-emitter');
var Utils = require('./utils.js');
var State = require('./state.js');

function Dropdown(parent) {
    this.items = {};
    this.selectedItem = null;
    this.parent = parent || document.body;

    this.dropdown = document.createElement("div");
    this.dropdown.classList.add("smiley-caret-dropdown");

    this.container = document.createElement("div");
    this.container.classList.add("smiley-caret-container");
    this.dropdown.appendChild(this.container);

    if (State.getBehavior('copy')) {
        this.container.classList.add("behavior-copy");
    }

    this.parent.appendChild(this.dropdown);
} Dropdown.prototype = {
    createItem: function (name, emoji) {
        if (this.items[name]) return;

        var item = document.createElement("div");
        var emojiElem = document.createElement("span");
        var emojiElemChar = document.createElement("i");
        var nameElem = document.createElement("p");

        // Native unicode emoji (Twemoji removed for MV3 compliance, simplicity, no remote assets)
        emojiElemChar.textContent = emoji;
        emojiElem.appendChild(emojiElemChar);

        item.appendChild(emojiElem);

        nameElem.appendChild(document.createTextNode(name));
        item.appendChild(nameElem);

        // Use dataset instead of expando property (cleaner, modern DOM practice)
        item.dataset.smileyEmoji = emoji;
        item.dataset.smileyName = name;

        var self = this;
        item.addEventListener("mouseenter", function () {
            self.selectItem(this);
        });

        item.addEventListener("mousedown", function (event) {
            self.selectItem(this);
            self.chooseItem();
            event.preventDefault(); // to prevent loss of focus
            event.stopImmediatePropagation();
        });

        this.container.appendChild(item);
        this.items[name] = item;
    },

    chooseItem: function () {
        if (this.selectedItem && this.selectedItem.dataset.smileyEmoji) {
            this.emit('choose', this.selectedItem.dataset.smileyEmoji);
        }  
    },

    selectItem: function (item) {
        if (this.selectedItem) {
            this.selectedItem.classList.remove("selected");
            this.selectedItem = null;
        }

        if (item) {
            item.classList.add("selected");
            this.selectedItem = item;
        }
    },

    updateList: function (list) {
        if (list.length === 0) return;

        // Clean rebuild: drop every existing item, then recreate from the new
        // list. Simpler and obviously-correct vs. an incremental diff; list
        // sizes here are small (fuzzy search top-N).
        var selectedName = this.selectedItem ? this.selectedItem.dataset.smileyName : null;

        for (var k in this.items) {
            var node = this.items[k];
            if (node.parentNode) node.parentNode.removeChild(node);
            delete this.items[k];
        }

        for (var i = 0; i < list.length; i++) {
            var emoji = list[i][0]
            ,   name = list[i][1];

            this.createItem(name, emoji);

            if (name === selectedName) {
                this.selectItem(this.items[name]);
            }
        }

        // If the previously-selected name is gone, fall back to the first item.
        if (!this.selectedItem && this.container.firstElementChild) {
            this.selectItem(this.container.firstElementChild);
        }
    },

    alignTo: function (elem) {
        var offset = Utils.getElementCaretOffset(elem);

        if (offset) {
            this.dropdown.style.left = offset.left + "px";
            this.dropdown.style.top = offset.top + "px";

            if (offset.fixed) {
                this.dropdown.classList.add("is-fixed");
            } else {
                this.dropdown.classList.remove("is-fixed");
            }
        }
    },

    show: function () {
        this.active = true;
        this.dropdown.classList.add("is-visible");
    },

    hide: function () {
        this.active = false;
        this.dropdown.classList.remove("is-visible");
    },

    remove: function () {
        this.hide();

        var self = this;
        setTimeout(function () {
            self.destroy();
        }, 500);
    },

    destroy: function () {
        if (this.destroyed) return;
        
        if (this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }

        this.parent = null;
        this.items = null;
        this.selectedItem = null;
        this.dropdown = null;
        this.container = null;

        this.destroyed = true;
    }
};

EventEmitter(Dropdown.prototype);
module.exports = Dropdown;