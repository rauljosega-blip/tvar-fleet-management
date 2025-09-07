# ⚡ Comandos Rápidos para Actualizar TVAR en Render

## 🚀 Proceso Express (5 minutos)

### 1️⃣ Verificar servidor local
```bash
# En la terminal donde tienes npm start corriendo:
# Verifica que funciona en http://localhost:3000
# Luego detén el servidor: Ctrl+C
```

### 2️⃣ Subir cambios con GitHub Desktop
1. **Abrir GitHub Desktop**
2. **Seleccionar repositorio**: `tvar-fleet-management`
3. **Escribir commit message**: `Agregar enlaces clickeables y modal de visualización`
4. **Hacer commit**: Botón "Commit to main"
5. **Subir**: Botón "Push origin"

### 3️⃣ Verificar en Render
1. **Ir a**: [render.com](https://render.com)
2. **Buscar**: `tvar-fleet-management`
3. **Esperar**: Deploy automático (2-5 min)
4. **Verificar**: Estado "Live" 🟢

### 4️⃣ Probar aplicación
1. **URL**: https://tvar-fleet-management.onrender.com
2. **Login**: admin / admin123
3. **Probar**: Hacer clic en íconos 📄 📷
4. **Verificar**: Modal se abre correctamente

---

## 🔧 Comandos de terminal (si prefieres línea de comandos)

### Opción A: Si ya tienes Git configurado
```bash
# Detener servidor
Ctrl+C

# Agregar cambios
git add .

# Hacer commit
git commit -m "Agregar enlaces clickeables y modal de visualización"

# Subir a GitHub
git push origin main
```

### Opción B: Si necesitas configurar Git
```bash
# Configurar Git (solo la primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"

# Inicializar repositorio (solo si no existe)
git init
git remote add origin https://github.com/tu-usuario/tvar-fleet-management.git

# Subir cambios
git add .
git commit -m "Agregar enlaces clickeables y modal de visualización"
git push -u origin main
```

---

## ✅ Checklist rápido

**Antes de subir:**
- [ ] Servidor local funciona (http://localhost:3000)
- [ ] Íconos son clickeables
- [ ] Modal se abre y cierra
- [ ] No hay errores en consola

**Después de subir:**
- [ ] GitHub Desktop muestra "Last fetched now"
- [ ] Render muestra "Deploy in progress" → "Live"
- [ ] Aplicación funciona en URL de Render
- [ ] Nuevas funcionalidades operan correctamente

---

## 🆘 Solución rápida de problemas

**Si GitHub Desktop no detecta cambios:**
```bash
# Verificar que los archivos se guardaron
# Cerrar y reabrir GitHub Desktop
```

**Si Render no despliega automáticamente:**
1. Ve a tu servicio en Render
2. Haz clic en "Manual Deploy" → "Deploy latest commit"

**Si la aplicación no carga:**
1. Espera 30-60 segundos
2. Refresca la página (F5)
3. Verifica logs en Render

**Si el modal no funciona:**
1. Abre DevTools (F12)
2. Ve a Console
3. Busca errores en rojo
4. Verifica que la función viewInvoice() existe

---

## 🎯 URLs importantes

- **Tu aplicación**: https://tvar-fleet-management.onrender.com
- **GitHub**: https://github.com/tu-usuario/tvar-fleet-management
- **Render Dashboard**: https://dashboard.render.com
- **Servidor local**: http://localhost:3000

---

## ⏱️ Tiempos estimados

- **Subir a GitHub**: 1-2 minutos
- **Deploy en Render**: 2-5 minutos
- **Verificación**: 1-2 minutos
- **Total**: 5-10 minutos

¡Listo! Tu aplicación estará actualizada y funcionando en línea. 🚀