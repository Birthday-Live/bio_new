/**
 * 背景轮换引擎
 */
const BG_IMAGES = [
    './assets/background.png'
];

let currentBgIndex = 0;
let autoRotateTimer = null;
const AUTO_ROTATE_INTERVAL = 8000; // 自动轮换间隔（毫秒），设为 0 禁用自动轮换

function initBgRotation() {
    const bgCanvas = document.getElementById('bg-canvas');
    const prevBtn = document.getElementById('bg-prev');
    const nextBtn = document.getElementById('bg-next');
    const dotsContainer = document.getElementById('bg-dots');

    if (!bgCanvas || BG_IMAGES.length <= 1) {
        // 只有一张图时隐藏控制器
        const controls = document.getElementById('bg-controls');
        if (controls) controls.style.display = 'none';
        document.body.classList.add('no-bg-controls');
        return;
    }

    // 创建指示点
    function renderDots() {
        dotsContainer.innerHTML = '';
        BG_IMAGES.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'bg-dot' + (i === currentBgIndex ? ' active' : '');
            dot.addEventListener('click', () => switchToBg(i));
            dotsContainer.appendChild(dot);
        });
    }

    const bgBack = document.getElementById('bg-canvas-back');

    // 切换到指定背景（双图层交叉淡入淡出）
    function switchToBg(index) {
        if (index === currentBgIndex || index < 0 || index >= BG_IMAGES.length) return;

        currentBgIndex = index;
        const nextSrc = BG_IMAGES[index];

        // 预加载新图到后层
        const preload = new Image();
        preload.src = nextSrc;

        function doCrossfade() {
            // 后层换上新图
            bgBack.src = nextSrc;
            // 同时：后层淡入 + 前层淡出（交叉过渡）
            bgBack.style.opacity = '1';
            bgCanvas.style.opacity = '0';

            // 过渡完成后交换：前层换新图恢复显示，后层隐藏
            setTimeout(() => {
                bgCanvas.src = nextSrc;
                bgCanvas.style.opacity = '1';
                bgBack.style.opacity = '0';
            }, 850);
        }

        if (preload.complete) {
            doCrossfade();
        } else {
            preload.onload = doCrossfade;
        }

        // 更新指示点
        renderDots();

        // 重置自动轮换计时器
        resetAutoRotate();
    }

    // 上一张
    function prevBg() {
        const newIndex = (currentBgIndex - 1 + BG_IMAGES.length) % BG_IMAGES.length;
        switchToBg(newIndex);
    }

    // 下一张
    function nextBg() {
        const newIndex = (currentBgIndex + 1) % BG_IMAGES.length;
        switchToBg(newIndex);
    }

    // 自动轮换
    function startAutoRotate() {
        if (AUTO_ROTATE_INTERVAL <= 0 || BG_IMAGES.length <= 1) return;
        autoRotateTimer = setInterval(() => {
            nextBg();
        }, AUTO_ROTATE_INTERVAL);
    }

    function resetAutoRotate() {
        if (autoRotateTimer) clearInterval(autoRotateTimer);
        startAutoRotate();
    }

    // 绑定事件
    prevBtn.addEventListener('click', prevBg);
    nextBtn.addEventListener('click', nextBg);

    // 键盘左右箭头切换
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevBg();
        if (e.key === 'ArrowRight') nextBg();
    });

    // 初始化
    renderDots();
    startAutoRotate();
}

/**
 * 背景随鼠标移动效果
 */
function initMouseTracker() {
    const bgCanvas = document.getElementById('bg-canvas');
    
    if (!bgCanvas) return;
    
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 计算鼠标偏离中心的距离比例 (-1 到 1)
        const moveX = (clientX - centerX) / centerX * 10;  // 最大偏移 10px
        const moveY = (clientY - centerY) / centerY * 10;  // 最大偏移 10px
        
        bgCanvas.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

/**
 * MD3 Dynamic Color Engine
 */

/**
 * 下拉菜单管理
 */
function initDropdown() {
    const dropdowns = document.querySelectorAll('.dropdown');

    if (!dropdowns.length) return;

    dropdowns.forEach((dropdown) => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });

        // 防止播放器内部点击冒泡关闭下拉菜单
        const content = dropdown.querySelector('.dropdown-content');
        if (content) {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    });

    // 点击外部关闭所有下拉
    document.addEventListener('click', (e) => {
        dropdowns.forEach((dropdown) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
}

/**
 * 链接预览卡片 — 使用内联 data-preview-* 属性填充
 *
 * 每个 .link-preview-card 通过 HTML 中的 data-preview-title / desc / host / image
 * 提供预览元数据，页面加载即显示，无需网络请求。
 */
async function initLinkPreviews() {
    const cards = document.querySelectorAll('.link-preview-card');
    if (!cards.length) return;

    const promises = Array.from(cards).map((card) => {
        return applyInlinePreview(card);
    });
    await Promise.allSettled(promises);
}

/** 使用 HTML 内联 data-preview-* 属性填充卡片（零网络请求） */
function applyInlinePreview(card) {
    const title = card.getAttribute('data-preview-title');
    const host = card.getAttribute('data-preview-host');
    const image = card.getAttribute('data-preview-image');

    const titleEl = card.querySelector('.preview-title');
    const descEl = card.querySelector('.preview-desc');
    const urlEl = card.querySelector('.preview-url-top');

    if (titleEl && title) titleEl.textContent = title;
    if (urlEl && host) urlEl.textContent = host;

    // 用 hasAttribute 而非 truthiness，支持 og:description 为空字符串的情况
    if (descEl && card.hasAttribute('data-preview-desc')) {
        descEl.textContent = card.getAttribute('data-preview-desc');
    }

    if (image) return tryLoadThumbnail(card, image);
    return Promise.resolve();
}

/**
 * 尝试加载远程图片作为缩略图。
 * 成功 → 给 .preview-thumb 加 .has-image 类，显示 <img>，隐藏图标
 * 失败 → 保持 Material Symbol 图标
 */
function tryLoadThumbnail(card, imageUrl) {
    return new Promise((resolve) => {
        const thumb = card.querySelector('.preview-thumb');
        const img = card.querySelector('.preview-favicon');
        if (!thumb || !img) return resolve();

        const testImg = new Image();
        testImg.onload = () => {
            img.src = imageUrl;
            thumb.classList.add('has-image');
            resolve();
        };
        testImg.onerror = () => {
            resolve();
        };
        testImg.src = imageUrl;
    });
}

// 在DOM加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initDropdown();
        initBackgroundEngine();
        initBgRotation();
        initMouseTracker();
        initLinkPreviews();
    });
} else {
    initDropdown();
    initBackgroundEngine();
    initBgRotation();
    initMouseTracker();
    initLinkPreviews();
}

/**
 * 背景色彩引擎
 */
function initBackgroundEngine() {
    const img = document.getElementById('bg-canvas');
    
    if (!img) {
        console.error("Background image element not found!");
        return;
    }
    
    console.log("Background image element found, src:", img.src);

    // 图片加载失败处理
    img.onerror = function() {
        console.warn("Background image not found. Using default blue palette.");
        this.style.opacity = '0';
    };

    // 图片加载成功后的动态色彩提取
    img.onload = function() {
        console.log("Background image loaded successfully");
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 从图片中心采样 100x100 的区域以获取更准确的色调
            const sampleSize = 100;
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            
            // 计算中心位置
            const centerX = (img.width - sampleSize) / 2;
            const centerY = (img.height - sampleSize) / 2;
            
            // 从中心裁剪并绘制
            ctx.drawImage(img, centerX, centerY, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
            
            // 获取采样区域的所有像素数据
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;
            const pixelCount = data.length / 4;

            // --- 改进取色：筛选高饱和度像素取加权平均 ---
            let totalWeight = 0;
            let wr = 0, wg = 0, wb = 0;

            for (let i = 0; i < data.length; i += 4) {
                const ri = data[i], gi = data[i + 1], bi = data[i + 2];
                // 计算该像素的饱和度（用 max-min 近似）
                const maxC = Math.max(ri, gi, bi);
                const minC = Math.min(ri, gi, bi);
                const chroma = maxC - minC;

                // 饱和度越高权重越大（平方放大差异），纯灰像素权重极低
                const weight = chroma * chroma + 1;

                wr += ri * weight;
                wg += gi * weight;
                wb += bi * weight;
                totalWeight += weight;
            }

            let r = Math.round(wr / totalWeight);
            let g = Math.round(wg / totalWeight);
            let b = Math.round(wb / totalWeight);

            // 二次提纯：忽略过暗/过亮的像素带来的偏移
            const [, rawS] = rgbToHsl(r, g, b);
            if (rawS < 10) {
                // 如果加权后仍然偏灰，取原始平均作为兜底
                let ar = 0, ag = 0, ab = 0;
                for (let i = 0; i < data.length; i += 4) {
                    ar += data[i]; ag += data[i + 1]; ab += data[i + 2];
                }
                r = Math.round(ar / pixelCount);
                g = Math.round(ag / pixelCount);
                b = Math.round(ab / pixelCount);
            }

            console.log(`Extracted accent color - R: ${r}, G: ${g}, B: ${b}`);
            window.lastExtractedColor = {r, g, b};
            updateColors(r, g, b);
        } catch (e) {
            // 处理跨域图片限制
            console.error("Canvas error: Possibly CORS related.", e);
        }
    };

    // 如果图片已经缓存加载了
    if (img.complete) {
        console.log("Image already cached, triggering onload manually");
        img.onload?.call(img);
    }
}

/**
 * 根据提取的 RGB 更新全局 CSS 变量（高饱和鲜艳版）
 */
function updateColors(r, g, b) {
    const [h, rawS, rawL] = rgbToHsl(r, g, b);

    // 大幅提升饱和度：低饱和图片也能产出鲜艳配色
    let s = rawS < 10 ? 55 : Math.min(rawS * 1.6, 100);
    s = Math.max(s, 45); // 最低 45%，确保不会太灰

    const root = document.documentElement;

    // 主色：明亮鲜艳
    const primary       = `hsl(${h}, ${s}%, 72%)`;
    const onPrimary     = `hsl(${h}, ${s}%, 12%)`;
    const primaryContainer = `hsl(${h}, ${s}%, 32%)`;
    const onPrimaryContainer = `hsl(${h}, ${Math.min(s + 5, 100)}%, 95%)`;

    // 背景层：带一点主色色相 + 适度饱和度，比纯灰更生动
    const surface       = `hsl(${h}, ${Math.min(s * 0.25, 25)}%, 10%)`;
    const onSurface     = `hsl(${h}, ${Math.min(s * 0.2, 20)}%, 90%)`;
    const surfaceVariant = `hsl(${h}, ${Math.min(s * 0.35, 35)}%, 22%)`;
    const onSurfaceVariant = `hsl(${h}, ${Math.min(s * 0.25, 25)}%, 82%)`;
    const outline       = `hsl(${h}, ${Math.min(s * 0.3, 30)}%, 58%)`;

    root.style.setProperty('--md-sys-color-primary', primary);
    root.style.setProperty('--md-sys-color-on-primary', onPrimary);
    root.style.setProperty('--md-sys-color-primary-container', primaryContainer);
    root.style.setProperty('--md-sys-color-on-primary-container', onPrimaryContainer);
    root.style.setProperty('--md-sys-color-surface', surface);
    root.style.setProperty('--md-sys-color-on-surface', onSurface);
    root.style.setProperty('--md-sys-color-surface-variant', surfaceVariant);
    root.style.setProperty('--md-sys-color-on-surface-variant', onSurfaceVariant);
    root.style.setProperty('--md-sys-color-outline', outline);

    console.log(`Applied vibrant colors - H: ${h}°, S: ${s.toFixed(0)}%`);

    // 同步 APlayer 主题色
    if (typeof window.syncAPlayerTheme === 'function') {
        setTimeout(window.syncAPlayerTheme, 100);
    }
}

/**
 * 辅助函数：RGB 转 HSL
 */
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * APlayer 主题同步引擎
 * 当页面动态色彩变化时，同步更新 APlayer 的主题色
 */
(function initAPlayerSync() {
    let aplayerSynced = false;

    /**
     * 从 CSS 变量读取当前主色并应用到 APlayer
     */
    function applyThemeToAPlayer() {
        const metingEl = document.querySelector('meting-js');
        if (!metingEl || !metingEl.aplayer) return;

        const aplayer = metingEl.aplayer;
        const style = getComputedStyle(document.documentElement);
        const primary = style.getPropertyValue('--md-sys-color-primary').trim();

        if (primary) {
            // 直接操作 DOM 更新已播放进度条颜色（不覆盖 aplayer.theme，避免破坏内部方法）
            const playedBar = metingEl.querySelector('.aplayer-played');
            const thumb = metingEl.querySelector('.aplayer-thumb');
            if (playedBar) playedBar.style.background = primary;
            if (thumb) {
                thumb.style.background = primary;
                thumb.style.borderColor = primary;
            }
        }
    }

    /**
     * 使用 MutationObserver 监听 APlayer 的创建
     */
    function watchAPlayerCreation() {
        const musicDropdown = document.querySelector('.music-dropdown');
        if (!musicDropdown) return;

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // MetingJS 注入的 aplayer 容器
                            const aplayerEl = (node.matches && node.matches('div.aplayer'))
                                ? node
                                : node.querySelector && node.querySelector('div.aplayer');

                            if (aplayerEl && !aplayerSynced) {
                                // 延迟确保 APlayer 完全初始化
                                setTimeout(() => {
                                    applyThemeToAPlayer();
                                    aplayerSynced = true;
                                    observer.disconnect();
                                }, 500);
                                return;
                            }
                        }
                    }
                }
            }
        });

        observer.observe(musicDropdown, { childList: true, subtree: true });

        // 兜底：如果 APlayer 已经创建好了（缓存情况）
        setTimeout(() => {
            if (!aplayerSynced) {
                const metingEl = document.querySelector('meting-js');
                if (metingEl && metingEl.aplayer) {
                    applyThemeToAPlayer();
                    aplayerSynced = true;
                    observer.disconnect();
                }
            }
        }, 2000);
    }

    // 将 applyThemeToAPlayer 挂到 window 上，供 updateColors 调用
    window.syncAPlayerTheme = function () {
        applyThemeToAPlayer();
    };

    // 启动监听
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', watchAPlayerCreation);
    } else {
        watchAPlayerCreation();
    }
})();