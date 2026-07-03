var ENTITIES = require('../../../../data/emoji-entities.js');
var Fuse = require('fuse.js');

var EntitiesFuse = new Fuse(ENTITIES, {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    minMatchCharLength: 1,
    keys: [1, 2]
});

// --- Message handling (single listener) ---
chrome.runtime.onMessage.addListener(function (request, sender, respond) {
    if (request.id === "get_coloncode_emoji") {
        let emoji = null;
        for (let i = 0; i < ENTITIES.length; i++) {
            if (ENTITIES[i][1] === request.coloncode) {
                emoji = ENTITIES[i][0];
                break;
            }
        }
        respond(emoji);
        return true;
    }

    if (request.id === "get_coloncodes") {
        const result = EntitiesFuse.search(request.search);
        // Normalize fuse v3+ result shape
        const items = (result && result[0] && result[0].item)
            ? result.map(r => r.item)
            : result;
        respond(items);
        return true;
    }
});

// --- Action (toolbar icon) click toggles global active state ---
chrome.action.onClicked.addListener(function () {
    chrome.storage.local.get({ active: true }, function (data) {
        var newActiveState = !(data.active !== false);

        chrome.storage.local.set({ active: newActiveState }, function () {
            updateExtensionIcon();
            // Content scripts react via chrome.storage.onChanged (or re-get on focus)
            // No tabs.query broadcast to avoid needing "tabs" permission.
        });
    });
});

function updateExtensionIcon() {
    chrome.storage.local.get({ active: true }, function (data) {
        var active = (data.active !== false);
        chrome.action.setIcon({
            path: active ? "img/icon-16.png" : "img/icon-16-inactive.png"
        });
    });
}

// Set icon on SW wake / startup
updateExtensionIcon();

// React to external storage changes (e.g. options or future UI) to keep icon in sync
chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes.active) {
        updateExtensionIcon();
    }
});