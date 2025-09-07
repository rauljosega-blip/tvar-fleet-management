# 🚀 Guía Paso a Paso: Desplegar TVAR en Render.com

## Parte 1: Subir a GitHub con GitHub Desktop

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
5. **¡IMPORTANTE!** Copia la URL del repositorio (aparece en la página)
   - Ejemplo: `https://github.com/tu-usuario/tvar-fleet-management.git`

### Paso 2: Usar GitHub Desktop
1. Abre **GitHub Desktop**
2. Haz clic en **"File"** → **"Add Local Repository"**
3. Haz clic en **"Choose..."** y selecciona tu carpeta:
   ```
   C:\Users\Raul\OneDrive\Desktop\pagina web tvar
   ```
4. Si aparece "This directory does not appear to be a Git repository":
   - Haz clic en **"create a repository"**
   - Deja el nombre como está
   - Haz clic en **"Create Repository"**

### Paso 3: Conectar con GitHub
1. En GitHub Desktop, haz clic en **"Publish repository"**
2. Configura:
   - **Name**: `tvar-fleet-management`
   - **Description**: `Sistema de Gestión de Flota TVAR`
   - ✅ Marca **"Keep this code private"** (si quieres que sea privado)
3. Haz clic en **"Publish Repository"**

### Paso 4: Hacer el primer commit
1. En GitHub Desktop verás todos los archivos listados
2. En el campo **"Summary"** escribe: `Versión inicial del sistema TVAR`
3. En **"Description"** (opcional): `Sistema completo con base de datos y preparado para Render.com`
4. Haz clic en **"Commit to main"**
5. Haz clic en **"Push origin"** para subir los archivos

---

## Parte 2: Desplegar en Render.com

### Paso 5: Crear cuenta en Render
1. Ve a [Render.com](https://render.com)
2. Haz clic en **"Get Started"**
3. Regístrate con GitHub (recomendado) o email
4. Autoriza a Render para acceder a tus repositorios

### Paso 6: Crear Web Service
1. En el Dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio:
   - Si no aparece, haz clic en **"Configure account"**
   - Autoriza acceso al repositorio `tvar-fleet-management`
4. Selecciona el repositorio `tvar-fleet-management`

### Paso 7: Configurar el servicio
Completa los campos:

```
🏷️ Name: tvar-fleet-management
🌍 Region: Oregon (US West) [recomendado]
🌿 Branch: main
🔧 Runtime: Node
📦 Build Command: npm install
🚀 Start Command: npm start
💰 Instance Type: Free
```

### Paso 8: Variables de entorno (opcional)
En la sección **"Environment Variables"**:
- Haz clic en **"Add Environment Variable"**
- Agrega:
  ```
  NODE_ENV = production
  ```

### Paso 9: Desplegar
1. Revisa toda la configuración
2. Haz clic en **"Create Web Service"**
3. **¡Espera!** El proceso toma 2-5 minutos:
   - ⏳ Building... (instalando dependencias)
   - ⏳ Deploying... (iniciando servidor)
   - ✅ Live (¡funcionando!)

### Paso 10: Acceder a tu aplicación
1. Una vez que aparezca **"Live"**, verás la URL:
   ```
   https://tvar-fleet-management.onrender.com
   ```
2. Haz clic en la URL para abrir tu aplicación
3. **¡Listo!** Tu sistema TVAR está en línea 🎉

---

## 🔐 Credenciales de acceso

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Consulta:**
- Usuario: `consulta`
- Contraseña: `consulta123`

---

## 🛠️ Actualizaciones futuras

Para actualizar tu aplicación:

1. **Modifica archivos** en tu computadora
2. **GitHub Desktop**:
   - Verás los cambios automáticamente
   - Escribe un mensaje de commit
   - Haz clic en **"Commit to main"**
   - Haz clic en **"Push origin"**
3. **Render.com**:
   - Detecta los cambios automáticamente
   - Redespliega la aplicación
   - ¡Listo en 2-3 minutos!

---

## ❓ Solución de problemas

### Si el build falla:
1. Ve a **"Logs"** en Render
2. Busca errores en rojo
3. Común: verificar que `package.json` esté correcto

### Si la aplicación no carga:
1. Verifica que la URL termine en `.onrender.com`
2. Espera 30 segundos (los servicios gratuitos pueden "dormir")
3. Revisa los logs del servidor

### Si pierdes datos:
- Los datos se guardan automáticamente en el servidor
- En caso de problemas, contacta soporte

---

## 🎯 ¡Siguiente paso!

**Ejecuta estos comandos en orden:**
1. Sube a GitHub (Pasos 1-4)
2. Despliega en Render (Pasos 5-9)
3. ¡Disfruta tu aplicación en línea!

**¿Necesitas ayuda?** Sigue cada paso exactamente como está escrito. ¡Tu sistema TVAR estará funcionando en menos de 15 minutos! 🚀