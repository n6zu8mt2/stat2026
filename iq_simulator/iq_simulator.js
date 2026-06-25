/**
 * IQ分布と標準化比較シミュレーター
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
    const inputTotalPeople = document.getElementById('input-total-people');
    const labelTotalPeople = document.getElementById('label-total-people');
    const inputX1 = document.getElementById('input-x1');
    const inputX2 = document.getElementById('input-x2');
    
    const resZRange = document.getElementById('res-z-range');
    const resProb = document.getElementById('res-prob');
    const resPeople = document.getElementById('res-people');
    const sigmaButtons = document.querySelectorAll('.sigma-btn');

    // 状態変数
    let state = {
        mu: 100,
        sigma: 15,
        x1: 100,
        x2: 115,
        z1: 0,
        z2: 1,
        prob: 0,
        totalPeople: 1000
    };

    // 誤差関数と正規分布のCDF
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
        let total = parseInt(inputTotalPeople.value) || 1000;
        if(total < 1) total = 1;
        state.totalPeople = total;
        labelTotalPeople.textContent = total;

        let x1 = parseFloat(inputX1.value);
        let x2 = parseFloat(inputX2.value);

        if (x1 > x2) {
            let temp = x1; x1 = x2; x2 = temp;
        }

        state.x1 = x1;
        state.x2 = x2;

        // 標準化
        state.z1 = (x1 - state.mu) / state.sigma;
        state.z2 = (x2 - state.mu) / state.sigma;

        // 確率計算
        let p1 = normalCDF(x1, state.mu, state.sigma);
        let p2 = normalCDF(x2, state.mu, state.sigma);
        state.prob = p2 - p1;

        // UI更新
        resZRange.innerHTML = `${state.z1.toFixed(2)} $\\leqq Z \\leqq$ ${state.z2.toFixed(2)}`;
        resProb.textContent = `${(state.prob * 100).toFixed(2)} %`;
        
        let people = Math.round(state.prob * state.totalPeople);
        resPeople.textContent = `約 ${people} 人`;

        // ボタンの選択状態チェック
        checkActiveSigmaButton();

        // MathJaxの再レンダリング
        if (window.MathJax) {
            MathJax.typesetPromise([resZRange]).catch((err) => console.log(err));
        }
    }

    function checkActiveSigmaButton() {
        sigmaButtons.forEach(btn => btn.classList.remove('active'));
        const diff1 = Math.abs(state.x1 - 85) < 0.01 && Math.abs(state.x2 - 115) < 0.01;
        const diff2 = Math.abs(state.x1 - 70) < 0.01 && Math.abs(state.x2 - 130) < 0.01;
        const diff3 = Math.abs(state.x1 - 55) < 0.01 && Math.abs(state.x2 - 145) < 0.01;
        
        if (diff1) document.querySelector('[data-type="1sigma"]').classList.add('active');
        if (diff2) document.querySelector('[data-type="2sigma"]').classList.add('active');
        if (diff3) document.querySelector('[data-type="3sigma"]').classList.add('active');
    }

    // シグマ範囲ボタンイベント
    sigmaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const type = e.target.getAttribute('data-type');
            if (type === '1sigma') {
                inputX1.value = 85;
                inputX2.value = 115;
            } else if (type === '2sigma') {
                inputX1.value = 70;
                inputX2.value = 130;
            } else if (type === '3sigma') {
                inputX1.value = 55;
                inputX2.value = 145;
            }
            updateCalculations();
        });
    });

    inputX1.addEventListener('input', updateCalculations);
    inputX2.addEventListener('input', updateCalculations);
    inputTotalPeople.addEventListener('input', updateCalculations);

    // 初期計算
    updateCalculations();

    // ---------------------------------------------
    // スケッチ①：IQの正規分布 N(100, 15^2)
    // ---------------------------------------------
    const sketchIQ = (p) => {
        let padding = { top: 20, right: 30, bottom: 45, left: 60 };
        let gW, gH;
        let xMin = 40;  // 100 - 4*15
        let xMax = 160; // 100 + 4*15
        let yMax = 0.035; // IQ分布に適したスケール

        p.setup = () => {
            let container = document.getElementById('canvas-iq');
            let w = container.offsetWidth || 500;
            p.createCanvas(w, 200).parent(container);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };

        p.draw = () => {
            p.background(255);

            // 塗りつぶし領域
            p.noStroke();
            p.fill(171, 71, 188, 120); // 紫系
            p.beginShape();
            let fillStart = Math.max(xMin, state.x1);
            let fillEnd = Math.min(xMax, state.x2);
            p.vertex(p.map(fillStart, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
            for (let x = fillStart; x <= fillEnd; x += 0.5) {
                let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                let py = p.map(normalPDF(x, 100, 15), 0, yMax, padding.top + gH, padding.top);
                p.vertex(px, py);
            }
            p.vertex(p.map(fillEnd, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
            p.endShape(p.CLOSE);

            // 曲線
            p.stroke(106, 27, 154);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            for (let x = xMin; x <= xMax; x += 1) {
                let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                let py = p.map(normalPDF(x, 100, 15), 0, yMax, padding.top + gH, padding.top);
                p.vertex(px, py);
            }
            p.endShape();

            // 軸の描画
            p.stroke(80); p.strokeWeight(1);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X軸
            p.line(padding.left, padding.top, padding.left, padding.top + gH); // Y軸
            
            // 目盛り (X軸)
            p.fill(50); p.noStroke(); p.textAlign(p.CENTER, p.TOP); p.textSize(11);
            for (let i = 40; i <= 160; i += 15) {
                let px = p.map(i, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(220); p.line(px, padding.top, px, padding.top + gH); // グリッド
                p.stroke(80); p.line(px, padding.top + gH, px, padding.top + gH + 5);
                p.noStroke(); p.text(i, px, padding.top + gH + 8);
            }
            p.text("IQの値 (X)", padding.left + gW / 2, padding.top + gH + 26);

            // 目盛り (Y軸)
            p.textAlign(p.RIGHT, p.CENTER);
            for (let yVal = 0; yVal <= yMax; yVal += 0.01) {
                let py = p.map(yVal, 0, yMax, padding.top + gH, padding.top);
                p.stroke(80); p.line(padding.left - 5, py, padding.left, py);
                p.noStroke(); p.text(yVal.toFixed(3), padding.left - 8, py);
            }
        };

        p.windowResized = () => {
            let container = document.getElementById('canvas-iq');
            p.resizeCanvas(container.offsetWidth || 500, 200);
            gW = p.width - padding.left - padding.right;
        };
    };

    // ---------------------------------------------
    // スケッチ②：標準正規分布 N(0, 1)
    // ---------------------------------------------
    const sketchStd = (p) => {
        let padding = { top: 20, right: 30, bottom: 45, left: 60 };
        let gW, gH;
        let xMin = -4;
        let xMax = 4;
        let yMax = 0.45; // 標準正規分布に適したスケール (最大値 1/sqrt(2pi) ≒ 0.398)

        p.setup = () => {
            let container = document.getElementById('canvas-std');
            let w = container.offsetWidth || 500;
            p.createCanvas(w, 200).parent(container);
            gW = p.width - padding.left - padding.right;
            gH = p.height - padding.top - padding.bottom;
        };

        p.draw = () => {
            p.background(255);

            // 塗りつぶし領域
            p.noStroke();
            p.fill(30, 136, 229, 120); // 青系
            p.beginShape();
            let fillStart = Math.max(xMin, state.z1);
            let fillEnd = Math.min(xMax, state.z2);
            p.vertex(p.map(fillStart, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
            for (let x = fillStart; x <= fillEnd; x += 0.05) {
                let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                let py = p.map(normalPDF(x, 0, 1), 0, yMax, padding.top + gH, padding.top);
                p.vertex(px, py);
            }
            p.vertex(p.map(fillEnd, xMin, xMax, padding.left, padding.left + gW), padding.top + gH);
            p.endShape(p.CLOSE);

            // 曲線
            p.stroke(21, 101, 192);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            for (let x = xMin; x <= xMax; x += 0.1) {
                let px = p.map(x, xMin, xMax, padding.left, padding.left + gW);
                let py = p.map(normalPDF(x, 0, 1), 0, yMax, padding.top + gH, padding.top);
                p.vertex(px, py);
            }
            p.endShape();

            // 軸の描画
            p.stroke(80); p.strokeWeight(1);
            p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X軸
            p.line(padding.left, padding.top, padding.left, padding.top + gH); // Y軸
            
            // 目盛り (X軸)
            p.fill(50); p.noStroke(); p.textAlign(p.CENTER, p.TOP); p.textSize(11);
            for (let i = -4; i <= 4; i += 1) {
                let px = p.map(i, xMin, xMax, padding.left, padding.left + gW);
                p.stroke(220); p.line(px, padding.top, px, padding.top + gH); // グリッド
                p.stroke(80); p.line(px, padding.top + gH, px, padding.top + gH + 5);
                p.noStroke(); p.text(i, px, padding.top + gH + 8);
            }
            p.text("標準化スコア (Z)", padding.left + gW / 2, padding.top + gH + 26);

            // 目盛り (Y軸)
            p.textAlign(p.RIGHT, p.CENTER);
            for (let yVal = 0; yVal <= yMax; yVal += 0.1) {
                let py = p.map(yVal, 0, yMax, padding.top + gH, padding.top);
                p.stroke(80); p.line(padding.left - 5, py, padding.left, py);
                p.noStroke(); p.text(yVal.toFixed(2), padding.left - 8, py);
            }
        };

        p.windowResized = () => {
            let container = document.getElementById('canvas-std');
            p.resizeCanvas(container.offsetWidth || 500, 200);
            gW = p.width - padding.left - padding.right;
        };
    };

    // 2つのp5インスタンスを起動
    new p5(sketchIQ);
    new p5(sketchStd);
});
