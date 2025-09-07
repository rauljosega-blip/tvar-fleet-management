# 🚀 Guía Manual: Desplegar TVAR en Render.com (Sin GitHub Desktop)

## Parte 1: Subir a GitHub usando comandos Git

### Paso 1: Crear repositorio en GitHub.com
1. Ve a [GitHub.com](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** (esquina superior derecha) → **"New repository"**
3. Configura el repositorio:
   - **Repository name**: `tvar-fleet-management`
   - **Description**: `Sistema de Gestión de Flota TVAR`
   - ✅ **Public** (o Private si prefieres)
   - ❌ **NO** marques "Add a README file" (ya tienes uno)
   - ❌ **NO** agregues .gitignore (ya tienes uno)
4. Haz clic en **"Create repository"**
5. **¡IMPORTANTE!** Copia la URL del repositorio:
   ```
   https://github.com/TU-USUARIO/tvar-fleet-management.git
   ```
   (Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub)

### Paso 2: Abrir PowerShell en tu carpeta
1. Abre el **Explorador de archivos**
2. Navega a: `C:\Users\Raul\OneDrive\Desktop\pagina web tvar`
3. Haz clic en la barra de direcciones y escribe: `powershell`
4. Presiona **Enter** (se abrirá PowerShell en esa carpeta)

### Paso 3: Configurar Git (solo la primera vez)
```powershell
# Configura tu nombre y email (reemplaza con tus datos)
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### Paso 4: Inicializar repositorio Git
```powershell
# Inicializar Git en la carpeta
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Versión inicial del sistema TVAR"

# Cambiar a la rama main
git branch -M main
```

### Paso 5: Conectar con GitHub y subir archivos
```powershell
# Conectar con tu repositorio (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/tvar-fleet-management.git

# Subir archivos a GitHub
git push -u origin main
```

**Si te pide credenciales:**
- **Usuario**: Tu nombre de usuario de GitHub
- **Contraseña**: Tu Personal Access Token (no tu contraseña normal)

### 📝 Crear Personal Access Token (si es necesario)
1. Ve a GitHub.com → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Haz clic en **"Generate new token (classic)"**
3. Configura:
   - **Note**: `TVAR Deploy`
   - **Expiration**: `90 days`
   - **Scopes**: ✅ `repo` (marca toda la sección)
4. Haz clic en **"Generate token"**
5. **¡COPIA EL TOKEN!** (no podrás verlo de nuevo)
6. Usa este token como contraseña cuando Git te lo pida

---

## Parte 2: Desplegar en Render.com

### Paso 6: Crear cuenta en Render
1. Ve a [Render.com](https://render.com)
2. Haz clic en **"Get Started"**
3. Regístrate con GitHub (recomendado) o email
4. Si usas GitHub, autoriza a Render para acceder a tus repositorios

### Paso 7: Crear Web Service
1. En el Dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio:
   - Si registraste con GitHub, aparecerá automáticamente
   - Si no aparece, haz clic en **"Connect account"** y autoriza
4. Selecciona el repositorio `tvar-fleet-management`

### Paso 8: Configurar el servicio
Completa los campos exactamente así:

```
🏷️ Name: tvar-fleet-management
🌍 Region: Oregon (US West)
🌿 Branch: main
🔧 Runtime: Node
📦 Build Command: npm install
🚀 Start Command: npm start
💰 Instance Type: Free
```

### Paso 9: Variables de entorno
En **"Environment Variables"**:
1. Haz clic en **"Add Environment Variable"**
2. Agrega:
   ```
   Key: NODE_ENV
   Value: production
   ```

### Paso 10: Desplegar
1. Revisa toda la configuración
2. Haz clic en **"Create Web Service"**
3. **Espera el proceso** (2-5 minutos):
   ```
   ⏳ Building...     (instalando dependencias)
   ⏳ Deploying...    (iniciando servidor)
   ✅ Live           (¡funcionando!)
   ```

### Paso 11: ¡Acceder a tu aplicación!
1. Una vez que aparezca **"Live"**, verás la URL:
   ```
   https://tvar-fleet-management-XXXX.onrender.com
   ```
2. Haz clic en la URL
3. **¡Tu sistema TVAR está en línea!** 🎉

---

## 🔐 Credenciales de acceso

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Consulta:**
- Usuario: `consulta`
- Contraseña: `consulta123`

---

## 🔄 Actualizaciones futuras (método manual)

Cuando modifiques tu aplicación:

### En PowerShell (en tu carpeta del proyecto):
```powershell
# Ver qué archivos cambiaron
git status

# Agregar cambios
git add .

# Hacer commit con mensaje descriptivo
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

### En Render.com:
- Detecta los cambios automáticamente
- Redespliega en 2-3 minutos
- ¡Listo!

---

## ❓ Solución de problemas comunes

### Error: "Git no se reconoce como comando"
**Solución:**
1. Descarga Git desde: https://git-scm.com/download/win
2. Instala con configuración por defecto
3. Reinicia PowerShell

### Error: "Authentication failed"
**Solución:**
1. Usa Personal Access Token (no tu contraseña)
2. O configura SSH keys (más avanzado)

### Error en Render: "Build failed"
**Solución:**
1. Ve a **"Logs"** en Render
2. Busca líneas en rojo con errores
3. Verifica que `package.json` esté correcto

### La aplicación no carga
**Solución:**
1. Espera 30 segundos (servicios gratuitos pueden "dormir")
2. Verifica la URL completa
3. Revisa logs del servidor en Render

---

## 📋 Comandos de referencia rápida

```powershell
# Configuración inicial (solo una vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"

# Subir proyecto por primera vez
git init
git add .
git commit -m "Versión inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/tvar-fleet-management.git
git push -u origin main

# Actualizaciones futuras
git add .
git commit -m "Descripción del cambio"
git push
```

---

## 🎯 Resumen del proceso

1. **GitHub** (5 min): Crear repo → Comandos Git → Subir código
2. **Render** (10 min): Crear servicio → Configurar → Desplegar
3. **¡Listo!** Tu aplicación funcionando en internet

**Tiempo total estimado: 15 minutos**

¡Tu sistema TVAR estará disponible 24/7 desde cualquier lugar del mundo! 🌍