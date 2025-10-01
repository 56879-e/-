// Access code popup and verification for all files and videos
// Each content (file/video) has a unique code
// Codes are stored in the backend

const MAX_ATTEMPTS = 5;
let currentContentId = null;
let currentContentUrl = null;
let attempts = 0;

// تحديد أساس الـ API ديناميكياً مع دعم النشر الثابت
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:7878/api' : '/api';

async function fetchCodesWithFallback() {
    // المحاولة عبر API ثم السقوط إلى الملف الثابت
    try {
        const res = await fetch(`${API_BASE}/codes`, { cache: 'no-store' });
        if (!res.ok) throw new Error('API unavailable');
        return await res.json();
    } catch (_) {
        const res2 = await fetch('codes.json', { cache: 'no-store' });
        if (!res2.ok) throw new Error('codes.json not found');
        return await res2.json();
    }
}

// Create popup HTML
const popup = document.createElement('div');
popup.className = 'access-code-popup';
popup.innerHTML = `
  <div class="popup-content">
    <span class="close-popup" style="float:right;cursor:pointer;font-size:24px">&times;</span>
    <h2>أدخل كود الوصول</h2>
    <input type="text" class="code-input" maxlength="6" placeholder="أدخل الكود هنا">
    <button class="verify-button">تحقق</button>
    <div class="error-message" style="color:red;display:none"></div>
    <div class="attempts-left" style="margin-top:5px"></div>
  </div>
`;
document.body.appendChild(popup);
popup.style.display = 'none';

const codeInput = popup.querySelector('.code-input');
const verifyButton = popup.querySelector('.verify-button');
const errorMessage = popup.querySelector('.error-message');
const attemptsLeft = popup.querySelector('.attempts-left');
const closeButton = popup.querySelector('.close-popup');

function showPopup(contentId, url) {
    currentContentId = contentId;
    // تطبيع المسار واستبدال الشرطة العكسية إلى مائلة للأمام
    currentContentUrl = (url || '').replace(/\\/g, '/');
    attempts = 0;
    codeInput.value = '';
    errorMessage.style.display = 'none';
    attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS}`;
    popup.style.display = 'flex';
    codeInput.disabled = false;
    verifyButton.disabled = false;
    codeInput.focus();
}
function hidePopup() {
    popup.style.display = 'none';
}
closeButton.onclick = hidePopup;
popup.onclick = function(e) { if (e.target === popup) hidePopup(); };

// Video modal
const videoModal = document.createElement('div');
videoModal.className = 'video-modal';
videoModal.style.display = 'none';
videoModal.style.position = 'fixed';
videoModal.style.top = '0';
videoModal.style.left = '0';
videoModal.style.width = '100vw';
videoModal.style.height = '100vh';
videoModal.style.background = 'rgba(0,0,0,0.8)';
videoModal.style.justifyContent = 'center';
videoModal.style.alignItems = 'center';
videoModal.style.zIndex = '9999';
videoModal.innerHTML = `
  <div class="video-modal-content" style="position:relative;max-width:90vw;max-height:90vh;">
    <span class="close-video-modal" style="position:absolute;top:10px;left:10px;font-size:32px;color:#fff;cursor:pointer;z-index:2;">&times;</span>
    <div class="video-embed-container" style="width:80vw;height:45vw;max-width:900px;max-height:506px;background:#000;display:flex;align-items:center;justify-content:center;"></div>
  </div>
`;
document.body.appendChild(videoModal);
const closeVideoModalBtn = videoModal.querySelector('.close-video-modal');
const videoEmbedContainer = videoModal.querySelector('.video-embed-container');
// Close handler will call cleanup if present
closeVideoModalBtn.onclick = function() {
    if (window._gelvano_cleanupVideo) {
        try { window._gelvano_cleanupVideo(); } catch (e) { console.error(e); }
        window._gelvano_cleanupVideo = null;
    }
    videoModal.style.display = 'none';
    videoEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
};
videoModal.onclick = function(e) {
    if (e.target === videoModal) {
        if (window._gelvano_cleanupVideo) {
            try { window._gelvano_cleanupVideo(); } catch (err) { console.error(err); }
            window._gelvano_cleanupVideo = null;
        }
        videoModal.style.display = 'none';
        videoEmbedContainer.innerHTML = '';
        document.body.style.overflow = '';
    }
};

// PDF modal
const pdfModal = document.createElement('div');
pdfModal.className = 'pdf-modal';
pdfModal.style.display = 'none';
pdfModal.style.position = 'fixed';
pdfModal.style.top = '0';
pdfModal.style.left = '0';
pdfModal.style.width = '100vw';
pdfModal.style.height = '100vh';
pdfModal.style.background = 'rgba(0,0,0,0.8)';
pdfModal.style.justifyContent = 'center';
pdfModal.style.alignItems = 'center';
pdfModal.style.zIndex = '9999';
pdfModal.innerHTML = `
  <div class="pdf-modal-content" style="position:relative;max-width:90vw;max-height:90vh;background:#fff;border-radius:12px;padding:1rem;">
    <span class="close-pdf-modal" style="position:absolute;top:10px;left:10px;font-size:32px;color:#333;cursor:pointer;z-index:2;">&times;</span>
    <div class="pdf-embed-container" style="width:80vw;height:80vh;max-width:900px;max-height:90vh;display:flex;align-items:center;justify-content:center;"></div>
    <a class="pdf-download-link" href="#" download style="display:inline-block;margin-top:1rem;background:#e53935;color:#fff;padding:0.5rem 1.5rem;border-radius:8px;text-decoration:none;">تحميل الملف</a>
  </div>
`;
document.body.appendChild(pdfModal);
const closePdfModalBtn = pdfModal.querySelector('.close-pdf-modal');
const pdfEmbedContainer = pdfModal.querySelector('.pdf-embed-container');
const pdfDownloadLink = pdfModal.querySelector('.pdf-download-link');
closePdfModalBtn.onclick = function() {
    pdfModal.style.display = 'none';
    pdfEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
};
pdfModal.onclick = function(e) {
    if (e.target === pdfModal) {
        pdfModal.style.display = 'none';
        pdfEmbedContainer.innerHTML = '';
        document.body.style.overflow = '';
    }
};

function getEmbedUrl(url) {
    // YouTube
    if (/youtu\.be|youtube\.com/.test(url)) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
        } else if (url.includes('youtube.com/watch')) {
            const params = new URLSearchParams(url.split('?')[1] || '');
            videoId = params.get('v');
        } else if (url.includes('/embed/')) {
            // دعم روابط YouTube المضمنة مباشرة
            videoId = url.split('/embed/')[1]?.split(/[?&]/)[0] || '';
        }
        if (videoId) {
            // Disable YouTube native controls (controls=0) and enable JS API so we can control playback
            // Also disable iframe fullscreen button (fs=0) and set origin for safer postMessage communication
            const origin = encodeURIComponent(location.origin);
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=0&enablejsapi=1&fs=0&origin=${origin}`;
        }
    }
    // Google Drive
    if (/drive\.google\.com/.test(url)) {
        let match = url.match(/\/file\/d\/([^/]+)/);
        let id = match ? match[1] : null;
        if (!id) {
            const params = new URLSearchParams(url.split('?')[1] || '');
            id = params.get('id');
        }
        if (id) {
            return `https://drive.google.com/file/d/${id}/preview`;
        }
    }
    return null;
}

function showVideoModal(url) {
    const embedUrl = getEmbedUrl(url);
    if (!embedUrl) {
        // fallback: open original link in new tab if possible
        if (url && url !== '#' && url !== 'about:blank') {
            window.open(url, '_blank');
        } else {
            alert('رابط الفيديو غير متاح حالياً.');
        }
        return;
    }

    // clear container
    videoEmbedContainer.innerHTML = '';

    // create wrapper for iframe so we can resize while keeping controls below
    const iframeWrapper = document.createElement('div');
    iframeWrapper.style.width = '100%';
    iframeWrapper.style.height = '100%';
    iframeWrapper.style.position = 'relative';
    iframeWrapper.style.background = '#000';

    const iframe = document.createElement('iframe');
    iframe.id = 'gelvano-youtube-player';
    iframe.src = embedUrl;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.allowFullscreen = false; // disable iframe fullscreen button; we'll use browser fullscreen API
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    // Make iframe non-interactive so no native YouTube controls (icons/buttons) respond
    iframe.tabIndex = -1; // prevent focus
    iframe.style.pointerEvents = 'none'; // ensure clicks don't reach iframe
    iframeWrapper.appendChild(iframe);

    // Add a transparent overlay above the iframe to block any native YouTube UI interactions.
    const iframeOverlay = document.createElement('div');
    iframeOverlay.style.position = 'absolute';
    iframeOverlay.style.top = '0';
    iframeOverlay.style.left = '0';
    iframeOverlay.style.width = '100%';
    iframeOverlay.style.height = '100%';
    iframeOverlay.style.background = 'transparent';
    iframeOverlay.style.zIndex = '2';
    // prevent pointer events reaching iframe; overlay captures them
    iframeOverlay.style.pointerEvents = 'auto';
    // Capture and neutralize all input over the iframe
    iframeOverlay.style.touchAction = 'none';
    iframeOverlay.style.cursor = 'default';
    iframeOverlay.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    iframeOverlay.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); });
    iframeOverlay.addEventListener('mousedown', function(e) { e.preventDefault(); e.stopPropagation(); });
    iframeOverlay.addEventListener('mouseup', function(e) { e.preventDefault(); e.stopPropagation(); });
    iframeOverlay.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); });
    iframeOverlay.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); });
    iframeWrapper.appendChild(iframeOverlay);

    // handle iframe load error (X-Frame-Options etc.)
    iframe.addEventListener('error', function() {
        videoEmbedContainer.innerHTML = '';
        const openBtn = document.createElement('a');
        openBtn.textContent = 'فتح الفيديو في تبويب جديد';
        openBtn.href = url;
        openBtn.target = '_blank';
        openBtn.style.background = '#e53935';
        openBtn.style.color = '#fff';
        openBtn.style.padding = '0.6rem 1rem';
        openBtn.style.borderRadius = '8px';
        openBtn.style.textDecoration = 'none';
        videoEmbedContainer.appendChild(openBtn);
    });

    // Build custom controls bar under the video
    const controlsBar = document.createElement('div');
    controlsBar.className = 'custom-video-controls';
    controlsBar.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:center;padding:10px;background:rgba(0,0,0,0.6);position:relative;color:#fff;';

    const btnPlay = document.createElement('button');
    btnPlay.textContent = 'تشغيل';
    btnPlay.style.cssText = 'padding:8px 12px;border-radius:6px;border:none;background:#4CAF50;color:#fff;cursor:pointer;';

    const btnEnlarge = document.createElement('button');
    btnEnlarge.textContent = 'تكبير';
    btnEnlarge.style.cssText = 'padding:8px 12px;border-radius:6px;border:none;background:#1976D2;color:#fff;cursor:pointer;';

    const btnClose = document.createElement('button');
    btnClose.textContent = 'اغلاق';
    btnClose.style.cssText = 'padding:8px 12px;border-radius:6px;border:none;background:#E53935;color:#fff;cursor:pointer;';

    controlsBar.appendChild(btnPlay);
    controlsBar.appendChild(btnEnlarge);
    controlsBar.appendChild(btnClose);

    // Put iframe and controls into a column container
    const column = document.createElement('div');
    column.style.cssText = 'display:flex;flex-direction:column;width:100%;height:100%;';
    iframeWrapper.style.flex = '1 1 auto';
    column.appendChild(iframeWrapper);
    column.appendChild(controlsBar);

    videoEmbedContainer.appendChild(column);
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Message handler to receive state updates from YouTube iframe
    function messageHandler(event) {
        let data = event.data;
        let parsed = null;
        try {
            if (typeof data === 'string' && data.startsWith('{')) parsed = JSON.parse(data);
            else if (typeof data === 'object') parsed = data;
        } catch (e) {
            return;
        }
        if (!parsed || !parsed.event) return;
        if (parsed.event === 'onStateChange') {
            const info = parsed.info;
            if (info === 1) btnPlay.textContent = 'ايقاف';
            else btnPlay.textContent = 'تشغيل';
        }
    }

    window.addEventListener('message', messageHandler);

    // fullscreenchange handler to keep UI in sync if user exits fullscreen via ESC
    function onFullscreenChange() {
        const fsElement = document.fullscreenElement;
        const inFs = !!fsElement;
        if (!inFs) {
            // exited fullscreen: restore controls layout and sizes
            controlsBar.style.position = 'relative';
            controlsBar.style.bottom = '';
            controlsBar.style.left = '';
            controlsBar.style.width = '';
            controlsBar.style.zIndex = '';

            // Restore modal constraints
            videoModalContent.style.position = 'relative';
            videoModalContent.style.top = '';
            videoModalContent.style.left = '';
            videoModalContent.style.width = '';
            videoModalContent.style.height = '';
            videoModalContent.style.maxWidth = '90vw';
            videoModalContent.style.maxHeight = '90vh';

            // Restore embed container and iframe sizes
            videoEmbedContainer.style.width = '80vw';
            videoEmbedContainer.style.height = '45vw';
            videoEmbedContainer.style.maxWidth = '900px';
            videoEmbedContainer.style.maxHeight = '506px';

            iframeWrapper.style.width = '100%';
            iframeWrapper.style.height = '100%';
            iframeWrapper.style.position = 'relative';
            iframe.style.width = '100%';
            iframe.style.height = '100%';

            btnEnlarge.textContent = 'تكبير';
        } else {
            // entered fullscreen: make modal and embed fill the viewport
            controlsBar.style.position = 'absolute';
            controlsBar.style.bottom = '0';
            controlsBar.style.left = '0';
            controlsBar.style.width = '100%';
            controlsBar.style.zIndex = '3';

            videoModalContent.style.position = 'fixed';
            videoModalContent.style.top = '0';
            videoModalContent.style.left = '0';
            videoModalContent.style.width = '100vw';
            videoModalContent.style.height = '100vh';
            videoModalContent.style.maxWidth = 'none';
            videoModalContent.style.maxHeight = 'none';
            videoModalContent.style.margin = '0';
            videoModalContent.style.padding = '0';
            videoModalContent.style.background = '#000';

            // make the embed area fill the modal (leaving room for controls bar)
            videoEmbedContainer.style.width = '100%';
            videoEmbedContainer.style.height = '100%';
            videoEmbedContainer.style.maxWidth = 'none';
            videoEmbedContainer.style.maxHeight = 'none';
            videoEmbedContainer.style.display = 'flex';
            videoEmbedContainer.style.alignItems = 'center';
            videoEmbedContainer.style.justifyContent = 'center';

            iframeWrapper.style.width = '100%';
            // leave some space for controls bar (approx 60px)
            iframeWrapper.style.height = 'calc(100% - 60px)';
            iframeWrapper.style.position = 'relative';
            iframe.style.width = '100%';
            iframe.style.height = '100%';

            btnEnlarge.textContent = 'تصغير';
        }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Control actions: use postMessage command API to control YouTube iframe
    function postCommand(cmd, args) {
        try {
            const msg = JSON.stringify({ event: 'command', func: cmd, args: args || [] });
            iframe.contentWindow.postMessage(msg, '*');
        } catch (e) { console.error('postCommand error', e); }
    }

    btnPlay.addEventListener('click', function() {
        // toggle using button label
        if (btnPlay.textContent === 'تشغيل') {
            postCommand('playVideo');
            btnPlay.textContent = 'ايقاف';
        } else {
            postCommand('pauseVideo');
            btnPlay.textContent = 'تشغيل';
        }
    });

    // Modal-level fullscreen: toggle expanding modal content
    const videoModalContent = videoModal.querySelector('.video-modal-content');
    let isFullscreen = false;
    btnEnlarge.addEventListener('click', async function() {
        try {
            if (!document.fullscreenElement) {
                // request fullscreen on the modal content so controls stay visible
                if (videoModalContent.requestFullscreen) {
                    await videoModalContent.requestFullscreen();
                } else if (videoModalContent.webkitRequestFullScreen) {
                    videoModalContent.webkitRequestFullScreen();
                }
                // style adjustments will be applied by fullscreenchange handler
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        } catch (err) { console.error('Fullscreen error', err); }
    });

    btnClose.addEventListener('click', function() {
        postCommand('stopVideo');
        if (window._gelvano_cleanupVideo) {
            try { window._gelvano_cleanupVideo(); } catch (e) { console.error(e); }
            window._gelvano_cleanupVideo = null;
        }
        // exit fullscreen if active
        if (document.fullscreenElement) {
            try { document.exitFullscreen(); } catch (e) { /* ignore */ }
        }
        // remove fullscreenchange listener
        document.removeEventListener('fullscreenchange', onFullscreenChange);

        videoModal.style.display = 'none';
        videoEmbedContainer.innerHTML = '';
        document.body.style.overflow = '';
    });

    // Expose cleanup so close handlers can call it
    window._gelvano_cleanupVideo = function() {
        try { postCommand('stopVideo'); } catch (e) { /* ignore */ }
        window.removeEventListener('message', messageHandler);
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        // exit fullscreen if active
        if (document.fullscreenElement) {
            try { document.exitFullscreen(); } catch (e) { /* ignore */ }
        }
    };
}

function showPdfModal(url) {
    const normalizedUrl = (url || '').replace(/\\/g, '/');
    if (!normalizedUrl || normalizedUrl === '#') {
        alert('رابط الملف غير متاح حالياً.');
        return;
    }
    pdfEmbedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = normalizedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    pdfEmbedContainer.appendChild(iframe);
    pdfDownloadLink.href = normalizedUrl;
    pdfModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function handleVerify() {
    const code = codeInput.value.trim();
    attempts++;
    const originalText = verifyButton.textContent;
    verifyButton.textContent = 'جاري التحقق...';
    verifyButton.disabled = true;
    codeInput.disabled = true;
    try {
        const codes = await fetchCodesWithFallback();
        const isVideo = /^[FST]\d+$/.test(currentContentId);
        const isFile = /^F[FST]\d+$/.test(currentContentId) || /^FF\d+$/.test(currentContentId);
        let found = null;
        if (isVideo) {
            found = codes.find(c => c.videoId === currentContentId && String(c.code).trim().toUpperCase() === code.toUpperCase());
        } else if (isFile) {
            found = codes.find(c => c.fileId === currentContentId && String(c.code).trim().toUpperCase() === code.toUpperCase());
        }
        // التحقق من وجود الكود أولاً
        if (!found) {
            errorMessage.textContent = isVideo ? 'كود غير صحيح لهذا الفيديو' : 'كود غير صحيح لهذا الملف';
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
            return;
        }

        // التحقق من كلمة السر
        const savedPassword = (localStorage.getItem('gelvano_password') || '').trim();
        const passMatch = !!found.password && savedPassword && String(found.password).trim().toUpperCase() === savedPassword.toUpperCase();
        
        if (!passMatch) {
            errorMessage.textContent = isVideo ? 'هذا الفيديو غير متاح لك' : 'هذا الملف غير متاح لك';
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
            return;
        }

        // التحقق من حالة الاستخدام
        const useCountExceeded = (found.useCount || 0) >= (found.maxUses || 2);
        const alreadyUsed = found.used === true || useCountExceeded;
        
        if (alreadyUsed) {
            if (useCountExceeded) {
                errorMessage.textContent = 'تم استخدام الكود بالفعل. يرجى التواصل مع الدعم لتغيير حالة الكود لإمكانية الاستخدام مرة أخرى.';
            } else {
                errorMessage.textContent = isVideo ? 'هذا الكود مستخدم بالفعل لهذا الفيديو' : 'هذا الكود مستخدم بالفعل لهذا الملف';
            }
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
            return;
        }

        // إذا وصلنا هنا، الكود صحيح ويمكن استخدامه
        // محاولة زيادة عدد مرات الاستخدام إذا كنا على API حقيقي
        let useSuccess = false;
        try {
            if (found.id) {
                const useResponse = await fetch(`${API_BASE}/codes/${found.id}/use`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (useResponse.ok) {
                    const result = await useResponse.json();
                    if (!result.canUse) {
                        errorMessage.textContent = 'تم استخدام الكود بالفعل. يرجى التواصل مع الدعم لتغيير حالة الكود لإمكانية الاستخدام مرة أخرى.';
                        errorMessage.style.display = 'block';
                        if (attempts >= MAX_ATTEMPTS) {
                            attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
                        } else {
                            attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
                        }
                        return;
                    }
                    useSuccess = true;
                } else {
                    console.error('فشل في تحديث عدد مرات الاستخدام');
                    // في حالة فشل التحديث، نعتبر الاستخدام ناجح لتجنب منع المستخدم
                    useSuccess = true;
                }
            } else {
                // في حالة عدم وجود ID (وضع الملفات الثابتة)، نعتبر الاستخدام ناجح
                useSuccess = true;
            }
        } catch (error) { 
            console.error('خطأ في تحديث عدد مرات الاستخدام:', error);
            // في حالة الخطأ، نعتبر الاستخدام ناجح لتجنب منع المستخدم
            useSuccess = true;
        }
        
        if (useSuccess) {
            // إظهار رسالة نجاح
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #4CAF50;
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                z-index: 10000;
                font-size: 18px;
                font-weight: bold;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                text-align: center;
            `;
            successMessage.textContent = 'تم التحقق من الكود بنجاح!';
            document.body.appendChild(successMessage);
            
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 1500);
            
            // إرسال رسالة لتحديث صفحة الإدارة
            try {
                window.parent.postMessage('codeUsed', '*');
            } catch (e) {
                // تجاهل الخطأ إذا لم تكن الصفحة في iframe
            }
            
            // محاولة إرسال رسالة عبر localStorage كبديل
            try {
                localStorage.setItem('gelvano_code_used', Date.now().toString());
            } catch (e) {
                // تجاهل الخطأ
            }
            
            hidePopup();
            if (isVideo) {
                showVideoModal(currentContentUrl);
            } else if (isFile) {
                showPdfModal(currentContentUrl);
            }
        }
    } catch (e) {
        errorMessage.textContent = 'تعذر الاتصال للتحقق من الكود. حاول لاحقاً.';
        errorMessage.style.display = 'block';
    } finally {
        if (attempts < MAX_ATTEMPTS) {
            verifyButton.disabled = false;
            codeInput.disabled = false;
        }
        verifyButton.textContent = originalText;
    }
}

verifyButton.onclick = handleVerify;
codeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!verifyButton.disabled) {
            handleVerify();
        }
    }
});

// --- منع مشاركة الفيديوهات ---
function blockShareButtons() {
  // أي زر أو رابط فيه كلمة share أو مشاركة أو أيقونة مشاركة
  const shareSelectors = [
    'button', 'a', '[role="button"]', '[aria-label]', '[title]'
  ];
  shareSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      const txt = (el.innerText + ' ' + (el.title||'') + ' ' + (el.getAttribute('aria-label')||'')).toLowerCase();
      if (txt.includes('share') || txt.includes('مشاركة')) {
        el.onclick = function(e) {
          e.preventDefault();
          alert('يمنع مشاركة هذا الفيديو');
          return false;
        };
        el.style.opacity = '0.6';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'not-allowed';
      }
    });
  });
}
// نفذ عند تحميل الصفحة وأيضاً بعد أي تحديث ديناميكي
setTimeout(blockShareButtons, 500);
document.addEventListener('DOMContentLoaded', blockShareButtons);
setInterval(blockShareButtons, 2000);

document.addEventListener('DOMContentLoaded', function() {
    // Attach to all file and video links on page load
    const selectors = ['a.download-button[data-content-id]', 'a.play-button[data-content-id]', 'a.lesson-bar[data-content-id]'];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const contentId = this.getAttribute('data-content-id');
                const url = this.getAttribute('href');
                showPopup(contentId, url);
            });
        });
    });
});
