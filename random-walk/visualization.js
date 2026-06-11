/**
 * visualization.js
 * 1試合のランダムウォークをリアルタイムにアニメーション描画し、
 * 3つの指標（逆正弦法則）を同時に追跡するスクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
    let p5Instance = null;
    const startBtn = document.getElementById('start-live-btn');
    const pauseBtn = document.getElementById('pause-live-btn');
    const statusText = document.getElementById('live-status');

    let isPaused = false;

    pauseBtn.addEventListener('click', () => {
        if (!p5Instance) return;
        
        isPaused = !isPaused;
        if (isPaused) {
            p5Instance.noLoop();
            pauseBtn.textContent = '▶ 再開';
            pauseBtn.style.backgroundColor = '#28a745';
            statusText.textContent = "一時停止中...";
        } else {
            p5Instance.loop();
            pauseBtn.textContent = '⏸ 一時停止';
            pauseBtn.style.backgroundColor = '#6c757d';
            statusText.textContent = "試合進行中...";
        }
    });

    function startLiveMatch() {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        isPaused = false;
        pauseBtn.textContent = '⏸ 一時停止';
        pauseBtn.style.backgroundColor = '#6c757d';
        statusText.textContent = "試合進行中...";
        
        if (p5Instance) p5Instance.remove();

        const n = 100; // アニメーションのステップ数
        const p_prob = parseFloat(document.getElementById('prob_p').value) || 0.5;
        
        let path = [0]; 
        let currentT = 0;
        
        // 3つの指標
        let leadTimeA = 0;
        let lastReturnTime = 0;
        let maxPos = 0;
        let maxTime = 0;

        const sketch = (p) => {
            let yMax = 5; 
            
            p.setup = () => {
                const w = document.getElementById('walk-graph-container').clientWidth;
                p.createCanvas(w || 600, 350);
                p.frameRate(30); 
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 20, bottom: 50, left: 60, right: 20 };
                const gW = p.width - padding.left - padding.right;
                const gH = p.height - padding.top - padding.bottom;
                const yZero = padding.top + gH / 2;

                if (currentT < n) {
                    currentT++;
                    let step = (Math.random() < p_prob) ? 1 : -1;
                    let nextPos = path[path.length - 1] + step;
                    path.push(nextPos);

                    if (Math.abs(nextPos) > yMax - 2) yMax = Math.abs(nextPos) + 2;

                    // 1. リード時間の計算
                    if (nextPos > 0 || (nextPos === 0 && path[currentT - 1] > 0)) {
                        leadTimeA++;
                    }

                    // 2. 最後に同点に戻った時刻
                    if (nextPos === 0) {
                        lastReturnTime = currentT;
                    }

                    // 3. 最大のリードを奪った時刻
                    if (nextPos > maxPos) {
                        maxPos = nextPos;
                        maxTime = currentT;
                    }

                    // UIのパーセンテージ（nに対する割合）を更新
                    let leadPct = (leadTimeA / n) * 100;
                    document.getElementById('live-lead-pct').textContent = leadPct.toFixed(0) + '%';
                    document.getElementById('live-lead-steps').textContent = leadTimeA;
                    document.getElementById('gauge-bar-lead').style.width = leadPct + '%';

                    let returnPct = (lastReturnTime / n) * 100;
                    document.getElementById('live-last-return-pct').textContent = returnPct.toFixed(0) + '%';
                    document.getElementById('live-last-return').textContent = lastReturnTime;
                    document.getElementById('gauge-bar-return').style.width = returnPct + '%';

                    let maxPct = (maxTime / n) * 100;
                    document.getElementById('live-max-time-pct').textContent = maxPct.toFixed(0) + '%';
                    document.getElementById('live-max-time').textContent = maxTime;
                    document.getElementById('live-max-val').textContent = maxPos;
                    document.getElementById('gauge-bar-max').style.width = maxPct + '%';

                } else {
                    p.noLoop();
                    statusText.textContent = "試合終了！";
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                }

                // --- 描画 ---
                p.noStroke();
                p.fill(255, 235, 238, 150); 
                p.rect(padding.left, padding.top, gW, gH / 2);
                p.fill(227, 242, 253, 150); 
                p.rect(padding.left, yZero, gW, gH / 2);

                // --- グリッド線（横軸と平行な線） ---
                let yStep = 1;
                if (yMax > 10) yStep = 2;
                if (yMax > 20) yStep = 5;
                if (yMax > 50) yStep = 10;

                p.stroke(220);
                p.strokeWeight(1);
                for (let i = -Math.ceil(yMax); i <= Math.ceil(yMax); i += yStep) {
                    if (i === 0) continue; 
                    let y = p.map(i, -yMax, yMax, padding.top + gH, padding.top);
                    p.line(padding.left, y, padding.left + gW, y);
                }

                p.stroke(150); p.strokeWeight(1);
                p.line(padding.left, padding.top, padding.left, padding.top + gH);
                p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH);
                
                p.stroke(100); p.strokeWeight(2);
                p.line(padding.left, yZero, padding.left + gW, yZero);

                p.noStroke(); p.fill(80); p.textSize(12);
                p.textAlign(p.RIGHT, p.CENTER);
                for (let i = -Math.ceil(yMax); i <= Math.ceil(yMax); i += yStep) {
                    let y = p.map(i, -yMax, yMax, padding.top + gH, padding.top);
                    p.text(i, padding.left - 8, y);
                }
                
                p.push();
                p.translate(padding.left - 40, padding.top + gH / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.fill(50);
                p.text("Aチームのリード (点差)", 0, 0);
                p.pop();

                p.textAlign(p.CENTER, p.TOP);
                p.fill(50);
                p.text("時間 t (ステップ数)", padding.left + gW / 2, padding.top + gH + 20);
                p.fill(80);
                p.text(0, padding.left, padding.top + gH + 5);
                p.text(n, padding.left + gW, padding.top + gH + 5);

                // 軌跡の描画
                p.stroke(50);
                p.strokeWeight(2);
                p.noFill();
                p.beginShape();
                for (let t = 0; t <= currentT; t++) {
                    let x = p.map(t, 0, n, padding.left, padding.left + gW);
                    let y = p.map(path[t], -yMax, yMax, padding.top + gH, padding.top);
                    p.vertex(x, y);
                }
                p.endShape();

                // 軌跡の先端
                if (currentT > 0) {
                    let lastX = p.map(currentT, 0, n, padding.left, padding.left + gW);
                    let lastY = p.map(path[currentT], -yMax, yMax, padding.top + gH, padding.top);
                    p.fill(path[currentT] > 0 ? '#e53935' : (path[currentT] < 0 ? '#1976d2' : '#555'));
                    p.noStroke();
                    p.circle(lastX, lastY, 8);
                }

                // --- 最後の同点 (緑) と 最大リード (オレンジ) のハイライト ---
                if (lastReturnTime > 0) {
                    let x = p.map(lastReturnTime, 0, n, padding.left, padding.left + gW);
                    let y = p.map(0, -yMax, yMax, padding.top + gH, padding.top);
                    p.fill(255); p.stroke('#4caf50'); p.strokeWeight(3);
                    p.circle(x, y, 14);
                    p.fill('#4caf50'); p.noStroke();
                    p.circle(x, y, 6);
                }

                if (maxTime > 0) {
                    let x = p.map(maxTime, 0, n, padding.left, padding.left + gW);
                    let y = p.map(path[maxTime], -yMax, yMax, padding.top + gH, padding.top);
                    p.fill(255); p.stroke('#ff9800'); p.strokeWeight(3);
                    p.circle(x, y, 14);
                    p.fill('#ff9800'); p.noStroke();
                    p.circle(x, y, 6);
                }
            };

            p.windowResized = () => {
                const w = document.getElementById('walk-graph-container').clientWidth;
                p.resizeCanvas(w || 600, 350);
            };
        };

        p5Instance = new p5(sketch, document.getElementById('walk-graph-container'));
    }

    startBtn.addEventListener('click', startLiveMatch);
    setTimeout(startLiveMatch, 500);
});