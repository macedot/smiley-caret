var EventEmitter = require('event-emitter');

var _behavior = {
    active: true,
    shortcodes: true,
    coloncodes: true,
    copy: false
};

module.exports = (function () {
    var exports = EventEmitter();

    exports.getBehavior = function (key) {
        return _behavior[key];
    };

    exports.setBehavior = function (data, silent) {
        for (var k in data) {
            if (k in _behavior && data[k] !== _behavior[k]) {
                _behavior[k] = data[k];

                if (!silent) {
                    exports.emit("behavior_change", k, _behavior[k]);
                }
            }
        }
    };

    return exports;
})();

// Turn off replacing functionality on Facebook/Messenger DOM, which fights
// the extension. Match hostnames precisely (not bare substring) so unrelated
// sites containing "facebook" aren't affected.
function isFacebookHost(hostname) {
    return (
        hostname === 'facebook.com' ||
        hostname.endsWith('.facebook.com') ||
        hostname === 'messenger.com' ||
        hostname.endsWith('.messenger.com')
    );
}

if (isFacebookHost(window.location.hostname)) {
    module.exports.setBehavior({
        copy: true,
        shortcodes: false
    }, true);
}

chrome.storage.local.get({
    active: true
}, function (data) {
    module.exports.setBehavior({
        active: !!data.active
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, respond) {
    if (request.id == "update_behavior") {
        module.exports.setBehavior(request.data);
    }
});

// React to storage changes (MV3-friendly way to receive global toggle without tabs permission)
chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes.active) {
        module.exports.setBehavior({ active: !!changes.active.newValue });
    }
});