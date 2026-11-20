// Three.js Scene, Camera, Lighting, Shadows and Animation Engine

class GreenhouseScene {
    constructor(containerEl) {
        this.container = containerEl;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Lights
        this.sunLight = null;
        this.ambientLight = null;
        this.hemiLight = null;
        this.interiorLight = null;

        // Subsystems
        this.model = null;
        this.particles = null;
        this.hotspots = null;

        // State
        this.autoRotate = false;
        this.isPumping = false;
        this.sunlightPercent = 100;

        this.clock = new THREE.Clock();
        this.isRunning = false;
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a); // Deep modern slate studio

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        this.camera.position.set(9.2, 6.2, 11.4);

        // 3. Renderer with high visual fidelity
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        this.container.appendChild(this.renderer.domElement);

        // 4. OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 1.7, 0);
        this.controls.minDistance = 3.0;
        this.controls.maxDistance = 19.0;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below ground
        this.controls.minPolarAngle = 0.15;

        // 5. Lighting Setup
        this.setupLighting();

        // 6. Build 3D Model
        this.model = new GreenhouseModel(this.scene);
        const { tubePoints, wirePoints, hotspots } = this.model.build();

        // 7. Setup Particle Systems
        this.particles = new SimulationParticles(this.scene);
        this.particles.init(wirePoints, tubePoints);

        // 8. Setup Hotspots Manager
        const hotspotsContainer = document.getElementById('hotspots-layer') || this.container;
        this.hotspots = new HotspotsManager(this.scene, this.camera, this.controls, hotspotsContainer);
        this.hotspots.init(hotspots);

        // Window resize event
        window.addEventListener('resize', () => this.onWindowResize());

        // Start render loop
        this.isRunning = true;
        this.animate();
    }

    setupLighting() {
        // Ambient soft sky light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);

        // Hemisphere sky/ground bounce
        this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.5);
        this.scene.add(this.hemiLight);

        // Main Directional Sun Light (casts shadows)
        this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.6);
        this.sunLight.position.set(5.5, 9.0, 4.5);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 28;
        this.sunLight.shadow.camera.left = -8.5;
        this.sunLight.shadow.camera.right = 8.5;
        this.sunLight.shadow.camera.top = 8.5;
        this.sunLight.shadow.camera.bottom = -8.5;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);

        // Interior warm fill light inside greenhouse
        this.interiorLight = new THREE.PointLight(0xffedd5, 0.6, 6);
        this.interiorLight.position.set(0, 2.5, 0);
        this.scene.add(this.interiorLight);
    }

    setSunlight(percent) {
        this.sunlightPercent = percent;
        const norm = percent / 100;

        // Dynamic sun brightness
        this.sunLight.intensity = 0.2 + norm * 1.6;
        this.ambientLight.intensity = 0.2 + norm * 0.5;
        this.interiorLight.intensity = 0.2 + norm * 0.6;

        // Color temperature shifts from dusk blue (overcast) to warm daylight
        if (norm < 0.35) {
            this.scene.background.setHex(0x0a0f1d); // Overcast cool dusk
            this.sunLight.color.setHex(0x93c5fd);
        } else {
            this.scene.background.setHex(0x0f172a); // Bright studio
            this.sunLight.color.setHex(0xfffbeb);
        }

        // Update solar energy particles speed & brightness
        if (this.particles) {
            this.particles.setEnergyIntensity(percent);
        }
    }

    setPumpState(isActive) {
        this.isPumping = isActive;
        if (this.model) this.model.setPumpActive(isActive);
        if (this.particles) this.particles.setWaterFlow(isActive);
    }

    setWaterDrainProgress(normalizedLevel) {
        if (this.model) this.model.setWaterDrainProgress(normalizedLevel);
    }

    setSoilMoisture(percent) {
        if (this.model) this.model.setSoilMoistureVisual(percent);
    }

    setXRayMode(isXRay) {
        if (this.model) this.model.setXRayMode(isXRay);
    }

    setGrowLightState(isOn) {
        if (this.model) this.model.setGrowLightActive(isOn);
    }

    setFanState(isOn) {
        if (this.model) this.model.setFanActive(isOn);
    }

    setPlantHealth(cropId, state) {
        if (this.model) this.model.setPlantHealth(cropId, state);
    }

    updateSensorIndicators(sensorData) {
        if (this.model) this.model.updateSensorIndicators(sensorData);
    }

    setCameraPreset(presetName) {
        if (typeof TWEEN === 'undefined') return;

        let targetPos = new THREE.Vector3(0, 1.7, 0);
        let camPos = new THREE.Vector3(7.8, 5.5, 9.2);

        switch (presetName) {
            case 'front':
                camPos = new THREE.Vector3(0, 2.8, 8.8);
                targetPos = new THREE.Vector3(0, 1.8, 0);
                break;
            case 'top':
                camPos = new THREE.Vector3(0, 10.8, 0.1);
                targetPos = new THREE.Vector3(0, 1.2, 0);
                break;
            case 'electronics':
                camPos = new THREE.Vector3(1.2, 2.2, 2.6);
                targetPos = new THREE.Vector3(0.1, 0.4, 0.2);
                break;
            case 'pump':
                camPos = new THREE.Vector3(-1.8, 2.4, 2.8);
                targetPos = new THREE.Vector3(-0.85, 1.2, 0.7);
                break;
            case 'solar':
            case 'light_sensor':
                camPos = new THREE.Vector3(3.6, 5.0, 3.2);
                targetPos = new THREE.Vector3(1.5, 3.7, 0.8);
                break;
            case 'sensors':
            case 'dht22':
                camPos = new THREE.Vector3(0.4, 3.6, 3.4);
                targetPos = new THREE.Vector3(0.0, 2.5, 0.6);
                break;
            case 'reservoir':
            case 'water_level':
                camPos = new THREE.Vector3(-3.8, 2.7, 3.1);
                targetPos = new THREE.Vector3(-2.4, 1.2, 0.9);
                break;
            case 'health_sensor':
                camPos = new THREE.Vector3(3.6, 3.3, 1.4);
                targetPos = new THREE.Vector3(1.8, 2.2, -0.35);
                break;
            case 'plants':
            case 'tomatoes':
            case 'tomato1':
                camPos = new THREE.Vector3(3.1, 3.0, 2.7);
                targetPos = new THREE.Vector3(1.5, 1.5, 0.4);
                break;
            case 'cucumbers':
            case 'cucumber1':
                camPos = new THREE.Vector3(-4.2, 3.1, 1.6);
                targetPos = new THREE.Vector3(-2.4, 1.7, -0.9);
                break;
            case 'default':
            default:
                camPos = new THREE.Vector3(9.2, 6.2, 11.4);
                targetPos = new THREE.Vector3(0, 1.7, 0);
                break;
        }

        new TWEEN.Tween(this.camera.position)
            .to({ x: camPos.x, y: camPos.y, z: camPos.z }, 950)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

        new TWEEN.Tween(this.controls.target)
            .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 950)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // 1. OrbitControls damping & auto-rotate
        this.controls.autoRotate = this.autoRotate;
        this.controls.autoRotateSpeed = 1.2;
        this.controls.update();

        // 2. TWEEN Camera animations
        if (typeof TWEEN !== 'undefined') {
            TWEEN.update();
        }

        // 3. Pump motor physical vibration
        if (this.model) {
            this.model.updatePumpVibration(time, this.isPumping);
        }

        // 4. Particle systems (solar energy & water flow)
        if (this.particles) {
            this.particles.update(delta);
        }

        // 5. Project 3D hotspots to 2D screen
        if (this.hotspots) {
            this.hotspots.update();
        }

        // 6. Render
        this.renderer.render(this.scene, this.camera);
    }
}

window.GreenhouseScene = GreenhouseScene;
