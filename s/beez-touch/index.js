/**
 * @name index.js<beez-touch/s>
 * @author Masaki Sueda <s.masaki07@gmail.com>
 * @overview Touch event plug-in for Beez (browser)
 * @license MIT
 */

var BEEZ_TOUCH_VERSION = '0.2.5';

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
                var position;

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
                e.pageX = position.pageX;
                e.pageY = position.pageY;

                return e;
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
                         * Flag of prevent default events
                         * @type {Boolean}
                         */
                        this._bztchPreventDefault = options.bztch.preventDefault || false;

                        /**
                         * Position of touchstart
                         * @type {Object}
                         */
                        this._bztchStartPosition = {};

                        /**
                         * Threshold of touch cancel
                         * @type {Number}
                         */
                        this._bztchThreshold = options.bztch.threshold || 10;

                        /**
                         * Hold duration
                         * @type {Number}
                         */
                        this._bztchHoldDuration = options.bztch.holdDuration || 1000;
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
                            uid;

                        options = _.defaults(options || {}, {
                            tapStart: beez.none,
                            tapMove: beez.none,
                            tapEnd: beez.none,
                            context: self
                        });

                        // multiple selector
                        if (beez.utils.isArray($elm) && $elm.length > 1) {
                            _.each($elm, function (list, i) {
                                self.tap($elm.eq(i), callback, context, options);
                            });
                            return;
                        }

                        // register events to tap
                        if (!self._bztchTaps) {
                            _.each(EVENT, function (evt) {
                                var eventName = evt.name + '.delegateEvents' + self.cid;
                                var callback = evt.callback;
                                if ($elm === self.$el) {
                                    self.$el.on(eventName, _.bind(self[callback], self) || beez.none);
                                } else {
                                    self.$el.on(eventName, '.' + self._bztchTapPrefix, _.bind(self[callback], self) || beez.none);
                                }
                            });
                            self._bztchTaps = {};
                        }

                        // unique id
                        uid = _.uniqueId(self._bztchTapPrefix + '-');

                        self._bztchTaps[uid] = {
                            callback : callback,
                            callbackStart : options.tapStart,
                            callbackMove : options.tapMove,
                            callbackEnd : options.tapEnd,
                            callbackHold: options.tapHold,
                            context : context
                        };

                        // enable to tap
                        $elm.addClass(this._bztchTapPrefix);
                        $elm.attr('data-' + this._bztchTapPrefix + 'Uid', uid);
                    },

                    /**
                     * touchstart start
                     * @param {Object} e
                     */
                    onBztchTapStart: function onBztchTapStart(e) {
                        var self = this,
                            target = $(e.currentTarget),
                            bztchId;


                        e = normalizePosition(e);
                        bztchId = self.bztchGetId(target);

                        if (self._bztchTaps[bztchId].callbackHold) {
                            setTimeout(function () {
                                self.onBztchTapHold.call(self, e);
                            }, self._bztchHoldDuration);
                        }

                        if (!bztchId || !self.bztchHasTap(bztchId)) {
                            return;
                        }

                        if (self._bztchPreventDefault) {
                            e.preventDefault();
                        }

                        self._bztchStartPosition = {
                            x: e.pageX,
                            y: e.pageY
                        };

                        // checklock
                        if (!target.hasClass(self._bztchDisableClassName)) {
                            // enable to tap
                            self._bztchIsTappable = true;
                            // execute
                            self._bztchTaps[bztchId].callbackStart.call(self._bztchTaps[bztchId].context, e);
                            // hover
                            target.addClass(self._bztchHoverClassName);
                        }

                    },

                    /**
                     * touch move
                     * @param {Object} e
                     */
                    onBztchTapMove: function onBztchTapMove(e) {
                        var target = $(e.currentTarget),
                            bztchId;

                        if (!this._bztchIsTappable) {
                            return;
                        }

                        e = normalizePosition(e);
                        bztchId = this.bztchGetId(target);

                        if (!bztchId || !this.bztchHasTap(bztchId)) {
                            return;
                        }

                        if (this._bztchPreventDefault) {
                            e.preventDefault();
                        }

                        // execute callback
                        this._bztchTaps[bztchId].callbackMove.call(this._bztchTaps[bztchId].context, e);

                        // threshold
                        if (
                            Math.abs(e.pageX - this._bztchStartPosition.x) > this._bztchThreshold ||
                            Math.abs(e.pageY - this._bztchStartPosition.y) > this._bztchThreshold
                        ) {
                            this._bztchIsTappable = false;
                            target.removeClass(this._bztchHoverClassName);
                        }
                    },

                    /**
                     * touch end
                     * @param {Object} e
                     */
                    onBztchTapEnd: function onBztchTapEnd(e) {
                        var target = $(e.currentTarget),
                            bztchId;

                        e = normalizePosition(e);
                        bztchId = this.bztchGetId(target);

                        if (!bztchId || !this.bztchHasTap(bztchId)) {
                            return;
                        }

                        if (this._bztchPreventDefault) {
                            e.preventDefault();
                        }

                        if (this._bztchIsTappable && !target.hasClass(this._bztchDisableClassName)) {
                            if (this._bztchTaps[bztchId].callback) {
                                this._bztchTaps[bztchId].callback.call(this._bztchTaps[bztchId].context, e);
                            }

                            if (!this._bztchTaps) {
                                return;
                            }

                            this._bztchTaps[bztchId].callbackEnd.call(this._bztchTaps[bztchId].context, e);
                        }

                        // reset
                        this._bztchIsTappable = false;
                        target.removeClass(this._bztchHoverClassName);
                    },

                    /**
                     * Tap Hold
                     * @param  {[type]} e [description]
                     * @return {[type]}   [description]
                     */
                    onBztchTapHold: function onBztchTapHold(e) {
                        var target = $(e.currentTarget),
                            bztchId;

                        e = normalizePosition(e);
                        bztchId = this.bztchGetId(target);

                        if (!bztchId || !this.bztchHasTap(bztchId)) {
                            return;
                        }
                        // execute
                        this._bztchTaps[bztchId].callbackHold.call(this._bztchTaps[bztchId].context, e);
                        this._bztchIsTappable = false;
                        target.removeClass(this._bztchHoverClassName);
                    },

                    /**
                     * get tap event data
                     */
                    bztchGetId: function bztchGetId(target) {
                        return target.attr('data-' + this._bztchTapPrefix + 'Uid');
                    },

                    /**
                     * has tap data
                     */
                    bztchHasTap: function bztchHasTap(id) {
                        return _.has((this._bztchTaps ? this._bztchTaps : {}), id);
                    },

                    /**
                     * dispose
                     */
                    dispose: function dispose() {

                        _.each(this._bztchTaps, function (value, key) {
                            delete this._bztchTaps[key].callback;
                            delete this._bztchTaps[key].callbackStart;
                            delete this._bztchTaps[key].callbackMove;
                            delete this._bztchTaps[key].context;
                            delete this._bztchTaps[key];
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
