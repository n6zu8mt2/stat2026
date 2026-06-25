/**
 * 偏差値シミュレーター
 */

document.addEventListener('DOMContentLoaded', () => {
    // MathJaxの明示的レンダリング
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise().catch((err) => console.log(err));
    }

    // DOM要素
    const inputMu = document.getElementById('input-mu');
    const inputSigma = document.getElementById('input-sigma');
    const inputTotal = document.getElementById('input-total');
    
    const inputMyScore = document.getElementById('input-myscore');
    const resMyDev = document.getElementById('res-my-dev');

    const labelTotalPeople = document.getElementById('label-total-people');
    const inputX1 = document.getElementById('input-x1');
    const inputX2 = document.getElementById('input-x2');
    
    const resTRange = document.getElementById('res-t-range');
    const resProb = document.getElementById('res-prob');
    const resPeople = document.getElementById('res-people');
    const sigmaButtons = document.querySelectorAll('.sigma-btn');

    // 状態変数
    let state = {
        mu: 65,
        sigma: 8,
        totalPeople: 1000,
        myScore: null,
        myDev: null,
        x1: 57,
        x2: 73,
        t1: 40,
        t2: 60,
        prob: 0
    };

    // 誤差関数と正規分布のCDF/PDF
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

    function normalCDF(x, mu, sigma) {
        return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
    }

    function normalPDF(x, mu, sigma) {
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    }

    function updateCalculations() {
        state.mu = parseFloat(inputMu.value) || 65;
        state.sigma = parseFloat(inputSigma.value) || 8;
        if(state.sigma <= 0) state.sigma = 0.1; // 0除算防止
        
        let total = parseInt(inputTotal.value) || 1000;
        if(total < 1) total = 1;
        state.totalPeople = total;
        labelTotalPeople.textContent = total;

        // 自分の得点の計算
        let myScoreVal = parseFloat(inputMyScore.value);
        if (!isNaN(myScoreVal)) {
            state.myScore = myScoreVal;
            state.myDev = ((myScoreVal - state.mu) / state.sigma) * 10 + 50;
            resMyDev.textContent = state.myDev.toFixed(1);
        } else {
            state.myScore = null;
            state.myDev = null;
            resMyDev.textContent = '--';
        }

        let x1 = parseFloat(inputX1.value);
        let x2 = parseFloat(inputX2.value);

        if (x1 > x2) {
            let temp = x1; x1 = x2; x2 = temp;
        }

        state.x1 = x1;
        state.x2 = x2;

        // 偏差値の計算
        state.t1 = ((x1 - state.mu) / state.sigma) * 10 + 50;
        state.t2 = ((x2 - state.mu) / state.sigma) * 10 + 50;

        // 確率計算
        let p1 = normalCDF(x1, state.mu, state.sigma);
        let p2 = normalCDF(x2, state.mu, state.sigma);
        state.prob = p2 - p1;

        // UI更新 (範囲部分)
        resTRange.innerHTML = `${state.t1.toFixed(1)} $\\leqq T \\leqq$ ${state.t2.toFixed(1)}`;
        resProb.textContent = `${(state.prob * 100).toFixed(2)} %`;
        
        let people = Math.round(state.prob * state.totalPeople);
        resPeople.textContent = `約 ${people} 人`;

        checkActiveSigmaButton();

        // 範囲テキストのMathJax再レンダリング（エラーを捕捉してグラフ描画を止めない）
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([resTRange]).catch((err) => console.log('MathJax Error:', err));
        }
    }

    function checkActiveSigmaButton() {
        sigmaButtons.forEach(btn => btn.classList.remove('active'));
        const eps = 0.01;
        const diff1 = Math.abs(state.x1 - (state.mu - state.sigma)) < eps && Math.abs(state.x2 - (state.mu + state.sigma)) < eps;
        const diff2 = Math.abs(state.x1 - (state.mu - 2*state.sigma)) < eps && Math.abs(state.x2 - (state.mu + 2*state.sigma)) < eps;
        const diff3 = Math.abs(state.x1 - (state.mu - 3*state.sigma)) < eps && Math.abs(state.x2 - (state.mu + 3*state.sigma)) < eps;
        
        if (diff1) document.querySelector('[data-type="1sigma"]').classList.add('active');
        if (diff2) document.querySelector('[data-type="2sigma"]').classList.add('active');
        if (diff3) document.querySelector('[data-type="3sigma"]').classList.add('active');
    }

    sigmaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const type = e.target.getAttribute('data-type');
            if (type === '1sigma') {
                inputX1.value = state.mu - state.sigma;
                inputX2.value = state.mu + state.sigma;
            } else if (type === '2sigma') {
                inputX1.value = state.mu - 2 * state.sigma;
                inputX2.value = state.mu + 2 * state.sigma;
            } else if (type === '3sigma') {
                inputX1.value = state.mu - 3 * state.sigma;
                inputX2.value = state.mu + 3 * state.sigma;
            }
            updateCalculations();
        });
    });

    [inputMu, inputSigma, inputTotal, inputMyScore, inputX1, inputX2].forEach(input => {
        input.addEventListener('input', updateCalculations);
    });

    // 初期計算
    updateCalculations();

    // ---------------------------------------------
    // スケッチ①：点数の正規分布 N(mu, sigma^2)
    // ---------------------------------------------
    const sketchScore = (p) => {
        let padding = { top: 30, right: 30, bottom: 45, left: 60 };
        let gW, gH;

        p.setup = () => {
            let container = document.getElementById('canvas-score');
            let w = container.clientWidth || 500; // offsetWidthの代わりにclientWidth
            p.createCanvas(w, 220).parent(container);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };

        p.draw = () => {
            p.background(255);
            
            let xMin = state.mu - 4 * state.sigma;
            let xMax = state.mu + 4 * state.sigma;
            let yMax = normalPDF(state.mu, state.mu, state.sigma) * 1.2;

            // 塗りつぶし領域
            p.noStroke();
            p.fill(255, 183, 77, 120);
            p.beginShape();
            let fillStart = Math.max(xMin, state.x1);
            let fillEnd = Math.min(xMax, state.x2);
            if (fillStart <= fillEnd) {
                p.vertex(p.map(fillStart, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
                let step = (xMax - xMin) / 200;
                for (let x = fillStart; x <= fillEnd; x += step) {
                    let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                    let py = p.map(normalPDF(x, state.mu, state.sigma), 0, yMax, padding.top + gH, padding.top);
                    p.vertex(px, py);
                }
                p.vertex(p.map(fillEnd, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
            }
            p.endShape(p.CLOSE);

            // 曲線
            p.stroke(230, 81, 0);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            let step = (xMax - xMin) / 100;
            for (let x = xMin; x <= xMax; x += step) {
                let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                let py = p.map(normalPDF(x, state.mu, state.sigma), 0, yMax, padding.top + gH, padding.top);
                p.vertex(px, py);
            }
            p.endShape();

            // 自分の得点のラインとマーカー
            if (state.myScore !== null && state.myScore >= xMin && state.myScore <= xMax) {
                let px = p.map(state.myScore, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(211, 47, 47); // 赤色
                p.strokeWeight(2);
                p.drawingContext.setLineDash([5, 5]); // 点線
                p.line(px, padding.top, px, padding.top + gH);
                p.drawingContext.setLineDash([]); // 点線リセット
                
                p.fill(211, 47, 47);
                p.noStroke();
                p.triangle(px, padding.top, px - 6, padding.top - 8, px + 6, padding.top - 8);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.textSize(12);
                p.text("あなた", px, padding.top - 10);
            }

            // 軸の描画
            p.stroke(80); p.strokeWeight(1);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); 
            p.line(padding.left, padding.top, padding.left, padding.top + gH); 
            
            // 目盛り (X軸)
            p.fill(50); p.noStroke(); p.textAlign(p.CENTER, p.TOP); p.textSize(11);
            for (let i = -3; i <= 3; i++) {
                let xVal = state.mu + i * state.sigma;
                let px = p.map(xVal, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(220); p.line(px, padding.top, px, padding.top + gH);
                p.stroke(80); p.line(px, padding.top + gH, px, padding.top + gH + 5);
                p.noStroke(); p.text(xVal.toFixed(1), px, padding.top + gH + 8);
            }
            p.text("得点 (X)", padding.left + gW / 2, padding.top + gH + 26);

            // 目盛り (Y軸)
            p.textAlign(p.RIGHT, p.CENTER);
            let ySteps = 4;
            for (let i = 0; i <= ySteps; i++) {
                let yVal = (yMax / ySteps) * i;
                let py = p.map(yVal, 0, yMax, padding.top + gH, padding.top);
                p.stroke(80); p.line(padding.left - 5, py, padding.left, py);
                p.noStroke(); p.text(yVal.toFixed(3), padding.left - 8, py);
            }
        };

        p.windowResized = () => {
            let container = document.getElementById('canvas-score');
            p.resizeCanvas(container.clientWidth || 500, 220);
            gW = p.width - padding.left - padding.right;
        };
    };

    // ---------------------------------------------
    // スケッチ②：偏差値の分布 N(50, 10^2)
    // ---------------------------------------------
    const sketchDev = (p) => {
        let padding = { top: 30, right: 30, bottom: 45, left: 60 };
        let gW, gH;
        let xMin = 10; 
        let xMax = 90; 
        let yMax = normalPDF(50, 50, 10) * 1.2;

        p.setup = () => {
            let container = document.getElementById('canvas-dev');
            let w = container.clientWidth || 500;
            p.createCanvas(w, 220).parent(container);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };

        p.draw = () => {
            p.background(255);

            // 塗りつぶし領域
            p.noStroke();
            p.fill(129, 199, 132, 120);
            p.beginShape();
            let fillStart = Math.max(xMin, state.t1);
            let fillEnd = Math.min(xMax, state.t2);
            if (fillStart <= fillEnd) {
                p.vertex(p.map(fillStart, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
                for (let x = fillStart; x <= fillEnd; x += 0.5) {
                    let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                    let py = p.map(normalPDF(x, 50, 10), 0, yMax, padding.top + gH, padding.top);
                    p.vertex(px, py);
                }
                p.vertex(p.map(fillEnd, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
            }
            p.endShape(p.CLOSE);

            // 曲線
            p.stroke(46, 125, 50);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            for (let x = xMin; x <= xMax; x += 1) {
                let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                let py = p.map(normalPDF(x, 50, 10), 0, yMax, padding.top + gH, padding.top);
                p.vertex(px, py);
            }
            p.endShape();

            // 自分の偏差値のラインとマーカー
            if (state.myDev !== null && state.myDev >= xMin && state.myDev <= xMax) {
                let px = p.map(state.myDev, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(211, 47, 47); // 赤色
                p.strokeWeight(2);
                p.drawingContext.setLineDash([5, 5]); // 点線
                p.line(px, padding.top, px, padding.top + gH);
                p.drawingContext.setLineDash([]); // 点線リセット
                
                p.fill(211, 47, 47);
                p.noStroke();
                p.triangle(px, padding.top, px - 6, padding.top - 8, px + 6, padding.top - 8);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.textSize(12);
                p.text("あなた", px, padding.top - 10);
            }

            // 軸の描画
            p.stroke(80); p.strokeWeight(1);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); 
            p.line(padding.left, padding.top, padding.left, padding.top + gH); 
            
            // 目盛り (X軸)
            p.fill(50); p.noStroke(); p.textAlign(p.CENTER, p.TOP); p.textSize(11);
            for (let i = 20; i <= 80; i += 10) {
                let px = p.map(i, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(220); p.line(px, padding.top, px, padding.top + gH);
                p.stroke(80); p.line(px, padding.top + gH, px, padding.top + gH + 5);
                p.noStroke(); p.text(i, px, padding.top + gH + 8);
            }
            p.text("偏差値 (T)", padding.left + gW / 2, padding.top + gH + 26);

            // 目盛り (Y軸)
            p.textAlign(p.RIGHT, p.CENTER);
            let ySteps = 4;
            for (let i = 0; i <= ySteps; i++) {
                let yVal = (yMax / ySteps) * i;
                let py = p.map(yVal, 0, yMax, padding.top + gH, padding.top);
                p.stroke(80); p.line(padding.left - 5, py, padding.left, py);
                p.noStroke(); p.text(yVal.toFixed(3), padding.left - 8, py);
            }
        };

        p.windowResized = () => {
            let container = document.getElementById('canvas-dev');
            p.resizeCanvas(container.clientWidth || 500, 220);
            gW = p.width - padding.left - padding.right;
        };
    };

    // 2つのp5インスタンスを起動
    new p5(sketchScore);
    new p5(sketchDev);
});
