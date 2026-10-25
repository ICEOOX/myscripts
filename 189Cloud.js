// ==UserScript==
// @name         天翼网盘·隐藏系统文件夹 + 去左下广告（方框常驻提示）
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  隐藏天翼网盘6个系统文件夹，屏蔽左下角广告，右下角方框透明提示
// @author       You
// @match        *://cloud.189.cn/*
// @match        *://*.cloud.189.cn/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    var FOLDERS_TO_HIDE = [
        '同步盘',
        '我的图片',
        '我的音乐',
        '我的视频',
        '我的文档',
        '我的应用'
    ];

    // ========== 1. 隐藏系统文件夹 ==========
    function buildSelectorList() {
        var list = [];
        for (var i = 0; i < FOLDERS_TO_HIDE.length; i++) {
            list.push('li.c-file-item:has(span[title="' + FOLDERS_TO_HIDE[i] + '"])');
        }
        return list;
    }

    function applyCSS() {
        var selectors = buildSelectorList();
        if (selectors.length === 0) return;
        var css = selectors.join(', ') + ' { display: none !important; }';
        if (typeof GM_addStyle === 'function') {
            GM_addStyle(css);
        } else {
            var style = document.createElement('style');
            style.id = 'tm-hide-folders-style';
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    // ========== 2. 屏蔽左下角广告 ==========
    function hideAd() {
        // 用 CSS 规则隐藏广告盒（enterprise-guide-ad-box），并兜底隐藏包含 ad-picture 的父级
        var adCss = [
            '.enterprise-guide-ad-box { display: none !important; }',
            '.space-info .enterprise-guide-ad-box { display: none !important; }'
        ].join('\n');

        if (typeof GM_addStyle === 'function') {
            GM_addStyle(adCss);
        } else {
            var style = document.createElement('style');
            style.id = 'tm-hide-ad-style';
            style.textContent = adCss;
            document.head.appendChild(style);
        }

        // JS 兜底：动态出现或 class 变化时也能隐藏
        function removeAdNodes() {
            var adBoxes = document.querySelectorAll('.enterprise-guide-ad-box');
            for (var i = 0; i < adBoxes.length; i++) {
                adBoxes[i].style.display = 'none';
                adBoxes[i].setAttribute('data-tm-ad-hidden', 'true');
            }
            // 兜底：包含 .ad-picture 的容器
            var adImgs = document.querySelectorAll('img.ad-picture');
            for (var j = 0; j < adImgs.length; j++) {
                var p = adImgs[j].closest('.enterprise-guide-ad-box');
                if (p) {
                    p.style.display = 'none';
                    p.setAttribute('data-tm-ad-hidden', 'true');
                }
            }
        }

        if (document.body) {
            removeAdNodes();
            var adObserver = new MutationObserver(function() {
                removeAdNodes();
            });
            adObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            window.addEventListener('DOMContentLoaded', function() {
                removeAdNodes();
                var adObserver = new MutationObserver(function() {
                    removeAdNodes();
                });
                adObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }

    // ========== 3. 系统文件夹 JS 降级隐藏 ==========
    function supportsHas() {
        try {
            return CSS.supports('selector(:has(*))');
        } catch (e) {
            return false;
        }
    }

    function hideByJs() {
        var items = document.querySelectorAll('li.c-file-item');
        for (var i = 0; i < items.length; i++) {
            var li = items[i];
            if (li.getAttribute('data-tm-hidden') === 'true') continue;
            var span = li.querySelector('.file-item-name-fileName-span');
            if (!span) continue;
            var title = span.getAttribute('title') || span.textContent.trim();
            if (FOLDERS_TO_HIDE.indexOf(title) !== -1) {
                li.style.display = 'none';
                li.setAttribute('data-tm-hidden', 'true');
            }
        }
    }

    function fallbackHide() {
        if (supportsHas()) return;
        hideByJs();
    }

    function startObserver() {
        if (supportsHas()) return;
        var observer = new MutationObserver(function() {
            hideByJs();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ========== 4. 右下角方框透明提示 ==========
    function showToast() {
        if (document.getElementById('tm-block-toast')) return;

        var toast = document.createElement('div');
        toast.id = 'tm-block-toast';
        toast.textContent = '已经屏蔽自带文件夹';

        toast.style.position = 'fixed';
        toast.style.right = '24px';
        toast.style.bottom = '24px';
        toast.style.zIndex = '999999';
        toast.style.background = 'transparent';
        toast.style.color = '#ffffff';
        toast.style.padding = '10px 18px';
        toast.style.borderRadius = '6px';
        toast.style.border = '1px solid rgba(255,255,255,0.6)';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '500';
        toast.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        toast.style.textShadow = '0 1px 4px rgba(0,0,0,0.8)';
        toast.style.letterSpacing = '0.02em';
        toast.style.pointerEvents = 'none';
        toast.style.userSelect = 'none';

        document.body.appendChild(toast);
    }

    // ========== 5. 初始化 ==========
    function boot() {
        fallbackHide();
        startObserver();
        hideAd();
        setTimeout(showToast, 800);
    }

    function init() {
        applyCSS();
        if (document.body) {
            boot();
        } else {
            window.addEventListener('DOMContentLoaded', boot);
        }
    }

    init();
})();
