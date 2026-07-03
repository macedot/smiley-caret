var ENTITIES = require('../../../../data/emoji-entities.js');
var Fuse = require('fuse.js');

var EntitiesFuse = new Fuse(ENTITIES, {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    minMatchCharLength: 1,
    keys: ['1']   // search the name/slug field (index 1 in [emoji, slug] arrays)
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
chrome.action.onClicked.addListener(async () => {
    const { active = true } = await chrome.storage.local.get({ active: true });
    const newActiveState = !active;

    await chrome.storage.local.set({ active: newActiveState });
    await updateExtensionIcon();
});

async function updateExtensionIcon() {
    try {
        const { active = true } = await chrome.storage.local.get({ active: true });
        const iconPath = active !== false ? "img/icon-16.png" : "img/icon-16-inactive.png";
        // Use getURL() to get an absolute chrome-extension:// URL.
        // Relative paths can fail with "Failed to fetch" when called from a service worker
        // because the SW's own script URL affects resolution for some resource loads.
        await chrome.action.setIcon({
            path: chrome.runtime.getURL(iconPath)
        });
    } catch (err) {
        console.error("Failed to update extension icon:", err);
    }
}

// Set icon on SW wake / startup
updateExtensionIcon();

// React to external storage changes (e.g. options or future UI) to keep icon in sync
chrome.storage.onChanged.addListener(() => {
    updateExtensionIcon();
});