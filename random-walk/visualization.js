/**
 * visualization.js
 * 1試合のランダムウォークをリアルタイムにアニメーション描画し、
 * 逆正弦法則の「片方に偏る」残酷さを体感させるスクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
    let p5Instance = null;
    const startBtn = document.getElementById('start-live-btn');
    const pauseBtn = document.getElementById('pause-live-btn');
    const statusText = document.getElementById('live-status');
    const gaugeBarA = document.getElementById('gauge-bar-a');
    const pctA = document.getElementById('live-a-pct');
    const pctB = document.getElementById('live-b-pct');
    const stepsA = document.getElementById('live-a-steps');
    const stepsB = document.getElementById('live-b-steps');
    const totalStepsA = document.getElementById('live-total-steps-a');
    const totalStepsB = document.getElementById('live-total-steps-b');

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

        const n = 100;
        const p_prob = parseFloat(document.getElementById('prob_p').value) || 0.5;
        
        let path = [0]; 
        let currentT = 0;
        let leadTimeA = 0;

        const sketch = (p) => {
            let yMax = 5; 
            
            p.setup = () => {
                const w = document.getElementById('walk-graph-container').clientWidth;
                p.createCanvas(w || 600, 300);
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

                    if (nextPos > 0 || (nextPos === 0 && path[currentT - 1] > 0)) {
                        leadTimeA++;
                    }

                    let ratioA = (leadTimeA / currentT) * 100;
                    gaugeBarA.style.width = `${ratioA}%`;
                    pctA.textContent = `${Math.round(ratioA)}%`;
                    pctB.textContent = `${100 - Math.round(ratioA)}%`;
                    
                    stepsA.textContent = leadTimeA;
                    stepsB.textContent = currentT - leadTimeA;
                    totalStepsA.textContent = currentT;
                    totalStepsB.textContent = currentT;

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

                // --- グリッド線（横軸と平行な線）の追加 ---
                // yMaxの大きさに応じてグリッドの間隔を調整する
                let yStep = 1;
                if (yMax > 10) yStep = 2;
                if (yMax > 20) yStep = 5;
                if (yMax > 50) yStep = 10;

                p.stroke(220); // 薄いグレー
                p.strokeWeight(1);
                for (let i = -Math.ceil(yMax); i <= Math.ceil(yMax); i += yStep) {
                    if (i === 0) continue; // 0の線は後で濃く引く
                    let y = p.map(i, -yMax, yMax, padding.top + gH, padding.top);
                    p.line(padding.left, y, padding.left + gW, y);
                }

                // 外枠と0のライン
                p.stroke(150); p.strokeWeight(1);
                p.line(padding.left, padding.top, padding.left, padding.top + gH);
                p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH);
                
                p.stroke(100); p.strokeWeight(2); // 0のラインを強調
                p.line(padding.left, yZero, padding.left + gW, yZero);

                // Y軸の目盛りと数値
                p.noStroke(); p.fill(80); p.textSize(12);
                p.textAlign(p.RIGHT, p.CENTER);
                for (let i = -Math.ceil(yMax); i <= Math.ceil(yMax); i += yStep) {
                    let y = p.map(i, -yMax, yMax, padding.top + gH, padding.top);
                    p.text(i, padding.left - 8, y);
                }
                
                // --- 追加：縦軸・横軸のラベル ---
                // 縦軸ラベル
                p.push();
                p.translate(padding.left - 40, padding.top + gH / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.fill(50);
                p.text("Aチームのリード (点差)", 0, 0);
                p.pop();

                // X軸の数値とラベル
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

                if (currentT > 0) {
                    let lastX = p.map(currentT, 0, n, padding.left, padding.left + gW);
                    let lastY = p.map(path[currentT], -yMax, yMax, padding.top + gH, padding.top);
                    p.fill(path[currentT] > 0 ? '#d32f2f' : (path[currentT] < 0 ? '#1976d2' : '#555'));
                    p.noStroke();
                    p.circle(lastX, lastY, 8);
                }
            };

            p.windowResized = () => {
                const w = document.getElementById('walk-graph-container').clientWidth;
                p.resizeCanvas(w || 600, 300);
            };
        };

        p5Instance = new p5(sketch, document.getElementById('walk-graph-container'));
    }

    startBtn.addEventListener('click', startLiveMatch);
    setTimeout(startLiveMatch, 500);
});