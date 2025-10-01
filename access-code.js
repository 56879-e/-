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
closeVideoModalBtn.onclick = function() {
    videoModal.style.display = 'none';
    videoEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
};
videoModal.onclick = function(e) {
    if (e.target === videoModal) {
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
            const params = new URLSearchParams(url.split('?')[1]);
            videoId = params.get('v');
        } else if (url.includes('/embed/')) {
            // دعم روابط YouTube المضمنة مباشرة
            videoId = url.split('/embed/')[1]?.split(/[?&]/)[0] || '';
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&fs=1`;
        }
    }
    // Google Drive
    if (/drive\.google\.com/.test(url)) {
        let match = url.match(/\/file\/d\/([^/]+)/);
        let id = match ? match[1] : null;
        if (!id) {
            const params = new URLSearchParams(url.split('?')[1]);
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
        // حل بديل: فتح الرابط الأصلي في تبويب جديد إذا كان صالحاً
        if (url && url !== '#' && url !== 'about:blank') {
            window.open(url, '_blank');
        } else {
            alert('رابط الفيديو غير متاح حالياً.');
        }
        return;
    }
    videoEmbedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    // إذا فشل التضمين بسبب سياسات X-Frame، أظهر زر فتح في تبويب جديد
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
    videoEmbedContainer.appendChild(iframe);
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
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
