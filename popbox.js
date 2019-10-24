// PopBox. Written by AK 12.IV.2019 for "Palm Beach Cuisine". Copyright (c) 2019, UtilMind Solutions.
// This code requires doInit() from https://github.com/utilmind/on-ready-js

(function(window) {
  "use strict";

  var PopBox = {

    // public config
    autoShow: 15000,         // timeout in milliseconds. 15000 milliseconds = 15 seconds. 0 = disabled.
    autoClose: 60000,        // timeout in milliseconds. 60000 = 60 seconds. 0 = disabled.
    autoShowDisabled: false, // disable autoShow on start. It can be re-enabled by calling PopBox.startAutoShow() method.
                                // Alternative values:
                                //   - "scroll": enables autoShow only after any scroll event. Don't displays popup if there was no scrolling.
    showOnScrollStart: 48, // starting scroll position in percents, between 0% and 100%. Both 0 = disabled.
    showOnScrollEnd: 52,   // ending scroll position. Eg 40..60 means that popbox will appear when any part of page between 40% and 60% is appeared in the viewport.
    showOnExitIntent: true,
    exitIntentTimeout: 8000, // minimum timeout in milliseconds before displaying the popup because user is about to leave the page. 0 = no timeout.

    closeOnDimmer: true,
    closeOnEsc: true,
    noPropagateClicks: false, // pass clicks on the workarea to another event handlers.

    // Callbacks. AK 26.08.2019: I thought about CustomEvent, but it's doesn't supported by IE.
    //            Donald said that IE is important for PBC users. So let's use simple callbacks. (Don't complex due to outdated methods, it's OK here.)
    onShow: false, // after show
    onHide: false, // after hide

    classes: {
      popbox: "popbox",
      workarea: "workarea",

      fixed: "popbox-fixed",
      noOverflow: "popbox-no-overflow",

      closeButton: "popbox-close",
      closeCountdownMsg: "popbox-close-msg",
      closeCountdownDigits: "popbox-close-countdown",
    },

    // private
    timerShow: false,
    timerClose: false,
    scrollHook: false,
    autoShowUsed: false,
    showCnt: 0,

    scrollPosition: {
      y: 0,
      top: "",
      class: "",

      save: function(bodyClassName) { // save scrollbar position
        this.y = $(window).scrollTop(); // (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
        this.top = window.getComputedStyle(document.body).top; // save properties
        document.body.style.top = -this.y + "px";

        $("body").addClass(this.class = bodyClassName);
      },

      restore: function(bodyClassName) { // restore scrollbar position
        $("body").removeClass(bodyClassName ? bodyClassName : this.class);

        document.body.style.top = this.top;
        window.scrollTo(0, this.y);
      },
    },


    // Public functions
    init: function(options) {
      var me = this;

      // setup config
      if (options)
        $.extend(this, options);

      doInit(function() {
        if (typeof $=="undefined") return 1; // wait for jQuery, then go forth.

        // click on workarea
        if (me.noPropagateClicks)
          $("."+me.classes.popbox+" ."+me.classes.workarea).click(function(e) {
            e.stopPropagation(); // prevent "close on dimmer" event when the click inside the form
            // stopTimerHide(); // no, let's stop timer only when user starts filling the form.
          });

        // close on dimmer click
        if (me.closeOnDimmer)
          $("."+me.classes.popbox).click(function(e) {
            e.stopPropagation();
            me.hide();
          });

        // close on X-button
        $("."+me.classes.closeButton).click(function(e) {
          e.stopPropagation();
          e.preventDefault();
          me.hide();
        });

        // stop auto-hide timer when user started type something...
        if (me.autoClose > 0)
          $("."+me.classes.popbox).find("input, textarea, select").keydown(function(e) {
            me.stopTimerHide();
            $(this).off("keydown");
          });

        if (!me.autoShowDisabled || (me.autoShowDisabled == "scroll")) { // if false (!disabled) or "scroll"
          doInit(function() {
            me.startAutoShow(me.autoShowDisabled == "scroll"); // will be enabled either on scroll OR
          }, 2); // 2 - after full page load
        }

        // AK 22.10.2019: show on exit intent. Looked at https://julian.is/article/exit-intent-popups/
        if (me.showOnExitIntent) {
          var setupMouseOut = function() {
            $(document).on("mouseout", function(evt) {
              if (evt.toElement === null && evt.relatedTarget === null &&
                 (evt.clientY < 0)) {

                // don't display
                if (me.onBeforeExitIntent && !me.onBeforeExitIntent())
                  return false;

                if (me.showCnt == 0)
                  me.show();
                else
                  me.disableAutoShow();
              }
            });
          }

          if (me.exitIntentTimeout > 0)
            setTimeout(setupMouseOut, me.exitIntentTimeout);
          else
            setupMouseOut();
        }
      });
    },

    isVisible: function() {
      return $("."+this.classes.popbox).is(":visible");
    },

    show: function(autoCloseMs) {
      var me = this;
      if (me.isVisible()) return; // already visible right now

      if (me.showCnt == 0)
        me.disableAutoShow();
      ++me.showCnt;

      if (autoCloseMs) {
        $("."+this.classes.closeCountdownMsg).show(); // popup can be displayed "manually" more than once. So if this countdown hidden, let's display it again.

        // countdowns and misc stuff
        $("."+me.classes.closeCountdownDigits).show();

        var autoCloseTicks = autoCloseMs / 1000; // let's round to 1 second. We don't care if for lesser intervals.
        $("."+me.classes.closeCountdownDigits).html(autoCloseTicks);

        me.timerClose = setInterval(function() {

          --autoCloseTicks;
          $("."+me.classes.closeCountdownDigits).html(autoCloseTicks);

          if (autoCloseTicks <= 0) me.hide();

        }, 1000);
      }else
        $("."+me.classes.closeCountdownMsg).hide(); // TODO: we should hide entire message! not only digits!!

      // save scroll position and show the PopBox
      me.scrollPosition.save(me.classes.fixed + " " + me.classes.noOverflow);
      $("."+me.classes.popbox).show();

      if (me.closeOnEsc) // Hook global ESC key, but only when the popup is displayed.
        $(document).keydown(function(e) {
          if ((e.keyCode == 27) && me.isVisible()) {
            e.stopPropagation();
            me.hide();
            $(document).off("keydown");
          }
        });

      if (me.onShow) me.onShow();
    },

    hide: function() {
      var me = this;

      me.stopTimerHide();

      // hide the PopBox and restore scroll position
      $("."+me.classes.popbox).hide();
      me.scrollPosition.restore();

      if (me.onHide) me.onHide();
    },


    stopTimerHide: function() {
      if (this.timerClose) {
        clearInterval(this.timerClose);
        this.timerClose = false;

        $("."+this.classes.closeCountdownMsg).hide();
      }
    },

    startAutoShow: function(isScroll) { // executes only after the page will be fully loaded. Can be invoken only once.
      var me = this,

          showPopBoxAuto = function() {
            // The most important here: do NOT show the PopBox if it was ever displayed before.
            if (me.showCnt == 0)
              me.show(me.autoClose);
            else
              me.disableAutoShow(); // it should be already disabled, but just in case...
          },

          setupTimerShow = function() { // private, for internal use
            if (me.autoShow && !me.timerShow) { // we need timer, but it's not set up yet (because we're waiting for any scroll event)

              me.timerShow = setTimeout(function() { // save timerShow to be able to stop it.
                showPopBoxAuto();
              }, me.autoShow);

            }
          };

      if (me.autoShowUsed) return; // already used. Don't use it twice.

      me.autoShowUsed = 1;

      if (!isScroll) // don't set it right now. It will be set up on first scroll movement.
        setupTimerShow();

      // hook scroll. To display the PopBox on right scroll position.
      if (isScroll || (me.showOnScrollEnd > me.showOnScrollStart)) {
        $(window).scroll(me.scrollHook = function(e) {
          if (isScroll)
            setupTimerShow(); // start the display counter after first scroll event

          if (me.showOnScrollEnd > me.showOnScrollStart) {
            var scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop, // $(window).scrollTop(),
                scrollHeight = (document.documentElement && document.documentElement.scrollHeight) || document.body.scrollHeight,

                // following, window.innerHeight is better than $(window).height(), because innerHeight works both in normal and quirks mode (when <!DOCTYPE> not specified).
                // Important! documentElement.clientHeight and body.clientHeight returns opposite values when <!DOCTYPE> specifed and not specified. Less value would be more correct.
                viewportHeight = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || document.body.clientHeight; // window.innerHeight is undefined in IE8-.

            if (((scrollTop + viewportHeight) > (scrollHeight / 100 * me.showOnScrollStart)) &&
                (scrollTop < (scrollHeight / 100 * me.showOnScrollEnd))) {
              // console.log('popup on scroll')
              showPopBoxAuto();
            }
          }
        });
      }
    },

    disableAutoShow: function() { // invoked when PopBox already displayed, so we should stop all counters which may invoke it.
      var me = this;
      if (!me.autoShowUsed) return; // there is no hooks

      if (me.timerShow)
        clearInterval(me.timerShow);
      if (me.scrollHook)
        $(window).off("scroll");
      if (me.showOnExitIntent)
        $(document).off("mouseout");
    },

    onBeforeExitIntent: function() { // this even can be overriden to disable displaying of the PopBox in case of some extra-special circumstances.
                                     // by default I don't want to display it if some alertify dialog displayed.
      if ((typeof alertify != "undefined") &&
          (alertify.alert().isOpen() || alertify.confirm().isOpen() || alertify.prompt().isOpen()))
        return false;
      else
        return true; // don't worry, https://javascript-minifier.com will optimize this code. All I need here is readability.
    }
  };

  if (!window.PopBox)
    window.PopBox = PopBox;

}( typeof window !== "undefined" ? window : this ));

/* USAGE example:

PopBox.init({
  autoShow: 15000,           // in milliseconds. 15000 milliseconds = 15 seconds. 0 = disabled.
  autoClose: 60000,          // in milliseconds. 60000 = 60 seconds. 0 = disabled.
  autoShowDisabled: false, // disable autoShow on start. It can be re-enabled by calling PopBox.startAutoShow() method. Set to "scroll" to start autoShow after any scroll event. (No scroll = no popup.)
  showOnScrollStart: 45,   // starting scroll position in percents, between 0% and 100%. Both 0 = disabled.
  showOnScrollEnd: 55,     // ending scroll position. Eg 40..60 means that popbox will appear when any part of page between 40% and 60% is appeared in the viewport.
  closeOnDimmer: false,
  closeOnEsc: true,
  noPropagateClicks: false,
  onShow: function() {     // callbacks
     head_ext_resource("alertify/alertify-pbc.min.css", "link");
     head_ext_resource("alertify/alertify.min.js", "script");
  },
  onHide: function() {
     console.log('hidden');
  },
});
*/