/**
 * 一様分布シミュレーター（度数と確率密度の二段グラフ）
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

    // 共有データ
    let sharedState = {
        a: 2.0,
        b: 8.0,
        samples: [],
        xMin: -1.0,
        xMax: 11.0,
        binWidth: 0.2
    };

    // パラメータ変更時の処理（a < b を維持）
    function updateParameters() {
        let a = parseFloat(sliderA.value);
        let b = parseFloat(sliderB.value);

        if (a >= b) {
            if (document.activeElement === sliderA) {
                b = a + 0.1;
                if (b > parseFloat(sliderB.max)) {
                    b = parseFloat(sliderB.max);
                    a = b - 0.1;
                    sliderA.value = a.toFixed(1);
                }
                sliderB.value = b.toFixed(1);
            } else {
                a = b - 0.1;
                if (a < parseFloat(sliderA.min)) {
                    a = parseFloat(sliderA.min);
                    b = a + 0.1;
                    sliderB.value = b.toFixed(1);
                }
                sliderA.value = a.toFixed(1);
            }
        }

        sharedState.a = a;
        sharedState.b = b;
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
        for (let i = 0; i < count; i++) {
            const val = Math.random() * (sharedState.b - sharedState.a) + sharedState.a;
            sharedState.samples.push(val);
        }
        updateSampleStats();
    }

    // 標本統計データの更新
    function updateSampleStats() {
        const count = sharedState.samples.length;
        statCount.textContent = count;

        if (count === 0) {
            sampleMean.textContent = '--';
            sampleVar.textContent = '--';
            return;
        }

        let sum = 0;
        for (let i = 0; i < count; i++) {
            sum += sharedState.samples[i];
        }
        const sMean = sum / count;
        sampleMean.textContent = sMean.toFixed(3);

        let sumSqDiff = 0;
        for (let i = 0; i < count; i++) {
            sumSqDiff += Math.pow(sharedState.samples[i] - sMean, 2);
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
        sharedState.samples = [];
        updateSampleStats();
    });

    updateParameters();

    // ----------------------------------------------------
    // スケッチ①：出現回数（度数）のヒストグラム
    // ----------------------------------------------------
    const sketchFreq = (p) => {
        let padding = { top: 30, right: 30, bottom: 40, left: 60 };
        let gW, gH;

        p.setup = () => {
            const container = document.getElementById('canvas-freq');
            const width = container.offsetWidth || 500;
            p.createCanvas(width, 250).parent(container);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };

        p.draw = () => {
            p.background(255);

            const { a, b, samples, xMin, xMax, binWidth } = sharedState;
            const numBins = Math.ceil((xMax - xMin) / binWidth);
            const bins = new Array(numBins).fill(0);

            let maxCount = 10; // デフォルトのY軸の最大値

            if (samples.length > 0) {
                for (let i = 0; i < samples.length; i++) {
                    const val = samples[i];
                    if (val >= xMin && val < xMax) {
                        const binIdx = Math.floor((val - xMin) / binWidth);
                        if (binIdx >= 0 && binIdx < numBins) {
                            bins[binIdx]++;
                            if (bins[binIdx] > maxCount) {
                                maxCount = bins[binIdx];
                            }
                        }
                    }
                }
            }

            // 見やすさのためにY軸最大値を少し余裕を持たせる（10%増し、切りの良い数へ）
            let yMax = Math.ceil(maxCount * 1.1);
            if(yMax < 10) yMax = 10;

            // ヒストグラムの描画
            p.fill(229, 57, 53, 180); // 赤色系
            p.stroke(229, 57, 53);
            p.strokeWeight(1);
            
            for (let i = 0; i < numBins; i++) {
                const count = bins[i];
                if (count === 0) continue;

                const bX1 = xMin + i * binWidth;
                const bX2 = bX1 + binWidth;

                const px1 = p.map(bX1, xMin, xMax, padding.left, padding.left + gW);
                const px2 = p.map(bX2, xMin, xMax, padding.left, padding.left + gW);
                const py = p.map(count, 0, yMax, padding.top + gH, padding.top);
                const pyBase = padding.top + gH;

                p.rect(px1, py, px2 - px1, pyBase - py);
            }

            // 軸の描画
            p.stroke(80); p.strokeWeight(1);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X
            p.line(padding.left, padding.top, padding.left, padding.top + gH); // Y

            // X軸目盛り
            p.fill(50); p.noStroke(); p.textAlign(p.CENTER, p.TOP); p.textSize(11);
            for (let i = 0; i <= 10; i+=2) {
                let x = p.map(i, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(200); p.line(x, padding.top + gH, x, padding.top + gH + 5);
                p.noStroke(); p.text(i, x, padding.top + gH + 8);
            }
            p.text("値 X", padding.left + gW / 2, padding.top + gH + 25);

            // Y軸目盛り
            p.textAlign(p.RIGHT, p.CENTER);
            let yStep = yMax > 100 ? Math.ceil(yMax/5) : (yMax > 20 ? 10 : 2);
            for (let i = 0; i <= yMax; i += yStep) {
                let y = p.map(i, 0, yMax, padding.top + gH, padding.top);
                p.stroke(200); p.line(padding.left - 5, y, padding.left, y);
                p.noStroke(); p.text(i, padding.left - 8, y);
            }
            
            p.push();
            p.translate(padding.left - 45, padding.top + gH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("出現回数", 0, 0);
            p.pop();
        };

        p.windowResized = () => {
            const container = document.getElementById('canvas-freq');
            const width = container.offsetWidth || 500;
            p.resizeCanvas(width, 250);
            gW = p.width - padding.left - padding.right;
        };
    };

    // ----------------------------------------------------
    // スケッチ②：確率密度関数のヒストグラム
    // ----------------------------------------------------
    const sketchDensity = (p) => {
        let padding = { top: 30, right: 30, bottom: 40, left: 60 };
        let gW, gH;

        p.setup = () => {
            const container = document.getElementById('canvas-density');
            const width = container.offsetWidth || 500;
            p.createCanvas(width, 250).parent(container);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };

        p.draw = () => {
            p.background(255);

            const { a, b, samples, xMin, xMax, binWidth } = sharedState;
            const yMin = 0.0;
            // 確率密度の最大値（余裕を持たせる）
            const theoryHeight = 1 / (b - a);
            const yMax = Math.max(theoryHeight * 1.8, 0.5);

            // サンプルヒストグラム（確率密度版）の描画
            if (samples.length > 0) {
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

                p.fill(38, 166, 154, 150); // ターコイズ色の半透明
                p.noStroke();
                
                for (let i = 0; i < numBins; i++) {
                    const count = bins[i];
                    if (count === 0) continue;

                    // 面積の合計が1になるように密度を計算: 密度 = (度数 / サンプル総数) / 階級の幅
                    const density = (count / samples.length) / binWidth;

                    const bX1 = xMin + i * binWidth;
                    const bX2 = bX1 + binWidth;

                    const px1 = p.map(bX1, xMin, xMax, padding.left, padding.left + gW);
                    const px2 = p.map(bX2, xMin, xMax, padding.left, padding.left + gW);
                    const py = p.map(density, yMin, yMax, padding.top + gH, padding.top);
                    const pyBase = padding.top + gH;

                    p.rect(px1, py, px2 - px1, pyBase - py);
                }
            }

            // 理論値（確率密度関数）の描画
            const pa = p.map(a, xMin, xMax, padding.left, padding.left + gW);
            const pb = p.map(b, xMin, xMax, padding.left, padding.left + gW);
            const pyTheory = p.map(theoryHeight, yMin, yMax, padding.top + gH, padding.top);
            const py0 = padding.top + gH;

            p.stroke(0, 121, 107);
            p.strokeWeight(3);
            p.noFill();
            
            const pStart = p.map(xMin, xMin, xMax, padding.left, padding.left + gW);
            const pEnd = p.map(xMax, xMin, xMax, padding.left, padding.left + gW);
            
            p.line(pStart, py0, pa, py0);
            p.line(pa, py0, pa, pyTheory);
            p.line(pa, pyTheory, pb, pyTheory);
            p.line(pb, pyTheory, pb, py0);
            p.line(pb, py0, pEnd, py0);

            // 軸の描画
            p.stroke(80); p.strokeWeight(1);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X
            p.line(padding.left, padding.top, padding.left, padding.top + gH); // Y

            // X軸目盛り
            p.fill(50); p.noStroke(); p.textAlign(p.CENTER, p.TOP); p.textSize(11);
            for (let i = 0; i <= 10; i+=2) {
                let x = p.map(i, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(200); p.line(x, padding.top + gH, x, padding.top + gH + 5);
                p.noStroke(); p.text(i, x, padding.top + gH + 8);
            }
            p.text("値 X", padding.left + gW / 2, padding.top + gH + 25);

            // Y軸目盛り
            p.textAlign(p.RIGHT, p.CENTER);
            for (let i = 0; i <= yMax; i += 0.2) {
                let y = p.map(i, yMin, yMax, padding.top + gH, padding.top);
                p.stroke(200); p.line(padding.left - 5, y, padding.left, y);
                p.noStroke(); p.text(i.toFixed(1), padding.left - 8, y);
            }
            
            p.push();
            p.translate(padding.left - 45, padding.top + gH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("確率密度", 0, 0);
            p.pop();
        };

        p.windowResized = () => {
            const container = document.getElementById('canvas-density');
            const width = container.offsetWidth || 500;
            p.resizeCanvas(width, 250);
            gW = p.width - padding.left - padding.right;
        };
    };

    // 2つのp5インスタンスを起動
    new p5(sketchFreq);
    new p5(sketchDensity);
});
