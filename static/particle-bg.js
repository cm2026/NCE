/**
 * 荧光粒子背景效果
 * 创建动态的荧光点悬浮背景
 */

class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with id "${canvasId}" not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 15; // 进一步减少粒子数量
        this.mouse = { x: null, y: null, radius: 250 };

        this.colorData = [
            // 绿色系
            { hex: '#1DB954', rgb: [29, 185, 84] },
            { hex: '#1EFF50', rgb: [30, 255, 80] },
            { hex: '#00FFB3', rgb: [0, 255, 179] },
            { hex: '#3DFFB8', rgb: [61, 255, 184] },
            { hex: '#7FFF00', rgb: [127, 255, 0] },
            { hex: '#00FF7F', rgb: [0, 255, 127] },
            { hex: '#20E8A0', rgb: [32, 232, 160] },
            { hex: '#4FFFB0', rgb: [79, 255, 176] },
            { hex: '#60FFC0', rgb: [96, 255, 192] },
            { hex: '#32CD32', rgb: [50, 205, 50] },
            // 青色系
            { hex: '#00F5FF', rgb: [0, 245, 255] },
            { hex: '#00CED1', rgb: [0, 206, 209] },
            { hex: '#40E0D0', rgb: [64, 224, 208] },
            { hex: '#48D1CC', rgb: [72, 209, 204] },
            { hex: '#7FFFD4', rgb: [127, 255, 212] },
            { hex: '#AFEEEE', rgb: [175, 238, 238] },
            { hex: '#00FFFF', rgb: [0, 255, 255] },
            // 蓝色系
            { hex: '#1E90FF', rgb: [30, 144, 255] },
            { hex: '#00BFFF', rgb: [0, 191, 255] },
            { hex: '#87CEEB', rgb: [135, 206, 235] },
            { hex: '#87CEFA', rgb: [135, 206, 250] },
            { hex: '#4169E1', rgb: [65, 105, 225] },
            { hex: '#6495ED', rgb: [100, 149, 237] },
            // 紫色系
            { hex: '#9370DB', rgb: [147, 112, 219] },
            { hex: '#8A2BE2', rgb: [138, 43, 226] },
            { hex: '#9400D3', rgb: [148, 0, 211] },
            { hex: '#BA55D3', rgb: [186, 85, 211] },
            { hex: '#DA70D6', rgb: [218, 112, 214] },
            { hex: '#EE82EE', rgb: [238, 130, 238] },
            { hex: '#DDA0DD', rgb: [221, 160, 221] },
            // 粉色系
            { hex: '#FF69B4', rgb: [255, 105, 180] },
            { hex: '#FF1493', rgb: [255, 20, 147] },
            { hex: '#FF6EC7', rgb: [255, 110, 199] },
            { hex: '#FFB6C1', rgb: [255, 182, 193] },
            // 橙色系
            { hex: '#FF8C00', rgb: [255, 140, 0] },
            { hex: '#FFA500', rgb: [255, 165, 0] },
            { hex: '#FF7F50', rgb: [255, 127, 80] },
            { hex: '#FFB347', rgb: [255, 179, 71] },
            // 黄色系
            { hex: '#FFD700', rgb: [255, 215, 0] },
            { hex: '#FFFF00', rgb: [255, 255, 0] },
            { hex: '#F0E68C', rgb: [240, 230, 140] },
            { hex: '#FFFFE0', rgb: [255, 255, 224] },
            // 红色系
            { hex: '#FF4500', rgb: [255, 69, 0] },
            { hex: '#FF6347', rgb: [255, 99, 71] },
            { hex: '#FF0000', rgb: [255, 0, 0] },
            { hex: '#DC143C', rgb: [220, 20, 60] }
        ];

        // 性能监控
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 60;
        this.fpsHistory = [];
        this.performanceCheckInterval = 60;

        // 禁区设置（header和footer）
        this.excludedZones = [];
        // 缓存DOM元素引用
        this.headerElement = null;
        this.footerElement = null;
        this.updateExcludedZones();

        this.init();
        this.animate();
        this.addEventListeners();
    }

    updateExcludedZones() {
        this.excludedZones = [];

        // 缓存DOM查询（只在第一次或元素为null时查询）
        if (!this.headerElement) {
            this.headerElement = document.querySelector('.header');
        }
        if (!this.footerElement) {
            this.footerElement = document.querySelector('footer');
        }

        // 获取header区域
        if (this.headerElement) {
            const rect = this.headerElement.getBoundingClientRect();
            this.excludedZones.push({
                top: 0,
                bottom: rect.bottom,
                left: 0,
                right: this.canvas.width,
                name: 'header'
            });
        }

        // 获取footer区域
        if (this.footerElement) {
            const rect = this.footerElement.getBoundingClientRect();
            this.excludedZones.push({
                top: rect.top,
                bottom: this.canvas.height,
                left: 0,
                right: this.canvas.width,
                name: 'footer'
            });
        }
    }

    isInExcludedZone(x, y) {
        for (const zone of this.excludedZones) {
            if (x >= zone.left && x <= zone.right &&
                y >= zone.top && y <= zone.bottom) {
                return zone;
            }
        }
        return null;
    }

    getValidPosition() {
        let x, y;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            x = Math.random() * this.canvas.width;
            y = Math.random() * this.canvas.height;
            attempts++;
        } while (this.isInExcludedZone(x, y) && attempts < maxAttempts);

        // 如果100次都没找到合适位置，放在中间区域
        if (attempts >= maxAttempts) {
            const headerBottom = this.excludedZones.find(z => z.name === 'header')?.bottom || 100;
            const footerTop = this.excludedZones.find(z => z.name === 'footer')?.top || this.canvas.height - 100;
            y = headerBottom + Math.random() * (footerTop - headerBottom);
        }

        return { x, y };
    }

    init() {
        this.resizeCanvas();
        this.updateExcludedZones();
        this.createParticles();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.updateExcludedZones();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            const pos = this.getValidPosition();
            const colorData = this.colorData[Math.floor(Math.random() * this.colorData.length)];
            this.particles.push({
                x: pos.x,
                y: pos.y,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 6 + 5,
                colorData: colorData, // 存储颜色数据对象引用
                hex: colorData.hex,
                rgb: colorData.rgb,
                pulseSpeed: Math.random() * 0.01 + 0.005,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    drawParticle(particle) {
        // 脉动效果
        particle.pulsePhase += particle.pulseSpeed;
        const pulse = Math.sin(particle.pulsePhase) * 0.35 + 1;
        const currentRadius = particle.radius * pulse;
        const opacity = Math.sin(particle.pulsePhase) * 0.25 + 0.7;

        const [r, g, b] = particle.rgb;

        this.ctx.save();

        // 添加模糊滤镜使光晕过渡更平滑
        if (!document.body.classList.contains('low-performance')) {
            this.ctx.filter = 'blur(3px)';
        }

        // 外层超大光晕
        const outerGlowGradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, currentRadius * 20
        );
        const outerOpacity1 = opacity * 0.5;
        const outerOpacity2 = opacity * 0.3;
        const outerOpacity3 = opacity * 0.15;
        outerGlowGradient.addColorStop(0, `rgba(${r},${g},${b},${outerOpacity1})`);
        outerGlowGradient.addColorStop(0.2, `rgba(${r},${g},${b},${outerOpacity2})`);
        outerGlowGradient.addColorStop(0.5, `rgba(${r},${g},${b},${outerOpacity3})`);
        outerGlowGradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

        this.ctx.fillStyle = outerGlowGradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, currentRadius * 20, 0, Math.PI * 2);
        this.ctx.fill();

        // 中层光晕
        const midGlowGradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, currentRadius * 10
        );
        const midOpacity1 = opacity * 0.8;
        const midOpacity2 = opacity * 0.5;
        midGlowGradient.addColorStop(0, `rgba(${r},${g},${b},${midOpacity1})`);
        midGlowGradient.addColorStop(0.4, `rgba(${r},${g},${b},${midOpacity2})`);
        midGlowGradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

        this.ctx.fillStyle = midGlowGradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, currentRadius * 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.filter = 'none';

        // 核心发光体（只在性能足够时使用shadowBlur）
        if (!document.body.classList.contains('low-performance')) {
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = `rgba(${r},${g},${b},${opacity * 0.6})`;
        }
        this.ctx.globalAlpha = opacity * 0.7;
        this.ctx.fillStyle = particle.hex;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, currentRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // 超亮核心点
        if (!document.body.classList.contains('low-performance')) {
            this.ctx.shadowBlur = 15;
        }
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.globalAlpha = opacity * 0.4;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, currentRadius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawConnections() {
        const isLowPerf = document.body.classList.contains('low-performance');

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 280) {
                    const opacity = (1 - distance / 280) * 0.35;

                    // 直接使用预计算的RGB值
                    const rgb1 = this.particles[i].rgb;
                    const rgb2 = this.particles[j].rgb;

                    // 混合颜色（位运算优化）
                    const r = (rgb1[0] + rgb2[0]) >> 1;
                    const g = (rgb1[1] + rgb2[1]) >> 1;
                    const b = (rgb1[2] + rgb2[2]) >> 1;

                    this.ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
                    this.ctx.lineWidth = 1.5;

                    // 低性能模式下不使用shadowBlur
                    if (!isLowPerf) {
                        this.ctx.shadowBlur = 3;
                        this.ctx.shadowColor = `rgba(${r},${g},${b},${opacity * 0.5})`;
                    }

                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();

                    // 重置shadowBlur
                    if (!isLowPerf) {
                        this.ctx.shadowBlur = 0;
                    }
                }
            }
        }
    }

    updateParticle(particle) {
        // 边界检测和反弹
        if (particle.x < 0 || particle.x > this.canvas.width) {
            particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > this.canvas.height) {
            particle.vy *= -1;
        }

        // 检测禁区并反弹
        const zone = this.isInExcludedZone(particle.x, particle.y);
        if (zone) {
            const centerY = (zone.top + zone.bottom) * 0.5; // 优化乘法

            if (particle.y < centerY) {
                particle.vy = -Math.abs(particle.vy);
                particle.y = zone.top - 10;
            } else {
                particle.vy = Math.abs(particle.vy);
                particle.y = zone.bottom + 10;
            }
        }

        // 鼠标交互 - 吸引效果
        if (this.mouse.x !== null) {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distSq = dx * dx + dy * dy;
            const radiusSq = this.mouse.radius * this.mouse.radius;

            if (distSq < radiusSq) {
                const distance = Math.sqrt(distSq);
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                const forceAmount = force * 0.05;
                particle.vx += Math.cos(angle) * forceAmount;
                particle.vy += Math.sin(angle) * forceAmount;
            }
        }

        // 速度衰减
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // 确保最小速度
        const absVx = Math.abs(particle.vx);
        const absVy = Math.abs(particle.vy);
        if (absVx < 0.05) particle.vx += (Math.random() - 0.5) * 0.05;
        if (absVy < 0.05) particle.vy += (Math.random() - 0.5) * 0.05;

        // 限制最大速度
        const maxSpeed = 1;
        particle.vx = Math.max(-maxSpeed, Math.min(maxSpeed, particle.vx));
        particle.vy = Math.max(-maxSpeed, Math.min(maxSpeed, particle.vy));

        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 确保粒子在画布内
        particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
    }

    checkPerformance() {
        const currentTime = performance.now();
        const delta = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // 计算当前FPS
        this.fpsHistory.push(1000 / delta);

        // 每60帧检查一次性能
        if (++this.frameCount >= this.performanceCheckInterval) {
            // 计算平均FPS
            let sum = 0;
            const len = this.fpsHistory.length;
            for (let i = 0; i < len; i++) {
                sum += this.fpsHistory[i];
            }
            const avgFps = sum / len;
            this.fps = avgFps;

            // 如果平均FPS低于30，禁用backdrop-filter
            if (avgFps < 30 && !document.body.classList.contains('low-performance')) {
                console.warn(`检测到低性能（FPS: ${avgFps.toFixed(1)}），已禁用毛玻璃效果`);
                document.body.classList.add('low-performance');
            }

            // 重置
            this.frameCount = 0;
            this.fpsHistory.length = 0;
        }
    }

    animate() {
        // 性能检测
        this.checkPerformance();

        // 完全清空画布
        this.ctx.fillStyle = '#121212';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制连接线
        this.drawConnections();

        // 更新和绘制粒子
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });

        requestAnimationFrame(() => this.animate());
    }

    addEventListeners() {
        // 优化resize事件，使用防抖
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
                this.createParticles();
            }, 150);
        });

        // 优化scroll事件，使用防抖
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateExcludedZones();
            }, 150);
        }, { passive: true });

        // 鼠标事件
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // 触摸设备支持
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ParticleBackground('particle-canvas');
});
