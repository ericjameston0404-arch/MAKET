// Procedural high-resolution textures for 3D Smart Greenhouse
// Generates sharp, zero-latency canvas textures matching the real prototype

const Textures = {
    // 1. Solar Panel Photovoltaic Texture
    createSolarPanelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark navy/blue silicon base
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#0c1a2d');
        grad.addColorStop(0.5, '#132845');
        grad.addColorStop(1, '#0a1626');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle silicon crystalline micro-grain
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 3000; i++) {
            const rx = Math.random() * canvas.width;
            const ry = Math.random() * canvas.height;
            ctx.fillRect(rx, ry, 2, 2);
        }

        // Photovoltaic cells grid (2 rows x 4 columns)
        const cols = 4;
        const rows = 2;
        const padX = 20;
        const padY = 20;
        const cellW = (canvas.width - padX * (cols + 1)) / cols;
        const cellH = (canvas.height - padY * (rows + 1)) / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = padX + c * (cellW + padX);
                const y = padY + r * (cellH + padY);

                // Cell background (deep iridescent blue)
                ctx.fillStyle = '#163359';
                ctx.fillRect(x, y, cellW, cellH);

                // Cell chamfered corners (monocrystalline wafer style)
                ctx.fillStyle = '#0a1626';
                const chamfer = 16;
                // top-left
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + chamfer, y);
                ctx.lineTo(x, y + chamfer);
                ctx.fill();
                // top-right
                ctx.beginPath();
                ctx.moveTo(x + cellW, y);
                ctx.lineTo(x + cellW - chamfer, y);
                ctx.lineTo(x + cellW, y + chamfer);
                ctx.fill();
                // bot-left
                ctx.beginPath();
                ctx.moveTo(x, y + cellH);
                ctx.lineTo(x + chamfer, y + cellH);
                ctx.lineTo(x, y + cellH - chamfer);
                ctx.fill();
                // bot-right
                ctx.beginPath();
                ctx.moveTo(x + cellW, y + cellH);
                ctx.lineTo(x + cellW - chamfer, y + cellH);
                ctx.lineTo(x + cellW, y + cellH - chamfer);
                ctx.fill();

                // Fine grid lines (fingers)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
                ctx.lineWidth = 1;
                const numLines = 24;
                for (let i = 1; i < numLines; i++) {
                    const ly = y + (cellH / numLines) * i;
                    ctx.beginPath();
                    ctx.moveTo(x + 2, ly);
                    ctx.lineTo(x + cellW - 2, ly);
                    ctx.stroke();
                }

                // Two thick vertical silver busbars
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 2;

                const busbar1X = x + cellW * 0.33;
                const busbar2X = x + cellW * 0.67;

                ctx.beginPath();
                ctx.moveTo(busbar1X, y);
                ctx.lineTo(busbar1X, y + cellH);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(busbar2X, y);
                ctx.lineTo(busbar2X, y + cellH);
                ctx.stroke();

                ctx.shadowBlur = 0;
            }
        }

        // Outer white border and frame
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    },

    // 2. Songle Blue Relay Texture
    createRelayTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Songle vivid blue box
        ctx.fillStyle = '#0857b2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Bevel highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        // Silkscreen white text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';

        ctx.font = 'bold 42px Arial, sans-serif';
        ctx.fillText('SONGLE', canvas.width / 2, 90);

        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillText('SRD-05VDC-SL-C', canvas.width / 2, 140);

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '22px monospace';
        ctx.fillText('10A 250VAC   10A 125VAC', canvas.width / 2, 200);
        ctx.fillText('10A  30VDC   10A  28VDC', canvas.width / 2, 235);

        // Small schematic icon
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 90, 280, 180, 70);

        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('[ COIL: 5VDC ]', canvas.width / 2, 325);

        ctx.font = '18px monospace';
        ctx.fillText('SMART GREENHOUSE RELAY', canvas.width / 2, 420);
        ctx.fillText('KZ-ZERDE-2026', canvas.width / 2, 455);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    },

    // 3. Arduino & Controller Board PCB Texture
    createArduinoTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark cyan/navy solder mask
        ctx.fillStyle = '#0d4778';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Copper circuit trace lines
        ctx.strokeStyle = '#1a6bb5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 40; i++) {
            const sx = Math.random() * canvas.width;
            const sy = Math.random() * canvas.height;
            const len = 40 + Math.random() * 80;
            ctx.moveTo(sx, sy);
            if (Math.random() > 0.5) {
                ctx.lineTo(sx + len, sy);
                ctx.lineTo(sx + len + 20, sy + 20);
            } else {
                ctx.lineTo(sx, sy + len);
                ctx.lineTo(sx + 20, sy + len + 20);
            }
        }
        ctx.stroke();

        // Gold plated pin holes / solder pads
        for (let x = 40; x < canvas.width - 40; x += 35) {
            // top header
            ctx.fillStyle = '#d4af37';
            ctx.beginPath();
            ctx.arc(x, 30, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.arc(x, 30, 4, 0, Math.PI * 2);
            ctx.fill();

            // bottom header
            ctx.fillStyle = '#d4af37';
            ctx.beginPath();
            ctx.arc(x, canvas.height - 30, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.arc(x, canvas.height - 30, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Microcontroller chip footprint (ATmega328P)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(canvas.width / 2 - 120, canvas.height / 2 - 80, 240, 160);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 120, canvas.height / 2 - 80, 240, 160);

        // Chip dot
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 - 100, canvas.height / 2 - 60, 6, 0, Math.PI * 2);
        ctx.fill();

        // Chip text
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ATMEGA328P-AU', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px monospace';
        ctx.fillText('ARDUINO CORE 16MHz', canvas.width / 2, canvas.height / 2 + 30);

        // Silkscreen logos and labels
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.fillText('SMART GREENHOUSE', 220, 110);
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText('AUTONOMOUS CONTROLLER', 220, 140);
        ctx.fillText('ZERDE SCIENTIFIC PROJECT', 220, 170);

        // Pin names
        ctx.font = '14px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('TX  RX  RST GND D2  D3  D4  D5  D6  D7  D8  D9  D10 D11 D12', canvas.width / 2, 60);
        ctx.fillText('VIN GND RST 5V  A0  A1  A2  A3  A4  A5  A6  A7  AREF 3V3 D13', canvas.width / 2, canvas.height - 50);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    },

    // 4. Perforated Blue Constructor Plate Texture
    createConstructorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Bright blue plastic
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid of mounting holes
        const step = 64;
        const radius = 16;
        for (let y = step / 2; y < canvas.height; y += step) {
            for (let x = step / 2; x < canvas.width; x += step) {
                // Outer chamfer
                ctx.fillStyle = '#0369a1';
                ctx.beginPath();
                ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
                ctx.fill();

                // Dark hole
                ctx.fillStyle = '#082f49';
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Inner rim reflection
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(x, y, radius, Math.PI * 0.7, Math.PI * 1.5);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    },

    // 5. Rich Soil Texture
    createSoilTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Rich dark brown humus
        ctx.fillStyle = '#2b1d0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grain & organic texture
        const colors = ['#1a1106', '#3b2812', '#453018', '#1f1609', '#573c1d'];
        for (let i = 0; i < 15000; i++) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const s = 1 + Math.random() * 4;
            ctx.beginPath();
            ctx.arc(x, y, s, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    },

    // 6. Realistic Plant Leaf Texture
    createLeafTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Translucent leaf gradient
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#4ade80');
        grad.addColorStop(0.5, '#16a34a');
        grad.addColorStop(1, '#15803d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Central vein
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height);
        ctx.quadraticCurveTo(canvas.width / 2, canvas.height * 0.5, canvas.width / 2, 20);
        ctx.stroke();

        // Branching secondary veins
        ctx.lineWidth = 1.5;
        for (let y = 50; y < canvas.height - 30; y += 25) {
            // left branch
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, y);
            ctx.quadraticCurveTo(canvas.width * 0.3, y - 10, 20, y - 25);
            ctx.stroke();

            // right branch
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, y);
            ctx.quadraticCurveTo(canvas.width * 0.7, y - 10, canvas.width - 20, y - 25);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    },

    // 7. Cup Measurement Scale Texture
    createCupScaleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';

        // Ticks for milliliters
        const levels = [
            { ml: '200ml', y: 120, len: 45 },
            { ml: '150ml', y: 220, len: 45 },
            { ml: '100ml', y: 320, len: 45 },
            { ml: '50ml',  y: 420, len: 45 }
        ];

        levels.forEach(item => {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(30, item.y);
            ctx.lineTo(30 + item.len, item.y);
            ctx.stroke();
            ctx.fillText(item.ml, 30 + item.len + 10, item.y + 6);

            // Subticks
            ctx.lineWidth = 1.5;
            for (let sub = 1; sub <= 3; sub++) {
                const subY = item.y + sub * 25;
                if (subY < 480) {
                    ctx.beginPath();
                    ctx.moveTo(30, subY);
                    ctx.lineTo(55, subY);
                    ctx.stroke();
                }
            }
        });

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    },

    // 8. DHT22 Temperature & Air Humidity Sensor Vent Grill Texture
    createDHT22Texture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');

        // Clean white plastic casing
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        // Top label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DHT22', canvas.width / 2, 46);
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('TEMP & HUMIDITY', canvas.width / 2, 72);

        // Sensor ventilation grid
        ctx.fillStyle = '#1e293b';
        const cols = 6;
        const rows = 8;
        const startX = 32;
        const startY = 96;
        const cellW = 26;
        const cellH = 20;
        const gapX = 7;
        const gapY = 6;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                ctx.fillRect(startX + c * (cellW + gapX), startY + r * (cellH + gapY), cellW, cellH);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    },

    // 9. Light Sensor Panel (BH1750 / LDR) Texture
    createLightSensorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Dark blue sensor module PCB
        ctx.fillStyle = '#0f294a';
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 244, 244);

        // Photoresistor (LDR) golden/amber serpentine track circle
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(128, 118, 56, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Zigzag cadmium sulfide photoresistor line
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let y = 82; y <= 154; y += 14) {
            ctx.moveTo(88, y);
            ctx.lineTo(168, y);
        }
        ctx.stroke();

        // Label
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BH1750 LUX', 128, 215);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#7dd3fc';
        ctx.fillText('LIGHT SENSOR', 128, 238);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    },

    // 10. Cucumber Textured Green Skin
    createCucumberTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, '#14532d');
        grad.addColorStop(0.5, '#15803d');
        grad.addColorStop(1, '#166534');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        // Longitudinal lighter green stripes
        ctx.strokeStyle = 'rgba(134, 239, 172, 0.35)';
        ctx.lineWidth = 6;
        for (let x = 16; x < 256; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 256);
            ctx.stroke();
        }

        // Small cucumber bumps / dots
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            ctx.fillStyle = 'rgba(22, 101, 52, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(187, 247, 208, 0.45)';
            ctx.beginPath();
            ctx.arc(x - 1, y - 1, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }
};

window.Textures = Textures;
