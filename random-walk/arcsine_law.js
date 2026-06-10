/**
 * arcsine_law.js
 * 10,000回のシミュレーションを一気に実行し、
 * 3つのU字カーブ（逆正弦法則）のヒストグラムを描画するスクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run_simulation_btn');
    let histogramSketchInstance1 = null;
    let histogramSketchInstance2 = null;
    let histogramSketchInstance3 = null;

    function runMassSimulation() {
        runBtn.disabled = true;
        runBtn.textContent = '計算中...';

        setTimeout(() => {
            const p_prob = parseFloat(document.getElementById('prob_p').value);
            const n = parseInt(document.getElementById('num_steps_n').value);
            const k = parseInt(document.getElementById('num_simulations_k').value);

            if (isNaN(p_prob) || isNaN(n) || isNaN(k) || n < 10 || k < 100) {
                alert('有効な値を入力してください。nは10以上、kは1000以上を推奨します。');
                runBtn.disabled = false;
                runBtn.textContent = '大規模シミュレーション実行';
                return;
            }

            // 3つの法則それぞれの記録用配列
            const leadTimeCounts = new Array(n + 1).fill(0);
            const lastReturnCounts = new Array(n + 1).fill(0);
            const maxTimeCounts = new Array(n + 1).fill(0);

            for (let i = 0; i < k; i++) {
                let position = 0;
                let prevPosition = 0;
                
                let leadTime = 0;
                let lastReturnTime = 0;
                let maxPos = 0;
                let maxTime = 0;

                for (let t = 1; t <= n; t++) {
                    prevPosition = position;
                    position += (Math.random() < p_prob) ? 1 : -1;
                    
                    // 1. リード時間
                    if (position > 0 || (position === 0 && prevPosition > 0)) {
                        leadTime++;
                    }

                    // 2. 最後に同点に戻った時刻
                    if (position === 0) {
                        lastReturnTime = t;
                    }

                    // 3. 最大のリードを奪った時刻（初めて最大値に到達した時刻を採用）
                    if (position > maxPos) {
                        maxPos = position;
                        maxTime = t;
                    }
                }
                
                leadTimeCounts[leadTime]++;
                lastReturnCounts[lastReturnTime]++;
                maxTimeCounts[maxTime]++;
            }

            populateTable(leadTimeCounts, k, n);
            
            // 汎用描画関数を使って3つのヒストグラムを描画
            drawGenericHistogram(leadTimeCounts, k, n, 'lead-time-histogram-container', 'Aチームがリードした時間の割合', histogramSketchInstance1, (inst) => histogramSketchInstance1 = inst);
            drawGenericHistogram(lastReturnCounts, k, n, 'last-return-histogram-container', '最後に同点に戻った時刻の割合', histogramSketchInstance2, (inst) => histogramSketchInstance2 = inst);
            drawGenericHistogram(maxTimeCounts, k, n, 'max-time-histogram-container', '最大のリードを奪う時刻の割合', histogramSketchInstance3, (inst) => histogramSketchInstance3 = inst);

            runBtn.disabled = false;
            runBtn.textContent = '大規模シミュレーション実行';
        }, 50); 
    }

    function populateTable(counts, k, n) {
        const tableBody = document.getElementById('lead-time-body');
        tableBody.innerHTML = '';
        
        const bins = 10;
        const binSize = n / bins;
        const aggregated = new Array(bins).fill(0);

        counts.forEach((count, time) => {
            let binIndex = Math.floor(time / binSize);
            if (binIndex >= bins) binIndex = bins - 1; 
            aggregated[binIndex] += count;
        });

        aggregated.forEach((count, idx) => {
            const row = tableBody.insertRow();
            const rangeStart = idx * 10;
            const rangeEnd = (idx + 1) * 10;
            row.insertCell().textContent = `${rangeStart}% 〜 ${rangeEnd}%`;
            row.insertCell().textContent = count.toLocaleString();
            row.insertCell().textContent = ((count / k) * 100).toFixed(1) + '%';
            
            if (idx === 0 || idx === bins - 1) {
                row.style.fontWeight = 'bold';
                row.style.backgroundColor = '#fff3cd'; 
            }
        });
    }

    // 汎用ヒストグラム描画関数
    function drawGenericHistogram(counts, k, n, containerId, xLabel, currentInstance, setInstance) {
        const container = document.getElementById(containerId);
        if (currentInstance) currentInstance.remove();

        const sketch = (p) => {
            const binCount = Math.min(n + 1, 50);
            const binnedCounts = new Array(binCount).fill(0);
            counts.forEach((count, time) => {
                let binIndex = Math.floor((time / n) * binCount);
                if (binIndex >= binCount) binIndex = binCount - 1;
                binnedCounts[binIndex] += count;
            });
            
            const relativeFreqs = binnedCounts.map(c => c / k);
            const maxFreq = Math.max(...relativeFreqs, 0.05); 

            p.setup = () => {
                const w = container.parentElement.clientWidth - 40;
                p.createCanvas(w > 600 ? 600 : w, 350);
                p.noLoop();
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 30, bottom: 50, left: 60, right: 20 };
                const gH = p.height - padding.top - padding.bottom;
                const gW = p.width - padding.left - padding.right;

                p.stroke(240); p.strokeWeight(1);
                for(let i=0; i<=4; i++) {
                    let y = padding.top + (i/4)*gH;
                    p.line(padding.left, y, padding.left + gW, y);
                }

                const barWidth = gW / binCount;
                for (let i = 0; i < binCount; i++) {
                    const barHeight = p.map(relativeFreqs[i], 0, maxFreq, 0, gH);
                    const x = padding.left + i * barWidth;
                    const y = padding.top + gH - barHeight;
                    p.fill(33, 150, 243, 180); 
                    p.stroke(30, 136, 229);
                    p.rect(x, y, barWidth, barHeight);
                }

                const p_prob = parseFloat(document.getElementById('prob_p').value);
                if (Math.abs(p_prob - 0.5) < 0.01) {
                    p.stroke(211, 47, 47); 
                    p.noFill(); 
                    p.strokeWeight(2.5);
                    p.beginShape();
                    for (let x_ratio = 0.01; x_ratio <= 0.99; x_ratio += 0.01) {
                        const pdf = 1 / (Math.PI * Math.sqrt(x_ratio * (1 - x_ratio)));
                        const scaled_y = pdf * (1 / binCount);
                        const x = padding.left + x_ratio * gW;
                        const y = padding.top + gH - p.map(scaled_y, 0, maxFreq, 0, gH);
                        if (y > padding.top - 10) { 
                            p.vertex(x, y);
                        }
                    }
                    p.endShape();
                    
                    p.fill(211, 47, 47); p.noStroke(); p.textAlign(p.RIGHT, p.TOP);
                    p.textSize(12);
                    p.text("― 理論値（逆正弦法則）", p.width - padding.right, padding.top);
                }

                p.stroke(0); p.strokeWeight(1.5);
                p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH);
                p.line(padding.left, padding.top, padding.left, padding.top + gH);

                p.noStroke(); p.fill(0); p.textSize(12);
                p.textAlign(p.CENTER, p.TOP);
                p.text(xLabel, padding.left + gW/2, padding.top + gH + 25);
                for (let i = 0; i <= 5; i++) {
                    let ratio = i * 20; 
                    let x = padding.left + (i/5) * gW;
                    p.text(ratio + "%", x, padding.top + gH + 5);
                }

                p.textAlign(p.RIGHT, p.CENTER);
                p.push();
                p.translate(padding.left - 45, padding.top + gH / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("確率（相対度数）", 0, 0);
                p.pop();
                for (let i = 0; i <= 4; i++) {
                    const ratio = i / 4;
                    const val = ratio * maxFreq;
                    const y = padding.top + gH - ratio * gH;
                    p.text(val.toFixed(3), padding.left - 10, y);
                }
            };
        };
        setInstance(new p5(sketch, container));
    }

    runBtn.addEventListener('click', runMassSimulation);
    setTimeout(runMassSimulation, 1000);
});