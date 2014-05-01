beez-touch
====

**English document is [here](https://github.com/masakisueda/beez-touch/blob/master/README_en.md)**

---

## About
beez-touchは[CyberAgent/beez](https://github.com/CyberAgent/beez)のプラグインライブラリです。Viewにモバイルブラウザ用にtap機能を付加するライブラリです。
beez-touchによって拡張されたViewを使用することで、以下の様に簡単にDOM要素に対してtapイベントを付与することができます。

## Features

- beez.Viewにtap機能を付加します。
- beezを使った継承を前提にしているため、継承先のメンバ、メソッドを汚染しないように関数名、メンバ変数、オプションにプレフィックスを付加しています。
- PCブラウザ等Touch系のイベントが存在しない場合、代わりにMouse系イベントを利用して擬似的なTouch系イベントを作成します。

```javascript
var $btn = $('#button');
this.tap($btn, function onTap(e) {
  console.log('button tapped!');
}, this);
```

## Usage

beez-touchが提供するViewを継承して新しくViewを作成します。

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
インスタンスを作る際にoptionを渡すことでカスタマイズすることができます

### bztch.hoverClassName {String}
hover時に付与する`className`

### bztch.preventDefault {Boolean}
デフォルトの挙動を停止するか

### bztch.threshold {Number}
タップキャンセルを発火する移動量

### bztch.holdDuration {Number}
タップホールドを発火する時間(ms)

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
- tap対象となる要素(jQueryオブジェクトであること)

#### callback {Function}
- tap時に実行されるコールバック関数

#### context {Object}
- コールバック関数に渡す実行コンテキスト

#### options.tapStart {Object}
- touchstartに対するイベントを設定します

#### options.tapMove {Object}
- touchmoveに対するイベントを設定します

#### options.tapEnd {Object}
- touchendに対するイベントを設定します

#### options.tapHold {Object}
- 一定時間タッチを続けた時に発火するイベントに対するコールバックを指定します

## Restriction
tapイベントは単Viewのrootに該当する$elでキャッチされるため、tap対象となる要素は必ず$el配下に配置されている必要があります。

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

![Test Page](https://raw.github.com/masakisueda/beez-touch/master/screenshots/spec.png)

## Build

```
$ npm install -g grunt-cli
$ npm install .
$ bower install
grunt
```

## LICENSE

@see : [LICENSE](https://github.com/masakisueda/beez-touch/blob/master/LICENSE)
