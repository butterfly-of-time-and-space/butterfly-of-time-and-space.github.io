/* ═══════════════════════════════════════════════════════════════
   音乐播放器 · 楚汐言的世界
   悬浮蝶翼播放器 · 支持本地文件 & URL 添加
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 状态 ──────────────────────────────────────────────────────
  var playlist = [];        // [{ name, url, cover }]
  var currentIndex = -1;
  var isPlaying = false;
  var loopMode = 'list';    // 'list' | 'single' | 'shuffle'
  var audio = null;
  var panelOpen = false;

  var STORAGE_KEY = 'oc_music_playlist';
  var STORAGE_STATE = 'oc_music_state';

  // ── DOM 引用 ──────────────────────────────────────────────────
  var container, toggleBtn, panel, coverEl, trackNameEl, trackStatusEl,
    progressEl, progressFilled, currentTimeEl, durationEl,
    playPauseBtn, prevBtn, nextBtn, loopBtn, volumeSlider,
    playlistEl, addInput, addBtn, fileLabel, fileInput;

  // ── SVG 图标 ──────────────────────────────────────────────────
  var ICONS = {
    butterfly: '<svg viewBox="0 0 24 24"><path d="M12 5 C10 3 6 3 5 6 C4 9 6 12 9 12 C7 13 5 16 6 19 C7 21 10 20 12 17 C14 20 17 21 18 19 C19 16 17 13 15 12 C18 12 20 9 19 6 C18 3 14 3 12 5 Z"/><line x1="12" y1="5" x2="12" y2="17"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zM20 6l-8 6 8 6z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM4 6l8 6-8 6z"/></svg>',
    musicNote: '<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="9" y1="18" x2="9" y2="3" stroke="currentColor" stroke-width="2" fill="none"/><line x1="21" y1="16" x2="21" y2="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 5 L21 3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    close: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>',
    volume: '<svg viewBox="0 0 24 24" class="mp-volume-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    list: '\u{1F501}',
    single: '\u{1F502}',
    shuffle: '\u{1F500}'
  };

  // ── 初始化 ────────────────────────────────────────────────────
  function init() {
    createDOM();
    loadState();
    bindEvents();
    renderPlaylist();
    updateUI();
  }

  // ── 创建 DOM ──────────────────────────────────────────────────
  function createDOM() {
    container = document.createElement('div');
    container.id = 'music-player';
    container.innerHTML =
      '<button class="mp-toggle" id="mp-toggle" title="\u97F3\u4E50">' + ICONS.butterfly + '</button>' +
      '<div class="mp-panel" id="mp-panel">' +
        '<div class="mp-header">' +
          '<span class="mp-header-title">\u8046\u8A00\u4E50</span>' +
          '<div class="mp-header-actions">' +
            '<button class="mp-icon-btn mp-mode-btn" id="mp-loop" title="\u5FAA\u73AF\u6A21\u5F0F">' + ICONS.list + '</button>' +
            '<button class="mp-icon-btn" id="mp-close" title="\u6536\u8D77">' + ICONS.close + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="mp-now-playing">' +
          '<div class="mp-cover" id="mp-cover">' + ICONS.musicNote + '</div>' +
          '<div class="mp-track-info">' +
            '<div class="mp-track-name empty" id="mp-track-name">\u672A\u9009\u62E9\u66F2\u76EE</div>' +
            '<div class="mp-track-status" id="mp-track-status">\u{1F8B} \u70B9\u51FB\u8774\u8776\u6253\u5F00\u97F3\u4E50</div>' +
          '</div>' +
        '</div>' +
        '<div class="mp-progress-section">' +
          '<div class="mp-progress-bar" id="mp-progress-bar">' +
            '<div class="mp-progress-filled" id="mp-progress-filled"></div>' +
          '</div>' +
          '<div class="mp-time-display">' +
            '<span id="mp-current-time">00:00</span>' +
            '<span id="mp-duration">00:00</span>' +
          '</div>' +
        '</div>' +
        '<div class="mp-controls">' +
          '<button class="mp-ctrl-btn" id="mp-prev" title="\u4E0A\u4E00\u66F2">' + ICONS.prev + '</button>' +
          '<button class="mp-ctrl-btn play-pause" id="mp-play-pause" title="\u64AD\u653E/\u6682\u505C">' + ICONS.play + '</button>' +
          '<button class="mp-ctrl-btn" id="mp-next" title="\u4E0B\u4E00\u66F2">' + ICONS.next + '</button>' +
        '</div>' +
        '<div class="mp-volume-row">' +
          ICONS.volume +
          '<input type="range" class="mp-volume-slider" id="mp-volume" min="0" max="100" value="60" />' +
        '</div>' +
        '<div class="mp-playlist" id="mp-playlist"></div>' +
        '<div class="mp-add-section">' +
          '<input type="text" class="mp-add-input" id="mp-add-input" placeholder="\u8D34\u5165\u97F3\u4E50\u94FE\u63A5..." />' +
          '<button class="mp-add-btn" id="mp-add-btn">\u6DFB\u52A0</button>' +
          '<label class="mp-file-label" title="\u9009\u62E9\u672C\u5730\u97F3\u4E50\u6587\u4EF6">' +
            ICONS.upload +
            '<input type="file" id="mp-file-input" accept="audio/*" multiple />' +
          '</label>' +
        '</div>' +
      '</div>';

    document.body.appendChild(container);

    toggleBtn = document.getElementById('mp-toggle');
    panel = document.getElementById('mp-panel');
    coverEl = document.getElementById('mp-cover');
    trackNameEl = document.getElementById('mp-track-name');
    trackStatusEl = document.getElementById('mp-track-status');
    progressEl = document.getElementById('mp-progress-bar');
    progressFilled = document.getElementById('mp-progress-filled');
    currentTimeEl = document.getElementById('mp-current-time');
    durationEl = document.getElementById('mp-duration');
    playPauseBtn = document.getElementById('mp-play-pause');
    prevBtn = document.getElementById('mp-prev');
    nextBtn = document.getElementById('mp-next');
    loopBtn = document.getElementById('mp-loop');
    volumeSlider = document.getElementById('mp-volume');
    playlistEl = document.getElementById('mp-playlist');
    addInput = document.getElementById('mp-add-input');
    addBtn = document.getElementById('mp-add-btn');
    fileLabel = document.querySelector('.mp-file-label');
    fileInput = document.getElementById('mp-file-input');

    audio = new Audio();
    audio.volume = 0.6;
  }

  // ── 绑定事件 ──────────────────────────────────────────────────
  function bindEvents() {
    // 蝶钮点击 → 展开/折叠
    toggleBtn.addEventListener('click', function () {
      panelOpen = !panelOpen;
      container.classList.toggle('open', panelOpen);
    });

    // 关闭面板
    document.getElementById('mp-close').addEventListener('click', function () {
      panelOpen = false;
      container.classList.remove('open');
    });

    // 播放/暂停
    playPauseBtn.addEventListener('click', togglePlay);

    // 上一曲/下一曲
    prevBtn.addEventListener('click', function () { skipTo(-1); });
    nextBtn.addEventListener('click', function () { skipTo(1); });

    // 循环模式
    loopBtn.addEventListener('click', function () {
      if (loopMode === 'list') loopMode = 'single';
      else if (loopMode === 'single') loopMode = 'shuffle';
      else loopMode = 'list';
      updateLoopBtn();
      saveState();
    });

    // 进度条点击
    progressEl.addEventListener('click', function (e) {
      if (!audio.duration) return;
      var rect = progressEl.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });

    // 音量
    volumeSlider.addEventListener('input', function () {
      audio.volume = volumeSlider.value / 100;
      saveState();
    });

    // 添加 URL
    addBtn.addEventListener('click', addFromInput);
    addInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') addFromInput();
    });

    // 本地文件
    fileInput.addEventListener('change', function (e) {
      var files = e.target.files;
      for (var i = 0; i < files.length; i++) {
        var url = URL.createObjectURL(files[i]);
        var name = files[i].name.replace(/\.[^.]+$/, '');
        addToPlaylist(name, url);
      }
      fileInput.value = '';
    });

    // 音频事件
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', function () {
      isPlaying = true;
      updatePlayPauseUI();
    });
    audio.addEventListener('pause', function () {
      isPlaying = false;
      updatePlayPauseUI();
    });
    audio.addEventListener('error', function () {
      trackStatusEl.textContent = '\u26A0 \u64AD\u653E\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u94FE\u63A5';
    });
  }

  // ── 播放控制 ──────────────────────────────────────────────────
  function togglePlay() {
    if (currentIndex < 0 && playlist.length > 0) {
      playIndex(0);
      return;
    }
    if (currentIndex < 0) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(function () {
        trackStatusEl.textContent = '\u26A0 \u65E0\u6CD5\u64AD\u653E';
      });
    }
  }

  function playIndex(idx) {
    if (idx < 0 || idx >= playlist.length) return;
    currentIndex = idx;
    var track = playlist[idx];
    audio.src = track.url;
    audio.play().then(function () {
      isPlaying = true;
      updatePlayPauseUI();
    }).catch(function () {
      trackStatusEl.textContent = '\u26A0 \u65E0\u6CD5\u64AD\u653E';
    });
    updateUI();
    renderPlaylist();
  }

  function skipTo(direction) {
    if (playlist.length === 0) return;
    var next;
    if (loopMode === 'shuffle') {
      do {
        next = Math.floor(Math.random() * playlist.length);
      } while (next === currentIndex && playlist.length > 1);
    } else {
      next = currentIndex + direction;
      if (next < 0) next = playlist.length - 1;
      if (next >= playlist.length) next = 0;
    }
    playIndex(next);
  }

  function onEnded() {
    if (loopMode === 'single') {
      audio.currentTime = 0;
      audio.play();
    } else {
      skipTo(1);
    }
  }

  // ── 播放列表管理 ──────────────────────────────────────────────
  function addFromInput() {
    var url = addInput.value.trim();
    if (!url) return;
    var name = url.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '') || '\u672A\u547D\u540D\u66F2\u76EE';
    // 尝试从 URL 提取更好看的名字
    try {
      var decoded = decodeURIComponent(name);
      if (decoded) name = decoded;
    } catch (e) {}
    addToPlaylist(name, url);
    addInput.value = '';
  }

  function addToPlaylist(name, url, cover) {
    playlist.push({ name: name, url: url, cover: cover || '' });
    saveState();
    renderPlaylist();
    if (currentIndex < 0) {
      trackStatusEl.textContent = '\u70B9\u51FB\u64AD\u653E\u952E\u5F00\u59CB\u6536\u542C';
    }
  }

  function removeFromPlaylist(idx) {
    if (idx === currentIndex) {
      audio.pause();
      audio.src = '';
      currentIndex = -1;
      isPlaying = false;
      updatePlayPauseUI();
    } else if (idx < currentIndex) {
      currentIndex--;
    }
    playlist.splice(idx, 1);
    saveState();
    renderPlaylist();
    updateUI();
  }

  // ── 渲染 ──────────────────────────────────────────────────────
  function renderPlaylist() {
    if (playlist.length === 0) {
      playlistEl.innerHTML = '<div class="mp-playlist-empty">\u{1F8B} \u8F7D\u542C\u5BA4\u7A7A\u7A7A\u5982\u4E5F<br/>\u8D34\u5165\u94FE\u63A5\u6216\u4E0A\u4F20\u6587\u4EF6\u6DFB\u52A0\u97F3\u4E50</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < playlist.length; i++) {
      var active = i === currentIndex ? ' active' : '';
      var playing = (i === currentIndex && isPlaying) ? ' playing' : '';
      html += '<div class="mp-playlist-item' + active + playing + '" data-idx="' + i + '">' +
        '<span class="mp-pl-index">' + (i + 1) + '</span>' +
        '<div class="mp-pl-playing-icon"><span></span><span></span><span></span></div>' +
        '<span class="mp-pl-name">' + escapeHTML(playlist[i].name) + '</span>' +
        '<button class="mp-pl-delete" data-del="' + i + '" title="\u5220\u9664">&times;</button>' +
      '</div>';
    }
    playlistEl.innerHTML = html;

    // 绑定点击
    var items = playlistEl.querySelectorAll('.mp-playlist-item');
    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.classList.contains('mp-pl-delete')) return;
        var idx = parseInt(item.dataset.idx);
        playIndex(idx);
      });
    });

    var dels = playlistEl.querySelectorAll('.mp-pl-delete');
    dels.forEach(function (del) {
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(del.dataset.del);
        removeFromPlaylist(idx);
      });
    });
  }

  function updateUI() {
    if (currentIndex >= 0 && playlist[currentIndex]) {
      var track = playlist[currentIndex];
      trackNameEl.textContent = track.name;
      trackNameEl.classList.remove('empty');
      if (isPlaying) {
        trackStatusEl.textContent = '\u{1F8B} \u6B63\u5728\u6536\u542C...';
        coverEl.classList.add('playing');
        toggleBtn.classList.add('playing');
      } else {
        trackStatusEl.textContent = '\u23F8 \u5DF2\u6682\u505C';
        coverEl.classList.remove('playing');
        toggleBtn.classList.remove('playing');
      }
    } else {
      trackNameEl.textContent = '\u672A\u9009\u62E9\u66F2\u76EE';
      trackNameEl.classList.add('empty');
      trackStatusEl.textContent = playlist.length > 0 ? '\u70B9\u51FB\u64AD\u653E\u952E\u5F00\u59CB\u6536\u542C' : '\u{1F8B} \u70B9\u51FB\u8774\u8776\u6253\u5F00\u97F3\u4E50';
      coverEl.classList.remove('playing');
      toggleBtn.classList.remove('playing');
    }
    updateLoopBtn();
  }

  function updatePlayPauseUI() {
    playPauseBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
    updateUI();
    renderPlaylist();
  }

  function updateLoopBtn() {
    var labels = { list: '\u{1F501}', single: '\u{1F502}', shuffle: '\u{1F500}' };
    var titles = { list: '\u5217\u8868\u5FAA\u73AF', single: '\u5355\u66F2\u5FAA\u73AF', shuffle: '\u968F\u673A\u64AD\u653E' };
    loopBtn.innerHTML = labels[loopMode];
    loopBtn.title = titles[loopMode];
    loopBtn.classList.toggle('active', loopMode !== 'list');
  }

  function updateProgress() {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    progressFilled.style.width = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }

  function updateDuration() {
    durationEl.textContent = formatTime(audio.duration);
  }

  function formatTime(sec) {
    if (isNaN(sec)) return '00:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── 持久化 ────────────────────────────────────────────────────
  function saveState() {
    try {
      // 本地文件 URL 无法持久化（blob: URL 会失效），只保存 URL 类型
      var saveable = playlist.map(function (t) {
        return { name: t.name, url: t.url.startsWith('blob:') ? '' : t.url, cover: t.cover || '' };
      }).filter(function (t) { return t.url; });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveable));
      localStorage.setItem(STORAGE_STATE, JSON.stringify({
        volume: volumeSlider.value,
        loopMode: loopMode
      }));
    } catch (e) {}
  }

  function loadState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          playlist = parsed.filter(function (t) { return t && t.url; });
        }
      }
      var state = localStorage.getItem(STORAGE_STATE);
      if (state) {
        var s = JSON.parse(state);
        if (s.volume) {
          volumeSlider.value = s.volume;
          audio.volume = s.volume / 100;
        }
        if (s.loopMode) loopMode = s.loopMode;
      }
    } catch (e) {}
  }

  // ── 启动 ──────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
