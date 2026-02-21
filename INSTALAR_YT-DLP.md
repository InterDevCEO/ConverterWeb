# 🚀 Guía Rápida: Activar Instagram, TikTok, Twitter y Facebook

## ¿Qué necesitas hacer?

Solo necesitas instalar **yt-dlp**. Es un programa que permite descargar videos de todas las plataformas.

---

## 📥 Método 1: Instalación Automática (MÁS FÁCIL)

### Paso 1: Abre PowerShell como Administrador
1. Presiona `Windows + X`
2. Selecciona "Windows PowerShell (Administrador)" o "Terminal (Administrador)"

### Paso 2: Ejecuta este comando:
```powershell
pip install yt-dlp
```

Si no tienes Python instalado, usa el **Método 2** (más abajo).

---

## 📥 Método 2: Instalación Manual (Si no tienes Python)

### Paso 1: Descargar yt-dlp
1. Ve a: https://github.com/yt-dlp/yt-dlp/releases/latest
2. Busca el archivo que dice: **yt-dlp.exe** (debe ser el primero de la lista)
3. Haz clic derecho y "Guardar enlace como..."
4. Guárdalo en una carpeta fácil de encontrar, por ejemplo: `C:\yt-dlp\`

### Paso 2: Agregar a PATH (Para que funcione desde cualquier lugar)

1. Presiona `Windows + R`
2. Escribe: `sysdm.cpl` y presiona Enter
3. Ve a la pestaña "Opciones avanzadas"
4. Haz clic en "Variables de entorno"
5. En "Variables del sistema", busca "Path" y haz clic en "Editar"
6. Haz clic en "Nuevo"
7. Pega la ruta donde guardaste yt-dlp.exe (ejemplo: `C:\yt-dlp`)
8. Haz clic en "Aceptar" en todas las ventanas

### Paso 3: Verificar que funciona
1. Abre PowerShell (normal, no como administrador)
2. Escribe: `yt-dlp --version`
3. Si aparece un número de versión, ¡funcionó! ✅

---

## ✅ Verificar que está instalado

Abre PowerShell y escribe:
```powershell
yt-dlp --version
```

Si ves algo como `2024.01.01` (un número de versión), ¡está instalado correctamente!

---

## 🔄 Reiniciar el servidor

Después de instalar yt-dlp:
1. Detén el servidor (Ctrl + C en la terminal donde corre)
2. Vuelve a iniciarlo: `npm start`
3. ¡Listo! Ahora puedes convertir videos de Instagram, TikTok, Twitter y Facebook

---

## ❓ Problemas comunes

### "No se reconoce yt-dlp como comando"
- Asegúrate de haber agregado yt-dlp al PATH (Método 2, Paso 2)
- Reinicia PowerShell después de agregar al PATH
- Reinicia tu computadora si sigue sin funcionar

### "pip no se reconoce"
- No tienes Python instalado
- Usa el Método 2 (instalación manual)

### "Error al descargar"
- Verifica que el enlace del video sea correcto
- Algunos videos pueden estar protegidos o ser privados

---

## 🎉 ¡Listo!

Una vez instalado yt-dlp, todas las plataformas funcionarán:
- ✅ YouTube (ya funciona sin yt-dlp)
- ✅ Instagram
- ✅ TikTok
- ✅ Twitter/X
- ✅ Facebook
