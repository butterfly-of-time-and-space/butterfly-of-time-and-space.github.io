/* ═══════════════════════════════════════════════════════════════
   编辑页面逻辑
   ═══════════════════════════════════════════════════════════════
   功能：
   1. 时间线总览卡片点击 → 切换时间线详情页（角色展示+羽毛按钮）
   2. 凤凰羽毛按钮点击 → 切换板块编辑独立页面
   3. 板块编辑页：纯文本编辑（简介/组织/魔法/百科/小说）
   4. 角色展示区：图片+姓名卡片，点击进独立角色编辑页
   5. 联机互动卡片点击 → 切换互动详情编辑页
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 时间线配置 ──────────────────────────────────────────────
  var TIMELINES = {
    diehuang: {
      title: '源初·蝶凰线',
      fieldSuffix: 'Diehuang',
      sections: {
        brief:    { label: '世界线简介',     placeholder: '在此编辑世界线简介……' },
        factions: { label: '组织与势力',     placeholder: '在此编辑组织与势力……' },
        magic:    { label: '魔法 / 力量体系', placeholder: '在此编辑魔法/力量体系……' },
        wiki:     { label: '世界百科',       placeholder: '在此编辑世界百科……' },
        novel:    { label: '世界小说',       placeholder: '在此编辑世界小说……' }
      }
    },
    guiwang: {
      title: '贯通·鬼王线',
      fieldSuffix: 'Guiwang',
      sections: {
        brief:    { label: '世界线简介',     placeholder: '在此编辑世界线简介……' },
        factions: { label: '组织与势力',     placeholder: '在此编辑组织与势力……' },
        magic:    { label: '魔法 / 力量体系', placeholder: '在此编辑魔法/力量体系……' },
        wiki:     { label: '世界百科',       placeholder: '在此编辑世界百科……' },
        novel:    { label: '世界小说',       placeholder: '在此编辑世界小说……' }
      }
    },
    guoshi: {
      title: '平行·国师线',
      fieldSuffix: 'Guoshi',
      sections: {
        brief:    { label: '世界线简介',     placeholder: '在此编辑世界线简介……' },
        factions: { label: '组织与势力',     placeholder: '在此编辑组织与势力……' },
        magic:    { label: '魔法 / 力量体系', placeholder: '在此编辑魔法/力量体系……' },
        wiki:     { label: '世界百科',       placeholder: '在此编辑世界百科……' },
        novel:    { label: '世界小说',       placeholder: '在此编辑世界小说……' }
      }
    },
    ifline: {
      title: 'IF线',
      fieldSuffix: 'Ifline',
      sections: {
        brief:    { label: '世界线简介',     placeholder: '在此编辑世界线简介……' },
        factions: { label: '组织与势力',     placeholder: '在此编辑组织与势力……' },
        magic:    { label: '魔法 / 力量体系', placeholder: '在此编辑魔法/力量体系……' },
        wiki:     { label: '世界百科',       placeholder: '在此编辑世界百科……' },
        novel:    { label: '世界小说',       placeholder: '在此编辑世界小说……' }
      }
    },
    yinyang: {
      title: '连结·阴阳师线',
      fieldSuffix: 'Yinyang',
      sections: {
        brief:    { label: '世界线简介',     placeholder: '在此编辑世界线简介……' },
        factions: { label: '组织与势力',     placeholder: '在此编辑组织与势力……' },
        magic:    { label: '魔法 / 力量体系', placeholder: '在此编辑魔法/力量体系……' },
        wiki:     { label: '世界百科',       placeholder: '在此编辑世界百科……' },
        novel:    { label: '世界小说',       placeholder: '在此编辑世界小说……' }
      }
    },
    xiaoyuan: {
      title: '收束·校园线',
      fieldSuffix: 'Xiaoyuan',
      sections: {
        brief:    { label: '世界线简介',     placeholder: '在此编辑世界线简介……' },
        factions: { label: '组织与势力',     placeholder: '在此编辑组织与势力……' },
        magic:    { label: '魔法 / 力量体系', placeholder: '在此编辑魔法/力量体系……' },
        wiki:     { label: '世界百科',       placeholder: '在此编辑世界百科……' },
        novel:    { label: '世界小说',       placeholder: '在此编辑世界小说……' }
      }
    }
  };

  // ── 联机互动配置 ────────────────────────────────────────────
  var INTERACTIONS = {
    lvpaopao: {
      title: 'OC绿泡泡',
      fieldSuffix: 'Lvpaopao',
      defaultContent: '在此编辑「OC绿泡泡」的详细内容……'
    },
    questionnaire: {
      title: '世界观问卷互动',
      fieldSuffix: 'Questionnaire',
      defaultContent: '在此编辑「世界观问卷互动」的详细内容……'
    },
    plan: {
      title: 'OC企划设计',
      fieldSuffix: 'Plan',
      defaultContent: '在此编辑「OC企划设计」的详细内容……'
    }
  };

  // ── 板块字段名后缀映射 ──────────────────────────────────────
  var SECTION_SUFFIX = {
    brief:    'Brief',
    factions: 'Factions',
    magic:    'Magic',
    wiki:     'Wiki',
    novel:    'Novel'
  };

  var CHAR_STORAGE_KEY = 'chuxiyan_oc_characters';
  var IF_WORLDS_STORAGE_KEY = 'chuxiyan_oc_ifworlds';
  var currentTimeline = null;
  var currentSection = null;
  var currentInteraction = null;
  var currentEditingCharIndex = -1;
  var currentEditingGallerySectionIndex = -1;
  var currentEditingGalleryItemIndex = -1;
  var currentEditingChapterIndex = -1;
  var currentEditingWeaponIndex = -1;
  var currentEditingSkillIndex = -1;
  var deleteMode = false;

  function isDeleteMode() {
    return deleteMode;
  }

  // ── 动态时间线配置：支持 IF 线世界 ──────────────────────────
  // 对于静态时间线（diehuang/guiwang/...），直接返回 TIMELINES[key]
  // 对于 IF 线世界（ifworld_xxx），返回与蝶凰线相同结构的动态配置
  function getTimelineConfig(key) {
    if (TIMELINES[key]) return TIMELINES[key];
    if (key && key.indexOf('ifworld_') === 0) {
      var worlds = loadIfWorlds();
      var world = null;
      for (var i = 0; i < worlds.length; i++) {
        if (worlds[i].id === key) { world = worlds[i]; break; }
      }
      return {
        title: world ? (world.name || '未命名世界') : '未命名世界',
        fieldSuffix: 'If' + key.replace(/[^a-zA-Z0-9]/g, ''),
        sections: TIMELINES.diehuang.sections
      };
    }
    return null;
  }

  // ── IF 世界存档 ─────────────────────────────────────────────
  function loadIfWorlds() {
    try {
      var data = window.ocStorage.get(IF_WORLDS_STORAGE_KEY);
      if (data) return data;
    } catch (e) {}
    return [];
  }

  function saveIfWorlds(worlds) {
    try {
      window.ocStorage.set(IF_WORLDS_STORAGE_KEY, worlds);
    } catch (e) {
      console.error('IF世界存档保存失败:', e);
    }
  }

  // ── 工具：从存档读取数据 ─────────────────────────────────────
  function loadArchive() {
    if (window.OCStorage && window.OCStorage.loadFromLocal) {
      return window.OCStorage.loadFromLocal();
    }
    try {
      var data = window.ocStorage.get('chuxiyan_oc_archive');
      if (data) return data;
    } catch (e) {}
    return null;
  }

  // ── 角色存档 ──────────────────────────────────────────────────
  function loadAllCharacters() {
    try {
      var data = window.ocStorage.get(CHAR_STORAGE_KEY);
      if (data) return data;
    } catch (e) {}
    return {};
  }

  function saveAllCharacters(allChars) {
    try {
      window.ocStorage.set(CHAR_STORAGE_KEY, allChars);
    } catch (e) {
      console.error('角色存档保存失败:', e);
    }
  }

  function loadCharacters(timelineKey) {
    var all = loadAllCharacters();
    return all[timelineKey] || [];
  }

  function saveCharacters(timelineKey, chars) {
    var all = loadAllCharacters();
    all[timelineKey] = chars;
    saveAllCharacters(all);
  }

  function collectCharactersFromGrid() {
    var stored = currentTimeline ? loadCharacters(currentTimeline) : [];
    var chars = [];
    var cards = document.querySelectorAll('#detail-character-grid .character-card');
    cards.forEach(function (card, index) {
      var nameEl = card.querySelector('.character-name');
      var img = card.querySelector('.avatar-preview img');
      var existing = stored[index] || {};
      chars.push({
        name: nameEl ? nameEl.innerHTML : existing.name || '',
        avatar: img && img.src && img.style.display !== 'none' ? img.src : existing.avatar || '',
        desc: existing.desc || '',
        gallery: existing.gallery || {
          sections: DEFAULT_GALLERY_SECTIONS.map(function (name) {
            return { name: name, items: [] };
          }),
          activeSectionIndex: 0
        },
        story: existing.story || { chapters: [] },
        profile: existing.profile || {},
        abilities: existing.abilities || DEFAULT_ABILITIES
      });
    });
    return chars;
  }

  // ── 图片上传工具（不压缩，原画质）──────────────────────────
  function handleImageUpload(file, callback) {
    if (!file || !file.type.match(/^image\//)) {
      if (window.showToast) window.showToast('请选择图片文件', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  // ── 渲染角色卡片（到详情页展示区） ──────────────────────────
  function renderDetailCharacters(chars) {
    var container = document.getElementById('detail-character-grid');
    if (!container) return;

    container.innerHTML = '';
    if (!chars || chars.length === 0) return;

    chars.forEach(function (char, index) {
      var card = createCharacterCard(char.name || '', char.avatar || '', index);
      container.appendChild(card);
    });
  }

  function createCharacterCard(name, avatar, index) {
    var card = document.createElement('div');
    card.className = 'character-card';
    card.setAttribute('data-index', String(index));

    // 删除按钮
    var delBtn = document.createElement('button');
    delBtn.className = 'character-delete-btn';
    delBtn.setAttribute('title', '删除角色');
    delBtn.textContent = '×';
    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      removeCharacterCard(card);
    });

    // 图片上传区
    var uploadWrap = document.createElement('div');
    uploadWrap.className = 'character-avatar-upload';

    var input = document.createElement('input');
    input.type = 'file';
    input.className = 'character-avatar-input';
    input.accept = 'image/*';
    input.addEventListener('click', function (e) { e.stopPropagation(); });
    input.addEventListener('change', function (e) {
      e.stopPropagation();
      var file = e.target.files[0];
      handleImageUpload(file, function (dataUrl) {
        img.src = dataUrl;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        if (currentTimeline) {
          saveCharacters(currentTimeline, collectCharactersFromGrid());
        }
      });
      input.value = '';
    });

    var preview = document.createElement('div');
    preview.className = 'avatar-preview';

    var img = document.createElement('img');
    img.alt = '角色图片';
    if (avatar) {
      img.src = avatar;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }

    var placeholder = document.createElement('span');
    placeholder.className = 'avatar-placeholder';
    placeholder.textContent = '+';
    if (avatar) placeholder.style.display = 'none';

    preview.appendChild(img);
    preview.appendChild(placeholder);
    uploadWrap.appendChild(input);
    uploadWrap.appendChild(preview);

    // 姓名
    var nameEl = document.createElement('div');
    nameEl.className = 'character-name';
    nameEl.setAttribute('contenteditable', String(!deleteMode));
    nameEl.setAttribute('data-placeholder', '角色名称');
    nameEl.innerHTML = name;
    nameEl.addEventListener('click', function (e) { e.stopPropagation(); });
    nameEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameEl.blur();
      }
    });

    // 纯文本粘贴
    [nameEl].forEach(function (el) {
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
    });

    nameEl.addEventListener('blur', function () {
      if (currentTimeline) {
        saveCharacters(currentTimeline, collectCharactersFromGrid());
      }
    });

    // 实时保存（防抖）
    var gridNameTimer;
    nameEl.addEventListener('input', function () {
      clearTimeout(gridNameTimer);
      gridNameTimer = setTimeout(function () {
        if (currentTimeline) {
          saveCharacters(currentTimeline, collectCharactersFromGrid());
        }
      }, 500);
    });

    // 进入详情页按钮
    var detailBtn = document.createElement('button');
    detailBtn.className = 'character-detail-btn';
    detailBtn.textContent = '进入详情页';
    detailBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isDeleteMode()) {
        removeCharacterCard(card);
        return;
      }
      var idx = parseInt(card.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;
      openCharacterEditor(idx);
    });

    card.appendChild(delBtn);
    card.appendChild(uploadWrap);
    card.appendChild(nameEl);
    card.appendChild(detailBtn);

    // 点击卡片：删除模式下删除，否则进入独立编辑页
    card.addEventListener('click', function () {
      if (isDeleteMode()) {
        removeCharacterCard(card);
        return;
      }
      var idx = parseInt(card.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;
      openCharacterEditor(idx);
    });

    return card;
  }

  function reindexCharacterCards() {
    var cards = document.querySelectorAll('#detail-character-grid .character-card');
    cards.forEach(function (card, i) {
      card.setAttribute('data-index', String(i));
    });
  }

  function removeCharacterCard(card) {
    card.style.transition = 'all 0.3s var(--ease-smooth)';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    setTimeout(function () {
      card.remove();
      reindexCharacterCards();
      if (currentTimeline) {
        saveCharacters(currentTimeline, collectCharactersFromGrid());
      }
      // 如果没有角色了，自动退出删除模式
      var showcase = document.getElementById('character-showcase');
      var deleteBtn = document.getElementById('delete-character-btn');
      if (showcase && deleteBtn && showcase.querySelectorAll('.character-card').length === 0) {
        deleteMode = false;
        deleteBtn.classList.remove('active');
        deleteBtn.textContent = '删除角色';
        showcase.classList.remove('delete-mode');
      }
    }, 280);
  }

  function addCharacter() {
    var container = document.getElementById('detail-character-grid');
    if (!container) return;

    // 先保存当前状态，确保索引正确
    if (currentTimeline) {
      saveCharacters(currentTimeline, collectCharactersFromGrid());
    }

    var chars = loadCharacters(currentTimeline);
    chars.push({
      name: '',
      avatar: '',
      desc: '',
      gallery: {
        sections: DEFAULT_GALLERY_SECTIONS.map(function (name) {
          return { name: name, items: [] };
        }),
        activeSectionIndex: 0
      },
      story: { chapters: [] },
      profile: {},
      abilities: DEFAULT_ABILITIES
    });
    saveCharacters(currentTimeline, chars);

    renderDetailCharacters(chars);

    var cards = container.querySelectorAll('.character-card');
    var newCard = cards[cards.length - 1];
    if (newCard) {
      newCard.style.opacity = '0';
      newCard.style.transform = 'translateY(10px)';
      requestAnimationFrame(function () {
        newCard.style.transition = 'all 0.35s var(--ease-smooth)';
        newCard.style.opacity = '1';
        newCard.style.transform = 'translateY(0)';
      });

      var nameEl = newCard.querySelector('.character-name');
      if (nameEl) {
        setTimeout(function () { nameEl.focus(); }, 100);
      }
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  角色独立编辑页
  // ═══════════════════════════════════════════════════════════════

  function getCurrentCharacter() {
    if (!currentTimeline || currentEditingCharIndex < 0) return null;
    var chars = loadCharacters(currentTimeline);
    if (currentEditingCharIndex >= chars.length) return null;
    return chars[currentEditingCharIndex];
  }

  function updateCurrentCharacter(patch) {
    if (!currentTimeline || currentEditingCharIndex < 0) return;
    var chars = loadCharacters(currentTimeline);
    if (currentEditingCharIndex >= chars.length) return;
    chars[currentEditingCharIndex] = Object.assign({}, chars[currentEditingCharIndex], patch);
    saveCharacters(currentTimeline, chars);
  }

  function openCharacterEditor(index) {
    if (!currentTimeline) return;

    var chars = loadCharacters(currentTimeline);
    if (index < 0 || index >= chars.length) return;

    currentEditingCharIndex = index;
    var char = chars[index];

    var pageTitle = document.getElementById('character-editor-page-title');
    var avatarWrap = document.getElementById('character-home-avatar');
    var img = document.getElementById('character-home-avatar-img');
    var placeholder = avatarWrap ? avatarWrap.querySelector('.avatar-placeholder') : null;
    var nameEl = document.getElementById('character-home-name');
    var descEl = document.getElementById('character-home-desc');

    if (pageTitle) {
      pageTitle.textContent = (char.name || '未命名角色') + ' · 详情';
    }

    if (avatarWrap) avatarWrap.setAttribute('data-index', String(index));

    if (img) {
      if (char.avatar) {
        img.src = char.avatar;
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      } else {
        img.src = '';
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
      }
    }

    if (nameEl) nameEl.innerHTML = char.name || '';
    if (descEl) descEl.innerHTML = char.desc || '';

    if (window.OCEdit && window.OCEdit.onCharacterOpen) {
      window.OCEdit.onCharacterOpen();
    }
  }

  function saveCurrentCharacter() {
    if (!currentTimeline || currentEditingCharIndex < 0) return;

    var img = document.getElementById('character-home-avatar-img');
    var nameEl = document.getElementById('character-home-name');
    var descEl = document.getElementById('character-home-desc');

    updateCurrentCharacter({
      name: nameEl ? nameEl.innerHTML : '',
      avatar: img && img.src && img.style.display !== 'none' ? img.src : '',
      desc: descEl ? descEl.innerHTML : ''
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  角色武器
  // ═══════════════════════════════════════════════════════════════

  function normalizeWeaponsData(weapons) {
    if (!Array.isArray(weapons)) return [];
    return weapons.map(function (w) {
      return {
        name: w.name || '',
        image: w.image || '',
        skills: Array.isArray(w.skills) ? w.skills.map(function (s) {
          return { name: s.name || '', desc: s.desc || '' };
        }) : []
      };
    });
  }

  function openCharacterWeapons() {
    var char = getCurrentCharacter();
    if (!char) return;

    var pageTitle = document.getElementById('character-weapons-page-title');
    if (pageTitle) pageTitle.textContent = (char.name || '未命名角色') + ' · 武器';

    renderWeaponList(char.weapons);

    if (window.OCEdit && window.OCEdit.onCharacterWeaponsOpen) {
      window.OCEdit.onCharacterWeaponsOpen();
    }
  }

  function renderWeaponList(weapons) {
    var listEl = document.getElementById('weapon-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    var items = normalizeWeaponsData(weapons);
    if (items.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'weapon-list-empty';
      empty.textContent = '暂无武器，点击下方按钮创建第一件武器。';
      listEl.appendChild(empty);
    } else {
      items.forEach(function (w, idx) {
        listEl.appendChild(createWeaponCard(w, idx));
      });
    }
  }

  function createWeaponCard(weapon, index) {
    var card = document.createElement('div');
    card.className = 'weapon-card';
    card.setAttribute('data-index', String(index));

    // 武器图
    var imgWrap = document.createElement('div');
    imgWrap.className = 'weapon-card-image';
    if (weapon.image) {
      var img = document.createElement('img');
      img.src = weapon.image;
      img.alt = weapon.name || '武器';
      imgWrap.appendChild(img);
    } else {
      var placeholder = document.createElement('span');
      placeholder.className = 'weapon-card-placeholder';
      placeholder.textContent = '无图';
      imgWrap.appendChild(placeholder);
    }

    // 名字
    var nameEl = document.createElement('div');
    nameEl.className = 'weapon-card-name';
    nameEl.textContent = weapon.name || '未命名武器';

    // 删除按钮
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'weapon-card-delete';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = '删除武器';
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var confirmed = confirm('确定要删除武器「' + (weapon.name || '未命名武器') + '」吗？');
      if (confirmed) {
        deleteWeapon(index);
      }
    });

    card.appendChild(imgWrap);
    card.appendChild(nameEl);
    card.appendChild(deleteBtn);

    // 点击进入详情
    card.addEventListener('click', function (e) {
      if (e.target === deleteBtn || deleteBtn.contains(e.target)) return;
      openWeaponDetail(index);
    });

    return card;
  }

  function addWeapon() {
    var char = getCurrentCharacter();
    if (!char) return;

    var weapons = normalizeWeaponsData(char.weapons);
    weapons.push({ name: '', image: '', skills: [] });
    updateCurrentCharacter({ weapons: weapons });

    renderWeaponList(weapons);
    // 自动打开新武器详情页
    openWeaponDetail(weapons.length - 1);
  }

  function deleteWeapon(index) {
    var char = getCurrentCharacter();
    if (!char) return;

    var weapons = normalizeWeaponsData(char.weapons);
    weapons.splice(index, 1);
    updateCurrentCharacter({ weapons: weapons });

    renderWeaponList(weapons);
  }

  function openWeaponDetail(index) {
    var char = getCurrentCharacter();
    if (!char) return;

    var weapons = normalizeWeaponsData(char.weapons);
    var weapon = weapons[index];
    if (!weapon) return;

    currentEditingWeaponIndex = index;

    var pageTitle = document.getElementById('character-weapon-detail-page-title');
    var img = document.getElementById('weapon-detail-image');
    var imgWrap = document.getElementById('weapon-detail-image-wrap');
    var placeholder = imgWrap ? imgWrap.querySelector('.weapon-image-placeholder') : null;
    var nameEl = document.getElementById('weapon-detail-name');

    if (pageTitle) pageTitle.textContent = (weapon.name || '未命名武器') + ' · 武器详情';
    if (img) {
      img.src = weapon.image || '';
      img.style.display = weapon.image ? 'block' : 'none';
    }
    if (placeholder) placeholder.style.display = weapon.image ? 'none' : 'flex';
    if (nameEl) nameEl.innerHTML = weapon.name || '';

    renderWeaponSkills(weapon.skills);

    if (window.OCEdit && window.OCEdit.onWeaponDetailOpen) {
      window.OCEdit.onWeaponDetailOpen();
    }
  }

  function saveWeaponDetail() {
    if (!currentTimeline || currentEditingCharIndex < 0 || currentEditingWeaponIndex < 0) return;

    var char = getCurrentCharacter();
    if (!char) return;

    var weapons = normalizeWeaponsData(char.weapons);
    var weapon = weapons[currentEditingWeaponIndex];
    if (!weapon) return;

    var img = document.getElementById('weapon-detail-image');
    var nameEl = document.getElementById('weapon-detail-name');

    weapon.image = img && img.style.display !== 'none' ? img.src : '';
    weapon.name = nameEl ? nameEl.innerHTML : '';

    updateCurrentCharacter({ weapons: weapons });
  }

  function renderWeaponSkills(skills) {
    var listEl = document.getElementById('weapon-skills-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!Array.isArray(skills) || skills.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'weapon-skills-empty';
      empty.textContent = '暂无武器技能，点击下方按钮添加。';
      listEl.appendChild(empty);
      return;
    }

    skills.forEach(function (s, idx) {
      listEl.appendChild(createWeaponSkillCard(s, idx));
    });
  }

  function createWeaponSkillCard(skill, index) {
    var card = document.createElement('div');
    card.className = 'weapon-skill-card';
    card.setAttribute('data-index', String(index));

    var nameEl = document.createElement('div');
    nameEl.className = 'weapon-skill-name';
    nameEl.setAttribute('contenteditable', 'true');
    nameEl.setAttribute('data-placeholder', '技能名称');
    nameEl.innerHTML = skill.name || '';
    nameEl.addEventListener('blur', saveWeaponSkillsFromDOM);

    var descEl = document.createElement('div');
    descEl.className = 'weapon-skill-desc';
    descEl.setAttribute('contenteditable', 'true');
    descEl.setAttribute('data-placeholder', '技能描述……');
    descEl.innerHTML = skill.desc || '';
    descEl.addEventListener('blur', saveWeaponSkillsFromDOM);

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'weapon-skill-delete';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = '删除此技能';
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteWeaponSkill(index);
    });

    card.appendChild(nameEl);
    card.appendChild(descEl);
    card.appendChild(deleteBtn);

    return card;
  }

  function saveWeaponSkillsFromDOM() {
    if (!currentTimeline || currentEditingCharIndex < 0 || currentEditingWeaponIndex < 0) return;

    var char = getCurrentCharacter();
    if (!char) return;

    var weapons = normalizeWeaponsData(char.weapons);
    var weapon = weapons[currentEditingWeaponIndex];
    if (!weapon) return;

    var listEl = document.getElementById('weapon-skills-list');
    if (!listEl) return;

    var cards = listEl.querySelectorAll('.weapon-skill-card');
    var newSkills = [];
    cards.forEach(function (card) {
      var nameEl = card.querySelector('.weapon-skill-name');
      var descEl = card.querySelector('.weapon-skill-desc');
      newSkills.push({
        name: nameEl ? nameEl.innerHTML : '',
        desc: descEl ? descEl.innerHTML : ''
      });
    });

    weapon.skills = newSkills;
    updateCurrentCharacter({ weapons: weapons });
  }

  function addWeaponSkill() {
    if (!currentTimeline || currentEditingCharIndex < 0 || currentEditingWeaponIndex < 0) return;

    var char = getCurrentCharacter();
    if (!char) return;

    var weapons = normalizeWeaponsData(char.weapons);
    var weapon = weapons[currentEditingWeaponIndex];
    if (!weapon) return;

    weapon.skills.push({ name: '', desc: '' });
    updateCurrentCharacter({ weapons: weapons });

    renderWeaponSkills(weapon.skills);
  }

  function deleteWeaponSkill(index) {
    if (!currentTimeline || currentEditingCharIndex < 0 || currentEditingWeaponIndex < 0) return;

    var char = getCurrentCharacter();
    if (!char) return;

    var weapons = normalizeWeaponsData(char.weapons);
    var weapon = weapons[currentEditingWeaponIndex];
    if (!weapon) return;

    weapon.skills.splice(index, 1);
    updateCurrentCharacter({ weapons: weapons });

    renderWeaponSkills(weapon.skills);
  }

  // ── 武器页按钮绑定 ────────────────────────────────────────────
  function initWeaponsPage() {
    var addBtn = document.getElementById('add-weapon-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { addWeapon(); });
    }

    var addSkillBtn = document.getElementById('add-weapon-skill-btn');
    if (addSkillBtn) {
      addSkillBtn.addEventListener('click', function () { addWeaponSkill(); });
    }

    // 武器详情页图片上传
    var imgInput = document.getElementById('weapon-detail-image-input');
    if (imgInput) {
      imgInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        handleImageUpload(file, function (dataUrl) {
          var img = document.getElementById('weapon-detail-image');
          var imgWrap = document.getElementById('weapon-detail-image-wrap');
          var placeholder = imgWrap ? imgWrap.querySelector('.weapon-image-placeholder') : null;
          if (img) {
            img.src = dataUrl;
            img.style.display = 'block';
          }
          if (placeholder) placeholder.style.display = 'none';
          saveWeaponDetail();
        });
        imgInput.value = '';
      });
    }

    // 武器名字失焦保存
    var nameEl = document.getElementById('weapon-detail-name');
    if (nameEl) {
      nameEl.addEventListener('blur', saveWeaponDetail);
    }
  }

  function initWeaponsBack() {
    var btn = document.getElementById('btn-back-weapons');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.OCStorage) window.OCStorage.save();
      openCharacterEditor(currentEditingCharIndex);
      if (window.OCEdit && window.OCEdit.onCharacterWeaponsBack) {
        window.OCEdit.onCharacterWeaponsBack();
      }
    });
  }

  function initWeaponDetailBack() {
    var btn = document.getElementById('btn-back-weapon-detail');
    if (!btn) return;
    btn.addEventListener('click', function () {
      saveWeaponDetail();
      if (window.OCStorage) window.OCStorage.save();
      openCharacterWeapons();
      if (window.OCEdit && window.OCEdit.onWeaponDetailBack) {
        window.OCEdit.onWeaponDetailBack();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  角色技能
  // ═══════════════════════════════════════════════════════════════

  function normalizeSkillsData(skills) {
    if (!Array.isArray(skills)) return [];
    return skills.map(function (s) {
      return {
        name: s.name || '',
        desc: s.desc || ''
      };
    });
  }

  function openCharacterSkills() {
    var char = getCurrentCharacter();
    if (!char) return;

    var pageTitle = document.getElementById('character-skills-page-title');
    if (pageTitle) pageTitle.textContent = (char.name || '未命名角色') + ' · 技能';

    renderSkillList(char.skills);

    if (window.OCEdit && window.OCEdit.onCharacterSkillsOpen) {
      window.OCEdit.onCharacterSkillsOpen();
    }
  }

  function renderSkillList(skills) {
    var listEl = document.getElementById('skill-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    var items = normalizeSkillsData(skills);
    if (items.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'skill-list-empty';
      empty.textContent = '暂无技能，点击下方按钮创建第一个技能。';
      listEl.appendChild(empty);
    } else {
      items.forEach(function (s, idx) {
        listEl.appendChild(createSkillCard(s, idx));
      });
    }
  }

  function createSkillCard(skill, index) {
    var card = document.createElement('div');
    card.className = 'skill-card';
    card.setAttribute('data-index', String(index));

    var nameEl = document.createElement('div');
    nameEl.className = 'skill-card-name';
    nameEl.textContent = skill.name || '未命名技能';

    var previewEl = document.createElement('div');
    previewEl.className = 'skill-card-preview';
    var previewText = skill.desc ? skill.desc.replace(/<[^>]+>/g, '').substring(0, 80) : '暂无描述……';
    previewEl.textContent = previewText;

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'skill-card-delete';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = '删除技能';
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var confirmed = confirm('确定要删除技能「' + (skill.name || '未命名技能') + '」吗？');
      if (confirmed) {
        deleteSkill(index);
      }
    });

    card.appendChild(nameEl);
    card.appendChild(previewEl);
    card.appendChild(deleteBtn);

    card.addEventListener('click', function (e) {
      if (e.target === deleteBtn || deleteBtn.contains(e.target)) return;
      openSkillEditor(index);
    });

    return card;
  }

  function addSkill() {
    var char = getCurrentCharacter();
    if (!char) return;

    var skills = normalizeSkillsData(char.skills);
    skills.push({ name: '', desc: '' });
    updateCurrentCharacter({ skills: skills });

    renderSkillList(skills);
    // 自动打开新技能编辑页
    openSkillEditor(skills.length - 1);
  }

  function deleteSkill(index) {
    var char = getCurrentCharacter();
    if (!char) return;

    var skills = normalizeSkillsData(char.skills);
    skills.splice(index, 1);
    updateCurrentCharacter({ skills: skills });

    renderSkillList(skills);
  }

  function openSkillEditor(index) {
    var char = getCurrentCharacter();
    if (!char) return;

    var skills = normalizeSkillsData(char.skills);
    var skill = skills[index];
    if (!skill) return;

    currentEditingSkillIndex = index;

    var pageTitle = document.getElementById('character-skill-edit-page-title');
    var titleEl = document.getElementById('skill-edit-title');
    var bodyEl = document.getElementById('skill-edit-body');

    if (pageTitle) pageTitle.textContent = (skill.name || '未命名技能') + ' · 技能编辑';
    if (titleEl) titleEl.innerHTML = skill.name || '';
    if (bodyEl) bodyEl.innerHTML = skill.desc || '';

    if (window.OCEdit && window.OCEdit.onSkillEditOpen) {
      window.OCEdit.onSkillEditOpen();
    }
  }

  function saveSkillEdit() {
    if (!currentTimeline || currentEditingCharIndex < 0 || currentEditingSkillIndex < 0) return;

    var titleEl = document.getElementById('skill-edit-title');
    var bodyEl = document.getElementById('skill-edit-body');

    var char = getCurrentCharacter();
    if (!char) return;

    var skills = normalizeSkillsData(char.skills);
    var skill = skills[currentEditingSkillIndex];
    if (!skill) return;

    skill.name = titleEl ? titleEl.innerHTML : '';
    skill.desc = bodyEl ? bodyEl.innerHTML : '';

    updateCurrentCharacter({ skills: skills });
  }

  // ── 技能页按钮绑定 ────────────────────────────────────────────
  function initSkillsPage() {
    var addBtn = document.getElementById('add-skill-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { addSkill(); });
    }
  }

  function initSkillsBack() {
    var btn = document.getElementById('btn-back-skills');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.OCStorage) window.OCStorage.save();
      openCharacterEditor(currentEditingCharIndex);
      if (window.OCEdit && window.OCEdit.onCharacterSkillsBack) {
        window.OCEdit.onCharacterSkillsBack();
      }
    });
  }

  function initSkillEditPage() {
    var titleEl = document.getElementById('skill-edit-title');
    var bodyEl = document.getElementById('skill-edit-body');
    if (titleEl) {
      titleEl.addEventListener('blur', saveSkillEdit);
    }
    if (bodyEl) {
      bodyEl.addEventListener('blur', saveSkillEdit);
    }
  }

  function initSkillEditBack() {
    var btn = document.getElementById('btn-back-skill-edit');
    if (!btn) return;
    btn.addEventListener('click', function () {
      saveSkillEdit();
      if (window.OCStorage) window.OCStorage.save();
      openCharacterSkills();
      if (window.OCEdit && window.OCEdit.onSkillEditBack) {
        window.OCEdit.onSkillEditBack();
      }
    });
  }

  var DEFAULT_GALLERY_SECTIONS = ['立绘区', '头像区', '半身区', '插画区', 'QQ人区', '贴贴区', '特殊业务区'];

  var DEFAULT_ABILITIES = [
    { name: '力量', value: 50 },
    { name: '敏捷', value: 50 },
    { name: '智力', value: 50 },
    { name: '魅力', value: 50 },
    { name: '幸运', value: 50 },
    { name: '耐力', value: 50 }
  ];

  function normalizeGalleryData(gallery) {
    // 新格式：{ sections: [...], activeSectionIndex: n }
    if (gallery && typeof gallery === 'object' && !Array.isArray(gallery) && gallery.sections) {
      return {
        sections: gallery.sections.map(function (s) {
          return {
            name: s.name || '未命名分区',
            items: (s.items || []).map(function (it) {
              return { src: it.src || '', name: it.name || '', price: it.price || '', story: it.story || '' };
            })
          };
        }),
        activeSectionIndex: Math.max(0, Math.min((gallery.activeSectionIndex || 0), (gallery.sections || []).length - 1))
      };
    }

    // 旧格式：数组 [{src, caption}]
    if (Array.isArray(gallery) && gallery.length > 0) {
      return {
        sections: [{
          name: '默认分区',
          items: gallery.map(function (it) {
            return { src: it.src || '', name: it.caption || '', price: '', story: it.story || '' };
          })
        }],
        activeSectionIndex: 0
      };
    }

    // 全新：给出默认分区
    return {
      sections: DEFAULT_GALLERY_SECTIONS.map(function (name) {
        return { name: name, items: [] };
      }),
      activeSectionIndex: 0
    };
  }

  function openCharacterGallery() {
    var char = getCurrentCharacter();
    if (!char) return;

    var pageTitle = document.getElementById('character-gallery-page-title');
    if (pageTitle) pageTitle.textContent = (char.name || '未命名角色') + ' · 画廊';

    renderGallery(char.gallery);

    if (window.OCEdit && window.OCEdit.onCharacterGalleryOpen) {
      window.OCEdit.onCharacterGalleryOpen();
    }
  }

  function getGalleryState() {
    var char = getCurrentCharacter();
    return normalizeGalleryData(char ? char.gallery : null);
  }

  function currentGallerySectionIndex() {
    var state = getGalleryState();
    return state.activeSectionIndex || 0;
  }

  function saveCharacterGallery() {
    var tabs = document.getElementById('gallery-section-tabs');
    var list = document.getElementById('gallery-list');
    if (!tabs || !list) return;

    // 保留已有数据，避免切换分区时非激活分区被清空
    var existingState = getGalleryState();
    var sections = [];
    var activeIndex = 0;

    tabs.querySelectorAll('.gallery-section-tab').forEach(function (tab, idx) {
      var nameEl = tab.querySelector('.tab-name');
      if (tab.classList.contains('active')) activeIndex = idx;
      // 继承已有分区的 items，稍后只更新当前激活分区
      sections.push({
        name: nameEl ? nameEl.innerHTML : '未命名分区',
        items: ((existingState.sections[idx] || {}).items || []).slice()
      });
    });

    // 只更新当前激活分区的 items
    var currentItems = [];
    list.querySelectorAll('.gallery-item').forEach(function (item, itemIdx) {
      var img = item.querySelector('.gallery-image-wrap img');
      var nameEl = item.querySelector('.gallery-item-name');
      var priceEl = item.querySelector('.price-input');
      var src = img && img.style.display !== 'none' ? img.src : '';
      if (src) {
        var existingItem = ((existingState.sections[activeIndex] || {}).items || [])[itemIdx] || {};
        currentItems.push({
          src: src,
          name: nameEl ? nameEl.innerHTML : '',
          price: priceEl ? priceEl.innerHTML : '',
          story: existingItem.story || ''
        });
      }
    });
    if (sections[activeIndex]) {
      sections[activeIndex].items = currentItems;
    }

    updateCurrentCharacter({
      gallery: {
        sections: sections,
        activeSectionIndex: activeIndex
      }
    });
  }

  function renderGallery(gallery) {
    var state = normalizeGalleryData(gallery);
    renderGalleryTabs(state);
    renderGalleryItems(state);
  }

  function renderGalleryTabs(state) {
    var tabs = document.getElementById('gallery-section-tabs');
    if (!tabs) return;
    tabs.innerHTML = '';

    state.sections.forEach(function (section, idx) {
      tabs.appendChild(createGallerySectionTab(section.name, idx === state.activeSectionIndex, idx));
    });
  }

  function createGallerySectionTab(name, isActive, index) {
    var tab = document.createElement('div');
    tab.className = 'gallery-section-tab' + (isActive ? ' active' : '');
    tab.setAttribute('data-index', String(index));

    var nameEl = document.createElement('span');
    nameEl.className = 'tab-name';
    nameEl.setAttribute('contenteditable', 'true');
    nameEl.setAttribute('data-placeholder', '分区名');
    nameEl.innerHTML = name || '';
    nameEl.addEventListener('blur', saveCharacterGallery);
    nameEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameEl.blur();
      }
    });

    var delBtn = document.createElement('button');
    delBtn.className = 'tab-delete';
    delBtn.innerHTML = '&times;';
    delBtn.title = '删除分区';
    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteGallerySection(index);
    });

    tab.appendChild(nameEl);
    tab.appendChild(delBtn);

    tab.addEventListener('click', function (e) {
      if (e.target === delBtn || e.target === nameEl || nameEl.contains(e.target)) return;
      switchGallerySection(index);
    });

    return tab;
  }

  function renderGalleryItems(state) {
    var list = document.getElementById('gallery-list');
    var empty = document.getElementById('gallery-section-empty');
    if (!list) return;
    list.innerHTML = '';

    var section = state.sections[state.activeSectionIndex];
    var items = section ? section.items : [];

    if (items.length === 0) {
      if (empty) empty.classList.add('visible');
    } else {
      if (empty) empty.classList.remove('visible');
      items.forEach(function (it) {
        list.appendChild(createGalleryItem(it.src, it.name, it.price));
      });
    }
  }

  function openGalleryItemStory(sectionIndex, itemIndex) {
    if (!currentTimeline || currentEditingCharIndex < 0) return;

    saveCurrentCharacter();
    saveCharacterGallery();

    var char = getCurrentCharacter();
    if (!char) return;

    var state = normalizeGalleryData(char.gallery);
    var section = state.sections[sectionIndex];
    var item = section ? section.items[itemIndex] : null;
    if (!item) return;

    currentEditingGallerySectionIndex = sectionIndex;
    currentEditingGalleryItemIndex = itemIndex;

    var pageTitle = document.getElementById('character-gallery-item-story-page-title');
    var img = document.getElementById('gallery-item-story-img');
    var nameEl = document.getElementById('gallery-item-story-name');
    var bodyEl = document.getElementById('gallery-item-story-body');

    if (pageTitle) pageTitle.textContent = (item.name || '未命名图片') + ' · 入画';
    if (img) {
      img.src = item.src || '';
      img.style.display = item.src ? 'block' : 'none';
    }
    if (nameEl) nameEl.textContent = item.name || '未命名图片';
    if (bodyEl) bodyEl.innerHTML = item.story || '';

    if (window.OCEdit && window.OCEdit.onGalleryItemStoryOpen) {
      window.OCEdit.onGalleryItemStoryOpen();
    }
  }

  function saveGalleryItemStory() {
    if (!currentTimeline || currentEditingCharIndex < 0) return;
    if (currentEditingGallerySectionIndex < 0 || currentEditingGalleryItemIndex < 0) return;

    var bodyEl = document.getElementById('gallery-item-story-body');
    if (!bodyEl) return;

    var char = getCurrentCharacter();
    if (!char) return;

    var state = normalizeGalleryData(char.gallery);
    var section = state.sections[currentEditingGallerySectionIndex];
    if (!section || !section.items[currentEditingGalleryItemIndex]) return;

    section.items[currentEditingGalleryItemIndex].story = bodyEl.innerHTML;
    updateCurrentCharacter({ gallery: state });
  }

  function switchGallerySection(index) {
    saveCharacterGallery();
    var state = getGalleryState();
    state.activeSectionIndex = index;
    updateCurrentCharacter({ gallery: state });
    renderGallery(state);
  }

  function addGallerySection() {
    saveCharacterGallery();
    var state = getGalleryState();
    state.sections.push({ name: '新分区', items: [] });
    state.activeSectionIndex = state.sections.length - 1;
    updateCurrentCharacter({ gallery: state });
    renderGallery(state);

    // 自动聚焦新分区的名称
    setTimeout(function () {
      var tabs = document.getElementById('gallery-section-tabs');
      if (!tabs) return;
      var newTab = tabs.querySelector('.gallery-section-tab:last-child .tab-name');
      if (newTab) {
        newTab.focus();
        selectElementText(newTab);
      }
    }, 50);
  }

  function deleteGallerySection(index) {
    var state = getGalleryState();
    if (state.sections.length <= 1) {
      showToast('至少需要保留一个分区', 'error');
      return;
    }
    state.sections.splice(index, 1);
    if (state.activeSectionIndex >= state.sections.length) {
      state.activeSectionIndex = state.sections.length - 1;
    }
    updateCurrentCharacter({ gallery: state });
    renderGallery(state);
  }

  function selectElementText(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function createGalleryItem(src, name, price) {
    var item = document.createElement('div');
    item.className = 'gallery-item';

    var delBtn = document.createElement('button');
    delBtn.className = 'gallery-item-delete';
    delBtn.innerHTML = '&times;';
    delBtn.title = '删除';
    delBtn.addEventListener('click', function () {
      item.style.transition = 'all 0.3s var(--ease-smooth)';
      item.style.opacity = '0';
      item.style.transform = 'translateY(-8px)';
      setTimeout(function () {
        item.remove();
        saveCharacterGallery();
        var state = getGalleryState();
        renderGalleryItems(state);
      }, 280);
    });

    var imgWrap = document.createElement('div');
    imgWrap.className = 'gallery-image-wrap';

    var placeholder = document.createElement('span');
    placeholder.className = 'gallery-image-placeholder';
    placeholder.textContent = '+ 上传图片到当前分区';

    var img = document.createElement('img');
    img.alt = '画廊图片';
    img.style.display = 'none';

    if (src) {
      img.src = src;
      img.style.display = 'block';
      placeholder.style.display = 'none';
      imgWrap.classList.add('has-image');
    }

    var input = document.createElement('input');
    input.type = 'file';
    input.className = 'gallery-image-input';
    input.accept = 'image/*';
    input.addEventListener('change', function (e) {
      var file = e.target.files[0];
      handleImageUpload(file, function (dataUrl) {
        img.src = dataUrl;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        imgWrap.classList.add('has-image');
        saveCharacterGallery();
        var state = getGalleryState();
        renderGalleryItems(state);
      });
      input.value = '';
    });

    imgWrap.appendChild(placeholder);
    imgWrap.appendChild(img);
    imgWrap.appendChild(input);

    var info = document.createElement('div');
    info.className = 'gallery-item-info';

    var nameEl = document.createElement('div');
    nameEl.className = 'gallery-item-name';
    nameEl.setAttribute('contenteditable', 'true');
    nameEl.setAttribute('data-placeholder', '图片名称……');
    nameEl.innerHTML = name || '';
    nameEl.addEventListener('blur', saveCharacterGallery);

    var priceWrap = document.createElement('div');
    priceWrap.className = 'gallery-item-price';

    var symbol = document.createElement('span');
    symbol.className = 'price-symbol';
    symbol.textContent = '¥';

    var priceEl = document.createElement('div');
    priceEl.className = 'price-input';
    priceEl.setAttribute('contenteditable', 'true');
    priceEl.setAttribute('data-placeholder', '价格');
    priceEl.innerHTML = price || '';
    priceEl.addEventListener('blur', saveCharacterGallery);

    priceWrap.appendChild(symbol);
    priceWrap.appendChild(priceEl);

    info.appendChild(nameEl);
    info.appendChild(priceWrap);

    // 由此入画按钮
    var actions = document.createElement('div');
    actions.className = 'gallery-item-actions';

    var enterBtn = document.createElement('button');
    enterBtn.className = 'gallery-item-story-btn';
    enterBtn.textContent = '由此入画';
    enterBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      saveCharacterGallery();
      var list = item.parentElement;
      var itemIndex = list ? Array.prototype.indexOf.call(list.children, item) : -1;
      openGalleryItemStory(currentGallerySectionIndex(), itemIndex);
    });

    actions.appendChild(enterBtn);
    info.appendChild(actions);

    item.appendChild(delBtn);
    item.appendChild(imgWrap);
    item.appendChild(info);

    return item;
  }

  function addGalleryItem() {
    var list = document.getElementById('gallery-list');
    var empty = document.getElementById('gallery-section-empty');
    if (!list) return;
    if (empty) empty.classList.remove('visible');

    var item = createGalleryItem('', '', '');
    item.style.opacity = '0';
    item.style.transform = 'translateY(10px)';
    list.appendChild(item);
    requestAnimationFrame(function () {
      item.style.transition = 'all 0.35s var(--ease-smooth)';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    });
  }

  // ── 角色故事：章节数据规范化 ──────────────────────────────────
  function normalizeStoryData(story) {
    // 新格式：{ chapters: [{title, content}] }
    if (story && typeof story === 'object' && story.chapters) {
      return {
        chapters: story.chapters.map(function (ch) {
          return { title: ch.title || '', content: ch.content || '' };
        })
      };
    }
    // 旧格式：纯字符串 → 迁移为第一章
    if (typeof story === 'string' && story) {
      return { chapters: [{ title: '第一章', content: story }] };
    }
    // 空字符串 / null / undefined → 空章节数组
    return { chapters: [] };
  }

  function openCharacterStory() {
    var char = getCurrentCharacter();
    if (!char) return;

    var pageTitle = document.getElementById('character-story-page-title');
    if (pageTitle) pageTitle.textContent = (char.name || '未命名角色') + ' · 故事';

    renderChapterList(char.story);

    if (window.OCEdit && window.OCEdit.onCharacterStoryOpen) {
      window.OCEdit.onCharacterStoryOpen();
    }
  }

  function renderChapterList(story) {
    var listEl = document.getElementById('chapter-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    var chapters = normalizeStoryData(story).chapters;
    chapters.forEach(function (ch, idx) {
      listEl.appendChild(createChapterCard(ch, idx));
    });
  }

  function createChapterCard(chapter, index) {
    var card = document.createElement('div');
    card.className = 'chapter-card';
    card.setAttribute('data-index', String(index));

    // 序号
    var numberEl = document.createElement('div');
    numberEl.className = 'chapter-card-number';
    numberEl.textContent = index + 1;

    // 内容区
    var contentEl = document.createElement('div');
    contentEl.className = 'chapter-card-content';

    var titleEl = document.createElement('div');
    titleEl.className = 'chapter-card-title';
    titleEl.textContent = chapter.title || '未命名章节';

    var previewEl = document.createElement('div');
    previewEl.className = 'chapter-card-preview';
    // 提取纯文本前80字作为预览
    var previewText = chapter.content ? chapter.content.replace(/<[^>]+>/g, '').substring(0, 80) : '暂无内容……';
    previewEl.textContent = previewText;

    contentEl.appendChild(titleEl);
    contentEl.appendChild(previewEl);

    // 删除按钮
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'chapter-card-delete';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = '删除章节';
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteChapter(index);
    });

    card.appendChild(numberEl);
    card.appendChild(contentEl);
    card.appendChild(deleteBtn);

    // 点击进入章节编辑页
    card.addEventListener('click', function (e) {
      if (e.target === deleteBtn || deleteBtn.contains(e.target)) return;
      openChapterEditor(index);
    });

    return card;
  }

  function addChapter() {
    var char = getCurrentCharacter();
    if (!char) return;

    var story = normalizeStoryData(char.story);
    story.chapters.push({ title: '', content: '' });
    updateCurrentCharacter({ story: story });

    renderChapterList(story);

    // 自动打开新章节编辑页
    openChapterEditor(story.chapters.length - 1);
  }

  function deleteChapter(index) {
    var char = getCurrentCharacter();
    if (!char) return;

    var story = normalizeStoryData(char.story);
    story.chapters.splice(index, 1);
    updateCurrentCharacter({ story: story });

    renderChapterList(story);
  }

  function openChapterEditor(index) {
    var char = getCurrentCharacter();
    if (!char) return;

    saveCurrentCharacter();

    var story = normalizeStoryData(char.story);
    var chapter = story.chapters[index];
    if (!chapter) return;

    currentEditingChapterIndex = index;

    var pageTitle = document.getElementById('character-chapter-edit-page-title');
    var titleEl = document.getElementById('chapter-edit-title');
    var bodyEl = document.getElementById('chapter-edit-body');

    if (pageTitle) pageTitle.textContent = (char.name || '未命名角色') + ' · ' + (chapter.title || '第' + (index + 1) + '章');
    if (titleEl) titleEl.innerHTML = chapter.title || '';
    if (bodyEl) bodyEl.innerHTML = chapter.content || '';

    if (window.OCEdit && window.OCEdit.onChapterEditOpen) {
      window.OCEdit.onChapterEditOpen();
    }
  }

  function saveChapterEdit() {
    if (!currentTimeline || currentEditingCharIndex < 0 || currentEditingChapterIndex < 0) return;

    var titleEl = document.getElementById('chapter-edit-title');
    var bodyEl = document.getElementById('chapter-edit-body');
    if (!titleEl && !bodyEl) return;

    var char = getCurrentCharacter();
    if (!char) return;

    var story = normalizeStoryData(char.story);
    if (!story.chapters[currentEditingChapterIndex]) return;

    if (titleEl) story.chapters[currentEditingChapterIndex].title = titleEl.innerHTML;
    if (bodyEl) story.chapters[currentEditingChapterIndex].content = bodyEl.innerHTML;

    updateCurrentCharacter({ story: story });
  }

  function saveCharacterStory() {
    // 章节列表页无需额外保存，章节编辑页由 saveChapterEdit 处理
  }

  function openCharacterProfile() {
    var char = getCurrentCharacter();
    if (!char) return;

    var profile = char.profile || {};
    var pageTitle = document.getElementById('character-profile-page-title');

    if (pageTitle) pageTitle.textContent = (char.name || '未命名角色') + ' · 档案';

    var fields = {
      'profile-gender': profile.gender || '',
      'profile-age': profile.age || '',
      'profile-race': profile.race || '',
      'profile-height': profile.height || '',
      'profile-occupation': profile.occupation || '',
      'profile-personality': profile.personality || '',
      'profile-background': profile.background || '',
      'profile-notes': profile.notes || ''
    };

    Object.keys(fields).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = fields[id];
    });

    // 渲染能力列表 + 雷达图
    var abilities = char.abilities || DEFAULT_ABILITIES;
    abilitiesCache = abilities;
    renderAbilitiesList(abilities);
    drawRadarChart(abilities);

    if (window.OCEdit && window.OCEdit.onCharacterProfileOpen) {
      window.OCEdit.onCharacterProfileOpen();
    }
  }

  function saveCharacterProfile() {
    var profile = {};
    var map = {
      'profile-gender': 'gender',
      'profile-age': 'age',
      'profile-race': 'race',
      'profile-height': 'height',
      'profile-occupation': 'occupation',
      'profile-personality': 'personality',
      'profile-background': 'background',
      'profile-notes': 'notes'
    };

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) profile[map[id]] = el.innerHTML;
    });

    updateCurrentCharacter({ profile: profile });
  }

  // ── 角色能力属性（六维图）──────────────────────────────────────
  function renderAbilitiesList(abilities) {
    var listEl = document.getElementById('abilities-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    abilities.forEach(function (ab, idx) {
      var row = document.createElement('div');
      row.className = 'ability-row';
      row.setAttribute('data-index', String(idx));

      // 标签（可编辑）
      var labelEl = document.createElement('div');
      labelEl.className = 'ability-label';
      labelEl.setAttribute('contenteditable', 'true');
      labelEl.setAttribute('data-placeholder', '属性名');
      labelEl.setAttribute('data-index', String(idx));
      labelEl.textContent = ab.name || '';
      labelEl.addEventListener('blur', function () {
        saveAbilityName(idx, labelEl.textContent);
      });

      // 滑块
      var sliderWrap = document.createElement('div');
      sliderWrap.className = 'ability-slider-wrap';

      var slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'ability-slider';
      slider.min = '0';
      slider.max = '100';
      slider.value = String(ab.value || 50);
      slider.setAttribute('data-index', String(idx));

      var valueSpan = document.createElement('span');
      valueSpan.className = 'ability-value';
      valueSpan.textContent = ab.value || 50;

      slider.addEventListener('input', function () {
        valueSpan.textContent = slider.value;
        // 仅更新内存 + 重绘雷达图，不写存储（拖动时高频调用）
        updateAbilityInMemory(idx, parseInt(slider.value, 10));
      });

      slider.addEventListener('change', function () {
        // 拖动结束 / 点击时才真正写入存储
        saveAbilityValue(idx, parseInt(slider.value, 10));
      });

      sliderWrap.appendChild(slider);
      sliderWrap.appendChild(valueSpan);

      // 删除按钮
      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'ability-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = '删除属性';
      deleteBtn.addEventListener('click', function () {
        deleteAbility(idx);
      });

      row.appendChild(labelEl);
      row.appendChild(sliderWrap);
      row.appendChild(deleteBtn);
      listEl.appendChild(row);
    });
  }

  // 内存中的能力缓存，避免每次 input 事件都读存储
  var abilitiesCache = null;

  function updateAbilityInMemory(index, value) {
    if (!abilitiesCache || !abilitiesCache[index]) return;
    abilitiesCache[index].value = value;
    drawRadarChart(abilitiesCache);
  }

  function updateAbilityNameInMemory(index, name) {
    if (!abilitiesCache || !abilitiesCache[index]) return;
    abilitiesCache[index].name = name;
    drawRadarChart(abilitiesCache);
  }

  function saveAbilityName(index, name) {
    var char = getCurrentCharacter();
    if (!char) return;
    var abilities = char.abilities || [];
    if (abilities[index]) {
      abilities[index].name = name;
      updateCurrentCharacter({ abilities: abilities });
      abilitiesCache = abilities;
      drawRadarChart(abilities);
    }
  }

  function saveAbilityValue(index, value) {
    var char = getCurrentCharacter();
    if (!char) return;
    var abilities = char.abilities || [];
    if (abilities[index]) {
      abilities[index].value = value;
      updateCurrentCharacter({ abilities: abilities });
      abilitiesCache = abilities;
      drawRadarChart(abilities);
    }
  }

  function addAbility() {
    var char = getCurrentCharacter();
    if (!char) return;
    var abilities = char.abilities || [];
    abilities.push({ name: '', value: 50 });
    updateCurrentCharacter({ abilities: abilities });
    abilitiesCache = abilities;
    renderAbilitiesList(abilities);
    drawRadarChart(abilities);
  }

  function deleteAbility(index) {
    var char = getCurrentCharacter();
    if (!char) return;
    var abilities = char.abilities || [];
    abilities.splice(index, 1);
    updateCurrentCharacter({ abilities: abilities });
    abilitiesCache = abilities;
    renderAbilitiesList(abilities);
    drawRadarChart(abilities);
  }

  // ── 雷达图 SVG 绘制 ────────────────────────────────────────────
  function drawRadarChart(abilities) {
    var svg = document.getElementById('radar-chart-svg');
    if (!svg) return;

    var n = abilities.length;
    if (n < 3) {
      // 少于3个维度时显示提示
      svg.innerHTML = '';
      var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '100');
      textEl.setAttribute('y', '105');
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('fill', 'rgba(160,140,200,0.5)');
      textEl.setAttribute('font-size', '12');
      textEl.textContent = '至少需要3项属性';
      svg.appendChild(textEl);
      return;
    }

    var cx = 100, cy = 100, maxR = 80;
    var levels = 5;

    // 计算各维度角度
    var angleStep = (2 * Math.PI) / n;
    var startAngle = -Math.PI / 2; // 从顶部开始

    function getPoint(angle, radius) {
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      };
    }

    // 清空 SVG
    svg.innerHTML = '';

    // 画同心网格（5层）
    for (var lv = 1; lv <= levels; lv++) {
      var r = (maxR / levels) * lv;
      var points = [];
      for (var i = 0; i < n; i++) {
        var angle = startAngle + angleStep * i;
        points.push(getPoint(angle, r));
      }

      var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      var ptsStr = points.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
      polygon.setAttribute('points', ptsStr);
      polygon.setAttribute('fill', lv === levels ? 'rgba(248,246,252,0.3)' : 'none');
      polygon.setAttribute('stroke', 'rgba(160,140,200,0.18)');
      polygon.setAttribute('stroke-width', '0.8');
      svg.appendChild(polygon);
    }

    // 画轴线
    for (var i = 0; i < n; i++) {
      var angle = startAngle + angleStep * i;
      var outer = getPoint(angle, maxR);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(cx));
      line.setAttribute('y1', String(cy));
      line.setAttribute('x2', String(outer.x.toFixed(1)));
      line.setAttribute('y2', String(outer.y.toFixed(1)));
      line.setAttribute('stroke', 'rgba(160,140,200,0.18)');
      line.setAttribute('stroke-width', '0.8');
      svg.appendChild(line);
    }

    // 画数据区域
    var dataPoints = [];
    for (var i = 0; i < n; i++) {
      var angle = startAngle + angleStep * i;
      var val = Math.max(0, Math.min(100, abilities[i].value || 50));
      var r = (val / 100) * maxR;
      dataPoints.push(getPoint(angle, r));
    }

    var dataPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    var dataPtsStr = dataPoints.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    dataPolygon.setAttribute('points', dataPtsStr);
    dataPolygon.setAttribute('fill', 'rgba(200,170,100,0.15)');
    dataPolygon.setAttribute('stroke', 'rgba(200,170,100,0.65)');
    dataPolygon.setAttribute('stroke-width', '1.5');
    svg.appendChild(dataPolygon);

    // 画数据点
    dataPoints.forEach(function (p) {
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', p.x.toFixed(1));
      dot.setAttribute('cy', p.y.toFixed(1));
      dot.setAttribute('r', '2.5');
      dot.setAttribute('fill', 'rgba(200,170,100,0.9)');
      svg.appendChild(dot);
    });

    // 画标签
    for (var i = 0; i < n; i++) {
      var angle = startAngle + angleStep * i;
      var labelPt = getPoint(angle, maxR + 16);

      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelPt.x.toFixed(1));
      text.setAttribute('y', labelPt.y.toFixed(1));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', 'rgba(200,170,100,0.75)');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-family', 'ZCOOL XiaoWei, serif');
      text.setAttribute('letter-spacing', '1');
      text.textContent = abilities[i].name || '?';
      svg.appendChild(text);
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  组织与势力专用编辑器（扁平词条模型）
  //  每个词条自带 parentCategory（总分类）和 subCategory（子分类）标签，
  //  左侧树按这两个标签动态分组，四个编辑框全部可编辑。
  // ═══════════════════════════════════════════════════════════════

  var currentFactions = null;   // { entries: [{ id, name, content, parentCategory, subCategory }] }
  var currentFactionsSelection = null; // { entryId: string|null }

  function generateId() {
    return 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  }

  function getPlainText(el) {
    return (el && el.textContent || '').trim();
  }

  function normalizeLabel(name) {
    return String(name || '').replace(/<[^>]+>/g, '').trim();
  }

  /* ── 数据格式兼容 ─────────────────────────────────────────── */

  function normalizeFactionsData(raw) {
    // 新格式：扁平词条列表
    if (raw && typeof raw === 'object' && Array.isArray(raw.entries)) {
      return {
        entries: raw.entries.map(function (e) {
          return {
            id: e.id || generateId(),
            name: e.name || '未命名词条',
            content: e.content || '',
            parentCategory: normalizeLabel(e.parentCategory),
            subCategory: normalizeLabel(e.subCategory)
          };
        })
      };
    }
    // 旧格式一：categories + entries（词条直接挂在总分类下，带 subCategory 标签）
    if (raw && typeof raw === 'object' && Array.isArray(raw.categories)) {
      var entries = [];
      raw.categories.forEach(function (cat) {
        var pCat = normalizeLabel(cat.name) || '未分类';
        if (Array.isArray(cat.entries)) {
          cat.entries.forEach(function (e) {
            entries.push({
              id: e.id || generateId(),
              name: e.name || '未命名词条',
              content: e.content || '',
              parentCategory: pCat,
              subCategory: normalizeLabel(e.subCategory)
            });
          });
        }
        // 旧格式二：categories + subCategories → entries
        if (Array.isArray(cat.subCategories)) {
          cat.subCategories.forEach(function (sub) {
            (sub.entries || []).forEach(function (e) {
              entries.push({
                id: e.id || generateId(),
                name: e.name || '未命名词条',
                content: e.content || '',
                parentCategory: pCat,
                subCategory: normalizeLabel(sub.name) || '未命名子分类'
              });
            });
          });
        }
      });
      return { entries: entries };
    }
    // 最旧格式：纯文本 → 迁移为一条词条
    var migratedContent = '';
    if (typeof raw === 'string') migratedContent = raw;
    else if (raw && typeof raw === 'object' && typeof raw.content === 'string') migratedContent = raw.content;
    if (migratedContent) {
      return {
        entries: [{
          id: generateId(),
          name: '未命名词条',
          content: migratedContent,
          parentCategory: '未分类',
          subCategory: ''
        }]
      };
    }
    // 全新：空列表
    return { entries: [] };
  }

  /* ── 存档读写 ─────────────────────────────────────────── */

  function getFactionsFieldName() {
    if (!currentTimeline) return null;
    var cfg = getTimelineConfig(currentTimeline);
    if (!cfg) return null;
    return 'timeline' + cfg.fieldSuffix + 'Factions';
  }

  function loadFactions() {
    var archive = loadArchive();
    var fieldName = getFactionsFieldName();
    var raw = (archive && archive.data && fieldName) ? archive.data[fieldName] : null;
    currentFactions = normalizeFactionsData(raw);
    return currentFactions;
  }

  function saveFactions() {
    var fieldName = getFactionsFieldName();
    if (!fieldName) return;
    var archive = loadArchive() || { version: 1, data: {} };
    if (!archive.data) archive.data = {};
    archive.data[fieldName] = currentFactions;
    try {
      window.ocStorage.set('chuxiyan_oc_archive', archive);
    } catch (e) {
      console.error('组织与势力存档保存失败:', e);
    }
  }

  /* ── 选中与查找 ─────────────────────────────────────────── */

  function getSelectedFactionsEntry() {
    if (!currentFactions || !currentFactionsSelection || !currentFactionsSelection.entryId) return null;
    return currentFactions.entries.find(function (e) { return e.id === currentFactionsSelection.entryId; });
  }

  function selectFactionsEntry(entryId) {
    currentFactionsSelection = { entryId: entryId || null };
    highlightFactionsTree();
    renderFactionsEditor();
  }

  /* ── 树渲染 ─────────────────────────────────────────────── */

  function renderFactionsTree() {
    var treeEl = document.getElementById('factions-tree');
    if (!treeEl) return;
    treeEl.innerHTML = '';

    if (!currentFactions || !currentFactions.entries.length) {
      treeEl.innerHTML = '<div class="factions-tree-empty">暂无词条，点击上方按钮新建词条</div>';
      return;
    }

    // 按 parentCategory → subCategory 分组，保持首次出现顺序
    var parentOrder = [];
    var parentGroups = {};
    currentFactions.entries.forEach(function (entry) {
      var pCat = entry.parentCategory || '未分类';
      if (!parentGroups[pCat]) {
        parentGroups[pCat] = { subOrder: [], subGroups: {}, ungrouped: [] };
        parentOrder.push(pCat);
      }
      var group = parentGroups[pCat];
      var sub = entry.subCategory || '';
      if (sub) {
        if (!group.subGroups[sub]) {
          group.subGroups[sub] = [];
          group.subOrder.push(sub);
        }
        group.subGroups[sub].push(entry);
      } else {
        group.ungrouped.push(entry);
      }
    });

    parentOrder.forEach(function (pCat) {
      var parentItem = createFactionsTreeItem(pCat, 'parent', pCat, null, null);
      treeEl.appendChild(parentItem);
      var parentChildren = parentItem.querySelector('.factions-tree-children');

      var group = parentGroups[pCat];
      group.subOrder.forEach(function (sub) {
        var subItem = createFactionsTreeItem(sub, 'sub', pCat, sub, null);
        if (parentChildren) parentChildren.appendChild(subItem);
        var subChildren = subItem.querySelector('.factions-tree-children');
        group.subGroups[sub].forEach(function (entry) {
          var entryItem = createFactionsTreeItem(entry.name, 'entry', pCat, sub, entry.id);
          if (subChildren) subChildren.appendChild(entryItem);
        });
      });

      group.ungrouped.forEach(function (entry) {
        var entryItem = createFactionsTreeItem(entry.name, 'entry', pCat, '', entry.id);
        if (parentChildren) parentChildren.appendChild(entryItem);
      });
    });

    highlightFactionsTree();
  }

  function createFactionsTreeItem(name, type, groupId, subId, entryId) {
    var item = document.createElement('div');
    item.className = 'factions-tree-item factions-tree-' + type;
    item.setAttribute('data-type', type);
    item.setAttribute('data-group-id', groupId === null ? '' : String(groupId));
    item.setAttribute('data-sub-id', subId === null ? '' : String(subId));
    item.setAttribute('data-entry-id', entryId === null ? '' : String(entryId));

    var labelWrap = document.createElement('div');
    labelWrap.className = 'factions-tree-label';

    var expander = document.createElement('span');
    expander.className = 'factions-tree-expander';
    if (type === 'entry') {
      expander.className += ' empty';
    } else {
      expander.textContent = '▼';
    }
    expander.addEventListener('click', function (e) {
      e.stopPropagation();
      if (type === 'entry') return;
      item.classList.toggle('collapsed');
      expander.textContent = item.classList.contains('collapsed') ? '▶' : '▼';
    });

    var icon = document.createElement('span');
    icon.className = 'factions-tree-icon';
    if (type === 'parent') icon.textContent = '◆';
    else if (type === 'sub') icon.textContent = '◇';
    else icon.textContent = '•';

    var label = document.createElement('span');
    label.className = 'factions-tree-name';
    label.textContent = name || '未命名';

    labelWrap.appendChild(expander);
    labelWrap.appendChild(icon);
    labelWrap.appendChild(label);

    // 操作按钮：词条有删除，分组节点无操作
    if (type === 'entry') {
      var actions = document.createElement('div');
      actions.className = 'factions-tree-actions';
      var delBtn = document.createElement('button');
      delBtn.className = 'factions-tree-action-btn delete';
      delBtn.textContent = '×';
      delBtn.title = '删除词条';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteFactionsEntry(entryId);
      });
      actions.appendChild(delBtn);
      labelWrap.appendChild(actions);
    }

    item.appendChild(labelWrap);

    // 子项容器
    if (type !== 'entry') {
      var children = document.createElement('div');
      children.className = 'factions-tree-children';
      item.appendChild(children);
    }

    // 点击行为：词条→选中，分组→展开/折叠
    labelWrap.addEventListener('click', function () {
      if (type === 'entry') {
        selectFactionsEntry(entryId);
      } else {
        item.classList.toggle('collapsed');
        expander.textContent = item.classList.contains('collapsed') ? '▶' : '▼';
      }
    });

    return item;
  }

  function highlightFactionsTree() {
    var items = document.querySelectorAll('.factions-tree-item');
    items.forEach(function (item) { item.classList.remove('active'); });
    if (!currentFactionsSelection || !currentFactionsSelection.entryId) return;
    items.forEach(function (item) {
      if (item.dataset.type === 'entry' && item.dataset.entryId === currentFactionsSelection.entryId) {
        item.classList.add('active');
      }
    });
  }

  /* ── 编辑区 ─────────────────────────────────────────────── */

  function renderFactionsEditor() {
    var parentInput = document.getElementById('factions-parent-category');
    var subInput = document.getElementById('factions-sub-category');
    var entryNameInput = document.getElementById('factions-entry-name');
    var contentEl = document.getElementById('factions-entry-content');

    var entry = getSelectedFactionsEntry();

    if (!entry) {
      if (parentInput) parentInput.textContent = '';
      if (subInput) subInput.textContent = '';
      if (entryNameInput) entryNameInput.textContent = '';
      if (contentEl) contentEl.innerHTML = '';
      setEditorEditable(parentInput, false);
      setEditorEditable(subInput, false);
      setEditorEditable(entryNameInput, false);
      setEditorEditable(contentEl, false);
      return;
    }

    // 词条选中 → 四个框全部可编辑
    if (parentInput) parentInput.textContent = entry.parentCategory || '';
    if (subInput) subInput.textContent = entry.subCategory || '';
    if (entryNameInput) entryNameInput.textContent = entry.name || '';
    if (contentEl) contentEl.innerHTML = entry.content || '';

    setEditorEditable(parentInput, true);
    setEditorEditable(subInput, true);
    setEditorEditable(entryNameInput, true);
    setEditorEditable(contentEl, true);
  }

  function setEditorEditable(el, editable) {
    if (!el) return;
    el.setAttribute('contenteditable', editable ? 'true' : 'false');
  }

  function saveCurrentFactionsState() {
    if (!currentFactions) return;
    var entry = getSelectedFactionsEntry();
    if (!entry) return;

    var parentInput = document.getElementById('factions-parent-category');
    var subInput = document.getElementById('factions-sub-category');
    var entryNameInput = document.getElementById('factions-entry-name');
    var contentEl = document.getElementById('factions-entry-content');

    if (parentInput) entry.parentCategory = normalizeLabel(getPlainText(parentInput));
    if (subInput) entry.subCategory = normalizeLabel(getPlainText(subInput));
    if (entryNameInput) entry.name = getPlainText(entryNameInput) || entry.name;
    if (contentEl) entry.content = contentEl.innerHTML;

    saveFactions();
    renderFactionsTree();
  }

  /* ── 增删 ─────────────────────────────────────────────── */

  function addFactionsEntryFromButton() {
    if (!currentFactions) return;
    saveCurrentFactionsState();

    var currentEntry = getSelectedFactionsEntry();

    var newEntry = {
      id: generateId(),
      name: '新词条',
      content: '',
      parentCategory: currentEntry ? currentEntry.parentCategory : '',
      subCategory: currentEntry ? currentEntry.subCategory : ''
    };

    currentFactions.entries.push(newEntry);
    saveFactions();
    renderFactionsTree();
    selectFactionsEntry(newEntry.id);
  }

  function deleteFactionsEntry(entryId) {
    if (!currentFactions) return;
    currentFactions.entries = currentFactions.entries.filter(function (e) { return e.id !== entryId; });
    saveFactions();
    renderFactionsTree();

    if (currentFactions.entries.length === 0) {
      currentFactionsSelection = null;
      renderFactionsEditor();
      return;
    }
    // 选择邻近词条
    var nearest = currentFactions.entries[0];
    selectFactionsEntry(nearest.id);
  }

  /* ── 初始化 ─────────────────────────────────────────────── */

  function initFactionsEditor() {
    var addBtn = document.getElementById('factions-add-entry-btn');
    var parentInput = document.getElementById('factions-parent-category');
    var subInput = document.getElementById('factions-sub-category');
    var entryNameInput = document.getElementById('factions-entry-name');
    var contentEl = document.getElementById('factions-entry-content');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addFactionsEntryFromButton();
      });
    }

    [parentInput, subInput, entryNameInput, contentEl].forEach(function (el) {
      if (el) {
        el.addEventListener('blur', function () {
          saveCurrentFactionsState();
        });
      }
    });
  }

  function openFactionsEditor() {
    var textEditor = document.getElementById('section-text-editor');
    var factionsEditor = document.getElementById('factions-editor');
    var magicEditor = document.getElementById('magic-editor');
    var wikiEditor = document.getElementById('wiki-editor');
    var contentEl = document.getElementById('section-editor-content');
    if (textEditor) textEditor.classList.add('hidden');
    if (magicEditor) magicEditor.classList.add('hidden');
    if (wikiEditor) wikiEditor.classList.add('hidden');
    if (factionsEditor) factionsEditor.classList.remove('hidden');
    if (contentEl) contentEl.removeAttribute('data-field');

    loadFactions();
    renderFactionsTree();

    if (currentFactions && currentFactions.entries.length) {
      selectFactionsEntry(currentFactions.entries[0].id);
    } else {
      currentFactionsSelection = null;
      renderFactionsEditor();
    }
  }

  function closeFactionsEditor() {
    var textEditor = document.getElementById('section-text-editor');
    var factionsEditor = document.getElementById('factions-editor');
    if (textEditor) textEditor.classList.remove('hidden');
    if (factionsEditor) factionsEditor.classList.add('hidden');
  }


  // ═══════════════════════════════════════════════════════════════
  //  世界百科专用编辑器（扁平词条模型，与组织与势力相同）
  // ═══════════════════════════════════════════════════════════════

  var currentWiki = null;   // { entries: [{ id, name, content, parentCategory, subCategory }] }
  var currentWikiSelection = null; // { entryId: string|null }

  function getWikiFieldName() {
    if (!currentTimeline) return null;
    var cfg = getTimelineConfig(currentTimeline);
    if (!cfg) return null;
    return 'timeline' + cfg.fieldSuffix + 'Wiki';
  }

  function loadWiki() {
    var archive = loadArchive();
    var fieldName = getWikiFieldName();
    var raw = (archive && archive.data && fieldName) ? archive.data[fieldName] : null;
    currentWiki = normalizeWikiData(raw);
    return currentWiki;
  }

  function saveWiki() {
    var fieldName = getWikiFieldName();
    if (!fieldName) return;
    var archive = loadArchive() || { version: 1, data: {} };
    if (!archive.data) archive.data = {};
    archive.data[fieldName] = currentWiki;
    try {
      window.ocStorage.set('chuxiyan_oc_archive', archive);
    } catch (e) {
      console.error('世界百科存档保存失败:', e);
    }
  }

  function normalizeWikiData(raw) {
    // 新格式：扁平词条列表
    if (raw && typeof raw === 'object' && Array.isArray(raw.entries)) {
      return {
        entries: raw.entries.map(function (e) {
          return {
            id: e.id || generateId(),
            name: e.name || '未命名词条',
            content: e.content || '',
            parentCategory: normalizeLabel(e.parentCategory),
            subCategory: normalizeLabel(e.subCategory)
          };
        })
      };
    }
    // 旧格式一：categories + entries
    if (raw && typeof raw === 'object' && Array.isArray(raw.categories)) {
      var entries = [];
      raw.categories.forEach(function (cat) {
        var pCat = normalizeLabel(cat.name) || '未分类';
        if (Array.isArray(cat.entries)) {
          cat.entries.forEach(function (e) {
            entries.push({
              id: e.id || generateId(),
              name: e.name || '未命名词条',
              content: e.content || '',
              parentCategory: pCat,
              subCategory: normalizeLabel(e.subCategory)
            });
          });
        }
        if (Array.isArray(cat.subCategories)) {
          cat.subCategories.forEach(function (sub) {
            (sub.entries || []).forEach(function (e) {
              entries.push({
                id: e.id || generateId(),
                name: e.name || '未命名词条',
                content: e.content || '',
                parentCategory: pCat,
                subCategory: normalizeLabel(sub.name) || '未命名子分类'
              });
            });
          });
        }
      });
      return { entries: entries };
    }
    // 最旧格式：纯文本 → 迁移为一条词条
    var migratedContent = '';
    if (typeof raw === 'string') migratedContent = raw;
    else if (raw && typeof raw === 'object' && typeof raw.content === 'string') migratedContent = raw.content;
    if (migratedContent) {
      return {
        entries: [{
          id: generateId(),
          name: '未命名词条',
          content: migratedContent,
          parentCategory: '未分类',
          subCategory: ''
        }]
      };
    }
    return { entries: [] };
  }

  function getSelectedWikiEntry() {
    if (!currentWiki || !currentWikiSelection || !currentWikiSelection.entryId) return null;
    return currentWiki.entries.find(function (e) { return e.id === currentWikiSelection.entryId; });
  }

  function selectWikiEntry(entryId) {
    currentWikiSelection = { entryId: entryId || null };
    highlightWikiTree();
    renderWikiEditor();
  }

  function renderWikiTree() {
    var treeEl = document.getElementById('wiki-tree');
    if (!treeEl) return;
    treeEl.innerHTML = '';

    if (!currentWiki || !currentWiki.entries.length) {
      treeEl.innerHTML = '<div class="factions-tree-empty">暂无词条，点击上方按钮新建词条</div>';
      return;
    }

    var parentOrder = [];
    var parentGroups = {};
    currentWiki.entries.forEach(function (entry) {
      var pCat = entry.parentCategory || '未分类';
      if (!parentGroups[pCat]) {
        parentGroups[pCat] = { subOrder: [], subGroups: {}, ungrouped: [] };
        parentOrder.push(pCat);
      }
      var group = parentGroups[pCat];
      var sub = entry.subCategory || '';
      if (sub) {
        if (!group.subGroups[sub]) {
          group.subGroups[sub] = [];
          group.subOrder.push(sub);
        }
        group.subGroups[sub].push(entry);
      } else {
        group.ungrouped.push(entry);
      }
    });

    parentOrder.forEach(function (pCat) {
      var parentItem = createWikiTreeItem(pCat, 'parent', pCat, null, null);
      treeEl.appendChild(parentItem);
      var parentChildren = parentItem.querySelector('.factions-tree-children');

      var group = parentGroups[pCat];
      group.subOrder.forEach(function (sub) {
        var subItem = createWikiTreeItem(sub, 'sub', pCat, sub, null);
        if (parentChildren) parentChildren.appendChild(subItem);
        var subChildren = subItem.querySelector('.factions-tree-children');
        group.subGroups[sub].forEach(function (entry) {
          var entryItem = createWikiTreeItem(entry.name, 'entry', pCat, sub, entry.id);
          if (subChildren) subChildren.appendChild(entryItem);
        });
      });

      group.ungrouped.forEach(function (entry) {
        var entryItem = createWikiTreeItem(entry.name, 'entry', pCat, '', entry.id);
        if (parentChildren) parentChildren.appendChild(entryItem);
      });
    });

    highlightWikiTree();
  }

  function createWikiTreeItem(name, type, groupId, subId, entryId) {
    var item = document.createElement('div');
    item.className = 'factions-tree-item factions-tree-' + type;
    item.setAttribute('data-type', type);
    item.setAttribute('data-group-id', groupId === null ? '' : String(groupId));
    item.setAttribute('data-sub-id', subId === null ? '' : String(subId));
    item.setAttribute('data-entry-id', entryId === null ? '' : String(entryId));

    var labelWrap = document.createElement('div');
    labelWrap.className = 'factions-tree-label';

    var expander = document.createElement('span');
    expander.className = 'factions-tree-expander';
    if (type === 'entry') {
      expander.className += ' empty';
    } else {
      expander.textContent = '▼';
    }
    expander.addEventListener('click', function (e) {
      e.stopPropagation();
      if (type === 'entry') return;
      item.classList.toggle('collapsed');
      expander.textContent = item.classList.contains('collapsed') ? '▶' : '▼';
    });

    var icon = document.createElement('span');
    icon.className = 'factions-tree-icon';
    if (type === 'parent') icon.textContent = '◆';
    else if (type === 'sub') icon.textContent = '◇';
    else icon.textContent = '•';

    var label = document.createElement('span');
    label.className = 'factions-tree-name';
    label.textContent = name || '未命名';

    labelWrap.appendChild(expander);
    labelWrap.appendChild(icon);
    labelWrap.appendChild(label);

    if (type === 'entry') {
      var actions = document.createElement('div');
      actions.className = 'factions-tree-actions';
      var delBtn = document.createElement('button');
      delBtn.className = 'factions-tree-action-btn delete';
      delBtn.textContent = '×';
      delBtn.title = '删除词条';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteWikiEntry(entryId);
      });
      actions.appendChild(delBtn);
      labelWrap.appendChild(actions);
    }

    item.appendChild(labelWrap);

    if (type !== 'entry') {
      var children = document.createElement('div');
      children.className = 'factions-tree-children';
      item.appendChild(children);
    }

    labelWrap.addEventListener('click', function () {
      if (type === 'entry') {
        selectWikiEntry(entryId);
      } else {
        item.classList.toggle('collapsed');
        expander.textContent = item.classList.contains('collapsed') ? '▶' : '▼';
      }
    });

    return item;
  }

  function highlightWikiTree() {
    var treeEl = document.getElementById('wiki-tree');
    if (!treeEl) return;
    var items = treeEl.querySelectorAll('.factions-tree-item');
    items.forEach(function (item) { item.classList.remove('active'); });
    if (!currentWikiSelection || !currentWikiSelection.entryId) return;
    items.forEach(function (item) {
      if (item.dataset.type === 'entry' && item.dataset.entryId === currentWikiSelection.entryId) {
        item.classList.add('active');
      }
    });
  }

  function renderWikiEditor() {
    var parentInput = document.getElementById('wiki-parent-category');
    var subInput = document.getElementById('wiki-sub-category');
    var entryNameInput = document.getElementById('wiki-entry-name');
    var contentEl = document.getElementById('wiki-entry-content');

    var entry = getSelectedWikiEntry();

    if (!entry) {
      if (parentInput) parentInput.textContent = '';
      if (subInput) subInput.textContent = '';
      if (entryNameInput) entryNameInput.textContent = '';
      if (contentEl) contentEl.innerHTML = '';
      setEditorEditable(parentInput, false);
      setEditorEditable(subInput, false);
      setEditorEditable(entryNameInput, false);
      setEditorEditable(contentEl, false);
      return;
    }

    if (parentInput) parentInput.textContent = entry.parentCategory || '';
    if (subInput) subInput.textContent = entry.subCategory || '';
    if (entryNameInput) entryNameInput.textContent = entry.name || '';
    if (contentEl) contentEl.innerHTML = entry.content || '';

    setEditorEditable(parentInput, true);
    setEditorEditable(subInput, true);
    setEditorEditable(entryNameInput, true);
    setEditorEditable(contentEl, true);
  }

  function saveCurrentWikiState() {
    if (!currentWiki) return;
    var entry = getSelectedWikiEntry();
    if (!entry) return;

    var parentInput = document.getElementById('wiki-parent-category');
    var subInput = document.getElementById('wiki-sub-category');
    var entryNameInput = document.getElementById('wiki-entry-name');
    var contentEl = document.getElementById('wiki-entry-content');

    if (parentInput) entry.parentCategory = normalizeLabel(getPlainText(parentInput));
    if (subInput) entry.subCategory = normalizeLabel(getPlainText(subInput));
    if (entryNameInput) entry.name = getPlainText(entryNameInput) || entry.name;
    if (contentEl) entry.content = contentEl.innerHTML;

    saveWiki();
    renderWikiTree();
  }

  function addWikiEntryFromButton() {
    if (!currentWiki) return;
    saveCurrentWikiState();

    var currentEntry = getSelectedWikiEntry();

    var newEntry = {
      id: generateId(),
      name: '新词条',
      content: '',
      parentCategory: currentEntry ? currentEntry.parentCategory : '',
      subCategory: currentEntry ? currentEntry.subCategory : ''
    };

    currentWiki.entries.push(newEntry);
    saveWiki();
    renderWikiTree();
    selectWikiEntry(newEntry.id);
  }

  function deleteWikiEntry(entryId) {
    if (!currentWiki) return;
    currentWiki.entries = currentWiki.entries.filter(function (e) { return e.id !== entryId; });
    saveWiki();
    renderWikiTree();

    if (currentWiki.entries.length === 0) {
      currentWikiSelection = null;
      renderWikiEditor();
      return;
    }
    selectWikiEntry(currentWiki.entries[0].id);
  }

  function initWikiEditor() {
    var addBtn = document.getElementById('wiki-add-entry-btn');
    var parentInput = document.getElementById('wiki-parent-category');
    var subInput = document.getElementById('wiki-sub-category');
    var entryNameInput = document.getElementById('wiki-entry-name');
    var contentEl = document.getElementById('wiki-entry-content');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addWikiEntryFromButton();
      });
    }

    [parentInput, subInput, entryNameInput, contentEl].forEach(function (el) {
      if (el) {
        el.addEventListener('blur', function () {
          saveCurrentWikiState();
        });
      }
    });
  }

  function openWikiEditor() {
    var textEditor = document.getElementById('section-text-editor');
    var wikiEditor = document.getElementById('wiki-editor');
    var factionsEditor = document.getElementById('factions-editor');
    var magicEditor = document.getElementById('magic-editor');
    var contentEl = document.getElementById('section-editor-content');
    if (textEditor) textEditor.classList.add('hidden');
    if (factionsEditor) factionsEditor.classList.add('hidden');
    if (magicEditor) magicEditor.classList.add('hidden');
    if (wikiEditor) wikiEditor.classList.remove('hidden');
    if (contentEl) contentEl.removeAttribute('data-field');

    loadWiki();
    renderWikiTree();

    if (currentWiki && currentWiki.entries.length) {
      selectWikiEntry(currentWiki.entries[0].id);
    } else {
      currentWikiSelection = null;
      renderWikiEditor();
    }
  }

  function closeWikiEditor() {
    var textEditor = document.getElementById('section-text-editor');
    var wikiEditor = document.getElementById('wiki-editor');
    if (textEditor) textEditor.classList.remove('hidden');
    if (wikiEditor) wikiEditor.classList.add('hidden');
  }



  // ═══════════════════════════════════════════════════════════════
  //  魔法力量体系专用编辑器（扁平词条模型，与组织与势力相同）
  // ═══════════════════════════════════════════════════════════════

  var currentMagic = null;   // { entries: [{ id, name, content, parentCategory, subCategory }] }
  var currentMagicSelection = null; // { entryId: string|null }

  function getMagicFieldName() {
    if (!currentTimeline) return null;
    var cfg = getTimelineConfig(currentTimeline);
    if (!cfg) return null;
    return 'timeline' + cfg.fieldSuffix + 'Magic';
  }

  function loadMagic() {
    var archive = loadArchive();
    var fieldName = getMagicFieldName();
    var raw = (archive && archive.data && fieldName) ? archive.data[fieldName] : null;
    currentMagic = normalizeMagicData(raw);
    return currentMagic;
  }

  function saveMagic() {
    var fieldName = getMagicFieldName();
    if (!fieldName) return;
    var archive = loadArchive() || { version: 1, data: {} };
    if (!archive.data) archive.data = {};
    archive.data[fieldName] = currentMagic;
    try {
      window.ocStorage.set('chuxiyan_oc_archive', archive);
    } catch (e) {
      console.error('魔法力量体系存档保存失败:', e);
    }
  }

  function normalizeMagicData(raw) {
    // 新格式：扁平词条列表
    if (raw && typeof raw === 'object' && Array.isArray(raw.entries)) {
      return {
        entries: raw.entries.map(function (e) {
          return {
            id: e.id || generateId(),
            name: e.name || '未命名词条',
            content: e.content || '',
            parentCategory: normalizeLabel(e.parentCategory),
            subCategory: normalizeLabel(e.subCategory)
          };
        })
      };
    }
    // 旧格式一：categories + entries
    if (raw && typeof raw === 'object' && Array.isArray(raw.categories)) {
      var entries = [];
      raw.categories.forEach(function (cat) {
        var pCat = normalizeLabel(cat.name) || '未分类';
        if (Array.isArray(cat.entries)) {
          cat.entries.forEach(function (e) {
            entries.push({
              id: e.id || generateId(),
              name: e.name || '未命名词条',
              content: e.content || '',
              parentCategory: pCat,
              subCategory: normalizeLabel(e.subCategory)
            });
          });
        }
        if (Array.isArray(cat.subCategories)) {
          cat.subCategories.forEach(function (sub) {
            (sub.entries || []).forEach(function (e) {
              entries.push({
                id: e.id || generateId(),
                name: e.name || '未命名词条',
                content: e.content || '',
                parentCategory: pCat,
                subCategory: normalizeLabel(sub.name) || '未命名子分类'
              });
            });
          });
        }
      });
      return { entries: entries };
    }
    // 最旧格式：纯文本 → 迁移为一条词条
    var migratedContent = '';
    if (typeof raw === 'string') migratedContent = raw;
    else if (raw && typeof raw === 'object' && typeof raw.content === 'string') migratedContent = raw.content;
    if (migratedContent) {
      return {
        entries: [{
          id: generateId(),
          name: '未命名词条',
          content: migratedContent,
          parentCategory: '未分类',
          subCategory: ''
        }]
      };
    }
    return { entries: [] };
  }

  function getSelectedMagicEntry() {
    if (!currentMagic || !currentMagicSelection || !currentMagicSelection.entryId) return null;
    return currentMagic.entries.find(function (e) { return e.id === currentMagicSelection.entryId; });
  }

  function selectMagicEntry(entryId) {
    currentMagicSelection = { entryId: entryId || null };
    highlightMagicTree();
    renderMagicEditor();
  }

  function renderMagicTree() {
    var treeEl = document.getElementById('magic-tree');
    if (!treeEl) return;
    treeEl.innerHTML = '';

    if (!currentMagic || !currentMagic.entries.length) {
      treeEl.innerHTML = '<div class="factions-tree-empty">暂无词条，点击上方按钮新建词条</div>';
      return;
    }

    var parentOrder = [];
    var parentGroups = {};
    currentMagic.entries.forEach(function (entry) {
      var pCat = entry.parentCategory || '未分类';
      if (!parentGroups[pCat]) {
        parentGroups[pCat] = { subOrder: [], subGroups: {}, ungrouped: [] };
        parentOrder.push(pCat);
      }
      var group = parentGroups[pCat];
      var sub = entry.subCategory || '';
      if (sub) {
        if (!group.subGroups[sub]) {
          group.subGroups[sub] = [];
          group.subOrder.push(sub);
        }
        group.subGroups[sub].push(entry);
      } else {
        group.ungrouped.push(entry);
      }
    });

    parentOrder.forEach(function (pCat) {
      var parentItem = createMagicTreeItem(pCat, 'parent', pCat, null, null);
      treeEl.appendChild(parentItem);
      var parentChildren = parentItem.querySelector('.factions-tree-children');

      var group = parentGroups[pCat];
      group.subOrder.forEach(function (sub) {
        var subItem = createMagicTreeItem(sub, 'sub', pCat, sub, null);
        if (parentChildren) parentChildren.appendChild(subItem);
        var subChildren = subItem.querySelector('.factions-tree-children');
        group.subGroups[sub].forEach(function (entry) {
          var entryItem = createMagicTreeItem(entry.name, 'entry', pCat, sub, entry.id);
          if (subChildren) subChildren.appendChild(entryItem);
        });
      });

      group.ungrouped.forEach(function (entry) {
        var entryItem = createMagicTreeItem(entry.name, 'entry', pCat, '', entry.id);
        if (parentChildren) parentChildren.appendChild(entryItem);
      });
    });

    highlightMagicTree();
  }

  function createMagicTreeItem(name, type, groupId, subId, entryId) {
    var item = document.createElement('div');
    item.className = 'factions-tree-item factions-tree-' + type;
    item.setAttribute('data-type', type);
    item.setAttribute('data-group-id', groupId === null ? '' : String(groupId));
    item.setAttribute('data-sub-id', subId === null ? '' : String(subId));
    item.setAttribute('data-entry-id', entryId === null ? '' : String(entryId));

    var labelWrap = document.createElement('div');
    labelWrap.className = 'factions-tree-label';

    var expander = document.createElement('span');
    expander.className = 'factions-tree-expander';
    if (type === 'entry') {
      expander.className += ' empty';
    } else {
      expander.textContent = '▼';
    }
    expander.addEventListener('click', function (e) {
      e.stopPropagation();
      if (type === 'entry') return;
      item.classList.toggle('collapsed');
      expander.textContent = item.classList.contains('collapsed') ? '▶' : '▼';
    });

    var icon = document.createElement('span');
    icon.className = 'factions-tree-icon';
    if (type === 'parent') icon.textContent = '◆';
    else if (type === 'sub') icon.textContent = '◇';
    else icon.textContent = '•';

    var label = document.createElement('span');
    label.className = 'factions-tree-name';
    label.textContent = name || '未命名';

    labelWrap.appendChild(expander);
    labelWrap.appendChild(icon);
    labelWrap.appendChild(label);

    if (type === 'entry') {
      var actions = document.createElement('div');
      actions.className = 'factions-tree-actions';
      var delBtn = document.createElement('button');
      delBtn.className = 'factions-tree-action-btn delete';
      delBtn.textContent = '×';
      delBtn.title = '删除词条';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteMagicEntry(entryId);
      });
      actions.appendChild(delBtn);
      labelWrap.appendChild(actions);
    }

    item.appendChild(labelWrap);

    if (type !== 'entry') {
      var children = document.createElement('div');
      children.className = 'factions-tree-children';
      item.appendChild(children);
    }

    labelWrap.addEventListener('click', function () {
      if (type === 'entry') {
        selectMagicEntry(entryId);
      } else {
        item.classList.toggle('collapsed');
        expander.textContent = item.classList.contains('collapsed') ? '▶' : '▼';
      }
    });

    return item;
  }

  function highlightMagicTree() {
    var treeEl = document.getElementById('magic-tree');
    if (!treeEl) return;
    var items = treeEl.querySelectorAll('.factions-tree-item');
    items.forEach(function (item) { item.classList.remove('active'); });
    if (!currentMagicSelection || !currentMagicSelection.entryId) return;
    items.forEach(function (item) {
      if (item.dataset.type === 'entry' && item.dataset.entryId === currentMagicSelection.entryId) {
        item.classList.add('active');
      }
    });
  }

  function renderMagicEditor() {
    var parentInput = document.getElementById('magic-parent-category');
    var subInput = document.getElementById('magic-sub-category');
    var entryNameInput = document.getElementById('magic-entry-name');
    var contentEl = document.getElementById('magic-entry-content');

    var entry = getSelectedMagicEntry();

    if (!entry) {
      if (parentInput) parentInput.textContent = '';
      if (subInput) subInput.textContent = '';
      if (entryNameInput) entryNameInput.textContent = '';
      if (contentEl) contentEl.innerHTML = '';
      setEditorEditable(parentInput, false);
      setEditorEditable(subInput, false);
      setEditorEditable(entryNameInput, false);
      setEditorEditable(contentEl, false);
      return;
    }

    if (parentInput) parentInput.textContent = entry.parentCategory || '';
    if (subInput) subInput.textContent = entry.subCategory || '';
    if (entryNameInput) entryNameInput.textContent = entry.name || '';
    if (contentEl) contentEl.innerHTML = entry.content || '';

    setEditorEditable(parentInput, true);
    setEditorEditable(subInput, true);
    setEditorEditable(entryNameInput, true);
    setEditorEditable(contentEl, true);
  }

  function saveCurrentMagicState() {
    if (!currentMagic) return;
    var entry = getSelectedMagicEntry();
    if (!entry) return;

    var parentInput = document.getElementById('magic-parent-category');
    var subInput = document.getElementById('magic-sub-category');
    var entryNameInput = document.getElementById('magic-entry-name');
    var contentEl = document.getElementById('magic-entry-content');

    if (parentInput) entry.parentCategory = normalizeLabel(getPlainText(parentInput));
    if (subInput) entry.subCategory = normalizeLabel(getPlainText(subInput));
    if (entryNameInput) entry.name = getPlainText(entryNameInput) || entry.name;
    if (contentEl) entry.content = contentEl.innerHTML;

    saveMagic();
    renderMagicTree();
  }

  function addMagicEntryFromButton() {
    if (!currentMagic) return;
    saveCurrentMagicState();

    var currentEntry = getSelectedMagicEntry();

    var newEntry = {
      id: generateId(),
      name: '新词条',
      content: '',
      parentCategory: currentEntry ? currentEntry.parentCategory : '',
      subCategory: currentEntry ? currentEntry.subCategory : ''
    };

    currentMagic.entries.push(newEntry);
    saveMagic();
    renderMagicTree();
    selectMagicEntry(newEntry.id);
  }

  function deleteMagicEntry(entryId) {
    if (!currentMagic) return;
    currentMagic.entries = currentMagic.entries.filter(function (e) { return e.id !== entryId; });
    saveMagic();
    renderMagicTree();

    if (currentMagic.entries.length === 0) {
      currentMagicSelection = null;
      renderMagicEditor();
      return;
    }
    selectMagicEntry(currentMagic.entries[0].id);
  }

  function initMagicEditor() {
    var addBtn = document.getElementById('magic-add-entry-btn');
    var parentInput = document.getElementById('magic-parent-category');
    var subInput = document.getElementById('magic-sub-category');
    var entryNameInput = document.getElementById('magic-entry-name');
    var contentEl = document.getElementById('magic-entry-content');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addMagicEntryFromButton();
      });
    }

    [parentInput, subInput, entryNameInput, contentEl].forEach(function (el) {
      if (el) {
        el.addEventListener('blur', function () {
          saveCurrentMagicState();
        });
      }
    });
  }

  function openMagicEditor() {
    var textEditor = document.getElementById('section-text-editor');
    var magicEditor = document.getElementById('magic-editor');
    var factionsEditor = document.getElementById('factions-editor');
    var wikiEditor = document.getElementById('wiki-editor');
    var contentEl = document.getElementById('section-editor-content');
    if (textEditor) textEditor.classList.add('hidden');
    if (factionsEditor) factionsEditor.classList.add('hidden');
    if (wikiEditor) wikiEditor.classList.add('hidden');
    if (magicEditor) magicEditor.classList.remove('hidden');
    if (contentEl) contentEl.removeAttribute('data-field');

    loadMagic();
    renderMagicTree();

    if (currentMagic && currentMagic.entries.length) {
      selectMagicEntry(currentMagic.entries[0].id);
    } else {
      currentMagicSelection = null;
      renderMagicEditor();
    }
  }

  function closeMagicEditor() {
    var textEditor = document.getElementById('section-text-editor');
    var magicEditor = document.getElementById('magic-editor');
    if (textEditor) textEditor.classList.remove('hidden');
    if (magicEditor) magicEditor.classList.add('hidden');
  }



  // ═══════════════════════════════════════════════════════════════
  //  时间线详情页（角色展示区 + 凤凰羽毛按钮）
  // ═══════════════════════════════════════════════════════════════

  function openTimelineDetail(key) {
    var cfg = getTimelineConfig(key);
    if (!cfg) return;

    currentTimeline = key;
    currentSection = null;
    currentEditingCharIndex = -1;

    // 设置标题
    var archive = loadArchive();
    var titleEl = document.getElementById('detail-title');
    var savedTitle = '';
    if (titleEl) {
      var titleField = 'timeline' + cfg.fieldSuffix + 'Title';
      savedTitle = (archive && archive.data) ? archive.data[titleField] : '';
      titleEl.textContent = savedTitle || cfg.title;
    }

    // 页面标题
    var pageTitleEl = document.getElementById('detail-page-title');
    if (pageTitleEl) {
      pageTitleEl.textContent = (savedTitle || cfg.title) + ' · 编辑';
    }

    // 渲染角色展示区
    var chars = loadCharacters(currentTimeline);
    renderDetailCharacters(chars);

    // 通知路由切换
    if (window.OCEdit && window.OCEdit.onDetailOpen) {
      window.OCEdit.onDetailOpen();
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  板块编辑页（独立页面，仅文本编辑）
  // ═══════════════════════════════════════════════════════════════

  function openSectionEditor(sectionKey) {
    if (!currentTimeline) return;

    currentSection = sectionKey;
    var cfg = getTimelineConfig(currentTimeline);
    if (!cfg) return;

    // 角色板块不再走编辑页，已经在详情页展示
    if (sectionKey === 'characters') return;

    var sectionCfg = cfg.sections[sectionKey];
    if (!sectionCfg) return;

    var archive = loadArchive();
    var heading = document.getElementById('section-heading');
    var pageTitle = document.getElementById('section-editor-title');
    var contentEl = document.getElementById('section-editor-content');

    if (heading) heading.textContent = sectionCfg.label;
    if (pageTitle) pageTitle.textContent = sectionCfg.label + ' · 编辑';

    // 组织与势力使用结构化编辑器
    if (sectionKey === 'factions') {
      closeWikiEditor();
      closeMagicEditor();
      openFactionsEditor();
      if (window.OCEdit && window.OCEdit.onSectionOpen) {
        window.OCEdit.onSectionOpen();
      }
      return;
    }

    // 魔法力量体系使用结构化编辑器
    if (sectionKey === 'magic') {
      closeFactionsEditor();
      closeWikiEditor();
      openMagicEditor();
      if (window.OCEdit && window.OCEdit.onSectionOpen) {
        window.OCEdit.onSectionOpen();
      }
      return;
    }

    // 世界百科使用结构化编辑器
    if (sectionKey === 'wiki') {
      closeFactionsEditor();
      closeMagicEditor();
      openWikiEditor();
      if (window.OCEdit && window.OCEdit.onSectionOpen) {
        window.OCEdit.onSectionOpen();
      }
      return;
    }

    // 世界小说使用小说管理页（卡片式布局 → 章节管理 → 章节编辑）
    if (sectionKey === 'novel') {
      closeFactionsEditor();
      closeMagicEditor();
      closeWikiEditor();
      openNovelList();
      if (window.OCEdit && window.OCEdit.onNovelListOpen) {
        window.OCEdit.onNovelListOpen();
      }
      return;
    }

    // 其他板块：文本编辑模式
    closeFactionsEditor();
    closeMagicEditor();
    closeWikiEditor();

    // 设置字段名和内容
    var suffix = SECTION_SUFFIX[sectionKey];
    var fieldName = 'timeline' + cfg.fieldSuffix + suffix;
    if (contentEl) {
      contentEl.setAttribute('data-field', fieldName);
      contentEl.setAttribute('data-placeholder', sectionCfg.placeholder);
      var savedContent = (archive && archive.data) ? archive.data[fieldName] : '';
      contentEl.innerHTML = savedContent || '';
    }

    // 通知路由切换
    if (window.OCEdit && window.OCEdit.onSectionOpen) {
      window.OCEdit.onSectionOpen();
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  世界小说 · 小说管理（卡片式布局 → 章节管理 → 章节编辑）
  // ═══════════════════════════════════════════════════════════════

  var NOVEL_STORAGE_KEY = 'chuxiyan_oc_novels';
  var currentNovelIndex = -1;
  var currentNovelChapterIndex = -1;

  // ── 存档读写 ───────────────────────────────────────────────
  function loadAllNovels() {
    try {
      var data = window.ocStorage.get(NOVEL_STORAGE_KEY);
      if (data) return data;
    } catch (e) {}
    return {};
  }

  function saveAllNovels(all) {
    try {
      window.ocStorage.set(NOVEL_STORAGE_KEY, all);
    } catch (e) {
      console.error('小说存档保存失败:', e);
      if (window.showToast) window.showToast('保存失败：存储空间不足', 'error');
    }
  }

  function loadNovels(timelineKey) {
    var all = loadAllNovels();
    return all[timelineKey] || [];
  }

  function saveNovels(timelineKey, novels) {
    var all = loadAllNovels();
    all[timelineKey] = novels;
    saveAllNovels(all);
  }

  function normalizeNovelData(novel) {
    return {
      id: novel.id || ('novel_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6)),
      name: novel.name || '',
      cover: novel.cover || '',
      chapters: (novel.chapters || []).map(function (ch) {
        return { title: ch.title || '', content: ch.content || '' };
      })
    };
  }

  // ── 小说列表页 ──────────────────────────────────────────────
  function openNovelList() {
    if (!currentTimeline) return;

    var cfg = getTimelineConfig(currentTimeline);
    var pageTitle = document.getElementById('novel-list-page-title');
    if (pageTitle && cfg) {
      pageTitle.textContent = cfg.sections.novel.label || '世界小说';
    }

    renderNovelGrid();
  }

  function renderNovelGrid() {
    var grid = document.getElementById('novel-grid');
    if (!grid) return;
    grid.innerHTML = '';

    var novels = loadNovels(currentTimeline);
    novels.forEach(function (novel, idx) {
      grid.appendChild(createNovelCard(novel, idx));
    });
  }

  function createNovelCard(novel, index) {
    novel = normalizeNovelData(novel);

    var card = document.createElement('div');
    card.className = 'novel-card';
    card.setAttribute('data-index', String(index));

    // 删除按钮
    var delBtn = document.createElement('button');
    delBtn.className = 'novel-card-delete';
    delBtn.innerHTML = '&times;';
    delBtn.title = '删除小说';
    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteNovel(index);
    });

    // 封面区
    var coverWrap = document.createElement('div');
    coverWrap.className = 'novel-card-cover';
    if (novel.cover) coverWrap.classList.add('has-image');

    var img = document.createElement('img');
    img.src = novel.cover || '';
    img.alt = '封面';
    img.style.display = novel.cover ? 'block' : 'none';

    var coverPlaceholder = document.createElement('span');
    coverPlaceholder.className = 'novel-card-cover-placeholder';
    coverPlaceholder.textContent = '点击上传封面';

    var coverInput = document.createElement('input');
    coverInput.type = 'file';
    coverInput.accept = 'image/*';
    coverInput.style.display = 'none';
    coverInput.addEventListener('change', function (e) {
      e.stopPropagation();
      var file = e.target.files[0];
      handleImageUpload(file, function (dataUrl) {
        var novels = loadNovels(currentTimeline);
        if (novels[index]) {
          novels[index].cover = dataUrl;
          saveNovels(currentTimeline, novels);
        }
        img.src = dataUrl;
        img.style.display = 'block';
        coverWrap.classList.add('has-image');
        if (window.showToast) window.showToast('封面已设置', 'success');
      });
      coverInput.value = '';
    });

    coverWrap.addEventListener('click', function (e) {
      e.stopPropagation();
      coverInput.click();
    });

    coverWrap.appendChild(img);
    coverWrap.appendChild(coverPlaceholder);
    coverWrap.appendChild(coverInput);

    // 小说名称
    var nameEl = document.createElement('div');
    nameEl.className = 'novel-card-name';
    nameEl.setAttribute('contenteditable', 'true');
    nameEl.setAttribute('data-placeholder', '小说名称');
    nameEl.innerHTML = novel.name || '';
    nameEl.addEventListener('click', function (e) { e.stopPropagation(); });
    nameEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
    });
    nameEl.addEventListener('blur', function () {
      var novels = loadNovels(currentTimeline);
      if (novels[index]) {
        novels[index].name = nameEl.innerHTML;
        saveNovels(currentTimeline, novels);
      }
    });
    nameEl.addEventListener('paste', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    // 开始阅读按钮
    var readBtn = document.createElement('button');
    readBtn.className = 'novel-read-btn';
    readBtn.textContent = '开始阅读';
    readBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openNovelChapters(index);
    });

    card.appendChild(delBtn);
    card.appendChild(coverWrap);
    card.appendChild(nameEl);
    card.appendChild(readBtn);

    // 出场动画
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    requestAnimationFrame(function () {
      card.style.transition = 'all 0.4s var(--ease-smooth)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });

    return card;
  }

  function addNovel() {
    var novels = loadNovels(currentTimeline);
    novels.push(normalizeNovelData({ name: '', cover: '', chapters: [] }));
    saveNovels(currentTimeline, novels);
    renderNovelGrid();

    // 自动聚焦新小说的名称
    setTimeout(function () {
      var grid = document.getElementById('novel-grid');
      if (!grid) return;
      var lastCard = grid.querySelector('.novel-card:last-child .novel-card-name');
      if (lastCard) lastCard.focus();
    }, 150);
  }

  function deleteNovel(index) {
    var novels = loadNovels(currentTimeline);
    if (index < 0 || index >= novels.length) return;
    novels.splice(index, 1);
    saveNovels(currentTimeline, novels);
    renderNovelGrid();
    if (window.showToast) window.showToast('小说已删除', 'success');
  }

  // ── 章节列表页 ──────────────────────────────────────────────
  function openNovelChapters(index) {
    if (!currentTimeline) return;
    var novels = loadNovels(currentTimeline);
    if (index < 0 || index >= novels.length) return;

    currentNovelIndex = index;
    var novel = normalizeNovelData(novels[index]);

    // 设置标题
    var pageTitle = document.getElementById('novel-chapter-page-title');
    if (pageTitle) {
      pageTitle.textContent = (novel.name || '未命名小说') + ' · 章节';
    }

    // 小说信息摘要
    var nameEl = document.getElementById('novel-chapter-name');
    if (nameEl) nameEl.textContent = novel.name || '未命名小说';

    var countEl = document.getElementById('novel-chapter-count');
    if (countEl) countEl.textContent = '共 ' + novel.chapters.length + ' 章';

    // 封面
    var coverImg = document.getElementById('novel-chapter-cover-img');
    var coverPlaceholder = document.querySelector('#novel-chapter-cover .novel-chapter-cover-placeholder');
    if (coverImg) {
      if (novel.cover) {
        coverImg.src = novel.cover;
        coverImg.style.display = 'block';
        if (coverPlaceholder) coverPlaceholder.style.display = 'none';
      } else {
        coverImg.src = '';
        coverImg.style.display = 'none';
        if (coverPlaceholder) coverPlaceholder.style.display = 'flex';
      }
    }

    renderNovelChapterList(novel.chapters);

    if (window.OCEdit && window.OCEdit.onNovelChapterOpen) {
      window.OCEdit.onNovelChapterOpen();
    }
  }

  function renderNovelChapterList(chapters) {
    var listEl = document.getElementById('novel-chapter-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    chapters.forEach(function (ch, idx) {
      listEl.appendChild(createNovelChapterCard(ch, idx));
    });
  }

  function createNovelChapterCard(chapter, index) {
    var card = document.createElement('div');
    card.className = 'chapter-card';
    card.setAttribute('data-index', String(index));

    var numberEl = document.createElement('div');
    numberEl.className = 'chapter-card-number';
    numberEl.textContent = index + 1;

    var contentEl = document.createElement('div');
    contentEl.className = 'chapter-card-content';

    var titleEl = document.createElement('div');
    titleEl.className = 'chapter-card-title';
    titleEl.textContent = chapter.title || ('第' + (index + 1) + '章');

    var previewEl = document.createElement('div');
    previewEl.className = 'chapter-card-preview';
    var previewText = chapter.content ? chapter.content.replace(/<[^>]+>/g, '').substring(0, 80) : '暂无内容……';
    previewEl.textContent = previewText;

    contentEl.appendChild(titleEl);
    contentEl.appendChild(previewEl);

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'chapter-card-delete';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = '删除章节';
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteNovelChapter(index);
    });

    card.appendChild(numberEl);
    card.appendChild(contentEl);
    card.appendChild(deleteBtn);

    card.addEventListener('click', function (e) {
      if (e.target === deleteBtn || deleteBtn.contains(e.target)) return;
      openNovelChapterEditor(index);
    });

    return card;
  }

  function addNovelChapter() {
    if (currentNovelIndex < 0) return;
    var novels = loadNovels(currentTimeline);
    var novel = normalizeNovelData(novels[currentNovelIndex]);
    novel.chapters.push({ title: '', content: '' });
    novels[currentNovelIndex] = novel;
    saveNovels(currentTimeline, novels);

    // 更新计数
    var countEl = document.getElementById('novel-chapter-count');
    if (countEl) countEl.textContent = '共 ' + novel.chapters.length + ' 章';

    renderNovelChapterList(novel.chapters);

    // 自动打开新章节编辑页
    openNovelChapterEditor(novel.chapters.length - 1);
  }

  function deleteNovelChapter(index) {
    if (currentNovelIndex < 0) return;
    var novels = loadNovels(currentTimeline);
    var novel = normalizeNovelData(novels[currentNovelIndex]);
    novel.chapters.splice(index, 1);
    novels[currentNovelIndex] = novel;
    saveNovels(currentTimeline, novels);

    var countEl = document.getElementById('novel-chapter-count');
    if (countEl) countEl.textContent = '共 ' + novel.chapters.length + ' 章';

    renderNovelChapterList(novel.chapters);
  }

  // ── 章节编辑页 ──────────────────────────────────────────────
  function openNovelChapterEditor(index) {
    if (currentNovelIndex < 0) return;
    var novels = loadNovels(currentTimeline);
    var novel = normalizeNovelData(novels[currentNovelIndex]);
    var chapter = novel.chapters[index];
    if (!chapter) return;

    currentNovelChapterIndex = index;

    var pageTitle = document.getElementById('novel-chapter-edit-page-title');
    var titleEl = document.getElementById('novel-chapter-edit-title');
    var bodyEl = document.getElementById('novel-chapter-edit-body');

    if (pageTitle) {
      pageTitle.textContent = (novel.name || '未命名小说') + ' · ' + (chapter.title || ('第' + (index + 1) + '章'));
    }
    if (titleEl) titleEl.innerHTML = chapter.title || '';
    if (bodyEl) bodyEl.innerHTML = chapter.content || '';

    if (window.OCEdit && window.OCEdit.onNovelChapterEditOpen) {
      window.OCEdit.onNovelChapterEditOpen();
    }
  }

  function saveNovelChapterEdit() {
    if (currentNovelIndex < 0 || currentNovelChapterIndex < 0) return;

    var titleEl = document.getElementById('novel-chapter-edit-title');
    var bodyEl = document.getElementById('novel-chapter-edit-body');
    if (!titleEl && !bodyEl) return;

    var novels = loadNovels(currentTimeline);
    var novel = normalizeNovelData(novels[currentNovelIndex]);
    if (!novel.chapters[currentNovelChapterIndex]) return;

    if (titleEl) novel.chapters[currentNovelChapterIndex].title = titleEl.innerHTML;
    if (bodyEl) novel.chapters[currentNovelChapterIndex].content = bodyEl.innerHTML;

    novels[currentNovelIndex] = novel;
    saveNovels(currentTimeline, novels);
  }


  // ═══════════════════════════════════════════════════════════════
  //  联机互动
  // ═══════════════════════════════════════════════════════════════

  function openInteractionDetail(key) {
    var cfg = INTERACTIONS[key];
    if (!cfg) return;

    currentInteraction = key;

    // ── OC绿泡泡走独立的微信风格界面 ──
    if (key === 'lvpaopao') {
      if (window.OCEdit && window.OCEdit.onLppOpen) {
        window.OCEdit.onLppOpen();
      }
      initLpp();
      return;
    }

    // ── 其他互动项走原来的文本编辑界面 ──
    var archive = loadArchive();

    var titleEl = document.getElementById('interaction-detail-title');
    var contentEl = document.getElementById('interaction-detail-content');

    var savedTitle = '';
    var savedContent = '';
    if (archive && archive.data) {
      savedTitle = archive.data['interaction' + cfg.fieldSuffix + 'Title'] || '';
      savedContent = archive.data['interaction' + cfg.fieldSuffix + 'Content'] || '';
    }

    if (titleEl) {
      titleEl.setAttribute('data-field', 'interaction' + cfg.fieldSuffix + 'Title');
      titleEl.textContent = savedTitle || cfg.title;
    }
    if (contentEl) {
      contentEl.setAttribute('data-field', 'interaction' + cfg.fieldSuffix + 'Content');
      contentEl.textContent = savedContent || cfg.defaultContent;
    }

    if (window.OCEdit && window.OCEdit.onInteractionDetailOpen) {
      window.OCEdit.onInteractionDetailOpen();
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  OC绿泡泡 · 微信风格社交系统
  // ═══════════════════════════════════════════════════════════════

  var LPP_STORAGE_KEY = 'chuxiyan_oc_lpp';
  var lppData = null;
  var lppCurrentTab = 'messages';
  var lppActiveContactId = null;
  var lppInitialized = false;

  // ── 数据加载/保存 ─────────────────────────────────────────────
  function loadLppData() {
    try {
      var data = window.ocStorage.get(LPP_STORAGE_KEY);
      if (data) return data;
    } catch (e) {}
    return {
      accounts: [],
      contacts: [],
      conversations: {},
      moments: [],
      forumPosts: [],
      weiboPosts: [],
      groupChats: []
    };
  }

  function saveLppData() {
    if (!lppData) return;
    try {
      window.ocStorage.set(LPP_STORAGE_KEY, lppData);
    } catch (e) {
      console.error('绿泡泡数据保存失败:', e);
    }
  }

  // ── 获取所有可选角色（跨时间线） ─────────────────────────────
  function getAllCharactersForLpp() {
    var all = loadAllCharacters();
    var result = [];
    for (var tlKey in all) {
      var tlTitle = TIMELINES[tlKey] ? TIMELINES[tlKey].title : tlKey;
      var chars = all[tlKey] || [];
      chars.forEach(function (c, idx) {
        result.push({
          id: tlKey + '_' + idx,
          name: c.name || '未命名',
          avatar: c.avatar || '',
          timeline: tlKey,
          timelineTitle: tlTitle,
          charIndex: idx
        });
      });
    }
    return result;
  }

  // ── 生成唯一ID ───────────────────────────────────────────────
  function lppUUID() {
    return 'lpp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  // ── 时间格式化 ────────────────────────────────────────────────
  function lppFormatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var now = new Date();
    var diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (d.toDateString() === now.toDateString()) {
      var h = d.getHours().toString().padStart(2, '0');
      var m = d.getMinutes().toString().padStart(2, '0');
      return h + ':' + m;
    }
    var yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return '昨天';
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  // ── 初始化 ────────────────────────────────────────────────────
  function initLpp() {
    lppData = loadLppData();
    if (!lppData.accounts) lppData.accounts = [];
    if (!lppData.weiboPosts) lppData.weiboPosts = [];
    if (!lppData.groupChats) lppData.groupChats = [];
    if (!lppInitialized) {
      initLppTabs();
      initLppContacts();
      initLppChat();
      initLppMoments();
      initLppForum();
      initLppWeibo();
      initLppAccounts();
      initLppImageLightbox();
      lppInitialized = true;
    }
    switchLppTab('messages');
    renderLppChatList();
    renderLppContactList();
    renderLppMomentList();
    renderLppForumList();
    renderLppWeiboList();
    showLppEmpty();
  }

  // ── 图片灯箱 ─────────────────────────────────────────────────
  function initLppImageLightbox() {
    var lightbox = document.getElementById('lpp-image-lightbox');
    if (!lightbox) return;
    var lightboxImg = document.getElementById('lpp-lightbox-img');
    // 点击遮罩或图片关闭
    lightbox.addEventListener('click', function () {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    });
    // 事件委托：捕获所有 lpp 区域内图片点击
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.tagName === 'IMG' &&
          (target.classList.contains('lpp-msg-image') ||
           target.classList.contains('lpp-post-img') ||
           target.classList.contains('lpp-moment-thumb'))) {
        e.stopPropagation();
        e.preventDefault();
        lightboxImg.src = target.src;
        lightbox.style.display = 'flex';
      }
    });
  }

  // ── Tab切换 ───────────────────────────────────────────────────
  function initLppTabs() {
    var tabs = document.querySelectorAll('.lpp-nav-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchLppTab(tab.getAttribute('data-lpp-tab'));
      });
    });
  }

  function switchLppTab(tabName) {
    lppCurrentTab = tabName;
    document.querySelectorAll('.lpp-nav-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-lpp-tab') === tabName);
    });
    document.querySelectorAll('.lpp-list-panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'lpp-list-' + tabName);
    });
    showLppEmpty();
  }

  // ── 右侧显示空状态 ────────────────────────────────────────────
  function showLppEmpty() {
    document.getElementById('lpp-empty-state').style.display = '';
    document.getElementById('lpp-chat-area').style.display = 'none';
    document.getElementById('lpp-add-contact-modal').style.display = 'none';
    document.getElementById('lpp-post-moment-modal').style.display = 'none';
    document.getElementById('lpp-post-forum-modal').style.display = 'none';
    document.getElementById('lpp-moment-detail').style.display = 'none';
    document.getElementById('lpp-forum-detail').style.display = 'none';
    var wm = document.getElementById('lpp-post-weibo-modal');
    if (wm) wm.style.display = 'none';
    var wd = document.getElementById('lpp-weibo-detail');
    if (wd) wd.style.display = 'none';
    var am = document.getElementById('lpp-create-account-modal');
    if (am) am.style.display = 'none';
    var gm = document.getElementById('lpp-create-group-modal');
    if (gm) gm.style.display = 'none';
    var st = document.getElementById('lpp-sender-toggle');
    if (st) st.style.display = 'none';
  }

  // ── 显示某个面板 ──────────────────────────────────────────────
  function showLppPanel(panelId) {
    showLppEmpty();
    var el = document.getElementById(panelId);
    if (el) {
      el.style.display = '';
      document.getElementById('lpp-empty-state').style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  通讯录
  // ═══════════════════════════════════════════════════════════════

  function initLppContacts() {
    var addBtn = document.getElementById('lpp-add-contact-btn');
    if (addBtn) {
      addBtn.addEventListener('click', openAddContactModal);
    }
    var closeBtn = document.getElementById('lpp-close-add-contact');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        document.getElementById('lpp-add-contact-modal').style.display = 'none';
      });
    }
    // 群聊按钮
    var groupBtn = document.getElementById('lpp-create-group-btn');
    if (groupBtn) {
      groupBtn.addEventListener('click', openCreateGroupModal);
    }
    var groupCloseBtn = document.getElementById('lpp-close-group');
    if (groupCloseBtn) {
      groupCloseBtn.addEventListener('click', function () {
        document.getElementById('lpp-create-group-modal').style.display = 'none';
      });
    }
    var groupSubmitBtn = document.getElementById('lpp-group-submit');
    if (groupSubmitBtn) {
      groupSubmitBtn.addEventListener('click', submitCreateGroup);
    }
  }

  function renderLppContactList() {
    var list = document.getElementById('lpp-contact-list');
    if (!list || !lppData) return;
    list.innerHTML = '';

    // 群聊列表
    if (lppData.groupChats && lppData.groupChats.length > 0) {
      var groupHeader = document.createElement('div');
      groupHeader.className = 'lpp-contact-section-header';
      groupHeader.textContent = '群聊';
      list.appendChild(groupHeader);

      lppData.groupChats.forEach(function (g) {
        var item = document.createElement('div');
        item.className = 'lpp-list-item lpp-group-item';
        item.innerHTML =
          '<div class="lpp-list-avatar">' +
            '<span class="lpp-list-avatar-fallback">' + escapeHtml((g.name || '群')[0]) + '</span>' +
          '</div>' +
          '<div class="lpp-list-info">' +
            '<div class="lpp-list-name">' + escapeHtml(g.name) + '</div>' +
            '<div class="lpp-contact-tl">' + (g.memberIds ? g.memberIds.length : 0) + '人</div>' +
          '</div>';
        item.addEventListener('click', function () {
          openLppChat(g.id);
        });
        var delBtn = document.createElement('button');
        delBtn.className = 'lpp-delete-btn lpp-delete-inline';
        delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除';
        delBtn.title = '删除群聊';
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (confirm('确定删除群聊"' + g.name + '"吗？聊天记录也会一并删除。')) {
            deleteLppGroupChat(g.id);
          }
        });
        item.appendChild(delBtn);
        list.appendChild(item);
      });
    }

    if (lppData.contacts.length === 0 && (!lppData.groupChats || lppData.groupChats.length === 0)) {
      list.innerHTML = '<div class="lpp-list-empty">还没有好友，点 + 添加</div>';
      return;
    }

    if (lppData.contacts.length > 0) {
      var friendHeader = document.createElement('div');
      friendHeader.className = 'lpp-contact-section-header';
      friendHeader.textContent = '好友';
      list.appendChild(friendHeader);
    }

    lppData.contacts.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'lpp-list-item lpp-contact-item';
      item.innerHTML =
        '<div class="lpp-list-avatar">' +
          (c.avatar
            ? '<img src="' + c.avatar + '">'
            : '<span class="lpp-list-avatar-fallback">' + (c.name ? c.name[0] : '?') + '</span>') +
        '</div>' +
        '<div class="lpp-list-info">' +
          '<div class="lpp-list-name">' + escapeHtml(c.name) + '</div>' +
          '<div class="lpp-contact-tl">' + escapeHtml(c.timelineTitle || '') + '</div>' +
        '</div>';
      item.addEventListener('click', function () {
        openLppChat(c.id);
      });
      var delBtn = document.createElement('button');
      delBtn.className = 'lpp-delete-btn lpp-delete-inline';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除';
      delBtn.title = '删除好友';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('确定删除好友"' + c.name + '"吗？聊天记录也会一并删除。')) {
          deleteLppContact(c.id);
        }
      });
      item.appendChild(delBtn);
      list.appendChild(item);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  群聊
  // ═══════════════════════════════════════════════════════════════

  var lppGroupSelectedMembers = [];

  function openCreateGroupModal() {
    if (!lppData.contacts || lppData.contacts.length === 0) {
      alert('还没有好友，请先在通讯录中添加好友');
      return;
    }
    lppGroupSelectedMembers = [];
    var picker = document.getElementById('lpp-group-member-picker');
    if (!picker) return;
    picker.innerHTML = '';

    lppData.contacts.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'lpp-group-member-item';
      item.setAttribute('data-id', c.id);
      item.innerHTML =
        '<div class="lpp-group-member-checkbox"></div>' +
        '<div class="lpp-group-member-name">' + escapeHtml(c.name) + '</div>';
      item.addEventListener('click', function () {
        var idx = lppGroupSelectedMembers.indexOf(c.id);
        if (idx >= 0) {
          lppGroupSelectedMembers.splice(idx, 1);
          item.classList.remove('selected');
        } else {
          lppGroupSelectedMembers.push(c.id);
          item.classList.add('selected');
        }
      });
      picker.appendChild(item);
    });

    document.getElementById('lpp-group-name').value = '';
    showLppPanel('lpp-create-group-modal');
  }

  function submitCreateGroup() {
    var name = document.getElementById('lpp-group-name').value.trim();
    if (!name) {
      alert('请输入群聊名称');
      return;
    }
    if (lppGroupSelectedMembers.length < 2) {
      alert('群聊至少需要选择2个成员');
      return;
    }

    lppData.groupChats.push({
      id: 'grp_' + lppUUID(),
      name: name,
      memberIds: lppGroupSelectedMembers.slice(),
      createdAt: Date.now()
    });
    saveLppData();
    document.getElementById('lpp-create-group-modal').style.display = 'none';
    renderLppContactList();
    renderLppChatList();
    showLppEmpty();
  }

  function findLppGroupChat(id) {
    if (!lppData.groupChats) return null;
    for (var i = 0; i < lppData.groupChats.length; i++) {
      if (lppData.groupChats[i].id === id) return lppData.groupChats[i];
    }
    return null;
  }

  function openAddContactModal() {
    var picker = document.getElementById('lpp-contact-picker');
    if (!picker) return;

    var allChars = getAllCharactersForLpp();
    var existingIds = lppData.contacts.map(function (c) { return c.id; });

    picker.innerHTML = '';
    if (allChars.length === 0) {
      picker.innerHTML = '<div class="lpp-list-empty">还没有创建任何角色</div>';
    } else {
      allChars.forEach(function (ch) {
        var isAdded = existingIds.indexOf(ch.id) >= 0;
        var item = document.createElement('div');
        item.className = 'lpp-contact-picker-item' + (isAdded ? ' added' : '');
        item.innerHTML =
          '<div class="lpp-contact-picker-avatar">' +
            (ch.avatar
              ? '<img src="' + ch.avatar + '">'
              : '<span class="lpp-list-avatar-fallback">' + (ch.name ? ch.name[0] : '?') + '</span>') +
          '</div>' +
          '<div class="lpp-contact-picker-info">' +
            '<div class="lpp-contact-picker-name">' + escapeHtml(ch.name) + '</div>' +
            '<div class="lpp-contact-picker-tl">' + escapeHtml(ch.timelineTitle) + '</div>' +
          '</div>' +
          '<span class="lpp-contact-picker-action">' + (isAdded ? '已添加' : '加好友') + '</span>';

        if (!isAdded) {
          item.addEventListener('click', function () {
            var newContact = {
              id: ch.id,
              name: ch.name,
              avatar: ch.avatar,
              timeline: ch.timeline,
              timelineTitle: ch.timelineTitle,
              charIndex: ch.charIndex,
              addedAt: Date.now()
            };
            lppData.contacts.push(newContact);
            lppData.conversations[newContact.id] = [];
            saveLppData();
            renderLppContactList();
            renderLppChatList();
            // 更新弹窗状态
            item.classList.add('added');
            item.querySelector('.lpp-contact-picker-action').textContent = '已添加';
          });
        }
        picker.appendChild(item);
      });
    }

    showLppPanel('lpp-add-contact-modal');
  }

  // ═══════════════════════════════════════════════════════════════
  //  消息/聊天
  // ═══════════════════════════════════════════════════════════════

  function initLppChat() {
    var sendBtn = document.getElementById('lpp-send-btn');
    var input = document.getElementById('lpp-chat-input');
    if (sendBtn) {
      sendBtn.addEventListener('click', sendLppMessage);
    }
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendLppMessage();
        }
      });
      input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
    }
    // 图片上传
    var imgBtn = document.getElementById('lpp-chat-img-btn');
    var imgInput = document.getElementById('lpp-chat-image-input');
    if (imgBtn && imgInput) {
      imgBtn.addEventListener('click', function () { imgInput.click(); });
      imgInput.addEventListener('change', function () {
        handleLppImageUpload(imgInput, 'lpp-chat-img-preview', function (dataURL) {
          lppChatPendingImage = dataURL;
        });
      });
    }
  }

  function renderLppChatList() {
    var list = document.getElementById('lpp-chat-list');
    if (!list || !lppData) return;
    list.innerHTML = '';

    var chatItems = [];
    // 个人聊天
    lppData.contacts.forEach(function (c) {
      var msgs = lppData.conversations[c.id] || [];
      if (msgs.length === 0) return;
      var lastMsg = msgs[msgs.length - 1];
      chatItems.push({
        type: 'contact',
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        lastMsg: lastMsg,
        timestamp: lastMsg.time || 0
      });
    });
    // 群聊
    if (lppData.groupChats) {
      lppData.groupChats.forEach(function (g) {
        var msgs = lppData.conversations[g.id] || [];
        if (msgs.length === 0) return;
        var lastMsg = msgs[msgs.length - 1];
        chatItems.push({
          type: 'group',
          id: g.id,
          name: g.name,
          avatar: '',
          lastMsg: lastMsg,
          timestamp: lastMsg.time || 0
        });
      });
    }

    chatItems.sort(function (a, b) { return b.timestamp - a.timestamp; });

    if (chatItems.length === 0) {
      list.innerHTML = '<div class="lpp-list-empty">还没有对话，去通讯录找人聊吧</div>';
      return;
    }

    chatItems.forEach(function (item) {
      var dom = document.createElement('div');
      dom.className = 'lpp-list-item';
      if (item.type === 'group') dom.classList.add('lpp-group-item');
      if (item.id === lppActiveContactId) dom.classList.add('active');
      var previewText = item.lastMsg.text || '';
      var senderPrefix = '';
      if (item.lastMsg.recalled) {
        previewText = '撤回了一条消息';
      } else if (item.lastMsg.image && !previewText) {
        previewText = '[图片]';
      } else if (item.lastMsg.image) {
        previewText = previewText + ' [图片]';
      } else if (item.lastMsg.from === 'me') {
        senderPrefix = '我: ';
      } else if (item.type === 'group' && item.lastMsg.from && item.lastMsg.from !== 'me') {
        var sender = findLppContact(item.lastMsg.from);
        if (sender) senderPrefix = sender.name + ': ';
      } else if (item.lastMsg.from === 'other') {
        // for individual chat, no prefix needed (shows contact name)
      }
      var avatarHTML;
      if (item.type === 'group') {
        avatarHTML = '<div class="lpp-list-avatar"><span class="lpp-list-avatar-fallback">' + escapeHtml((item.name || '群')[0]) + '</span></div>';
      } else {
        avatarHTML = '<div class="lpp-list-avatar">' +
          (item.avatar
            ? '<img src="' + item.avatar + '">'
            : '<span class="lpp-list-avatar-fallback">' + (item.name ? item.name[0] : '?') + '</span>') +
        '</div>';
      }
      dom.innerHTML =
        avatarHTML +
        '<div class="lpp-list-info">' +
          '<div class="lpp-list-name">' + escapeHtml(item.name) + '</div>' +
          '<div class="lpp-list-preview">' + escapeHtml(senderPrefix + previewText) + '</div>' +
        '</div>' +
        '<div class="lpp-list-meta">' +
          '<div class="lpp-list-time">' + lppFormatTime(item.timestamp) + '</div>' +
        '</div>';
      var chatId = item.id;
      dom.addEventListener('click', function () {
        openLppChat(chatId);
      });
      var delBtn = document.createElement('button');
      delBtn.className = 'lpp-delete-btn lpp-delete-inline';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      delBtn.title = '删除聊天记录';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('确定删除与"' + item.name + '"的聊天记录吗？')) {
          deleteLppChatHistory(chatId);
        }
      });
      dom.appendChild(delBtn);
      list.appendChild(dom);
    });
  }

  // 删除好友（同时清理聊天记录）
  function deleteLppContact(contactId) {
    for (var i = 0; i < lppData.contacts.length; i++) {
      if (lppData.contacts[i].id === contactId) {
        lppData.contacts.splice(i, 1);
        break;
      }
    }
    // 清理聊天记录
    if (lppData.conversations[contactId]) {
      delete lppData.conversations[contactId];
    }
    // 从群聊成员中移除
    if (lppData.groupChats) {
      lppData.groupChats.forEach(function (g) {
        if (g.memberIds) {
          var idx = g.memberIds.indexOf(contactId);
          if (idx >= 0) g.memberIds.splice(idx, 1);
        }
      });
    }
    // 如果当前正在看这个聊天，回到空状态
    if (lppActiveContactId === contactId) {
      lppActiveContactId = '';
      showLppEmpty();
    }
    saveLppData();
    renderLppContactList();
    renderLppChatList();
  }

  // 删除群聊（同时清理聊天记录）
  function deleteLppGroupChat(groupId) {
    for (var i = 0; i < lppData.groupChats.length; i++) {
      if (lppData.groupChats[i].id === groupId) {
        lppData.groupChats.splice(i, 1);
        break;
      }
    }
    if (lppData.conversations[groupId]) {
      delete lppData.conversations[groupId];
    }
    if (lppActiveContactId === groupId) {
      lppActiveContactId = '';
      showLppEmpty();
    }
    saveLppData();
    renderLppContactList();
    renderLppChatList();
  }

  // 删除聊天记录（不删好友/群聊本身）
  function deleteLppChatHistory(chatId) {
    if (lppData.conversations[chatId]) {
      delete lppData.conversations[chatId];
    }
    if (lppActiveContactId === chatId) {
      lppActiveContactId = '';
      showLppEmpty();
    }
    saveLppData();
    renderLppChatList();
  }

  // 当前发送身份：'me' 或 'other'（个人聊天双人切换）
  var lppActiveSender = 'me';
  // 群聊当前发送者ID
  var lppGroupSenderId = '';

  function openLppChat(contactId) {
    var isGroup = contactId.indexOf('grp_') === 0;
    var chatName = '';
    var groupChat = null;
    var contact = null;

    if (isGroup) {
      groupChat = findLppGroupChat(contactId);
      if (!groupChat) return;
      chatName = groupChat.name;
      // 默认发送者为第一个成员
      if (groupChat.memberIds && groupChat.memberIds.length > 0) {
        lppGroupSenderId = groupChat.memberIds[0];
      }
    } else {
      contact = findLppContact(contactId);
      if (!contact) return;
      chatName = contact.name;
    }

    lppActiveContactId = contactId;
    lppActiveSender = 'me';
    // 切到消息Tab
    switchLppTab('messages');
    // 高亮列表项
    renderLppChatList();

    // 显示聊天区
    showLppPanel('lpp-chat-area');
    var nameEl = document.getElementById('lpp-chat-name');
    if (nameEl) nameEl.textContent = chatName;

    // 渲染发送者切换区
    var toggleEl = document.getElementById('lpp-sender-toggle');
    if (toggleEl) {
      if (isGroup) {
        // 群聊：显示发送者下拉选择
        var memberOptions = '';
        if (groupChat.memberIds) {
          groupChat.memberIds.forEach(function (mid) {
            var m = findLppContact(mid);
            if (m) {
              memberOptions += '<option value="' + m.id + '">' + escapeHtml(m.name) + '</option>';
            }
          });
        }
        // 也允许"我"发言
        toggleEl.innerHTML =
          '<div class="lpp-group-sender-bar">' +
            '<label>以谁的身份发言</label>' +
            '<select id="lpp-group-sender-select">' + memberOptions + '</select>' +
          '</div>';
        toggleEl.style.display = '';
        var sel = document.getElementById('lpp-group-sender-select');
        if (sel) {
          sel.value = lppGroupSenderId;
          sel.addEventListener('change', function () {
            lppGroupSenderId = sel.value;
          });
        }
      } else {
        // 个人聊天：双人切换按钮
        var myName = '我';
        var otherName = contact ? contact.name : '对方';
        toggleEl.innerHTML =
          '<button class="lpp-sender-btn active" data-side="me">' +
            '<span class="lpp-sender-dot"></span>' +
            '<span>' + escapeHtml(myName) + '</span>' +
          '</button>' +
          '<button class="lpp-sender-btn" data-side="other">' +
            '<span class="lpp-sender-dot"></span>' +
            '<span>' + escapeHtml(otherName) + '</span>' +
          '</button>';
        toggleEl.style.display = '';
        toggleEl.querySelectorAll('.lpp-sender-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            lppActiveSender = btn.getAttribute('data-side');
            toggleEl.querySelectorAll('.lpp-sender-btn').forEach(function (b) {
              b.classList.toggle('active', b.getAttribute('data-side') === lppActiveSender);
            });
          });
        });
      }
    }

    renderLppMessages(contactId);
  }

  function renderLppMessages(contactId) {
    var body = document.getElementById('lpp-chat-body');
    if (!body) return;
    body.innerHTML = '';

    var msgs = lppData.conversations[contactId] || [];
    var isGroup = contactId.indexOf('grp_') === 0;
    var contact = isGroup ? null : findLppContact(contactId);
    var groupChat = isGroup ? findLppGroupChat(contactId) : null;

    msgs.forEach(function (msg, msgIdx) {
      // 撤回消息
      if (msg.recalled) {
        var recallName = '我';
        if (isGroup) {
          if (msg.from === 'me') {
            recallName = '我';
          } else {
            var recalledSender = findLppContact(msg.from);
            recallName = recalledSender ? recalledSender.name : '未知';
          }
        } else {
          if (msg.from === 'other') recallName = contact ? contact.name : '对方';
        }
        var recallDom = document.createElement('div');
        recallDom.className = 'lpp-msg-recalled';
        recallDom.innerHTML = '<span>' + escapeHtml(recallName) + '撤回了一条消息</span>';
        body.appendChild(recallDom);
        return;
      }

      var isMe, avatarHTML, senderName;
      if (isGroup) {
        // 群聊：根据 from 判断
        if (msg.from === 'me') {
          isMe = true;
          avatarHTML = '<div class="lpp-msg-avatar"><span class="lpp-msg-avatar-fallback">我</span></div>';
          senderName = '我';
        } else {
          isMe = false;
          var groupSender = findLppContact(msg.from);
          senderName = groupSender ? groupSender.name : '未知';
          avatarHTML = '<div class="lpp-msg-avatar">' +
            (groupSender && groupSender.avatar
              ? '<img src="' + groupSender.avatar + '">'
              : '<span class="lpp-msg-avatar-fallback">' + escapeHtml(senderName[0]) + '</span>') +
          '</div>';
        }
      } else {
        // 个人聊天
        isMe = msg.from === 'me';
        if (isMe) {
          avatarHTML = '<div class="lpp-msg-avatar"><span class="lpp-msg-avatar-fallback">我</span></div>';
          senderName = '我';
        } else {
          avatarHTML = '<div class="lpp-msg-avatar">' +
            (contact && contact.avatar
              ? '<img src="' + contact.avatar + '">'
              : '<span class="lpp-msg-avatar-fallback">' + (contact ? (contact.name ? contact.name[0] : '?') : '?') + '</span>') +
          '</div>';
          senderName = contact ? contact.name : '对方';
        }
      }

      var dom = document.createElement('div');
      dom.className = 'lpp-msg ' + (isMe ? 'me' : 'other');
      var msgIndex = msgIdx;
      var recallBtnHTML = '<div class="lpp-msg-actions">' +
        '<button class="lpp-msg-action-btn" data-msg-idx="' + msgIndex + '">撤回</button>' +
      '</div>';
      dom.innerHTML =
        avatarHTML +
        '<div>' +
          (isGroup ? '<div class="lpp-msg-sender-name">' + escapeHtml(senderName) + '</div>' : '') +
          '<div class="lpp-msg-bubble">' +
            escapeHtml(msg.text) +
            (msg.image ? '<img src="' + msg.image + '" class="lpp-msg-image" style="max-width:200px;max-height:200px;border-radius:8px;margin-top:6px;display:block;cursor:pointer;" />' : '') +
          '</div>' +
          '<div class="lpp-msg-time">' + lppFormatTime(msg.time) + '</div>' +
        '</div>' +
        recallBtnHTML;
      // 绑定撤回按钮
      var recallBtn = dom.querySelector('.lpp-msg-action-btn');
      if (recallBtn) {
        recallBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          recallLppMessage(contactId, parseInt(recallBtn.getAttribute('data-msg-idx')));
        });
      }
      body.appendChild(dom);
    });

    body.scrollTop = body.scrollHeight;
  }

  function recallLppMessage(contactId, msgIdx) {
    var msgs = lppData.conversations[contactId];
    if (!msgs || msgIdx < 0 || msgIdx >= msgs.length) return;
    msgs[msgIdx].recalled = true;
    saveLppData();
    renderLppMessages(contactId);
    renderLppChatList();
  }

  var lppChatPendingImage = '';

  function sendLppMessage() {
    if (!lppActiveContactId) return;
    var input = document.getElementById('lpp-chat-input');
    if (!input) return;
    var text = input.value.trim();
    var img = lppChatPendingImage;
    if (!text && !img) return;

    if (!lppData.conversations[lppActiveContactId]) {
      lppData.conversations[lppActiveContactId] = [];
    }
    // 判断发送者
    var senderFrom = 'me';
    var isGroup = lppActiveContactId.indexOf('grp_') === 0;
    if (isGroup) {
      senderFrom = lppGroupSenderId || 'me';
    } else {
      senderFrom = lppActiveSender || 'me';
    }
    var msgObj = {
      from: senderFrom,
      text: text,
      time: Date.now()
    };
    if (img) msgObj.image = img;
    lppData.conversations[lppActiveContactId].push(msgObj);
    saveLppData();
    input.value = '';
    input.style.height = 'auto';
    // 清除图片预览
    lppChatPendingImage = '';
    var imgPreview = document.getElementById('lpp-chat-img-preview');
    if (imgPreview) { imgPreview.innerHTML = ''; imgPreview.style.display = 'none'; }
    var imgInput = document.getElementById('lpp-chat-image-input');
    if (imgInput) imgInput.value = '';
    renderLppMessages(lppActiveContactId);
    renderLppChatList();
  }

  // ═══════════════════════════════════════════════════════════════
  //  朋友圈
  // ═══════════════════════════════════════════════════════════════

  function initLppMoments() {
    var postBtn = document.getElementById('lpp-post-moment-btn');
    if (postBtn) {
      postBtn.addEventListener('click', openPostMomentModal);
    }
    var closeBtn = document.getElementById('lpp-close-moment');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        document.getElementById('lpp-post-moment-modal').style.display = 'none';
      });
    }
    var submitBtn = document.getElementById('lpp-moment-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitMoment);
    }
    // 图片上传
    var imgBtn = document.getElementById('lpp-moment-img-btn');
    var imgInput = document.getElementById('lpp-moment-image-input');
    if (imgBtn && imgInput) {
      imgBtn.addEventListener('click', function () { imgInput.click(); });
      imgInput.addEventListener('change', function () {
        handleLppImageUpload(imgInput, 'lpp-moment-img-preview', function (dataURL) {
          lppMomentPendingImage = dataURL;
        });
      });
    }
  }

  function renderLppMomentList() {
    var list = document.getElementById('lpp-moment-list');
    if (!list || !lppData) return;
    list.innerHTML = '';

    if (lppData.moments.length === 0) {
      list.innerHTML = '<div class="lpp-list-empty">还没有动态，点 + 发布</div>';
      return;
    }

    // 按时间倒序
    var sorted = lppData.moments.slice().sort(function (a, b) { return b.time - a.time; });

    sorted.forEach(function (m) {
      var author = findLppAuthor(m.authorId);
      var item = document.createElement('div');
      item.className = 'lpp-moment-item';
      item.innerHTML =
        '<div class="lpp-moment-avatar">' +
          makeAuthorAvatarHTML(author) +
        '</div>' +
        '<div class="lpp-moment-content">' +
          '<div class="lpp-moment-author">' + escapeHtml(author.name) + '</div>' +
          '<div class="lpp-moment-text">' + escapeHtml(m.text) + '</div>' +
          (m.images && m.images.length > 0 ?
            '<div class="lpp-moment-thumb-row">' + m.images.map(function (img) {
              return '<img src="' + img + '" class="lpp-moment-thumb" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin-top:4px;margin-right:4px;cursor:pointer;" />';
            }).join('') + '</div>' : '') +
        '</div>';
      item.addEventListener('click', function () {
        openMomentDetail(m.id);
      });
      var delBtn = document.createElement('button');
      delBtn.className = 'lpp-delete-btn lpp-delete-inline';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除';
      delBtn.title = '删除动态';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('确定删除这条朋友圈动态吗？')) {
          deleteLppMoment(m.id);
        }
      });
      item.style.position = 'relative';
      item.appendChild(delBtn);
      list.appendChild(item);
    });
  }

  function openPostMomentModal() {
    var sel = document.getElementById('lpp-moment-author');
    if (!sel) return;

    fillAuthorSelect(sel);
    document.getElementById('lpp-moment-text').value = '';
    var imgPreview = document.getElementById('lpp-moment-img-preview');
    if (imgPreview) imgPreview.innerHTML = '';
    lppMomentPendingImage = '';
    var imgInput = document.getElementById('lpp-moment-image-input');
    if (imgInput) imgInput.value = '';
    showLppPanel('lpp-post-moment-modal');
  }

  var lppMomentPendingImage = '';

  function submitMoment() {
    var authorId = document.getElementById('lpp-moment-author').value;
    var text = document.getElementById('lpp-moment-text').value.trim();
    if (!authorId || !text) return;

    var author = findLppAuthor(authorId);
    lppData.moments.push({
      id: lppUUID(),
      authorId: authorId,
      authorName: author ? author.name : '未知',
      text: text,
      time: Date.now(),
      likes: [],
      comments: [],
      images: lppMomentPendingImage ? [lppMomentPendingImage] : []
    });
    saveLppData();
    renderLppMomentList();
    showLppEmpty();
  }

  function openMomentDetail(momentId) {
    var m = null;
    for (var i = 0; i < lppData.moments.length; i++) {
      if (lppData.moments[i].id === momentId) {
        m = lppData.moments[i];
        break;
      }
    }
    if (!m) return;

    var author = findLppAuthor(m.authorId);
    var container = document.getElementById('lpp-moment-detail');
    if (!container) return;

    var avatarHTML = makeAuthorAvatarHTML(author);

    var commentsHTML = '';
    m.comments.forEach(function (c) {
      var cAuthor = findLppAuthor(c.from);
      commentsHTML +=
        '<div class="lpp-moment-comment">' +
          '<div class="lpp-moment-comment-name">' + escapeHtml(cAuthor.name) + ':</div>' +
          '<div class="lpp-moment-comment-text">' + escapeHtml(c.text) + '</div>' +
        '</div>';
    });

    var isLiked = m.likes.length > 0;
    var likeText = isLiked ? '已赞(' + m.likes.length + ')' : '点赞';

    var authors = getLppAllAuthors();
    var authorOptionsHTML = '';
    authors.forEach(function (a) {
      authorOptionsHTML += '<option value="' + a.id + '">' + escapeHtml(a.name) + '</option>';
    });

    container.innerHTML =
      '<div class="lpp-moment-detail">' +
        '<div class="lpp-moment-detail-header">' +
          '<div class="lpp-moment-detail-avatar">' + avatarHTML + '</div>' +
          '<div>' +
            '<div class="lpp-moment-detail-author">' + escapeHtml(author.name) + '</div>' +
            '<div class="lpp-moment-detail-time">' + lppFormatTime(m.time) + '</div>' +
          '</div>' +
          '<button class="lpp-delete-btn" id="lpp-moment-del-btn" title="删除动态" style="margin-left:auto;opacity:0.6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除</button>' +
        '</div>' +
        '<div class="lpp-moment-detail-text">' + escapeHtml(m.text) + '</div>' +
        (m.images && m.images.length > 0 ?
          '<div class="lpp-post-images" style="margin-top:8px;">' + m.images.map(function (img) {
            return '<img src="' + img + '" class="lpp-post-img" style="max-width:180px;max-height:180px;border-radius:8px;margin-right:6px;margin-bottom:6px;cursor:pointer;" />';
          }).join('') + '</div>' : '') +
        '<div class="lpp-moment-actions">' +
          '<button class="lpp-moment-action-btn ' + (isLiked ? 'liked' : '') + '" id="lpp-moment-like-btn">' + likeText + '</button>' +
        '</div>' +
        '<div class="lpp-moment-comments" id="lpp-moment-comments">' + commentsHTML + '</div>' +
        '<div class="lpp-moment-comment-input">' +
          '<select id="lpp-moment-comment-author" style="width:120px;padding:6px 8px;font-size:12px;border:1px solid var(--border-purple);border-radius:6px;background:rgba(255,255,255,0.8);color:var(--text-dark);font-family:var(--font-body);">' + authorOptionsHTML + '</select>' +
          '<input type="text" id="lpp-moment-comment-input" placeholder="写下评论..." />' +
          '<button id="lpp-moment-comment-btn">评论</button>' +
        '</div>' +
      '</div>';

    // 绑定点赞
    var likeBtn = document.getElementById('lpp-moment-like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', function () {
        var currentAuthorId = authors.length > 0 ? authors[0].id : '';
        var idx = m.likes.indexOf(currentAuthorId);
        if (idx >= 0) {
          m.likes.splice(idx, 1);
        } else {
          m.likes.push(currentAuthorId);
        }
        saveLppData();
        openMomentDetail(momentId); // 重新渲染
      });
    }

    // 绑定评论
    var commentBtn = document.getElementById('lpp-moment-comment-btn');
    var commentInput = document.getElementById('lpp-moment-comment-input');
    var commentAuthor = document.getElementById('lpp-moment-comment-author');
    if (commentBtn && commentInput && commentAuthor) {
      var doComment = function () {
        var text = commentInput.value.trim();
        var fromId = commentAuthor.value;
        if (!text || !fromId) return;
        m.comments.push({ from: fromId, text: text, time: Date.now() });
        saveLppData();
        renderLppMomentList();
        openMomentDetail(momentId);
      };
      commentBtn.addEventListener('click', doComment);
      commentInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doComment();
      });
    }

    // 绑定删除动态
    var delBtn = document.getElementById('lpp-moment-del-btn');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (confirm('确定删除这条朋友圈动态吗？')) {
          deleteLppMoment(momentId);
        }
      });
    }

    showLppPanel('lpp-moment-detail');
  }

  function deleteLppMoment(momentId) {
    for (var i = 0; i < lppData.moments.length; i++) {
      if (lppData.moments[i].id === momentId) {
        lppData.moments.splice(i, 1);
        saveLppData();
        renderLppMomentList();
        showLppEmpty();
        return;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  论坛
  // ═══════════════════════════════════════════════════════════════

  function initLppForum() {
    var postBtn = document.getElementById('lpp-post-forum-btn');
    if (postBtn) {
      postBtn.addEventListener('click', openPostForumModal);
    }
    var closeBtn = document.getElementById('lpp-close-forum');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        document.getElementById('lpp-post-forum-modal').style.display = 'none';
      });
    }
    var submitBtn = document.getElementById('lpp-forum-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitForumPost);
    }
    // 图片上传
    var forumImgBtn = document.getElementById('lpp-forum-img-btn');
    var forumImgInput = document.getElementById('lpp-forum-image-input');
    if (forumImgBtn && forumImgInput) {
      forumImgBtn.addEventListener('click', function () { forumImgInput.click(); });
      forumImgInput.addEventListener('change', function () {
        handleLppImageUpload(forumImgInput, 'lpp-forum-img-preview', function (dataURL) {
          lppForumPendingImage = dataURL;
        });
      });
    }
    // 删除账号
    var forumDelAcc = document.getElementById('lpp-forum-del-account');
    if (forumDelAcc) {
      forumDelAcc.addEventListener('click', function () {
        var sel = document.getElementById('lpp-forum-author');
        if (sel) deleteLppAccountFromSelect(sel);
      });
    }
    // 转发弹窗
    var repostClose = document.getElementById('lpp-close-repost-forum');
    if (repostClose) {
      repostClose.addEventListener('click', function () {
        document.getElementById('lpp-repost-forum-modal').style.display = 'none';
      });
    }
    var repostNewAcc = document.getElementById('lpp-repost-forum-new-account');
    if (repostNewAcc) {
      repostNewAcc.addEventListener('click', openCreateAccountModal);
    }
    var repostSubmit = document.getElementById('lpp-repost-forum-submit');
    if (repostSubmit) {
      repostSubmit.addEventListener('click', submitRepostForum);
    }
  }

  function renderLppForumList() {
    var list = document.getElementById('lpp-forum-list');
    if (!list || !lppData) return;
    list.innerHTML = '';

    if (lppData.forumPosts.length === 0) {
      list.innerHTML = '<div class="lpp-list-empty">还没有帖子，点 + 发布</div>';
      return;
    }

    var sorted = lppData.forumPosts.slice().sort(function (a, b) { return b.time - a.time; });

    sorted.forEach(function (p) {
      var item = document.createElement('div');
      item.className = 'lpp-forum-item';
      item.innerHTML =
        '<div class="lpp-forum-title">' + escapeHtml(p.title) + '</div>' +
        '<div class="lpp-forum-meta">' +
          '<span class="lpp-forum-author">' + escapeHtml(p.authorName || '未知') + '</span>' +
          '<span>' + lppFormatTime(p.time) + '</span>' +
          '<span class="lpp-forum-replies">回复(' + (p.replies ? p.replies.length : 0) + ')</span>' +
          (p.images && p.images.length > 0 ? '<span>[图片]</span>' : '') +
          (p.repostOf ? '<span style="color:rgba(16,185,129,0.8);">[转发]</span>' : '') +
        '</div>';
      item.addEventListener('click', function () {
        openForumDetail(p.id);
      });
      var delBtn = document.createElement('button');
      delBtn.className = 'lpp-delete-btn lpp-delete-inline';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除';
      delBtn.title = '删除帖子';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('确定删除这个帖子吗？')) {
          deleteForumPost(p.id);
        }
      });
      var repostBtn = document.createElement('button');
      repostBtn.className = 'lpp-delete-btn lpp-delete-inline';
      repostBtn.style.borderColor = 'rgba(16,185,129,0.4)';
      repostBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 转发';
      repostBtn.title = '转发帖子';
      repostBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openRepostForumModal(p.id);
      });
      item.style.position = 'relative';
      item.appendChild(repostBtn);
      item.appendChild(delBtn);
      list.appendChild(item);
    });
  }

  function openPostForumModal() {
    var sel = document.getElementById('lpp-forum-author');
    if (!sel) return;

    fillAuthorSelect(sel);
    document.getElementById('lpp-forum-title').value = '';
    document.getElementById('lpp-forum-text').value = '';
    var imgPreview = document.getElementById('lpp-forum-img-preview');
    if (imgPreview) imgPreview.innerHTML = '';
    lppForumPendingImage = '';
    var imgInput = document.getElementById('lpp-forum-image-input');
    if (imgInput) imgInput.value = '';
    showLppPanel('lpp-post-forum-modal');
  }

  var lppForumPendingImage = '';

  function submitForumPost() {
    var authorId = document.getElementById('lpp-forum-author').value;
    var title = document.getElementById('lpp-forum-title').value.trim();
    var text = document.getElementById('lpp-forum-text').value.trim();
    if (!authorId || !title || !text) return;

    var author = findLppAuthor(authorId);
    lppData.forumPosts.push({
      id: lppUUID(),
      authorId: authorId,
      authorName: author ? author.name : '未知',
      title: title,
      content: text,
      time: Date.now(),
      replies: [],
      images: lppForumPendingImage ? [lppForumPendingImage] : []
    });
    saveLppData();
    renderLppForumList();
    showLppEmpty();
  }

  var lppRepostForumSourceId = '';

  function openRepostForumModal(sourceId) {
    lppRepostForumSourceId = sourceId;
    var src = null;
    for (var i = 0; i < lppData.forumPosts.length; i++) {
      if (lppData.forumPosts[i].id === sourceId) { src = lppData.forumPosts[i]; break; }
    }
    if (!src) return;
    var sel = document.getElementById('lpp-repost-forum-author');
    if (sel) fillAuthorSelect(sel);
    var preview = document.getElementById('lpp-repost-forum-preview');
    if (preview) {
      preview.innerHTML = escapeHtml(src.authorName || '') + '：' + escapeHtml(src.title) + ' — ' + escapeHtml(src.content.substring(0, 100));
    }
    document.getElementById('lpp-repost-forum-text').value = '';
    showLppPanel('lpp-repost-forum-modal');
  }

  function submitRepostForum() {
    var authorId = document.getElementById('lpp-repost-forum-author').value;
    var text = document.getElementById('lpp-repost-forum-text').value.trim();
    if (!authorId || !lppRepostForumSourceId) return;
    var src = null;
    for (var i = 0; i < lppData.forumPosts.length; i++) {
      if (lppData.forumPosts[i].id === lppRepostForumSourceId) { src = lppData.forumPosts[i]; break; }
    }
    if (!src) return;
    var author = findLppAuthor(authorId);
    var title = '转发：' + src.title;
    var content = (text ? text + '\n\n' : '') + '——转发自 @' + (src.authorName || '未知') + ' 的帖子《' + src.title + '》\n' + src.content;
    lppData.forumPosts.push({
      id: lppUUID(),
      authorId: authorId,
      authorName: author ? author.name : '未知',
      title: title,
      content: content,
      time: Date.now(),
      replies: [],
      images: [],
      repostOf: src.id,
      repostOfAuthor: src.authorName,
      repostOfTitle: src.title,
      repostOfContent: src.content
    });
    saveLppData();
    renderLppForumList();
    showLppEmpty();
    lppRepostForumSourceId = '';
  }

  function openForumDetail(postId) {
    var p = null;
    for (var i = 0; i < lppData.forumPosts.length; i++) {
      if (lppData.forumPosts[i].id === postId) {
        p = lppData.forumPosts[i];
        break;
      }
    }
    if (!p) return;

    var container = document.getElementById('lpp-forum-detail');
    if (!container) return;

    var repliesHTML = '';
    if (p.replies) {
      p.replies.forEach(function (r, rIdx) {
        var rAuthor = findLppAuthor(r.from);
        var rAvatarHTML = makeAuthorAvatarHTML(rAuthor);

        repliesHTML +=
          '<div class="lpp-forum-reply" data-reply-idx="' + rIdx + '">' +
            '<div class="lpp-forum-reply-avatar">' + rAvatarHTML + '</div>' +
            '<div class="lpp-forum-reply-info">' +
              '<div class="lpp-forum-reply-header">' +
                '<span class="lpp-forum-reply-name">' + escapeHtml(rAuthor.name) + '</span>' +
                '<span class="lpp-forum-reply-time">' + lppFormatTime(r.time) + '</span>' +
              '</div>' +
              '<div class="lpp-forum-reply-text">' + escapeHtml(r.text) + '</div>' +
            '</div>' +
            '<button class="lpp-delete-btn lpp-delete-inline" data-del-reply="' + rIdx + '" title="删除回复"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除</button>' +
          '</div>';
      });
    }

    var authors = getLppAllAuthors();
    var authorOptionsHTML = '';
    authors.forEach(function (a) {
      authorOptionsHTML += '<option value="' + a.id + '">' + escapeHtml(a.name) + '</option>';
    });

    container.innerHTML =
      '<div class="lpp-forum-detail">' +
        '<div class="lpp-forum-detail-title">' + escapeHtml(p.title) + '</div>' +
        '<div class="lpp-forum-detail-meta">' +
          '<span class="lpp-forum-detail-author">' + escapeHtml(p.authorName || '未知') + '</span>' +
          '<span>' + lppFormatTime(p.time) + '</span>' +
          '<button class="lpp-delete-btn" id="lpp-forum-repost-btn" title="转发帖子" style="margin-left:auto;opacity:0.6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 转发</button>' +
        '</div>' +
        '<div class="lpp-forum-detail-content">' + escapeHtml(p.content) + '</div>' +
        (p.images && p.images.length > 0 ?
          '<div class="lpp-post-images">' + p.images.map(function (img) {
            return '<img src="' + img + '" class="lpp-post-img" style="max-width:180px;max-height:180px;border-radius:8px;margin-right:6px;margin-bottom:6px;cursor:pointer;" />';
          }).join('') + '</div>' : '') +
        (p.repostOf ?
          '<div class="lpp-repost-quote" style="margin-top:8px;padding:10px 12px;border-left:3px solid var(--border-purple);background:rgba(160,140,200,0.06);border-radius:0 8px 8px 0;font-size:13px;color:var(--text-muted);"><span style="font-weight:600;color:var(--text-dark);">@' + escapeHtml(p.repostOfAuthor || '') + '</span> 《' + escapeHtml(p.repostOfTitle || '') + '》<br/>' + escapeHtml(p.repostOfContent || '') + '</div>' : '') +
        '<div class="lpp-forum-replies-title">回复(' + (p.replies ? p.replies.length : 0) + ')</div>' +
        '<div id="lpp-forum-replies">' + repliesHTML + '</div>' +
        '<div class="lpp-forum-reply-input">' +
          '<select id="lpp-forum-reply-author" style="width:120px;padding:6px 8px;font-size:12px;border:1px solid var(--border-purple);border-radius:6px;background:rgba(255,255,255,0.8);color:var(--text-dark);font-family:var(--font-body);">' + authorOptionsHTML + '</select>' +
          '<input type="text" id="lpp-forum-reply-input" placeholder="写下回复..." />' +
          '<button id="lpp-forum-reply-btn">回复</button>' +
        '</div>' +
      '</div>';

    var replyBtn = document.getElementById('lpp-forum-reply-btn');
    var replyInput = document.getElementById('lpp-forum-reply-input');
    var replyAuthor = document.getElementById('lpp-forum-reply-author');
    if (replyBtn && replyInput && replyAuthor) {
      var doReply = function () {
        var text = replyInput.value.trim();
        var fromId = replyAuthor.value;
        if (!text || !fromId) return;
        if (!p.replies) p.replies = [];
        p.replies.push({ from: fromId, text: text, time: Date.now() });
        saveLppData();
        renderLppForumList();
        openForumDetail(postId);
      };
      replyBtn.addEventListener('click', doReply);
      replyInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doReply();
      });
    }

    showLppPanel('lpp-forum-detail');

    // 绑定转发按钮
    var forumRepostBtn = document.getElementById('lpp-forum-repost-btn');
    if (forumRepostBtn) {
      forumRepostBtn.addEventListener('click', function () {
        openRepostForumModal(postId);
      });
    }

    // 绑定回复删除按钮
    var replyDelBtns = container.querySelectorAll('[data-del-reply]');
    replyDelBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-del-reply'), 10);
        if (confirm('确定删除这条回复吗？')) {
          deleteForumReply(postId, idx);
        }
      });
    });
  }

  function deleteForumPost(postId) {
    for (var i = 0; i < lppData.forumPosts.length; i++) {
      if (lppData.forumPosts[i].id === postId) {
        lppData.forumPosts.splice(i, 1);
        saveLppData();
        renderLppForumList();
        showLppEmpty();
        return;
      }
    }
  }

  function deleteForumReply(postId, replyIdx) {
    for (var i = 0; i < lppData.forumPosts.length; i++) {
      if (lppData.forumPosts[i].id === postId) {
        var p = lppData.forumPosts[i];
        if (p.replies && replyIdx >= 0 && replyIdx < p.replies.length) {
          p.replies.splice(replyIdx, 1);
          saveLppData();
          renderLppForumList();
          openForumDetail(postId);
        }
        return;
      }
    }
  }

  // ── 工具：按ID找联系人 ────────────────────────────────────────
  function findLppContact(id) {
    for (var i = 0; i < lppData.contacts.length; i++) {
      if (lppData.contacts[i].id === id) return lppData.contacts[i];
    }
    return null;
  }

  // ── 工具：HTML转义 ────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


  // ═══════════════════════════════════════════════════════════════
  //  账号系统
  // ═══════════════════════════════════════════════════════════════

  var lppSelectedAccountColor = '#8b5cf6';

  function findLppAccount(id) {
    if (!lppData || !lppData.accounts) return null;
    for (var i = 0; i < lppData.accounts.length; i++) {
      if (lppData.accounts[i].id === id) return lppData.accounts[i];
    }
    return null;
  }

  // 获取所有可发帖身份：自定义账号 + 好友
  function getLppAllAuthors() {
    var authors = [];
    if (lppData.accounts) {
      lppData.accounts.forEach(function (a) {
        authors.push({
          id: a.id,
          name: a.name,
          avatar: a.avatar || '',
          color: a.color || '#8b5cf6',
          type: 'account'
        });
      });
    }
    if (lppData.contacts) {
      lppData.contacts.forEach(function (c) {
        authors.push({
          id: c.id,
          name: c.name,
          avatar: c.avatar || '',
          color: '#6b7280',
          type: 'contact'
        });
      });
    }
    return authors;
  }

  // 图片上传工具：读取文件 → base64 → 显示预览（不压缩）
  function handleLppImageUpload(inputEl, previewId, callback) {
    if (!inputEl || !inputEl.files || inputEl.files.length === 0) return;
    var file = inputEl.files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var dataURL = e.target.result;
      var preview = document.getElementById(previewId);
      if (preview) {
        preview.innerHTML = '<img src="' + dataURL + '" style="max-width:120px;max-height:120px;border-radius:8px;border:1px solid var(--border-purple);" /><button class="lpp-img-remove" style="position:absolute;top:-6px;left:108px;background:var(--crimson);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1;">&times;</button>';
        preview.style.position = 'relative';
        preview.style.display = 'inline-block';
        var removeBtn = preview.querySelector('.lpp-img-remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', function () {
            preview.innerHTML = '';
            preview.style.display = 'none';
            inputEl.value = '';
            if (callback) callback('');
          });
        }
      }
      if (callback) callback(dataURL);
    };
    reader.readAsDataURL(file);
  }

  // 删除账号（从 select 弹窗触发）
  function deleteLppAccountFromSelect(sel) {
    if (!sel) return;
    var accId = sel.value;
    if (!accId) {
      alert('请先选择要删除的账号');
      return;
    }
    var acc = findLppAccount(accId);
    if (!acc) {
      alert('选中的不是账号，无法删除');
      return;
    }
    if (!confirm('确定删除账号"' + acc.name + '"吗？\n该账号发布的内容将保留但显示为"未知"。')) {
      return;
    }
    for (var i = 0; i < lppData.accounts.length; i++) {
      if (lppData.accounts[i].id === accId) {
        lppData.accounts.splice(i, 1);
        break;
      }
    }
    saveLppData();
    // 刷新当前弹窗的下拉
    fillAuthorSelect(sel);
    renderLppForumList();
    renderLppWeiboList();
    renderLppMomentList();
    renderLppContactList();
    renderLppChatList();
  }

  function findLppAuthor(id) {
    var acc = findLppAccount(id);
    if (acc) return { id: acc.id, name: acc.name, avatar: acc.avatar || '', color: acc.color || '#8b5cf6', type: 'account' };
    var con = findLppContact(id);
    if (con) return { id: con.id, name: con.name, avatar: con.avatar || '', color: '#6b7280', type: 'contact' };
    return { id: id, name: '未知', avatar: '', color: '#6b7280', type: 'unknown' };
  }

  function makeAuthorAvatarHTML(author) {
    if (author.avatar) {
      return '<div class="lpp-account-avatar"><img src="' + author.avatar + '"></div>';
    }
    return '<div class="lpp-account-avatar" style="background:' + (author.color || '#8b5cf6') + '">' +
      escapeHtml((author.name || '?')[0]) + '</div>';
  }

  // 填充作者下拉框
  function fillAuthorSelect(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    var authors = getLppAllAuthors();
    if (authors.length === 0) {
      selectEl.innerHTML = '<option value="">请先创建账号或添加好友</option>';
      return;
    }
    authors.forEach(function (a) {
      var opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name + (a.type === 'account' ? ' (账号)' : ' (好友)');
      selectEl.appendChild(opt);
    });
  }

  function initLppAccounts() {
    // 论坛侧边栏新建账号按钮
    var forumAccBtn = document.getElementById('lpp-forum-account-btn');
    if (forumAccBtn) {
      forumAccBtn.addEventListener('click', openCreateAccountModal);
    }
    // 微博侧边栏新建账号按钮
    var weiboAccBtn = document.getElementById('lpp-weibo-account-btn');
    if (weiboAccBtn) {
      weiboAccBtn.addEventListener('click', openCreateAccountModal);
    }
    // 弹窗内的"新建账号"链接
    var forumLink = document.getElementById('lpp-forum-new-account-link');
    if (forumLink) forumLink.addEventListener('click', openCreateAccountModal);
    var weiboLink = document.getElementById('lpp-weibo-new-account-link');
    if (weiboLink) weiboLink.addEventListener('click', openCreateAccountModal);
    var momentLink = document.getElementById('lpp-moment-new-account-link');
    if (momentLink) momentLink.addEventListener('click', openCreateAccountModal);

    // 关闭按钮
    var closeBtn = document.getElementById('lpp-close-account');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        document.getElementById('lpp-create-account-modal').style.display = 'none';
      });
    }

    // 颜色选择器
    var colorPicker = document.getElementById('lpp-account-color-picker');
    if (colorPicker) {
      colorPicker.querySelectorAll('.lpp-color-dot').forEach(function (dot) {
        dot.addEventListener('click', function () {
          colorPicker.querySelectorAll('.lpp-color-dot').forEach(function (d) { d.classList.remove('active'); });
          dot.classList.add('active');
          lppSelectedAccountColor = dot.getAttribute('data-color');
        });
      });
    }

    // 提交按钮
    var submitBtn = document.getElementById('lpp-account-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitCreateAccount);
    }
  }

  function openCreateAccountModal() {
    document.getElementById('lpp-account-name').value = '';
    document.getElementById('lpp-account-bio').value = '';
    // 重置颜色选择
    lppSelectedAccountColor = '#8b5cf6';
    var colorPicker = document.getElementById('lpp-account-color-picker');
    if (colorPicker) {
      colorPicker.querySelectorAll('.lpp-color-dot').forEach(function (d) {
        d.classList.toggle('active', d.getAttribute('data-color') === '#8b5cf6');
      });
    }
    showLppPanel('lpp-create-account-modal');
  }

  function submitCreateAccount() {
    var name = document.getElementById('lpp-account-name').value.trim();
    var bio = document.getElementById('lpp-account-bio').value.trim();
    if (!name) return;

    lppData.accounts.push({
      id: lppUUID(),
      name: name,
      bio: bio,
      color: lppSelectedAccountColor,
      avatar: '',
      createdAt: Date.now()
    });
    saveLppData();
    document.getElementById('lpp-create-account-modal').style.display = 'none';
    // 刷新当前面板
    if (lppCurrentTab === 'forum') {
      openPostForumModal();
    } else if (lppCurrentTab === 'weibo') {
      openPostWeiboModal();
    } else if (lppCurrentTab === 'moments') {
      openPostMomentModal();
    } else {
      showLppEmpty();
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  微博
  // ═══════════════════════════════════════════════════════════════

  function initLppWeibo() {
    var postBtn = document.getElementById('lpp-post-weibo-btn');
    if (postBtn) {
      postBtn.addEventListener('click', openPostWeiboModal);
    }
    var closeBtn = document.getElementById('lpp-close-weibo');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        document.getElementById('lpp-post-weibo-modal').style.display = 'none';
      });
    }
    var submitBtn = document.getElementById('lpp-weibo-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitWeiboPost);
    }
    // 图片上传
    var weiboImgBtn = document.getElementById('lpp-weibo-img-btn');
    var weiboImgInput = document.getElementById('lpp-weibo-image-input');
    if (weiboImgBtn && weiboImgInput) {
      weiboImgBtn.addEventListener('click', function () { weiboImgInput.click(); });
      weiboImgInput.addEventListener('change', function () {
        handleLppImageUpload(weiboImgInput, 'lpp-weibo-img-preview', function (dataURL) {
          lppWeiboPendingImage = dataURL;
        });
      });
    }
    // 删除账号
    var weiboDelAcc = document.getElementById('lpp-weibo-del-account');
    if (weiboDelAcc) {
      weiboDelAcc.addEventListener('click', function () {
        var sel = document.getElementById('lpp-weibo-author');
        if (sel) deleteLppAccountFromSelect(sel);
      });
    }
    // 转发弹窗
    var repostClose = document.getElementById('lpp-close-repost-weibo');
    if (repostClose) {
      repostClose.addEventListener('click', function () {
        document.getElementById('lpp-repost-weibo-modal').style.display = 'none';
      });
    }
    var repostNewAcc = document.getElementById('lpp-repost-weibo-new-account');
    if (repostNewAcc) {
      repostNewAcc.addEventListener('click', openCreateAccountModal);
    }
    var repostSubmit = document.getElementById('lpp-repost-weibo-submit');
    if (repostSubmit) {
      repostSubmit.addEventListener('click', submitRepostWeibo);
    }
  }

  function renderLppWeiboList() {
    var list = document.getElementById('lpp-weibo-list');
    if (!list || !lppData) return;
    list.innerHTML = '';

    if (!lppData.weiboPosts || lppData.weiboPosts.length === 0) {
      list.innerHTML = '<div class="lpp-list-empty">还没有微博，点 + 发布</div>';
      return;
    }

    var sorted = lppData.weiboPosts.slice().sort(function (a, b) { return b.time - a.time; });

    sorted.forEach(function (w) {
      var author = findLppAuthor(w.authorId);
      var item = document.createElement('div');
      item.className = 'lpp-weibo-item';
      item.innerHTML =
        makeAuthorAvatarHTML(author) +
        '<div class="lpp-weibo-item-content">' +
          '<div class="lpp-weibo-item-name">' + escapeHtml(author.name) + '</div>' +
          '<div class="lpp-weibo-item-text">' + escapeHtml(w.content) + '</div>' +
          (w.images && w.images.length > 0 ? '<div style="margin-top:4px;font-size:12px;color:var(--text-muted);">[图片]</div>' : '') +
          (w.repostOf ? '<div style="margin-top:4px;font-size:12px;color:var(--text-muted);border-left:2px solid var(--border-purple);padding-left:6px;">转发 @' + escapeHtml(w.repostOfAuthor || '') + '</div>' : '') +
          '<div class="lpp-weibo-item-meta">' +
            lppFormatTime(w.time) + ' · ' +
            (w.likes ? w.likes.length : 0) + '赞 · ' +
            (w.comments ? w.comments.length : 0) + '评论 · ' +
            (w.reposts ? w.reposts.length : 0) + '转发' +
          '</div>' +
        '</div>';
      item.addEventListener('click', function () {
        openWeiboDetail(w.id);
      });
      var delBtn = document.createElement('button');
      delBtn.className = 'lpp-delete-btn lpp-delete-inline';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除';
      delBtn.title = '删除微博';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('确定删除这条微博吗？')) {
          deleteWeiboPost(w.id);
        }
      });
      var repostBtn = document.createElement('button');
      repostBtn.className = 'lpp-delete-btn lpp-delete-inline';
      repostBtn.style.borderColor = 'rgba(16,185,129,0.4)';
      repostBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 转发';
      repostBtn.title = '转发微博';
      repostBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openRepostWeiboModal(w.id);
      });
      item.style.position = 'relative';
      item.appendChild(repostBtn);
      item.appendChild(delBtn);
      list.appendChild(item);
    });
  }

  function openPostWeiboModal() {
    var sel = document.getElementById('lpp-weibo-author');
    if (!sel) return;
    fillAuthorSelect(sel);
    document.getElementById('lpp-weibo-text').value = '';
    var imgPreview = document.getElementById('lpp-weibo-img-preview');
    if (imgPreview) imgPreview.innerHTML = '';
    lppWeiboPendingImage = '';
    var imgInput = document.getElementById('lpp-weibo-image-input');
    if (imgInput) imgInput.value = '';
    showLppPanel('lpp-post-weibo-modal');
  }

  var lppWeiboPendingImage = '';

  function submitWeiboPost() {
    var authorId = document.getElementById('lpp-weibo-author').value;
    var text = document.getElementById('lpp-weibo-text').value.trim();
    if (!authorId || !text) return;

    lppData.weiboPosts.push({
      id: lppUUID(),
      authorId: authorId,
      content: text,
      time: Date.now(),
      likes: [],
      comments: [],
      reposts: [],
      images: lppWeiboPendingImage ? [lppWeiboPendingImage] : []
    });
    saveLppData();
    renderLppWeiboList();
    showLppEmpty();
  }

  var lppWeiboDetailTab = 'comments';
  var lppRepostWeiboSourceId = '';

  function openRepostWeiboModal(sourceId) {
    lppRepostWeiboSourceId = sourceId;
    var src = null;
    for (var i = 0; i < lppData.weiboPosts.length; i++) {
      if (lppData.weiboPosts[i].id === sourceId) { src = lppData.weiboPosts[i]; break; }
    }
    if (!src) return;
    var sel = document.getElementById('lpp-repost-weibo-author');
    if (sel) fillAuthorSelect(sel);
    var preview = document.getElementById('lpp-repost-weibo-preview');
    if (preview) {
      var srcAuthor = findLppAuthor(src.authorId);
      preview.innerHTML = '@' + escapeHtml(srcAuthor.name) + '：' + escapeHtml(src.content);
    }
    document.getElementById('lpp-repost-weibo-text').value = '';
    showLppPanel('lpp-repost-weibo-modal');
  }

  function submitRepostWeibo() {
    var authorId = document.getElementById('lpp-repost-weibo-author').value;
    var text = document.getElementById('lpp-repost-weibo-text').value.trim();
    if (!authorId || !lppRepostWeiboSourceId) return;
    var src = null;
    for (var i = 0; i < lppData.weiboPosts.length; i++) {
      if (lppData.weiboPosts[i].id === lppRepostWeiboSourceId) { src = lppData.weiboPosts[i]; break; }
    }
    if (!src) return;
    var srcAuthor = findLppAuthor(src.authorId);
    lppData.weiboPosts.push({
      id: lppUUID(),
      authorId: authorId,
      content: text,
      time: Date.now(),
      likes: [],
      comments: [],
      reposts: [],
      repostOf: src.id,
      repostOfAuthor: srcAuthor.name,
      repostOfContent: src.content,
      images: []
    });
    // 给原帖加一条 repost 记录
    if (!src.reposts) src.reposts = [];
    src.reposts.push({ authorId: authorId, text: text, time: Date.now() });
    saveLppData();
    renderLppWeiboList();
    showLppEmpty();
    lppRepostWeiboSourceId = '';
  }

  function openWeiboDetail(postId) {
    var w = null;
    for (var i = 0; i < lppData.weiboPosts.length; i++) {
      if (lppData.weiboPosts[i].id === postId) {
        w = lppData.weiboPosts[i];
        break;
      }
    }
    if (!w) return;

    var container = document.getElementById('lpp-weibo-detail');
    if (!container) return;

    lppWeiboDetailTab = 'comments';
    renderWeiboDetailContent(container, w, postId);

    showLppPanel('lpp-weibo-detail');
  }

  function renderWeiboDetailContent(container, w, postId) {
    var author = findLppAuthor(w.authorId);
    var liked = w.likes && w.likes.length > 0;
    var authors = getLppAllAuthors();
    var authorOptionsHTML = '';
    authors.forEach(function (a) {
      authorOptionsHTML += '<option value="' + a.id + '">' + escapeHtml(a.name) + '</option>';
    });

    // 评论列表
    var commentsHTML = '';
    if (w.comments && w.comments.length > 0) {
      w.comments.forEach(function (c, cIdx) {
        var cAuthor = findLppAuthor(c.authorId);
        commentsHTML +=
          '<div class="lpp-weibo-comment" data-comment-idx="' + cIdx + '">' +
            makeAuthorAvatarHTML(cAuthor) +
            '<div class="lpp-weibo-comment-content">' +
              '<div class="lpp-weibo-comment-name">' + escapeHtml(cAuthor.name) + '</div>' +
              '<div class="lpp-weibo-comment-text">' + escapeHtml(c.text) + '</div>' +
              '<div class="lpp-weibo-comment-time">' + lppFormatTime(c.time) + '</div>' +
            '</div>' +
            '<button class="lpp-delete-btn lpp-delete-inline" data-del-comment="' + cIdx + '" title="删除评论"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除</button>' +
          '</div>';
      });
    } else {
      commentsHTML = '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">还没有评论</div>';
    }

    // 转发列表
    var repostsHTML = '';
    if (w.reposts && w.reposts.length > 0) {
      w.reposts.forEach(function (r, rIdx) {
        var rAuthor = findLppAuthor(r.authorId);
        repostsHTML +=
          '<div class="lpp-weibo-repost" data-repost-idx="' + rIdx + '">' +
            makeAuthorAvatarHTML(rAuthor) +
            '<div class="lpp-weibo-repost-content">' +
              '<div class="lpp-weibo-repost-name">' + escapeHtml(rAuthor.name) + '</div>' +
              (r.text ? '<div class="lpp-weibo-repost-text">' + escapeHtml(r.text) + '</div>' : '') +
              '<div class="lpp-weibo-repost-time">' + lppFormatTime(r.time) + '</div>' +
            '</div>' +
            '<button class="lpp-delete-btn lpp-delete-inline" data-del-repost="' + rIdx + '" title="删除转发"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除</button>' +
          '</div>';
      });
    } else {
      repostsHTML = '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">还没有转发</div>';
    }

    var interactionsHTML = lppWeiboDetailTab === 'comments' ? commentsHTML : repostsHTML;
    var inputPlaceholder = lppWeiboDetailTab === 'comments' ? '写下评论...' : '说点什么（可留空）...';
    var inputBtnText = lppWeiboDetailTab === 'comments' ? '评论' : '转发';

    container.innerHTML =
      '<div class="lpp-weibo-detail">' +
        '<div class="lpp-weibo-detail-card">' +
          '<div class="lpp-weibo-detail-header">' +
            makeAuthorAvatarHTML(author) +
            '<div>' +
              '<div class="lpp-weibo-detail-name">' + escapeHtml(author.name) + '</div>' +
              '<div class="lpp-weibo-detail-time">' + lppFormatTime(w.time) + '</div>' +
            '</div>' +
            '<button class="lpp-delete-btn" id="lpp-weibo-del-post" title="删除微博" style="margin-left:auto;opacity:0.6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除</button>' +
            '<button class="lpp-delete-btn" id="lpp-weibo-repost-btn" title="转发微博" style="margin-left:4px;opacity:0.6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 转发</button>' +
          '</div>' +
          '<div class="lpp-weibo-detail-text">' + escapeHtml(w.content) + '</div>' +
          (w.images && w.images.length > 0 ?
            '<div class="lpp-post-images">' + w.images.map(function (img) {
              return '<img src="' + img + '" class="lpp-post-img" style="max-width:180px;max-height:180px;border-radius:8px;margin-right:6px;margin-bottom:6px;cursor:pointer;" />';
            }).join('') + '</div>' : '') +
          (w.repostOf ?
            '<div class="lpp-repost-quote" style="margin-top:8px;padding:10px 12px;border-left:3px solid var(--border-purple);background:rgba(160,140,200,0.06);border-radius:0 8px 8px 0;font-size:13px;color:var(--text-muted);"><span style="font-weight:600;color:var(--text-dark);">@' + escapeHtml(w.repostOfAuthor || '') + '</span>：' + escapeHtml(w.repostOfContent || '') + '</div>' : '') +
          '<div class="lpp-weibo-actions">' +
            '<div class="lpp-weibo-action' + (liked ? ' liked' : '') + '" id="lpp-weibo-like-btn">' +
              '<svg viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
              '<span>' + (w.likes ? w.likes.length : 0) + '</span>' +
            '</div>' +
            '<div class="lpp-weibo-action" id="lpp-weibo-comment-tab">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
              '<span>' + (w.comments ? w.comments.length : 0) + '</span>' +
            '</div>' +
            '<div class="lpp-weibo-action" id="lpp-weibo-repost-tab">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
              '<span>' + (w.reposts ? w.reposts.length : 0) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lpp-weibo-interactions">' +
          '<div class="lpp-weibo-tabs">' +
            '<span class="lpp-weibo-tab' + (lppWeiboDetailTab === 'comments' ? ' active' : '') + '" data-weibo-tab="comments">评论</span>' +
            '<span class="lpp-weibo-tab' + (lppWeiboDetailTab === 'reposts' ? ' active' : '') + '" data-weibo-tab="reposts">转发</span>' +
          '</div>' +
          '<div id="lpp-weibo-interaction-list">' + interactionsHTML + '</div>' +
          '<div class="lpp-weibo-input-bar">' +
            '<select id="lpp-weibo-input-author">' + authorOptionsHTML + '</select>' +
            '<input type="text" id="lpp-weibo-input-text" placeholder="' + inputPlaceholder + '" />' +
            '<button id="lpp-weibo-input-btn">' + inputBtnText + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 绑定事件
    var likeBtn = document.getElementById('lpp-weibo-like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', function () {
        if (!w.likes) w.likes = [];
        // 简单切换：有就移除，没有就加（用第一个账号或好友作为当前用户）
        var currentAuthorId = authors.length > 0 ? authors[0].id : '';
        var idx = w.likes.indexOf(currentAuthorId);
        if (idx >= 0) {
          w.likes.splice(idx, 1);
        } else {
          w.likes.push(currentAuthorId);
        }
        saveLppData();
        renderLppWeiboList();
        renderWeiboDetailContent(container, w, postId);
      });
    }

    var commentTab = document.getElementById('lpp-weibo-comment-tab');
    if (commentTab) {
      commentTab.addEventListener('click', function () {
        lppWeiboDetailTab = 'comments';
        renderWeiboDetailContent(container, w, postId);
      });
    }

    var repostTab = document.getElementById('lpp-weibo-repost-tab');
    if (repostTab) {
      repostTab.addEventListener('click', function () {
        lppWeiboDetailTab = 'reposts';
        renderWeiboDetailContent(container, w, postId);
      });
    }

    // tab 切换
    container.querySelectorAll('.lpp-weibo-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        lppWeiboDetailTab = tab.getAttribute('data-weibo-tab');
        renderWeiboDetailContent(container, w, postId);
      });
    });

    // 输入提交
    var inputBtn = document.getElementById('lpp-weibo-input-btn');
    var inputText = document.getElementById('lpp-weibo-input-text');
    var inputAuthor = document.getElementById('lpp-weibo-input-author');
    if (inputBtn && inputText && inputAuthor) {
      var doSubmit = function () {
        var text = inputText.value.trim();
        var authorId = inputAuthor.value;
        if (!authorId) return;
        // 转发允许空文字
        if (lppWeiboDetailTab === 'comments' && !text) return;

        if (lppWeiboDetailTab === 'comments') {
          if (!w.comments) w.comments = [];
          w.comments.push({ authorId: authorId, text: text, time: Date.now() });
        } else {
          if (!w.reposts) w.reposts = [];
          w.reposts.push({ authorId: authorId, text: text, time: Date.now() });
        }
        saveLppData();
        renderLppWeiboList();
        renderWeiboDetailContent(container, w, postId);
      };
      inputBtn.addEventListener('click', doSubmit);
      inputText.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doSubmit();
      });
    }

    // 绑定帖子删除
    var delPostBtn = document.getElementById('lpp-weibo-del-post');
    if (delPostBtn) {
      delPostBtn.addEventListener('click', function () {
        if (confirm('确定删除这条微博吗？')) {
          deleteWeiboPost(postId);
        }
      });
    }

    // 绑定转发按钮
    var repostBtn = document.getElementById('lpp-weibo-repost-btn');
    if (repostBtn) {
      repostBtn.addEventListener('click', function () {
        openRepostWeiboModal(postId);
      });
    }

    // 绑定评论删除
    container.querySelectorAll('[data-del-comment]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-del-comment'), 10);
        if (confirm('确定删除这条评论吗？')) {
          deleteWeiboComment(postId, idx);
        }
      });
    });

    // 绑定转发删除
    container.querySelectorAll('[data-del-repost]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-del-repost'), 10);
        if (confirm('确定删除这条转发吗？')) {
          deleteWeiboRepost(postId, idx);
        }
      });
    });
  }

  function deleteWeiboPost(postId) {
    for (var i = 0; i < lppData.weiboPosts.length; i++) {
      if (lppData.weiboPosts[i].id === postId) {
        lppData.weiboPosts.splice(i, 1);
        saveLppData();
        renderLppWeiboList();
        showLppEmpty();
        return;
      }
    }
  }

  function deleteWeiboComment(postId, commentIdx) {
    for (var i = 0; i < lppData.weiboPosts.length; i++) {
      if (lppData.weiboPosts[i].id === postId) {
        var w = lppData.weiboPosts[i];
        if (w.comments && commentIdx >= 0 && commentIdx < w.comments.length) {
          w.comments.splice(commentIdx, 1);
          saveLppData();
          renderLppWeiboList();
          var container = document.getElementById('lpp-weibo-detail');
          if (container) renderWeiboDetailContent(container, w, postId);
        }
        return;
      }
    }
  }

  function deleteWeiboRepost(postId, repostIdx) {
    for (var i = 0; i < lppData.weiboPosts.length; i++) {
      if (lppData.weiboPosts[i].id === postId) {
        var w = lppData.weiboPosts[i];
        if (w.reposts && repostIdx >= 0 && repostIdx < w.reposts.length) {
          w.reposts.splice(repostIdx, 1);
          saveLppData();
          renderLppWeiboList();
          var container = document.getElementById('lpp-weibo-detail');
          if (container) renderWeiboDetailContent(container, w, postId);
        }
        return;
      }
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  事件绑定
  // ═══════════════════════════════════════════════════════════════

  // ── 时间线卡片点击 → 详情页 ──────────────────────────────────
  function initTimelineCards() {
    var cards = document.querySelectorAll('.timeline-card[data-timeline]');
    cards.forEach(function (card) {
      var key = card.getAttribute('data-timeline');
      if (!key) return;

      card.addEventListener('click', function (e) {
        if (e.target.classList.contains('timeline-preview')) return;
        // IF线走独立的世界选择器页面
        if (key === 'ifline') {
          openIfWorlds();
          return;
        }
        openTimelineDetail(key);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  IF线 · 奇遇环游 · 世界选择器
  // ═══════════════════════════════════════════════════════════════

  function openIfWorlds() {
    renderIfWorldCards();
    if (window.OCEdit && window.OCEdit.onIfWorldsOpen) {
      window.OCEdit.onIfWorldsOpen();
    }
  }

  function renderIfWorldCards() {
    var grid = document.getElementById('if-worlds-grid');
    if (!grid) return;

    var worlds = loadIfWorlds();
    grid.innerHTML = '';

    if (worlds.length === 0) {
      grid.innerHTML = '<div class="if-worlds-empty">还没有创建任何世界，点击下方按钮新建一个吧。</div>';
      return;
    }

    worlds.forEach(function (world) {
      var card = createIfWorldCard(world);
      grid.appendChild(card);
    });
  }

  function createIfWorldCard(world) {
    var card = document.createElement('div');
    card.className = 'if-world-card';
    card.setAttribute('data-world-id', world.id);

    // 删除按钮
    var delBtn = document.createElement('button');
    delBtn.className = 'if-world-card-delete';
    delBtn.textContent = '×';
    delBtn.setAttribute('title', '删除世界');
    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteIfWorld(world.id);
    });

    // 图片区
    var imgWrap = document.createElement('div');
    imgWrap.className = 'if-world-card-image';
    if (world.image) imgWrap.classList.add('has-image');

    var img = document.createElement('img');
    if (world.image) img.src = world.image;

    var placeholder = document.createElement('div');
    placeholder.className = 'if-world-card-image-placeholder';
    placeholder.textContent = '点击上传图片';

    var imgInput = document.createElement('input');
    imgInput.type = 'file';
    imgInput.className = 'if-world-card-image-input';
    imgInput.accept = 'image/*';
    imgInput.addEventListener('change', function (e) {
      e.stopPropagation();
      var file = e.target.files[0];
      if (!file) return;
      handleImageUpload(file, function (dataUrl) {
        img.src = dataUrl;
        imgWrap.classList.add('has-image');
        world.image = dataUrl;
        saveIfWorlds(loadIfWorlds());
        if (window.showToast) window.showToast('图片已设置', 'success');
      });
      imgInput.value = '';
    });

    imgWrap.appendChild(img);
    imgWrap.appendChild(placeholder);
    imgWrap.appendChild(imgInput);

    // 世界名称（可编辑）
    var nameEl = document.createElement('div');
    nameEl.className = 'if-world-card-name';
    nameEl.setAttribute('contenteditable', 'true');
    nameEl.setAttribute('data-placeholder', '世界名称');
    nameEl.innerHTML = world.name || '';
    nameEl.addEventListener('click', function (e) { e.stopPropagation(); });
    nameEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
    });
    nameEl.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });
    nameEl.addEventListener('blur', function () {
      world.name = nameEl.textContent.trim();
      saveIfWorlds(loadIfWorlds());
    });

    // 进入世界按钮
    var enterBtn = document.createElement('button');
    enterBtn.className = 'if-world-enter-btn';
    enterBtn.textContent = '进入世界';
    enterBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      enterIfWorld(world.id);
    });

    card.appendChild(delBtn);
    card.appendChild(imgWrap);
    card.appendChild(nameEl);
    card.appendChild(enterBtn);

    return card;
  }

  function createNewIfWorld() {
    var worlds = loadIfWorlds();
    var world = {
      id: 'ifworld_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
      name: '',
      image: ''
    };
    worlds.push(world);
    saveIfWorlds(worlds);
    renderIfWorldCards();
    if (window.showToast) window.showToast('新世界已创建', 'success');
  }

  function deleteIfWorld(worldId) {
    var worlds = loadIfWorlds();
    var idx = -1;
    for (var i = 0; i < worlds.length; i++) {
      if (worlds[i].id === worldId) { idx = i; break; }
    }
    if (idx < 0) return;

    if (!window.confirm('确定删除这个世界吗？世界内的所有数据（角色、板块、小说等）将被清除。')) return;

    worlds.splice(idx, 1);
    saveIfWorlds(worlds);

    // 清理该世界的角色和小说数据
    var allChars = loadAllCharacters();
    if (allChars[worldId]) {
      delete allChars[worldId];
      saveAllCharacters(allChars);
    }
    var allNovels = loadAllNovels();
    if (allNovels[worldId]) {
      delete allNovels[worldId];
      saveAllNovels(allNovels);
    }

    renderIfWorldCards();
    if (window.showToast) window.showToast('世界已删除', 'success');
  }

  function enterIfWorld(worldId) {
    openTimelineDetail(worldId);
  }

  function initIfWorldsPage() {
    // 新建世界按钮
    var createBtn = document.getElementById('if-world-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        createNewIfWorld();
      });
    }

    // 返回总览按钮
    var backBtn = document.getElementById('btn-back-ifworlds');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (window.OCStorage) window.OCStorage.save();
        if (window.OCEdit && window.OCEdit.onIfWorldsBack) {
          window.OCEdit.onIfWorldsBack();
        }
      });
    }
  }

  // ── 凤凰羽毛按钮点击 → 板块编辑页 ────────────────────────────
  function initFeatherButtons() {
    var buttons = document.querySelectorAll('.feather-btn[data-section]');
    buttons.forEach(function (btn) {
      var sectionKey = btn.getAttribute('data-section');
      if (!sectionKey) return;

      btn.addEventListener('click', function () {
        openSectionEditor(sectionKey);
      });
    });
  }

  // ── 返回总览按钮 ──────────────────────────────────────────────
  function initDetailBack() {
    var btn = document.getElementById('btn-back-timeline');
    if (!btn) return;

    btn.addEventListener('click', function () {
      // 保存角色数据
      if (currentTimeline) {
        var chars = collectCharactersFromGrid();
        saveCharacters(currentTimeline, chars);
      }
      if (window.OCStorage) window.OCStorage.save();
      if (window.OCEdit && window.OCEdit.onDetailBack) {
        window.OCEdit.onDetailBack();
      }
    });
  }

  // ── 板块编辑页返回按钮 → 回到时间线详情页 ────────────────────
  function initSectionBack() {
    var btn = document.getElementById('btn-back-section');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (currentSection === 'factions') {
        saveCurrentFactionsState();
      }
      if (window.OCStorage) window.OCStorage.save();
      if (window.OCEdit && window.OCEdit.onSectionBack) {
        window.OCEdit.onSectionBack();
      }
    });
  }

  // ── 角色详情主页返回按钮 ──────────────────────────────────────
  function initCharacterBack() {
    var btn = document.getElementById('btn-back-character');
    if (!btn) return;

    btn.addEventListener('click', function () {
      saveCurrentCharacter();
      if (window.OCStorage) window.OCStorage.save();
      if (currentTimeline) {
        renderDetailCharacters(loadCharacters(currentTimeline));
      }
      if (window.OCEdit && window.OCEdit.onCharacterBack) {
        window.OCEdit.onCharacterBack();
      }
    });
  }

  // ── 角色详情主页头像上传 ──────────────────────────────────────
  function initCharacterHomeAvatar() {
    var input = document.getElementById('character-home-avatar-input');
    if (!input) return;

    input.addEventListener('change', function (e) {
      var file = e.target.files[0];
      handleImageUpload(file, function (dataUrl) {
        var img = document.getElementById('character-home-avatar-img');
        var wrap = document.getElementById('character-home-avatar');
        var placeholder = wrap ? wrap.querySelector('.avatar-placeholder') : null;
        if (img) {
          img.src = dataUrl;
          img.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        saveCurrentCharacter();
      });
      input.value = '';
    });
  }

  // ── 角色详情主页姓名/简介实时保存 ─────────────────────────────
  function initCharacterHomeFields() {
    var nameEl = document.getElementById('character-home-name');
    var descEl = document.getElementById('character-home-desc');

    if (nameEl) {
      // 单行：回车直接失焦保存
      nameEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          nameEl.blur();
        }
      });
      // 纯文本粘贴
      nameEl.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
      // 失焦保存 + 输入防抖保存
      nameEl.addEventListener('blur', saveCurrentCharacter);
      var nameTimer;
      nameEl.addEventListener('input', function () {
        clearTimeout(nameTimer);
        nameTimer = setTimeout(saveCurrentCharacter, 500);
      });
    }

    if (descEl) {
      // 纯文本粘贴
      descEl.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
      // 失焦保存 + 输入防抖保存
      descEl.addEventListener('blur', saveCurrentCharacter);
      var descTimer;
      descEl.addEventListener('input', function () {
        clearTimeout(descTimer);
        descTimer = setTimeout(saveCurrentCharacter, 500);
      });
    }
  }

  // ── 角色详情主页五个入口按钮 ──────────────────────────────────
  function initCharacterModuleButtons() {
    var galleryBtn = document.getElementById('btn-open-gallery');
    var storyBtn = document.getElementById('btn-open-story');
    var profileBtn = document.getElementById('btn-open-profile');
    var weaponsBtn = document.getElementById('btn-open-weapons');
    var skillsBtn = document.getElementById('btn-open-skills');

    if (galleryBtn) {
      galleryBtn.addEventListener('click', function () {
        saveCurrentCharacter();
        openCharacterGallery();
      });
    }
    if (storyBtn) {
      storyBtn.addEventListener('click', function () {
        saveCurrentCharacter();
        openCharacterStory();
      });
    }
    if (profileBtn) {
      profileBtn.addEventListener('click', function () {
        saveCurrentCharacter();
        openCharacterProfile();
      });
    }
    if (weaponsBtn) {
      weaponsBtn.addEventListener('click', function () {
        saveCurrentCharacter();
        openCharacterWeapons();
      });
    }
    if (skillsBtn) {
      skillsBtn.addEventListener('click', function () {
        saveCurrentCharacter();
        openCharacterSkills();
      });
    }
  }

  // ── 画廊页 ────────────────────────────────────────────────────
  function initGalleryPage() {
    var addBtn = document.getElementById('add-gallery-item-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { addGalleryItem(); });
    }

    var addSectionBtn = document.getElementById('gallery-add-section-btn');
    if (addSectionBtn) {
      addSectionBtn.addEventListener('click', function () { addGallerySection(); });
    }
  }

  function initGalleryBack() {
    var btn = document.getElementById('btn-back-gallery');
    if (!btn) return;
    btn.addEventListener('click', function () {
      saveCharacterGallery();
      if (window.OCStorage) window.OCStorage.save();
      openCharacterEditor(currentEditingCharIndex);
      if (window.OCEdit && window.OCEdit.onCharacterGalleryBack) {
        window.OCEdit.onCharacterGalleryBack();
      }
    });
  }

  // ── 画廊图片故事页（由此入画）───────────────────────────────────
  function initGalleryItemStoryPage() {
    var bodyEl = document.getElementById('gallery-item-story-body');
    if (bodyEl) {
      bodyEl.addEventListener('blur', saveGalleryItemStory);
    }
  }

  function initGalleryItemStoryBack() {
    var btn = document.getElementById('btn-back-gallery-item-story');
    if (!btn) return;
    btn.addEventListener('click', function () {
      saveGalleryItemStory();
      if (window.OCStorage) window.OCStorage.save();
      openCharacterGallery();
      if (window.OCEdit && window.OCEdit.onGalleryItemStoryBack) {
        window.OCEdit.onGalleryItemStoryBack();
      }
    });
  }

  // ── 故事页（章节列表）─────────────────────────────────────────
  function initStoryPage() {
    var addBtn = document.getElementById('add-chapter-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { addChapter(); });
    }
  }

  function initStoryBack() {
    var btn = document.getElementById('btn-back-story');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.OCStorage) window.OCStorage.save();
      openCharacterEditor(currentEditingCharIndex);
      if (window.OCEdit && window.OCEdit.onCharacterStoryBack) {
        window.OCEdit.onCharacterStoryBack();
      }
    });
  }

  // ── 章节编辑页 ────────────────────────────────────────────────
  function initChapterEditPage() {
    var titleEl = document.getElementById('chapter-edit-title');
    if (titleEl) {
      titleEl.addEventListener('blur', saveChapterEdit);
    }
    var bodyEl = document.getElementById('chapter-edit-body');
    if (bodyEl) {
      bodyEl.addEventListener('blur', saveChapterEdit);
    }
  }

  function initChapterEditBack() {
    var btn = document.getElementById('btn-back-chapter');
    if (!btn) return;
    btn.addEventListener('click', function () {
      saveChapterEdit();
      if (window.OCStorage) window.OCStorage.save();
      // 重新渲染章节列表，因为标题可能改了
      var char = getCurrentCharacter();
      if (char) renderChapterList(char.story);
      openCharacterStory();
      if (window.OCEdit && window.OCEdit.onChapterEditBack) {
        window.OCEdit.onChapterEditBack();
      }
    });
  }

  // ── 档案页 ────────────────────────────────────────────────────
  function initProfilePage() {
    var ids = [
      'profile-gender', 'profile-age', 'profile-race', 'profile-height',
      'profile-occupation', 'profile-personality', 'profile-background', 'profile-notes'
    ];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('blur', saveCharacterProfile);
    });

    var addAbilityBtn = document.getElementById('add-ability-btn');
    if (addAbilityBtn) {
      addAbilityBtn.addEventListener('click', function () { addAbility(); });
    }
  }

  function initProfileBack() {
    var btn = document.getElementById('btn-back-profile');
    if (!btn) return;
    btn.addEventListener('click', function () {
      saveCharacterProfile();
      if (window.OCStorage) window.OCStorage.save();
      openCharacterEditor(currentEditingCharIndex);
      if (window.OCEdit && window.OCEdit.onCharacterProfileBack) {
        window.OCEdit.onCharacterProfileBack();
      }
    });
  }

  // ── 新建角色按钮 ──────────────────────────────────────────────
  function initAddCharacter() {
    var btn = document.getElementById('add-character-btn');
    if (!btn) return;
    btn.addEventListener('click', function () { addCharacter(); });
  }

  // ── 删除角色按钮（切换删除模式）────────────────────────────────
  function initDeleteCharacter() {
    var btn = document.getElementById('delete-character-btn');
    var showcase = document.getElementById('character-showcase');
    if (!btn || !showcase) return;

    function updateNameEditable() {
      var names = showcase.querySelectorAll('.character-name');
      names.forEach(function (el) {
        el.setAttribute('contenteditable', String(!deleteMode));
      });
    }

    btn.addEventListener('click', function () {
      deleteMode = !deleteMode;
      if (deleteMode) {
        btn.classList.add('active');
        btn.textContent = '退出删除';
        showcase.classList.add('delete-mode');
        updateNameEditable();
        showToast('点击任意角色卡片即可删除');
      } else {
        btn.classList.remove('active');
        btn.textContent = '删除角色';
        showcase.classList.remove('delete-mode');
        updateNameEditable();
      }
    });
  }

  // ── 联机互动卡片点击 ──────────────────────────────────────────
  function initInteractionCards() {
    var cards = document.querySelectorAll('.interaction-card[data-interaction]');
    cards.forEach(function (card) {
      var key = card.getAttribute('data-interaction');
      if (!key) return;

      card.addEventListener('click', function (e) {
        if (e.target.classList.contains('interaction-preview')) return;
        openInteractionDetail(key);
      });
    });
  }

  // ── 联机互动详情返回 ──────────────────────────────────────────
  function initInteractionDetailBack() {
    var btn = document.getElementById('btn-back-interaction');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (window.OCStorage) window.OCStorage.save();
      if (window.OCEdit && window.OCEdit.onInteractionDetailBack) {
        window.OCEdit.onInteractionDetailBack();
      }
    });
  }

  // ── 绿泡泡返回 ──────────────────────────────────────────────────
  function initLppBack() {
    var btn = document.getElementById('btn-back-lpp');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (lppData) saveLppData();
      if (window.OCEdit && window.OCEdit.onLppBack) {
        window.OCEdit.onLppBack();
      }
    });
  }

  // ── 联机互动页返回 ────────────────────────────────────────────
  function initInteractionBack() {
    var btn = document.getElementById('btn-back-timeline-overview');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (window.OCStorage) window.OCStorage.save();
      if (window.OCEdit && window.OCEdit.onInteractionBack) {
        window.OCEdit.onInteractionBack();
      }
    });
  }

  // ── 世界小说 · 页面事件绑定 ────────────────────────────────────

  // 小说列表页：返回 + 新建
  function initNovelListPage() {
    var backBtn = document.getElementById('btn-back-novel-list');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (window.OCStorage) window.OCStorage.save();
        if (window.OCEdit && window.OCEdit.onNovelListBack) {
          window.OCEdit.onNovelListBack();
        }
      });
    }
    var addBtn = document.getElementById('add-novel-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { addNovel(); });
    }
  }

  // 章节列表页：返回 + 新建章节
  function initNovelChapterPage() {
    var backBtn = document.getElementById('btn-back-novel-chapter');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (window.OCStorage) window.OCStorage.save();
        if (window.OCEdit && window.OCEdit.onNovelChapterBack) {
          window.OCEdit.onNovelChapterBack();
        }
      });
    }
    var addBtn = document.getElementById('add-novel-chapter-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { addNovelChapter(); });
    }
  }

  // 章节编辑页：返回 + 自动保存
  function initNovelChapterEditPage() {
    var backBtn = document.getElementById('btn-back-novel-chapter-edit');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        saveNovelChapterEdit();
        if (window.OCStorage) window.OCStorage.save();
        // 重新渲染章节列表（标题可能改了）
        if (currentNovelIndex >= 0 && currentTimeline) {
          var novels = loadNovels(currentTimeline);
          var novel = normalizeNovelData(novels[currentNovelIndex]);
          renderNovelChapterList(novel.chapters);
          var countEl = document.getElementById('novel-chapter-count');
          if (countEl) countEl.textContent = '共 ' + novel.chapters.length + ' 章';
        }
        if (window.OCEdit && window.OCEdit.onNovelChapterEditBack) {
          window.OCEdit.onNovelChapterEditBack();
        }
      });
    }
    var titleEl = document.getElementById('novel-chapter-edit-title');
    if (titleEl) {
      titleEl.addEventListener('blur', saveNovelChapterEdit);
    }
    var bodyEl = document.getElementById('novel-chapter-edit-body');
    if (bodyEl) {
      bodyEl.addEventListener('blur', saveNovelChapterEdit);
    }
  }

  // ── 继续浏览按钮 ──────────────────────────────────────────────
  function initContinueBtn() {
    var btn = document.getElementById('btn-continue-edit');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (window.OCStorage) window.OCStorage.save();
      if (window.OCEdit && window.OCEdit.onContinue) {
        window.OCEdit.onContinue();
      }
    });
  }

  // ── 可编辑字段纯文本粘贴 ──────────────────────────────────────
  function initEditablePaste() {
    var editables = document.querySelectorAll(
      '#edit-page [contenteditable="true"], ' +
      '#section-editor-page [contenteditable="true"], ' +
      '#timeline-detail-page [contenteditable="true"], ' +
      '#character-editor-page [contenteditable="true"], ' +
      '#character-gallery-page [contenteditable="true"], ' +
      '#character-gallery-item-story-page [contenteditable="true"], ' +
      '#character-story-page [contenteditable="true"], ' +
      '#character-chapter-edit-page [contenteditable="true"], ' +
      '#character-profile-page [contenteditable="true"], ' +
      '#character-weapon-detail-page [contenteditable="true"], ' +
      '#character-skill-edit-page [contenteditable="true"], ' +
      '#character-page [contenteditable="true"], ' +
      '#interaction-detail-page [contenteditable="true"], ' +
      '#novel-list-page [contenteditable="true"], ' +
      '#novel-chapter-page [contenteditable="true"], ' +
      '#novel-chapter-edit-page [contenteditable="true"], ' +
      '#if-worlds-page [contenteditable="true"]'
    );
    editables.forEach(function (el) {
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
    });
  }

  // ── 页面卸载前保存 ────────────────────────────────────────────
  window.addEventListener('beforeunload', function () {
    if (currentTimeline) {
      var chars = collectCharactersFromGrid();
      saveCharacters(currentTimeline, chars);
    }
    saveCurrentCharacter();
    saveCharacterGallery();
    saveGalleryItemStory();
    saveChapterEdit();
    saveCharacterStory();
    saveCharacterProfile();
    saveWeaponDetail();
    saveWeaponSkillsFromDOM();
    saveSkillEdit();
    saveNovelChapterEdit();
  });


  // ═══════════════════════════════════════════════════════════════
  //  初始化
  // ═══════════════════════════════════════════════════════════════

  function init() {
    initTimelineCards();
    initFeatherButtons();
    initDetailBack();
    initSectionBack();
    initFactionsEditor();
    initMagicEditor();
    initWikiEditor();
    initCharacterBack();
    initCharacterHomeAvatar();
    initCharacterHomeFields();
    initCharacterModuleButtons();
    initGalleryPage();
    initGalleryBack();
    initGalleryItemStoryPage();
    initGalleryItemStoryBack();
    initStoryPage();
    initStoryBack();
    initChapterEditPage();
    initChapterEditBack();
    initProfilePage();
    initProfileBack();
    initWeaponsPage();
    initWeaponsBack();
    initWeaponDetailBack();
    initSkillsPage();
    initSkillsBack();
    initSkillEditPage();
    initSkillEditBack();
    initAddCharacter();
    initDeleteCharacter();
    initInteractionCards();
    initInteractionDetailBack();
    initLppBack();
    initInteractionBack();
    initContinueBtn();
    initEditablePaste();
    initNovelListPage();
    initNovelChapterPage();
    initNovelChapterEditPage();
    initIfWorldsPage();

    // ── 切换标签页时保存 ────────────────────────────────────
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        saveCurrentCharacter();
        if (currentTimeline) {
          saveCharacters(currentTimeline, collectCharactersFromGrid());
        }
      }
    });
  }


  // ═══════════════════════════════════════════════════════════════
  //  数据复刻：把源时间线的全部数据复制到目标时间线
  // ═══════════════════════════════════════════════════════════════

  function replicateTimelineData(sourceKey, targetKey) {
    var srcCfg = TIMELINES[sourceKey];
    var tgtCfg = TIMELINES[targetKey];
    if (!srcCfg || !tgtCfg) {
      console.error('时间线不存在:', sourceKey, '→', targetKey);
      return false;
    }

    // ── 1. 复制存档中的文本/结构化数据 ──────────────────────
    var archive = loadArchive() || { version: '1.0', data: {} };
    if (!archive.data) archive.data = {};

    var srcSuffix = srcCfg.fieldSuffix;
    var tgtSuffix = tgtCfg.fieldSuffix;

    // 需要复制的字段后缀列表
    var fieldSuffixes = ['Title', 'Brief', 'Factions', 'Magic', 'Wiki'];

    fieldSuffixes.forEach(function (suf) {
      var srcField = 'timeline' + srcSuffix + suf;
      var tgtField = 'timeline' + tgtSuffix + suf;
      if (archive.data[srcField] !== undefined) {
        // 深拷贝，避免引用共享
        archive.data[tgtField] = JSON.parse(JSON.stringify(archive.data[srcField]));
      }
    });

    // 写回存档
    try {
      window.ocStorage.set('chuxiyan_oc_archive', archive);
    } catch (e) {
      console.error('存档写入失败:', e);
      return false;
    }

    // ── 2. 复制角色数据 ──────────────────────────────────────
    var allChars = loadAllCharacters();
    var srcChars = allChars[sourceKey];
    if (srcChars && Array.isArray(srcChars)) {
      // 深拷贝角色数据，生成新的 id 避免冲突
      allChars[targetKey] = srcChars.map(function (char) {
        var copy = JSON.parse(JSON.stringify(char));
        // 角色没有 id，但画廊/故事内部可能有引用，深拷贝已处理
        return copy;
      });
      saveAllCharacters(allChars);
    }

    // ── 3. 复制小说数据 ──────────────────────────────────────
    var allNovels = loadAllNovels();
    var srcNovels = allNovels[sourceKey];
    if (srcNovels && Array.isArray(srcNovels)) {
      allNovels[targetKey] = srcNovels.map(function (novel) {
        var copy = normalizeNovelData(JSON.parse(JSON.stringify(novel)));
        // 生成新的 novel id 避免冲突
        copy.id = 'novel_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
        return copy;
      });
      saveAllNovels(allNovels);
    }

    console.log('复刻完成:', sourceKey, '→', targetKey);
    return true;
  }


  // ═══════════════════════════════════════════════════════════════
  //  存档桥接函数（供 OCStorage 调用）
  // ═══════════════════════════════════════════════════════════════

  // ── 刷入：把内存中的结构化数据全部写入 localStorage ──────
  // 在用户点击「存档」或「导出」时调用，确保不丢数据
  function flushAllToStorage() {
    // 结构化板块：如果内存中有数据，立即保存
    if (currentFactions) saveFactions();
    if (currentWiki) saveWiki();
    if (currentMagic) saveMagic();

    // 角色数据：从当前页面 DOM 收集并保存
    if (currentTimeline) {
      var grid = document.getElementById('detail-character-grid');
      if (grid && grid.children.length > 0) {
        var chars = collectCharactersFromGrid();
        if (chars && chars.length > 0) {
          saveCharacters(currentTimeline, chars);
        }
      }
    }

    // IF 世界已在编辑时即时保存，无需额外处理
    // 小说已在编辑时即时保存，无需额外处理
    // 绿泡泡数据已在编辑时即时保存
    if (lppData) saveLppData();
  }

  // ── 刷新：从 localStorage 重新加载到当前页面 ──────────────
  // 在用户点击「读档」或「导入」后调用
  function refreshAllFromStorage() {
    // 重置内存缓存，强制下次从 localStorage 重新加载
    currentFactions = null;
    currentWiki = null;
    currentMagic = null;

    // 检测当前激活的页面，定向刷新
    var detailPage = document.getElementById('timeline-detail-page');
    var sectionPage = document.getElementById('section-editor-page');
    var ifPage = document.getElementById('if-worlds-page');
    var novelPage = document.getElementById('novel-list-page');

    // 时间线详情页 → 刷新角色列表
    if (detailPage && detailPage.classList.contains('active') && currentTimeline) {
      var chars = loadCharacters(currentTimeline);
      renderDetailCharacters(chars);
    }

    // 板块编辑器页 → 根据当前板块刷新
    if (sectionPage && sectionPage.classList.contains('active') && currentSection) {
      if (currentSection === 'factions') {
        loadFactions();
        if (typeof renderFactionsTree === 'function') renderFactionsTree();
        if (typeof renderFactionsEditor === 'function') renderFactionsEditor();
      } else if (currentSection === 'wiki') {
        loadWiki();
        if (typeof renderWikiTree === 'function') renderWikiTree();
        if (typeof renderWikiEditor === 'function') renderWikiEditor();
      } else if (currentSection === 'magic') {
        loadMagic();
        if (typeof renderMagicTree === 'function') renderMagicTree();
        if (typeof renderMagicEditor === 'function') renderMagicEditor();
      }
    }

    // IF 世界页 → 刷新世界列表
    if (ifPage && ifPage.classList.contains('active')) {
      renderIfWorldCards();
    }

    // 小说列表页 → 刷新小说列表
    if (novelPage && novelPage.classList.contains('active') && currentTimeline) {
      renderNovelGrid();
    }

    // 绿泡泡页 → 刷新社交数据
    var lppPageEl = document.getElementById('lpp-page');
    if (lppPageEl && lppPageEl.classList.contains('active') && currentInteraction === 'lvpaopao') {
      lppData = loadLppData();
      if (!lppData.accounts) lppData.accounts = [];
      if (!lppData.weiboPosts) lppData.weiboPosts = [];
      renderLppChatList();
      renderLppContactList();
      renderLppMomentList();
      renderLppForumList();
      renderLppWeiboList();
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  暴露 API
  // ═══════════════════════════════════════════════════════════════

  window.OCEdit = {
    init: init,
    openTimelineDetail: openTimelineDetail,
    openSectionEditor: openSectionEditor,
    openInteractionDetail: openInteractionDetail,
    replicateTimelineData: replicateTimelineData,
    flushAllToStorage: flushAllToStorage,
    refreshAllFromStorage: refreshAllFromStorage,
    onDetailOpen: null,              // -> timeline-detail-page
    onDetailBack: null,              // -> edit-page
    onSectionOpen: null,             // -> section-editor-page
    onSectionBack: null,             // -> timeline-detail-page
    onCharacterOpen: null,           // -> character-editor-page
    onCharacterBack: null,           // -> timeline-detail-page
    onContinue: null,                // -> character-page
    onInteractionBack: null,         // -> edit-page
    onInteractionDetailOpen: null,   // -> interaction-detail-page
    onInteractionDetailBack: null,   // -> character-page
    onLppOpen: null,                 // -> lpp-page
    onLppBack: null,                 // -> character-page
    onGalleryItemStoryOpen: null,    // -> character-gallery-item-story-page
    onGalleryItemStoryBack: null,    // -> character-gallery-page
    onChapterEditOpen: null,         // -> character-chapter-edit-page
    onChapterEditBack: null,         // -> character-story-page
    onNovelListOpen: null,           // -> novel-list-page
    onNovelListBack: null,           // -> timeline-detail-page
    onNovelChapterOpen: null,        // -> novel-chapter-page
    onNovelChapterBack: null,        // -> novel-list-page
    onNovelChapterEditOpen: null,    // -> novel-chapter-edit-page
    onNovelChapterEditBack: null,    // -> novel-chapter-page
    onCharacterWeaponsOpen: null,    // -> character-weapons-page
    onCharacterWeaponsBack: null,    // -> character-editor-page
    onWeaponDetailOpen: null,        // -> character-weapon-detail-page
    onWeaponDetailBack: null,        // -> character-weapons-page
    onCharacterSkillsOpen: null,     // -> character-skills-page
    onCharacterSkillsBack: null,     // -> character-editor-page
    onSkillEditOpen: null,           // -> character-skill-edit-page
    onSkillEditBack: null,           // -> character-skills-page
    onIfWorldsOpen: null,            // -> if-worlds-page
    onIfWorldsBack: null             // -> edit-page
  };

})();
