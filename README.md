# TVAR Fleet Management System

Sistema de gestión de flota de reparto desarrollado para TVAR.

## 🚀 Despliegue en Render.com

### Prerrequisitos
1. Cuenta en [Render.com](https://render.com)
2. Repositorio de GitHub con el código

### Pasos para el despliegue

1. **Subir código a GitHub**
   - Crear un repositorio en GitHub
   - Subir todos los archivos del proyecto

2. **Crear Web Service en Render**
   - Ir a [Render Dashboard](https://dashboard.render.com)
   - Hacer clic en "New +" → "Web Service"
   - Conectar con GitHub y seleccionar el repositorio

3. **Configuración del servicio**
   ```
   Name: tvar-fleet-management
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Variables de entorno (opcional)**
   ```
   NODE_ENV=production
   PORT=10000
   ```

5. **Hacer deploy**
   - Hacer clic en "Create Web Service"
   - Esperar a que termine el build y deployment

### 📊 Base de datos

La aplicación utiliza:
- **Desarrollo**: localStorage del navegador
- **Producción**: Archivo JSON persistente en el servidor

Los datos se migran automáticamente cuando se accede desde producción.

### 🔐 Usuarios por defecto

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Consulta:**
- Usuario: `consulta`
- Contraseña: `consulta123`

### 🛠️ Desarrollo local

```bash
# Instalar dependencias
npm install

# Ejecutar servidor
npm start

# La aplicación estará disponible en http://localhost:3000
```

### 📁 Estructura del proyecto

```
├── index.html          # Página principal
├── app.js             # Lógica de la aplicación
├── styles.css         # Estilos CSS
├── database.js        # Gestión de datos
├── db-adapter.js      # Adaptador para producción
├── server.js          # Servidor Node.js
├── package.json       # Dependencias
└── README.md          # Este archivo
```

### 🔧 Características

- ✅ Gestión de usuarios y roles
- ✅ Administración de flota (camiones y conductores)
- ✅ Registro de operaciones mensuales
- ✅ Control de mantenimiento y gastos
- ✅ Sistema de alertas automáticas
- ✅ Documentación y reportes
- ✅ Interfaz responsive
- ✅ Base de datos persistente

### 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**TVAR Fleet Management System** - Desarrollado con ❤️ para optimizar la gestión de flotas de reparto.