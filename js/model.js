// 3D Procedural Model of the Smart Greenhouse Physical Prototype
// 100% faithful digital twin matching uploaded photos (18044.jpg, 18039.jpg, 18038.jpg)

class GreenhouseModel {
    constructor(scene) {
        this.scene = scene;
        this.root = new THREE.Group();
        this.exteriorGroup = new THREE.Group();
        this.interiorGroup = new THREE.Group();

        this.root.add(this.exteriorGroup);
        this.root.add(this.interiorGroup);
        this.scene.add(this.root);

        // References for dynamic animations
        this.waterMesh = null;
        this.waterInitialY = 0.65;
        this.waterLevel = 1.0; // 0.0 to 1.0
        this.pumpMesh = null;
        this.relayLed = null;
        this.solarPanel = null;
        this.tubeMesh = null;
        this.soilMesh1 = null;
        this.soilMesh2 = null;
        this.soilMeshes = [];

        // Crop zones (tomatoes & cucumbers) for dynamic health/rot visuals
        this.crops = {};
        // 3D Sensor status LEDs
        this.sensorLeds = {};
        // Smart Actuators: LED Grow Light & Ventilation Fan
        this.growLightEmissiveMat = null;
        this.growPointLight = null;
        this.fanBlades = null;
        this.fanLed = null;
        this.isFanOn = false;
        this.isGrowLightOn = false;
        this.alertBlinkState = { waterLow: false, hasRot: false, tempHigh: false };

        // Path coordinates for particles and tube
        this.tubePoints = [];
        this.wirePoints = [];

        // Materials cache for X-Ray toggling
        this.exteriorMaterials = [];
        this.glassMaterials = [];

        // Interactive hotspots anchors
        this.hotspots = {};
    }

    build() {
        this.buildBaseTray();
        this.buildGreenhouseFrameAndGlass();
        this.buildBlueConstructorStructure();
        this.buildWaterReservoir();
        this.buildWaterPump();
        this.buildPlantsAndPots();
        this.buildSurroundingGardenBeds();
        this.buildFloorFoliage();
        this.buildElectronicsAndRelay();
        this.buildSolarPanel();
        this.buildAdditionalSensors();
        this.buildGrowLightPanel();
        this.buildVentilationFan();
        this.buildSiliconeTube();
        this.buildWiringNetwork();
        this.buildGroundAndEnvironment();

        return {
            tubePoints: this.tubePoints,
            wirePoints: this.wirePoints,
            hotspots: this.hotspots
        };
    }

    // 1. Red Base Tray (Тұғыр)
    buildBaseTray() {
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xbe123c, // Vivid red matching the photo
            roughness: 0.45,
            metalness: 0.1
        });
        this.exteriorMaterials.push(redMat);

        const length = 7.2;
        const width = 4.2;
        const wallH = 0.65;
        const wallThick = 0.14;

        // Bottom floor plate
        const floorGeo = new THREE.BoxGeometry(length, 0.15, width);
        const floorMesh = new THREE.Mesh(floorGeo, redMat);
        floorMesh.position.set(0, 0.075, 0);
        floorMesh.receiveShadow = true;
        this.exteriorGroup.add(floorMesh);

        // 4 Raised boundary walls (front, back, left, right)
        // Front wall (+Z)
        const frontWallGeo = new THREE.BoxGeometry(length, wallH, wallThick);
        const frontWall = new THREE.Mesh(frontWallGeo, redMat);
        frontWall.position.set(0, wallH / 2, width / 2 - wallThick / 2);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.exteriorGroup.add(frontWall);

        // Back wall (-Z)
        const backWall = new THREE.Mesh(frontWallGeo, redMat);
        backWall.position.set(0, wallH / 2, -width / 2 + wallThick / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.exteriorGroup.add(backWall);

        // Left wall (-X)
        const sideWallGeo = new THREE.BoxGeometry(wallThick, wallH, width - wallThick * 2);
        const leftWall = new THREE.Mesh(sideWallGeo, redMat);
        leftWall.position.set(-length / 2 + wallThick / 2, wallH / 2, 0);
        leftWall.castShadow = true;
        this.exteriorGroup.add(leftWall);

        // Right wall (+X)
        const rightWall = new THREE.Mesh(sideWallGeo, redMat);
        rightWall.position.set(length / 2 - wallThick / 2, wallH / 2, 0);
        rightWall.castShadow = true;
        this.exteriorGroup.add(rightWall);
    }

    // 2. White Frame & High-Transparency Glass (Жақтаулар мен әйнек)
    buildGreenhouseFrameAndGlass() {
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.25,
            metalness: 0.15
        });
        this.exteriorMaterials.push(frameMat);

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xdbeafe,
            transparent: true,
            opacity: 0.38,
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.65,
            ior: 1.5,
            reflectivity: 0.6,
            depthWrite: false
        });
        this.glassMaterials.push(glassMat);

        const halfL = 3.6;
        const halfW = 2.1;
        const eaveY = 3.6;
        const ridgeY = 5.4;
        const baseY = 0.65;
        const strutW = 0.12;

        const makeBeam = (x1, y1, z1, x2, y2, z2) => {
            const p1 = new THREE.Vector3(x1, y1, z1);
            const p2 = new THREE.Vector3(x2, y2, z2);
            const dist = p1.distanceTo(p2);
            const cyl = new THREE.BoxGeometry(strutW, dist, strutW);
            const mesh = new THREE.Mesh(cyl, frameMat);
            const mid = p1.clone().add(p2).multiplyScalar(0.5);
            mesh.position.copy(mid);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
            mesh.castShadow = true;
            this.exteriorGroup.add(mesh);
        };

        // 4 Vertical Corner Posts
        makeBeam(-halfL, baseY, -halfW, -halfL, eaveY, -halfW);
        makeBeam(-halfL, baseY, halfW, -halfL, eaveY, halfW);
        makeBeam(halfL, baseY, -halfW, halfL, eaveY, -halfW);
        makeBeam(halfL, baseY, halfW, halfL, eaveY, halfW);

        // Center posts on long sides
        makeBeam(0, baseY, -halfW, 0, eaveY, -halfW);
        makeBeam(0, baseY, halfW, 0, eaveY, halfW);

        // Horizontal Eaves Beams
        makeBeam(-halfL, eaveY, -halfW, halfL, eaveY, -halfW);
        makeBeam(-halfL, eaveY, halfW, halfL, eaveY, halfW);
        makeBeam(-halfL, eaveY, -halfW, -halfL, eaveY, halfW);
        makeBeam(halfL, eaveY, -halfW, halfL, eaveY, halfW);

        // Triangular Gable Roof Trusses (Left and Right)
        makeBeam(-halfL, eaveY, -halfW, -halfL, ridgeY, 0);
        makeBeam(-halfL, eaveY, halfW, -halfL, ridgeY, 0);
        makeBeam(halfL, eaveY, -halfW, halfL, ridgeY, 0);
        makeBeam(halfL, eaveY, halfW, halfL, ridgeY, 0);

        // Center Roof Gable Rafters
        makeBeam(0, eaveY, -halfW, 0, ridgeY, 0);
        makeBeam(0, eaveY, halfW, 0, ridgeY, 0);

        // Top Ridge Beam
        makeBeam(-halfL, ridgeY, 0, halfL, ridgeY, 0);

        // Glass Panes
        // Left Triangular Gable Glass
        const leftGableShape = new THREE.Shape();
        leftGableShape.moveTo(-halfW, eaveY);
        leftGableShape.lineTo(halfW, eaveY);
        leftGableShape.lineTo(0, ridgeY);
        leftGableShape.closePath();
        const leftGableGeo = new THREE.ShapeGeometry(leftGableShape);
        const leftGable = new THREE.Mesh(leftGableGeo, glassMat);
        leftGable.rotation.y = Math.PI / 2;
        leftGable.position.x = -halfL;
        this.exteriorGroup.add(leftGable);

        // Right Triangular Gable Glass
        const rightGable = new THREE.Mesh(leftGableGeo, glassMat);
        rightGable.rotation.y = -Math.PI / 2;
        rightGable.position.x = halfL;
        this.exteriorGroup.add(rightGable);

        // Wall Glass Panes (Front & Back)
        const wallGlassGeo = new THREE.PlaneGeometry(halfL * 2 - 0.1, eaveY - baseY);
        const frontGlass = new THREE.Mesh(wallGlassGeo, glassMat);
        frontGlass.position.set(0, (eaveY + baseY) / 2, halfW);
        this.exteriorGroup.add(frontGlass);

        const backGlass = new THREE.Mesh(wallGlassGeo, glassMat);
        backGlass.rotation.y = Math.PI;
        backGlass.position.set(0, (eaveY + baseY) / 2, -halfW);
        this.exteriorGroup.add(backGlass);

        // Left wall glass
        const sideGlassGeo = new THREE.PlaneGeometry(halfW * 2 - 0.1, eaveY - baseY);
        const leftGlass = new THREE.Mesh(sideGlassGeo, glassMat);
        leftGlass.rotation.y = -Math.PI / 2;
        leftGlass.position.set(-halfL, (eaveY + baseY) / 2, 0);
        this.exteriorGroup.add(leftGlass);

        // Roof Slope Glass (Left half & Back half)
        // Roof slope width = distance from (eaveY, halfW) to (ridgeY, 0)
        const slopeLen = Math.sqrt(Math.pow(ridgeY - eaveY, 2) + Math.pow(halfW, 2));
        const roofAngle = Math.atan2(ridgeY - eaveY, halfW);

        const roofGlassGeo = new THREE.PlaneGeometry(halfL * 2 - 0.1, slopeLen - 0.1);
        const frontRoofGlass = new THREE.Mesh(roofGlassGeo, glassMat);
        frontRoofGlass.position.set(0, (eaveY + ridgeY) / 2, halfW / 2);
        frontRoofGlass.rotation.x = roofAngle;
        this.exteriorGroup.add(frontRoofGlass);

        const backRoofGlass = new THREE.Mesh(roofGlassGeo, glassMat);
        backRoofGlass.position.set(0, (eaveY + ridgeY) / 2, -halfW / 2);
        backRoofGlass.rotation.x = -roofAngle;
        this.exteriorGroup.add(backRoofGlass);
    }

    // 3. Blue Constructor Frame & Yellow Joints (Ішкі тіректер мен бекіткіштер)
    buildBlueConstructorStructure() {
        const bluePlasticMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7, // Bright STEM constructor blue
            roughness: 0.35,
            metalness: 0.15
        });

        const yellowJointMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15, // Bright yellow connector clips
            roughness: 0.3,
            metalness: 0.1
        });

        const cTexture = window.Textures ? Textures.createConstructorTexture() : null;
        if (cTexture) {
            bluePlasticMat.map = cTexture;
            bluePlasticMat.needsUpdate = true;
        }

        // Horizontal Blue Base Grid Plate (Center Floor)
        const plateGeo = new THREE.BoxGeometry(2.6, 0.08, 1.8);
        const basePlate = new THREE.Mesh(plateGeo, bluePlasticMat);
        basePlate.position.set(-0.3, 0.2, 0.2);
        basePlate.receiveShadow = true;
        this.interiorGroup.add(basePlate);

        // Helper for building blue perforated constructor beams
        const makeBlueBeam = (w, h, d, x, y, z) => {
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, bluePlasticMat);
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            this.interiorGroup.add(mesh);
            return mesh;
        };

        // Helper for building yellow clamp joints
        const makeYellowJoint = (x, y, z, sx = 0.22, sy = 0.22, sz = 0.22) => {
            const geo = new THREE.BoxGeometry(sx, sy, sz);
            const mesh = new THREE.Mesh(geo, yellowJointMat);
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            this.interiorGroup.add(mesh);
            return mesh;
        };

        // Front-Center Constructor Arch (supports water pump and hose)
        // Two vertical upright beams
        makeBlueBeam(0.16, 2.2, 0.16, -0.85, 1.25, 0.7);
        makeBlueBeam(0.16, 2.2, 0.16, 0.65, 1.25, 0.7);

        // Top horizontal crossbar beam
        makeBlueBeam(1.66, 0.16, 0.16, -0.1, 2.35, 0.7);

        // Yellow 90-degree corner joints on top arch
        makeYellowJoint(-0.85, 2.35, 0.7, 0.26, 0.26, 0.26);
        makeYellowJoint(0.65, 2.35, 0.7, 0.26, 0.26, 0.26);

        // Yellow mid-level connector joints
        makeYellowJoint(-0.85, 1.2, 0.7, 0.24, 0.24, 0.24);
        makeYellowJoint(0.65, 1.2, 0.7, 0.24, 0.24, 0.24);

        // Rear Constructor Frame (supports solar mount and wiring)
        makeBlueBeam(0.16, 2.5, 0.16, -0.85, 1.4, -0.6);
        makeBlueBeam(0.16, 2.5, 0.16, 0.65, 1.4, -0.6);
        makeBlueBeam(1.66, 0.16, 0.16, -0.1, 2.65, -0.6);

        makeYellowJoint(-0.85, 2.65, -0.6, 0.26, 0.26, 0.26);
        makeYellowJoint(0.65, 2.65, -0.6, 0.26, 0.26, 0.26);

        // Diagonal bracing beam
        const braceGeo = new THREE.BoxGeometry(0.14, 1.8, 0.14);
        const brace = new THREE.Mesh(braceGeo, bluePlasticMat);
        brace.position.set(-0.85, 1.8, 0.05);
        brace.rotation.x = Math.PI / 4;
        this.interiorGroup.add(brace);

        // Right side secondary support upright for plants
        makeBlueBeam(0.16, 2.0, 0.16, 1.8, 1.15, -0.4);
        makeYellowJoint(1.8, 2.15, -0.4, 0.24, 0.24, 0.24);
    }

    // 4. Water Reservoir Cup (Су ыдысы)
    buildWaterReservoir() {
        const cupGroup = new THREE.Group();
        cupGroup.position.set(-2.4, 0.15, 1.0);

        // Clear plastic cup material
        const cupMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.42,
            roughness: 0.1,
            metalness: 0.05,
            transmission: 0.75,
            depthWrite: false
        });

        // Tapered cup geometry
        const cupGeo = new THREE.CylinderGeometry(0.55, 0.42, 1.25, 32, 1, true);
        const cupMesh = new THREE.Mesh(cupGeo, cupMat);
        cupMesh.position.y = 0.625;
        cupGroup.add(cupMesh);

        // Bottom disc of cup
        const cupBottomGeo = new THREE.CircleGeometry(0.42, 32);
        const cupBottom = new THREE.Mesh(cupBottomGeo, cupMat);
        cupBottom.rotation.x = -Math.PI / 2;
        cupBottom.position.y = 0.01;
        cupGroup.add(cupBottom);

        // Measurement scale ring lines
        const scaleTex = window.Textures ? Textures.createCupScaleTexture() : null;
        if (scaleTex) {
            const scaleGeo = new THREE.PlaneGeometry(0.6, 1.1);
            const scaleMat = new THREE.MeshBasicMaterial({
                map: scaleTex,
                transparent: true,
                opacity: 0.85,
                depthWrite: false
            });
            const scaleMesh = new THREE.Mesh(scaleGeo, scaleMat);
            scaleMesh.position.set(0.45, 0.6, 0.1);
            scaleMesh.rotation.y = Math.PI / 2;
            cupGroup.add(scaleMesh);
        }

        // Water Volume inside cup
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.65,
            roughness: 0.15,
            metalness: 0.2
        });

        const waterGeo = new THREE.CylinderGeometry(0.48, 0.40, 0.75, 32);
        this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
        this.waterMesh.position.y = 0.45;
        this.waterInitialY = 0.45;
        cupGroup.add(this.waterMesh);

        // Top water surface meniscus
        const waterTopGeo = new THREE.CircleGeometry(0.48, 32);
        const waterTopMat = new THREE.MeshStandardMaterial({
            color: 0x7dd3fc,
            roughness: 0.05,
            metalness: 0.3
        });
        const waterTop = new THREE.Mesh(waterTopGeo, waterTopMat);
        waterTop.rotation.x = -Math.PI / 2;
        waterTop.position.y = 0.375;
        this.waterMesh.add(waterTop);

        this.interiorGroup.add(cupGroup);

        this.hotspots['reservoir'] = {
            position: new THREE.Vector3(-2.4, 1.4, 1.0),
            title: 'Су қоймасы (Reservoir)',
            subtitle: 'Автономды су ыдысы',
            desc: 'Мөлдір пластикалық резервуар. Ішіндегі су силикон түтік арқылы микро-сорғыға жеткізіледі. Автономды жұмыс істеу уақытын қамтамасыз етеді.',
            specs: 'Көлемі: 250 мл | Материалы: Медициналық акрил | Түтік диам: 4 мм'
        };
    }

    // 5. Water Pump & Yellow Mount (Су сорғысы / Помпа)
    buildWaterPump() {
        this.pumpMesh = new THREE.Group();
        this.pumpMesh.position.set(-0.85, 1.05, 0.7);

        // Yellow custom bracket mount
        const bracketMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            roughness: 0.3,
            metalness: 0.1
        });
        const bracketGeo = new THREE.BoxGeometry(0.45, 0.5, 0.45);
        const bracket = new THREE.Mesh(bracketGeo, bracketMat);
        this.pumpMesh.add(bracket);

        // Blue cylindrical pump motor casing (exact match to photo)
        const motorMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.35,
            metalness: 0.3
        });
        const motorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 24);
        const motor = new THREE.Mesh(motorGeo, motorMat);
        motor.position.y = -0.15;
        this.pumpMesh.add(motor);

        // White pump head & impeller chamber
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            roughness: 0.25,
            metalness: 0.1
        });
        const headGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 24);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.3;
        this.pumpMesh.add(head);

        // Inlet nozzle (points left towards water cup)
        const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
        const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16);
        const inlet = new THREE.Mesh(nozzleGeo, nozzleMat);
        inlet.rotation.z = Math.PI / 2;
        inlet.position.set(-0.25, 0.28, 0);
        this.pumpMesh.add(inlet);

        // Outlet nozzle (points straight up towards the arch)
        const outlet = new THREE.Mesh(nozzleGeo, nozzleMat);
        outlet.position.set(0, 0.48, 0);
        this.pumpMesh.add(outlet);

        // Motor electrical terminals & wires at bottom
        const termGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
        const termMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        const term = new THREE.Mesh(termGeo, termMat);
        term.position.set(0, -0.48, 0);
        this.pumpMesh.add(term);

        this.interiorGroup.add(this.pumpMesh);

        this.hotspots['pump'] = {
            position: new THREE.Vector3(-0.85, 1.6, 0.7),
            title: 'Су сорғысы (Water Pump)',
            subtitle: 'DC 3-5V Микро-помпа',
            desc: 'Шағын көлемді су айналым моторы. Топырақ ылғалдылығы 30%-дан төмендегенде реле арқылы іске қосылып, суды қысыммен өсімдіктердің тамырына айдайды.',
            specs: 'Кернеу: 5V DC | Қуаты: 1.2W | Өнімділігі: 1.5 л/мин | Қысым: 0.3 бар'
        };
    }

    // 6. Plants: Tomatoes & Cucumbers inside Greenhouse (Помидор және Қияр дақылдары)
    buildPlantsAndPots() {
        const leafTex = window.Textures ? Textures.createLeafTexture() : null;
        const soilTex = window.Textures ? Textures.createSoilTexture() : null;
        const cucumberTex = window.Textures ? Textures.createCucumberTexture() : null;

        const potGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            roughness: 0.1,
            transmission: 0.7,
            depthWrite: false
        });

        const stakeMat = new THREE.MeshStandardMaterial({
            color: 0x92400e,
            roughness: 0.85
        });

        // Reusable curved leaf geometry
        const leafShape = new THREE.Shape();
        leafShape.moveTo(0, 0);
        leafShape.quadraticCurveTo(0.2, 0.25, 0.28, 0.55);
        leafShape.quadraticCurveTo(0.18, 0.85, 0, 1.05);
        leafShape.quadraticCurveTo(-0.18, 0.85, -0.28, 0.55);
        leafShape.quadraticCurveTo(-0.2, 0.25, 0, 0);
        const leafGeo = new THREE.ShapeGeometry(leafShape);

        // Broad heart-like leaf geometry for cucumbers
        const cucLeafShape = new THREE.Shape();
        cucLeafShape.moveTo(0, 0);
        cucLeafShape.quadraticCurveTo(0.36, 0.15, 0.34, 0.55);
        cucLeafShape.quadraticCurveTo(0.22, 0.85, 0, 0.98);
        cucLeafShape.quadraticCurveTo(-0.22, 0.85, -0.34, 0.55);
        cucLeafShape.quadraticCurveTo(-0.36, 0.15, 0, 0);
        const cucLeafGeo = new THREE.ShapeGeometry(cucLeafShape);

        // Helper: Floating 3D Rot/Alert Warning Beacon above a crop
        const createWarningBeacon = (yHeight) => {
            const beaconGroup = new THREE.Group();
            beaconGroup.position.set(0, yHeight, 0);
            beaconGroup.visible = false;

            const ringGeo = new THREE.TorusGeometry(0.38, 0.04, 10, 28);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            beaconGroup.add(ring);

            const coreGeo = new THREE.OctahedronGeometry(0.14, 0);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.position.y = 0.22;
            beaconGroup.add(core);

            return beaconGroup;
        };

        // Helper: Tomato Plant Pot (Помидор)
        const createTomatoPot = (cropId, x, z) => {
            const group = new THREE.Group();
            group.position.set(x, 0.15, z);

            const leafMat = new THREE.MeshStandardMaterial({
                color: 0x22c55e,
                roughness: 0.38,
                metalness: 0.08,
                side: THREE.DoubleSide
            });
            if (leafTex) { leafMat.map = leafTex; leafMat.needsUpdate = true; }

            const soilMat = new THREE.MeshStandardMaterial({
                color: 0x3d2714,
                roughness: 0.85,
                metalness: 0.05
            });
            if (soilTex) { soilMat.map = soilTex; soilMat.needsUpdate = true; }

            const tomatoMat = new THREE.MeshStandardMaterial({
                color: 0xdc2626, // Glossy ripe red tomato
                roughness: 0.16,
                metalness: 0.18
            });

            const unripeMat = new THREE.MeshStandardMaterial({
                color: 0x84cc16,
                roughness: 0.28
            });

            const stemMat = new THREE.MeshStandardMaterial({
                color: 0x15803d,
                roughness: 0.5
            });

            // Clear pot
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.43, 1.15, 28, 1, true), potGlassMat);
            cup.position.y = 0.575;
            group.add(cup);

            const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.43, 28), potGlassMat);
            bottom.rotation.x = -Math.PI / 2;
            bottom.position.y = 0.01;
            group.add(bottom);

            // Soil
            const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.42, 0.92, 28), soilMat);
            soil.position.y = 0.48;
            soil.receiveShadow = true;
            group.add(soil);
            this.soilMeshes.push(soil);

            // Wooden support stake
            const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 2.2, 8), stakeMat);
            stake.position.set(-0.08, 1.5, -0.05);
            group.add(stake);

            // Plant foliage subgroup (tilts/droops slightly if wilting/rotting)
            const foliageGroup = new THREE.Group();
            group.add(foliageGroup);

            // Central stem
            const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.65, 12), stemMat);
            mainStem.position.y = 1.45;
            foliageGroup.add(mainStem);

            // Layered tomato leaves
            const leafTiers = [
                { y: 1.05, count: 6, scale: 0.65, pitch: 0.58 },
                { y: 1.48, count: 7, scale: 0.78, pitch: 0.48 },
                { y: 1.92, count: 6, scale: 0.62, pitch: 0.36 }
            ];
            leafTiers.forEach(tier => {
                for (let i = 0; i < tier.count; i++) {
                    const angle = (i / tier.count) * Math.PI * 2 + tier.y * 0.7;
                    const leaf = new THREE.Mesh(leafGeo, leafMat);
                    leaf.scale.set(tier.scale, tier.scale, tier.scale);
                    leaf.position.set(0, tier.y, 0);
                    leaf.rotation.y = angle;
                    leaf.rotation.x = tier.pitch;
                    leaf.castShadow = true;
                    foliageGroup.add(leaf);
                }
            });

            // Slightly flattened realistic tomatoes with green calyx star
            const tomatoGeo = new THREE.SphereGeometry(0.145, 18, 16);
            tomatoGeo.scale(1.08, 0.9, 1.08);
            const calyxGeo = new THREE.ConeGeometry(0.055, 0.05, 5);

            const tomatoPositions = [
                { x: 0.28, y: 1.32, z: 0.24, ripe: true },
                { x: -0.26, y: 1.48, z: 0.26, ripe: true },
                { x: 0.18, y: 1.72, z: -0.26, ripe: true },
                { x: -0.28, y: 1.25, z: -0.22, ripe: true },
                { x: 0.34, y: 1.56, z: -0.14, ripe: true },
                { x: 0.02, y: 1.92, z: 0.28, ripe: false },
                { x: -0.16, y: 1.82, z: 0.14, ripe: true }
            ];

            tomatoPositions.forEach(tp => {
                const tomato = new THREE.Mesh(tomatoGeo, tp.ripe ? tomatoMat : unripeMat);
                tomato.position.set(tp.x, tp.y, tp.z);
                tomato.castShadow = true;

                const calyx = new THREE.Mesh(calyxGeo, stemMat);
                calyx.position.set(tp.x, tp.y + 0.125, tp.z);
                calyx.rotation.x = Math.PI;

                foliageGroup.add(tomato);
                foliageGroup.add(calyx);
            });

            const beacon = createWarningBeacon(2.45);
            group.add(beacon);

            this.interiorGroup.add(group);
            this.crops[cropId] = {
                id: cropId,
                name: cropId === 'tomato1' ? 'Помидор №1' : 'Помидор №2',
                type: 'tomato',
                group,
                foliageGroup,
                soil,
                leafMat,
                fruitMat: tomatoMat,
                stemMat,
                warningBeacon: beacon,
                originalLeafHex: 0x22c55e,
                originalFruitHex: 0xdc2626,
                originalStemHex: 0x15803d,
                state: 'healthy',
                worldPos: new THREE.Vector3(x, 1.8, z)
            };
            return { group, soil };
        };

        // Helper: Climbing Cucumber Planter (Қияр)
        const createCucumberPot = (cropId, x, z) => {
            const group = new THREE.Group();
            group.position.set(x, 0.15, z);

            const leafMat = new THREE.MeshStandardMaterial({
                color: 0x16a34a,
                roughness: 0.42,
                metalness: 0.05,
                side: THREE.DoubleSide
            });
            if (leafTex) { leafMat.map = leafTex; leafMat.needsUpdate = true; }

            const soilMat = new THREE.MeshStandardMaterial({
                color: 0x3d2714,
                roughness: 0.85,
                metalness: 0.05
            });
            if (soilTex) { soilMat.map = soilTex; soilMat.needsUpdate = true; }

            const cucumberMat = new THREE.MeshStandardMaterial({
                color: 0x15803d,
                roughness: 0.32,
                metalness: 0.08
            });
            if (cucumberTex) { cucumberMat.map = cucumberTex; cucumberMat.needsUpdate = true; }

            const flowerMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                roughness: 0.35
            });

            const stemMat = new THREE.MeshStandardMaterial({
                color: 0x166534,
                roughness: 0.55
            });

            // Planter pot
            const potMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
            const pot = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 0.92), potMat);
            pot.position.y = 0.425;
            pot.castShadow = true;
            pot.receiveShadow = true;
            group.add(pot);

            const soil = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.82), soilMat);
            soil.position.y = 0.8;
            soil.receiveShadow = true;
            group.add(soil);
            this.soilMeshes.push(soil);

            // Mini wooden A-frame / vertical trellis for cucumbers
            const postGeo = new THREE.CylinderGeometry(0.028, 0.032, 2.25, 8);
            const leftPost = new THREE.Mesh(postGeo, stakeMat);
            leftPost.position.set(-0.36, 1.8, -0.18);
            group.add(leftPost);
            const rightPost = new THREE.Mesh(postGeo, stakeMat);
            rightPost.position.set(0.36, 1.8, -0.18);
            group.add(rightPost);

            const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.78, 8);
            [1.35, 1.9, 2.45].forEach(by => {
                const bar = new THREE.Mesh(barGeo, stakeMat);
                bar.rotation.z = Math.PI / 2;
                bar.position.set(0, by, -0.18);
                group.add(bar);
            });

            const foliageGroup = new THREE.Group();
            group.add(foliageGroup);

            // Winding vine stems
            const vine1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.85, 10), stemMat);
            vine1.position.set(-0.14, 1.65, -0.06);
            vine1.rotation.z = -0.1;
            foliageGroup.add(vine1);

            const vine2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.75, 10), stemMat);
            vine2.position.set(0.16, 1.6, 0.02);
            vine2.rotation.z = 0.12;
            foliageGroup.add(vine2);

            // Broad cucumber leaves along trellis
            const leafCoords = [
                { x: -0.25, y: 1.15, z: 0.1, ry: 0.4, rx: 0.65, s: 0.72 },
                { x: 0.24, y: 1.25, z: 0.12, ry: -0.5, rx: 0.6, s: 0.78 },
                { x: -0.3, y: 1.65, z: 0.05, ry: 0.8, rx: 0.55, s: 0.82 },
                { x: 0.28, y: 1.75, z: 0.08, ry: -0.8, rx: 0.5, s: 0.76 },
                { x: 0.0, y: 2.05, z: 0.02, ry: 0.15, rx: 0.45, s: 0.8 },
                { x: -0.2, y: 2.25, z: -0.05, ry: 1.1, rx: 0.42, s: 0.68 },
                { x: 0.22, y: 2.3, z: -0.05, ry: -1.1, rx: 0.42, s: 0.68 },
                { x: 0.05, y: 1.45, z: -0.22, ry: 3.1, rx: 0.55, s: 0.75 }
            ];
            leafCoords.forEach(lc => {
                const leaf = new THREE.Mesh(cucLeafGeo, leafMat);
                leaf.position.set(lc.x, lc.y, lc.z);
                leaf.rotation.set(lc.rx, lc.ry, 0);
                leaf.scale.set(lc.s, lc.s, lc.s);
                leaf.castShadow = true;
                foliageGroup.add(leaf);
            });

            // Recognizable hanging elongated cucumbers (with rounded caps)
            const makeCucumber = (cx, cy, cz, rz, rx) => {
                const cGroup = new THREE.Group();
                cGroup.position.set(cx, cy, cz);
                cGroup.rotation.set(rx, 0, rz);

                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.36, 14), cucumberMat);
                body.castShadow = true;
                cGroup.add(body);

                const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), cucumberMat);
                topCap.position.y = 0.18;
                cGroup.add(topCap);

                const botCap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), cucumberMat);
                botCap.position.y = -0.18;
                cGroup.add(botCap);

                // Tiny yellow tip blossom
                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 5), flowerMat);
                tip.position.y = -0.25;
                tip.rotation.x = Math.PI;
                cGroup.add(tip);

                foliageGroup.add(cGroup);
            };

            makeCucumber(-0.22, 1.48, 0.22, 0.14, 0.1);
            makeCucumber(0.24, 1.62, 0.24, -0.18, 0.08);
            makeCucumber(0.0, 1.98, 0.18, 0.08, 0.12);
            makeCucumber(-0.18, 2.08, -0.02, -0.12, -0.1);
            makeCucumber(0.26, 1.28, -0.02, 0.2, -0.08);

            // Yellow cucumber blossoms
            const blossomGeo = new THREE.SphereGeometry(0.048, 8, 8);
            blossomGeo.scale(1.2, 0.5, 1.2);
            [
                { x: -0.32, y: 1.85, z: 0.15 },
                { x: 0.3, y: 2.1, z: 0.1 },
                { x: 0.05, y: 1.32, z: 0.26 }
            ].forEach(bp => {
                const fl = new THREE.Mesh(blossomGeo, flowerMat);
                fl.position.set(bp.x, bp.y, bp.z);
                foliageGroup.add(fl);
            });

            const beacon = createWarningBeacon(2.85);
            group.add(beacon);

            this.interiorGroup.add(group);
            this.crops[cropId] = {
                id: cropId,
                name: cropId === 'cucumber1' ? 'Қияр №1' : 'Қияр №2',
                type: 'cucumber',
                group,
                foliageGroup,
                soil,
                leafMat,
                fruitMat: cucumberMat,
                stemMat,
                warningBeacon: beacon,
                originalLeafHex: 0x16a34a,
                originalFruitHex: 0x15803d,
                originalStemHex: 0x166534,
                state: 'healthy',
                worldPos: new THREE.Vector3(x, 1.9, z)
            };
            return { group, soil };
        };

        // Interior Pot 1: Tomato #1 (Front-Right, watered directly by silicone tube)
        const p1 = createTomatoPot('tomato1', 1.5, 0.55);
        this.soilMesh1 = p1.soil;

        // Interior Pot 2: Tomato #2 (Back-Right)
        const p2 = createTomatoPot('tomato2', 1.85, -0.75);
        this.soilMesh2 = p2.soil;

        // Interior Planter 3: Cucumber #1 (Back-Left inside greenhouse)
        createCucumberPot('cucumber1', -2.4, -0.95);

        // Interior Planter 4: Cucumber #2 (Far-Right inside greenhouse)
        createCucumberPot('cucumber2', 2.85, 0.25);

        // Soil Moisture Sensor inserted into Tomato Pot 1
        this.buildSoilMoistureSensor(1.5, 0.55);

        this.hotspots['plants'] = {
            position: new THREE.Vector3(1.5, 2.25, 0.55),
            title: 'Помидор дақылдары (Tomato Crops)',
            subtitle: 'Автоматты тамшылатып суару аймағы',
            desc: 'Жылыжайда өсірілетін қызанақ (помидор) көшеттері. Түтік арқылы тамыр жүйесіне дәлме-дәл су жеткізіледі, ал шіру датчигі жапырақ пен жеміс денсаулығын үздіксіз бақылайды.',
            specs: 'Дақыл: Помидор (Solanum lycopersicum) | Оңтайлы temp: 22-28°C | Ылғал: 45-75%'
        };

        this.hotspots['cucumbers'] = {
            position: new THREE.Vector3(-2.4, 2.55, -0.95),
            title: 'Қияр дақылдары (Cucumber Vines)',
            subtitle: 'Шпалерада өсетін қияр көшеттері',
            desc: 'Арнайы тіректе (шпалерада) өсетін қияр өсімдіктері. Жоғары ылғалдылық пен жылы микроклиматты қажет етеді; ауру немесе шіру белгісі байқалса басшы телефонына автоматты сигнал жіберіледі.',
            specs: 'Дақыл: Қияр (Cucumis sativus) | Оңтайлы temp: 24-30°C | Ауа ылғалдылығы: 65-80%'
        };
    }

    // 6B. Surrounding Outdoor Garden Beds (Өсімдіктер алынып тасталды / Убраны вокруг теплицы)
    buildSurroundingGardenBeds() {
        // Убраны помидоры и огурцы вокруг теплицы
    }

    // Soil Moisture Sensor Fork Prongs (Топырақ ылғалдылығы датчигі)
    buildSoilMoistureSensor(potX, potZ) {
        const sensorGroup = new THREE.Group();
        sensorGroup.position.set(potX - 0.25, 0.9, potZ);

        // Gold-plated sensor fork prongs
        const prongMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37, // Gold metallic
            roughness: 0.25,
            metalness: 0.85
        });
        const prongGeo = new THREE.BoxGeometry(0.04, 0.45, 0.015);

        const prong1 = new THREE.Mesh(prongGeo, prongMat);
        prong1.position.set(-0.06, -0.15, 0);
        sensorGroup.add(prong1);

        const prong2 = new THREE.Mesh(prongGeo, prongMat);
        prong2.position.set(0.06, -0.15, 0);
        sensorGroup.add(prong2);

        // Sensor head module PCB
        const pcbMat = new THREE.MeshStandardMaterial({
            color: 0x1e3a8a, // Deep blue PCB
            roughness: 0.35,
            metalness: 0.2
        });
        const pcbGeo = new THREE.BoxGeometry(0.24, 0.3, 0.03);
        const pcb = new THREE.Mesh(pcbGeo, pcbMat);
        pcb.position.set(0, 0.18, 0);
        sensorGroup.add(pcb);

        // Potentiometer & SMD indicator LED
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        const trimmer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), trimMat);
        trimmer.position.set(0, 0.18, 0.03);
        sensorGroup.add(trimmer);

        const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), ledMat);
        led.position.set(0.07, 0.26, 0.035);
        sensorGroup.add(led);
        this.sensorLeds.moisture = led;

        this.interiorGroup.add(sensorGroup);

        this.hotspots['sensor'] = {
            position: new THREE.Vector3(potX - 0.25, 1.45, potZ),
            title: 'Топырақ ылғалдылығы датчигі (YL-69)',
            subtitle: 'Резистивті/Сыйымдылықты өлшеуіш',
            desc: 'Топырақтың ылғалдылығы мен кедергісін үздіксіз өлшейді. Топырақ құрғағанда (<30%) сорғыны қосады, ал артық ылғал (>85%) ұзақ сақталса шіру қаупі туралы басшы телефонына сигнал жібереді.',
            specs: 'Моделі: YL-69 / Capacitive v1.2 | Кернеу: 3.3-5V | Шығысы: A0 Аналогтық (±2%)'
        };
    }

    // 7. Green Foliage Sprigs on the Floor (Едендегі жасыл жапырақтар)
    buildFloorFoliage() {
        const floorLeafMat = new THREE.MeshStandardMaterial({
            color: 0x16a34a,
            roughness: 0.4,
            side: THREE.DoubleSide
        });
        const sprigGeo = new THREE.ConeGeometry(0.22, 0.45, 6);

        const sprigPositions = [
            { x: -2.8, z: -1.2, r: 0.4 },
            { x: -2.2, z: -1.4, r: -0.6 },
            { x: -1.6, z: 1.3, r: 1.1 },
            { x: 0.0, z: -1.4, r: 0.2 },
            { x: 1.1, z: -1.4, r: -0.5 },
            { x: 2.7, z: 1.2, r: 0.8 },
            { x: 2.8, z: -1.1, r: -0.9 },
            { x: 0.9, z: 1.3, r: 0.4 }
        ];

        sprigPositions.forEach(sp => {
            const sprig = new THREE.Mesh(sprigGeo, floorLeafMat);
            sprig.position.set(sp.x, 0.25, sp.z);
            sprig.rotation.y = sp.r;
            sprig.rotation.x = Math.PI / 4;
            sprig.castShadow = true;
            this.interiorGroup.add(sprig);
        });
    }

    // 8. Arduino Microcontroller & Relay Module (Электроника және реле)
    buildElectronicsAndRelay() {
        const electGroup = new THREE.Group();
        electGroup.position.set(0.1, 0.25, 0.2);

        // 1. Arduino Nano / Uno PCB
        const ardMat = new THREE.MeshStandardMaterial({
            color: 0x0369a1,
            roughness: 0.35,
            metalness: 0.25
        });
        const ardTex = window.Textures ? Textures.createArduinoTexture() : null;
        if (ardTex) {
            ardMat.map = ardTex;
            ardMat.needsUpdate = true;
        }

        const ardGeo = new THREE.BoxGeometry(1.2, 0.05, 0.65);
        const ardMesh = new THREE.Mesh(ardGeo, ardMat);
        ardMesh.position.set(-0.45, 0.03, 0);
        ardMesh.receiveShadow = true;
        electGroup.add(ardMesh);

        // USB Port (silver metal box)
        const usbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
        const usb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.2), usbMat);
        usb.position.set(-0.95, 0.09, 0);
        electGroup.add(usb);

        // Arduino Power LED (Green)
        const pwrLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const pwrLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), pwrLedMat);
        pwrLed.position.set(-0.35, 0.07, 0.2);
        electGroup.add(pwrLed);

        // 2. Songle Blue Relay Module
        const relayBaseGeo = new THREE.BoxGeometry(0.75, 0.05, 0.65);
        const relayBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
        const relayBase = new THREE.Mesh(relayBaseGeo, relayBaseMat);
        relayBase.position.set(0.55, 0.03, 0);
        electGroup.add(relayBase);

        // Songle vivid blue relay cube
        const songleMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7, // Songle blue
            roughness: 0.25,
            metalness: 0.15
        });
        const relayTex = window.Textures ? Textures.createRelayTexture() : null;
        if (relayTex) {
            songleMat.map = relayTex;
            songleMat.needsUpdate = true;
        }

        const cubeGeo = new THREE.BoxGeometry(0.42, 0.35, 0.42);
        const relayCube = new THREE.Mesh(cubeGeo, songleMat);
        relayCube.position.set(0.55, 0.22, -0.06);
        relayCube.castShadow = true;
        electGroup.add(relayCube);

        // Screw Terminal Block (Green/Blue plastic)
        const termMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35 });
        const term = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.16), termMat);
        term.position.set(0.55, 0.16, 0.22);
        electGroup.add(term);

        // Screws on terminal block
        const screwMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.2 });
        for (let i = -1; i <= 1; i++) {
            const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), screwMat);
            screw.position.set(0.55 + i * 0.12, 0.3, 0.22);
            electGroup.add(screw);
        }

        // Active Relay Indicator LED (Glows Red when ON, Dim when OFF)
        const relayLedMat = new THREE.MeshBasicMaterial({ color: 0x475569 }); // initial off
        this.relayLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), relayLedMat);
        this.relayLed.position.set(0.32, 0.08, -0.2);
        electGroup.add(this.relayLed);

        this.interiorGroup.add(electGroup);

        this.hotspots['arduino'] = {
            position: new THREE.Vector3(0.1, 0.7, 0.2),
            title: 'Arduino & Реле басқару модулі',
            subtitle: 'Жүйенің интеллектуалды «Миы»',
            desc: 'Микроконтроллер барлық датчиктердің деректерін өңдейді. Топырақ ылғалдылығы шектік 30%-дан түскенде реленің электромагниттік катушкасына ток беріп, сорғыны іске қосады.',
            specs: 'Контроллер: ATmega328P | Реле: Songle 10A 250VAC | Логика: Автоматты компаратор'
        };
    }

    // 9. Photovoltaic Solar Panel (Күн панелі)
    buildSolarPanel() {
        this.solarPanel = new THREE.Group();

        // Mounted on the right side of the greenhouse roof at an angle (matching photo)
        this.solarPanel.position.set(2.4, 3.4, 0.4);
        this.solarPanel.rotation.z = -0.45; // Tilted angle
        this.solarPanel.rotation.y = 0.2;

        const panelL = 2.8;
        const panelW = 1.8;
        const frameThick = 0.08;

        // Black anodized frame
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.35,
            metalness: 0.7
        });
        const backplateGeo = new THREE.BoxGeometry(panelL, 0.06, panelW);
        const backplate = new THREE.Mesh(backplateGeo, frameMat);
        this.solarPanel.add(backplate);

        // Solar Photovoltaic Cell Face
        const cellMat = new THREE.MeshStandardMaterial({
            color: 0x0f2744,
            roughness: 0.18,
            metalness: 0.5
        });
        const solTex = window.Textures ? Textures.createSolarPanelTexture() : null;
        if (solTex) {
            cellMat.map = solTex;
            cellMat.needsUpdate = true;
        }

        const cellGeo = new THREE.PlaneGeometry(panelL - 0.08, panelW - 0.08);
        const cellMesh = new THREE.Mesh(cellGeo, cellMat);
        cellMesh.rotation.x = -Math.PI / 2;
        cellMesh.position.y = 0.035;
        this.solarPanel.add(cellMesh);

        // Mounting Bracket Strut to greenhouse frame
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.75, roughness: 0.3 });
        const strutGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12);
        const strut1 = new THREE.Mesh(strutGeo, strutMat);
        strut1.position.set(0, -0.6, -0.3);
        strut1.rotation.z = 0.45;
        this.solarPanel.add(strut1);

        // Junction box on rear of panel
        const jboxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
        const jbox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.25), jboxMat);
        jbox.position.set(0, -0.07, 0);
        this.solarPanel.add(jbox);

        this.interiorGroup.add(this.solarPanel);

        // Define Wire Path from Solar Panel down to Arduino
        this.wirePoints = [
            new THREE.Vector3(2.4, 3.3, 0.4),
            new THREE.Vector3(2.0, 2.6, 0.2),
            new THREE.Vector3(1.4, 1.8, 0.0),
            new THREE.Vector3(0.8, 0.9, 0.1),
            new THREE.Vector3(0.1, 0.35, 0.2)
        ];

        this.hotspots['solar'] = {
            position: new THREE.Vector3(2.4, 4.2, 0.4),
            title: 'Күн батареясы (Solar Panel)',
            subtitle: 'Фотоэлектрлік кремний панелі',
            desc: 'Күннің жарық фотондарын тікелей тұрақты электр тогына (DC) айналдырады. Жылыжайды толық автономды, табиғи жаңартылатын таза энергиямен қамтамасыз етеді.',
            specs: 'Номинал кернеу: 5.0 V | Ток күші: 0.4 A | Макс қуат: 2.0 W | ПӘК: 19.5%'
        };
    }

    // 9B. Additional Sensor Suite (Температура, Ауа ылғалдылығы, Жарық панелі, Су деңгейі, Өсімдік шіру датчигі)
    buildAdditionalSensors() {
        const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0f294a, roughness: 0.35, metalness: 0.2 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.22, metalness: 0.85 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 });

        // 1. DHT22 Temperature & Air Humidity Sensor (Температура және ауа ылғалдылығы датчигі)
        const dhtGroup = new THREE.Group();
        dhtGroup.position.set(-0.1, 2.68, 0.72);

        const dhtTex = window.Textures ? Textures.createDHT22Texture() : null;
        const dhtFrontMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
        if (dhtTex) { dhtFrontMat.map = dhtTex; dhtFrontMat.needsUpdate = true; }

        const dhtBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.16), [
            darkMat, darkMat, darkMat, darkMat, dhtFrontMat, darkMat
        ]);
        dhtBody.castShadow = true;
        dhtGroup.add(dhtBody);

        // Metal pins underneath
        for (let i = -1.5; i <= 1.5; i += 1) {
            const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), metalMat);
            pin.position.set(i * 0.06, -0.32, 0);
            dhtGroup.add(pin);
        }

        const dhtLed = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
        dhtLed.position.set(0.14, 0.19, 0.09);
        dhtGroup.add(dhtLed);
        this.sensorLeds.dht22 = dhtLed;

        this.interiorGroup.add(dhtGroup);
        this.hotspots['dht22'] = {
            position: new THREE.Vector3(-0.1, 3.1, 0.72),
            title: 'Температура & Ылғалдылық датчигі (DHT22)',
            subtitle: 'Цифрлық микроклимат сенсоры',
            desc: 'Жылыжай ішіндегі ауа температурасы (°C) мен салыстырмалы ауа ылғалдылығын (%) дәл өлшейді. Қызып кету (>35°C) немесе шамадан тыс буланғанда желдеткішті қосып, басшы телефонына сигнал жібереді.',
            specs: 'Моделі: DHT22 (AM2302) | Темп: -40..+80°C (±0.5°C) | Ылғал: 0-100% (±2%)'
        };

        // 2. Light Sensor Panel (Панель жарық датчигі — BH1750 / LDR) mounted near Solar Panel
        const lightGroup = new THREE.Group();
        lightGroup.position.set(1.18, 3.88, 1.05);
        lightGroup.rotation.z = -0.35;
        lightGroup.rotation.y = 0.25;

        const lightTex = window.Textures ? Textures.createLightSensorTexture() : null;
        const lightTopMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.25 });
        if (lightTex) { lightTopMat.map = lightTex; lightTopMat.needsUpdate = true; }

        const lightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.58), [
            pcbMat, pcbMat, lightTopMat, pcbMat, pcbMat, pcbMat
        ]);
        lightPanel.castShadow = true;
        lightGroup.add(lightPanel);

        // Translucent optical sensor dome
        const domeMat = new THREE.MeshPhysicalMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.72,
            roughness: 0.08,
            metalness: 0.1
        });
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
        dome.position.set(0, 0.04, 0);
        lightGroup.add(dome);

        // Mounting arm connecting to roof/solar frame
        const mountArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), metalMat);
        mountArm.position.set(0, -0.34, 0);
        lightGroup.add(mountArm);

        const lightLed = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        lightLed.position.set(0.2, 0.06, 0.2);
        lightGroup.add(lightLed);
        this.sensorLeds.light = lightLed;

        this.interiorGroup.add(lightGroup);
        this.hotspots['light_sensor'] = {
            position: new THREE.Vector3(1.18, 4.35, 1.05),
            title: 'Панель жарық датчигі (BH1750 / LDR)',
            subtitle: 'Фоторезисторлық жарық сенсоры',
            desc: 'Күн панелінің жанына орнатылған цифрлық люксметр. Жарық деңгейі төмендегенде (<35% немесе түнде) шатырдағы LED фитожарық панелін автоматты түрде іске қосып, өсімдіктердің фотосинтезін қолдайды.',
            specs: 'Моделі: BH1750FVI + LDR | Диапазон: 1–65535 Lux | Интерфейс: I2C (3.3-5V)'
        };

        // 3. Water Level Sensor (Резервуар су деңгейі датчигі — HC-SR04 Ultrasonic)
        const wlGroup = new THREE.Group();
        wlGroup.position.set(-2.4, 1.5, 0.56);

        const wlPcb = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.06), pcbMat);
        wlGroup.add(wlPcb);

        // Two ultrasonic transducer barrels pointing downward into reservoir
        const transGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.14, 16);
        const tr1 = new THREE.Mesh(transGeo, metalMat);
        tr1.position.set(-0.12, -0.1, 0.08);
        wlGroup.add(tr1);
        const tr2 = new THREE.Mesh(transGeo, metalMat);
        tr2.position.set(0.12, -0.1, 0.08);
        wlGroup.add(tr2);

        const wlLed = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        wlLed.position.set(0, 0.08, 0.05);
        wlGroup.add(wlLed);
        this.sensorLeds.waterLevel = wlLed;

        this.interiorGroup.add(wlGroup);
        this.hotspots['water_level'] = {
            position: new THREE.Vector3(-2.4, 1.95, 0.56),
            title: 'Су деңгейі датчигі (HC-SR04)',
            subtitle: 'Ультрадыбыстық резервуар сенсоры',
            desc: 'Резервуардағы су бетіне дейінгі қашықтықты өлшейді. Су қоры 20%-дан азайса немесе мүлде бітсе (0%), сорғыны құрғақ айналудан қорғап өшіреді және басшының телефонына шұғыл сигнал жібереді.',
            specs: 'Моделі: HC-SR04 Ultrasonic | Дәлдігі: ±3 мм | Қорғаныс: Құрғақ жүрістен автоматты өшіру'
        };

        // 4. Plant Health / Rot Detection Sensor (Өсімдік шіруін анықтайтын AI-камера + MQ-135 газ датчигі)
        const healthGroup = new THREE.Group();
        healthGroup.position.set(1.8, 2.35, -0.35);
        healthGroup.rotation.y = -0.35;

        const healthBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.24), darkMat);
        healthBox.castShadow = true;
        healthGroup.add(healthBox);

        // Optical AI camera lens
        const lensRing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.1, 16), metalMat);
        lensRing.rotation.x = Math.PI / 2;
        lensRing.position.set(-0.07, 0.02, 0.13);
        healthGroup.add(lensRing);

        const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }));
        lensGlass.rotation.x = Math.PI / 2;
        lensGlass.position.set(-0.07, 0.02, 0.13);
        healthGroup.add(lensGlass);

        // MQ-135 Ethylene / Rot Gas Mesh Cylinder
        const gasMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 16), metalMat);
        gasMesh.position.set(0.09, 0.2, 0);
        healthGroup.add(gasMesh);

        // Health Status LED
        const healthLed = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
        healthLed.position.set(0.1, 0.06, 0.13);
        healthGroup.add(healthLed);
        this.sensorLeds.plantHealth = healthLed;

        this.interiorGroup.add(healthGroup);
        this.hotspots['health_sensor'] = {
            position: new THREE.Vector3(1.8, 2.85, -0.35),
            title: 'Өсімдік шіруін анықтайтын датчик (AI + MQ-135)',
            subtitle: 'Оптикалық сканер & Этилен газ сенсоры',
            desc: 'Помидор мен қияр жапырақтарының түсін және шіру кезінде бөлінетін этилен/көмірқышқыл газын талдайды. Өсімдік шіри бастаса бірден анықтап, теплица басшысының телефонына дабыл жібереді.',
            specs: 'Сенсор: ESP32-CAM AI + MQ-135 | Анықтау: Жапырақ сарғаюы, тамыр шіруі, саңырауқұлақ'
        };
    }

    // 9C. Overhead LED Grow Light Panel (Фитожарық панелі — жарық датчигімен басқарылады)
    buildGrowLightPanel() {
        const barGroup = new THREE.Group();
        barGroup.position.set(0, 4.55, 0);

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.6 });
        const barBody = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 0.42), bodyMat);
        barGroup.add(barBody);

        // Hanging cables from roof ridge
        const cableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
        [-1.8, 1.8].forEach(cx => {
            const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6), cableMat);
            cable.position.set(cx, 0.42, 0);
            barGroup.add(cable);
        });

        // Glowing LED strip underside
        this.growLightEmissiveMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            emissive: 0xd946ef,
            emissiveIntensity: 0.0,
            roughness: 0.2
        });
        const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.04, 0.28), this.growLightEmissiveMat);
        ledStrip.position.y = -0.07;
        barGroup.add(ledStrip);

        // Actual PointLight that illuminates plants with phytolamp glow
        this.growPointLight = new THREE.PointLight(0xe879f9, 0.0, 9.5);
        this.growPointLight.position.set(0, -0.35, 0);
        barGroup.add(this.growPointLight);

        this.interiorGroup.add(barGroup);
    }

    // 9D. Smart Exhaust Ventilation Fan (Ақылды желдеткіш — қызу мен шіруге қарсы)
    buildVentilationFan() {
        const fanGroup = new THREE.Group();
        fanGroup.position.set(-3.52, 4.18, 0);
        fanGroup.rotation.y = Math.PI / 2;

        const housingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.86, 0.16), housingMat);
        fanGroup.add(frame);

        const shroud = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 10, 24), housingMat);
        shroud.position.z = 0.08;
        fanGroup.add(shroud);

        // Spinning blades hub
        this.fanBlades = new THREE.Group();
        this.fanBlades.position.z = 0.06;

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
        hub.rotation.x = Math.PI / 2;
        this.fanBlades.add(hub);

        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide });
        for (let i = 0; i < 5; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.02), bladeMat);
            const angle = (i / 5) * Math.PI * 2;
            blade.position.set(Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, 0);
            blade.rotation.z = angle + Math.PI / 2;
            blade.rotation.y = 0.35;
            this.fanBlades.add(blade);
        }
        fanGroup.add(this.fanBlades);

        this.fanLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x475569 }));
        this.fanLed.position.set(0.34, 0.34, 0.09);
        fanGroup.add(this.fanLed);

        this.interiorGroup.add(fanGroup);
    }

    // 10. Silicone Fluid Tube (Мөлдір силикон түтік)
    buildSiliconeTube() {
        // Curve points matching the photo:
        // Starts in water cup -> goes up to pump inlet -> exits pump outlet -> arches over blue constructor -> drips into plant pot
        this.tubePoints = [
            new THREE.Vector3(-2.4, 0.35, 1.0),   // Inside water cup
            new THREE.Vector3(-2.4, 1.25, 1.0),   // Exits top of cup
            new THREE.Vector3(-1.7, 1.35, 0.85),  // Arches towards pump
            new THREE.Vector3(-1.1, 1.33, 0.7),   // Pump inlet nozzle
            new THREE.Vector3(-0.85, 1.55, 0.7),  // Pump outlet nozzle (up)
            new THREE.Vector3(-0.85, 2.3, 0.7),   // Top of blue arch (guided by clip)
            new THREE.Vector3(-0.1, 2.35, 0.65),  // Across top blue beam
            new THREE.Vector3(0.65, 2.2, 0.6),    // Passing right arch post
            new THREE.Vector3(1.1, 1.8, 0.55),    // Descending towards plant pot
            new THREE.Vector3(1.5, 1.2, 0.55)     // Soil surface in plant pot 1
        ];

        const curve = new THREE.CatmullRomCurve3(this.tubePoints);

        // Clear transparent silicone tube geometry
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.045, 12, false);
        const tubeMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.55,
            roughness: 0.1,
            metalness: 0.05,
            transmission: 0.85,
            ior: 1.45,
            depthWrite: false
        });

        this.tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        this.interiorGroup.add(this.tubeMesh);

        // Yellow tube guide rings on the constructor arch
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
        const ringGeo = new THREE.TorusGeometry(0.065, 0.02, 8, 16);

        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.position.set(-0.85, 2.3, 0.7);
        ring1.rotation.y = Math.PI / 2;
        this.interiorGroup.add(ring1);

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.position.set(0.65, 2.2, 0.6);
        ring2.rotation.y = Math.PI / 2;
        this.interiorGroup.add(ring2);
    }

    // 11. Multi-color Electrical Wiring Network (Сымдар)
    buildWiringNetwork() {
        const makeWire = (points, colorHex) => {
            const curve = new THREE.CatmullRomCurve3(points);
            const wireGeo = new THREE.TubeGeometry(curve, 32, 0.022, 8, false);
            const wireMat = new THREE.MeshStandardMaterial({
                color: colorHex,
                roughness: 0.5,
                metalness: 0.1
            });
            const mesh = new THREE.Mesh(wireGeo, wireMat);
            this.interiorGroup.add(mesh);
        };

        // Red Power Wire (+5V) from Solar to Arduino
        makeWire([
            new THREE.Vector3(2.4, 3.3, 0.4),
            new THREE.Vector3(1.8, 2.4, 0.3),
            new THREE.Vector3(1.0, 1.2, 0.2),
            new THREE.Vector3(0.0, 0.32, 0.2)
        ], 0xef4444);

        // Black Ground Wire (GND) from Solar to Arduino
        makeWire([
            new THREE.Vector3(2.38, 3.28, 0.42),
            new THREE.Vector3(1.78, 2.38, 0.32),
            new THREE.Vector3(0.98, 1.18, 0.22),
            new THREE.Vector3(-0.05, 0.32, 0.2)
        ], 0x111827);

        // Relay Control Wires to Pump
        makeWire([
            new THREE.Vector3(0.65, 0.35, 0.2),
            new THREE.Vector3(0.1, 0.35, 0.4),
            new THREE.Vector3(-0.5, 0.4, 0.6),
            new THREE.Vector3(-0.85, 0.6, 0.7)
        ], 0x3b82f6); // Blue signal

        makeWire([
            new THREE.Vector3(0.55, 0.35, 0.2),
            new THREE.Vector3(0.0, 0.32, 0.42),
            new THREE.Vector3(-0.55, 0.38, 0.62),
            new THREE.Vector3(-0.85, 0.57, 0.72)
        ], 0xef4444); // Red VCC

        // Soil Moisture Sensor wire from Pot 1 to Arduino
        makeWire([
            new THREE.Vector3(1.25, 1.1, 0.55),
            new THREE.Vector3(0.8, 0.6, 0.4),
            new THREE.Vector3(0.1, 0.32, 0.2)
        ], 0xf59e0b); // Yellow analog line

        // DHT22 Temp & Humidity wire (Green data line)
        makeWire([
            new THREE.Vector3(-0.1, 2.38, 0.72),
            new THREE.Vector3(0.62, 2.15, 0.68),
            new THREE.Vector3(0.55, 1.1, 0.5),
            new THREE.Vector3(-0.15, 0.32, 0.2)
        ], 0x10b981);

        // Light Sensor Panel wire (Cyan I2C bus)
        makeWire([
            new THREE.Vector3(1.18, 3.6, 1.05),
            new THREE.Vector3(0.75, 2.55, 0.68),
            new THREE.Vector3(0.6, 1.3, 0.38),
            new THREE.Vector3(-0.22, 0.32, 0.2)
        ], 0x06b6d4);

        // Water Level Sensor wire (Purple ultrasonic line)
        makeWire([
            new THREE.Vector3(-2.4, 1.45, 0.56),
            new THREE.Vector3(-1.6, 0.85, 0.42),
            new THREE.Vector3(-0.9, 0.42, 0.3),
            new THREE.Vector3(-0.35, 0.32, 0.2)
        ], 0xa855f7);

        // Plant Health / Rot Sensor wire (White/Silver data cable)
        makeWire([
            new THREE.Vector3(1.8, 2.15, -0.35),
            new THREE.Vector3(1.4, 1.15, -0.25),
            new THREE.Vector3(0.6, 0.45, -0.05),
            new THREE.Vector3(-0.08, 0.32, 0.12)
        ], 0xe2e8f0);
    }

    // 12. Modern Table Surface & Ambient Ground (Expanded for surrounding vegetable beds)
    buildGroundAndEnvironment() {
        // Modern agricultural demonstration platform
        const benchMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.32,
            metalness: 0.05
        });
        const benchGeo = new THREE.BoxGeometry(15.2, 0.22, 11.4);
        const bench = new THREE.Mesh(benchGeo, benchMat);
        bench.position.set(0, -0.11, -0.15);
        bench.receiveShadow = true;
        this.exteriorGroup.add(bench);

        // Subtle circular pedestal ring
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.16,
            wireframe: true
        });
        const ringGeo = new THREE.RingGeometry(6.1, 6.45, 56);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.exteriorGroup.add(ring);
    }

    // Dynamic Updates based on UI state
    setPumpActive(isActive) {
        if (this.relayLed) {
            this.relayLed.material.color.setHex(isActive ? 0xef4444 : 0x475569);
        }
    }

    setGrowLightActive(isOn) {
        this.isGrowLightOn = isOn;
        if (this.growLightEmissiveMat) {
            this.growLightEmissiveMat.emissiveIntensity = isOn ? 2.4 : 0.0;
            this.growLightEmissiveMat.color.setHex(isOn ? 0xf5d0fe : 0x334155);
        }
        if (this.growPointLight) {
            this.growPointLight.intensity = isOn ? 1.85 : 0.0;
        }
    }

    setFanActive(isOn) {
        this.isFanOn = isOn;
        if (this.fanLed) {
            this.fanLed.material.color.setHex(isOn ? 0x38bdf8 : 0x475569);
        }
    }

    setPlantHealth(cropId, state) {
        const crop = this.crops[cropId];
        if (!crop) return;
        crop.state = state;

        if (state === 'rotting') {
            // Sickly yellow-brown leaves, dark spotted fruit, drooping foliage, red 3D alert beacon
            crop.leafMat.color.setHex(0x854d0e);
            crop.fruitMat.color.setHex(crop.type === 'tomato' ? 0x5c2018 : 0x4d5d23);
            crop.stemMat.color.setHex(0x57431f);
            crop.foliageGroup.rotation.z = 0.14;
            crop.warningBeacon.visible = true;
        } else if (state === 'wilting') {
            crop.leafMat.color.setHex(0xa3a322);
            crop.fruitMat.color.setHex(crop.originalFruitHex);
            crop.stemMat.color.setHex(0x4d7c0f);
            crop.foliageGroup.rotation.z = 0.08;
            crop.warningBeacon.visible = false;
        } else {
            crop.leafMat.color.setHex(crop.originalLeafHex);
            crop.fruitMat.color.setHex(crop.originalFruitHex);
            crop.stemMat.color.setHex(crop.originalStemHex);
            crop.foliageGroup.rotation.z = 0;
            crop.warningBeacon.visible = false;
        }
    }

    updateSensorIndicators({ moisture, temp, lightPercent, waterLevel, hasRot }) {
        this.alertBlinkState = {
            waterLow: waterLevel <= 15,
            hasRot: !!hasRot,
            tempHigh: temp >= 35
        };

        if (this.sensorLeds.moisture) {
            const hex = moisture < 30 ? 0xef4444 : moisture > 82 ? 0x3b82f6 : 0x22c55e;
            this.sensorLeds.moisture.material.color.setHex(hex);
        }
        if (this.sensorLeds.dht22) {
            const hex = temp >= 35 ? 0xef4444 : temp <= 16 ? 0x38bdf8 : 0x22c55e;
            this.sensorLeds.dht22.material.color.setHex(hex);
        }
        if (this.sensorLeds.light) {
            const hex = lightPercent < 35 ? 0xd946ef : 0xfacc15;
            this.sensorLeds.light.material.color.setHex(hex);
        }
        if (this.sensorLeds.waterLevel && !this.alertBlinkState.waterLow) {
            this.sensorLeds.waterLevel.material.color.setHex(0x38bdf8);
        }
        if (this.sensorLeds.plantHealth && !this.alertBlinkState.hasRot) {
            this.sensorLeds.plantHealth.material.color.setHex(0x22c55e);
        }
    }

    updatePumpVibration(time, isPumping) {
        if (this.pumpMesh) {
            if (isPumping) {
                const vibX = Math.sin(time * 60) * 0.012;
                const vibY = Math.cos(time * 65) * 0.012;
                this.pumpMesh.position.x = -0.85 + vibX;
                this.pumpMesh.position.y = 1.05 + vibY;
            } else {
                this.pumpMesh.position.x = -0.85;
                this.pumpMesh.position.y = 1.05;
            }
        }

        // Spin ventilation fan blades smoothly when active
        if (this.fanBlades && this.isFanOn) {
            this.fanBlades.rotation.z -= 0.24;
        }

        // Pulse 3D warning beacons on rotting crops
        const blink = Math.sin(time * 7) > 0;
        const pulseScale = 0.92 + Math.sin(time * 6) * 0.14;
        Object.values(this.crops).forEach(crop => {
            if (crop.warningBeacon && crop.warningBeacon.visible) {
                crop.warningBeacon.rotation.y = time * 2.2;
                crop.warningBeacon.scale.setScalar(pulseScale);
            }
        });

        // Blink critical sensor LEDs
        if (this.alertBlinkState.waterLow && this.sensorLeds.waterLevel) {
            this.sensorLeds.waterLevel.material.color.setHex(blink ? 0xef4444 : 0x450a0a);
        }
        if (this.alertBlinkState.hasRot && this.sensorLeds.plantHealth) {
            this.sensorLeds.plantHealth.material.color.setHex(blink ? 0xef4444 : 0x450a0a);
        }
    }

    setWaterDrainProgress(normalizedLevel) {
        // normalizedLevel: 1.0 (full) down to 0.02 (nearly empty)
        const clamped = Math.max(0.0, Math.min(1.0, normalizedLevel));
        this.waterLevel = clamped;
        if (this.waterMesh) {
            if (clamped <= 0.02) {
                this.waterMesh.visible = false;
            } else {
                this.waterMesh.visible = true;
                this.waterMesh.scale.y = Math.max(0.06, clamped);
                const h = 0.75 * Math.max(0.06, clamped);
                this.waterMesh.position.y = 0.1 + h / 2;
            }
        }
    }

    setSoilMoistureVisual(moisturePercent) {
        const factor = moisturePercent / 100;
        const wetColor = new THREE.Color(0x3d2714).lerp(new THREE.Color(0x180f07), factor);
        this.soilMeshes.forEach(mesh => {
            if (mesh && mesh.material) {
                mesh.material.color.copy(wetColor);
                mesh.material.roughness = 0.85 - factor * 0.4;
            }
        });
    }

    setXRayMode(isXRay) {
        // Fade out exterior greenhouse frame, glass, and red base
        this.exteriorMaterials.forEach(mat => {
            mat.transparent = true;
            mat.opacity = isXRay ? 0.08 : 1.0;
            mat.depthWrite = !isXRay;
            mat.wireframe = isXRay;
        });

        this.glassMaterials.forEach(mat => {
            mat.opacity = isXRay ? 0.03 : 0.38;
        });
    }
}

window.GreenhouseModel = GreenhouseModel;
