/**
 * @name index.js<beez-touch/s>
 * @author Masaki Sueda <s.masaki07@gmail.com>
 * @overview Touch event plug-in for Beez (browser)
 * @license MIT
 */

var BEEZ_TOUCH_VERSION = '0.3.3';

if (typeof module !== 'undefined' && module.exports) { // node.js: main

    exports.VERSION = BEEZ_TOUCH_VERSION;

} else {

    (function (global) {

        define(function (require, exports, module) {

            var beez = require('beez'),
                logger = beez.getLogger('beez.touch');

            if (beez.touch) {
                logger.warn('beez.touch is already loaded.');
                return beez.touch;
            }

            // vendor
            var _ = beez.vendor._,
                $ = beez.vendor.$;

            // device flag
            var hasTouch = 'ontouchstart' in window,
                EVENT = {
                start: {
                    name: hasTouch ? 'touchstart' : 'mousedown',
                    callback: 'onBztchTapStart'
                },
                move: {
                    name: hasTouch ? 'touchmove' : 'mousemove',
                    callback: 'onBztchTapMove'
                },
                end: {
                    name: hasTouch ? 'touchend' : 'mouseup',
                    callback: 'onBztchTapEnd'
                }
            };

            /**
             * normalize position
             * @param  {Events} e event object
             */
            var normalizePosition = function normalizePosition(e) {
                var position = {};

                if (hasTouch) {
                    if (e.originalEvent) {
                        position = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                        position = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                    } else {
                        position = e.changedTouches[0] && e.changedTouches[0];
                    }
                } else {
                    position = e;
                }

                return position;
            };

            var Inheritance = (function (global) {
                Inheritance = function () {};
                Inheritance.prototype = {
                    /**
                     * initialize
                     */
                    initialize: function initialize(options) {
                        TouchView.__super__.initialize.apply(this, arguments);

                        options = options || {};
                        options.bztch = options.bztch || {};

                        /**
                         * Tap event data
                         * @type {Object}
                         */
                        this._bztchTaps = null;

                        /**
                         * Flag of enable to tap
                         * @type {Boolean}
                         */
                        this._bztchIsTappable = false;

                        /**
                         * Flag of unable to touch
                         * @type {Boolean}
                         */
                        this._bztchIsDisable = false;

                        /**
                         * Flag of mouse down
                         * @type {Boolean}
                         */
                        this._bztchIsTapMouseDown = false;

                        /**
                         * Base prefix
                         * @type {String}
                         */
                        this._bztchPrefix = _.isString(options.bztch.prefix) ? options.bztch.prefix : 'bztch';

                        /**
                         * Prefix for tap
                         * @type {String}
                         */
                        this._bztchTapPrefix = this._bztchPrefix + '-tap';

                        /**
                         * ClassName of hover
                         * @type {String}
                         */
                        this._bztchHoverClassName = _.isString(options.bztch.hoverClassName) ? options.bztch.hoverClassName : 'hover';

                        /**
                         * ClassName of disable
                         * @type {String}
                         */
                        this._bztchDisableClassName = _.isString(options.bztch.disableClassName) ? options.bztch.disableClassName : 'disable';

                        /**
                         * Position of touchstart
                         * @type {Object}
                         */
                        this._bztchStartPosition = {};

                        /**
                         * time manager of beez
                         * @type {Timer}
                         */
                        this._bztchTimer = new beez.utils.Timers();

                        /**
                         * Threshold of touch cancel
                         * @type {Number}
                         */
                        this._bztchThreshold = options.bztch.threshold || 10;
                    },

                    /**
                     * Add tap events to the elements
                     * @param {Element} $elm
                     * @param {Function} callback
                     * @param {beez.View} context
                     * @param {Object} options
                     */
                    tap: function tap($elm, callback, context, options) {
                        var self = this,
                            tap,
                            uid;

                        options = _.defaults(options || {}, {
                            tapStart: beez.none,
                            tapMove: beez.none,
                            tapEnd: beez.none,
                            tapHold: beez.none,
                            context: self
                        });

                        // multiple selector
                        if ($elm.length > 1) {
                            _.each($elm, function (list, i) {
                                self.tap($elm.eq(i), callback, context, options);
                            });
                            return;
                        }

                        if (!self._atached || (!self._atachedSelf && $elm === self.$el)) {
                            // register events to tap
                            _.each(EVENT, function (evt) {
                                var eventName = evt.name + '.delegateEvents' + self.cid,
                                    callback = evt.callback;

                                if ($elm === self.$el) {
                                    self.$el.on(eventName, _.bind(self[callback], self) || beez.none);
                                    self._atachedSelf = true;
                                } else {
                                    self.$el.on(eventName, '.' + self._bztchTapPrefix, _.bind(self[callback], self) || beez.none);
                                    self._atached = true;
                                }
                            });
                        }

                        self._bztchTaps = self._bztchTaps || {};

                        tap = {
                            callback : callback || beez.none,
                            callbackStart : options.tapStart,
                            callbackMove : options.tapMove,
                            callbackEnd : options.tapEnd,
                            callbackHold: options.tapHold,
                            holdDuration: options.holdDuration,
                            once: options.once || false,
                            $elm: $elm,
                            context : context
                        };

                        if ($elm.hasClass(self._bztchTapPrefix)) {
                            uid = $elm.attr('data-' + self._bztchTapPrefix + 'Uid');
                            if (_.isEmpty(self._bztchTaps[uid])) {
                                self._bztchTaps[uid] = [];
                            }
                            self._bztchTaps[uid].push(tap);
                        } else {
                            uid = _.uniqueId(self._bztchTapPrefix + '-');
                            self._bztchTaps[uid] = [tap];
                            // enable to tap
                            $elm.addClass(self._bztchTapPrefix);
                            $elm.attr('data-' + self._bztchTapPrefix + 'Uid', uid);
                        }

                        if (tap.holdDuration) {
                            $elm.css({
                                '-webkit-touch-callout': 'none'
                            });
                        }

                        return self;

                    },

                    /**
                     * longTap
                     *
                     * @param {Element} $elm
                     * @param {Function} callback
                     * @param {beez.View} context
                     * @param {Object} options
                     */
                    longTap: function longTap($elm, callback, context, options) {
                        return this.tap($elm, null, context, {
                            tapHold: callback,
                            holdDuration: options.holdDuration || 1000
                        });
                    },

                    /**
                     * tapOnce
                     *
                     * @param {Element} $elm
                     * @param {Function} callback
                     * @param {beez.View} context
                     * @param {Object} options
                     */
                    tapOnce: function tapOnce($elm, callback, context, options) {
                        options = _.extend(options || {}, {
                            once: true
                        });
                        return this.tap($elm, callback, context, options);
                    },

                    /**
                     * touchstart start
                     * @param {Object} e
                     */
                    onBztchTapStart: function onBztchTapStart(e) {
                        var self = this,
                            target = $(e.currentTarget),
                            uid,
                            taps;

                        uid = self._bztchGetId(target);

                        if (!uid || !self._bztchHasTap(uid)) {
                            return;
                        }

                        taps = self._bztchTaps[uid];

                        var position = normalizePosition(e);
                        self._bztchStartPosition = {
                            x: position.pageX,
                            y: position.pageY
                        };

                        // check lock
                        if (!target.hasClass(self._bztchDisableClassName)) {
                            self._bztchIsTappable = true;
                            target.addClass(self._bztchHoverClassName);

                            // execute callback!!
                            _.each(taps, function (tap) {
                                if (tap.holdDuration) {
                                    tap.timerId && self._bztchTimer.clearTimeout(tap.timerId);
                                    tap.timerId = self._bztchTimer.addTimeout(function () {
                                        if (!self._bztchIsTappable) {
                                            self._bztchCancel(e);
                                            return;
                                        }
                                        tap.callbackHold.call(tap.context, e);
                                        self._bztchCancel(e);
                                    }, tap.holdDuration);
                                }
                                tap.callbackStart.call(tap.context, e);
                            });
                        }

                    },

                    /**
                     * touch move
                     * @param {Object} e
                     */
                    onBztchTapMove: function onBztchTapMove(e) {
                        var self = this,
                            target = $(e.currentTarget),
                            uid,
                            taps;

                        if (!self._bztchIsTappable) {
                            self._bztchCancel(e);
                            return;
                        }

                        uid = self._bztchGetId(target);

                        if (!uid || !self._bztchHasTap(uid)) {
                            return;
                        }

                        taps = self._bztchTaps[uid];

                        var position = normalizePosition(e);
                        // execute callback
                        _.each(taps, function (tap) {
                            tap.callbackMove.call(tap.context, e);
                        });

                        // threshold
                        if (
                            Math.abs(position.pageX - self._bztchStartPosition.x) > self._bztchThreshold ||
                            Math.abs(position.pageY - self._bztchStartPosition.y) > self._bztchThreshold
                        ) {
                            self._bztchCancel(e);
                            self._bztchIsTappable = false;
                            target.removeClass(self._bztchHoverClassName);
                        }
                    },

                    /**
                     * touch end
                     * @param {Object} e
                     */
                    onBztchTapEnd: function onBztchTapEnd(e) {
                        var self = this,
                            target = $(e.currentTarget),
                            uid,
                            taps;

                        e.preventDefault();
                        if (!self._bztchIsTappable) {
                            this._bztchCancel(e);
                            return;
                        }
                        self._bztchIsTappable = false;

                        uid = self._bztchGetId(target);
                        if (!uid || !self._bztchHasTap(uid)) {
                            return;
                        }

                        taps = self._bztchTaps[uid];

                        if (!target.hasClass(self._bztchDisableClassName)) {
                            _.each(taps, function (tap, i) {
                                tap.callbackEnd.call(tap.context, e);
                                tap.callback.call(tap.context, e);
                            });
                        }

                        _.each(taps, function (tap, i) {
                            if (tap.once) {
                                self._disposeTap(uid, i);
                            }
                        });

                        // reset
                        target.removeClass(self._bztchHoverClassName);
                        self._bztchCancel(e);
                    },

                    /**
                     * cancel
                     */
                    _bztchCancel: function _bztchCancel(e) {
                        this._bztchTimer.stop();
                        this._bztchIsTappable = false;
                        $(e.currentTarget).removeClass(this._bztchHoverClassName);
                    },

                    /**
                     * get tap event data
                     */
                    _bztchGetId: function _bztchGetId(target) {
                        return target.attr('data-' + this._bztchTapPrefix + 'Uid');
                    },

                    /**
                     * has tap data
                     */
                    _bztchHasTap: function _bztchHasTap(id) {
                        return _.has((this._bztchTaps ? this._bztchTaps : {}), id);
                    },

                    enable: function enable($el) {
                        if ($el) {
                            $el.removeClass(this._bztchDisableClassName);
                        } else {
                            _.each(this._bztchTaps, function (taps) {
                                _.each(taps, function (tap) {
                                    if (tap.$elm) {
                                        tap.$elm.removeClass(this._bztchDisableClassName);
                                    }
                                }, this);
                            }, this);
                        }
                    },

                    disable: function disable($el) {
                        if ($el) {
                            $el.addClass(this._bztchDisableClassName);
                        } else {
                            _.each(this._bztchTaps, function (taps) {
                                _.each(taps, function (tap) {
                                    if (tap.$elm) {
                                        tap.$elm.addClass(this._bztchDisableClassName);
                                    }
                                }, this);
                            }, this);
                        }
                    },

                    _disposeTap: function _disposeTap(id, index) {
                        if (!this._bztchTaps || !this._bztchTaps[id] || !this._bztchTaps[id][index]) {
                            return;
                        }
                        delete this._bztchTaps[id][index].callback;
                        delete this._bztchTaps[id][index].callbackStart;
                        delete this._bztchTaps[id][index].callbackMove;
                        delete this._bztchTaps[id][index].callbackHold;
                        delete this._bztchTaps[id][index].context;
                        delete this._bztchTaps[id][index].$elm;
                        delete this._bztchTaps[id][index];

                        this._bztchTaps[id].splice(index, 1);

                    },

                    /**
                     * dispose
                     */
                    dispose: function dispose() {

                        _.each(this._bztchTaps, function (taps, id) {
                            _.each(taps, function (tap, i) {
                                this._disposeTap(id, i);
                            }, this);
                            delete this._bztchTaps[id];
                        }, this);

                        delete this._bztchTaps;
                        delete this._bztchIsTappable;
                        delete this._bztchIsTapMouseDown;
                        delete this._bztchPrefix;
                        delete this._bztchTapPrefix;
                        delete this._bztchHoverClassName;
                        delete this._bztchStartPosition;

                        // super
                        TouchView.__super__.dispose.apply(this, arguments);
                    }
                };

                return Inheritance;

            })(this);

            /**
             * Touch View class
             *
             * @class
             * @extends beez.View
             */
            var TouchView = beez.View.extend(
                'beez.Touch',
                Inheritance.prototype
            );

            beez.touch = {
                View: TouchView,
                __inheritance__: Inheritance
            };

            return beez.touch;
        });
    })(this);
}
