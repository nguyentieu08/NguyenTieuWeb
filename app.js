/**
 * -------------------------------------------------------------
 * NizeTik - Trình Tải Video TikTok Trực Tiếp Không Logo
 * Logic xử lý tải video trực tiếp & Chống xem trộm mã nguồn 
 * Phát triển bởi: Nguyễn Tiêu (v1.5 Separated Edition)
 * -------------------------------------------------------------
 */

// =============================================================
// I. HỆ THỐNG BẢO MẬT TUYỆT ĐỐI (MOBILE & PC)
// =============================================================

const securityModal = document.getElementById('securityModal');
const btnSecurityConfirm = document.getElementById('btnSecurityConfirm');

function triggerSecurityAlert() {
    if (securityModal) {
        securityModal.classList.remove('hidden');
    }
}

if (btnSecurityConfirm) {
    btnSecurityConfirm.addEventListener('click', () => {
        securityModal.classList.add('hidden');
    });
}

// 1. Chặn chuột phải trên máy tính
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    triggerSecurityAlert();
});

// 2. Chặn chạm đè nhiều ngón trên điện thoại di động
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 2) {
        e.preventDefault();
        triggerSecurityAlert();
    }
}, { passive: false });

// 3. Chặn phím tắt nhà phát triển (F12, Inspect, View-Source, Save)
document.addEventListener('keydown', (e) => {
    // Chặn F12
    if (e.keyCode === 123) {
        e.preventDefault();
        triggerSecurityAlert();
        return false;
    }
    // Chặn Ctrl + Shift + I / J / C (Windows)
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        triggerSecurityAlert();
        return false;
    }
    // Chặn Cmd + Alt + I / J / C (Mac)
    if (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        triggerSecurityAlert();
        return false;
    }
    // Chặn Ctrl + U / Cmd + U (View Source)
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
        e.preventDefault();
        triggerSecurityAlert();
        return false;
    }
    // Chặn Ctrl + S / Cmd + S (Save Page)
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) {
        e.preventDefault();
        triggerSecurityAlert();
        return false;
    }
    // Chặn Ctrl + P / Cmd + P (Print Page)
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 80) {
        e.preventDefault();
        triggerSecurityAlert();
        return false;
    }
});

// 4. Chặn kéo thả hình ảnh/video để lấy link CDN trực tiếp
document.addEventListener('dragstart', (e) => {
    e.preventDefault();
});

// 5. Chặn sao chép (Copy) văn bản thông thường
document.addEventListener('copy', (e) => {
    e.preventDefault();
    showToast("⚠️ Mã nguồn và dữ liệu đã được bảo mật!");
});

// 6. Phát hiện gỡ lỗi thời gian thực (Anti-Remote Debugging trên di động và PC)
// Vòng lặp liên tục bẫy debugger để làm dừng mọi nỗ lực gỡ lỗi thô sơ
setInterval(function() {
    const startTime = new Date().getTime();
    debugger; 
    const endTime = new Date().getTime();
    if (endTime - startTime > 100) {
        triggerSecurityAlert();
    }
}, 1000);


// =============================================================
// II. XỬ LÝ QUÁ TRÌNH TẢI VIDEO & KHAI THÁC LUỒNG API
// =============================================================

const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const menuOverlay = document.getElementById('menuOverlay');
const tiktokUrlInput = document.getElementById('tiktokUrl');
const charCount = document.getElementById('charCount');
const pasteBtn = document.getElementById('pasteBtn');
const downloadBtn = document.getElementById('downloadBtn');

const loadingSection = document.getElementById('loadingSection');
const loadingText = document.getElementById('loadingText');
const loadingBar = document.getElementById('loadingBar');
const progressPercent = document.getElementById('progressPercent');

const errorSection = document.getElementById('errorSection');
const errorMsg = document.getElementById('errorMsg');
const resultSection = document.getElementById('resultSection');
const clearBtn = document.getElementById('clearBtn');

const videoPreview = document.getElementById('videoPreview');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const authorAvatar = document.getElementById('authorAvatar');
const authorName = document.getElementById('authorName');
const authorUsername = document.getElementById('authorUsername');
const videoDesc = document.getElementById('videoDesc');

const dlNoWatermark = document.getElementById('dlNoWatermark');
const dlNoWatermarkHD = document.getElementById('dlNoWatermarkHD');
const dlAudio = document.getElementById('dlAudio');

// Các nút chuyển đổi Popups
const btnPrivacy = document.getElementById('btnPrivacy');
const btnTerms = document.getElementById('btnTerms');
const btnGuide = document.getElementById('btnGuide');
const btnClosePrivacy = document.getElementById('btnClosePrivacy');
const btnAcceptPrivacy = document.getElementById('btnAcceptPrivacy');
const btnCloseTerms = document.getElementById('btnCloseTerms');
const btnAcceptTerms = document.getElementById('btnAcceptTerms');
const btnCloseGuide = document.getElementById('btnCloseGuide');
const btnAcceptGuide = document.getElementById('btnAcceptGuide');

let extractedLinks = {
    video: '',
    hdVideo: '',
    audio: ''
};

// Toggle Menu Sidebar
function toggleMenu() {
    const isOpened = !sideMenu.classList.contains('translate-x-full');
    if (isOpened) {
        sideMenu.classList.add('translate-x-full');
        menuOverlay.classList.add('hidden');
        menuOverlay.classList.remove('opacity-100');
    } else {
        sideMenu.classList.remove('translate-x-full');
        menuOverlay.classList.remove('hidden');
        setTimeout(() => menuOverlay.classList.add('opacity-100'), 10);
    }
}

if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);
if (menuOverlay) menuOverlay.addEventListener('click', toggleMenu);

// Đóng mở Modals
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        sideMenu.classList.add('translate-x-full');
        menuOverlay.classList.add('hidden');
        menuOverlay.classList.remove('opacity-100');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

if (btnPrivacy) btnPrivacy.addEventListener('click', () => openModal('privacyModal'));
if (btnTerms) btnTerms.addEventListener('click', () => openModal('termsModal'));
if (btnGuide) btnGuide.addEventListener('click', () => openModal('guideModal'));

if (btnClosePrivacy) btnClosePrivacy.addEventListener('click', () => closeModal('privacyModal'));
if (btnAcceptPrivacy) btnAcceptPrivacy.addEventListener('click', () => closeModal('privacyModal'));
if (btnCloseTerms) btnCloseTerms.addEventListener('click', () => closeModal('termsModal'));
if (btnAcceptTerms) btnAcceptTerms.addEventListener('click', () => closeModal('termsModal'));
if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => closeModal('guideModal'));
if (btnAcceptGuide) btnAcceptGuide.addEventListener('click', () => closeModal('guideModal'));

// Toast Notifications
function showToast(msg) {
    const toast = document.getElementById('toastBox');
    const toastMsg = document.getElementById('toastMsg');
    if (toast && toastMsg) {
        toastMsg.textContent = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 4000);
    }
}

// Báo lỗi hệ thống
function alertMessage(msg) {
    if (errorMsg && errorSection) {
        errorMsg.textContent = msg;
        errorSection.classList.remove('hidden');
        errorSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Cập nhật phần trăm và nhãn thanh tải
function updateProgress(percent, label = "") {
    if (loadingText) {
        if (label) loadingText.textContent = label;
        loadingBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    }
}

// Kiểm soát số lượng ký tự nhập liệu
if (tiktokUrlInput) {
    tiktokUrlInput.addEventListener('input', (e) => {
        const val = e.target.value;
        charCount.textContent = `${val.length} ký tự`;
        errorSection.classList.add('hidden');
    });
}

// Tự dán đường dẫn
if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                tiktokUrlInput.value = text;
                charCount.textContent = `${text.length} ký tự`;
                tiktokUrlInput.dispatchEvent(new Event('input'));
            } else {
                alertMessage("Hãy nhấp giữ chuột/tay để dán thủ công do chính sách bảo mật.");
            }
        } catch (err) {
            alertMessage("Hãy dán liên kết bằng phím tắt Ctrl+V.");
        }
    });
}

// CORE: LUỒNG TRUYỀN DẪN TẢI TRỰC TIẾP (BLOB STREAM)
async function triggerDirectDownload(fileUrl, filename) {
    updateProgress(0, "Kết nối cổng dữ liệu...");
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Kết nối CDN tệp tin thất bại");
        
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length') || 0;
        
        let receivedLength = 0;
        let chunks = [];
        
        while(true) {
            const {done, value} = await reader.read();
            if (done) break;
            
            chunks.push(value);
            receivedLength += value.length;
            
            if (contentLength) {
                const percent = Math.round((receivedLength / contentLength) * 100);
                updateProgress(percent, `Đang truyền dữ liệu file về máy: ${percent}%`);
            } else {
                updateProgress(50, "Đang nạp luồng dữ liệu thô...");
            }
        }
        
        updateProgress(100, "Xác minh tệp hoàn tất!");
        
        const blob = new Blob(chunks, { type: filename.endsWith('.mp3') ? 'audio/mp3' : 'video/mp4' });
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        showToast("Tệp tin đã lưu thẳng về máy!");
        
    } catch (err) {
        console.warn("CORS blocked direct download stream, using fallback native window redirection", err);
        // Fallback mở tab phụ để lưu trữ nếu máy chủ TikTok kích hoạt chế độ khóa CORS Origin
        const a = document.createElement('a');
        a.href = fileUrl;
        a.target = '_blank';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Đã xử lý thông qua liên kết tải của trình duyệt.");
    }
}

// Kích hoạt phân tích và tải trực tiếp
if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        const inputUrl = tiktokUrlInput.value.trim();
        if (!inputUrl) {
            alertMessage("Vui lòng dán liên kết video TikTok trước khi tải.");
            return;
        }

        if (!inputUrl.includes("tiktok.com")) {
            alertMessage("Liên kết video TikTok không đúng định dạng.");
            return;
        }

        loadingSection.classList.remove('hidden');
        errorSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        downloadBtn.disabled = true;
        downloadBtn.classList.add('opacity-50');
        updateProgress(15, "Đang phân tích gói tin liên kết...");

        try {
            // Máy chủ API chính
            const response = await fetchWithRetry(`https://www.tikwm.com/api/?url=${encodeURIComponent(inputUrl)}`);
            const resData = await response.json();

            if (resData && resData.code === 0 && resData.data) {
                const info = resData.data;

                // Lưu các luồng liên kết
                extractedLinks.video = info.play;
                extractedLinks.hdVideo = info.hdplay || info.play;
                extractedLinks.audio = info.music;

                // Gán thông tin tác giả lên bảng kết quả
                authorName.textContent = info.author.nickname || "TikTok User";
                authorUsername.textContent = `@${info.author.unique_id || "username"}`;
                authorAvatar.src = info.author.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80";
                videoDesc.textContent = info.title || "Không có mô tả cho video này.";

                if (info.play) {
                    videoPreview.src = info.play;
                    videoPreview.classList.remove('hidden');
                    videoPlaceholder.classList.add('hidden');
                } else {
                    videoPreview.classList.add('hidden');
                    videoPlaceholder.classList.remove('hidden');
                }

                // TẢI THẲNG VIDEO KHÔNG LOGO VỀ MÁY NGAY SAU KHI CLICK PHÂN TÍCH
                updateProgress(45, "Xác minh thành công! Đang lưu video...");
                const uniqueId = info.id || Date.now();
                await triggerDirectDownload(extractedLinks.video, `NizeTik_${uniqueId}.mp4`);

                resultSection.classList.remove('hidden');
            } else {
                await tryBackupAPI(inputUrl);
            }

        } catch (err) {
            await tryBackupAPI(inputUrl);
        } finally {
            loadingSection.classList.add('hidden');
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('opacity-50');
        }
    });
}

// Máy chủ dự phòng
async function tryBackupAPI(url) {
    updateProgress(30, "Đang định tuyến luồng dự phòng...");
    try {
        const response = await fetchWithRetry(`https://api.tik-tok-download.com/api/video/info?url=${encodeURIComponent(url)}`);
        const resData = await response.json();

        if (resData && resData.status === "success" && resData.video) {
            extractedLinks.video = resData.video.noWatermark;
            extractedLinks.hdVideo = resData.video.watermark || resData.video.noWatermark;
            extractedLinks.audio = resData.music?.playUrl || '';

            authorName.textContent = resData.author?.nickname || "TikTok User";
            authorUsername.textContent = `@${resData.author?.username || "username"}`;
            authorAvatar.src = resData.author?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80";
            videoDesc.textContent = resData.title || "Không có mô tả.";

            if (extractedLinks.video) {
                videoPreview.src = extractedLinks.video;
                videoPreview.classList.remove('hidden');
                videoPlaceholder.classList.add('hidden');
            }

            // Tải thẳng video ngay lập tức
            updateProgress(65, "Bắt đầu tải trực tiếp video...");
            await triggerDirectDownload(extractedLinks.video, `NizeTik_${Date.now()}.mp4`);

            resultSection.classList.remove('hidden');
        } else {
            throw new Error("Lỗi giải cấu trúc.");
        }
    } catch (fallbackErr) {
        alertMessage("Không thể giải mã dữ liệu của liên kết này. Hãy đảm bảo video của bạn ở chế độ công khai.");
    }
}

// Hàm fetch tự động thử lại khi gián đoạn mạng
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("Kết nối bị gián đoạn");
        return response;
    } catch (err) {
        if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        } else {
            throw err;
        }
    }
}

// Gán sự kiện click tải lại thủ công hoặc tải MP3
if (dlNoWatermark) {
    dlNoWatermark.addEventListener('click', async () => {
        if (!extractedLinks.video) return;
        loadingSection.classList.remove('hidden');
        await triggerDirectDownload(extractedLinks.video, `NizeTik_Video_${Date.now()}.mp4`);
        loadingSection.classList.add('hidden');
    });
}

if (dlNoWatermarkHD) {
    dlNoWatermarkHD.addEventListener('click', async () => {
        if (!extractedLinks.hdVideo) return;
        loadingSection.classList.remove('hidden');
        await triggerDirectDownload(extractedLinks.hdVideo, `NizeTik_HD_${Date.now()}.mp4`);
        loadingSection.classList.add('hidden');
    });
}

if (dlAudio) {
    dlAudio.addEventListener('click', async () => {
        if (!extractedLinks.audio) {
            showToast("Video này không có tệp âm thanh MP3 riêng biệt.");
            return;
        }
        loadingSection.classList.remove('hidden');
        await triggerDirectDownload(extractedLinks.audio, `NizeTik_Audio_${Date.now()}.mp3`);
        loadingSection.classList.add('hidden');
    });
}

// Xóa kết quả làm rỗng ô nhập liệu
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        tiktokUrlInput.value = "";
        charCount.textContent = "0 ký tự";
        videoPreview.src = "";
        videoPreview.classList.add('hidden');
        videoPlaceholder.classList.remove('hidden');
        extractedLinks = { video: '', hdVideo: '', audio: '' };
        tiktokUrlInput.focus();
    });
}