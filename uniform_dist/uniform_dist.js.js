/**
 * 一様分布シミュレーター
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const sliderA = document.getElementById('slider-a');
    const sliderB = document.getElementById('slider-b');
    const valA = document.getElementById('val-a');
    const valB = document.getElementById('val-b');

    const btnSample1 = document.getElementById('btn-sample-1');
    const btnSample100 = document.getElementById('btn-sample-100');
    const btnSample1000 = document.getElementById('btn-sample-1000');
    const btnSample10000 = document.getElementById('btn-sample-10000');
    const btnClear = document.getElementById('btn-clear');

    const statCount = document.getElementById('stat-count');
    const theoryMean = document.getElementById('theory-mean');
    const sampleMean = document.getElementById('sample-mean');
    const theoryVar = document.getElementById('theory-var');
    const sampleVar = document.getElementById('sample-var');

    let samples = [];

    // パラメータ変更時の処理（a < b を維持）
    function updateParameters() {
        let a = parseFloat(sliderA.value);
        let b = parseFloat(sliderB.value);

        if (a >= b) {
            if (document.activeElement === sliderA) {
                b = a + 0.5;
                if (b > parseFloat(sliderB.max)) {
                    b = parseFloat(sliderB.max);
                    a = b - 0.5;
                    sliderA.value = a;
                }
                sliderB.value = b;
            } else {
                a = b - 0.5;
                if (a < parseFloat(sliderA.min)) {
                    a = parseFloat(sliderA.min);
                    b = a + 0.5;
                    sliderB.value = b;
                }
                sliderA.value = a;
            }
        }

        valA.textContent = a.toFixed(1);
        valB.textContent = b.toFixed(1);

        // 理論値の更新
        const tMean = (a + b) / 2;
        const tVar = Math.pow(b - a, 2) / 12;
        theoryMean.textContent = tMean.toFixed(3);
        theoryVar.textContent = tVar.toFixed(3);

        updateSampleStats();
    }

    // サンプル生成
    function generateSamples(count) {
        const a = parseFloat(sliderA.value);
        const b = parseFloat(sliderB.value);
        
        for (let i = 0; i < count; i++) {
            const val = Math.random() * (b - a) + a;
            samples.push(val);
        }
        updateSampleStats();
    }

    // 標本統計データの更新
    function updateSampleStats() {
        const count = samples.length;
        statCount.textContent = count;

        if (count === 0) {
            sampleMean.textContent = '--';
            sampleVar.textContent = '--';
            return;
        }

        let sum = 0;
        for (let i = 0; i < count; i++) {
            sum += samples[i];
        }
        const sMean = sum / count;
        sampleMean.textContent = sMean.toFixed(3);

        let sumSqDiff = 0;
        for (let i = 0; i < count; i++) {
            sumSqDiff += Math.pow(samples[i] - sMean, 2);
        }
        const sVar = sumSqDiff / count;
        sampleVar.textContent = sVar.toFixed(3);
    }

    // イベントリスナーの登録
    sliderA.addEventListener('input', updateParameters);
    sliderB.addEventListener('input', updateParameters);

    btnSample1.addEventListener('click', () => generateSamples(1));
    btnSample100.addEventListener('click', () => generateSamples(100));
    btnSample1000.addEventListener('click', () => generateSamples(1000));
    btnSample10000.addEventListener('click', () => generateSamples(10000));
    
    btnClear.addEventListener('click', () => {
        samples = [];
        updateSampleStats();
    });

    // 初期化実行
    updateParameters();

    // p5.jsによる描画ロジック
    const sketch = (p) => {
        const xMin = -1.0;
        const xMax = 11.0;
        const yMin = 0.0;
        const yMax = 2.2;

        let padding = { top: 40, right: 30, bottom: 50, left: 60 };
        let gW, gH;

        p.setup = () => {
            const container = document.getElementById('canvas-container');
            const width = container.offsetWidth || 600;
            const height = 380;
            p.createCanvas(width, height).parent(container);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };

        p.draw = () => {
            p.background(255);

            const a = parseFloat(sliderA.value);
            const b = parseFloat(sliderB.value);

            // 1. サンプルヒストグラムの描画
            if (samples.length > 0) {
                const binWidth = 0.2; 
                const numBins = Math.ceil((xMax - xMin) / binWidth);
                const bins = new Array(numBins).fill(0);

                for (let i = 0; i < samples.length; i++) {
                    const val = samples[i];
                    if (val >= xMin && val < xMax) {
                        const binIdx = Math.floor((val - xMin) / binWidth);
                        if (binIdx >= 0 && binIdx < numBins) {
                            bins[binIdx]++;
                        }
                    }
                }

                p.fill(38, 166, 154, 140); // ターコイズ色の半透明
                p.noStroke();
                
                for (let i = 0; i < numBins; i++) {
                    const count = bins[i];
                    if (count === 0) continue;

                    // 面積が相対度数になるよう、密度に変換
                    const density = (count / samples.length) / binWidth;

                    const bX1 = xMin + i * binWidth;
                    const bX2 = bX1 + binWidth;

                    const px1 = p.map(bX1, xMin, xMax, padding.left, padding.left + gW);
                    const px2 = p.map(bX2, xMin, xMax, padding.left, padding.left + gW);
                    const py = p.map(density, yMin, yMax, padding.top + gH, padding.top);
                    const pyBase = p.map(0, yMin, yMax, padding.top + gH, padding.top);

                    p.rect(px1, py, px2 - px1, pyBase - py);
                }
            }

            // 2. 理論一様確率密度関数の描画
            const hTheory = 1 / (b - a);
            const pa = p.map(a, xMin, xMax, padding.left, padding.left + gW);
            const pb = p.map(b, xMin, xMax, padding.left, padding.left + gW);
            const pyTheory = p.map(hTheory, yMin, yMax, padding.top + gH, padding.top);
            const py0 = p.map(0, yMin, yMax, padding.top + gH, padding.top);

            p.stroke(0, 121, 107);
            p.strokeWeight(3);
            p.noFill();
            
            // 区間外は 0、区間内は 1/(b-a)
            const pStart = p.map(xMin, xMin, xMax, padding.left, padding.left + gW);
            const pEnd = p.map(xMax, xMin, xMax, padding.left, padding.left + gW);
            
            p.line(pStart, py0, pa, py0);
            p.line(pa, py0, pa, pyTheory);
            p.line(pa, pyTheory, pb, pyTheory);
            p.line(pb, pyTheory, pb, py0);
            p.line(pb, py0, pEnd, py0);

            // 3. 軸と目盛りの描画
            p.stroke(80);
            p.strokeWeight(1);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X軸
            p.line(padding.left, padding.top, padding.left, padding.top + gH); // Y軸

            // X軸目盛り
            p.fill(50);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(11);
            for (let i = 0; i <= 10; i++) {
                let x = p.map(i, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(200);
                p.line(x, padding.top + gH, x, padding.top + gH + 5);
                p.noStroke();
                p.text(i, x, padding.top + gH + 8);
            }
            p.text("値 X", padding.left + gW / 2, padding.top + gH + 28);

            // Y軸目盛り
            p.textAlign(p.RIGHT, p.CENTER);
            for (let i = 0; i <= yMax; i += 0.5) {
                let y = p.map(i, yMin, yMax, padding.top + gH, padding.top);
                p.stroke(200);
                p.line(padding.left - 5, y, padding.left, y);
                p.noStroke();
                p.text(i.toFixed(1), padding.left - 8, y);
            }

            p.push();
            p.translate(padding.left - 42, padding.top + gH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("確率密度 f(x) / 相対度数密度", 0, 0);
            p.pop();

            // 凡例
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(11);
            p.stroke(0, 121, 107); p.strokeWeight(3);
            p.line(p.width - 170, padding.top - 15, p.width - 145, padding.top - 15);
            p.noStroke(); p.fill(50);
            p.text("理論値 f(x)", p.width - 135, padding.top - 20);

            p.fill(38, 166, 154, 140);
            p.rect(p.width - 170, padding.top + 3, 25, 12);
            p.fill(50);
            p.text("サンプルヒストグラム", p.width - 135, padding.top + 2);
        };

        p.windowResized = () => {
            const container = document.getElementById('canvas-container');
            const width = container.offsetWidth || 600;
            p.resizeCanvas(width, 380);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };
    };

    new p5(sketch);
});