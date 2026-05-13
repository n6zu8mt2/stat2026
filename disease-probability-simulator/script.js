let canvas;

document.addEventListener('DOMContentLoaded', () => {
    // スライダーと数値入力の同期設定
    setupSync('slider-p', 'diseaseProbability');
    setupSync('slider-q', 'positiveGivenDisease');
    setupSync('slider-r', 'negativeGivenNoDisease');

    // トグルボタンのイベント
    document.getElementById('tableToggle').addEventListener('change', () => {
        calculateProbability();
    });

    // 初回表示
    calculateProbability();
});

// スライダーと数値入力ボックスを連動させる
function setupSync(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    slider.addEventListener('input', () => {
        input.value = slider.value;
        calculateProbability(); // リアルタイム反映
    });

    input.addEventListener('input', () => {
        let val = parseFloat(input.value);
        if(val < 0) val = 0;
        if(val > 1) val = 1;
        slider.value = val;
        calculateProbability();
    });
}

function getValues() {
    return {
        p: parseFloat(document.getElementById('diseaseProbability').value) || 0,
        q: parseFloat(document.getElementById('positiveGivenDisease').value) || 0,
        r: parseFloat(document.getElementById('negativeGivenNoDisease').value) || 0
    };
}

// 条件付き確率 P(A|B) を計算
function calculateConditionalProbability(p, q, r) {
    const positiveGivenNoDisease = 1 - r; // P(B|A_bar)
    const positiveProbability = q * p + positiveGivenNoDisease * (1 - p); // P(B)
    
    if (positiveProbability === 0) return 0;
    return (q * p) / positiveProbability;
}

// メインの計算とUI更新
function calculateProbability() {
    const { p, q, r } = getValues();
    const prob = calculateConditionalProbability(p, q, r);
    
    // 1. 大きな結果表示の更新
    document.getElementById('result-value').textContent = `${(prob * 100).toFixed(1)} %`;

    // 2. 10000人換算の具体例を生成
    generateConcreteExample(p, q, r, prob);

    // 3. グラフと表の更新
    updateTableAndGraph(q, r);
}

// 10,000人規模での具体的な解釈テキストを生成
function generateConcreteExample(p, q, r, prob) {
    const POPULATION = 10000;
    
    const sickPeople = Math.round(POPULATION * p);
    const healthyPeople = POPULATION - sickPeople;
    
    const truePositive = Math.round(sickPeople * q);
    const falsePositive = Math.round(healthyPeople * (1 - r));
    
    const totalPositive = truePositive + falsePositive;
    
    const exampleDiv = document.getElementById('concrete-example');
    exampleDiv.style.display = 'block';
    
    if (totalPositive === 0) {
        exampleDiv.innerHTML = "陽性になる人が一人もいない設定です。";
        return;
    }

    exampleDiv.innerHTML = `
        <strong>💡 10,000人で考えるとどうなる？</strong><br>
        この設定で 10,000人 が検査を受けたとします。<br>
        <ul>
            <li>本当に病気の人 <strong>${sickPeople}人</strong> のうち、正しく「陽性」と判定されるのは <strong>${truePositive}人</strong>。</li>
            <li>健康な人 <strong>${healthyPeople}人</strong> のうち、間違って「陽性」と判定されてしまう人（偽陽性）が <strong>${falsePositive}人</strong> もいます。</li>
        </ul>
        つまり、「陽性」と言われた合計 <strong>${totalPositive}人</strong> の中で、本当に病気なのはたったの <strong>${truePositive}人</strong> しかいません。<br>
        だから、陽性と言われても本当に病気である確率は <strong>約 ${(prob*100).toFixed(1)}%</strong> になるのです。
    `;
}

// 表とグラフの描画
function updateTableAndGraph(q, r) {
    const tableDiv = document.getElementById('probabilityTable');
    const canvasContainer = document.getElementById('canvasContainer');
    const toggle = document.getElementById('tableToggle').checked;

    if (!toggle) {
        tableDiv.style.display = 'none';
        canvasContainer.style.display = 'none';
        if (canvas) { canvas.remove(); canvas = null; }
        return;
    }

    tableDiv.style.display = 'block';
    canvasContainer.style.display = 'block';

    if (canvas) { canvas.remove(); canvas = null; }

    const step = 0.05; // グラフの滑らかさのため刻み幅を細かく固定
    const maxP = 1.0;

    // 表の作成
    let tableHTML = '<table><tr><th>事前確率 P(A)</th><th>事後確率 P(A|B)</th></tr>';
    for (let p_iter = 0; p_iter <= maxP; p_iter += 0.1) { // 表は0.1刻みで見やすく
        let current_p = parseFloat(p_iter.toFixed(4));
        const p_cond = calculateConditionalProbability(current_p, q, r);
        tableHTML += `<tr><td>${current_p.toFixed(2)}</td><td>${p_cond.toFixed(3)}</td></tr>`;
    }
    tableHTML += '</table>';
    tableDiv.innerHTML = tableHTML;

    // p5.js グラフの描画
    canvas = new p5((sketch) => {
        sketch.setup = () => {
            const w = document.getElementById('canvasContainer').clientWidth - 20;
            sketch.createCanvas(w, 300).parent('canvasContainer');
        };

        sketch.draw = () => {
            sketch.background(255);
            
            const padding = { top: 20, right: 20, bottom: 40, left: 50 };
            const gW = sketch.width - padding.left - padding.right;
            const gH = sketch.height - padding.top - padding.bottom;

            // グリッド線
            sketch.stroke(240);
            sketch.strokeWeight(1);
            for(let i=0; i<=5; i++) {
                let y = padding.top + gH - (i/5)*gH;
                sketch.line(padding.left, y, padding.left + gW, y);
            }

            // 軸
            sketch.stroke(0);
            sketch.strokeWeight(1.5);
            sketch.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X軸
            sketch.line(padding.left, padding.top, padding.left, padding.top + gH); // Y軸

            // ラベル
            sketch.fill(0); 
            sketch.noStroke(); 
            sketch.textSize(12);
            sketch.textAlign(sketch.CENTER, sketch.TOP);
            sketch.text('事前確率 P(A)', padding.left + gW / 2, padding.top + gH + 20);

            sketch.push(); 
            sketch.translate(padding.left - 35, padding.top + gH / 2);
            sketch.rotate(-sketch.HALF_PI);
            sketch.textAlign(sketch.CENTER, sketch.BOTTOM); 
            sketch.text('事後確率 P(A|B)', 0, 0);
            sketch.pop(); 

            // 目盛り
            const numTicks = 5; 
            sketch.stroke(0); sketch.fill(0);   
            for (let i = 0; i <= numTicks; i++) {
                let val = i / numTicks;
                
                // X軸目盛り
                let x = padding.left + val * gW;
                sketch.line(x, padding.top + gH, x, padding.top + gH + 5);
                sketch.textAlign(sketch.CENTER, sketch.TOP);
                sketch.noStroke(); 
                sketch.text(val.toFixed(1), x, padding.top + gH + 5);
                sketch.stroke(0); 

                // Y軸目盛り
                let y = padding.top + gH - val * gH;
                sketch.textAlign(sketch.RIGHT, sketch.CENTER);
                sketch.noStroke(); 
                sketch.text(val.toFixed(1), padding.left - 8, y);
                sketch.stroke(0); 
            }

            // グラフの線描画
            sketch.stroke('#e91e63'); 
            sketch.strokeWeight(3); 
            sketch.noFill();          
            sketch.beginShape();
            for (let p_val = 0; p_val <= maxP; p_val += step) {
                let probValue = calculateConditionalProbability(p_val, q, r);
                const x_coord = padding.left + sketch.map(p_val, 0, 1, 0, gW);
                const y_coord = padding.top + gH - sketch.map(probValue, 0, 1, 0, gH); 
                sketch.vertex(x_coord, y_coord);
            }
            sketch.endShape();
            
            sketch.noLoop(); // 静的グラフなのでループ不要
        };
        
        // リサイズ対応
        sketch.windowResized = () => {
            const w = document.getElementById('canvasContainer').clientWidth - 20;
            sketch.resizeCanvas(w, 300);
            sketch.draw();
        };
    });
}

function reset() {
    document.getElementById('slider-p').value = 0.1;
    document.getElementById('diseaseProbability').value = 0.1;
    
    document.getElementById('slider-q').value = 0.9;
    document.getElementById('positiveGivenDisease').value = 0.9;
    
    document.getElementById('slider-r').value = 0.7;
    document.getElementById('negativeGivenNoDisease').value = 0.7;
    
    document.getElementById('tableToggle').checked = false;
    
    calculateProbability();
}