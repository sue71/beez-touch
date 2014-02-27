/**
 * @name index.js<beez-touch/s>
 * @author Masaki Sueda <s.masaki07@gmail.com>
 * @overview Touch event plug-in for Beez (browser)
 * @license MIT
 */

var BEEZ_TOUCH_VERSION = '0.2.3';

if (typeof module !== 'undefined' && module.exports) { // node.js: main

    exports.VERSION = BEEZ_TOUCH_VERSION;

} else {

    (function (global) {

        define('beez.touch',['require','exports','module','beez'],function (require, exports, module) {

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
            var hasTouch = 'ontouchstart' in window;

            /**
             * normalize event
             * @param  {Events} e event object
             */
            var normalizeEvent = function normalizeEvent(e) {
                if (hasTouch) {
                    if (e.originalEvent) {
                        return e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                    } else {
                        return e.changedTouches[0];
                    }
                } else {
                    return e;
                }
            };

            /**
             * Touch View class
             *
             * @class
             * @extends beez.View
             */
            var TouchView = beez.View.extend(
                'beez.Touch',
                {
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
                         * Flag of enable to tapsu
                         * @type {Boolean}
                         */
                        this._bztchIsTappable = false;

                        /**
                         * Flag of mouse down
                         * @type {Boolean}
                         */
                        this._bztchIsTapMouseDown = false;

                        /**
                         * Base prefix
                         * @type {String}
                         */
                        this._bztchPrefix = (_.isString(options.bztch.prefix) ? options.bztch.prefix : 'bztch');

                        /**
                         * Prefix for tap
                         * @type {String}
                         */
                        this._bztchTapPrefix = this._bztchPrefix + '-tap';

                        /**
                         * ClassName of hover
                         * @type {String}
                         */
                        this._bztchTapHoverClassName = (typeof options.bztch.hoverClassName === 'string' ? options.bztch.hoverClassName : 'hover');

                        /**
                         * ClassName of disable elements
                         * @type {String}
                         */
                        this._bztchTapLockedClassName = (typeof options.bztch.lockedClassName === 'string' ? options.bztch.lockedClassName : 'locked');

                        /**
                         * Flag of prevent default events
                         * @type {Boolean}
                         */
                        this._bztchPreventDefault = options.preventDefault || false;

                        /**
                         * Position of touchstart
                         * @type {Object}
                         */
                        this._bztchStartPosition = {};

                        /**
                         * Threshold of touch cancel
                         * @type {Number}
                         */
                        this._bztchThreshold = options._bztchThreshold || 10;
                    },

                    /**
                     * Add tap events to the elements
                     * @param {Element} $elm
                     * @param {Function} callback
                     * @param {beez.View} context
                     * @param {Object} options
                     */
                    tap: function tap($elm, callback, context, options) {
                        var events,
                            key,
                            method,
                            match,
                            eventName,
                            selector,
                            uid;

                        // recursive
                        if (_.isArray($elm) && $elm.length > 1) {
                            _.each($elm, function (list, i) {
                                this.tap($elm.eq(i), callback, context, options);
                            }, this);
                            return;
                        }

                        // register events to tap
                        if (!this._bztchTaps) {

                            // events
                            events = {};
                            if (hasTouch) {
                                events['touchstart .' + this._bztchTapPrefix]  = 'onBztchTapStart';
                                events['touchmove .' + this._bztchTapPrefix]   = 'onBztchTapMove';
                                events['touchend .' + this._bztchTapPrefix]    = 'onBztchTapEnd';
                                events['touchcancel .' + this._bztchTapPrefix] = 'onBztchTapCancel';
                            } else {
                                events['mousedown .' + this._bztchTapPrefix]   = 'onBztchTapMouseDown';
                                events['mousemove .' + this._bztchTapPrefix]   = 'onBztchTapMouseMove';
                                events['mouseup .' + this._bztchTapPrefix]     = 'onBztchTapMouseUp';
                                events['mouseleave .' + this._bztchTapPrefix]  = 'onBztchMouseLeave';
                            }

                            for (key in events) {
                                method = this[events[key]];
                                match = key.match(/^(\S+)\s*(.*)$/);
                                eventName = match[1];
                                selector = match[2];
                                method = _.bind(method, this);
                                eventName += '.delegateEvents' + this.cid;

                                if ($elm === this.$el) {
                                    this.$el.on(eventName, method);
                                } else {
                                    this.$el.on(eventName, selector, method);
                                }
                            }

                            this._bztchTaps = {};

                        }

                        // unique id
                        uid = _.uniqueId(this._bztchTapPrefix + '-');

                        this._bztchTaps[uid] = {
                            callback : callback,
                            callbackStart : (options ? (_.isFunction(options.tapStart) ? options.tapStart : null) : null),
                            callbackMove : (options ? (_.isFunction(options.tapMove) ? options.tapMove : null) : null),
                            callbackEnd : (options ? (_.isFunction(options.tapEnd) ? options.tapEnd : null) : null),
                            callbackCancel : (options ? (_.isFunction(options.tapCancel) ? options.tapCancel : null) : null),
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
                        var target = $(e.currentTarget),
                            bztchId;

                        e = normalizeEvent(e);
                        bztchId = this.bztchGetId(target);

                        if (!bztchId) {
                            return;
                        }

                        if (this._bztchPreventDefault) {
                            e.preventDefault();
                        }

                        this._bztchStartPosition = {
                            x: e.pageX,
                            y: e.pageY
                        };

                        // checklock
                        if (!target.hasClass(this._bztchTapLockedClassName)) {
                            // enable to tap
                            this._bztchIsTappable = true;
                            // execute
                            if (this._bztchTaps[bztchId].callbackStart) {
                                this._bztchTaps[bztchId].callbackStart.call(this._bztchTaps[bztchId].context, e);
                            }
                            // hover
                            target.addClass(this._bztchTapHoverClassName);
                        }

                    },

                    /**
                     * touch move
                     * @param {Object} e
                     */
                    onBztchTapMove: function onBztchTapMove(e) {
                        var target = $(e.currentTarget),
                            bztchId;

                        e = normalizeEvent(e);
                        bztchId = this.bztchGetId(target);

                        if (!bztchId) {
                            return;
                        }

                        if (this._bztchPreventDefault) {
                            e.preventDefault();
                        }

                        // execute callback
                        if (this._bztchTaps[bztchId].callbackMove) {
                            this._bztchTaps[bztchId].callbackMove.call(this._bztchTaps[bztchId].context, e);
                        }

                        // threshold
                        if (
                            Math.abs(e.pageX - this._bztchStartPosition.x) > this._bztchThreshold ||
                            Math.abs(e.pageY - this._bztchStartPosition.y) > this._bztchThreshold
                        ) {
                            this._bztchIsTappable = false;
                            target.removeClass(this._bztchTapHoverClassName);
                        }
                    },

                    /**
                     * touch end
                     * @param {Object} e
                     */
                    onBztchTapEnd: function onBztchTapEnd(e) {
                        var target = $(e.currentTarget),
                            bztchId;

                        e = normalizeEvent(e);
                        bztchId = this.bztchGetId(target);

                        if (!bztchId) {
                            return;
                        }

                        if (this._bztchPreventDefault) {
                            e.preventDefault();
                        }

                        if (this._bztchIsTappable && !target.hasClass(this._bztchTapLockedClassName)) {
                            if (this._bztchTaps[bztchId].callback) {
                                this._bztchTaps[bztchId].callback.call(this._bztchTaps[bztchId].context, e);
                            }

                            if (!this._bztchTaps) {
                                return;
                            }

                            if (this._bztchTaps[bztchId].callbackEnd) {
                                this._bztchTaps[bztchId].callbackEnd.call(this._bztchTaps[bztchId].context, e);
                            }
                        }

                        // reset
                        this._bztchIsTappable = false;
                        target.removeClass(this._bztchTapHoverClassName);
                    },

                    /**
                     * Tap cancel
                     * @param {Object} e
                     */
                    onBztchTapCancel: function onBztchTapCancel(e) {
                        var target = $(e.currentTarget),
                            bztchId;

                        e = normalizeEvent(e);
                        bztchId = this.bztchGetId(target);

                        if (!bztchId) {
                            return;
                        }

                        // execute
                        if (this._bztchTaps[bztchId].callbackCancel) {
                            this._bztchTaps[bztchId].callbackCancel.call(this._bztchTaps[bztchId].context, e);
                        }

                        this._bztchIsTappable = false;
                        target.removeClass(this._bztchTapHoverClassName);
                    },

                    /**
                     * Mouse down
                     * @param {Object} e
                     */
                    onBztchTapMouseDown: function onBztchTapMouseDown(e) {

                        this._bztchIsTapMouseDown = true;

                        e.touches = [{}];
                        e.touches[0].clientX = arguments[0].clientX;
                        e.touches[0].clientY = arguments[0].clientY;

                        // ontouchstart
                        this.onBztchTapStart.apply(this, arguments);
                    },

                    /**
                     * Mouse move
                     * @param {Object} e
                     */
                    onBztchTapMouseMove: function onBztchTapMouseMove(e) {

                        if (!this._bztchIsTapMouseDown) {
                            return;
                        }

                        e.touches = [{}];
                        e.touches[0].clientX = e.clientX;
                        e.touches[0].clientY = e.clientY;

                        // ontouchmove
                        this.onBztchTapMove.apply(this, arguments);
                    },

                    /**
                     * Mouse up
                     * @param {Object} e
                     */
                    onBztchTapMouseUp: function onBztchTapMouseUp(e) {
                        // reset
                        this._bztchIsTapMouseDown = false;

                        e.touches = [{}];
                        e.touches[0].clientX = e.clientX;
                        e.touches[0].clientY = e.clientY;

                        // ontouchend
                        this.onBztchTapEnd.apply(this, arguments);
                    },

                    /**
                     * Mouse leave
                     * @param {Object} e
                     */
                    onBztchMouseLeave: function onBztchMouseLeave() {
                        // reset
                        this._bztchIsTapMouseDown = false;

                        // ontouchcancel
                        this.onBztchTapCancel.apply(this, arguments);
                    },

                    /**
                     * get tap event data
                     */
                    bztchGetId: function bztchGetId(target) {
                        return target.attr('data-' + this._bztchTapPrefix + 'Uid');
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
                        delete this._bztchTapHoverClassName;
                        delete this._bztchTapLockedClassName;
                        delete this._bztchStartPosition;

                        // super
                        TouchView.__super__.dispose.apply(this, arguments);
                    }
                }
            );

            beez.touch = {
                View: TouchView
            };

            return beez.touch;
        });
    })(this);
}
;
