var $ = require('jquery');
var shortcodes = require('../../../../data/emoji-shortcodes.js');

(function () {
    var $container = $(".js-shortcodes");

    for (var k in shortcodes) {
        var $col = $('<div class="col-sm-3"></div>')
        ,   $code = $('<div class="shortcode"></div>')
        ,   $codeText = $('<span></span>')
        ,   $codeIcon = $('<i></i>');

        $codeText.text(k);
        // Use native unicode emoji directly (no Twemoji)
        $codeIcon.text(shortcodes[k]);

        $code.append($codeText, $codeIcon);
        $col.append($code);
        $container.append($col);
    }

    $(".editor").one("focus", function () {
        $(this).html("");
    });
})();