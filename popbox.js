// PopBox. Written by AK 12.IV.2019 for "Palm Beach Cuisine". Copyright (c) 2019, UtilMind Solutions.

(function(window) {
  "use strict";

  var PopBox = {

    // public config
    auto_show: 15000,         // in milliseconds. 15000 milliseconds = 15 seconds. 0 = disabled.
    auto_close: 60000,        // in milliseconds. 60000 = 60 seconds. 0 = disabled.
    show_on_scroll_start: 48, // starting scroll position in percents, between 0% and 100%. Both 0 = disabled.
    show_on_scroll_end: 52,   // ending scroll position. Eg 40..60 means that popbox will appear when any part of page between 40% and 60% is appeared in the viewport.
    closeable_on_dimmer: true,
    auto_start_disabled: false, // disable auto_show on start. It can be re-enabled by calling PopBox.enable_auto() method.

    classes: {
      popbox: "popbox",
      workarea: "workarea",
      fixed: "popbox-fixed",
      no_overflow: "popbox-no-overflow",

      close_button: "close_button",
      close_countdown_text: "close_msg",
      close_countdown_digits: "close_countdown",
    },

    auto_shown: false, // just helper to determinate whether popup has been already displayed. Altertatively check out "auto_disabled".

    // private
    auto_timer: false,
    auto_close_timer: false,
    auto_disabled: -1, // unknown
    scroll_hook: false,
    scrollY: 0,
    topProperties: "",

    init: function(options) {
      var me = this;

      // setup config
      if (options)
        $.extend(this, options);

      doInit(function() {
        if (typeof $=="undefined") return 1;

        // click on workarea
        $("."+me.classes.popbox+" ."+me.classes.workarea).click(function(e) {
          e.stopPropagation(); // prevent "close on dimmer" event when the click inside the form
          // stop_hide_timer(); // no, let's stop timer only when user starts filling the form.
        });

        // close on dimmer
        if (me.closeable_on_dimmer) {
          $("."+me.classes.popbox).click(function(e) {
            me.hide();
          });
        }

        // close on X-button
        $("."+me.classes.close_button).click(function(e) {
          me.hide();
        });

        // ESC key hook
        $(document).keydown(function(e) {
          if ((e.keyCode == 27) && me.is_visible()) {
            e.preventDefault();
            e.stopPropagation();
            me.hide();
          }
        });

        // stop auto-hide timer when user started type something...
        $("."+me.classes.popbox+" input").keydown(function(e) {
          me.stop_hide_timer();
        });

        if (!me.auto_start_disabled) {
          doInit(function() {
            me.enable_auto();
          }, 2); // 2 - after full page load
        }
      });
    },

    enable_auto: function() {
      var me = this;
      if (!me.auto_disabled) return; // nothing to do

      me.auto_disabled = false;

      // start auto-show timer after the page will be fully loaded.
      if (me.auto_show) {
        me.auto_timer = setTimeout(function() {
          me.show(me.auto_close, 1);
        }, me.auto_show);
      }

      // hook scroll
      if (me.show_on_scroll_end > me.show_on_scroll_start) {
        $(window).scroll(me.scroll_hook = function(e) {
          var scrollTop = $(window).scrollTop(),
              viewport_height = $(window).height();

          // This is a kludge to make it working in quirks mode. Problem described at https://viralpatel.net/blogs/jquery-window-height-incorrect/
          // In case if page doesn't have <!DOCTYPE HTML> or similar directive, the document.body.clientHeight is the viewport height, and $(window).height() is the whole page height.
          // I would prefer to make this script compatible in any mode, so let's just check out both and use lesser value.
          if (viewport_height > document.body.clientHeight)
            viewport_height = document.body.clientHeight;

          // console.log("top " + scrollTop + ", bottom: " + (scrollTop + document.body.clientHeight) + ', view height: ' + document.body.clientHeight + ' / ' + $(window).height() + ' viewport: ' + viewport_height +
          //  ", start: " + document.body.scrollHeight / 100 * me.show_on_scroll_start + ", end: " + document.body.scrollHeight / 100 * me.show_on_scroll_end);

          if (((scrollTop + viewport_height) > (document.body.scrollHeight / 100 * me.show_on_scroll_start)) &&
              (scrollTop < (document.body.scrollHeight / 100 * me.show_on_scroll_end))) {
            // console.log('fire')
            me.show(me.auto_close, 1);
          }
        });
      }
    },

    disable_auto: function() {
      var me = this;
      if (me.auto_disabled > 0) return; // nothing to do

      me.auto_disabled = true;

      if (me.auto_timer)
        clearInterval(me.auto_timer);
      if (me.scroll_hook)
        $(window).unbind("scroll");
    },

    is_visible: function() {
      return $("."+this.classes.popbox).is(":visible");
    },

    show: function(auto_close_ms, is_auto) {
      var me = this;
      if (me.is_visible()) return;

      if (is_auto) {
        if (me.auto_disabled) return;
        me.disable_auto();
        me.auto_shown = 1; // just a flag that we already displayed it.

        // countdowns and misc stuff
        $("."+me.classes.close_countdown).show();
    
        var auto_close_ticks = auto_close_ms / 1000;
        $("."+me.classes.close_countdown_digits).html(auto_close_ticks);

        me.auto_close_timer = setInterval(function() {

          --auto_close_ticks;
          $("."+me.classes.close_countdown_digits).html(auto_close_ticks);

          if (auto_close_ticks == 0) me.hide();

        }, 1000);
      }else
        $("."+me.classes.close_countdown).hide();

      me.override_scrollbar(1);
      $("."+me.classes.popbox).show();
    },

    hide: function() {
      clearInterval(this.auto_close_timer);

      $("."+this.classes.popbox).hide();
      this.override_scrollbar(0);
    },

    stop_hide_timer: function() {
      clearInterval(this.auto_close_timer);
      $("."+this.classes.close_countdown_text).hide();
    },

    override_scrollbar: function(add) {
      if (add) {
        this.scrollY = $(window).scrollTop(); // (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
        this.topProperties = window.getComputedStyle(document.body).top; // save properties
        document.body.style.top = -this.scrollY + "px";
        $("body").addClass(this.classes.fixed + " " + this.classes.no_overflow);

      }else {
        $("body").removeClass(this.classes.fixed + " " + this.classes.no_overflow);
        document.body.style.top = this.topProperties; // restore properties
        window.scrollTo(0, this.scrollY);
      }
    },
  }

  if (!window.PopBox)
    window.PopBox = PopBox;

}( typeof window !== "undefined" ? window : this ));

/* USAGE example:

PopBox.init({
  auto_show: 15000,         // in milliseconds. 15000 milliseconds = 15 seconds. 0 = disabled.
  auto_close: 60000,        // in milliseconds. 60000 = 60 seconds. 0 = disabled.
  show_on_scroll_start: 45, // starting scroll position in percents, between 0% and 100%. Both 0 = disabled.
  show_on_scroll_end: 55,   // ending scroll position. Eg 40..60 means that popbox will appear when any part of page between 40% and 60% is appeared in the viewport.
  closeable_on_dimmer: false
});
*/