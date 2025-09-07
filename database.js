// Sistema de Base de Datos Local para TVAR Fleet Manager
class DatabaseManager {
    constructor() {
        this.initializeDatabase();
    }

    // Inicializar estructura de base de datos
    initializeDatabase() {
        const tables = {
            users: [],
            drivers: [],
            trucks: [],
            operations: [],
            repairs: [],
            fuel: [],
            adblue: [],
            oil: [],
            alerts: [],
            settings: {
                oilChangeKm: 8000,
                alertDaysBefore: [15, 5],
                currency: 'CLP'
            }
        };

        // Inicializar tablas si no existen
        Object.keys(tables).forEach(table => {
            if (!localStorage.getItem(table)) {
                localStorage.setItem(table, JSON.stringify(tables[table]));
            }
        });

        // Crear usuario administrador por defecto
        this.createDefaultAdmin();
    }

    createDefaultAdmin() {
        const users = this.getAll('users');
        if (users.length === 0) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    role: 'administrador',
                    name: 'Administrador Principal',
                    email: 'admin@tvar.com',
                    createdAt: new Date().toISOString(),
                    active: true
                },
                {
                    id: 2,
                    username: 'consulta',
                    password: 'consulta123',
                    role: 'consulta',
                    name: 'Usuario Consulta',
                    email: 'consulta@tvar.com',
                    createdAt: new Date().toISOString(),
                    active: true
                }
            ];
            this.saveAll('users', defaultUsers);
        }
    }

    // Métodos CRUD genéricos
    getAll(table) {
        try {
            return JSON.parse(localStorage.getItem(table) || '[]');
        } catch (error) {
            console.error(`Error al obtener datos de ${table}:`, error);
            return [];
        }
    }

    getById(table, id) {
        const items = this.getAll(table);
        return items.find(item => item.id === id);
    }

    save(table, item) {
        const items = this.getAll(table);
        
        if (item.id) {
            // Actualizar existente
            const index = items.findIndex(i => i.id === item.id);
            if (index !== -1) {
                items[index] = { ...items[index], ...item, updatedAt: new Date().toISOString() };
            }
        } else {
            // Crear nuevo
            item.id = this.generateId();
            item.createdAt = new Date().toISOString();
            items.push(item);
        }
        
        this.saveAll(table, items);
        return item;
    }

    delete(table, id) {
        const items = this.getAll(table);
        const filteredItems = items.filter(item => item.id !== id);
        this.saveAll(table, filteredItems);
        return true;
    }

    saveAll(table, items) {
        try {
            localStorage.setItem(table, JSON.stringify(items));
            return true;
        } catch (error) {
            console.error(`Error al guardar datos en ${table}:`, error);
            return false;
        }
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Métodos específicos para consultas complejas
    getOperationsByTruck(truckId, startDate = null, endDate = null) {
        const operations = this.getAll('operations');
        let filtered = operations.filter(op => op.truckId === truckId);
        
        if (startDate) {
            filtered = filtered.filter(op => op.month >= startDate);
        }
        
        if (endDate) {
            filtered = filtered.filter(op => op.month <= endDate);
        }
        
        return filtered.sort((a, b) => a.month.localeCompare(b.month));
    }

    getMaintenanceByTruck(truckId, type = null) {
        const tables = ['repairs', 'fuel', 'adblue', 'oil'];
        let maintenance = [];
        
        tables.forEach(table => {
            if (!type || type === table) {
                const items = this.getAll(table)
                    .filter(item => item.truckId === truckId)
                    .map(item => ({ ...item, type: table }));
                maintenance = maintenance.concat(items);
            }
        });
        
        return maintenance.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    calculateMonthlyKm(truckId, month) {
        const operations = this.getOperationsByTruck(truckId);
        const currentOp = operations.find(op => op.month === month);
        
        if (!currentOp) return 0;
        
        const previousOp = operations
            .filter(op => op.month < month)
            .sort((a, b) => b.month.localeCompare(a.month))[0];
        
        return currentOp.finalKm - (previousOp ? previousOp.finalKm : 0);
    }

    getTotalCostsByTruck(truckId, startDate = null, endDate = null) {
        const maintenance = this.getMaintenanceByTruck(truckId);
        let filtered = maintenance;
        
        if (startDate || endDate) {
            filtered = maintenance.filter(item => {
                const itemDate = new Date(item.date);
                const start = startDate ? new Date(startDate) : new Date('1900-01-01');
                const end = endDate ? new Date(endDate) : new Date();
                return itemDate >= start && itemDate <= end;
            });
        }
        
        return {
            repairs: filtered.filter(item => item.type === 'repairs').reduce((sum, item) => sum + (item.cost || 0), 0),
            fuel: filtered.filter(item => item.type === 'fuel').reduce((sum, item) => sum + (item.cost || 0), 0),
            adblue: filtered.filter(item => item.type === 'adblue').reduce((sum, item) => sum + (item.cost || 0), 0),
            oil: filtered.filter(item => item.type === 'oil').reduce((sum, item) => sum + (item.cost || 0), 0)
        };
    }

    // Backup y restauración
    exportData() {
        const data = {
            users: this.getAll('users'),
            drivers: this.getAll('drivers'),
            trucks: this.getAll('trucks'),
            operations: this.getAll('operations'),
            repairs: this.getAll('repairs'),
            fuel: this.getAll('fuel'),
            adblue: this.getAll('adblue'),
            oil: this.getAll('oil'),
            alerts: this.getAll('alerts'),
            settings: this.getAll('settings'),
            exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            Object.keys(data).forEach(table => {
                if (table !== 'exportDate') {
                    this.saveAll(table, data[table]);
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    }

    // Limpiar datos antiguos
    cleanOldData(daysOld = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const tables = ['repairs', 'fuel', 'adblue', 'oil'];
        
        tables.forEach(table => {
            const items = this.getAll(table);
            const filtered = items.filter(item => new Date(item.date) >= cutoffDate);
            this.saveAll(table, filtered);
        });
    }
}

// Función para extender FleetManager con funcionalidades de base de datos
function createExtendedFleetManager() {
    // Esperar a que FleetManager esté disponible
    if (typeof FleetManager === 'undefined') {
        console.error('FleetManager no está definido');
        return null;
    }
    
    class FleetManagerExtended extends FleetManager {
        constructor() {
            super();
            this.db = new DatabaseManager();
        }

        // Implementaciones completas de combustible, AdBlue y aceite
        loadFuel() {
        const fuel = this.db.getAll('fuel');
        const trucks = this.db.getAll('trucks');
        const tbody = document.querySelector('#fuelTable tbody');
        
        tbody.innerHTML = fuel.map(fuelRecord => {
            const truck = trucks.find(t => t.id === fuelRecord.truckId);
            return `
                <tr>
                    <td>${new Date(fuelRecord.date).toLocaleDateString()}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>${fuelRecord.liters?.toLocaleString() || 0} L</td>
                    <td>$${fuelRecord.cost?.toLocaleString() || 0}</td>
                    <td>${fuelRecord.km?.toLocaleString() || 0} km</td>
                    <td>${fuelRecord.invoice ? '<a href="#" onclick="fleetManager.viewInvoice(\'fuel\', ' + fuelRecord.id + ')" style="color: #28a745; text-decoration: none;"><i class="fas fa-image text-success"></i></a>' : '<i class="fas fa-times text-danger"></i>'}</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editFuel(${fuelRecord.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteFuel(${fuelRecord.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

        showFuelModal(fuelId = null) {
        const fuelRecord = fuelId ? this.db.getById('fuel', fuelId) : null;
        const trucks = this.db.getAll('trucks');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-gas-pump"></i> ${fuelRecord ? 'Editar' : 'Registrar'} Combustible</h2>
                    <form id="fuelForm">
                        <div class="form-group">
                            <label for="fuelDate">Fecha:</label>
                            <input type="date" id="fuelDate" value="${fuelRecord?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelTruck">Camión:</label>
                            <select id="fuelTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${fuelRecord?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="fuelLiters">Litros de Combustible:</label>
                            <input type="number" step="0.01" id="fuelLiters" value="${fuelRecord?.liters || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelCost">Costo Total (CLP):</label>
                            <input type="number" id="fuelCost" value="${fuelRecord?.cost || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelKm">Kilometraje:</label>
                            <input type="number" id="fuelKm" value="${fuelRecord?.km || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelInvoice">Adjuntar Factura:</label>
                            <input type="file" id="fuelInvoice" accept="image/*">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${fuelRecord ? 'Actualizar' : 'Registrar'} Combustible</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
        
        document.getElementById('fuelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFuel(fuelId);
        });
    }

        saveFuel(fuelId = null) {
        const fuelData = {
            id: fuelId,
            date: document.getElementById('fuelDate').value,
            truckId: document.getElementById('fuelTruck').value,
            liters: parseFloat(document.getElementById('fuelLiters').value),
            cost: parseInt(document.getElementById('fuelCost').value),
            km: parseInt(document.getElementById('fuelKm').value),
            invoice: document.getElementById('fuelInvoice').files.length > 0
        };
        
        this.db.save('fuel', fuelData);
        this.closeModal();
        this.loadFuel();
    }

        editFuel(fuelId) {
        this.showFuelModal(fuelId);
    }

        deleteFuel(fuelId) {
        if (confirm('¿Está seguro de eliminar este registro de combustible?')) {
            this.db.delete('fuel', fuelId);
            this.loadFuel();
        }
    }

        // AdBlue
        loadAdBlue() {
        const adblue = this.db.getAll('adblue');
        const trucks = this.db.getAll('trucks');
        const tbody = document.querySelector('#adblueTable tbody');
        
        tbody.innerHTML = adblue.map(adblueRecord => {
            const truck = trucks.find(t => t.id === adblueRecord.truckId);
            return `
                <tr>
                    <td>${new Date(adblueRecord.date).toLocaleDateString()}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>${adblueRecord.liters?.toLocaleString() || 0} L</td>
                    <td>$${adblueRecord.cost?.toLocaleString() || 0}</td>
                    <td>${adblueRecord.km?.toLocaleString() || 0} km</td>
                    <td>${adblueRecord.invoice ? '<a href="#" onclick="fleetManager.viewInvoice(\'adblue\', ' + adblueRecord.id + ')" style="color: #28a745; text-decoration: none;"><i class="fas fa-image text-success"></i></a>' : '<i class="fas fa-times text-danger"></i>'}</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editAdBlue(${adblueRecord.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteAdBlue(${adblueRecord.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

        showAdBlueModal(adblueId = null) {
        const adblueRecord = adblueId ? this.db.getById('adblue', adblueId) : null;
        const trucks = this.db.getAll('trucks');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-tint"></i> ${adblueRecord ? 'Editar' : 'Registrar'} AdBlue</h2>
                    <form id="adblueForm">
                        <div class="form-group">
                            <label for="adblueDate">Fecha:</label>
                            <input type="date" id="adblueDate" value="${adblueRecord?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="adblueTruck">Camión:</label>
                            <select id="adblueTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${adblueRecord?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="adblueLiters">Litros de AdBlue:</label>
                            <input type="number" step="0.01" id="adblueLiters" value="${adblueRecord?.liters || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="adblueCost">Costo (CLP):</label>
                            <input type="number" id="adblueCost" value="${adblueRecord?.cost || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="adblueKm">Kilometraje:</label>
                            <input type="number" id="adblueKm" value="${adblueRecord?.km || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="adblueInvoice">Adjuntar Factura:</label>
                            <input type="file" id="adblueInvoice" accept="image/*">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${adblueRecord ? 'Actualizar' : 'Registrar'} AdBlue</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
        
        document.getElementById('adblueForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAdBlue(adblueId);
        });
    }

        saveAdBlue(adblueId = null) {
        const adblueData = {
            id: adblueId,
            date: document.getElementById('adblueDate').value,
            truckId: document.getElementById('adblueTruck').value,
            liters: parseFloat(document.getElementById('adblueLiters').value),
            cost: parseInt(document.getElementById('adblueCost').value),
            km: parseInt(document.getElementById('adblueKm').value),
            invoice: document.getElementById('adblueInvoice').files.length > 0
        };
        
        this.db.save('adblue', adblueData);
        this.closeModal();
        this.loadAdBlue();
    }

        editAdBlue(adblueId) {
        this.showAdBlueModal(adblueId);
    }

        deleteAdBlue(adblueId) {
        if (confirm('¿Está seguro de eliminar este registro de AdBlue?')) {
            this.db.delete('adblue', adblueId);
            this.loadAdBlue();
        }
    }

        // Aceite
        loadOil() {
        const oil = this.db.getAll('oil');
        const trucks = this.db.getAll('trucks');
        const tbody = document.querySelector('#oilTable tbody');
        
        tbody.innerHTML = oil.map(oilRecord => {
            const truck = trucks.find(t => t.id === oilRecord.truckId);
            return `
                <tr>
                    <td>${new Date(oilRecord.date).toLocaleDateString()}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>$${oilRecord.cost?.toLocaleString() || 0}</td>
                    <td>${oilRecord.observations || 'N/A'}</td>
                    <td>${oilRecord.invoice ? '<a href="#" onclick="fleetManager.viewInvoice(\'oil\', ' + oilRecord.id + ')" style="color: #28a745; text-decoration: none;"><i class="fas fa-image text-success"></i></a>' : '<i class="fas fa-times text-danger"></i>'}</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editOil(${oilRecord.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteOil(${oilRecord.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

        showOilModal(oilId = null) {
        const oilRecord = oilId ? this.db.getById('oil', oilId) : null;
        const trucks = this.db.getAll('trucks');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-oil-can"></i> ${oilRecord ? 'Editar' : 'Registrar'} Cambio de Aceite</h2>
                    <form id="oilForm">
                        <div class="form-group">
                            <label for="oilDate">Fecha:</label>
                            <input type="date" id="oilDate" value="${oilRecord?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="oilTruck">Camión:</label>
                            <select id="oilTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${oilRecord?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="oilCost">Costo (CLP):</label>
                            <input type="number" id="oilCost" value="${oilRecord?.cost || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="oilKm">Kilometraje:</label>
                            <input type="number" id="oilKm" value="${oilRecord?.km || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="oilObservations">Observaciones:</label>
                            <textarea id="oilObservations" rows="3">${oilRecord?.observations || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="oilInvoice">Adjuntar Factura:</label>
                            <input type="file" id="oilInvoice" accept="image/*">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${oilRecord ? 'Actualizar' : 'Registrar'} Cambio de Aceite</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
        
        document.getElementById('oilForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOil(oilId);
        });
    }

        saveOil(oilId = null) {
        const oilData = {
            id: oilId,
            date: document.getElementById('oilDate').value,
            truckId: document.getElementById('oilTruck').value,
            cost: parseInt(document.getElementById('oilCost').value),
            km: parseInt(document.getElementById('oilKm').value),
            observations: document.getElementById('oilObservations').value,
            invoice: document.getElementById('oilInvoice').files.length > 0
        };
        
        this.db.save('oil', oilData);
        this.closeModal();
        this.loadOil();
    }

        editOil(oilId) {
        this.showOilModal(oilId);
    }

        deleteOil(oilId) {
        if (confirm('¿Está seguro de eliminar este registro de cambio de aceite?')) {
            this.db.delete('oil', oilId);
            this.loadOil();
        }
    }

        // Funciones de utilidad para exportar/importar datos
        exportAllData() {
        const data = this.db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tvar_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

        importAllData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const success = this.db.importData(e.target.result);
            if (success) {
                alert('Datos importados exitosamente');
                location.reload();
            } else {
                alert('Error al importar datos');
            }
        };
        reader.readAsText(file);
    }
    
    } // Cierre de la clase FleetManagerExtended
    
    return FleetManagerExtended;
}

// Reemplazar la instancia global
if (typeof window !== 'undefined') {
    window.createExtendedFleetManager = createExtendedFleetManager;
    window.DatabaseManager = DatabaseManager;
}