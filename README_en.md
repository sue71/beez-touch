# beez-touch
====

**日本語ドキュメントは[こちら](https://github.com/masakisueda/beez-touch/blob/master/README.md)**

---

## About

**beez-touch** is the plugin library for [CyberAgent/beez](https://github.com/CyberAgent/beez). This library assignes tap function for mobile web browser.
It's able to assign tap function to specific DOM element simply using `View` extended by beez-touch.

## Features

- Assign tap function.
- Add prefix to member variables & options cause of avoid to contaminate with inheriting member variables & methods. Because this library is premised using **beez**.
- Use `Mouse` event instead of `Touch` event automatically if web browser doesn't have.

```javascript
var $btn = $('#button');
this.tap($btn, function onTap(e) {
  console.log('button tapped!');
}, this);
```

## Usage

Create new `View` which is extended by beez-touch provides.

```javascript
var EntityView = beez.touch.View.extend(
  'beez.touch',
  {
    vidx: 'touch-view',

    render: function () {
      EntityView.__super__.render.apply(this, arguments);

      this.getParent().$el.append(this.$el);
    },

    after: function () {
      EntityView.__super__.after.apply(this, arguments);

      // 要素を取得してtap機能を付与
      var $btn = $('#btn', this.$el);
      this.tap($btn, function (e) {
        console.log('button tapped!');
      }, this);
    }
  }
);

// optionを渡してインスタンスを生成
beez.manager.v.create(EntityView, {
  bztch: {
    hoverClassName: 'hover',
    preventDefault: false,
    threshold: 10
  }
});

```

## Requirements
- [beez](https://github.com/CyberAgent/beez)

## Options

You can customize by passing options when beez-touch creates instance.

### bztch.hoverClassName {String}

Set `className` on hover.

### bztch.preventDefault {Boolean}

Prevent default event's behavior.

### bztch.threshold {Number}

The amount of movement to fire `Tap Cancel` event.

## Method

### tap($element, callback, context, options)

```javascript
tap($elm, function () {
  // do something
}, this, {
  tapStart: function () {
    // do something
  },
  tapMove: function () {
    // do something
  },
  tapEnd: function () {
    // do something
  }
});
```

#### $elment {Elements}
- The Element that is taped target. (This element should be `jQuery` object)

#### callback {Function}
- The Callback function that is run when tap.

#### context {Object}
- The execution context that is psssed to callback function.

#### options.tapStart {Object}
- Set object for `touchstart` event.

#### options.tapMove {Object}
- Set object for `touchmove` event.

#### options.tapEnd {Object}
- Set object for `touchend` event.


## Restriction

The element to be taped should be located under `$el`, because only `root`'s `$el` in single `View` can catch `tap` event.

## Test

```sh
$ npm install -g grunt-cli
$ npm install .
$ bower install
$ npm install -g beez-foundation
$ beez-foundation -s

## Mode: [Stand-alone]

##
## Start
##              Beez Foundation Servers!!
##
##
##      Mock Server [ off ]
##
##      Express server listening on port:1109
##              Static Server start [ success ]
##              compress: [on]
##              Please try to access.
##                      http://0.0.0.0:1109
##
```

**open browser [Test page. http://0.0.0.0:1109/m/beez-touch/spec/all.html](http://0.0.0.0:1109/m/beez-touch/spec/all.html)**

![Test Page](https://raw.github.com/masakisueda/beez-touch/master/screenshots/spec.png?token=381941__eyJzY29wZSI6IlJhd0Jsb2I6c2hpYnVjYWZlL2JlZXotdG91Y2gvbWFzdGVyL3NjcmVlbnNob3RzL3NwZWMucG5nIiwiZXhwaXJlcyI6MTM5NDAwMDkwNX0%3D--3efcaa2bb3d57302dc3ad328cabbf5a87fd97bef)

## Build

```
$ npm install -g grunt-cli
$ npm install .
$ bower install
grunt
```

## LICENSE

@see : [LICENSE](https://github.com/masakisueda/beez-touch/blob/master/LICENSE)
