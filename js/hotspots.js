// Interactive 3D Hotspots & Information Tooltips
// Projections of 3D locations to interactive HTML glassmorphism pins

class HotspotsManager {
    constructor(scene, camera, controls, containerEl) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.container = containerEl;
        this.hotspotsData = {};
        this.pinElements = [];
        this.visible = true;
        this.activeHotspotKey = null;

        this.originalCamPos = new THREE.Vector3(9.2, 6.2, 11.4);
        this.originalTarget = new THREE.Vector3(0, 1.7, 0);
    }

    init(hotspotsData) {
        this.hotspotsData = hotspotsData;
        this.createPinElements();
    }

    createPinElements() {
        // Clear previous if any
        this.container.querySelectorAll('.hotspot-pin').forEach(el => el.remove());
        this.pinElements = [];

        Object.keys(this.hotspotsData).forEach((key, index) => {
            const data = this.hotspotsData[key];
            const pin = document.createElement('div');
            pin.className = 'hotspot-pin';
            pin.dataset.key = key;

            pin.innerHTML = `
                <div class="pin-ring"></div>
                <div class="pin-core">
                    <span class="pin-number">${index + 1}</span>
                </div>
                <div class="pin-label">${data.title.split('(')[0].trim()}</div>
            `;

            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectHotspot(key);
            });

            this.container.appendChild(pin);
            this.pinElements.push({ key, element: pin, pos: data.position });
        });
    }

    selectHotspot(key) {
        const data = this.hotspotsData[key];
        if (!data) return;

        this.activeHotspotKey = key;
        if (window.SoundEngine) SoundEngine.playBeep(900, 0.08);

        // Highlight active pin
        this.pinElements.forEach(p => {
            if (p.key === key) p.element.classList.add('active');
            else p.element.classList.remove('active');
        });

        // Camera focus animation using TWEEN
        this.focusCameraOn(data.position);

        // Display Info Modal/Card
        this.showModal(data);
    }

    focusCameraOn(targetPos) {
        if (typeof TWEEN === 'undefined') {
            this.controls.target.copy(targetPos);
            return;
        }

        // Calculate offset vector based on hotspot
        const offset = new THREE.Vector3(2.5, 1.8, 2.5);
        const destCam = targetPos.clone().add(offset);

        // Animate Camera Position
        new TWEEN.Tween(this.camera.position)
            .to({ x: destCam.x, y: destCam.y, z: destCam.z }, 1000)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

        // Animate OrbitControls Target
        new TWEEN.Tween(this.controls.target)
            .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1000)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
    }

    resetCamera() {
        if (typeof TWEEN === 'undefined') {
            this.camera.position.copy(this.originalCamPos);
            this.controls.target.copy(this.originalTarget);
            return;
        }

        new TWEEN.Tween(this.camera.position)
            .to({ x: this.originalCamPos.x, y: this.originalCamPos.y, z: this.originalCamPos.z }, 900)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

        new TWEEN.Tween(this.controls.target)
            .to({ x: this.originalTarget.x, y: this.originalTarget.y, z: this.originalTarget.z }, 900)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

        this.closeModal();
    }

    showModal(data) {
        const modal = document.getElementById('hotspot-modal');
        if (!modal) return;

        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-subtitle').textContent = data.subtitle;
        document.getElementById('modal-desc').textContent = data.desc;
        document.getElementById('modal-specs').textContent = data.specs;

        modal.classList.remove('hidden');
        modal.classList.add('visible');
    }

    closeModal() {
        const modal = document.getElementById('hotspot-modal');
        if (modal) {
            modal.classList.remove('visible');
            modal.classList.add('hidden');
        }
        this.pinElements.forEach(p => p.element.classList.remove('active'));
        this.activeHotspotKey = null;
    }

    toggleVisibility(show) {
        this.visible = show !== undefined ? show : !this.visible;
        this.pinElements.forEach(p => {
            p.element.style.display = this.visible ? 'flex' : 'none';
        });
    }

    update() {
        if (!this.visible) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const widthHalf = width / 2;
        const heightHalf = height / 2;

        const tempVec = new THREE.Vector3();

        this.pinElements.forEach(p => {
            tempVec.copy(p.pos);
            tempVec.project(this.camera);

            // Check if hotspot is behind camera
            const isBehind = tempVec.z > 1.0;

            if (isBehind) {
                p.element.style.display = 'none';
            } else {
                p.element.style.display = 'flex';
                const screenX = (tempVec.x * widthHalf) + widthHalf;
                const screenY = -(tempVec.y * heightHalf) + heightHalf;

                p.element.style.transform = `translate(-50%, -50%) translate3d(${screenX}px, ${screenY}px, 0)`;
            }
        });
    }
}

window.HotspotsManager = HotspotsManager;
