/* ═══════════════════════════════════════════════════════════════
   开屏动画逻辑 · 时空银庭版
   流程：
   1. 「嗨」浮现 → 点击
   2. 「你好呀，我叫楚汐言」浮现 → 点击
   3. 「欢迎来到我的世界」浮现 → 点击
   4. 银白蝴蝶飞过 + 绒毛飘落 → 自动过渡
   5. 「是否进入」按钮 → 点击
   6. 宣纸展开 → 进入世界观页面
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 银白梦蝶 SVG（参考图风格）──────────────────────────────
  // 半透明翅膀、粉紫到银白渐变、边缘深色斑纹、星星点缀、发光感
  function createButterflySVG() {
    var uid = 'bf' + Math.random().toString(36).substr(2, 6);
    return '<svg class="butterfly" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">'
      + '  <defs>'
      + '    <radialGradient id="' + uid + '-wingL" cx="75%" cy="35%" r="85%">'
      + '      <stop offset="0%"  stop-color="#f8e8ff" stop-opacity="0.95"/>'
      + '      <stop offset="25%" stop-color="#e8d0f8" stop-opacity="0.85"/>'
      + '      <stop offset="55%" stop-color="#c8a8e0" stop-opacity="0.75"/>'
      + '      <stop offset="82%" stop-color="#8f6fb8" stop-opacity="0.55"/>'
      + '      <stop offset="100%" stop-color="#5a4480" stop-opacity="0.35"/>'
      + '    </radialGradient>'
      + '    <radialGradient id="' + uid + '-wingR" cx="25%" cy="35%" r="85%">'
      + '      <stop offset="0%"  stop-color="#f8e8ff" stop-opacity="0.95"/>'
      + '      <stop offset="25%" stop-color="#e8d0f8" stop-opacity="0.85"/>'
      + '      <stop offset="55%" stop-color="#c8a8e0" stop-opacity="0.75"/>'
      + '      <stop offset="82%" stop-color="#8f6fb8" stop-opacity="0.55"/>'
      + '      <stop offset="100%" stop-color="#5a4480" stop-opacity="0.35"/>'
      + '    </radialGradient>'
      + '    <radialGradient id="' + uid + '-glow" cx="50%" cy="50%" r="50%">'
      + '      <stop offset="0%"  stop-color="#ffffff" stop-opacity="0.45"/>'
      + '      <stop offset="40%" stop-color="#d8b8ff" stop-opacity="0.22"/>'
      + '      <stop offset="100%" stop-color="#8f6fb8" stop-opacity="0"/>'
      + '    </radialGradient>'
      + '    <filter id="' + uid + '-soft">'
      + '      <feGaussianBlur in="SourceGraphic" stdDeviation="0.8"/>'
      + '    </filter>'
      + '  </defs>'
      // 左翼
      + '  <g class="butterfly-wing-left">'
      // 上翅
      + '    <path d="M80 58 C58 28 28 14 14 24 C4 32 2 50 10 66 C18 80 36 84 52 78 C66 72 78 64 80 58 Z" fill="url(#' + uid + '-wingL)"/>'
      // 下翅
      + '    <path d="M80 58 C72 68 62 80 56 92 C52 102 58 108 68 106 C78 104 84 94 86 82 C88 72 84 62 80 58 Z" fill="url(#' + uid + '-wingL)" opacity="0.9"/>'
      // 边缘深色斑纹
      + '    <path d="M80 58 C58 28 28 14 14 24 C4 32 2 50 10 66 C18 80 36 84 52 78 C66 72 78 64 80 58 Z" fill="none" stroke="#4a3868" stroke-width="1.2" opacity="0.28"/>'
      + '    <path d="M80 58 C72 68 62 80 56 92 C52 102 58 108 68 106 C78 104 84 94 86 82 C88 72 84 62 80 58 Z" fill="none" stroke="#4a3868" stroke-width="1" opacity="0.25"/>'
      // 翅脉
      + '    <path d="M80 58 C62 48 42 42 22 40" fill="none" stroke="#7a62a0" stroke-width="0.6" opacity="0.35"/>'
      + '    <path d="M80 58 C66 62 54 72 60 96" fill="none" stroke="#7a62a0" stroke-width="0.5" opacity="0.3"/>'
      // 光斑/星点
      + '    <circle cx="32" cy="36" r="2.2" fill="#fff" opacity="0.55"/>'
      + '    <circle cx="46" cy="58" r="1.5" fill="#fff" opacity="0.45"/>'
      + '    <circle cx="24" cy="56" r="1.2" fill="#d8b8ff" opacity="0.5"/>'
      + '    <circle cx="68" cy="88" r="1.6" fill="#fff" opacity="0.4"/>'
      + '    <ellipse cx="48" cy="48" rx="14" ry="18" fill="url(#' + uid + '-glow)"/>'
      + '  </g>'
      // 右翼
      + '  <g class="butterfly-wing-right">'
      + '    <path d="M80 58 C102 28 132 14 146 24 C156 32 158 50 150 66 C142 80 124 84 108 78 C94 72 82 64 80 58 Z" fill="url(#' + uid + '-wingR)"/>'
      + '    <path d="M80 58 C88 68 98 80 104 92 C108 102 102 108 92 106 C82 104 76 94 74 82 C72 72 76 62 80 58 Z" fill="url(#' + uid + '-wingR)" opacity="0.9"/>'
      + '    <path d="M80 58 C102 28 132 14 146 24 C156 32 158 50 150 66 C142 80 124 84 108 78 C94 72 82 64 80 58 Z" fill="none" stroke="#4a3868" stroke-width="1.2" opacity="0.28"/>'
      + '    <path d="M80 58 C88 68 98 80 104 92 C108 102 102 108 92 106 C82 104 76 94 74 82 C72 72 76 62 80 58 Z" fill="none" stroke="#4a3868" stroke-width="1" opacity="0.25"/>'
      + '    <path d="M80 58 C98 48 118 42 138 40" fill="none" stroke="#7a62a0" stroke-width="0.6" opacity="0.35"/>'
      + '    <path d="M80 58 C94 62 106 72 100 96" fill="none" stroke="#7a62a0" stroke-width="0.5" opacity="0.3"/>'
      + '    <circle cx="128" cy="36" r="2.2" fill="#fff" opacity="0.55"/>'
      + '    <circle cx="114" cy="58" r="1.5" fill="#fff" opacity="0.45"/>'
      + '    <circle cx="136" cy="56" r="1.2" fill="#d8b8ff" opacity="0.5"/>'
      + '    <circle cx="92" cy="88" r="1.6" fill="#fff" opacity="0.4"/>'
      + '    <ellipse cx="112" cy="48" rx="14" ry="18" fill="url(#' + uid + '-glow)"/>'
      + '  </g>'
      // 身体
      + '  <ellipse cx="80" cy="58" rx="3" ry="16" fill="#3a2858" opacity="0.8"/>'
      + '  <ellipse cx="80" cy="58" rx="1.5" ry="12" fill="#7a62a0" opacity="0.6"/>'
      // 触角
      + '  <path d="M79 44 C74 36 70 30 68 26" fill="none" stroke="#5a4480" stroke-width="1" stroke-linecap="round" opacity="0.8"/>'
      + '  <path d="M81 44 C86 36 90 30 92 26" fill="none" stroke="#5a4480" stroke-width="1" stroke-linecap="round" opacity="0.8"/>'
      + '  <circle cx="68" cy="26" r="1.5" fill="#d8b8ff" opacity="0.7"/>'
      + '  <circle cx="92" cy="26" r="1.5" fill="#d8b8ff" opacity="0.7"/>'
      + '</svg>';
  }

  // ── 绒毛 SVG（取代羽毛）───────────────────────────────────
  function createFluffSVG() {
    var uid = 'fl' + Math.random().toString(36).substr(2, 6);
    var colors = [
      ['#f0e6ff', '#d8c4f0', '#b8a0d8'],
      ['#ffe6f0', '#e8c4dc', '#c8a0c8'],
      ['#e8f0ff', '#c4d4f0', '#a0b8d8'],
    ];
    var c = colors[Math.floor(Math.random() * colors.length)];
    return '<svg class="fluff" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">'
      + '  <defs>'
      + '    <radialGradient id="' + uid + '-c" cx="50%" cy="55%" r="55%">'
      + '      <stop offset="0%"  stop-color="' + c[0] + '" stop-opacity="0.9"/>'
      + '      <stop offset="55%" stop-color="' + c[1] + '" stop-opacity="0.7"/>'
      + '      <stop offset="100%" stop-color="' + c[2] + '" stop-opacity="0.2"/>'
      + '    </radialGradient>'
      + '  </defs>'
      // 中心绒团
      + '  <ellipse cx="15" cy="22" rx="6" ry="7" fill="url(#' + uid + '-c)"/>'
      // 细丝
      + '  <path d="M15 22 Q10 14 8 8"  fill="none" stroke="' + c[0] + '" stroke-width="0.6" opacity="0.55" stroke-linecap="round"/>'
      + '  <path d="M15 22 Q12 14 11 7"  fill="none" stroke="' + c[0] + '" stroke-width="0.5" opacity="0.5" stroke-linecap="round"/>'
      + '  <path d="M15 22 Q18 14 20 7"  fill="none" stroke="' + c[0] + '" stroke-width="0.5" opacity="0.5" stroke-linecap="round"/>'
      + '  <path d="M15 22 Q22 16 25 10" fill="none" stroke="' + c[0] + '" stroke-width="0.6" opacity="0.55" stroke-linecap="round"/>'
      + '  <path d="M15 22 Q8 26 5 32"   fill="none" stroke="' + c[1] + '" stroke-width="0.5" opacity="0.45" stroke-linecap="round"/>'
      + '  <path d="M15 22 Q18 28 22 34" fill="none" stroke="' + c[1] + '" stroke-width="0.5" opacity="0.45" stroke-linecap="round"/>'
      + '  <path d="M15 22 Q14 30 13 37" fill="none" stroke="' + c[1] + '" stroke-width="0.4" opacity="0.4" stroke-linecap="round"/>'
      // 小星点
      + '  <circle cx="8" cy="8" r="0.8" fill="#fff" opacity="0.5"/>'
      + '  <circle cx="25" cy="10" r="0.6" fill="#fff" opacity="0.4"/>'
      + '  <circle cx="5" cy="32" r="0.5" fill="#fff" opacity="0.35"/>'
      + '</svg>';
  }


  // ── 阶段切换（使用 opacity + visibility，不用 display）─────
  function hideAllStages() {
    var stages = document.querySelectorAll('.intro-stage');
    stages.forEach(function (s) {
      s.classList.add('hidden');
      s.classList.remove('fading-out');
    });
  }

  function showStage(id) {
    var stage = document.getElementById(id);
    if (!stage) return;

    stage.style.transition = 'none';
    stage.classList.remove('hidden', 'fading-out');
    void stage.offsetWidth;
    stage.style.transition = '';

    var animEls = stage.querySelectorAll('.intro-text-hi, .intro-text-name, .intro-text-welcome, .enter-button');
    animEls.forEach(function (el) {
      el.classList.remove('animate');
      void el.offsetWidth;
      el.classList.add('animate');
    });
  }

  function fadeOutCurrent(callback) {
    var stages = document.querySelectorAll('.intro-stage');
    var current = null;
    stages.forEach(function (s) {
      if (!s.classList.contains('hidden')) {
        current = s;
      }
    });

    if (!current) {
      if (callback) callback();
      return;
    }

    current.classList.add('fading-out');
    setTimeout(function () {
      current.classList.add('hidden');
      current.classList.remove('fading-out');
      if (callback) callback();
    }, 800);
  }


  // ── 跳过动画 ─────────────────────────────────────────────
  function skipIntro() {
    // 直接触发完成回调，跳转到世界观页面
    if (window.OCIntro && window.OCIntro.onComplete) {
      window.OCIntro.onComplete();
    }
  }


  // ── 启动开屏动画 ──────────────────────────────────────────
  function startIntro() {
    showStage('stage-hi');

    document.getElementById('stage-hi').addEventListener('click', function () {
      fadeOutCurrent(function () {
        showStage('stage-name');
      });
    });

    document.getElementById('stage-name').addEventListener('click', function () {
      fadeOutCurrent(function () {
        showStage('stage-welcome');
      });
    });

    document.getElementById('stage-welcome').addEventListener('click', function () {
      fadeOutCurrent(function () {
        showStage('stage-butterfly');
        playButterflyScene();
      });
    });

    document.getElementById('btn-enter').addEventListener('click', function () {
      playScrollUnfold();
    });
  }


  // ── 蝴蝶飞过 + 绒毛飘落 ──────────────────────────────────
  function playButterflyScene() {
    var container = document.getElementById('butterfly-container');
    var fluffContainer = document.getElementById('feather-container');

    container.innerHTML = createButterflySVG();

    // 绒毛：生成间隔拉长，下落速度显著放慢（比之前慢约 5 倍）
    var fluffTimer = setInterval(function () {
      var temp = document.createElement('div');
      temp.innerHTML = createFluffSVG();
      var fluff = temp.firstChild;

      var leftPercent = 8 + Math.random() * 84;
      fluff.style.left = leftPercent + '%';
      fluff.style.top = (28 + Math.random() * 16) + '%';

      var scale = 0.5 + Math.random() * 0.8;
      var rotate = Math.random() * 360;
      var sway = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 40);
      var duration = 15 + Math.random() * 10; // 15-25 秒

      fluff.style.setProperty('--fluff-sway', sway + 'px');
      fluff.style.setProperty('--fluff-rotate', rotate + 'deg');
      fluff.style.animationDuration = duration + 's';
      fluff.style.transform = 'scale(' + scale + ') rotate(' + rotate + 'deg)';

      fluffContainer.appendChild(fluff);

      setTimeout(function () {
        if (fluff.parentNode) fluff.parentNode.removeChild(fluff);
      }, duration * 1000 + 500);
    }, 650);

    setTimeout(function () {
      clearInterval(fluffTimer);
      fluffContainer.innerHTML = '';

      fadeOutCurrent(function () {
        showStage('stage-enter');
      });
    }, 5000);
  }


  // ── 宣纸展开过渡 ──────────────────────────────────────────
  function playScrollUnfold() {
    var stageEnter = document.getElementById('stage-enter');
    var stageScroll = document.getElementById('stage-scroll');

    stageEnter.classList.add('fading-out');

    setTimeout(function () {
      stageEnter.classList.add('hidden');
      stageEnter.classList.remove('fading-out');

      showStage('stage-scroll');

      setTimeout(function () {
        stageScroll.classList.add('unfolding');
      }, 100);

      setTimeout(function () {
        stageScroll.classList.add('unfolded');
      }, 600);

      setTimeout(function () {
        if (window.OCIntro && window.OCIntro.onComplete) {
          window.OCIntro.onComplete();
        }
      }, 2000);
    }, 800);
  }


  // ── 暴露 API ─────────────────────────────────────────────
  window.OCIntro = {
    start: startIntro,
    skip: skipIntro,
    onComplete: null
  };

})();
