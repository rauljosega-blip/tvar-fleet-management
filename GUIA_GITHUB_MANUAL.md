# 🔧 Guía Manual para Subir TVAR a GitHub (Sin GitHub Desktop)

## 📋 Resumen de cambios a subir

✅ **Enlaces clickeables en imágenes**: Los íconos de facturas y fotos ahora son clickeables
✅ **Función viewInvoice()**: Modal para visualizar facturas y fotos
✅ **Corrección de errores de sintaxis**: Reemplazo de comillas tipográficas
✅ **Optimización de código**: Mejoras en app.js y database.js

---

## 🚀 Método 1: Primera vez subiendo a GitHub

### Paso 1: Configurar Git (solo la primera vez)
```bash
# Configurar tu identidad
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"

# Verificar configuración
git config --list
```

### Paso 2: Crear repositorio en GitHub.com
1. Ve a [GitHub.com](https://github.com) e inicia sesión
2. Haz clic en **"+"** → **"New repository"**
3. Configura:
   - **Repository name**: `tvar-fleet-management`
   - **Description**: `Sistema de Gestión de Flota TVAR`
   - ✅ **Public** (o Private)
   - ❌ **NO** marques "Add a README file"
4. Haz clic en **"Create repository"**
5. **Copia la URL**: `https://github.com/tu-usuario/tvar-fleet-management.git`

### Paso 3: Inicializar y subir proyecto
```bash
# Navegar a tu carpeta del proyecto
cd "C:\Users\Raul\OneDrive\Desktop\pagina web tvar"

# Inicializar repositorio Git
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Versión inicial del sistema TVAR con enlaces clickeables"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/tvar-fleet-management.git

# Subir archivos
git push -u origin main
```

---

## 🔄 Método 2: Actualizar repositorio existente

### Si ya tienes el repositorio en GitHub:

```bash
# Navegar a tu carpeta del proyecto
cd "C:\Users\Raul\OneDrive\Desktop\pagina web tvar"

# Verificar estado de archivos
git status

# Agregar archivos modificados
git add .

# Hacer commit con mensaje descriptivo
git commit -m "Agregar enlaces clickeables y modal de visualización

- Implementar función viewInvoice() para mostrar facturas/fotos
- Convertir íconos de imagen en enlaces clickeables
- Corregir errores de sintaxis con comillas tipográficas
- Optimizar código en app.js y database.js"

# Subir cambios
git push origin main
```

---

## 🛠️ Comandos útiles de Git

### Verificar estado:
```bash
# Ver archivos modificados
git status

# Ver diferencias en archivos
git diff

# Ver historial de commits
git log --oneline
```

### Gestionar archivos:
```bash
# Agregar archivo específico
git add app.js

# Agregar múltiples archivos
git add app.js database.js

# Agregar todos los archivos
git add .

# Ver qué archivos están en staging
git status
```

### Hacer commits:
```bash
# Commit con mensaje corto
git commit -m "Mensaje del commit"

# Commit con mensaje detallado
git commit -m "Título del commit" -m "Descripción detallada del cambio"

# Modificar último commit (si no se ha subido)
git commit --amend -m "Nuevo mensaje"
```

---

## 🔐 Autenticación con GitHub

### Opción 1: Token de acceso personal (recomendado)
1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Selecciona scopes: `repo`, `workflow`
4. Copia el token generado
5. Úsalo como contraseña cuando Git te lo pida

### Opción 2: SSH (avanzado)
```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Agregar clave al agente SSH
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar clave pública (agregar en GitHub)
cat ~/.ssh/id_ed25519.pub

# Cambiar URL del repositorio a SSH
git remote set-url origin git@github.com:tu-usuario/tvar-fleet-management.git
```

---

## 🚨 Solución de problemas comunes

### Error: "fatal: not a git repository"
```bash
# Inicializar repositorio
git init
```

### Error: "remote origin already exists"
```bash
# Eliminar remote existente
git remote remove origin

# Agregar nuevo remote
git remote add origin https://github.com/tu-usuario/tvar-fleet-management.git
```

### Error: "failed to push some refs"
```bash
# Descargar cambios del repositorio remoto
git pull origin main --allow-unrelated-histories

# Luego hacer push
git push origin main
```

### Error: "Please tell me who you are"
```bash
# Configurar identidad
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### Deshacer cambios:
```bash
# Deshacer cambios no guardados
git checkout -- archivo.js

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (eliminar cambios)
git reset --hard HEAD~1
```

---

## 📁 Archivos importantes del proyecto

```
tvar-fleet-management/
├── app.js                    # ← Modificado (función viewInvoice)
├── database.js               # ← Modificado (enlaces onclick)
├── server.js                 # Servidor Node.js
├── index.html                # Página principal
├── styles.css                # Estilos CSS
├── package.json              # Dependencias
├── .gitignore                # Archivos a ignorar
├── README.md                 # Documentación
├── GUIA_DESPLIEGUE.md        # Guía de despliegue
└── render.yaml               # Configuración Render
```

---

## 🎯 Verificar que todo está subido

### En terminal:
```bash
# Verificar que no hay cambios pendientes
git status
# Debe mostrar: "nothing to commit, working tree clean"

# Verificar último commit
git log -1 --oneline

# Verificar conexión con GitHub
git remote -v
```

### En GitHub.com:
1. Ve a tu repositorio: `https://github.com/tu-usuario/tvar-fleet-management`
2. Verifica que aparecen todos los archivos
3. Revisa que el último commit tiene tu mensaje
4. Confirma la fecha/hora del último push

---

## 🚀 Después de subir a GitHub

### Desplegar en Render automáticamente:
1. Ve a [Render.com](https://render.com)
2. Busca tu servicio `tvar-fleet-management`
3. Render detectará los cambios automáticamente
4. Espera 2-5 minutos para el despliegue
5. Verifica en: `https://tvar-fleet-management.onrender.com`

### Si Render no detecta cambios:
1. Ve a tu servicio en Render
2. Haz clic en "Manual Deploy"
3. Selecciona "Deploy latest commit"

---

## ✅ Checklist final

**Antes de subir:**
- [ ] Servidor local funciona (http://localhost:3000)
- [ ] Archivos guardados correctamente
- [ ] Git configurado con tu identidad
- [ ] Repositorio creado en GitHub

**Al subir:**
- [ ] `git status` muestra archivos modificados
- [ ] `git add .` agrega todos los cambios
- [ ] `git commit` con mensaje descriptivo
- [ ] `git push` sube sin errores

**Después de subir:**
- [ ] Archivos visibles en GitHub.com
- [ ] Render despliega automáticamente
- [ ] Aplicación funciona en URL de producción
- [ ] Enlaces clickeables operan correctamente

---

## 🆘 Comandos de emergencia

### Si algo sale mal:
```bash
# Ver qué pasó
git log --oneline
git status

# Volver al estado anterior
git reset --hard HEAD~1

# Forzar push (¡cuidado!)
git push --force origin main

# Clonar repositorio limpio
git clone https://github.com/tu-usuario/tvar-fleet-management.git
```

### Contactar soporte:
- **GitHub**: https://support.github.com
- **Render**: https://render.com/docs
- **Git**: https://git-scm.com/docs

---

## 🎉 ¡Listo!

**Tu aplicación TVAR ahora está:**
- 📤 Subida a GitHub
- 🚀 Desplegada en Render
- 🖱️ Con enlaces clickeables funcionando
- 🖼️ Con modal de visualización operativo

**URLs importantes:**
- **GitHub**: https://github.com/tu-usuario/tvar-fleet-management
- **Aplicación**: https://tvar-fleet-management.onrender.com
- **Local**: http://localhost:3000

¡Felicidades! Tu sistema está completamente actualizado y funcionando. 🎊