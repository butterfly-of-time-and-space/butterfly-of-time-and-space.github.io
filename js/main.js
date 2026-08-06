/* ═══════════════════════════════════════════════════════════════
   主逻辑 · 路由 & 初始化
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Toast 提示工具 ────────────────────────────────────────
  var toastTimer = null;
  function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast';

    if (type) {
      toast.classList.add('toast-' + type);
    }

    // 触发重排后添加 show 类
    void toast.offsetWidth;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }
  window.showToast = showToast;


  // ── 页面切换 ──────────────────────────────────────────────
  function switchTo(screenId) {
    var screens = document.querySelectorAll('.screen');
    screens.forEach(function (s) {
      s.classList.remove('active', 'fade-in');
    });

    var target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      // 触发重排后添加动画类
      void target.offsetWidth;
      target.classList.add('fade-in');
    }
  }


  // ── 绑定存档按钮 ──────────────────────────────────────────
  function bindArchiveButtons() {
    var btnSave = document.getElementById('btn-save-archive');
    var btnLoad = document.getElementById('btn-load-archive');
    var btnExport = document.getElementById('btn-export');
    var btnImport = document.getElementById('btn-import');
    var btnDelete = document.getElementById('btn-delete-archive');
    var btnPublish = document.getElementById('btn-publish-display');
    var importInput = document.getElementById('import-file-input');

    if (btnSave) {
      btnSave.addEventListener('click', function () {
        if (window.OCStorage) window.OCStorage.save();
      });
    }

    if (btnLoad) {
      btnLoad.addEventListener('click', function () {
        if (window.OCStorage) window.OCStorage.load();
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', function () {
        if (window.OCStorage) window.OCStorage.export();
      });
    }

    if (btnImport && importInput) {
      btnImport.addEventListener('click', function () {
        importInput.click();
      });
      importInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (file && window.OCStorage) {
          window.OCStorage.import(file);
        }
        importInput.value = '';
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', function () {
        var confirmed = confirm('确定要删除全部存档数据吗？\n\n此操作将清除所有角色、小说、画廊、IF世界和社交数据，且不可恢复。\n\n如需保留，请先点击「导出」备份。');
        if (confirmed) {
          if (window.OCStorage && window.OCStorage.delete) {
            window.OCStorage.delete();
          }
        }
      });
    }

    if (btnPublish) {
      btnPublish.addEventListener('click', function () {
        console.log('[Main] 发布分享按钮被点击');
        if (!window.OCShare || typeof window.OCShare.generate !== 'function') {
          console.error('[Main] 分享功能不可用');
          if (window.showToast) {
            window.showToast('分享功能加载失败，请刷新页面后重试（Ctrl+F5）', 'error');
          } else {
            alert('分享功能加载失败，请刷新页面后重试（Ctrl+F5）');
          }
          return;
        }

        // 直接走轻量分享（不弹窗选择）
        // 轻量版文字完整，图片显示为占位图，不会崩溃
        window.OCShare.generate();
      });
    }
  }


  // ── 安全包装：捕获单个模块的初始化错误，不连累其他模块 ─────
  function safe(label, fn) {
    try {
      fn();
    } catch (e) {
      console.error('[Main] ' + label + ' 初始化失败:', e);
      if (window.showToast) window.showToast(label + ' 加载失败：' + (e.message || '未知错误'), 'error');
    }
  }

  async function safeAsync(label, fn) {
    try {
      await fn();
    } catch (e) {
      console.error('[Main] ' + label + ' 初始化失败:', e);
      if (window.showToast) window.showToast(label + ' 加载失败：' + (e.message || '未知错误'), 'error');
    }
  }


  // ── 初始化 ────────────────────────────────────────────────
  function init() {
    // 1. 开屏动画（若已禁用则直接进入主页面）
    safe('开屏动画', function () {
      if (window.OCIntro) {
        window.OCIntro.onComplete = function () {
          switchTo('world-page');
          if (window.OCStorage) {
            window.OCStorage.autoRestore();
            window.OCStorage.autoSave();
          }
        };
      } else {
        // 开屏动画被禁用 → 直接进入主页面
        console.log('[Main] 开屏动画已禁用，直接进入主页面');
        switchTo('world-page');
        if (window.OCStorage) {
          window.OCStorage.autoRestore();
          window.OCStorage.autoSave();
        }
      }
    });

    // 2. 设置世界观页面回调
    safe('世界观页面', function () {
      // 绑定返回开屏按钮
      var btnBackIntro = document.getElementById('btn-back-intro');
      if (btnBackIntro) {
        btnBackIntro.addEventListener('click', function () {
          if (window.OCStorage) window.OCStorage.save();
          switchTo('intro-screen');
        });
      }
      if (window.OCWorld) {
        window.OCWorld.onContinue = function () {
          switchTo('edit-page');
        };
        window.OCWorld.onBack = function () {
          switchTo('world-page');
        };
        // 初始化世界观页面交互
        window.OCWorld.init();
      }
    });

    // 3. 设置时间线编辑页回调
    safe('编辑页面', function () {
      if (window.OCEdit) {
        window.OCEdit.onDetailOpen = function () {
          switchTo('timeline-detail-page');
        };
        window.OCEdit.onDetailBack = function () {
          switchTo('edit-page');
        };
        window.OCEdit.onSectionOpen = function () {
          switchTo('section-editor-page');
        };
        window.OCEdit.onSectionBack = function () {
          switchTo('timeline-detail-page');
        };
        window.OCEdit.onCharacterOpen = function () {
          switchTo('character-editor-page');
        };
        window.OCEdit.onCharacterBack = function () {
          switchTo('timeline-detail-page');
        };
        window.OCEdit.onCharacterGalleryOpen = function () {
          switchTo('character-gallery-page');
        };
        window.OCEdit.onCharacterGalleryBack = function () {
          switchTo('character-editor-page');
        };
        window.OCEdit.onGalleryItemStoryOpen = function () {
          switchTo('character-gallery-item-story-page');
        };
        window.OCEdit.onGalleryItemStoryBack = function () {
          switchTo('character-gallery-page');
        };
        window.OCEdit.onCharacterStoryOpen = function () {
          switchTo('character-story-page');
        };
        window.OCEdit.onChapterEditOpen = function () {
          switchTo('character-chapter-edit-page');
        };
        window.OCEdit.onChapterEditBack = function () {
          switchTo('character-story-page');
        };
        // 世界小说页面切换
        window.OCEdit.onNovelListOpen = function () {
          switchTo('novel-list-page');
        };
        window.OCEdit.onNovelListBack = function () {
          switchTo('timeline-detail-page');
        };
        window.OCEdit.onNovelChapterOpen = function () {
          switchTo('novel-chapter-page');
        };
        window.OCEdit.onNovelChapterBack = function () {
          switchTo('novel-list-page');
        };
        window.OCEdit.onNovelChapterEditOpen = function () {
          switchTo('novel-chapter-edit-page');
        };
        window.OCEdit.onNovelChapterEditBack = function () {
          switchTo('novel-chapter-page');
        };
        window.OCEdit.onCharacterStoryBack = function () {
          switchTo('character-editor-page');
        };
        window.OCEdit.onCharacterProfileOpen = function () {
          switchTo('character-profile-page');
        };
        window.OCEdit.onCharacterProfileBack = function () {
          switchTo('character-editor-page');
        };
        window.OCEdit.onCharacterWeaponsOpen = function () {
          switchTo('character-weapons-page');
        };
        window.OCEdit.onCharacterWeaponsBack = function () {
          switchTo('character-editor-page');
        };
        window.OCEdit.onWeaponDetailOpen = function () {
          switchTo('character-weapon-detail-page');
        };
        window.OCEdit.onWeaponDetailBack = function () {
          switchTo('character-weapons-page');
        };
        window.OCEdit.onWeaponSkillEditOpen = function () {
          switchTo('weapon-skill-edit-page');
        };
        window.OCEdit.onWeaponSkillEditBack = function () {
          switchTo('character-weapon-detail-page');
        };
        window.OCEdit.onCharacterSkillsOpen = function () {
          switchTo('character-skills-page');
        };
        window.OCEdit.onCharacterSkillsBack = function () {
          switchTo('character-editor-page');
        };
        window.OCEdit.onSkillEditOpen = function () {
          switchTo('character-skill-edit-page');
        };
        window.OCEdit.onSkillEditBack = function () {
          switchTo('character-skills-page');
        };
        window.OCEdit.onContinue = function () {
          switchTo('character-page');
        };
        window.OCEdit.onInteractionBack = function () {
          switchTo('edit-page');
        };
        window.OCEdit.onInteractionDetailOpen = function () {
          switchTo('interaction-detail-page');
        };
        window.OCEdit.onInteractionDetailBack = function () {
          switchTo('character-page');
        };
        // OC绿泡泡页面切换
        window.OCEdit.onLppOpen = function () {
          switchTo('lpp-page');
        };
        window.OCEdit.onLppBack = function () {
          switchTo('character-page');
        };
        // IF线奇遇环游世界选择器页面切换
        window.OCEdit.onIfWorldsOpen = function () {
          switchTo('if-worlds-page');
        };
        window.OCEdit.onIfWorldsBack = function () {
          switchTo('edit-page');
        };
        // 初始化编辑页交互
        window.OCEdit.init();
      }
    });

    // 4. 绑定存档按钮
    safe('存档按钮', bindArchiveButtons);

    // 4.5 初始化 Supabase + 绑定云端分享按钮（独立模块，失败不影响主功能）
    safeAsync('云端分享 - Supabase 客户端', async function () {
      if (window.initSupabase) {
        await window.initSupabase();
      }
    });
    safe('云端分享按钮', function () {
      var btnCloudShare = document.getElementById('btn-cloud-share');
      if (btnCloudShare && window.OCCloudShareUI) {
        btnCloudShare.addEventListener('click', function () {
          window.OCCloudShareUI.showForm();
        });
      }
    });

    // 4.6 绑定"我的存档"按钮
    safe('我的存档按钮', function () {
      var btnMyShares = document.getElementById('btn-my-shares');
      if (btnMyShares) {
        btnMyShares.addEventListener('click', function () {
          switchTo('my-shares-page');
          if (window.OCMyShares) window.OCMyShares.render();
        });
      }
      var btnBackMyShares = document.getElementById('btn-back-my-shares');
      if (btnBackMyShares) {
        btnBackMyShares.addEventListener('click', function () {
          switchTo('edit-page');
        });
      }
    });

    // 4.7 绑定跳过按钮
    safe('跳过按钮', function () {
      var skipBtn = document.getElementById('skip-intro');
      if (skipBtn && window.OCIntro) {
        skipBtn.addEventListener('click', function () {
          window.OCIntro.skip();
        });
      }
    });

    // 5. 启动开屏动画
    safe('启动开屏动画', function () {
      if (window.OCIntro) {
        window.OCIntro.start();
      }
    });

    // 6. 页面卸载前保存
    safe('页面卸载监听', function () {
      window.addEventListener('beforeunload', function () {
        if (window.OCStorage) {
          window.OCStorage.save();
        }
      });
    });
  }


  // ── DOM 就绪后初始化 ─────────────────────────────────────
  function startInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', doInit);
    } else {
      doInit();
    }
  }

  function doInit() {
    // 先初始化 IndexedDB 图片存储，再启动应用
    if (window.OCImageStore) {
      window.OCImageStore.init(init);
    } else {
      init();
    }
  }

  startInit();

})();
