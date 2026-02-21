const API_BASE_URL = window.location.origin;

// Elementos del DOM
const urlInput = document.getElementById('url-input');
const analyzeBtn = document.getElementById('analyze-btn');
const downloadBtn = document.getElementById('download-btn');
const videoInfo = document.getElementById('video-info');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const videoTitle = document.getElementById('video-title');
const videoDuration = document.getElementById('video-duration');
const videoThumbnail = document.getElementById('video-thumbnail');
const formatRadios = document.querySelectorAll('input[name="format"]');
const qualityRadios = document.querySelectorAll('input[name="quality"]');

let currentUrl = '';
let currentPlatform = '';

// Mostrar/ocultar elementos
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    showElement(errorMessage);
    setTimeout(() => {
        hideElement(errorMessage);
    }, 5000);
}

function showLoading() {
    showElement(loading);
    hideElement(videoInfo);
}

function hideLoading() {
    hideElement(loading);
}

// Formatear duración
function formatDuration(seconds) {
    if (!seconds) return 'Duración desconocida';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Detectar plataforma del enlace
function detectPlatformFromUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
    if (url.includes('facebook.com')) return 'Facebook';
    return 'Desconocida';
}

// Analizar enlace
async function analyzeUrl() {
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Por favor, ingresa un enlace válido');
        return;
    }

    currentUrl = url;
    currentPlatform = detectPlatformFromUrl(url);
    
    showLoading();
    hideElement(errorMessage);
    analyzeBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al analizar el enlace');
        }

        // Mostrar información del video
        videoTitle.textContent = data.title || 'Video sin título';
        videoDuration.textContent = `Duración: ${formatDuration(data.duration)} | Plataforma: ${currentPlatform}`;
        
        if (data.thumbnail) {
            videoThumbnail.src = data.thumbnail;
            videoThumbnail.onerror = () => {
                videoThumbnail.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="112"%3E%3Crect fill="%23334155" width="200" height="112"/%3E%3Ctext fill="%23cbd5e1" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EVideo%3C/text%3E%3C/svg%3E';
            };
        }

        showElement(videoInfo);
        hideLoading();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al analizar el enlace. Por favor, verifica que el enlace sea válido.');
        hideLoading();
    } finally {
        analyzeBtn.disabled = false;
    }
}

// Manejar cambio de formato
formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const qualityOptions = document.getElementById('quality-options');
        if (e.target.value === 'mp4') {
            showElement(qualityOptions);
        } else {
            hideElement(qualityOptions);
        }
    });
});

// Descargar archivo
async function downloadFile() {
    if (!currentUrl) {
        showError('Por favor, analiza un enlace primero');
        return;
    }

    const selectedFormat = document.querySelector('input[name="format"]:checked').value;
    const selectedQuality = document.querySelector('input[name="quality"]:checked')?.value || 'high';

    showLoading();
    downloadBtn.disabled = true;
    hideElement(errorMessage);

    try {
        const response = await fetch(`${API_BASE_URL}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: currentUrl,
                format: selectedFormat,
                quality: selectedQuality
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al descargar el archivo');
        }

        // Obtener el blob del archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `download.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        hideLoading();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al descargar el archivo');
        hideLoading();
    } finally {
        downloadBtn.disabled = false;
    }
}

// Event listeners
analyzeBtn.addEventListener('click', analyzeUrl);

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        analyzeUrl();
    }
});

downloadBtn.addEventListener('click', downloadFile);

// Pegar desde portapapeles
urlInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        const pastedText = urlInput.value.trim();
        if (pastedText) {
            // Opcional: auto-analizar después de pegar
            // analyzeUrl();
        }
    }, 100);
});

// Verificar estado del servidor y yt-dlp al cargar
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!response.ok) {
            console.warn('El servidor podría no estar funcionando correctamente');
        }
    } catch (error) {
        console.warn('No se pudo conectar al servidor:', error);
    }
    
    // Verificar si yt-dlp está instalado
    checkYtDlpStatus();
});

// Verificar estado de yt-dlp
async function checkYtDlpStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/check-ytdlp`);
        const data = await response.json();
        
        if (!data.installed) {
            // Mostrar advertencia si yt-dlp no está instalado
            showYtDlpWarning();
        }
    } catch (error) {
        console.warn('No se pudo verificar yt-dlp:', error);
    }
}

// Mostrar advertencia sobre yt-dlp
function showYtDlpWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'ytdlp-warning';
    warningDiv.innerHTML = `
        <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <div class="warning-text">
                <strong>Plataformas limitadas:</strong> Solo YouTube está disponible.
                Para activar Instagram, TikTok, Twitter y Facebook, instala yt-dlp.
                <a href="INSTALAR_YT-DLP.md" target="_blank" class="warning-link">Ver instrucciones</a>
            </div>
            <button class="warning-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(warningDiv, container.firstChild);
}
