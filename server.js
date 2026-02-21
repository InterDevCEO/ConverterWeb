const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Crear directorios necesarios
const downloadsDir = path.join(__dirname, 'downloads');
const tempDir = path.join(__dirname, 'temp');

[downloadsDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Función para detectar la plataforma del enlace
function detectPlatform(url) {
  if (ytdl.validateURL(url)) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com')) return 'facebook';
  return 'unknown';
}

// Función para verificar si yt-dlp está disponible
async function checkYtDlpAvailable() {
  try {
    await execAsync('yt-dlp --version');
    return true;
  } catch {
    return false;
  }
}

// Función para obtener información del video usando yt-dlp
async function getVideoInfoYtDlp(url) {
  try {
    const { stdout } = await execAsync(`yt-dlp --dump-json --no-warnings "${url}"`);
    const info = JSON.parse(stdout);
    return {
      title: info.title || 'Video',
      duration: info.duration || 0,
      thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
      formats: info.formats || []
    };
  } catch (error) {
    throw new Error(`Error al obtener información con yt-dlp: ${error.message}`);
  }
}

// Función para obtener información del video
async function getVideoInfo(url, platform) {
  try {
    if (platform === 'youtube') {
      const info = await ytdl.getInfo(url);
      return {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        formats: info.formats
      };
    }
    
    // Para otras plataformas, intentar usar yt-dlp
    const ytDlpAvailable = await checkYtDlpAvailable();
    if (ytDlpAvailable) {
      return await getVideoInfoYtDlp(url);
    }
    
    // Si yt-dlp no está disponible, retornar información básica
    return {
      title: 'Video',
      duration: 0,
      thumbnail: '',
      formats: [],
      note: 'yt-dlp no está instalado. Instálalo para soporte completo de esta plataforma.'
    };
  } catch (error) {
    throw new Error(`Error al obtener información: ${error.message}`);
  }
}

// Endpoint para obtener información del video
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL requerida' });
    }

    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      return res.status(400).json({ error: 'Plataforma no soportada' });
    }

    const info = await getVideoInfo(url, platform);
    res.json({ ...info, platform });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para descargar/convertir
app.post('/api/download', async (req, res) => {
  try {
    const { url, format, quality } = req.body;
    
    if (!url || !format) {
      return res.status(400).json({ error: 'URL y formato requeridos' });
    }

    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      return res.status(400).json({ error: 'Plataforma no soportada' });
    }

    const timestamp = Date.now();
    const filename = `download_${timestamp}`;
    
    if (platform === 'youtube') {
      if (format === 'mp3') {
        // Descargar como audio y convertir a MP3
        const audioPath = path.join(tempDir, `${filename}.mp4`);
        const outputPath = path.join(downloadsDir, `${filename}.mp3`);
        
        const video = ytdl(url, { quality: 'highestaudio' });
        const writeStream = fs.createWriteStream(audioPath);
        
        video.pipe(writeStream);
        
        video.on('end', () => {
          // Convertir a MP3 usando ffmpeg
          const ffmpeg = require('fluent-ffmpeg');
          ffmpeg(audioPath)
            .toFormat('mp3')
            .on('end', () => {
              fs.unlinkSync(audioPath);
              res.download(outputPath, (err) => {
                if (err) {
                  console.error('Error al enviar archivo:', err);
                }
                // Limpiar después de un tiempo
                setTimeout(() => {
                  if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                  }
                }, 60000);
              });
            })
            .on('error', (err) => {
              console.error('Error en conversión:', err);
              res.status(500).json({ error: 'Error en la conversión' });
            })
            .save(outputPath);
        });
        
        video.on('error', (err) => {
          console.error('Error al descargar:', err);
          res.status(500).json({ error: 'Error al descargar el video' });
        });
      } else if (format === 'mp4') {
        // Descargar como video MP4
        const outputPath = path.join(downloadsDir, `${filename}.mp4`);
        const qualityOption = quality === 'high' ? 'highestvideo' : 'lowestvideo';
        
        const video = ytdl(url, { quality: qualityOption });
        const writeStream = fs.createWriteStream(outputPath);
        
        video.pipe(writeStream);
        
        video.on('end', () => {
          res.download(outputPath, (err) => {
            if (err) {
              console.error('Error al enviar archivo:', err);
            }
            setTimeout(() => {
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
            }, 60000);
          });
        });
        
        video.on('error', (err) => {
          console.error('Error al descargar:', err);
          res.status(500).json({ error: 'Error al descargar el video' });
        });
      } else {
        res.status(400).json({ error: 'Formato no soportado' });
      }
    } else {
      // Para otras plataformas, usar yt-dlp si está disponible
      const ytDlpAvailable = await checkYtDlpAvailable();
      
      if (!ytDlpAvailable) {
        return res.status(501).json({ 
          error: 'Para convertir videos de esta plataforma, necesitas instalar yt-dlp. Ver instrucciones en el README.' 
        });
      }
      
      // Usar yt-dlp para descargar
      const timestamp = Date.now();
      const filename = `download_${timestamp}`;
      const outputPath = path.join(downloadsDir, `${filename}.${format}`);
      
      try {
        let command = `yt-dlp -f "best" "${url}"`;
        
        if (format === 'mp3') {
          command = `yt-dlp -x --audio-format mp3 "${url}"`;
        } else if (format === 'mp4') {
          const qualityFlag = quality === 'high' ? 'best' : 'worst';
          command = `yt-dlp -f "${qualityFlag}[ext=mp4]" "${url}"`;
        }
        
        command += ` -o "${outputPath}"`;
        
        await execAsync(command);
        
        if (fs.existsSync(outputPath)) {
          res.download(outputPath, (err) => {
            if (err) {
              console.error('Error al enviar archivo:', err);
            }
            setTimeout(() => {
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
            }, 60000);
          });
        } else {
          res.status(500).json({ error: 'Error al generar el archivo' });
        }
      } catch (error) {
        console.error('Error con yt-dlp:', error);
        res.status(500).json({ error: `Error al descargar: ${error.message}` });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Endpoint para verificar si yt-dlp está instalado
app.get('/api/check-ytdlp', async (req, res) => {
  try {
    const isAvailable = await checkYtDlpAvailable();
    let version = null;
    
    if (isAvailable) {
      try {
        const { stdout } = await execAsync('yt-dlp --version');
        version = stdout.trim();
      } catch (error) {
        console.error('Error al obtener versión:', error);
      }
    }
    
    res.json({ 
      installed: isAvailable,
      version: version,
      platforms: {
        youtube: true, // Siempre funciona
        instagram: isAvailable,
        tiktok: isAvailable,
        twitter: isAvailable,
        facebook: isAvailable
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
