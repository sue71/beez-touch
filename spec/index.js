define(['index', 'beez'], function(index, beez){

    beez.manager.setup();
    beez.manager.view.root(beez.View.extend(
        'spec.rootView',
        {
            vidx: '@'
        }
    ));

    var EntityView = index.View.extend(
        'spec.index.EntityView',
        {
            vidx: 'entity',

            className: 'entity',

            initialize: function () {
                EntityView.__super__.initialize.apply(this, arguments);

                /**
                 * basic box element
                 * @private
                 * @type {Element}
                 */
                this._$boxBasic = null;

                /**
                 * locked box element
                 * @private
                 * @type {Element}
                 */
                this._$boxLocked = null;

                /**
                 * hitarea element
                 * @private
                 * @type {Element}
                 */
                this._$hitarea = null;
            },

            render: function () {
                EntityView.__super__.render.apply(this, arguments);

                // create element
                this._$boxBasic = $('<div></div>');
                this._$boxBasic.addClass('box');
                this._$boxLocked = $('<div></div>');
                this._$boxLocked.addClass('box');
                this._$boxLocked.addClass('locked');
                this._$hitarea = $('<div></div>');
                this._$hitarea.addClass('box');
                this._$holdarea = $('<div class = "box"><div class = "blocker"></div><div class = "image"></div></div>');

                // append
                this.$el.append(this._$boxBasic);
                this.$el.append(this._$boxLocked);
                this.$el.append(this._$hitarea);
                this.$el.append(this._$holdarea);
                $('#w').append(this.$el);
            },

            after: function () {
                EntityView.__super__.after.apply(this, arguments);

                this.tap(this._$holdarea.find('.blocker'), null, this, {
                    tapEnd: function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    tapStart: function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    tapHold: function (e) {
                        console.log('long tap');
                        e.stopPropagation();
                        e.preventDefault();
                    },
                    holdDuration: 1000
                });

                // you can set callback functions
                this.tap(this._$hitarea, null, this, {
                    tapStart: function () {
                        this._$boxBasic.addClass('hover');
                    },
                    tapMove: function () {
                        this._$boxBasic.removeClass('hover');
                    },
                    tapEnd: function () {
                        this._$boxBasic.removeClass('hover');
                    }
                });

            },

            dispose: function () {
                // dispose
                delete this._$boxBasic;
                delete this._$boxLocked;
                delete this._$hitarea;

                // execute dispose function of super class
                EntityView.__super__.dispose.apply(this, arguments);
            }
        });

    var CustomEntityView = index.View.extend(
        'spec.index.CustomEntityView',
        {
            vidx: 'customEntity',

            initialize: function () {
                CustomEntityView.__super__.initialize.apply(this, arguments);

                /**
                 * basic box element
                 * @private
                 * @type {Element}
                 */
                this._$boxBasic = null;

                /**
                 * locked box element
                 * @private
                 * @type {Element}
                 */
                this._$boxLocked = null;
            },

            render: function () {
                CustomEntityView.__super__.render.apply(this, arguments);

                // create element
                this._$boxBasic = $('<div></div>');
                this._$boxBasic.addClass('box');
                this._$boxLocked = $('<div></div>');
                this._$boxLocked.addClass('box');
                this._$boxLocked.addClass('customLocked');

                // append
                this.$el.append(this._$boxBasic);
                this.$el.append(this._$boxLocked);
                $('#w').append(this.$el);
            },

            after: function () {
                CustomEntityView.__super__.after.apply(this, arguments);

                // basic usage
                this.tap(this._$boxBasic, function (e) {
                    alert('tapped!');
                }, this);

                // if locked
                this.tap(this._$boxLocked, function (e) {
                    alert('this message should not be alerted!');
                }, this);
            },

            dispose: function () {
                // dispose
                delete this._$boxBasic;
                delete this._$boxLocked;

                // execute dispose function of super class
                CustomEntityView.__super__.dispose.apply(this, arguments);
            }
        });

    var MultiEntityView = index.View.extend(
        'spec.index.MultiEntityView',
        {
            vidx: 'multiEntity',

            initialize: function () {
                MultiEntityView.__super__.initialize.apply(this, arguments);

                /**
                 * basic box elements
                 * @private
                 * @type {Array}
                 */
                this._$boxes = null;
            },

            render: function () {
                MultiEntityView.__super__.render.apply(this, arguments);

                // create element
                var str = '';
                _.times(3, function (i) {
                    str += '<div class="box"></div>';
                });
                var $boxes = $(str);

                // append
                this.$el.append($boxes);
                $('#w').append(this.$el);
            },

            after: function () {
                MultiEntityView.__super__.after.apply(this, arguments);

                // get boxes
                this._$boxes = $('.box', this.$el);

                // basic usage
                this.tap(this._$boxes, function (e) {
                    alert('tapped!');
                }, this);
            },

            dispose: function () {
                // dispose
                delete this._$boxes;

                // execute dispose function of super class
                MultiEntityView.__super__.dispose.apply(this, arguments);
            }
        });

    var RemoveEntityView = index.View.extend(
        'spec.index.RemoveEntityView',
        {
            vidx: 'removeEntity',

            initialize: function () {
                RemoveEntityView.__super__.initialize.apply(this, arguments);

                /**
                 * basic box element
                 * @private
                 * @type {Element}
                 */
                this._$boxBasic = null;
            },

            render: function () {
                RemoveEntityView.__super__.render.apply(this, arguments);

                // create element
                this._$boxBasic = $('<div></div>');
                this._$boxBasic.addClass('box');

                // append
                this.$el.append(this._$boxBasic);
                $('#w').append(this.$el);
            },

            after: function () {
                RemoveEntityView.__super__.after.apply(this, arguments);

                // basic usage
                this.tap(this._$boxBasic, function (e) {
                    alert('tapped!');
                }, this);
            },

            dispose: function () {
                // dispose
                delete this._$boxBasic;

                // execute dispose function of super class
                RemoveEntityView.__super__.dispose.apply(this, arguments);
            }
        });

    return function () {
        describe('beez.touch.index', function(){
            it('refs', function() {
                expect(index.VERSION).eq.ok;
            });

            it('TouchView create', function () {
                var entiryView = beez.manager.view.create('/@', EntityView);
                expect(entiryView.vidx).eq("entity").be.ok;

                var customEntiryView = beez.manager.view.create('/@', CustomEntityView, {
                    bztch : {
                        prefix : 'cstm',
                        hoverClassName : 'customHover',
                        lockedClassName : 'customLocked'
                    }
                });
                expect(customEntiryView.vidx).eq("customEntity").be.ok;

                var multiEntityView = beez.manager.view.create('/@', MultiEntityView);
                expect(multiEntityView.vidx).eq("multiEntity").be.ok;

                var removeEntiryView = beez.manager.view.create('/@', RemoveEntityView);
                expect(removeEntiryView.vidx).eq("removeEntity").be.ok;
            });

            it('TouchView show', function (done) {
                beez.manager.view.get('/@/entity').async().show().then(function (entityView) {
                    done();
                }).end();
            });

            it('TouchView show', function (done) {
                beez.manager.view.get('/@/customEntity').async().show().then(function (customEntityView) {
                    done();
                }).end();
            });

            it('TouchView show', function (done) {
                beez.manager.view.get('/@/multiEntity').async().show().then(function (multiEntityView) {
                    done();
                }).end();
            });

            it('TouchView show', function (done) {
                beez.manager.view.get('/@/removeEntity').async().show().then(function (removeEntityView) {
                    done();
                }).end();
            });

            it('TouchView remove', function () {
                var removeEntityView = beez.manager.view.get('/@/removeEntity');
                beez.manager.view.remove('/@/removeEntity');
                expect(beez.manager.view.get('/@/removeEntity')).to.not.be.ok;
                expect(removeEntityView._bztchTaps).to.not.be.ok;
                expect(removeEntityView._bztchIsTappable).to.not.be.ok;
                expect(removeEntityView._bztchIsTapMouseDown).to.not.be.ok;
                expect(removeEntityView._bztchPrefix).to.not.be.ok;
                expect(removeEntityView._bztchTapPrefix).to.not.be.ok;
                expect(removeEntityView._bztchTapHoverClassName).to.not.be.ok;
                expect(removeEntityView._bztchTapLockedClassName).to.not.be.ok;
            });
        });
    };
});
