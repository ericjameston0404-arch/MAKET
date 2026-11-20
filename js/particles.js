// Particle Systems for Smart Greenhouse Simulation
// 1. Solar electrical energy flow particles along power wire
// 2. Liquid water droplet flow along silicone tube & soil splash

class SimulationParticles {
    constructor(scene) {
        this.scene = scene;
        this.energyParticles = null;
        this.waterParticles = null;
        this.waterSplashes = null;

        this.wireCurve = null;
        this.tubeCurve = null;

        this.energySpeed = 1.0;
        this.isWaterFlowing = false;
    }

    init(wirePathPoints, tubePathPoints) {
        // 1. Define 3D CatmullRom curves for wire and tube
        this.wireCurve = new THREE.CatmullRomCurve3(wirePathPoints);
        this.tubeCurve = new THREE.CatmullRomCurve3(tubePathPoints);

        this.initEnergyParticles();
        this.initWaterParticles();
        this.initWaterSplashes();
    }

    // Solar Electricity Energy Flow Particles
    initEnergyParticles() {
        const count = 45;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const progress = new Float32Array(count);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            progress[i] = i / count;
            const pt = this.wireCurve.getPointAt(progress[i]);
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;

            sizes[i] = 0.18 + Math.random() * 0.12;

            // Radiant golden-yellow to energetic electric-amber
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
            colors[i * 3 + 2] = 0.2;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Canvas circular glow texture for particles
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        radGrad.addColorStop(0.3, 'rgba(250, 204, 21, 0.9)');
        radGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.4)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, 64, 64);
        const pTex = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: 0.24,
            map: pTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.energyParticles = new THREE.Points(geom, mat);
        this.energyParticles.userData = { progress, count };
        this.scene.add(this.energyParticles);
    }

    // Water Droplet Particles in Silicone Tube
    initWaterParticles() {
        const count = 60;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const progress = new Float32Array(count);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            progress[i] = i / count;
            const pt = this.tubeCurve.getPointAt(progress[i]);
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;

            // Cyan/Aqua water hue
            colors[i * 3] = 0.2;
            colors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
            colors[i * 3 + 2] = 1.0;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Water droplet glow texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        radGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.9)');
        radGrad.addColorStop(0.8, 'rgba(2, 132, 199, 0.4)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, 64, 64);
        const wTex = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: 0.22,
            map: wTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.0, // hidden when not pumping
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.waterParticles = new THREE.Points(geom, mat);
        this.waterParticles.userData = { progress, count };
        this.scene.add(this.waterParticles);
    }

    // Splashes & Drops at the Soil Plant Exit
    initWaterSplashes() {
        const count = 20;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        // Plant pot soil position (where tube terminates)
        const soilExit = this.tubeCurve.getPointAt(1.0);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = soilExit.x + (Math.random() - 0.5) * 0.2;
            positions[i * 3 + 1] = soilExit.y - Math.random() * 0.15;
            positions[i * 3 + 2] = soilExit.z + (Math.random() - 0.5) * 0.2;

            velocities.push({
                vx: (Math.random() - 0.5) * 0.015,
                vy: -0.01 - Math.random() * 0.02,
                vz: (Math.random() - 0.5) * 0.015,
                life: Math.random()
            });
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.14,
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.waterSplashes = new THREE.Points(geom, mat);
        this.waterSplashes.userData = { velocities, count, soilExit };
        this.scene.add(this.waterSplashes);
    }

    setEnergyIntensity(sunPercent) {
        // 0% -> speed 0, opacity low
        // 100% -> speed fast, opacity high
        this.energySpeed = (sunPercent / 100) * 0.45;
        if (this.energyParticles) {
            this.energyParticles.material.opacity = Math.max(0.1, (sunPercent / 100) * 0.95);
            this.energyParticles.material.size = 0.12 + (sunPercent / 100) * 0.18;
        }
    }

    setWaterFlow(isFlowing) {
        this.isWaterFlowing = isFlowing;
        if (this.waterParticles) {
            this.waterParticles.material.opacity = isFlowing ? 0.95 : 0.0;
        }
        if (this.waterSplashes) {
            this.waterSplashes.material.opacity = isFlowing ? 0.8 : 0.0;
        }
    }

    update(delta = 0.016) {
        // 1. Update Energy Particles along wire
        if (this.energyParticles && this.wireCurve) {
            const { progress, count } = this.energyParticles.userData;
            const posAttr = this.energyParticles.geometry.attributes.position;

            for (let i = 0; i < count; i++) {
                // Move along curve from solar panel (0) to controller (1)
                progress[i] = (progress[i] + this.energySpeed * delta) % 1.0;
                const pt = this.wireCurve.getPointAt(progress[i]);
                posAttr.setXYZ(i, pt.x, pt.y, pt.z);
            }
            posAttr.needsUpdate = true;
        }

        // 2. Update Water Droplets in Tube
        if (this.isWaterFlowing && this.waterParticles && this.tubeCurve) {
            const { progress, count } = this.waterParticles.userData;
            const posAttr = this.waterParticles.geometry.attributes.position;
            const flowSpeed = 0.75; // rapid water flow through hose

            for (let i = 0; i < count; i++) {
                progress[i] = (progress[i] + flowSpeed * delta) % 1.0;
                const pt = this.tubeCurve.getPointAt(progress[i]);
                // subtle radial wobble inside tube
                const wobble = Math.sin(progress[i] * 30 + Date.now() * 0.005) * 0.015;
                posAttr.setXYZ(i, pt.x + wobble, pt.y, pt.z + wobble);
            }
            posAttr.needsUpdate = true;

            // 3. Update Splash Droplets at plant pot exit
            if (this.waterSplashes) {
                const { velocities, count, soilExit } = this.waterSplashes.userData;
                const splashAttr = this.waterSplashes.geometry.attributes.position;

                for (let i = 0; i < count; i++) {
                    const v = velocities[i];
                    v.life += delta * 2.5;

                    let px = splashAttr.getX(i) + v.vx;
                    let py = splashAttr.getY(i) + v.vy;
                    let pz = splashAttr.getZ(i) + v.vz;

                    if (v.life >= 1.0 || py < soilExit.y - 0.4) {
                        // Reset to nozzle mouth
                        v.life = 0;
                        px = soilExit.x + (Math.random() - 0.5) * 0.1;
                        py = soilExit.y;
                        pz = soilExit.z + (Math.random() - 0.5) * 0.1;
                    }

                    splashAttr.setXYZ(i, px, py, pz);
                }
                splashAttr.needsUpdate = true;
            }
        }
    }
}

window.SimulationParticles = SimulationParticles;
