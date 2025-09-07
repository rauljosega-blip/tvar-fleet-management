// Aplicación de Gestión de Flota TVAR
class FleetManager {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        await this.initializeData();
        this.setupEventListeners();
        this.checkAuthentication();
        this.loadDashboard();
    }

    // Inicializar datos por defecto
    async initializeData() {
        // Usar el adaptador de base de datos
        this.dbAdapter = window.dbAdapter;
        
        const usersData = await this.dbAdapter.getItem('users');
        if (!usersData || usersData === '[]') {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                password: 'admin123',
                role: 'administrador',
                name: 'Administrador Principal',
                    createdAt: new Date().toISOString(),
                    active: true
                },
                {
                    id: 2,
                    username: 'consulta',
                password: 'consulta123',
                role: 'consulta',
                name: 'Usuario Consulta',
                    createdAt: new Date().toISOString(),
                    active: true
                }
            ];
            await this.dbAdapter.setItem('users', JSON.stringify(defaultUsers));
        }

        // Inicializar otras estructuras de datos
        const collections = ['drivers', 'trucks', 'operations', 'repairs', 'fuel', 'adblue', 'oil', 'documents'];
        for (const collection of collections) {
            const data = await this.dbAdapter.getItem(collection);
            if (!data || data === 'null') {
                await this.dbAdapter.setItem(collection, JSON.stringify([]));
            }
        }
        if (!localStorage.getItem('fuel')) {
            localStorage.setItem('fuel', JSON.stringify([]));
        }
        if (!localStorage.getItem('adblue')) {
            localStorage.setItem('adblue', JSON.stringify([]));
        }
        if (!localStorage.getItem('oil')) {
            localStorage.setItem('oil', JSON.stringify([]));
        }
        if (!localStorage.getItem('alerts')) {
            localStorage.setItem('alerts', JSON.stringify([]));
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                await this.showSection(section);
            });
        });

        // Login/Logout
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab, e.target.closest('.content-section'));
            });
        });

        // Botones principales
        this.setupMainButtons();
    }

    setupMainButtons() {
        // Usuarios
        document.getElementById('addUserBtn')?.addEventListener('click', () => {
            this.showUserModal();
        });

        // Flota
        document.getElementById('addDriverBtn')?.addEventListener('click', () => {
            this.showDriverModal();
        });

        document.getElementById('addTruckBtn')?.addEventListener('click', async () => {
            await this.showTruckModal();
        });

        // Operaciones
        document.getElementById('addOperationBtn')?.addEventListener('click', () => {
            this.showOperationModal();
        });

        // Mantenimiento
        document.getElementById('addRepairBtn')?.addEventListener('click', () => {
            this.showRepairModal();
        });

        document.getElementById('addFuelBtn')?.addEventListener('click', () => {
            this.showFuelModal();
        });

        document.getElementById('addAdBlueBtn')?.addEventListener('click', () => {
            this.showAdBlueModal();
        });

        document.getElementById('addOilBtn')?.addEventListener('click', () => {
            this.showOilModal();
        });

        // Informes
        document.getElementById('reportType')?.addEventListener('change', (e) => {
            this.toggleTechnicalReviewFilters(e.target.value);
        });
        
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateReport();
        });
    }

    // Autenticación
    checkAuthentication() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUserInterface();
        } else {
            this.showLoginModal();
        }
    }

    handleLogin() {
        const usernameElement = document.getElementById('username');
        const passwordElement = document.getElementById('password');
        
        if (!usernameElement || !passwordElement) {
            console.error('Elementos de login no encontrados');
            return;
        }
        
        const username = usernameElement.value;
        const password = passwordElement.value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password && u.active);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUserInterface();
            this.hideLoginModal();
            this.loadDashboard();
        } else {
            alert('Usuario o contraseña incorrectos');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLoginModal();
    }

    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('active');
        }
    }

    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        const loginForm = document.getElementById('loginForm');
        
        if (loginModal) {
            loginModal.classList.remove('active');
        }
        if (loginForm) {
            loginForm.reset();
        }
    }

    updateUserInterface() {
        if (this.currentUser) {
            const currentUserElement = document.getElementById('currentUser');
            if (currentUserElement) {
                currentUserElement.textContent = `Usuario: ${this.currentUser.name}`;
            }
            
            // Mostrar/ocultar opción de usuarios según rol
            const usuariosNav = document.getElementById('usuarios-nav');
            if (usuariosNav) {
                if (this.currentUser.role === 'administrador') {
                    usuariosNav.style.display = 'block';
                } else {
                    usuariosNav.style.display = 'none';
                }
            }
            
            // Ocultar botones según permisos
            if (this.currentUser.role === 'consulta') {
                document.querySelectorAll('.btn-primary, .btn-edit, .btn-delete').forEach(btn => {
                    btn.style.display = 'none';
                });
            }
        }
    }

    // Navegación
    async showSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar sección seleccionada
        document.getElementById(sectionName).classList.add('active');
        
        // Actualizar navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Cargar datos de la sección
        await this.loadSectionData(sectionName);
    }

    switchTab(tabName, section) {
        const tabButtons = section.querySelectorAll('.tab-button');
        const tabContents = section.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        section.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        section.querySelector(`#${tabName}`).classList.add('active');
    }

    // Cargar datos de secciones
    async loadSectionData(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'usuarios':
                this.loadUsers();
                break;
            case 'flota':
                await this.loadFleet();
                break;
            case 'operaciones':
                this.loadOperations();
                break;
            case 'mantenimiento':
                this.loadMaintenance();
                break;
            case 'documentos':
                this.loadDocuments();
                break;
            case 'informes':
                this.loadReports();
                break;
        }
    }

    // Dashboard
    loadDashboard() {
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
        const alerts = this.generateAlerts();
        const operations = JSON.parse(localStorage.getItem('operations') || '[]');
        
        // Actualizar estadísticas
        document.getElementById('totalTrucks').textContent = trucks.length;
        document.getElementById('totalDrivers').textContent = drivers.length;
        document.getElementById('totalAlerts').textContent = alerts.length;
        
        // Calcular km del mes actual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyOperations = operations.filter(op => {
            const opDate = new Date(op.month + '-01');
            return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
        });
        
        const totalKm = monthlyOperations.reduce((sum, op) => sum + (op.monthlyKm || 0), 0);
        document.getElementById('monthlyKm').textContent = totalKm.toLocaleString();
        
        // Mostrar alertas recientes
        this.displayAlerts(alerts.slice(0, 5));
    }

    generateAlerts() {
        const alerts = [];
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const documents = JSON.parse(localStorage.getItem('truckDocuments') || '[]');
        const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
        const fuel = JSON.parse(localStorage.getItem('fuel') || '[]');
        const oil = JSON.parse(localStorage.getItem('oil') || '[]');
        const operations = JSON.parse(localStorage.getItem('operations') || '[]');
        const today = new Date();
        
        trucks.forEach(truck => {
            // Alertas de documentos del sistema de gestión
            const truckDocuments = documents.filter(doc => doc.truckId === truck.id);
            truckDocuments.forEach(doc => {
                const expiryDate = new Date(doc.expiryDate);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry < 0) {
                    alerts.push({
                        type: 'danger',
                        category: 'documento',
                        truck: truck.number,
                        message: `${doc.type} del camión ${truck.number} VENCIDO hace ${Math.abs(daysUntilExpiry)} días`,
                        priority: 'critical',
                        documentId: doc.id
                    });
                } else if (daysUntilExpiry <= 5) {
                    alerts.push({
                        type: 'danger',
                        category: 'documento',
                        truck: truck.number,
                        message: `${doc.type} del camión ${truck.number} vence en ${daysUntilExpiry} días`,
                        priority: 'high',
                        documentId: doc.id
                    });
                } else if (daysUntilExpiry <= 15) {
                    alerts.push({
                        type: 'warning',
                        category: 'documento',
                        truck: truck.number,
                        message: `${doc.type} del camión ${truck.number} vence en ${daysUntilExpiry} días`,
                        priority: 'medium',
                        documentId: doc.id
                    });
                }
            });
            
            // Alertas de documentos básicos del camión (fallback)
            if (truck.revisionTecnica) {
                const revisionDate = new Date(truck.revisionTecnica);
                const daysUntilExpiry = Math.ceil((revisionDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry <= 15 && daysUntilExpiry >= 0) {
                    alerts.push({
                        type: daysUntilExpiry <= 5 ? 'danger' : 'warning',
                        message: `Revisión Técnica del camión ${truck.number} vence en ${daysUntilExpiry} días`,
                        truck: truck.number,
                        category: 'documento',
                        priority: daysUntilExpiry <= 5 ? 'high' : 'medium'
                    });
                } else if (daysUntilExpiry < 0) {
                    alerts.push({
                        type: 'danger',
                        message: `Revisión Técnica del camión ${truck.number} VENCIDA hace ${Math.abs(daysUntilExpiry)} días`,
                        truck: truck.number,
                        category: 'documento',
                        priority: 'critical'
                    });
                }
            }
            
            if (truck.seguroObligatorio) {
                const seguroDate = new Date(truck.seguroObligatorio);
                const daysUntilExpiry = Math.ceil((seguroDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry <= 15 && daysUntilExpiry >= 0) {
                    alerts.push({
                        type: daysUntilExpiry <= 5 ? 'danger' : 'warning',
                        message: `Seguro Obligatorio del camión ${truck.number} vence en ${daysUntilExpiry} días`,
                        truck: truck.number,
                        category: 'documento',
                        priority: daysUntilExpiry <= 5 ? 'high' : 'medium'
                    });
                } else if (daysUntilExpiry < 0) {
                    alerts.push({
                        type: 'danger',
                        message: `Seguro Obligatorio del camión ${truck.number} VENCIDO hace ${Math.abs(daysUntilExpiry)} días`,
                        truck: truck.number,
                        category: 'documento',
                        priority: 'critical'
                    });
                }
            }
            
            // Alertas de reparaciones pendientes
            const pendingRepairs = repairs.filter(repair => 
                repair.truckId === truck.id && repair.status === 'Pendiente'
            );
            
            if (pendingRepairs.length > 0) {
                alerts.push({
                    type: pendingRepairs.length > 2 ? 'danger' : 'warning',
                    category: 'reparacion',
                    truck: truck.number,
                    message: `Camión ${truck.number}: ${pendingRepairs.length} reparación(es) pendiente(s)`,
                    priority: pendingRepairs.length > 2 ? 'high' : 'medium'
                });
            }
            
            // Alertas de mantenimiento por kilometraje y tiempo
            const lastOilChange = oil.filter(o => o.truckId === truck.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            const currentOperation = operations.filter(op => op.truckId === truck.id).sort((a, b) => new Date(b.month) - new Date(a.month))[0];
            
            if (lastOilChange) {
                const now = new Date();
                const oilChangeDate = new Date(lastOilChange.date);
                const monthsSinceOilChange = (now.getFullYear() - oilChangeDate.getFullYear()) * 12 + (now.getMonth() - oilChangeDate.getMonth());
                
                let kmSinceOilChange = 0;
                if (currentOperation) {
                    kmSinceOilChange = (currentOperation.finalKm || 0) - (lastOilChange.km || 0);
                }
                
                // Verificar si necesita cambio por tiempo (6 meses) o kilometraje (10,000 km)
                const needsChangeByTime = monthsSinceOilChange >= 6;
                const needsChangeByKm = kmSinceOilChange >= 10000;
                const approachingChangeByTime = monthsSinceOilChange >= 5;
                const approachingChangeByKm = kmSinceOilChange >= 8000;
                
                if (needsChangeByTime || needsChangeByKm) {
                    let reason = '';
                    if (needsChangeByTime && needsChangeByKm) {
                        reason = `${monthsSinceOilChange} meses y ${kmSinceOilChange.toLocaleString()} km`;
                    } else if (needsChangeByTime) {
                        reason = `${monthsSinceOilChange} meses`;
                    } else {
                        reason = `${kmSinceOilChange.toLocaleString()} km`;
                    }
                    
                    alerts.push({
                        type: 'danger',
                        message: `Camión ${truck.number} necesita cambio de aceite URGENTE (${reason} desde último cambio)`,
                        truck: truck.number,
                        category: 'mantenimiento',
                        priority: 'high'
                    });
                } else if (approachingChangeByTime || approachingChangeByKm) {
                    let reason = '';
                    if (approachingChangeByTime && approachingChangeByKm) {
                        reason = `${monthsSinceOilChange} meses y ${kmSinceOilChange.toLocaleString()} km`;
                    } else if (approachingChangeByTime) {
                        reason = `${monthsSinceOilChange} meses`;
                    } else {
                        reason = `${kmSinceOilChange.toLocaleString()} km`;
                    }
                    
                    alerts.push({
                        type: 'warning',
                        message: `Camión ${truck.number} se acerca al cambio de aceite (${reason} desde último cambio)`,
                        truck: truck.number,
                        category: 'mantenimiento',
                        priority: 'medium'
                    });
                }
            } else {
                // Si no hay registro de cambio de aceite, mostrar alerta crítica
                alerts.push({
                    type: 'danger',
                    message: `Camión ${truck.number}: No hay registro de cambio de aceite - Revisar mantenimiento`,
                    truck: truck.number,
                    category: 'mantenimiento',
                    priority: 'critical'
                });
            }
            
            // Alertas de consumo de combustible anómalo
            const truckFuel = fuel.filter(f => f.truckId === truck.id).sort((a, b) => new Date(b.date) - new Date(a.date));
            if (truckFuel.length >= 3) {
                const recentFuel = truckFuel.slice(0, 3);
                const avgConsumption = recentFuel.reduce((sum, f) => sum + (f.liters || 0), 0) / 3;
                const lastConsumption = recentFuel[0].liters || 0;
                
                if (lastConsumption > avgConsumption * 1.4) {
                    alerts.push({
                        type: 'warning',
                        category: 'combustible',
                        truck: truck.number,
                        message: `Camión ${truck.number}: Consumo de combustible 40% superior al promedio`,
                        priority: 'medium'
                    });
                }
            }
            
            // Alertas de kilometraje alto
            if (truck.mileage && truck.mileage > 500000) {
                alerts.push({
                    type: 'info',
                    category: 'kilometraje',
                    truck: truck.number,
                    message: `Camión ${truck.number}: Alto kilometraje (${truck.mileage.toLocaleString()} km) - Considerar renovación`,
                    priority: 'low'
                });
            }
        });
        
        // Alertas de licencias de conducir
        const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
        drivers.forEach(driver => {
            if (driver.licenseExpiry) {
                const licenseDate = new Date(driver.licenseExpiry);
                const daysUntilExpiry = Math.ceil((licenseDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry < 0) {
                    alerts.push({
                        type: 'danger',
                        category: 'licencia',
                        driver: driver.name,
                        message: `Licencia de conducir de ${driver.name} VENCIDA hace ${Math.abs(daysUntilExpiry)} días`,
                        priority: 'critical',
                        driverId: driver.id
                    });
                } else if (daysUntilExpiry <= 7) {
                    alerts.push({
                        type: 'danger',
                        category: 'licencia',
                        driver: driver.name,
                        message: `Licencia de conducir de ${driver.name} vence en ${daysUntilExpiry} días`,
                        priority: 'high',
                        driverId: driver.id
                    });
                } else if (daysUntilExpiry <= 30) {
                    alerts.push({
                        type: 'warning',
                        category: 'licencia',
                        driver: driver.name,
                        message: `Licencia de conducir de ${driver.name} vence en ${daysUntilExpiry} días`,
                        priority: 'medium',
                        driverId: driver.id
                    });
                }
            }
        });
        
        // Ordenar alertas por prioridad
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        alerts.sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 3;
            const priorityB = priorityOrder[b.priority] || 3;
            return priorityA - priorityB;
        });
        
        return alerts;
    }

    displayAlerts(alerts) {
        const alertsList = document.getElementById('alertsList');
        
        if (alerts.length === 0) {
            alertsList.innerHTML = '<div class="alert-item success"><i class="fas fa-check-circle"></i> No hay alertas activas</div>';
            return;
        }
        
        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <i class="fas fa-${alert.type === 'danger' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                ${alert.message}
            </div>
        `).join('');
    }

    // Gestión de Usuarios
    loadUsers() {
        const users = this.db ? this.db.getAll('users') : JSON.parse(localStorage.getItem('users') || '[]');
        const tbody = document.querySelector('#usersTable tbody');
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${user.active ? 'active' : 'inactive'}">${user.active ? 'Activo' : 'Inactivo'}</span></td>
                <td class="action-buttons">
                    ${this.currentUser.role === 'administrador' ? `
                        <button class="btn-edit" onclick="fleetManager.editUser('${user.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="fleetManager.deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    showUserModal(userId = null) {
        const user = userId ? (this.db ? this.db.getById('users', userId) : JSON.parse(localStorage.getItem('users') || '[]').find(u => u.id === userId)) : null;
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-user"></i> ${user ? 'Editar' : 'Agregar'} Usuario</h2>
                    <form id="userForm">
                        <div class="form-group">
                            <label for="userUsername">Usuario:</label>
                            <input type="text" id="userUsername" value="${user?.username || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="userName">Nombre Completo:</label>
                            <input type="text" id="userName" value="${user?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="userEmail">Email:</label>
                            <input type="email" id="userEmail" value="${user?.email || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="userPassword">Contraseña:</label>
                            <input type="password" id="userPassword" ${user ? '' : 'required'}>
                            ${user ? '<small>Dejar en blanco para mantener la contraseña actual</small>' : ''}
                        </div>
                        <div class="form-group">
                            <label for="userRole">Rol:</label>
                            <select id="userRole" required>
                                <option value="administrador" ${user?.role === 'administrador' ? 'selected' : ''}>Administrador</option>
                                <option value="consulta" ${user?.role === 'consulta' ? 'selected' : ''}>Consulta</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="userActive" ${user?.active !== false ? 'checked' : ''}>
                                Usuario Activo
                            </label>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${user ? 'Actualizar' : 'Crear'} Usuario</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        if (!this.showModal(modalHTML)) return;
        
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUser(userId);
            });
        }
    }

    saveUser(userId = null) {
        const username = document.getElementById('userUsername').value;
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;
        const active = document.getElementById('userActive').checked;
        
        const userData = {
            id: userId,
            username,
            name,
            email,
            role,
            active
        };
        
        if (password) {
            userData.password = password;
        }
        
        if (this.db) {
            this.db.save('users', userData);
        } else {
            // Fallback para localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (userId) {
                const userIndex = users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    users[userIndex] = { ...users[userIndex], ...userData };
                }
            } else {
                userData.id = Date.now();
                userData.createdAt = new Date().toISOString();
                users.push(userData);
            }
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        this.closeModal();
        this.loadUsers();
    }

    editUser(userId) {
        this.showUserModal(userId);
    }

    deleteUser(userId) {
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            if (this.db) {
                this.db.delete('users', userId);
            } else {
                // Fallback para localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const filteredUsers = users.filter(u => u.id !== userId);
                localStorage.setItem('users', JSON.stringify(filteredUsers));
            }
            this.loadUsers();
        }
    }

    // Gestión de Flota
    async loadFleet() {
        await this.loadDrivers();
        await this.loadTrucks();
    }

    async loadDrivers() {
        const driversData = await this.dbAdapter.getItem('drivers');
        const trucksData = await this.dbAdapter.getItem('trucks');
        const drivers = JSON.parse(driversData || '[]');
        const trucks = JSON.parse(trucksData || '[]');
        const tbody = document.querySelector('#driversTable tbody');
        
        tbody.innerHTML = drivers.map(driver => {
            const assignedTruck = trucks.find(t => t.driverId === driver.id);
            const licenseExpiry = driver.licenseExpiry ? new Date(driver.licenseExpiry) : null;
            const isLicenseExpired = licenseExpiry && licenseExpiry < new Date();
            const isLicenseExpiringSoon = licenseExpiry && licenseExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            return `
                <tr>
                    <td>${driver.name}</td>
                    <td>${driver.rut}</td>
                    <td>${new Date(driver.hireDate).toLocaleDateString()}</td>
                    <td>${driver.licenseNumber || 'No registrado'}</td>
                    <td class="${isLicenseExpired ? 'expired' : isLicenseExpiringSoon ? 'expiring-soon' : ''}">
                        ${licenseExpiry ? licenseExpiry.toLocaleDateString() : 'No registrado'}
                        ${isLicenseExpired ? ' <span class="alert-badge">VENCIDA</span>' : ''}
                        ${isLicenseExpiringSoon && !isLicenseExpired ? ' <span class="warning-badge">PRÓXIMO A VENCER</span>' : ''}
                    </td>
                    <td>${assignedTruck ? `Camión ${assignedTruck.number}` : 'Sin asignar'}</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editDriver('${driver.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteDriver('${driver.id}')"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    async loadTrucks() {
        const trucks = await dbAdapter.getAll('trucks');
        const drivers = await dbAdapter.getAll('drivers');
        const tbody = document.querySelector('#trucksTable tbody');
        
        tbody.innerHTML = trucks.map(truck => {
            const driver = drivers.find(d => d.id === truck.driverId);
            return `
                <tr>
                    <td>${truck.number}</td>
                    <td>${truck.brand} ${truck.model}</td>
                    <td>${truck.year}</td>
                    <td>${truck.plate}</td>
                    <td>${truck.capacity} pallets</td>
                    <td><span class="status-badge status-active">${truck.deliveryMode}</span></td>
                    <td>${driver ? driver.name : 'Sin asignar'}</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editTruck('${truck.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteTruck('${truck.id}')"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    showDriverModal(driverId = null) {
        const driver = driverId ? (this.db ? this.db.getById('drivers', driverId) : JSON.parse(localStorage.getItem('drivers') || '[]').find(d => d.id === driverId)) : null;
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-user"></i> ${driver ? 'Editar' : 'Agregar'} Conductor</h2>
                    <form id="driverForm">
                        <div class="form-group">
                            <label for="driverName">Nombre Completo:</label>
                            <input type="text" id="driverName" value="${driver?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="driverRut">RUT:</label>
                            <input type="text" id="driverRut" value="${driver?.rut || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="driverHireDate">Fecha de Contratación:</label>
                            <input type="date" id="driverHireDate" value="${driver?.hireDate || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="driverLicense">Número de Licencia:</label>
                            <input type="text" id="driverLicense" value="${driver?.licenseNumber || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="driverLicenseExpiry">Vencimiento de Licencia:</label>
                            <input type="date" id="driverLicenseExpiry" value="${driver?.licenseExpiry || ''}" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${driver ? 'Actualizar' : 'Crear'} Conductor</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        if (!this.showModal(modalHTML)) return;
        
        const driverForm = document.getElementById('driverForm');
        if (driverForm) {
            driverForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDriver(driverId);
            });
        }
    }

    async saveDriver(driverId = null) {
        const name = document.getElementById('driverName').value;
        const rut = document.getElementById('driverRut').value;
        const hireDate = document.getElementById('driverHireDate').value;
        const licenseNumber = document.getElementById('driverLicense').value;
        const licenseExpiry = document.getElementById('driverLicenseExpiry').value;
        
        const driverData = {
            name,
            rut,
            hireDate,
            licenseNumber,
            licenseExpiry,
            updatedAt: new Date().toISOString()
        };
        
        if (driverId) {
            driverData.id = driverId;
        } else {
            driverData.id = Date.now().toString();
            driverData.createdAt = new Date().toISOString();
        }
        
        // Obtener conductores actuales
        const driversData = await this.dbAdapter.getItem('drivers');
        const drivers = JSON.parse(driversData || '[]');
        
        if (driverId) {
            const driverIndex = drivers.findIndex(d => d.id === driverId);
            if (driverIndex !== -1) {
                drivers[driverIndex] = driverData;
            }
        } else {
            drivers.push(driverData);
        }
        
        // Guardar en la base de datos
        await this.dbAdapter.setItem('drivers', JSON.stringify(drivers));
        
        this.closeModal();
        await this.loadDrivers();
    }

    editDriver(driverId) {
        this.showDriverModal(driverId);
    }

    deleteDriver(driverId) {
        if (confirm('¿Está seguro de eliminar este conductor?')) {
            if (this.db) {
                this.db.delete('drivers', driverId);
            } else {
                // Fallback a localStorage
                const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
                const filteredDrivers = drivers.filter(d => d.id !== driverId);
                localStorage.setItem('drivers', JSON.stringify(filteredDrivers));
            }
            this.loadDrivers();
        }
    }

    async showTruckModal(truckId = null) {
        const trucks = await dbAdapter.getAll('trucks');
        const truck = truckId ? trucks.find(t => t.id === truckId) : null;
        const drivers = await dbAdapter.getAll('drivers');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-truck"></i> ${truck ? 'Editar' : 'Agregar'} Camión</h2>
                    <form id="truckForm">
                        <div class="form-group">
                            <label for="truckNumber">Número de Camión:</label>
                            <input type="text" id="truckNumber" value="${truck?.number || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="truckBrand">Marca:</label>
                            <input type="text" id="truckBrand" value="${truck?.brand || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="truckModel">Modelo:</label>
                            <input type="text" id="truckModel" value="${truck?.model || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="truckYear">Año:</label>
                            <input type="number" id="truckYear" value="${truck?.year || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="truckPlate">Patente:</label>
                            <input type="text" id="truckPlate" value="${truck?.plate || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="truckCapacity">Capacidad (pallets):</label>
                            <input type="number" id="truckCapacity" value="${truck?.capacity || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="truckDeliveryMode">Modalidad de Entrega:</label>
                            <select id="truckDeliveryMode" required>
                                <option value="supermercado" ${truck?.deliveryMode === 'supermercado' ? 'selected' : ''}>Supermercado</option>
                                <option value="bds" ${truck?.deliveryMode === 'bds' ? 'selected' : ''}>BDS</option>
                                <option value="ruta tradicional" ${truck?.deliveryMode === 'ruta tradicional' ? 'selected' : ''}>Ruta Tradicional</option>
                                <option value="horeca" ${truck?.deliveryMode === 'horeca' ? 'selected' : ''}>Horeca</option>
                                <option value="reemplazo" ${truck?.deliveryMode === 'reemplazo' ? 'selected' : ''}>Reemplazo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="truckDriver">Conductor Asignado:</label>
                            <select id="truckDriver">
                                <option value="">Sin asignar</option>
                                ${drivers.map(driver => `
                                    <option value="${driver.id}" ${truck?.driverId === driver.id ? 'selected' : ''}>${driver.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="truckRevisionTecnica">Vencimiento Revisión Técnica:</label>
                            <input type="date" id="truckRevisionTecnica" value="${truck?.revisionTecnica || ''}">
                        </div>
                        <div class="form-group">
                            <label for="truckSeguroObligatorio">Vencimiento Seguro Obligatorio:</label>
                            <input type="date" id="truckSeguroObligatorio" value="${truck?.seguroObligatorio || ''}">
                        </div>
                        <div class="form-group">
                            <label for="truckImpuestosMunicipales">Vencimiento Impuestos Municipales:</label>
                            <input type="date" id="truckImpuestosMunicipales" value="${truck?.impuestosMunicipales || ''}">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${truck ? 'Actualizar' : 'Crear'} Camión</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
        
        document.getElementById('truckForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTruck(truckId);
        });
    }

    async saveTruck(truckId = null) {
        const number = document.getElementById('truckNumber').value;
        const brand = document.getElementById('truckBrand').value;
        const model = document.getElementById('truckModel').value;
        const year = parseInt(document.getElementById('truckYear').value);
        const plate = document.getElementById('truckPlate').value;
        const capacity = parseInt(document.getElementById('truckCapacity').value);
        const deliveryMode = document.getElementById('truckDeliveryMode').value;
        const driverId = document.getElementById('truckDriver').value || null;
        const revisionTecnica = document.getElementById('truckRevisionTecnica').value;
        const seguroObligatorio = document.getElementById('truckSeguroObligatorio').value;
        const impuestosMunicipales = document.getElementById('truckImpuestosMunicipales').value;
        
        const truckData = {
            number,
            brand,
            model,
            year,
            plate,
            capacity,
            deliveryMode,
            driverId,
            revisionTecnica,
            seguroObligatorio,
            impuestosMunicipales,
            updatedAt: new Date().toISOString()
        };
        
        if (truckId) {
            truckData.id = truckId;
        } else {
            truckData.id = Date.now().toString();
            truckData.createdAt = new Date().toISOString();
        }
        
        // Obtener camiones existentes usando dbAdapter
        const trucks = await dbAdapter.getAll('trucks');
        
        if (truckId) {
            const truckIndex = trucks.findIndex(t => t.id === truckId);
            if (truckIndex !== -1) {
                trucks[truckIndex] = truckData;
            }
        } else {
            trucks.push(truckData);
        }
        
        // Guardar usando dbAdapter
        await dbAdapter.saveAll('trucks', trucks);
        
        this.closeModal();
        await this.loadTrucks();
    }

    async editTruck(truckId) {
        await this.showTruckModal(truckId);
    }

    async deleteTruck(truckId) {
        if (confirm('¿Está seguro de eliminar este camión?')) {
            const trucks = await dbAdapter.getAll('trucks');
            const filteredTrucks = trucks.filter(t => t.id !== truckId);
            await dbAdapter.saveAll('trucks', filteredTrucks);
            await this.loadTrucks();
        }
    }

    // Operaciones
    loadOperations() {
        const operations = JSON.parse(localStorage.getItem('operations') || '[]');
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        
        // Inicializar filtros si no existen
        this.initializeOperationFilters(operations, trucks);
        
        // Aplicar filtros
        const filteredOperations = this.applyOperationFilters(operations);
        
        // Calcular métricas automáticas para cada operación
        const enrichedOperations = filteredOperations.map(operation => {
            const metrics = this.calculateOperationMetrics(operation);
            return { ...operation, ...metrics };
        });
        
        const tbody = document.querySelector('#operationsTable tbody');
        tbody.innerHTML = enrichedOperations.map(operation => {
            const truck = trucks.find(t => t.id === operation.truckId);
            return `
                <tr>
                    <td>${operation.month}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>${operation.products?.toLocaleString() || 0}</td>
                    <td>${operation.clients?.toLocaleString() || 0}</td>
                    <td>${operation.recharges?.toLocaleString() || 0}</td>
                    <td>${operation.finalKm?.toLocaleString() || 0} km</td>
                    <td class="${operation.isReplacement ? 'font-bold' : ''}">${operation.monthlyKm?.toLocaleString() || 0} km</td>
                    <td class="action-buttons">
                        <button class="btn-info" onclick="fleetManager.showOperationDetails(${operation.id})" title="Ver detalles">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editOperation(${operation.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteOperation(${operation.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
        
        // Mostrar resumen de métricas
        this.displayOperationSummary(enrichedOperations);
    }

    initializeOperationFilters(operations, trucks) {
        const monthFilter = document.getElementById('monthFilter');
        const truckFilter = document.getElementById('truckFilter');
        
        if (!monthFilter || !truckFilter) return;
        
        // Poblar filtro de meses
        const months = [...new Set(operations.map(op => op.month))].sort().reverse();
        monthFilter.innerHTML = '<option value="">Todos los meses</option>' + 
            months.map(month => `<option value="${month}">${month}</option>`).join('');
        
        // Poblar filtro de camiones
        truckFilter.innerHTML = '<option value="">Todos los camiones</option>' + 
            trucks.map(truck => `<option value="${truck.id}">Camión ${truck.number}</option>`).join('');
        
        // Agregar event listeners si no existen
        if (!monthFilter.hasAttribute('data-initialized')) {
            monthFilter.addEventListener('change', () => this.loadOperations());
            monthFilter.setAttribute('data-initialized', 'true');
        }
        
        if (!truckFilter.hasAttribute('data-initialized')) {
            truckFilter.addEventListener('change', () => this.loadOperations());
            truckFilter.setAttribute('data-initialized', 'true');
        }
    }

    applyOperationFilters(operations) {
        const monthFilter = document.getElementById('monthFilter')?.value;
        const truckFilter = document.getElementById('truckFilter')?.value;
        
        let filtered = [...operations];
        
        if (monthFilter) {
            filtered = filtered.filter(op => op.month === monthFilter);
        }
        
        if (truckFilter) {
            filtered = filtered.filter(op => op.truckId === parseInt(truckFilter));
        }
        
        return filtered.sort((a, b) => b.month.localeCompare(a.month));
    }

    displayOperationSummary(operations) {
        if (operations.length === 0) {
            this.clearOperationSummary();
            return;
        }
        
        const totalKm = operations.reduce((sum, op) => sum + (op.monthlyKm || 0), 0);
        const totalFuel = operations.reduce((sum, op) => sum + (op.totalFuelLiters || 0), 0);
        const totalCost = operations.reduce((sum, op) => sum + (op.totalMonthlyCost || 0), 0);
        const totalProducts = operations.reduce((sum, op) => sum + (op.products || 0), 0);
        const avgEfficiency = operations.length > 0 ? 
            (operations.reduce((sum, op) => sum + (op.fuelEfficiency || 0), 0) / operations.length).toFixed(2) : 0;
        
        // Crear o actualizar panel de resumen
        let summaryPanel = document.getElementById('operationSummaryPanel');
        if (!summaryPanel) {
            summaryPanel = document.createElement('div');
            summaryPanel.id = 'operationSummaryPanel';
            summaryPanel.className = 'metrics-panel';
            document.querySelector('#operaciones .filters').after(summaryPanel);
        }
        
        summaryPanel.innerHTML = `
            <h3><i class="fas fa-chart-line"></i> Resumen de Operaciones (${operations.length} registros)</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${totalKm.toLocaleString()}</div>
                    <div class="metric-label">Km Totales</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalProducts.toLocaleString()}</div>
                    <div class="metric-label">Productos Entregados</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalFuel.toLocaleString()}</div>
                    <div class="metric-label">Litros Combustible</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${avgEfficiency}</div>
                    <div class="metric-label">Rendimiento Promedio (km/L)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${this.formatCurrency(totalCost)}</div>
                    <div class="metric-label">Costo Total</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalKm > 0 ? this.formatCurrency(totalCost / totalKm) : '$0'}</div>
                    <div class="metric-label">Costo por Km Promedio</div>
                </div>
            </div>
        `;
    }

    clearOperationSummary() {
        const summaryPanel = document.getElementById('operationSummaryPanel');
        if (summaryPanel) {
            summaryPanel.remove();
        }
    }

    showOperationModal(operationId = null) {
        const operation = operationId ? JSON.parse(localStorage.getItem('operations') || '[]').find(o => o.id === operationId) : null;
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-clipboard-list"></i> ${operation ? 'Editar' : 'Registrar'} Operación</h2>
                    <form id="operationForm">
                        <div class="form-group">
                            <label for="operationMonth">Mes/Año:</label>
                            <input type="month" id="operationMonth" value="${operation?.month || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="operationTruck">Camión:</label>
                            <select id="operationTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${operation?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="operationProducts">Productos Entregados:</label>
                            <input type="number" id="operationProducts" value="${operation?.products || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="operationClients">Clientes Atendidos:</label>
                            <input type="number" id="operationClients" value="${operation?.clients || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="operationRecharges">Recargues:</label>
                            <input type="number" id="operationRecharges" value="${operation?.recharges || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="operationFinalKm">Kilometraje Final del Mes:</label>
                            <input type="number" id="operationFinalKm" value="${operation?.finalKm || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="operationIsReplacement" ${operation?.isReplacement ? 'checked' : ''}>
                                Es camión de reemplazo
                            </label>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${operation ? 'Actualizar' : 'Registrar'} Operación</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
        
        document.getElementById('operationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOperation(operationId);
        });
    }

    saveOperation(operationId = null) {
        const operations = JSON.parse(localStorage.getItem('operations') || '[]');
        const month = document.getElementById('operationMonth').value;
        const truckId = parseInt(document.getElementById('operationTruck').value);
        const products = parseInt(document.getElementById('operationProducts').value);
        const clients = parseInt(document.getElementById('operationClients').value);
        const recharges = parseInt(document.getElementById('operationRecharges').value);
        const finalKm = parseInt(document.getElementById('operationFinalKm').value);
        const isReplacement = document.getElementById('operationIsReplacement').checked;
        
        // Calcular kilometraje mensual
        const previousOperation = operations
            .filter(op => op.truckId === truckId && op.month < month)
            .sort((a, b) => b.month.localeCompare(a.month))[0];
        
        const monthlyKm = previousOperation ? finalKm - previousOperation.finalKm : finalKm;
        
        if (operationId) {
            const operationIndex = operations.findIndex(o => o.id === operationId);
            if (operationIndex !== -1) {
                operations[operationIndex] = {
                    ...operations[operationIndex],
                    month,
                    truckId,
                    products,
                    clients,
                    recharges,
                    finalKm,
                    monthlyKm,
                    isReplacement
                };
            }
        } else {
            const newOperation = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                month,
                truckId,
                products,
                clients,
                recharges,
                finalKm,
                monthlyKm,
                isReplacement,
                createdAt: new Date().toISOString()
            };
            operations.push(newOperation);
        }
        
        localStorage.setItem('operations', JSON.stringify(operations));
        this.closeModal();
        this.loadOperations();
    }

    editOperation(operationId) {
        this.showOperationModal(operationId);
    }

    deleteOperation(operationId) {
        if (confirm('¿Está seguro de eliminar esta operación?')) {
            const operations = JSON.parse(localStorage.getItem('operations') || '[]');
            const filteredOperations = operations.filter(o => o.id !== operationId);
            localStorage.setItem('operations', JSON.stringify(filteredOperations));
            this.loadOperations();
        }
    }

    // Nuevos métodos para cálculos automáticos
    calculateOperationMetrics(operation) {
        const fuelRecords = JSON.parse(localStorage.getItem('fuel') || '[]');
        const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
        
        // Obtener combustible del mes
        const monthFuel = fuelRecords.filter(fuel => {
            const fuelDate = new Date(fuel.date);
            const operationDate = new Date(operation.month + '-01');
            return fuel.truckId === operation.truckId && 
                   fuelDate.getMonth() === operationDate.getMonth() && 
                   fuelDate.getFullYear() === operationDate.getFullYear();
        });
        
        const totalFuelLiters = monthFuel.reduce((sum, fuel) => sum + fuel.liters, 0);
        const totalFuelCost = monthFuel.reduce((sum, fuel) => sum + fuel.cost, 0);
        
        // Calcular rendimiento (km/litro)
        const fuelEfficiency = operation.monthlyKm && totalFuelLiters > 0 ? 
            (operation.monthlyKm / totalFuelLiters).toFixed(2) : 0;
        
        // Calcular costo por kilómetro
        const costPerKm = operation.monthlyKm > 0 ? 
            (totalFuelCost / operation.monthlyKm).toFixed(0) : 0;
        
        // Calcular productividad (productos por km)
        const productivity = operation.monthlyKm > 0 ? 
            (operation.products / operation.monthlyKm).toFixed(3) : 0;
        
        // Obtener reparaciones del mes
        const monthRepairs = repairs.filter(repair => {
            const repairDate = new Date(repair.date);
            const operationDate = new Date(operation.month + '-01');
            return repair.truckId === operation.truckId && 
                   repairDate.getMonth() === operationDate.getMonth() && 
                   repairDate.getFullYear() === operationDate.getFullYear();
        });
        
        const totalRepairCost = monthRepairs.reduce((sum, repair) => sum + repair.cost, 0);
        
        return {
            fuelEfficiency: parseFloat(fuelEfficiency),
            costPerKm: parseInt(costPerKm),
            productivity: parseFloat(productivity),
            totalFuelLiters,
            totalFuelCost,
            totalRepairCost,
            totalMonthlyCost: totalFuelCost + totalRepairCost
        };
    }

    displayMonthlyMetrics(operations) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthOps = operations.filter(op => op.month === currentMonth);
        
        if (currentMonthOps.length === 0) return;
        
        const totalKm = currentMonthOps.reduce((sum, op) => sum + (op.monthlyKm || 0), 0);
        const totalFuel = currentMonthOps.reduce((sum, op) => sum + (op.totalFuelLiters || 0), 0);
        const totalCost = currentMonthOps.reduce((sum, op) => sum + (op.totalMonthlyCost || 0), 0);
        const avgEfficiency = currentMonthOps.length > 0 ? 
            (currentMonthOps.reduce((sum, op) => sum + (op.fuelEfficiency || 0), 0) / currentMonthOps.length).toFixed(2) : 0;
        
        // Crear o actualizar panel de métricas
        let metricsPanel = document.getElementById('monthlyMetricsPanel');
        if (!metricsPanel) {
            metricsPanel = document.createElement('div');
            metricsPanel.id = 'monthlyMetricsPanel';
            metricsPanel.className = 'metrics-panel';
            document.querySelector('#operaciones .section-header').after(metricsPanel);
        }
        
        metricsPanel.innerHTML = `
            <h3><i class="fas fa-chart-line"></i> Métricas del Mes Actual</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${totalKm.toLocaleString()}</div>
                    <div class="metric-label">Km Totales</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalFuel.toLocaleString()}</div>
                    <div class="metric-label">Litros Combustible</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${avgEfficiency}</div>
                    <div class="metric-label">Rendimiento Promedio (km/L)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${this.formatCurrency(totalCost)}</div>
                    <div class="metric-label">Costo Total</div>
                </div>
            </div>
        `;
    }

    showOperationDetails(operationId) {
        const operations = JSON.parse(localStorage.getItem('operations') || '[]');
        const operation = operations.find(o => o.id === operationId);
        if (!operation) return;
        
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const truck = trucks.find(t => t.id === operation.truckId);
        const metrics = this.calculateOperationMetrics(operation);
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content large">
                    <h2><i class="fas fa-analytics"></i> Detalles de Operación - ${operation.month}</h2>
                    <div class="operation-details">
                        <div class="detail-section">
                            <h3>Información General</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Camión:</label>
                                    <span>Camión ${truck?.number || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Mes/Año:</label>
                                    <span>${operation.month}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Productos Entregados:</label>
                                    <span>${operation.products?.toLocaleString() || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Clientes Atendidos:</label>
                                    <span>${operation.clients?.toLocaleString() || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Recargues:</label>
                                    <span>${operation.recharges?.toLocaleString() || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Kilometraje Final:</label>
                                    <span>${operation.finalKm?.toLocaleString() || 0} km</span>
                                </div>
                                <div class="detail-item">
                                    <label>Kilometraje Mensual:</label>
                                    <span>${operation.monthlyKm?.toLocaleString() || 0} km</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Métricas Calculadas</h3>
                            <div class="metrics-grid">
                                <div class="metric-card">
                                    <div class="metric-value">${metrics.fuelEfficiency}</div>
                                    <div class="metric-label">Rendimiento (km/L)</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${this.formatCurrency(metrics.costPerKm)}</div>
                                    <div class="metric-label">Costo por Km</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${metrics.productivity}</div>
                                    <div class="metric-label">Productividad (prod/km)</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${metrics.totalFuelLiters.toLocaleString()}</div>
                                    <div class="metric-label">Combustible (L)</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${this.formatCurrency(metrics.totalFuelCost)}</div>
                                    <div class="metric-label">Costo Combustible</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${this.formatCurrency(metrics.totalRepairCost)}</div>
                                    <div class="metric-label">Costo Reparaciones</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
    }

    // Mantenimiento
    loadMaintenance() {
        this.loadRepairs();
        this.loadFuel();
        this.loadAdBlue();
        this.loadOil();
    }

    loadRepairs() {
        const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const tbody = document.querySelector('#repairsTable tbody');
        
        tbody.innerHTML = repairs.map(repair => {
            const truck = trucks.find(t => t.id === repair.truckId);
            return `
                <tr>
                    <td>${new Date(repair.date).toLocaleDateString()}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>${repair.observations}</td>
                    <td>$${repair.cost?.toLocaleString() || 0}</td>
                    <td>${repair.km?.toLocaleString() || 0} km</td>
                    <td>${repair.photos ? '<a href="#" onclick="fleetManager.viewInvoice(\'repair\', ' + repair.id + ')" style="color: #28a745; text-decoration: none;"><i class="fas fa-image text-success"></i></a>' : '<i class="fas fa-times text-danger"></i>'}</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editRepair(${repair.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteRepair(${repair.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    showRepairModal(repairId = null) {
        const repair = repairId ? JSON.parse(localStorage.getItem('repairs') || '[]').find(r => r.id === repairId) : null;
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-wrench"></i> ${repair ? 'Editar' : 'Registrar'} Reparación</h2>
                    <form id="repairForm">
                        <div class="form-group">
                            <label for="repairDate">Fecha:</label>
                            <input type="date" id="repairDate" value="${repair?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="repairTruck">Camión:</label>
                            <select id="repairTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${repair?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="repairObservations">Observaciones de Anomalías:</label>
                            <textarea id="repairObservations" rows="3" required>${repair?.observations || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="repairCost">Costo (CLP):</label>
                            <input type="number" id="repairCost" value="${repair?.cost || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="repairKm">Kilometraje:</label>
                            <input type="number" id="repairKm" value="${repair?.km || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="repairPhotos">Adjuntar Fotos:</label>
                            <input type="file" id="repairPhotos" multiple accept="image/*">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${repair ? 'Actualizar' : 'Registrar'} Reparación</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
        
        document.getElementById('repairForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRepair(repairId);
        });
    }

    saveRepair(repairId = null) {
        const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
        const date = document.getElementById('repairDate').value;
        const truckId = parseInt(document.getElementById('repairTruck').value);
        const observations = document.getElementById('repairObservations').value;
        const cost = parseInt(document.getElementById('repairCost').value);
        const km = parseInt(document.getElementById('repairKm').value);
        const photos = document.getElementById('repairPhotos').files.length > 0;
        
        if (repairId) {
            const repairIndex = repairs.findIndex(r => r.id === repairId);
            if (repairIndex !== -1) {
                repairs[repairIndex] = {
                    ...repairs[repairIndex],
                    date,
                    truckId,
                    observations,
                    cost,
                    km,
                    photos
                };
            }
        } else {
            const newRepair = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                date,
                truckId,
                observations,
                cost,
                km,
                photos,
                createdAt: new Date().toISOString()
            };
            repairs.push(newRepair);
        }
        
        localStorage.setItem('repairs', JSON.stringify(repairs));
        this.closeModal();
        this.loadRepairs();
    }

    editRepair(repairId) {
        this.showRepairModal(repairId);
    }

    deleteRepair(repairId) {
        if (confirm('¿Está seguro de eliminar esta reparación?')) {
            const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
            const filteredRepairs = repairs.filter(r => r.id !== repairId);
            localStorage.setItem('repairs', JSON.stringify(filteredRepairs));
            this.loadRepairs();
        }
    }

    loadFuel() {
        const fuelRecords = JSON.parse(localStorage.getItem('fuelRecords') || '[]');
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const tbody = document.querySelector('#fuelTable tbody');
        
        tbody.innerHTML = fuelRecords.map(fuel => {
            const truck = trucks.find(t => t.id === fuel.truckId);
            return `
                <tr>
                    <td>${new Date(fuel.date).toLocaleDateString()}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>${fuel.liters} L</td>
                    <td>$${fuel.cost?.toLocaleString() || 0}</td>
                    <td>${fuel.km?.toLocaleString() || 0} km</td>
                    <td>${fuel.invoice ? '<a href="#" onclick="fleetManager.viewInvoice(\'fuel\', ' + fuel.id + ')" style="color: #28a745; text-decoration: none;"><i class="fas fa-image text-success"></i></a>' : '<i class="fas fa-times text-danger"></i>'}</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editFuel(${fuel.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteFuel(${fuel.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadAdBlue() {
        const adBlueRecords = JSON.parse(localStorage.getItem('adBlueRecords') || '[]');
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const tbody = document.querySelector('#adBlueTable tbody');
        
        tbody.innerHTML = adBlueRecords.map(adBlue => {
            const truck = trucks.find(t => t.id === adBlue.truckId);
            return `
                <tr>
                    <td>${new Date(adBlue.date).toLocaleDateString()}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>${adBlue.liters} L</td>
                    <td>$${adBlue.cost?.toLocaleString() || 0}</td>
                    <td>${adBlue.km?.toLocaleString() || 0} km</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editAdBlue(${adBlue.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteAdBlue(${adBlue.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadOil() {
        const oilRecords = JSON.parse(localStorage.getItem('oilRecords') || '[]');
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const tbody = document.querySelector('#oilTable tbody');
        
        tbody.innerHTML = oilRecords.map(oil => {
            const truck = trucks.find(t => t.id === oil.truckId);
            return `
                <tr>
                    <td>${new Date(oil.date).toLocaleDateString()}</td>
                    <td>Camión ${truck?.number || 'N/A'}</td>
                    <td>${oil.type}</td>
                    <td>${oil.liters} L</td>
                    <td>$${oil.cost?.toLocaleString() || 0}</td>
                    <td>${oil.km?.toLocaleString() || 0} km</td>
                    <td class="action-buttons">
                        ${this.currentUser.role === 'administrador' ? `
                            <button class="btn-edit" onclick="fleetManager.editOil(${oil.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="fleetManager.deleteOil(${oil.id})"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    showFuelModal(fuelId = null) {
        const fuel = fuelId ? JSON.parse(localStorage.getItem('fuelRecords') || '[]').find(f => f.id === fuelId) : null;
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-gas-pump"></i> ${fuel ? 'Editar' : 'Registrar'} Combustible</h2>
                    <form id="fuelForm">
                        <div class="form-group">
                            <label for="fuelDate">Fecha:</label>
                            <input type="date" id="fuelDate" value="${fuel?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelTruck">Camión:</label>
                            <select id="fuelTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${fuel?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="fuelLiters">Litros:</label>
                            <input type="number" id="fuelLiters" step="0.1" value="${fuel?.liters || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelCost">Costo (CLP):</label>
                            <input type="number" id="fuelCost" value="${fuel?.cost || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelKm">Kilometraje:</label>
                            <input type="number" id="fuelKm" value="${fuel?.km || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="fuelInvoice">Adjuntar Factura:</label>
                            <input type="file" id="fuelInvoice" accept="image/*">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${fuel ? 'Actualizar' : 'Registrar'} Combustible</button>
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

    showAdBlueModal(adBlueId = null) {
        const adBlue = adBlueId ? JSON.parse(localStorage.getItem('adBlueRecords') || '[]').find(a => a.id === adBlueId) : null;
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-tint"></i> ${adBlue ? 'Editar' : 'Registrar'} AdBlue</h2>
                    <form id="adBlueForm">
                        <div class="form-group">
                            <label for="adBlueDate">Fecha:</label>
                            <input type="date" id="adBlueDate" value="${adBlue?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="adBlueTruck">Camión:</label>
                            <select id="adBlueTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${adBlue?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="adBlueLiters">Litros:</label>
                            <input type="number" id="adBlueLiters" step="0.1" value="${adBlue?.liters || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="adBlueCost">Costo (CLP):</label>
                            <input type="number" id="adBlueCost" value="${adBlue?.cost || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="adBlueKm">Kilometraje:</label>
                            <input type="number" id="adBlueKm" value="${adBlue?.km || ''}" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${adBlue ? 'Actualizar' : 'Registrar'} AdBlue</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
        
        document.getElementById('adBlueForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAdBlue(adBlueId);
        });
    }

    showOilModal(oilId = null) {
        const oil = oilId ? JSON.parse(localStorage.getItem('oilRecords') || '[]').find(o => o.id === oilId) : null;
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-oil-can"></i> ${oil ? 'Editar' : 'Registrar'} Aceite</h2>
                    <form id="oilForm">
                        <div class="form-group">
                            <label for="oilDate">Fecha:</label>
                            <input type="date" id="oilDate" value="${oil?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="oilTruck">Camión:</label>
                            <select id="oilTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${oil?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="oilType">Tipo de Aceite:</label>
                            <select id="oilType" required>
                                <option value="">Seleccionar tipo</option>
                                <option value="Motor" ${oil?.type === 'Motor' ? 'selected' : ''}>Motor</option>
                                <option value="Transmisión" ${oil?.type === 'Transmisión' ? 'selected' : ''}>Transmisión</option>
                                <option value="Hidráulico" ${oil?.type === 'Hidráulico' ? 'selected' : ''}>Hidráulico</option>
                                <option value="Diferencial" ${oil?.type === 'Diferencial' ? 'selected' : ''}>Diferencial</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="oilLiters">Litros:</label>
                            <input type="number" id="oilLiters" step="0.1" value="${oil?.liters || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="oilCost">Costo (CLP):</label>
                            <input type="number" id="oilCost" value="${oil?.cost || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="oilKm">Kilometraje:</label>
                            <input type="number" id="oilKm" value="${oil?.km || ''}" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${oil ? 'Actualizar' : 'Registrar'} Aceite</button>
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

    saveFuel(fuelId = null) {
        const fuelRecords = JSON.parse(localStorage.getItem('fuelRecords') || '[]');
        const date = document.getElementById('fuelDate').value;
        const truckId = parseInt(document.getElementById('fuelTruck').value);
        const liters = parseFloat(document.getElementById('fuelLiters').value);
        const cost = parseInt(document.getElementById('fuelCost').value);
        const km = parseInt(document.getElementById('fuelKm').value);
        const invoice = document.getElementById('fuelInvoice').files.length > 0;
        
        if (fuelId) {
            const fuelIndex = fuelRecords.findIndex(f => f.id === fuelId);
            if (fuelIndex !== -1) {
                fuelRecords[fuelIndex] = {
                    ...fuelRecords[fuelIndex],
                    date, truckId, liters, cost, km, invoice
                };
            }
        } else {
            const newFuel = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                date, truckId, liters, cost, km, invoice,
                createdAt: new Date().toISOString()
            };
            fuelRecords.push(newFuel);
        }
        
        localStorage.setItem('fuelRecords', JSON.stringify(fuelRecords));
        this.closeModal();
        this.loadFuel();
    }

    editFuel(fuelId) {
        this.showFuelModal(fuelId);
    }

    deleteFuel(fuelId) {
        if (confirm('¿Está seguro de eliminar este registro de combustible?')) {
            const fuelRecords = JSON.parse(localStorage.getItem('fuelRecords') || '[]');
            const filteredRecords = fuelRecords.filter(f => f.id !== fuelId);
            localStorage.setItem('fuelRecords', JSON.stringify(filteredRecords));
            this.loadFuel();
        }
    }

    saveAdBlue(adBlueId = null) {
        const adBlueRecords = JSON.parse(localStorage.getItem('adBlueRecords') || '[]');
        const date = document.getElementById('adBlueDate').value;
        const truckId = parseInt(document.getElementById('adBlueTruck').value);
        const liters = parseFloat(document.getElementById('adBlueLiters').value);
        const cost = parseInt(document.getElementById('adBlueCost').value);
        const km = parseInt(document.getElementById('adBlueKm').value);
        
        if (adBlueId) {
            const adBlueIndex = adBlueRecords.findIndex(a => a.id === adBlueId);
            if (adBlueIndex !== -1) {
                adBlueRecords[adBlueIndex] = {
                    ...adBlueRecords[adBlueIndex],
                    date, truckId, liters, cost, km
                };
            }
        } else {
            const newAdBlue = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                date, truckId, liters, cost, km,
                createdAt: new Date().toISOString()
            };
            adBlueRecords.push(newAdBlue);
        }
        
        localStorage.setItem('adBlueRecords', JSON.stringify(adBlueRecords));
        this.closeModal();
        this.loadAdBlue();
    }

    editAdBlue(adBlueId) {
        this.showAdBlueModal(adBlueId);
    }

    deleteAdBlue(adBlueId) {
        if (confirm('¿Está seguro de eliminar este registro de AdBlue?')) {
            const adBlueRecords = JSON.parse(localStorage.getItem('adBlueRecords') || '[]');
            const filteredRecords = adBlueRecords.filter(a => a.id !== adBlueId);
            localStorage.setItem('adBlueRecords', JSON.stringify(filteredRecords));
            this.loadAdBlue();
        }
    }

    saveOil(oilId = null) {
        const oilRecords = JSON.parse(localStorage.getItem('oilRecords') || '[]');
        const date = document.getElementById('oilDate').value;
        const truckId = parseInt(document.getElementById('oilTruck').value);
        const type = document.getElementById('oilType').value;
        const liters = parseFloat(document.getElementById('oilLiters').value);
        const cost = parseInt(document.getElementById('oilCost').value);
        const km = parseInt(document.getElementById('oilKm').value);
        
        if (oilId) {
            const oilIndex = oilRecords.findIndex(o => o.id === oilId);
            if (oilIndex !== -1) {
                oilRecords[oilIndex] = {
                    ...oilRecords[oilIndex],
                    date, truckId, type, liters, cost, km
                };
            }
        } else {
            const newOil = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                date, truckId, type, liters, cost, km,
                createdAt: new Date().toISOString()
            };
            oilRecords.push(newOil);
        }
        
        localStorage.setItem('oilRecords', JSON.stringify(oilRecords));
        this.closeModal();
        this.loadOil();
    }

    editOil(oilId) {
        this.showOilModal(oilId);
    }

    deleteOil(oilId) {
        if (confirm('¿Está seguro de eliminar este registro de aceite?')) {
            const oilRecords = JSON.parse(localStorage.getItem('oilRecords') || '[]');
            const filteredRecords = oilRecords.filter(o => o.id !== oilId);
            localStorage.setItem('oilRecords', JSON.stringify(filteredRecords));
            this.loadOil();
        }
    }

    // Documentos y Alertas
    loadDocuments() {
        const alerts = this.generateAlerts();
        const documentAlerts = alerts.filter(alert => alert.category === 'documento');
        const maintenanceAlerts = alerts.filter(alert => alert.category === 'mantenimiento');
        
        this.displayDocumentAlerts(documentAlerts);
        this.displayMaintenanceAlerts(maintenanceAlerts);
        this.loadDocumentManager();
        this.setupNotificationSystem();
    }

    loadDocumentManager() {
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const documentsSection = document.getElementById('documentos');
        let documentManager = documentsSection.querySelector('.document-manager');
        
        if (!documentManager) {
            // Crear contenedor si no existe
            const managerHTML = `
                <div class="document-manager">
                    <div class="document-header">
                        <h3><i class="fas fa-folder-open"></i> Gestion de Documentos</h3>
                        <button id="uploadDocumentBtn" class="btn-primary">
                            <i class="fas fa-upload"></i> Subir Documento
                        </button>
                    </div>
                    <div id="documentList" class="document-list">
                        <!-- Lista de documentos -->
                    </div>
                </div>
            `;
            documentsSection.insertAdjacentHTML('afterbegin', managerHTML);
            
            // Configurar eventos
            const uploadDocumentBtn = document.getElementById('uploadDocumentBtn');
            
            if (uploadDocumentBtn) {
                uploadDocumentBtn.addEventListener('click', () => {
                    this.showDocumentUploadModal();
                });
            }
        }
    }

    loadTruckDocuments(truckId) {
        const documentList = document.getElementById('documentList');
        if (!documentList) {
            console.error('Elemento documentList no encontrado');
            return;
        }
        
        if (!truckId) {
            documentList.innerHTML = '<p>Seleccione un camión para ver sus documentos</p>';
            return;
        }
        
        const documents = JSON.parse(localStorage.getItem('truckDocuments') || '[]');
        const truckDocuments = documents.filter(doc => doc.truckId === parseInt(truckId));
        
        if (truckDocuments.length === 0) {
            documentList.innerHTML = '<p>No hay documentos registrados para este camión</p>';
            return;
        }
        
        documentList.innerHTML = truckDocuments.map(doc => {
            const expiryDate = new Date(doc.expiryDate);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            const statusClass = daysUntilExpiry <= 5 ? 'danger' : daysUntilExpiry <= 15 ? 'warning' : 'success';
            
            return `
                <div class="document-item ${statusClass}">
                    <div class="document-info">
                        <h4>${doc.type}</h4>
                        <p>Vence: ${expiryDate.toLocaleDateString()}</p>
                        <p class="days-remaining">${daysUntilExpiry > 0 ? `${daysUntilExpiry} días restantes` : 'VENCIDO'}</p>
                    </div>
                    <div class="document-actions">
                        ${doc.fileUrl ? `<button class="btn-view" onclick="window.open('${doc.fileUrl}', '_blank')"><i class="fas fa-eye"></i></button>` : ''}
                        <button class="btn-edit" onclick="fleetManager.editDocument(${doc.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="fleetManager.deleteDocument(${doc.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showDocumentUploadModal(documentId = null) {
        const document = documentId ? JSON.parse(localStorage.getItem('truckDocuments') || '[]').find(d => d.id === documentId) : null;
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <h2><i class="fas fa-file-upload"></i> ${document ? 'Editar' : 'Subir'} Documento</h2>
                    <form id="documentForm">
                        <div class="form-group">
                            <label for="docTruck">Camión:</label>
                            <select id="docTruck" required>
                                <option value="">Seleccionar camión</option>
                                ${trucks.map(truck => `
                                    <option value="${truck.id}" ${document?.truckId === truck.id ? 'selected' : ''}>Camión ${truck.number}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="docType">Tipo de Documento:</label>
                            <select id="docType" required>
                                <option value="">Seleccionar tipo</option>
                                <option value="Revisión Técnica" ${document?.type === 'Revisión Técnica' ? 'selected' : ''}>Revisión Técnica</option>
                                <option value="Seguro Obligatorio" ${document?.type === 'Seguro Obligatorio' ? 'selected' : ''}>Seguro Obligatorio</option>
                                <option value="Impuestos Municipales" ${document?.type === 'Impuestos Municipales' ? 'selected' : ''}>Impuestos Municipales</option>
                                <option value="Certificado de Gases" ${document?.type === 'Certificado de Gases' ? 'selected' : ''}>Certificado de Gases</option>
                                <option value="Otro" ${document?.type === 'Otro' ? 'selected' : ''}>Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="docExpiryDate">Fecha de Vencimiento:</label>
                            <input type="date" id="docExpiryDate" value="${document?.expiryDate || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="docFile">Archivo (PDF, JPG, PNG):</label>
                            <input type="file" id="docFile" accept=".pdf,.jpg,.jpeg,.png">
                        </div>
                        <div class="form-group">
                            <label for="docNotes">Notas:</label>
                            <textarea id="docNotes" rows="3">${document?.notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">${document ? 'Actualizar' : 'Subir'} Documento</button>
                            <button type="button" class="btn-secondary" onclick="fleetManager.closeModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        if (!this.showModal(modalHTML)) return;
        
        const documentForm = document.getElementById('documentForm');
        if (documentForm) {
            documentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDocument(documentId);
            });
        }
    }

    saveDocument(documentId = null) {
        const documents = JSON.parse(localStorage.getItem('truckDocuments') || '[]');
        
        const docTruckEl = document.getElementById('docTruck');
        const docTypeEl = document.getElementById('docType');
        const docExpiryDateEl = document.getElementById('docExpiryDate');
        const docNotesEl = document.getElementById('docNotes');
        const fileInput = document.getElementById('docFile');
        
        if (!docTruckEl || !docTypeEl || !docExpiryDateEl || !docNotesEl || !fileInput) {
            console.error('Required form elements not found');
            return;
        }
        
        const truckId = parseInt(docTruckEl.value);
        const type = docTypeEl.value;
        const expiryDate = docExpiryDateEl.value;
        const notes = docNotesEl.value;
        
        // Simular subida de archivo (en una aplicación real se subiría a un servidor)
        let fileUrl = null;
        if (fileInput.files.length > 0) {
            fileUrl = URL.createObjectURL(fileInput.files[0]);
        }
        
        if (documentId) {
            const docIndex = documents.findIndex(d => d.id === documentId);
            if (docIndex !== -1) {
                documents[docIndex] = {
                    ...documents[docIndex],
                    truckId, type, expiryDate, notes,
                    ...(fileUrl && { fileUrl })
                };
            }
        } else {
            const newDocument = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                truckId, type, expiryDate, notes, fileUrl,
                uploadDate: new Date().toISOString()
            };
            documents.push(newDocument);
        }
        
        localStorage.setItem('truckDocuments', JSON.stringify(documents));
        this.closeModal();
        this.loadTruckDocuments(truckId.toString());
        this.loadDocuments(); // Recargar alertas
    }

    editDocument(documentId) {
        this.showDocumentUploadModal(documentId);
    }

    deleteDocument(documentId) {
        if (confirm('¿Está seguro de eliminar este documento?')) {
            const documents = JSON.parse(localStorage.getItem('truckDocuments') || '[]');
            const filteredDocuments = documents.filter(d => d.id !== documentId);
            localStorage.setItem('truckDocuments', JSON.stringify(filteredDocuments));
            
            // Recargar la lista de documentos y alertas
            this.loadDocuments();
        }
    }

    setupNotificationSystem() {
        // Verificar permisos de notificación
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Configurar verificación automática de alertas cada hora
        setInterval(() => {
            this.checkAndSendNotifications();
        }, 3600000); // 1 hora
        
        // Verificar inmediatamente
        this.checkAndSendNotifications();
    }

    checkAndSendNotifications() {
        const alerts = this.generateAlerts();
        const criticalAlerts = alerts.filter(alert => alert.type === 'danger');
        
        criticalAlerts.forEach(alert => {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('TVAR - Alerta Crítica', {
                    body: alert.message,
                    icon: '/favicon.ico',
                    tag: `alert-${alert.truck}-${alert.category}`
                });
            }
        });
        
        // Guardar historial de notificaciones
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        criticalAlerts.forEach(alert => {
            notifications.push({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                message: alert.message,
                type: alert.type,
                category: alert.category,
                truck: alert.truck,
                timestamp: new Date().toISOString(),
                read: false
            });
        });
        
        // Mantener solo las últimas 100 notificaciones
        if (notifications.length > 100) {
            notifications.splice(0, notifications.length - 100);
        }
        
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    displayDocumentAlerts(alerts) {
        const container = document.getElementById('documentAlerts');
        
        if (alerts.length === 0) {
            container.innerHTML = '<div class="alert-item success"><i class="fas fa-check-circle"></i> Todos los documentos están al día</div>';
            return;
        }
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <i class="fas fa-${alert.type === 'danger' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                ${alert.message}
            </div>
        `).join('');
    }

    displayMaintenanceAlerts(alerts) {
        const container = document.getElementById('maintenanceAlerts');
        
        if (alerts.length === 0) {
            container.innerHTML = '<div class="alert-item success"><i class="fas fa-check-circle"></i> Mantenimiento al día</div>';
            return;
        }
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <i class="fas fa-${alert.type === 'danger' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                ${alert.message}
            </div>
        `).join('');
    }

    // Informes
    loadReports() {
        this.loadReportFilters();
        this.setupReportEventListeners();
    }

    loadReportFilters() {
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
        
        // Llenar selectores de camiones
        const truckSelect = document.getElementById('reportTruck');
        if (truckSelect) {
            truckSelect.innerHTML = '<option value="">Todos los camiones</option>' +
                trucks.map(truck => `<option value="${truck.id}">Camión ${truck.number}</option>`).join('');
        }
        
        // Llenar selectores de conductores
        const driverSelect = document.getElementById('reportDriver');
        if (driverSelect) {
            driverSelect.innerHTML = '<option value="">Todos los conductores</option>' +
                drivers.map(driver => `<option value="${driver.id}">${driver.name}</option>`).join('');
        }
    }

    setupReportEventListeners() {
        // Event listeners para las opciones de informes
        document.querySelectorAll('.report-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const reportType = e.currentTarget.dataset.type;
                this.selectReportType(reportType);
            });
        });
        
        // Event listener para cerrar el panel de configuración
        document.getElementById('closeConfigPanel')?.addEventListener('click', () => {
            this.closeReportConfigPanel();
        });
        
        // Event listener para cambio de período
        document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
            this.handlePeriodChange(e.target.value);
        });
        
        // Event listener para generar informe
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateSelectedReport();
        });
    }

    // Nuevas funciones para el sistema de informes mejorado
    selectReportType(reportType) {
        this.currentReportType = reportType;
        
        // Mostrar el panel de configuración
        const configPanel = document.getElementById('reportConfigPanel');
        configPanel.style.display = 'block';
        
        // Actualizar el título del informe seleccionado
        const titles = {
            'individual': 'Informe Individual por Camión',
            'comparative': 'Informe Comparativo de Flota',
            'driver': 'Informe de Rendimiento por Conductor',
            'financial': 'Informe Financiero',
            'maintenance': 'Informe de Mantenimiento',
            'fuel': 'Informe de Consumo de Combustible',
            'technical-review': 'Informe de Revisiones Técnicas',
            'documents': 'Estado de Documentos',
            'alerts': 'Alertas y Vencimientos'
        };
        
        const selectedReportTitle = document.getElementById('selectedReportTitle');
        if (selectedReportTitle) {
            selectedReportTitle.textContent = titles[reportType] || 'Configurar Informe';
        }
        
        // Mostrar/ocultar filtros específicos según el tipo de informe
        this.updateReportFilters(reportType);
        
        // Scroll al panel de configuración
        configPanel.scrollIntoView({ behavior: 'smooth' });
    }
    
    closeReportConfigPanel() {
        const reportConfigPanel = document.getElementById('reportConfigPanel');
        if (reportConfigPanel) {
            reportConfigPanel.style.display = 'none';
        }
        this.currentReportType = null;
    }
    
    updateReportFilters(reportType) {
        const truckFilter = document.getElementById('truckFilter');
        const driverFilter = document.getElementById('driverFilter');
        const technicalReviewFilters = document.getElementById('technicalReviewFilters');
        
        // Ocultar todos los filtros primero
        if (truckFilter) truckFilter.style.display = 'none';
        if (driverFilter) driverFilter.style.display = 'none';
        if (technicalReviewFilters) technicalReviewFilters.style.display = 'none';
        
        // Mostrar filtros según el tipo de informe
        switch(reportType) {
            case 'individual':
            case 'maintenance':
            case 'fuel':
                if (truckFilter) truckFilter.style.display = 'block';
                break;
            case 'comparative':
                if (truckFilter) truckFilter.style.display = 'block';
                if (driverFilter) driverFilter.style.display = 'block';
                break;
            case 'driver':
                if (driverFilter) driverFilter.style.display = 'block';
                break;
            case 'technical-review':
                if (technicalReviewFilters) technicalReviewFilters.style.display = 'block';
                break;
        }
    }
    
    handlePeriodChange(period) {
        const customDateRange = document.getElementById('customDateRange');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (period === 'custom') {
            customDateRange.style.display = 'block';
        } else {
            customDateRange.style.display = 'none';
            this.setDateRangeByPeriod(period, startDate, endDate);
        }
    }
    
    setDateRangeByPeriod(period, startDate, endDate) {
        const today = new Date();
        let start, end;
        
        switch(period) {
            case 'current-month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'last-month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'last-3-months':
                start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                end = today;
                break;
            case 'last-6-months':
                start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
                end = today;
                break;
            case 'current-year':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = today;
        }
        
        if (startDate) startDate.value = start.toISOString().split('T')[0];
        if (endDate) endDate.value = end.toISOString().split('T')[0];
    }
    
    generateSelectedReport() {
        if (!this.currentReportType) {
            alert('Por favor selecciona un tipo de informe');
            return;
        }
        
        const filters = this.getReportFilters();
        
        switch(this.currentReportType) {
            case 'individual':
                this.generateIndividualReport(filters);
                break;
            case 'comparative':
                this.generateComparativeReport(filters);
                break;
            case 'driver':
                this.generateDriverReport(filters);
                break;
            case 'financial':
                this.generateFinancialReport(filters);
                break;
            case 'maintenance':
                this.generateMaintenanceReport(filters);
                break;
            case 'fuel':
                this.generateFuelReport(filters);
                break;
            case 'technical-review':
                this.generateTechnicalReviewReport();
                break;
            case 'documents':
                this.generateDocumentsReport();
                break;
            case 'alerts':
                this.generateAlertsReport();
                break;
        }
        
        // Mostrar botón de exportar
        const exportReportBtn = document.getElementById('exportReportBtn');
        if (exportReportBtn) {
            exportReportBtn.style.display = 'inline-block';
        }
    }
    
    getReportFilters() {
        const reportPeriod = document.getElementById('reportPeriod')?.value;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        const truckId = document.getElementById('reportTruck')?.value;
        const driverId = document.getElementById('reportDriver')?.value;
        
        return { reportPeriod, startDate, endDate, truckId, driverId };
    }

    toggleTechnicalReviewFilters(reportType) {
        const filtersDiv = document.getElementById('technicalReviewFilters');
        if (filtersDiv) {
            filtersDiv.style.display = reportType === 'technical-review' ? 'block' : 'none';
        }
    }

    generateReport() {
        const reportTypeElement = document.getElementById('reportType');
        if (!reportTypeElement) {
            console.error('Elemento reportType no encontrado');
            return;
        }
        
        const reportType = reportTypeElement.value;
        const reportPeriod = document.getElementById('reportPeriod')?.value;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        const truckId = document.getElementById('reportTruck')?.value;
        const driverId = document.getElementById('reportDriver')?.value;
        
        const filters = { reportPeriod, startDate, endDate, truckId, driverId };
        
        switch(reportType) {
            case 'individual':
                this.generateIndividualReport(filters);
                break;
            case 'comparative':
                this.generateComparativeReport(filters);
                break;
            case 'driver':
                this.generateDriverReport(filters);
                break;
            case 'financial':
                this.generateFinancialReport(filters);
                break;
            case 'technical-review':
                this.generateTechnicalReviewReport();
                break;
        }
    }

    generateIndividualReport(filters) {
        const operations = this.getFilteredOperations(filters);
        const fuelRecords = this.getFilteredFuelRecords(filters);
        const repairRecords = this.getFilteredRepairRecords(filters);
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-chart-line"></i> Informe Individual por Camión</h3>
                <p class="report-period">Período: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}</p>
            </div>
            
            <div class="report-metrics">
                <div class="metric-card">
                    <i class="fas fa-route"></i>
                    <div class="metric-info">
                        <h4>Total Operaciones</h4>
                        <span class="metric-value">${operations.length}</span>
                    </div>
                </div>
                <div class="metric-card">
                    <i class="fas fa-gas-pump"></i>
                    <div class="metric-info">
                        <h4>Consumo Combustible</h4>
                        <span class="metric-value">${fuelRecords.reduce((sum, f) => sum + f.liters, 0).toFixed(1)} L</span>
                    </div>
                </div>
                <div class="metric-card">
                    <i class="fas fa-tools"></i>
                    <div class="metric-info">
                        <h4>Reparaciones</h4>
                        <span class="metric-value">${repairRecords.length}</span>
                    </div>
                </div>
                <div class="metric-card">
                    <i class="fas fa-dollar-sign"></i>
                    <div class="metric-info">
                        <h4>Ingresos Totales</h4>
                        <span class="metric-value">$${operations.reduce((sum, op) => sum + (op.totalRevenue || 0), 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h4>Ingresos por Mes</h4>
                    <canvas id="revenueChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Consumo de Combustible</h4>
                    <canvas id="fuelChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Costos de Mantenimiento</h4>
                    <canvas id="maintenanceChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Eficiencia por Ruta</h4>
                    <canvas id="efficiencyChart"></canvas>
                </div>
            </div>
        `;
        
        // Generar gráficos
        setTimeout(() => {
            this.createRevenueChart(operations);
            this.createFuelChart(fuelRecords);
            this.createMaintenanceChart(repairRecords);
            this.createEfficiencyChart(operations);
        }, 100);
    }

    generateComparativeReport(filters) {
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const operations = JSON.parse(localStorage.getItem('operations') || '[]');
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-balance-scale"></i> Informe Comparativo de Flota</h3>
                <p class="report-period">Período: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}</p>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container full-width">
                    <h4>Comparación de Ingresos por Camión</h4>
                    <canvas id="comparativeRevenueChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Eficiencia de Combustible</h4>
                    <canvas id="fuelEfficiencyChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Costos de Mantenimiento</h4>
                    <canvas id="maintenanceCostChart"></canvas>
                </div>
            </div>
            
            <div class="comparison-table">
                <h4>Resumen Comparativo</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Camión</th>
                            <th>Operaciones</th>
                            <th>Ingresos</th>
                            <th>Combustible (L)</th>
                            <th>Mantenimiento</th>
                            <th>Rentabilidad</th>
                        </tr>
                    </thead>
                    <tbody id="comparisonTableBody">
                    </tbody>
                </table>
            </div>
        `;
        
        setTimeout(() => {
            this.createComparativeCharts(trucks, operations, filters);
            this.populateComparisonTable(trucks, operations, filters);
        }, 100);
    }

    generateDriverReport(filters) {
        const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
        const operations = this.getFilteredOperations(filters);
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-user-tie"></i> Informe de Rendimiento de Conductores</h3>
                <p class="report-period">Período: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}</p>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h4>Operaciones por Conductor</h4>
                    <canvas id="driverOperationsChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Ingresos por Conductor</h4>
                    <canvas id="driverRevenueChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Eficiencia de Entrega</h4>
                    <canvas id="deliveryEfficiencyChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Puntuación de Rendimiento</h4>
                    <canvas id="performanceScoreChart"></canvas>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            this.createDriverCharts(drivers, operations);
        }, 100);
    }

    generateFinancialReport(filters) {
        const operations = this.getFilteredOperations(filters);
        const fuelRecords = this.getFilteredFuelRecords(filters);
        const repairRecords = this.getFilteredRepairRecords(filters);
        
        const totalRevenue = operations.reduce((sum, op) => sum + (op.totalRevenue || 0), 0);
        const totalFuelCost = fuelRecords.reduce((sum, f) => sum + (f.cost || 0), 0);
        const totalMaintenanceCost = repairRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
        const netProfit = totalRevenue - totalFuelCost - totalMaintenanceCost;
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-chart-pie"></i> Informe Financiero</h3>
                <p class="report-period">Período: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}</p>
            </div>
            
            <div class="financial-summary">
                <div class="financial-card revenue">
                    <i class="fas fa-arrow-up"></i>
                    <div>
                        <h4>Ingresos Totales</h4>
                        <span class="amount">$${totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
                <div class="financial-card expense">
                    <i class="fas fa-arrow-down"></i>
                    <div>
                        <h4>Gastos Totales</h4>
                        <span class="amount">$${(totalFuelCost + totalMaintenanceCost).toLocaleString()}</span>
                    </div>
                </div>
                <div class="financial-card profit ${netProfit >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${netProfit >= 0 ? 'plus' : 'minus'}"></i>
                    <div>
                        <h4>Ganancia Neta</h4>
                        <span class="amount">$${netProfit.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h4>Distribución de Gastos</h4>
                    <canvas id="expenseDistributionChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Flujo de Caja Mensual</h4>
                    <canvas id="cashFlowChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>ROI por Camión</h4>
                    <canvas id="roiChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Tendencia de Rentabilidad</h4>
                    <canvas id="profitabilityTrendChart"></canvas>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            this.createFinancialCharts(operations, fuelRecords, repairRecords);
        }, 100);
    }

    // Funciones auxiliares para informes
    getFilteredOperations(filters) {
        const operations = JSON.parse(localStorage.getItem('operations') || '[]');
        return operations.filter(op => {
            const opDate = new Date(op.date);
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);
            
            let dateMatch = opDate >= startDate && opDate <= endDate;
            let truckMatch = !filters.truckId || op.truckId === parseInt(filters.truckId);
            let driverMatch = !filters.driverId || op.driverId === parseInt(filters.driverId);
            
            return dateMatch && truckMatch && driverMatch;
        });
    }
    
    getFilteredFuelRecords(filters) {
        const fuelRecords = JSON.parse(localStorage.getItem('fuelRecords') || '[]');
        return fuelRecords.filter(fuel => {
            const fuelDate = new Date(fuel.date);
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);
            
            let dateMatch = fuelDate >= startDate && fuelDate <= endDate;
            let truckMatch = !filters.truckId || fuel.truckId === parseInt(filters.truckId);
            
            return dateMatch && truckMatch;
        });
    }
    
    getFilteredRepairRecords(filters) {
        const repairRecords = JSON.parse(localStorage.getItem('repairRecords') || '[]');
        return repairRecords.filter(repair => {
            const repairDate = new Date(repair.date);
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);
            
            let dateMatch = repairDate >= startDate && repairDate <= endDate;
            let truckMatch = !filters.truckId || repair.truckId === parseInt(filters.truckId);
            
            return dateMatch && truckMatch;
        });
    }
    
    // Funciones para crear gráficos
    createRevenueChart(operations) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        const monthlyData = this.groupDataByMonth(operations, 'totalRevenue');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Ingresos Mensuales',
                    data: monthlyData.data,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    createFuelChart(fuelRecords) {
        const ctx = document.getElementById('fuelChart');
        if (!ctx) return;
        
        const monthlyData = this.groupDataByMonth(fuelRecords, 'liters');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Litros Consumidos',
                    data: monthlyData.data,
                    backgroundColor: '#FF9800',
                    borderColor: '#F57C00',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' L';
                            }
                        }
                    }
                }
            }
        });
    }
    
    createMaintenanceChart(repairRecords) {
        const ctx = document.getElementById('maintenanceChart');
        if (!ctx) return;
        
        const monthlyData = this.groupDataByMonth(repairRecords, 'cost');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Costos de Mantenimiento',
                    data: monthlyData.data,
                    backgroundColor: '#f44336',
                    borderColor: '#d32f2f',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    createEfficiencyChart(operations) {
        const ctx = document.getElementById('efficiencyChart');
        if (!ctx) return;
        
        const routeEfficiency = {};
        operations.forEach(op => {
            if (!routeEfficiency[op.route]) {
                routeEfficiency[op.route] = { totalRevenue: 0, totalDistance: 0, count: 0 };
            }
            routeEfficiency[op.route].totalRevenue += op.totalRevenue || 0;
            routeEfficiency[op.route].totalDistance += op.distance || 0;
            routeEfficiency[op.route].count++;
        });
        
        const labels = Object.keys(routeEfficiency);
        const data = labels.map(route => {
            const efficiency = routeEfficiency[route];
            return efficiency.totalDistance > 0 ? 
                (efficiency.totalRevenue / efficiency.totalDistance).toFixed(2) : 0;
        });
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Eficiencia ($/km)',
                    data: data,
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: '#2196F3',
                    pointBackgroundColor: '#2196F3'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    createComparativeCharts(trucks, operations, filters) {
        // Gráfico comparativo de ingresos
        const revenueCtx = document.getElementById('comparativeRevenueChart');
        if (revenueCtx) {
            const truckRevenues = trucks.map(truck => {
                const truckOps = operations.filter(op => 
                    op.truckId === truck.id &&
                    new Date(op.date) >= new Date(filters.startDate) &&
                    new Date(op.date) <= new Date(filters.endDate)
                );
                return truckOps.reduce((sum, op) => sum + (op.totalRevenue || 0), 0);
            });
            
            new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: trucks.map(truck => `Camión ${truck.number}`),
                    datasets: [{
                        label: 'Ingresos Totales',
                        data: truckRevenues,
                        backgroundColor: '#4CAF50',
                        borderColor: '#388E3C',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    createDriverCharts(drivers, operations) {
        // Gráfico de operaciones por conductor
        const operationsCtx = document.getElementById('driverOperationsChart');
        if (operationsCtx) {
            const driverOperations = drivers.map(driver => {
                return operations.filter(op => op.driverId === driver.id).length;
            });
            
            new Chart(operationsCtx, {
                type: 'doughnut',
                data: {
                    labels: drivers.map(driver => driver.name),
                    datasets: [{
                        data: driverOperations,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    createFinancialCharts(operations, fuelRecords, repairRecords) {
        // Gráfico de distribución de gastos
        const expenseCtx = document.getElementById('expenseDistributionChart');
        if (expenseCtx) {
            const totalFuelCost = fuelRecords.reduce((sum, f) => sum + (f.cost || 0), 0);
            const totalMaintenanceCost = repairRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
            
            new Chart(expenseCtx, {
                type: 'pie',
                data: {
                    labels: ['Combustible', 'Mantenimiento'],
                    datasets: [{
                        data: [totalFuelCost, totalMaintenanceCost],
                        backgroundColor: ['#FF9800', '#f44336']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    populateComparisonTable(trucks, operations, filters) {
        const tbody = document.getElementById('comparisonTableBody');
        if (!tbody) return;
        
        const fuelRecords = JSON.parse(localStorage.getItem('fuelRecords') || '[]');
        const repairRecords = JSON.parse(localStorage.getItem('repairRecords') || '[]');
        
        tbody.innerHTML = trucks.map(truck => {
            const truckOps = operations.filter(op => 
                op.truckId === truck.id &&
                new Date(op.date) >= new Date(filters.startDate) &&
                new Date(op.date) <= new Date(filters.endDate)
            );
            
            const truckFuel = fuelRecords.filter(f => 
                f.truckId === truck.id &&
                new Date(f.date) >= new Date(filters.startDate) &&
                new Date(f.date) <= new Date(filters.endDate)
            );
            
            const truckRepairs = repairRecords.filter(r => 
                r.truckId === truck.id &&
                new Date(r.date) >= new Date(filters.startDate) &&
                new Date(r.date) <= new Date(filters.endDate)
            );
            
            const revenue = truckOps.reduce((sum, op) => sum + (op.totalRevenue || 0), 0);
            const fuelCost = truckFuel.reduce((sum, f) => sum + (f.cost || 0), 0);
            const maintenanceCost = truckRepairs.reduce((sum, r) => sum + (r.cost || 0), 0);
            const profit = revenue - fuelCost - maintenanceCost;
            const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
            
            return `
                <tr>
                    <td>Camión ${truck.number}</td>
                    <td>${truckOps.length}</td>
                    <td>$${revenue.toLocaleString()}</td>
                    <td>${truckFuel.reduce((sum, f) => sum + (f.liters || 0), 0).toFixed(1)} L</td>
                    <td>$${maintenanceCost.toLocaleString()}</td>
                    <td class="${profit >= 0 ? 'positive' : 'negative'}">${profitMargin}%</td>
                </tr>
            `;
        }).join('');
    }
    
    groupDataByMonth(records, field) {
        const monthlyData = {};
        
        records.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += record[field] || 0;
        });
        
        const sortedKeys = Object.keys(monthlyData).sort();
        
        return {
            labels: sortedKeys.map(key => {
                const [year, month] = key.split('-');
                return new Date(year, month - 1).toLocaleDateString('es-ES', { 
                    month: 'short', 
                    year: 'numeric' 
                });
            }),
            data: sortedKeys.map(key => monthlyData[key])
        };
    }

    async generateTechnicalReviewReport() {
        const filterValue = document.getElementById('technicalReviewFilter')?.value || 'all';
        const trucks = await this.dbAdapter.getAll('trucks');
        const today = new Date();
        
        let filteredTrucks = trucks.filter(truck => truck.technicalReview);
        
        // Calcular días restantes para cada camión
        filteredTrucks = filteredTrucks.map(truck => {
            const reviewDate = new Date(truck.technicalReview);
            const diffTime = reviewDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...truck, daysRemaining: diffDays };
        });
        
        // Aplicar filtros
        switch(filterValue) {
            case 'expiring':
                filteredTrucks = filteredTrucks.filter(truck => truck.daysRemaining > 0 && truck.daysRemaining <= 15);
                break;
            case 'expired':
                filteredTrucks = filteredTrucks.filter(truck => truck.daysRemaining < 0);
                break;
            // 'all' no necesita filtro adicional
        }
        
        // Ordenar por días restantes (menor a mayor)
        filteredTrucks.sort((a, b) => a.daysRemaining - b.daysRemaining);
        
        this.displayTechnicalReviewReport(filteredTrucks, filterValue);
    }
    
    displayTechnicalReviewReport(trucks, filterType) {
        const reportResults = document.getElementById('reportResults');
        
        const filterTitles = {
            'all': 'Todas las Revisiones Técnicas',
            'expiring': 'Revisiones Próximas a Vencer (15 días)',
            'expired': 'Revisiones Vencidas'
        };
        
        const reportHTML = `
            <div class="report-section">
                <h3><i class="fas fa-clipboard-check"></i> ${filterTitles[filterType]}</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Camión</th>
                                <th>Patente</th>
                                <th>Fecha de Revisión</th>
                                <th>Estado</th>
                                <th>Días Restantes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateTechnicalReviewRows(trucks)}
                        </tbody>
                    </table>
                </div>
                <div class="report-summary">
                    <p><strong>Total de camiones:</strong> ${trucks.length}</p>
                </div>
            </div>
        `;
        
        reportResults.innerHTML = reportHTML;
    }
    
    generateTechnicalReviewRows(trucks) {
        if (trucks.length === 0) {
            return '<tr><td colspan="5" class="no-data">No hay revisiones técnicas que coincidan con el filtro seleccionado</td></tr>';
        }
        
        return trucks.map(truck => {
            const reviewDate = new Date(truck.technicalReview);
            const formattedDate = reviewDate.toLocaleDateString('es-CL');
            
            let statusClass = '';
            let statusText = '';
            
            if (truck.daysRemaining < 0) {
                statusClass = 'expired';
                statusText = 'Vencida';
            } else if (truck.daysRemaining <= 15) {
                statusClass = 'expiring';
                statusText = 'Por vencer';
            } else {
                statusClass = 'valid';
                statusText = 'Vigente';
            }
            
            const daysText = truck.daysRemaining < 0 ? 
                `${Math.abs(truck.daysRemaining)} días vencida` : 
                `${truck.daysRemaining} días restantes`;
            
            return `
                <tr>
                    <td>Camión ${truck.number}</td>
                    <td>${truck.plate}</td>
                    <td>${formattedDate}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td class="${statusClass}">${daysText}</td>
                </tr>
            `;
        }).join('');
    }
    
    generateMaintenanceReport(filters) {
        const repairs = this.getFilteredRepairRecords(filters);
        const totalCost = repairs.reduce((sum, repair) => sum + (repair.cost || 0), 0);
        const avgCost = repairs.length > 0 ? totalCost / repairs.length : 0;
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-tools"></i> Informe de Mantenimiento</h3>
                <p class="report-period">Período: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}</p>
            </div>
            
            <div class="report-metrics">
                <div class="metric-card">
                    <i class="fas fa-wrench"></i>
                    <div class="metric-info">
                        <h4>Total Reparaciones</h4>
                        <span class="metric-value">${repairs.length}</span>
                    </div>
                </div>
                <div class="metric-card">
                    <i class="fas fa-dollar-sign"></i>
                    <div class="metric-info">
                        <h4>Costo Total</h4>
                        <span class="metric-value">$${totalCost.toLocaleString()}</span>
                    </div>
                </div>
                <div class="metric-card">
                    <i class="fas fa-calculator"></i>
                    <div class="metric-info">
                        <h4>Costo Promedio</h4>
                        <span class="metric-value">$${avgCost.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Camión</th>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Costo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${repairs.map(repair => `
                            <tr>
                                <td>${new Date(repair.date).toLocaleDateString()}</td>
                                <td>Camión ${repair.truckNumber || repair.truckId}</td>
                                <td>${repair.type}</td>
                                <td>${repair.description}</td>
                                <td>$${(repair.cost || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    generateFuelReport(filters) {
        const fuelRecords = this.getFilteredFuelRecords(filters);
        const totalLiters = fuelRecords.reduce((sum, fuel) => sum + fuel.liters, 0);
        const totalCost = fuelRecords.reduce((sum, fuel) => sum + (fuel.cost || 0), 0);
        const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-gas-pump"></i> Informe de Consumo de Combustible</h3>
                <p class="report-period">Período: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}</p>
            </div>
            
            <div class="report-metrics">
                <div class="metric-card">
                    <i class="fas fa-tint"></i>
                    <div class="metric-info">
                        <h4>Total Litros</h4>
                        <span class="metric-value">${totalLiters.toFixed(1)} L</span>
                    </div>
                </div>
                <div class="metric-card">
                    <i class="fas fa-dollar-sign"></i>
                    <div class="metric-info">
                        <h4>Costo Total</h4>
                        <span class="metric-value">$${totalCost.toLocaleString()}</span>
                    </div>
                </div>
                <div class="metric-card">
                    <i class="fas fa-calculator"></i>
                    <div class="metric-info">
                        <h4>Precio Promedio/L</h4>
                        <span class="metric-value">$${avgPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Camión</th>
                            <th>Litros</th>
                            <th>Precio/L</th>
                            <th>Costo Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fuelRecords.map(fuel => `
                            <tr>
                                <td>${new Date(fuel.date).toLocaleDateString()}</td>
                                <td>Camión ${fuel.truckNumber || fuel.truckId}</td>
                                <td>${fuel.liters.toFixed(1)} L</td>
                                <td>$${(fuel.cost / fuel.liters).toFixed(2)}</td>
                                <td>$${(fuel.cost || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    generateDocumentsReport() {
        const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-file-alt"></i> Estado de Documentos</h3>
                <p class="report-period">Generado el: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="documents-section">
                <h4>Documentos de Camiones</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Camión</th>
                                <th>Patente</th>
                                <th>Revisión Técnica</th>
                                <th>Seguro</th>
                                <th>Permiso Circulación</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trucks.map(truck => `
                                <tr>
                                    <td>Camión ${truck.number}</td>
                                    <td>${truck.plate}</td>
                                    <td class="${this.getDocumentStatus(truck.technicalReview)}">
                                        ${truck.technicalReview ? new Date(truck.technicalReview).toLocaleDateString() : 'No registrada'}
                                    </td>
                                    <td class="${this.getDocumentStatus(truck.insuranceDate)}">
                                        ${truck.insuranceDate ? new Date(truck.insuranceDate).toLocaleDateString() : 'No registrado'}
                                    </td>
                                    <td class="${this.getDocumentStatus(truck.circulationPermitDate)}">
                                        ${truck.circulationPermitDate ? new Date(truck.circulationPermitDate).toLocaleDateString() : 'No registrado'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="documents-section">
                <h4>Documentos de Conductores</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Conductor</th>
                                <th>RUT</th>
                                <th>Licencia</th>
                                <th>Vencimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${drivers.map(driver => `
                                <tr>
                                    <td>${driver.name}</td>
                                    <td>${driver.rut}</td>
                                    <td>${driver.licenseType}</td>
                                    <td class="${this.getDocumentStatus(driver.licenseExpiry)}">
                                        ${driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'No registrada'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    generateAlertsReport() {
        const alerts = this.generateAlerts();
        
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-header">
                <h3><i class="fas fa-exclamation-triangle"></i> Alertas y Vencimientos</h3>
                <p class="report-period">Generado el: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="alerts-summary">
                <div class="alert-metric critical">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <h4>Críticas</h4>
                        <span>${alerts.filter(a => a.priority === 'high').length}</span>
                    </div>
                </div>
                <div class="alert-metric warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <h4>Advertencias</h4>
                        <span>${alerts.filter(a => a.priority === 'medium').length}</span>
                    </div>
                </div>
                <div class="alert-metric info">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <h4>Informativas</h4>
                        <span>${alerts.filter(a => a.priority === 'low').length}</span>
                    </div>
                </div>
            </div>
            
            <div class="alerts-list">
                ${alerts.map(alert => `
                    <div class="alert-item ${alert.priority}">
                        <div class="alert-icon">
                            <i class="fas ${alert.priority === 'high' ? 'fa-exclamation-circle' : alert.priority === 'medium' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                        </div>
                        <div class="alert-content">
                            <h4>${alert.title}</h4>
                            <p>${alert.message}</p>
                            <small>Categoría: ${alert.category}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getDocumentStatus(date) {
        if (!date) return 'missing';
        
        const docDate = new Date(date);
        const today = new Date();
        const diffTime = docDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'expired';
        if (diffDays <= 15) return 'expiring';
        return 'valid';
    }

    // Utilidades
    closeModal() {
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }

    viewInvoice(type, recordId) {
        // Simular la visualización de la imagen/factura
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-image"></i> Ver ${type === 'repair' ? 'Fotos' : 'Factura'}</h2>
                        <button class="modal-close" onclick="fleetManager.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 40px;">
                        <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 10px; padding: 40px; margin: 20px 0;">
                            <i class="fas fa-image" style="font-size: 4rem; color: #6c757d; margin-bottom: 20px;"></i>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">Vista previa de imagen</h3>
                            <p style="color: #6c757d;">ID del registro: ${recordId}</p>
                            <p style="color: #6c757d; font-size: 0.9rem;">En una aplicación real, aquí se mostraría la imagen cargada</p>
                        </div>
                        <div style="margin-top: 30px;">
                            <button class="btn-secondary" onclick="fleetManager.closeModal()">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
    }
    
    // Función utilitaria para mostrar modales de manera segura
    showModal(modalHTML) {
        const modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            console.error('Modal container not found');
            return false;
        }
        modalContainer.innerHTML = modalHTML;
        return true;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-CL');
    }
}

// La inicialización se maneja desde index.html