// Smart Greenhouse Main Application Controller
// Orchestrates UI, 3D Scene, Multi-Sensor Physics, Automatic Phone Alerts & Remote Control

class SmartGreenhouseApp {
    constructor() {
        this.scene = null;

        // Core Sensor & System State
        this.sunlight = 100;         // 0 - 100 % (BH1750 / LDR Light Sensor Panel)
        this.temperature = 26.0;     // °C (DHT22)
        this.manualTempOverride = false;
        this.airHumidity = 64;       // % (DHT22)
        this.moisture = 65;          // 0 - 100 % (YL-69 Soil Moisture)
        this.waterLevel = 100;       // 0 - 100 % (HC-SR04 Water Level)

        // Actuators
        this.isPumpOn = false;
        this.isFanOn = false;
        this.growLightMode = 'auto'; // 'auto' | 'on' | 'off'
        this.isGrowLightOn = false;

        // Plant Health State (AI Optical + MQ-135 Rot Sensor)
        this.cropHealth = {
            tomato1: 'healthy',
            tomato2: 'healthy',
            cucumber1: 'healthy',
            cucumber2: 'healthy'
        };
        this.overwaterTicks = 0;

        // UI & Mode Flags
        this.isXRayOn = false;
        this.isAutoSimOn = true;
        this.soundEnabled = true;
        this.isPhoneOpen = false;

        // Manager Phone Automatic Alerts Feed
        this.alerts = [];
        this.activeAlertCodes = new Set();
        this.alertIdCounter = 1;

        // UI Element Cache
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.initScene();
        this.bindEvents();
        this.seedInitialWelcomeAlert();
        this.evaluateLightSensor(false);
        this.updateTelemetry();
        this.initQRCode();
        this.startClockAndSimulation();

        // Start with phone docked neatly so the full 3D greenhouse + crops shine immediately
        if (this.elements.phonePanel) {
            this.elements.phonePanel.classList.add('phone-hidden');
        }

        // Remove loading overlay after initialization
        setTimeout(() => {
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.classList.add('fade-out');
                setTimeout(() => loader.remove(), 550);
            }
        }, 500);
    }

    cacheElements() {
        this.elements = {
            // Sliders
            sunSlider: document.getElementById('sunlight-slider'),
            sunValue: document.getElementById('sunlight-value'),
            tempSlider: document.getElementById('temp-slider'),
            tempSliderValue: document.getElementById('temp-slider-value'),
            moistureSlider: document.getElementById('moisture-slider'),
            moistureValue: document.getElementById('moisture-value'),

            // Left Telemetry Displays
            powerVal: document.getElementById('telemetry-power'),
            voltageVal: document.getElementById('telemetry-voltage'),
            currentVal: document.getElementById('telemetry-current'),
            luxVal: document.getElementById('telemetry-lux'),
            growLightStatus: document.getElementById('telemetry-growlight-status'),
            moistureDisplay: document.getElementById('telemetry-moisture'),
            moistureBar: document.getElementById('moisture-progress-bar'),
            pumpStatus: document.getElementById('telemetry-pump-status'),
            pumpBadge: document.getElementById('pump-indicator-badge'),
            fanStatus: document.getElementById('telemetry-fan-status'),
            tempVal: document.getElementById('telemetry-temp'),
            tempStatus: document.getElementById('telemetry-temp-status'),
            airHumidityVal: document.getElementById('telemetry-air-humidity'),
            reservoirVal: document.getElementById('telemetry-reservoir'),
            reservoirBar: document.getElementById('reservoir-progress-bar'),
            reservoirNote: document.getElementById('telemetry-reservoir-note'),

            // Crop Status Chips
            cropChipTomato: document.getElementById('crop-chip-tomato1'),
            cropStateTomato: document.getElementById('crop-state-tomato1'),
            cropChipCucumber: document.getElementById('crop-chip-cucumber1'),
            cropStateCucumber: document.getElementById('crop-state-cucumber1'),

            // Sensor Catalog Cards & Readings
            sensorCardDht: document.getElementById('sensor-card-dht22'),
            sensorReadDht: document.getElementById('sensor-read-dht22'),
            sensorCardMoisture: document.getElementById('sensor-card-moisture'),
            sensorReadMoisture: document.getElementById('sensor-read-moisture'),
            sensorCardLight: document.getElementById('sensor-card-light'),
            sensorReadLight: document.getElementById('sensor-read-light'),
            sensorCardWater: document.getElementById('sensor-card-water'),
            sensorReadWater: document.getElementById('sensor-read-water'),
            sensorCardHealth: document.getElementById('sensor-card-health'),
            sensorReadHealth: document.getElementById('sensor-read-health'),

            // Top & Control Buttons
            phoneNavBtn: document.getElementById('btn-manager-phone'),
            topAlertBadge: document.getElementById('top-alert-badge'),
            dockAlertBadge: document.getElementById('dock-alert-badge'),
            leftDashboard: document.getElementById('panel-left-dashboard'),
            rightControls: document.getElementById('panel-right-controls'),
            xrayBtn: document.getElementById('btn-xray'),
            autoRotateBtn: document.getElementById('btn-auto-rotate'),
            soundBtn: document.getElementById('btn-sound'),
            autoSimBtn: document.getElementById('btn-auto-sim'),
            resetCamBtn: document.getElementById('btn-reset-cam'),
            qrBtn: document.getElementById('btn-qr-modal'),
            helpBtn: document.getElementById('btn-help-modal'),
            refillBtn: document.getElementById('btn-refill-water'),

            // Fault Scenario Buttons
            simRotTomatoBtn: document.getElementById('btn-sim-rot-tomato'),
            simRotCucumberBtn: document.getElementById('btn-sim-rot-cucumber'),
            simEmptyWaterBtn: document.getElementById('btn-sim-empty-water'),
            simOverheatBtn: document.getElementById('btn-sim-overheat'),
            simRestoreAllBtn: document.getElementById('btn-sim-restore-all'),

            // Manager Phone Elements
            phonePanel: document.getElementById('manager-phone-panel'),
            closePhoneBtn: document.getElementById('btn-close-phone'),
            phoneClock: document.getElementById('phone-clock'),
            phoneAlertsList: document.getElementById('phone-alerts-list'),
            phoneStatTemp: document.getElementById('phone-stat-temp'),
            phoneStatAir: document.getElementById('phone-stat-air'),
            phoneStatSoil: document.getElementById('phone-stat-soil'),
            phoneStatWater: document.getElementById('phone-stat-water'),
            phoneStatLux: document.getElementById('phone-stat-lux'),
            phoneStatCrops: document.getElementById('phone-stat-crops'),
            phoneTogglePump: document.getElementById('phone-toggle-pump'),
            phoneToggleFan: document.getElementById('phone-toggle-fan'),
            phoneToggleLight: document.getElementById('phone-toggle-light'),
            phoneBtnRefill: document.getElementById('phone-btn-refill'),
            phoneBtnCure: document.getElementById('phone-btn-cure'),

            // Toast & Modals
            toastStack: document.getElementById('push-toast-stack'),
            qrModal: document.getElementById('qr-modal'),
            helpModal: document.getElementById('help-modal'),
            hotspotModal: document.getElementById('hotspot-modal')
        };
    }

    initScene() {
        const container = document.getElementById('canvas-container');
        this.scene = new GreenhouseScene(container);
        this.scene.init();

        this.scene.setSunlight(this.sunlight);
        this.scene.setSoilMoisture(this.moisture);
    }

    bindEvents() {
        // Left Panel Tabs (Телеметрия / Датчиктер)
        document.querySelectorAll('[data-left-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.leftTab;
                document.querySelectorAll('[data-left-tab]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('left-pane-telemetry').classList.toggle('hidden-pane', tab !== 'telemetry');
                document.getElementById('left-pane-sensors').classList.toggle('hidden-pane', tab !== 'sensors');
                if (window.SoundEngine) SoundEngine.playBeep(720, 0.04);
            });
        });

        // Sensor Catalog Item Click -> Zoom 3D Camera & Open Sensor Hotspot Info
        document.querySelectorAll('[data-sensor-focus]').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.dataset.sensorFocus;
                if (window.innerWidth <= 900 && this.elements.leftDashboard) {
                    this.elements.leftDashboard.classList.remove('mobile-open');
                    document.querySelectorAll('[data-mobile-view]').forEach(b => b.classList.toggle('active', b.dataset.mobileView === '3d'));
                }
                if (this.scene && this.scene.hotspots) {
                    this.scene.hotspots.selectHotspot(key);
                }
            });
        });

        // Crop Chip Click -> Focus Camera on Tomatoes or Cucumbers
        document.querySelectorAll('[data-focus-cam]').forEach(chip => {
            chip.addEventListener('click', () => {
                if (window.innerWidth <= 900 && this.elements.leftDashboard) {
                    this.elements.leftDashboard.classList.remove('mobile-open');
                    document.querySelectorAll('[data-mobile-view]').forEach(b => b.classList.toggle('active', b.dataset.mobileView === '3d'));
                }
                if (this.scene) this.scene.setCameraPreset(chip.dataset.focusCam);
                if (window.SoundEngine) SoundEngine.playBeep(760, 0.05);
            });
        });

        // Mobile Bottom Navigation Dock View Switcher
        document.querySelectorAll('[data-mobile-view]').forEach(dockBtn => {
            dockBtn.addEventListener('click', () => {
                this.setMobileView(dockBtn.dataset.mobileView);
            });
        });

        // Mobile Sheet Close Buttons
        document.querySelectorAll('[data-close-sheet]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMobileView('3d');
            });
        });

        // Manager Phone Toggle
        if (this.elements.phoneNavBtn) {
            this.elements.phoneNavBtn.addEventListener('click', () => this.togglePhonePanel());
        }
        if (this.elements.closePhoneBtn) {
            this.elements.closePhoneBtn.addEventListener('click', () => this.togglePhonePanel(false));
        }

        // Phone Bottom Tabs (Сигналдар / Бақылау / Пульт)
        document.querySelectorAll('[data-phone-tab]').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                this.switchPhoneTab(tabBtn.dataset.phoneTab);
                if (window.SoundEngine) SoundEngine.playBeep(780, 0.04);
            });
        });

        // Phone Remote Controls
        if (this.elements.phoneTogglePump) {
            this.elements.phoneTogglePump.addEventListener('click', () => {
                if (this.isPumpOn) {
                    this.deactivatePump();
                } else {
                    if (this.waterLevel <= 5) {
                        this.pushAlert('water_empty', 'critical', '🚰 Резервуарда су бітті (0%)!', 'Су қоры жоқ болғандықтан сорғы қосылмады. Алдымен су құйыңыз.', [
                            { label: '🔄 Су құю', action: 'refill', style: 'fix-btn' }
                        ]);
                    } else {
                        this.activatePump();
                    }
                }
            });
        }

        if (this.elements.phoneToggleFan) {
            this.elements.phoneToggleFan.addEventListener('click', () => {
                this.setFan(!this.isFanOn, true);
            });
        }

        if (this.elements.phoneToggleLight) {
            this.elements.phoneToggleLight.addEventListener('click', () => {
                // Cycle: auto -> on -> off -> auto
                if (this.growLightMode === 'auto') this.growLightMode = 'on';
                else if (this.growLightMode === 'on') this.growLightMode = 'off';
                else this.growLightMode = 'auto';
                this.evaluateLightSensor(false);
                if (window.SoundEngine) SoundEngine.playBeep(720, 0.05);
                this.updateTelemetry();
            });
        }

        if (this.elements.phoneBtnRefill) {
            this.elements.phoneBtnRefill.addEventListener('click', () => this.refillWater());
        }

        if (this.elements.phoneBtnCure) {
            this.elements.phoneBtnCure.addEventListener('click', () => this.cureAllPlants());
        }

        // Sliders
        if (this.elements.sunSlider) {
            this.elements.sunSlider.addEventListener('input', (e) => {
                this.setSunlight(parseFloat(e.target.value));
            });
        }

        if (this.elements.tempSlider) {
            this.elements.tempSlider.addEventListener('input', (e) => {
                this.manualTempOverride = true;
                this.setTemperature(parseFloat(e.target.value));
            });
        }

        if (this.elements.moistureSlider) {
            this.elements.moistureSlider.addEventListener('input', (e) => {
                this.setMoisture(parseFloat(e.target.value));
            });
        }

        // Quick Preset Buttons
        document.querySelectorAll('[data-preset-sun]').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseFloat(btn.dataset.presetSun);
                this.elements.sunSlider.value = val;
                this.setSunlight(val);
                if (window.SoundEngine) SoundEngine.playBeep(700, 0.05);
            });
        });

        document.querySelectorAll('[data-preset-moisture]').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseFloat(btn.dataset.presetMoisture);
                this.elements.moistureSlider.value = val;
                this.setMoisture(val);
                if (window.SoundEngine) SoundEngine.playBeep(700, 0.05);
            });
        });

        // Fault / Emergency Scenario Test Triggers
        if (this.elements.simRotTomatoBtn) {
            this.elements.simRotTomatoBtn.addEventListener('click', () => this.triggerPlantRot('tomato1', true));
        }
        if (this.elements.simRotCucumberBtn) {
            this.elements.simRotCucumberBtn.addEventListener('click', () => this.triggerPlantRot('cucumber1', true));
        }
        if (this.elements.simEmptyWaterBtn) {
            this.elements.simEmptyWaterBtn.addEventListener('click', () => this.triggerEmptyReservoir());
        }
        if (this.elements.simOverheatBtn) {
            this.elements.simOverheatBtn.addEventListener('click', () => this.triggerOverheat());
        }
        if (this.elements.simRestoreAllBtn) {
            this.elements.simRestoreAllBtn.addEventListener('click', () => this.restoreHealthyState());
        }

        // Camera Preset Buttons
        document.querySelectorAll('[data-cam-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.scene.setCameraPreset(btn.dataset.camPreset);
                if (window.SoundEngine) SoundEngine.playBeep(750, 0.05);
            });
        });

        // Top Bar Utility Toggles
        if (this.elements.xrayBtn) this.elements.xrayBtn.addEventListener('click', () => this.toggleXRay());
        if (this.elements.autoRotateBtn) this.elements.autoRotateBtn.addEventListener('click', () => this.toggleAutoRotate());
        if (this.elements.soundBtn) this.elements.soundBtn.addEventListener('click', () => this.toggleSound());

        if (this.elements.autoSimBtn) {
            this.elements.autoSimBtn.addEventListener('click', () => {
                this.isAutoSimOn = !this.isAutoSimOn;
                this.elements.autoSimBtn.classList.toggle('active', this.isAutoSimOn);
                if (window.SoundEngine) SoundEngine.playBeep(650, 0.05);
            });
        }

        if (this.elements.resetCamBtn) {
            this.elements.resetCamBtn.addEventListener('click', () => {
                this.scene.setCameraPreset('default');
                if (this.scene.hotspots) this.scene.hotspots.closeModal();
                if (window.SoundEngine) SoundEngine.playBeep(600, 0.06);
            });
        }

        if (this.elements.refillBtn) {
            this.elements.refillBtn.addEventListener('click', () => this.refillWater());
        }

        // Modals
        if (this.elements.qrBtn) {
            this.elements.qrBtn.addEventListener('click', () => {
                this.elements.qrModal.classList.remove('hidden');
                if (window.SoundEngine) SoundEngine.playBeep(800, 0.06);
            });
        }

        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', () => {
                this.elements.helpModal.classList.remove('hidden');
                if (window.SoundEngine) SoundEngine.playBeep(800, 0.06);
            });
        }

        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                if (modal) modal.classList.add('hidden');
                if (this.scene && this.scene.hotspots) this.scene.hotspots.closeModal();
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.add('hidden');
            });
        });

        const toggleHotspotsBtn = document.getElementById('btn-toggle-hotspots');
        if (toggleHotspotsBtn) {
            toggleHotspotsBtn.addEventListener('click', () => {
                if (this.scene && this.scene.hotspots) {
                    const nextVisible = !this.scene.hotspots.visible;
                    this.scene.hotspots.toggleVisibility(nextVisible);
                    toggleHotspotsBtn.classList.toggle('active', nextVisible);
                    if (window.SoundEngine) SoundEngine.playBeep(700, 0.05);
                }
            });
        }
    }

    // --- Manager Phone & Automatic Signal Notification Engine ---

    seedInitialWelcomeAlert() {
        this.alerts.unshift({
            id: this.alertIdCounter++,
            code: 'system_ready',
            severity: 'info',
            title: '✅ Жылыжай бақылауға қосылды',
            desc: 'Барлық 5 датчик (Температура, Ылғалдылық, Жарық панелі, Су деңгейі, Шіру сканері) қалыпты жұмыс істеп тұр.',
            time: this.getTimeString(),
            resolved: true,
            actions: []
        });
        this.renderPhoneAlerts();
    }

    togglePhonePanel(forceState) {
        this.isPhoneOpen = forceState !== undefined ? forceState : !this.isPhoneOpen;
        if (this.elements.phonePanel) {
            this.elements.phonePanel.classList.toggle('phone-hidden', !this.isPhoneOpen);
        }
        if (this.elements.phoneNavBtn) {
            this.elements.phoneNavBtn.classList.toggle('active', this.isPhoneOpen);
        }
        const dockPhoneBtn = document.querySelector('[data-mobile-view="phone"]');
        if (dockPhoneBtn) {
            dockPhoneBtn.classList.toggle('active', this.isPhoneOpen);
        }
        if (this.isPhoneOpen && window.innerWidth <= 900) {
            if (this.elements.leftDashboard) this.elements.leftDashboard.classList.remove('mobile-open');
            if (this.elements.rightControls) this.elements.rightControls.classList.remove('mobile-open');
        }
        if (window.SoundEngine) SoundEngine.playBeep(this.isPhoneOpen ? 820 : 540, 0.05);
    }

    setMobileView(view) {
        document.querySelectorAll('[data-mobile-view]').forEach(b => {
            b.classList.toggle('active', b.dataset.mobileView === view);
        });

        const leftPanel = this.elements.leftDashboard;
        const rightPanel = this.elements.rightControls;

        if (view === '3d') {
            if (leftPanel) leftPanel.classList.remove('mobile-open');
            if (rightPanel) rightPanel.classList.remove('mobile-open');
            if (this.isPhoneOpen) this.togglePhonePanel(false);
            if (window.SoundEngine) SoundEngine.playBeep(680, 0.04);
        } else if (view === 'telemetry') {
            if (leftPanel) leftPanel.classList.add('mobile-open');
            if (rightPanel) rightPanel.classList.remove('mobile-open');
            if (this.isPhoneOpen) this.togglePhonePanel(false);
            document.querySelectorAll('[data-left-tab]').forEach(b => b.classList.toggle('active', b.dataset.leftTab === 'telemetry'));
            const pTel = document.getElementById('left-pane-telemetry');
            const pSen = document.getElementById('left-pane-sensors');
            if (pTel) pTel.classList.remove('hidden-pane');
            if (pSen) pSen.classList.add('hidden-pane');
            if (window.SoundEngine) SoundEngine.playBeep(720, 0.04);
        } else if (view === 'sensors') {
            if (leftPanel) leftPanel.classList.add('mobile-open');
            if (rightPanel) rightPanel.classList.remove('mobile-open');
            if (this.isPhoneOpen) this.togglePhonePanel(false);
            document.querySelectorAll('[data-left-tab]').forEach(b => b.classList.toggle('active', b.dataset.leftTab === 'sensors'));
            const pTel = document.getElementById('left-pane-telemetry');
            const pSen = document.getElementById('left-pane-sensors');
            if (pTel) pTel.classList.add('hidden-pane');
            if (pSen) pSen.classList.remove('hidden-pane');
            if (window.SoundEngine) SoundEngine.playBeep(740, 0.04);
        } else if (view === 'controls') {
            if (rightPanel) rightPanel.classList.add('mobile-open');
            if (leftPanel) leftPanel.classList.remove('mobile-open');
            if (this.isPhoneOpen) this.togglePhonePanel(false);
            if (window.SoundEngine) SoundEngine.playBeep(740, 0.04);
        } else if (view === 'phone') {
            if (leftPanel) leftPanel.classList.remove('mobile-open');
            if (rightPanel) rightPanel.classList.remove('mobile-open');
            this.togglePhonePanel(!this.isPhoneOpen);
            if (!this.isPhoneOpen) {
                document.querySelectorAll('[data-mobile-view]').forEach(b => b.classList.toggle('active', b.dataset.mobileView === '3d'));
            }
        }
    }

    switchPhoneTab(tabName) {
        document.querySelectorAll('[data-phone-tab]').forEach(b => {
            b.classList.toggle('active', b.dataset.phoneTab === tabName);
        });
        ['alerts', 'monitor', 'remote'].forEach(pane => {
            const el = document.getElementById(`phone-pane-${pane}`);
            if (el) el.classList.toggle('hidden-pane', pane !== tabName);
        });
    }

    getTimeString() {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    }

    pushAlert(code, severity, title, desc, actions = [], forceDuplicate = false) {
        if (!forceDuplicate && this.activeAlertCodes.has(code)) {
            return;
        }
        if (severity !== 'info') {
            this.activeAlertCodes.add(code);
        }

        const alertObj = {
            id: this.alertIdCounter++,
            code,
            severity,
            title,
            desc,
            time: this.getTimeString(),
            resolved: severity === 'info',
            actions
        };

        this.alerts.unshift(alertObj);
        if (this.alerts.length > 20) this.alerts.pop();

        this.renderPhoneAlerts();
        this.showFloatingToast(alertObj);

        if (window.SoundEngine) {
            SoundEngine.playAlertSound(severity);
        }
    }

    resolveAlertByCode(code) {
        this.activeAlertCodes.delete(code);
        this.alerts.forEach(a => {
            if (a.code === code) a.resolved = true;
        });
        this.renderPhoneAlerts();
    }

    showFloatingToast(alertObj) {
        if (!this.elements.toastStack) return;

        const toast = document.createElement('div');
        toast.className = `push-toast ${alertObj.severity}`;
        toast.innerHTML = `
            <div class="push-toast-head">
                <span class="push-toast-app">📲 SmartTeplica • Басшыға сигнал</span>
                <span>Қазір</span>
            </div>
            <div class="push-toast-msg">${alertObj.title}</div>
            <div class="push-toast-sub">${alertObj.desc}</div>
        `;

        toast.addEventListener('click', () => {
            this.togglePhonePanel(true);
            this.switchPhoneTab('alerts');
            toast.remove();
        });

        this.elements.toastStack.prepend(toast);

        // Keep max 3 toasts visible
        while (this.elements.toastStack.children.length > 3) {
            this.elements.toastStack.lastChild.remove();
        }

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                toast.style.transition = 'all 0.25s ease';
                setTimeout(() => toast.remove(), 260);
            }
        }, 6200);
    }

    executePhoneAction(actionName) {
        switch (actionName) {
            case 'refill':
                this.refillWater();
                break;
            case 'cure_tomato':
                this.curePlant('tomato1');
                break;
            case 'cure_cucumber':
                this.curePlant('cucumber1');
                break;
            case 'cure_all':
                this.cureAllPlants();
                break;
            case 'fan_on':
                this.setFan(true, true);
                break;
            case 'cam_tomato':
                if (this.scene) this.scene.setCameraPreset('tomato1');
                break;
            case 'cam_cucumber':
                if (this.scene) this.scene.setCameraPreset('cucumber1');
                break;
            case 'cam_reservoir':
                if (this.scene) this.scene.setCameraPreset('reservoir');
                break;
            case 'cam_dht22':
                if (this.scene) this.scene.setCameraPreset('dht22');
                break;
            case 'cam_light':
                if (this.scene) this.scene.setCameraPreset('light_sensor');
                break;
        }
    }

    renderPhoneAlerts() {
        const activeCount = this.alerts.filter(a => !a.resolved && a.severity !== 'info').length;

        if (this.elements.topAlertBadge) {
            this.elements.topAlertBadge.textContent = String(activeCount);
            this.elements.topAlertBadge.classList.toggle('zero', activeCount === 0);
        }
        if (this.elements.dockAlertBadge) {
            this.elements.dockAlertBadge.textContent = String(activeCount);
            this.elements.dockAlertBadge.classList.toggle('zero', activeCount === 0);
        }
        if (this.elements.phoneNavBtn) {
            this.elements.phoneNavBtn.classList.toggle('has-alerts', activeCount > 0);
        }

        if (!this.elements.phoneAlertsList) return;
        this.elements.phoneAlertsList.innerHTML = '';

        this.alerts.forEach(item => {
            const card = document.createElement('div');
            card.className = `phone-alert-card ${item.severity} ${item.resolved ? 'resolved' : ''}`;

            let actionsHtml = '';
            if (item.actions && item.actions.length > 0 && !item.resolved) {
                actionsHtml = `<div class="phone-alert-actions">${item.actions.map(act =>
                    `<button class="phone-mini-btn ${act.style || ''}" data-phone-act="${act.action}">${act.label}</button>`
                ).join('')}</div>`;
            }

            const statusBadge = item.resolved ? '✓ Шешілді' : (item.severity === 'critical' ? '● ШҰҒЫЛ' : '● ЕСКЕРТУ');

            card.innerHTML = `
                <div class="phone-alert-meta">
                    <span>${statusBadge}</span>
                    <span>${item.time}</span>
                </div>
                <div class="phone-alert-title">${item.title}</div>
                <div class="phone-alert-desc">${item.desc}</div>
                ${actionsHtml}
            `;

            card.querySelectorAll('[data-phone-act]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.executePhoneAction(btn.dataset.phoneAct);
                });
            });

            this.elements.phoneAlertsList.appendChild(card);
        });
    }

    // --- Sensor & Actuator Logic ---

    setSunlight(percent) {
        this.sunlight = Math.max(0, Math.min(100, percent));
        if (this.elements.sunValue) this.elements.sunValue.textContent = `${Math.round(this.sunlight)}%`;
        if (this.scene) this.scene.setSunlight(this.sunlight);

        // If user hasn't manually pinned temperature, sunlight gently drives natural temp
        if (!this.manualTempOverride) {
            this.temperature = 19 + (this.sunlight / 100) * 11;
            if (this.elements.tempSlider) this.elements.tempSlider.value = Math.round(this.temperature);
        }

        this.evaluateLightSensor(true);
        this.updateTelemetry();
    }

    evaluateLightSensor(notifyOnAutoTrigger = true) {
        const prev = this.isGrowLightOn;
        if (this.growLightMode === 'on') {
            this.isGrowLightOn = true;
        } else if (this.growLightMode === 'off') {
            this.isGrowLightOn = false;
        } else {
            // Auto mode: Light Sensor Panel turns ON Grow Light when sunlight < 35%
            this.isGrowLightOn = this.sunlight < 35;
        }

        if (this.scene) this.scene.setGrowLightState(this.isGrowLightOn);

        if (notifyOnAutoTrigger && this.growLightMode === 'auto' && this.isGrowLightOn && !prev) {
            this.pushAlert(
                'low_light_grow',
                'info',
                '💡 Жарық датчигі: Фитожарық қосылды',
                'Панель жарық датчигі (BH1750) жарық жетіспеуін анықтап, LED фитожарықты автоматты қосты.',
                [{ label: '📍 Жарық панелі', action: 'cam_light' }]
            );
        }
    }

    setTemperature(tempC) {
        this.temperature = Math.max(10, Math.min(45, tempC));
        if (this.elements.tempSlider) this.elements.tempSlider.value = Math.round(this.temperature);
        if (this.elements.tempSliderValue) this.elements.tempSliderValue.textContent = `${Math.round(this.temperature)} °C`;

        // High Temperature Alert (> 35°C)
        if (this.temperature >= 35) {
            this.pushAlert(
                'temp_high',
                'critical',
                `🔥 ДАБЫЛ: Температура тым жоғары (${this.temperature.toFixed(1)}°C)!`,
                'DHT22 датчигі қызып кетуді тіркеді. Помидор мен қияр күйіп кетпеуі үшін желдеткішті қосыңыз.',
                [
                    { label: '🌀 Желдету', action: 'fan_on', style: 'fix-btn' },
                    { label: '📍 DHT22 көру', action: 'cam_dht22' }
                ]
            );
        } else if (this.temperature <= 15) {
            this.pushAlert(
                'temp_low',
                'warning',
                `❄️ ЕСКЕРТУ: Температура төмен (${this.temperature.toFixed(1)}°C)`,
                'Жылыжай салқындап кетті. Өсімдіктердің өсуі баяулауы мүмкін.',
                [{ label: '📍 DHT22 көру', action: 'cam_dht22' }]
            );
        } else {
            this.resolveAlertByCode('temp_high');
            this.resolveAlertByCode('temp_low');
        }

        this.updateTelemetry();
    }

    setMoisture(percent) {
        this.moisture = Math.max(0, Math.min(100, percent));
        if (this.elements.moistureValue) this.elements.moistureValue.textContent = `${Math.round(this.moisture)}%`;
        if (this.scene) this.scene.setSoilMoisture(this.moisture);

        // Automatic Irrigation Threshold Logic: ON < 30%, OFF >= 80%
        if (this.moisture < 30 && !this.isPumpOn) {
            if (this.waterLevel > 5) {
                this.activatePump();
                this.pushAlert(
                    'soil_dry',
                    'info',
                    '💧 Топырақ құрғады (<30%) — Суару басталды',
                    'YL-69 датчигі құрғақтықты анықтады. Реле арқылы су сорғысы автоматты қосылды.',
                    []
                );
            } else {
                this.pushAlert(
                    'water_empty',
                    'critical',
                    '🚰 ДАБЫЛ: Резервуарда су бітті (0%)!',
                    'Өсімдіктер шөлдеп тұр, бірақ резервуар бос! Шұғыл түрде резервуарға су құйыңыз.',
                    [
                        { label: '🔄 Су құю', action: 'refill', style: 'fix-btn' },
                        { label: '📍 Резервуар', action: 'cam_reservoir' }
                    ]
                );
            }
        } else if (this.moisture >= 80 && this.isPumpOn) {
            this.deactivatePump();
        }

        this.updateTelemetry();
    }

    setFan(isOn, fromUser = false) {
        this.isFanOn = isOn;
        if (this.scene) this.scene.setFanState(isOn);
        if (fromUser && window.SoundEngine) SoundEngine.playBeep(isOn ? 840 : 520, 0.06);
        this.updateTelemetry();
    }

    activatePump() {
        this.isPumpOn = true;
        if (this.scene) this.scene.setPumpState(true);
        if (window.SoundEngine) {
            SoundEngine.playRelayClick(true);
            SoundEngine.startPump();
        }
        this.updateTelemetry();
    }

    deactivatePump() {
        this.isPumpOn = false;
        if (this.scene) this.scene.setPumpState(false);
        if (window.SoundEngine) {
            SoundEngine.playRelayClick(false);
            SoundEngine.stopPump();
        }
        this.updateTelemetry();
    }

    refillWater() {
        this.waterLevel = 100;
        if (this.scene) this.scene.setWaterDrainProgress(1.0);
        this.resolveAlertByCode('water_empty');
        this.resolveAlertByCode('water_low');
        if (window.SoundEngine) {
            SoundEngine.playSuccessSound();
            SoundEngine.startWaterTrickle();
            setTimeout(() => SoundEngine.stopWaterTrickle(), 900);
        }
        this.updateTelemetry();
    }

    // --- Fault Demo Scenarios & Plant Rot Handling ---

    triggerPlantRot(cropId = 'tomato1', openPhone = true) {
        const isTomato = cropId.startsWith('tomato');
        this.cropHealth[cropId] = 'rotting';
        if (this.scene) {
            this.scene.setPlantHealth(cropId, 'rotting');
            this.scene.setCameraPreset(cropId);
        }

        const cropLabel = isTomato ? 'Помидор (Аймақ №1)' : 'Қияр (Аймақ №1)';
        const emoji = isTomato ? '🍅' : '🥒';
        const code = isTomato ? 'rot_tomato' : 'rot_cucumber';

        this.pushAlert(
            code,
            'critical',
            `${emoji} ДАБЫЛ: ${cropLabel} шіріп жатыр!`,
            'AI-камера мен MQ-135 газ датчигі жапырақ сарғаюы мен шіру белгісін анықтады. Желдетуді қосып, өсімдікті емдеңіз!',
            [
                { label: '🩺 Емдеу + Желдету', action: isTomato ? 'cure_tomato' : 'cure_cucumber', style: 'fix-btn' },
                { label: '📍 3D көру', action: isTomato ? 'cam_tomato' : 'cam_cucumber' }
            ],
            true
        );

        if (openPhone && !this.isPhoneOpen) {
            this.togglePhonePanel(true);
            this.switchPhoneTab('alerts');
        }
        this.updateTelemetry();
    }

    curePlant(cropId) {
        this.cropHealth[cropId] = 'healthy';
        if (this.scene) this.scene.setPlantHealth(cropId, 'healthy');
        if (cropId.startsWith('tomato')) this.resolveAlertByCode('rot_tomato');
        if (cropId.startsWith('cucumber')) this.resolveAlertByCode('rot_cucumber');
        this.setFan(true, false);
        if (this.moisture > 78) {
            this.moisture = 60;
            if (this.elements.moistureSlider) this.elements.moistureSlider.value = 60;
            if (this.elements.moistureValue) this.elements.moistureValue.textContent = '60%';
            if (this.scene) this.scene.setSoilMoisture(60);
        }
        if (window.SoundEngine) SoundEngine.playSuccessSound();
        this.updateTelemetry();
    }

    cureAllPlants() {
        Object.keys(this.cropHealth).forEach(id => {
            this.cropHealth[id] = 'healthy';
            if (this.scene) this.scene.setPlantHealth(id, 'healthy');
        });
        this.resolveAlertByCode('rot_tomato');
        this.resolveAlertByCode('rot_cucumber');
        if (this.moisture > 80) {
            this.moisture = 62;
            if (this.elements.moistureSlider) this.elements.moistureSlider.value = 62;
            if (this.elements.moistureValue) this.elements.moistureValue.textContent = '62%';
            if (this.scene) this.scene.setSoilMoisture(62);
        }
        if (window.SoundEngine) SoundEngine.playSuccessSound();
        this.updateTelemetry();
    }

    triggerEmptyReservoir() {
        this.waterLevel = 0;
        if (this.isPumpOn) this.deactivatePump();
        if (this.scene) {
            this.scene.setWaterDrainProgress(0.0);
            this.scene.setCameraPreset('reservoir');
        }
        this.pushAlert(
            'water_empty',
            'critical',
            '🚰 ДАБЫЛ: Резервуарда су бітті (0%)!',
            'HC-SR04 ультрадыбыстық датчигі резервуардың бос екенін тіркеді. Сорғы құрғақ айналудан қорғалып өшірілді!',
            [
                { label: '🔄 Су құю (100%)', action: 'refill', style: 'fix-btn' },
                { label: '📍 Резервуар', action: 'cam_reservoir' }
            ],
            true
        );
        if (!this.isPhoneOpen) {
            this.togglePhonePanel(true);
            this.switchPhoneTab('alerts');
        }
        this.updateTelemetry();
    }

    triggerOverheat() {
        this.manualTempOverride = true;
        this.setTemperature(40);
        if (this.scene) this.scene.setCameraPreset('dht22');
        if (!this.isPhoneOpen) {
            this.togglePhonePanel(true);
            this.switchPhoneTab('alerts');
        }
    }

    restoreHealthyState() {
        this.manualTempOverride = false;
        this.sunlight = 90;
        if (this.elements.sunSlider) this.elements.sunSlider.value = 90;
        if (this.elements.sunValue) this.elements.sunValue.textContent = '90%';
        if (this.scene) this.scene.setSunlight(90);

        this.temperature = 25.5;
        if (this.elements.tempSlider) this.elements.tempSlider.value = 26;

        this.moisture = 62;
        if (this.elements.moistureSlider) this.elements.moistureSlider.value = 62;
        if (this.elements.moistureValue) this.elements.moistureValue.textContent = '62%';
        if (this.scene) this.scene.setSoilMoisture(62);

        this.waterLevel = 100;
        if (this.scene) this.scene.setWaterDrainProgress(1.0);

        if (this.isPumpOn) this.deactivatePump();
        this.setFan(false, false);
        this.growLightMode = 'auto';
        this.evaluateLightSensor(false);

        Object.keys(this.cropHealth).forEach(id => {
            this.cropHealth[id] = 'healthy';
            if (this.scene) this.scene.setPlantHealth(id, 'healthy');
        });

        ['rot_tomato', 'rot_cucumber', 'water_empty', 'water_low', 'temp_high', 'temp_low'].forEach(code => {
            this.resolveAlertByCode(code);
        });

        if (this.scene) this.scene.setCameraPreset('default');
        if (window.SoundEngine) SoundEngine.playSuccessSound();
        this.updateTelemetry();
    }

    toggleXRay() {
        this.isXRayOn = !this.isXRayOn;
        if (this.elements.xrayBtn) this.elements.xrayBtn.classList.toggle('active', this.isXRayOn);
        if (this.scene) this.scene.setXRayMode(this.isXRayOn);
        if (window.SoundEngine) SoundEngine.playBeep(this.isXRayOn ? 850 : 500, 0.08);
    }

    toggleAutoRotate() {
        if (!this.scene) return;
        this.scene.autoRotate = !this.scene.autoRotate;
        if (this.elements.autoRotateBtn) this.elements.autoRotateBtn.classList.toggle('active', this.scene.autoRotate);
        if (window.SoundEngine) SoundEngine.playBeep(650, 0.05);
    }

    toggleSound() {
        if (window.SoundEngine) {
            this.soundEnabled = SoundEngine.toggleMute();
            if (this.elements.soundBtn) {
                this.elements.soundBtn.classList.toggle('active', this.soundEnabled);
                this.elements.soundBtn.querySelector('.btn-icon').textContent = this.soundEnabled ? '🔊' : '🔇';
            }
        }
    }

    updateTelemetry() {
        const sunNorm = this.sunlight / 100;
        const voltage = (5.0 * sunNorm).toFixed(2);
        const current = (0.40 * sunNorm).toFixed(2);
        const power = (2.00 * sunNorm).toFixed(2);
        const lux = Math.round(sunNorm * 48500 + (this.isGrowLightOn ? 12000 : 120));

        // Calculate realistic Air Humidity (DHT22)
        const baseAir = 45 + (this.moisture * 0.35) - (this.isFanOn ? 10 : 0) + (this.temperature > 32 ? -5 : 4);
        this.airHumidity = Math.round(Math.max(25, Math.min(96, baseAir)));

        const tomatoRotting = this.cropHealth.tomato1 === 'rotting' || this.cropHealth.tomato2 === 'rotting';
        const cucumberRotting = this.cropHealth.cucumber1 === 'rotting' || this.cropHealth.cucumber2 === 'rotting';
        const hasRot = tomatoRotting || cucumberRotting;

        // 1. Solar & Light Panel Sensor
        if (this.elements.powerVal) this.elements.powerVal.textContent = `${power} W`;
        if (this.elements.voltageVal) this.elements.voltageVal.textContent = `${voltage} V`;
        if (this.elements.currentVal) this.elements.currentVal.textContent = `${(current * 1000).toFixed(0)} mA`;
        if (this.elements.luxVal) this.elements.luxVal.textContent = `${lux.toLocaleString('ru-RU')} Lux`;
        if (this.elements.growLightStatus) {
            this.elements.growLightStatus.textContent = this.isGrowLightOn ? '💡 Фито: ҚОСУЛЫ' : '💡 Фито: ӨШІРУЛІ';
            this.elements.growLightStatus.style.color = this.isGrowLightOn ? '#e879f9' : '#94a3b8';
        }

        // 2. DHT22 Temp & Air Humidity
        if (this.elements.tempVal) this.elements.tempVal.textContent = `${this.temperature.toFixed(1)} °C`;
        if (this.elements.tempSliderValue) this.elements.tempSliderValue.textContent = `${Math.round(this.temperature)} °C`;
        if (this.elements.tempStatus) {
            if (this.temperature >= 35) {
                this.elements.tempStatus.textContent = 'DHT22 • ҚЫЗЫП КЕТТІ!';
                this.elements.tempStatus.style.color = '#fb7185';
            } else if (this.temperature <= 15) {
                this.elements.tempStatus.textContent = 'DHT22 • САЛҚЫН';
                this.elements.tempStatus.style.color = '#38bdf8';
            } else {
                this.elements.tempStatus.textContent = 'DHT22 • Қалыпты';
                this.elements.tempStatus.style.color = '';
            }
        }
        if (this.elements.airHumidityVal) this.elements.airHumidityVal.textContent = `${this.airHumidity}%`;

        // 3. Soil Moisture
        if (this.elements.moistureDisplay) this.elements.moistureDisplay.textContent = `${Math.round(this.moisture)}%`;
        if (this.elements.moistureBar) {
            this.elements.moistureBar.style.width = `${Math.min(100, Math.max(0, this.moisture))}%`;
            if (this.moisture < 30) this.elements.moistureBar.className = 'progress-bar bg-rose-500';
            else if (this.moisture > 80) this.elements.moistureBar.className = 'progress-bar bg-blue-500';
            else this.elements.moistureBar.className = 'progress-bar bg-emerald-500';
        }

        // 4. Pump & Fan Indicators
        if (this.elements.pumpStatus) {
            this.elements.pumpStatus.textContent = this.isPumpOn ? 'ҚОСУЛЫ (ON)' : 'ӨШІРУЛІ';
            this.elements.pumpStatus.className = this.isPumpOn ? 'telemetry-status-badge active-glow' : 'telemetry-status-badge inactive';
        }
        if (this.elements.fanStatus) {
            this.elements.fanStatus.textContent = this.isFanOn ? 'ҚОСУЛЫ (ON)' : 'ӨШІРУЛІ';
            this.elements.fanStatus.className = this.isFanOn ? 'telemetry-status-badge active-glow' : 'telemetry-status-badge inactive';
        }

        // 5. Reservoir Level
        if (this.elements.reservoirVal) this.elements.reservoirVal.textContent = `${Math.round(this.waterLevel)}%`;
        if (this.elements.reservoirBar) {
            this.elements.reservoirBar.style.width = `${Math.round(this.waterLevel)}%`;
            this.elements.reservoirBar.className = this.waterLevel <= 20 ? 'progress-bar bg-rose-500' : 'progress-bar bg-blue-500';
        }
        if (this.elements.reservoirNote) {
            this.elements.reservoirNote.textContent = this.waterLevel <= 5
                ? '⚠️ Су бітті! Шұғыл құйыңыз'
                : this.waterLevel <= 20 ? '⚠️ Су қоры аз қалды' : 'Қоры жеткілікті';
            this.elements.reservoirNote.style.color = this.waterLevel <= 20 ? '#fb7185' : '';
        }

        // 6. Crop Health Chips
        if (this.elements.cropChipTomato && this.elements.cropStateTomato) {
            this.elements.cropChipTomato.classList.toggle('rotting', tomatoRotting);
            this.elements.cropStateTomato.textContent = tomatoRotting ? '⚠️ ШІРІП ЖАТЫР!' : '● Сау';
        }
        if (this.elements.cropChipCucumber && this.elements.cropStateCucumber) {
            this.elements.cropChipCucumber.classList.toggle('rotting', cucumberRotting);
            this.elements.cropStateCucumber.textContent = cucumberRotting ? '⚠️ ШІРІП ЖАТЫР!' : '● Сау';
        }

        // 7. Sensor Catalog Live Readings & Alert Highlights
        if (this.elements.sensorReadDht) this.elements.sensorReadDht.textContent = `${this.temperature.toFixed(0)}°C / ${this.airHumidity}%`;
        if (this.elements.sensorCardDht) this.elements.sensorCardDht.classList.toggle('status-alert', this.temperature >= 35 || this.temperature <= 15);

        if (this.elements.sensorReadMoisture) this.elements.sensorReadMoisture.textContent = `${Math.round(this.moisture)}%`;
        if (this.elements.sensorCardMoisture) this.elements.sensorCardMoisture.classList.toggle('status-alert', this.moisture < 30 || this.moisture > 85);

        if (this.elements.sensorReadLight) this.elements.sensorReadLight.textContent = `${(lux / 1000).toFixed(1)}k Lux`;
        if (this.elements.sensorCardLight) this.elements.sensorCardLight.classList.toggle('status-alert', this.sunlight < 25);

        if (this.elements.sensorReadWater) this.elements.sensorReadWater.textContent = `${Math.round(this.waterLevel)}%`;
        if (this.elements.sensorCardWater) this.elements.sensorCardWater.classList.toggle('status-alert', this.waterLevel <= 20);

        if (this.elements.sensorReadHealth) this.elements.sensorReadHealth.textContent = hasRot ? 'ШІРУ ДАБЫЛЫ!' : 'Барлығы сау';
        if (this.elements.sensorCardHealth) this.elements.sensorCardHealth.classList.toggle('status-alert', hasRot);

        // 8. Manager Phone Live Stats & Remote Switches
        if (this.elements.phoneStatTemp) this.elements.phoneStatTemp.textContent = `${this.temperature.toFixed(1)}°C`;
        if (this.elements.phoneStatAir) this.elements.phoneStatAir.textContent = `${this.airHumidity}%`;
        if (this.elements.phoneStatSoil) this.elements.phoneStatSoil.textContent = `${Math.round(this.moisture)}%`;
        if (this.elements.phoneStatWater) this.elements.phoneStatWater.textContent = `${Math.round(this.waterLevel)}%`;
        if (this.elements.phoneStatLux) this.elements.phoneStatLux.textContent = `${(lux / 1000).toFixed(1)}k Lx`;
        if (this.elements.phoneStatCrops) {
            this.elements.phoneStatCrops.textContent = hasRot ? '⚠️ Шіру бар!' : 'Барлығы сау';
            this.elements.phoneStatCrops.style.color = hasRot ? '#fb7185' : '#34d399';
        }

        if (this.elements.phoneTogglePump) {
            this.elements.phoneTogglePump.textContent = this.isPumpOn ? 'ҚОСУЛЫ' : 'ӨШІРУЛІ';
            this.elements.phoneTogglePump.classList.toggle('on', this.isPumpOn);
        }
        if (this.elements.phoneToggleFan) {
            this.elements.phoneToggleFan.textContent = this.isFanOn ? 'ҚОСУЛЫ' : 'ӨШІРУЛІ';
            this.elements.phoneToggleFan.classList.toggle('on', this.isFanOn);
        }
        if (this.elements.phoneToggleLight) {
            const lbl = this.growLightMode === 'auto' ? (this.isGrowLightOn ? 'АВТО (ҚОС)' : 'АВТО') : (this.growLightMode === 'on' ? 'ҚОСУЛЫ' : 'ӨШІРУЛІ');
            this.elements.phoneToggleLight.textContent = lbl;
            this.elements.phoneToggleLight.classList.toggle('on', this.isGrowLightOn);
        }

        // 9. Update 3D Physical Sensor LEDs
        if (this.scene) {
            this.scene.updateSensorIndicators({
                moisture: this.moisture,
                temp: this.temperature,
                lightPercent: this.sunlight,
                waterLevel: this.waterLevel,
                hasRot
            });
        }
    }

    startClockAndSimulation() {
        // Real-time clock on Manager Phone
        const updateClock = () => {
            if (this.elements.phoneClock) {
                const now = new Date();
                this.elements.phoneClock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            }
        };
        updateClock();
        setInterval(updateClock, 1000);

        // Continuous biological, climate & sensor monitoring loop
        setInterval(() => {
            // 1. Pump & Reservoir Water Depletion
            if (this.isPumpOn) {
                this.waterLevel = Math.max(0, this.waterLevel - 0.55);
                if (this.scene) this.scene.setWaterDrainProgress(this.waterLevel / 100);

                if (this.waterLevel <= 20 && this.waterLevel > 5) {
                    this.pushAlert(
                        'water_low',
                        'warning',
                        '💧 ЕСКЕРТУ: Резервуарда су азайды (<20%)',
                        'HC-SR04 датчигі су қорының төмендегенін хабарлайды. Жақында су құю қажет.',
                        [{ label: '🔄 Су құю', action: 'refill', style: 'fix-btn' }]
                    );
                }

                if (this.waterLevel <= 0) {
                    this.deactivatePump();
                    this.pushAlert(
                        'water_empty',
                        'critical',
                        '🚰 ДАБЫЛ: Резервуарда су бітті (0%)!',
                        'Су қоры толық таусылды, сорғы автоматты өшірілді. Резервуарды толтырыңыз!',
                        [
                            { label: '🔄 Су құю', action: 'refill', style: 'fix-btn' },
                            { label: '📍 Резервуар', action: 'cam_reservoir' }
                        ]
                    );
                }

                if (this.isAutoSimOn && this.moisture < 85 && this.waterLevel > 0) {
                    this.moisture += 1.2;
                    if (this.elements.moistureSlider) this.elements.moistureSlider.value = this.moisture;
                    this.setMoisture(this.moisture);
                }
            } else if (this.isAutoSimOn && this.moisture > 22) {
                const evapSpeed = 0.04 + (this.sunlight / 100) * 0.06 + (this.isFanOn ? 0.08 : 0);
                this.moisture -= evapSpeed;
                if (this.elements.moistureSlider) this.elements.moistureSlider.value = this.moisture;
                this.setMoisture(this.moisture);
            }

            // 2. Fan Cooling Effect
            if (this.isFanOn && this.temperature > 23.5) {
                this.temperature = Math.max(23.5, this.temperature - 0.16);
                if (this.elements.tempSlider) this.elements.tempSlider.value = Math.round(this.temperature);
                if (this.temperature < 34) this.resolveAlertByCode('temp_high');
                this.updateTelemetry();
            }

            // 3. Natural Overwatering Root-Rot Risk Detection (>88% moisture sustained)
            if (this.moisture >= 88 && this.cropHealth.tomato1 === 'healthy') {
                this.overwaterTicks++;
                if (this.overwaterTicks >= 22) { // ~3.3s of extreme overwatering
                    this.overwaterTicks = 0;
                    this.triggerPlantRot('tomato1', false);
                }
            } else {
                this.overwaterTicks = Math.max(0, this.overwaterTicks - 1);
            }
        }, 150);
    }

    computeLocalWifiUrl() {
        const port = window.location.port || '8080';
        const knownLocalIp = '192.168.100.67';

        // If already opened via an IP address (e.g. 192.168.x.x)
        if (window.location.hostname && window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        }
        // If opened via localhost or 127.0.0.1
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const pName = window.location.pathname.startsWith('/') ? window.location.pathname : '/index.html';
            return `http://${knownLocalIp}:${port}${pName}`;
        }
        // If opened via file:/// protocol or others
        return `http://${knownLocalIp}:8080/index.html`;
    }

    generateQRCode(url) {
        if (!url) return;
        this.currentQrUrl = url.trim();
        const qrContainer = document.getElementById('qrcode-box');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: this.currentQrUrl,
                width: 200,
                height: 200,
                colorDark: '#090d16',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
        const displayEl = document.getElementById('qr-display-url');
        if (displayEl) {
            displayEl.textContent = this.currentQrUrl;
        }
        const customInput = document.getElementById('qr-custom-url-input');
        if (customInput) {
            customInput.value = this.currentQrUrl;
        }
    }

    initQRCode() {
        this.wifiUrl = this.computeLocalWifiUrl();
        let savedOnlineUrl = '';
        try {
            savedOnlineUrl = localStorage.getItem('smart_greenhouse_online_url') || '';
        } catch (e) {}
        this.onlineUrl = savedOnlineUrl || 'https://smart-greenhouse-zerde.vercel.app';
        this.currentQrUrl = '';

        // If the current window is on a real public domain (not file, localhost or local numeric IP)
        const host = window.location.hostname || '';
        const isLocalHost = !host || host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) || window.location.protocol.startsWith('file');

        if (!isLocalHost) {
            this.onlineUrl = window.location.href;
            try {
                localStorage.setItem('smart_greenhouse_online_url', this.onlineUrl);
            } catch (e) {}
            this.activeQrMode = 'online';
            this.generateQRCode(this.onlineUrl);
            const tabOnline = document.getElementById('qr-tab-online');
            const tabWifi = document.getElementById('qr-tab-wifi');
            if (tabOnline) tabOnline.classList.add('active');
            if (tabWifi) tabWifi.classList.remove('active');
        } else {
            this.activeQrMode = 'wifi';
            this.generateQRCode(this.wifiUrl);
        }

        this.bindQREvents();
    }

    bindQREvents() {
        const tabWifi = document.getElementById('qr-tab-wifi');
        const tabOnline = document.getElementById('qr-tab-online');
        const tabCustom = document.getElementById('qr-tab-custom');
        const customRow = document.getElementById('qr-custom-input-row');
        const customInput = document.getElementById('qr-custom-url-input');
        const generateBtn = document.getElementById('btn-generate-custom-qr');
        const copyBtn = document.getElementById('btn-copy-qr-url');
        const step1 = document.getElementById('qr-step-1');
        const step2 = document.getElementById('qr-step-2');
        const step3 = document.getElementById('qr-step-3');

        const setTab = (activeTab) => {
            [tabWifi, tabOnline, tabCustom].forEach(t => {
                if (t) t.classList.toggle('active', t === activeTab);
            });
        };

        const updateInstructions = (mode) => {
            if (!step1 || !step2 || !step3) return;
            if (mode === 'wifi') {
                step1.textContent = 'Телефон мен компьютерді бір Wi-Fi желісіне (немесе телефонның точка доступасына) қосыңыз.';
                step2.textContent = 'Смартфон камерасымен осы QR-кодты сканерлеп, сілтемені ашыңыз.';
                step3.textContent = 'Офлайн сервер арқылы қосымша 100% жергілікті желіде жылдам ашылады!';
            } else if (mode === 'online') {
                step1.textContent = 'Vercel немесе GitHub Pages арқылы кез келген интернет желісінде ашылады.';
                step2.textContent = 'Смартфон камерасымен QR-кодты сканерлеп, тікелей онлайн кіріңіз.';
                step3.textContent = 'Сайт сілтемесін жаңарту қажет болса, «✏️ Қолмен енгізу» батырмасын басыңыз.';
            } else {
                step1.textContent = 'Жоғарыдағы өріске өз Vercel, ngrok немесе жергілікті IP сілтемеңізді жазыңыз.';
                step2.textContent = '«Сақтау & QR жасау» түймесін басыңыз (QR-код автоматты жаңарады).';
                step3.textContent = 'Жаңа QR-кодты телефонмен сканерлеп, тексеріңіз.';
            }
        };

        if (tabWifi) {
            tabWifi.addEventListener('click', () => {
                setTab(tabWifi);
                if (customRow) customRow.classList.add('hidden');
                this.generateQRCode(this.wifiUrl);
                updateInstructions('wifi');
                if (window.SoundEngine) SoundEngine.playBeep(700, 0.04);
            });
        }

        if (tabOnline) {
            tabOnline.addEventListener('click', () => {
                setTab(tabOnline);
                if (customRow) customRow.classList.add('hidden');
                this.generateQRCode(this.onlineUrl);
                updateInstructions('online');
                if (window.SoundEngine) SoundEngine.playBeep(700, 0.04);
            });
        }

        if (tabCustom) {
            tabCustom.addEventListener('click', () => {
                setTab(tabCustom);
                if (customRow) customRow.classList.remove('hidden');
                if (customInput) {
                    customInput.value = this.currentQrUrl;
                    customInput.focus();
                }
                updateInstructions('custom');
                if (window.SoundEngine) SoundEngine.playBeep(700, 0.04);
            });
        }

        if (generateBtn && customInput) {
            const doGen = () => {
                const val = customInput.value.trim();
                if (val) {
                    if (val.startsWith('http://') || val.startsWith('https://')) {
                        if (!val.includes('192.168.') && !val.includes('127.0.0.1') && !val.includes('localhost')) {
                            this.onlineUrl = val;
                            try {
                                localStorage.setItem('smart_greenhouse_online_url', val);
                            } catch (e) {}
                        }
                    }
                    this.generateQRCode(val);
                    if (window.SoundEngine) SoundEngine.playSuccessSound();
                }
            };
            generateBtn.addEventListener('click', doGen);
            customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') doGen();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                if (!this.currentQrUrl) return;
                const copyText = this.currentQrUrl;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(copyText).then(() => {
                        copyBtn.textContent = '✓ Көшірілді!';
                        setTimeout(() => { copyBtn.textContent = '📋 Көшіру'; }, 2000);
                    }).catch(() => {
                        this.fallbackCopy(copyText, copyBtn);
                    });
                } else {
                    this.fallbackCopy(copyText, copyBtn);
                }
                if (window.SoundEngine) SoundEngine.playBeep(850, 0.05);
            });
        }
    }

    fallbackCopy(text, btn) {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
            if (btn) {
                btn.textContent = '✓ Көшірілді!';
                setTimeout(() => { btn.textContent = '📋 Көшіру'; }, 2000);
            }
        } catch (e) {}
        document.body.removeChild(temp);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new SmartGreenhouseApp();
    window.app.init();
});
