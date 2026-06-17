/**
 * 正規分布シミュレーター
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const sliderMu = document.getElementById('slider-mu');
    const sliderSigma = document.getElementById('slider-sigma');
    const valMu = document.getElementById('val-mu');
    const valSigma = document.getElementById('val-sigma');
    
    const radiosMode = document.querySelectorAll('input[name="calc-mode"]');
    const panelEmpirical = document.getElementById('empirical-controls');
    const panelCustom = document.getElementById('custom-controls');
    
    const check1s = document.getElementById('check-1sigma');
    const check2s = document.getElementById('check-2sigma');
    const check3s = document.getElementById('check-3sigma');
    
    const inputA = document.getElementById('input-a');
    const inputB = document.getElementById('input-b');
    
    const resultText = document.getElementById('result-text');
    const resultDesc = document.getElementById('result-desc');

    // 誤差関数（CDF計算用）の近似式
    function erf(x) {
        let sign = (x >= 0) ? 1 : -1;
        x = Math.abs(x);
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        let t = 1.0 / (1.0 + p * x);
        let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    // 累積分布関数 (CDF)
    function cdf(x, mu, sigma) {
        return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
    }

    // 確率密度関数 (PDF)
    function pdf(x, mu, sigma) {
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    }

    // イベントリスナーの登録
    const inputs = [sliderMu, sliderSigma, check1s, check2s, check3s, inputA, inputB];
    inputs.forEach(el => {
        el.addEventListener('input', () => {
            valMu.textContent = parseFloat(sliderMu.value).toFixed(1);
            valSigma.textContent = parseFloat(sliderSigma.value).toFixed(1);
            if (p5Inst) p5Inst.redraw();
        });
    });

    radiosMode.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'empirical') {
                panelEmpirical.style.display = 'block';
                panelCustom.style.display = 'none';
            } else {
                panelEmpirical.style.display = 'none';
                panelCustom.style.display = 'block';
            }
            if (p5Inst) p5Inst.redraw();
        });
    });

    // p5.jsのスケッチ
    let p5Inst = new p5((p) => {
        
        p.setup = () => {
            let container = document.getElementById('canvas-container');
            p.createCanvas(container.clientWidth || 600, 350);
            p.noLoop();
        };

        p.draw = () => {
            p.background(255);
            
            let mu = parseFloat(sliderMu.value);
            let sigma = parseFloat(sliderSigma.value);
            let mode = document.querySelector('input[name="calc-mode"]:checked').value;
            
            const padding = { top: 30, bottom: 40, left: 50, right: 20 };
            const gW = p.width - padding.left - padding.right;
            const gH = p.height - padding.top - padding.bottom;
            
            // X軸の範囲は固定 [-15, 15] で全体を俯瞰しやすくする
            const xMin = -15;
            const xMax = 15;
            
            // Y軸の最大値は、分散が最小（sigma=0.5）の時のピーク値より少し高めに固定して比較しやすくする
            // sigma=0.5 のピークは約 0.797
            const yMax = 0.9;

            // グリッド線
            p.stroke(240); p.strokeWeight(1);
            for (let i = 0; i <= 5; i++) {
                let y = padding.top + (i/5) * gH;
                p.line(padding.left, y, padding.left + gW, y);
            }

            // 塗りつぶし領域の計算と描画
            p.noStroke();
            let totalProb = 0;
            let desc = "";

            if (mode === 'empirical') {
                let p1 = 0, p2 = 0, p3 = 0;
                
                // 3sigma (薄い青)
                if (check3s.checked) {
                    p.fill(187, 222, 251, 150);
                    drawFillArea(mu - 3*sigma, mu + 3*sigma);
                    p3 = cdf(mu + 3*sigma, mu, sigma) - cdf(mu - 3*sigma, mu, sigma);
                    totalProb = p3;
                    desc = `$\\mu \\pm 3\\sigma$ の範囲 (約99.7%)`;
                }
                // 2sigma (中間の青)
                if (check2s.checked) {
                    p.fill(100, 181, 246, 150);
                    drawFillArea(mu - 2*sigma, mu + 2*sigma);
                    p2 = cdf(mu + 2*sigma, mu, sigma) - cdf(mu - 2*sigma, mu, sigma);
                    totalProb = p2;
                    desc = `$\\mu \\pm 2\\sigma$ の範囲 (約95.4%)`;
                }
                // 1sigma (濃い青)
                if (check1s.checked) {
                    p.fill(33, 150, 243, 150);
                    drawFillArea(mu - 1*sigma, mu + 1*sigma);
                    p1 = cdf(mu + 1*sigma, mu, sigma) - cdf(mu - 1*sigma, mu, sigma);
                    totalProb = p1;
                    desc = `$\\mu \\pm 1\\sigma$ の範囲 (約68.3%)`;
                }
                
                if (!check1s.checked && !check2s.checked && !check3s.checked) {
                    totalProb = 0;
                    desc = "範囲が選択されていません";
                }

            } else {
                let a = parseFloat(inputA.value) || 0;
                let b = parseFloat(inputB.value) || 0;
                if (a > b) { let temp = a; a = b; b = temp; } // スワップ
                
                p.fill(255, 152, 0, 150); // オレンジ
                drawFillArea(a, b);
                
                totalProb = cdf(b, mu, sigma) - cdf(a, mu, sigma);
                desc = `$P(${a.toFixed(2)} \\le X \\le ${b.toFixed(2)})$ の確率`;
            }

            function drawFillArea(start, end) {
                p.beginShape();
                let startX = p.map(start, xMin, xMax, padding.left, padding.left + gW);
                let endX = p.map(end, xMin, xMax, padding.left, padding.left + gW);
                
                startX = p.constrain(startX, padding.left, padding.left + gW);
                endX = p.constrain(endX, padding.left, padding.left + gW);

                p.vertex(startX, padding.top + gH);
                for (let px = startX; px <= endX; px += 2) {
                    let mathX = p.map(px, padding.left, padding.left + gW, xMin, xMax);
                    let mathY = pdf(mathX, mu, sigma);
                    let py = padding.top + gH - p.map(mathY, 0, yMax, 0, gH);
                    p.vertex(px, py);
                }
                p.vertex(endX, padding.top + gH);
                p.endShape(p.CLOSE);
            }

            // 正規分布の曲線を描画
            p.stroke('#d32f2f'); 
            p.strokeWeight(3);
            p.noFill();
            p.beginShape();
            for (let px = padding.left; px <= padding.left + gW; px += 2) {
                let mathX = p.map(px, padding.left, padding.left + gW, xMin, xMax);
                let mathY = pdf(mathX, mu, sigma);
                let py = padding.top + gH - p.map(mathY, 0, yMax, 0, gH);
                p.vertex(px, py);
            }
            p.endShape();

            // 軸の描画
            p.stroke(0); p.strokeWeight(1.5);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X軸
            p.line(padding.left, padding.top, padding.left, padding.top + gH); // Y軸
            
            // X=0のセンターライン（薄く）
            let zeroX = p.map(0, xMin, xMax, padding.left, padding.left + gW);
            p.stroke(0, 0, 0, 50); p.strokeWeight(1); p.drawingContext.setLineDash([5, 5]);
            p.line(zeroX, padding.top, zeroX, padding.top + gH);
            p.drawingContext.setLineDash([]);

            // 平均 μ の位置にラインを引く
            let muX = p.map(mu, xMin, xMax, padding.left, padding.left + gW);
            p.stroke('#d32f2f'); p.strokeWeight(1.5); p.drawingContext.setLineDash([4, 4]);
            p.line(muX, padding.top, muX, padding.top + gH);
            p.drawingContext.setLineDash([]);
            
            p.noStroke(); p.fill('#d32f2f'); p.textSize(14); p.textAlign(p.CENTER, p.BOTTOM);
            p.text('μ', muX, padding.top - 5);

            // 目盛り (X軸)
            p.fill(0); p.textSize(12); p.textAlign(p.CENTER, p.TOP);
            for (let i = xMin; i <= xMax; i += 5) {
                let x = p.map(i, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(100); p.line(x, padding.top + gH, x, padding.top + gH + 5);
                p.noStroke(); p.text(i, x, padding.top + gH + 8);
            }
            p.text("X の値", padding.left + gW / 2, padding.top + gH + 25);

            // 目盛り (Y軸)
            p.textAlign(p.RIGHT, p.CENTER);
            for (let i = 0; i <= yMax; i += 0.2) {
                let y = padding.top + gH - p.map(i, 0, yMax, 0, gH);
                p.stroke(100); p.line(padding.left - 5, y, padding.left, y);
                p.noStroke(); p.text(i.toFixed(1), padding.left - 8, y);
            }
            
            p.push();
            p.translate(padding.left - 35, padding.top + gH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("確率密度 f(x)", 0, 0);
            p.pop();

            // UIの計算結果を更新
            resultText.textContent = (totalProb * 100).toFixed(2) + " %";
            resultDesc.innerHTML = desc;
            
            // MathJaxの再レンダリングをトリガー
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise([resultDesc]);
            }
        };

        p.windowResized = () => {
            let container = document.getElementById('canvas-container');
            p.resizeCanvas(container.clientWidth || 600, 350);
            p.redraw();
        };

    }, 'canvas-container');
});