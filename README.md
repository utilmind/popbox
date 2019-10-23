# popbox
Lightweight popup box. Requires jQuery, but can be easily rewritten without jQuery.

Live demo:
http://utilmind.com/demos/2019/popbox/

Originally developed for PBC: https://palmbeachcuisine.com/restaurant-specials.html

UPDATE 1.07.2019: added new feature-value for "autoStartDisabled" option: "scroll". So if "autoStartDisabled" = "scroll", the autoShow timer will be started only after any window.scroll event.

UPDATE 26.08.2019: added onShow and onHide callback events.

UPDATE 22.10.2019: rewritten almost from scratch to make the code perfect.
New feature, showOnExitIntent: PopBox can be automatially displayed when mouse hovers address line. (But only if it did not displayed before.) If this functionality is not enough — you may create your own "mouseout" event handler using the code inside the PopBox as an example.
