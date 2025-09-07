// Adaptador de base de datos para producción
class DatabaseAdapter {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.apiBase = this.isProduction ? '' : 'http://localhost:3000';
    }

    // Obtener datos de una colección
    async getItem(key) {
        if (!this.isProduction) {
            // Usar localStorage en desarrollo
            return localStorage.getItem(key);
        }

        try {
            const response = await fetch(`${this.apiBase}/api/data/${key}`);
            if (response.ok) {
                const data = await response.json();
                return JSON.stringify(data);
            }
            return null;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    // Guardar datos en una colección
    async setItem(key, value) {
        if (!this.isProduction) {
            // Usar localStorage en desarrollo
            localStorage.setItem(key, value);
            return;
        }

        try {
            const data = JSON.parse(value);
            const response = await fetch(`${this.apiBase}/api/data/${key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save data');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    // Eliminar datos (opcional)
    async removeItem(key) {
        if (!this.isProduction) {
            localStorage.removeItem(key);
            return;
        }

        try {
            await this.setItem(key, '[]');
        } catch (error) {
            console.error('Error removing data:', error);
        }
    }
}

// Crear instancia global
window.dbAdapter = new DatabaseAdapter();

// Función helper para migrar localStorage a API
window.migrateToAPI = async function() {
    if (window.dbAdapter.isProduction) {
        console.log('🔄 Migrando datos a API...');
        
        const collections = ['users', 'trucks', 'drivers', 'operations', 'repairs', 'fuel', 'adblue', 'oil', 'documents'];
        
        for (const collection of collections) {
            const localData = localStorage.getItem(collection);
            if (localData) {
                try {
                    await window.dbAdapter.setItem(collection, localData);
                    console.log(`✅ ${collection} migrado exitosamente`);
                } catch (error) {
                    console.error(`❌ Error migrando ${collection}:`, error);
                }
            }
        }
        
        console.log('✨ Migración completada');
    }
};

// Función helper para obtener datos con fallback
window.getStorageData = async function(key, defaultValue = '[]') {
    try {
        const data = await window.dbAdapter.getItem(key);
        return data || defaultValue;
    } catch (error) {
        console.error(`Error getting ${key}:`, error);
        return defaultValue;
    }
};

// Función helper para guardar datos
window.setStorageData = async function(key, value) {
    try {
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        await window.dbAdapter.setItem(key, jsonValue);
    } catch (error) {
        console.error(`Error setting ${key}:`, error);
        throw error;
    }
};