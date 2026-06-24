// uniform_dist.js

let a = 0;
let b = 10;
let generatedValues = [];
let isAuto = false;

// グラフ描画領域の余白
const padding = { top: 40, right: 40, bottom: 60, left: 60 };

function setup() {
    let canvas = createCanvas(700, 400);
    canvas.parent('canvas-container');

    // DOM要素の取得
    const inputA = document.getElementById('param-a');
    const inputB = document.getElementById('param-b');
    const generateBtn = document.getElementById('generate-btn');
    const autoBtn = document.getElementById('auto-btn');
    const resetBtn = document.getElementById('reset-btn');

    // パラメータ変更イベント
    inputA.addEventListener('change', updateParams);
    inputB.addEventListener('change', updateParams);
    
    // ボタンのイベント
    generateBtn.addEventListener('click', generateNumber);
    
    autoBtn.addEventListener('click', () => {
        isAuto = !isAuto;
        autoBtn.style.backgroundColor = isAuto ? '#dc3545' : '#28a745';
        autoBtn.textContent = isAuto ? '自動生成 停止' : '自動生成 (オン/オフ)';
    });
    
    resetBtn.addEventListener('click', resetSimulation);

    // 初期化
    updateParams();
}

// a, bの値が変更されたときの処理
function updateParams() {
    let newA = parseFloat(document.getElementById('param-a').value);
    let newB = parseFloat(document.getElementById('param-b').value);

    // bがa以下にならないようバリデーション
    if (newB <= newA) {
        alert("上限 b は下限 a より大きい必要があります。自動修正します。");
        newB = newA + 1;
        document.getElementById('param-b').value = newB;
    }
    
    if (a !== newA || b !== newB) {
        a = newA;
        b = newB;
        resetSimulation(); // パラメータが変わったらリセットする
    }
}

// 乱数を1つ生成して記録する処理
function generateNumber() {
    let val = random(a, b);
    generatedValues.push(val);
    document.getElementById('count-val').textContent = generatedValues.length;
    document.getElementById('latest-val').textContent = val.toFixed(3);
}

// シミュレーション結果をリセット
function resetSimulation() {
    generatedValues = [];
    document.getElementById('count-val').textContent = "0";
    document.getElementById('latest-val').textContent = "-";
}

// 毎フレーム呼ばれる描画処理
function draw() {
    background(255);

    // 自動生成がオンの場合、1フレームに複数回生成してスピードアップ
    if (isAuto) {
        for(let i = 0; i < 10; i++) {
            generateNumber();
        }
    }

    // --- グラフの軸のスケール計算 ---
    let marginX = (b - a) * 0.2;
    if (marginX === 0) marginX = 1;
    let xMin = a - marginX;
    let xMax = b + marginX;

    let pdfValue = 1 / (b - a); // 確率密度 f(x)
    let yMax = pdfValue * 1.5;  // Y軸の最大値 (余裕を持たせる)

    let gW = width - padding.left - padding.right;
    let gH = height - padding.top - padding.bottom;

    // --- 軸の描画 ---
    stroke(0);
    strokeWeight(1);
    line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH); // X軸
    line(padding.left, padding.top, padding.left, padding.top + gH); // Y軸

    // 軸ラベル
    fill(0); noStroke();
    textSize(14); textAlign(CENTER, TOP);
    text("値 (x)", padding.left + gW / 2, padding.top + gH + 35);

    textAlign(RIGHT, CENTER);
    push();
    translate(padding.left - 45, padding.top + gH / 2);
    rotate(-HALF_PI);
    textAlign(CENTER, CENTER);
    text("確率密度", 0, 0);
    pop();

    // --- 目盛りの描画 ---
    drawTickX(a, xMin, xMax, padding, gW, gH, "a=" + a);
    drawTickX(b, xMin, xMax, padding, gW, gH, "b=" + b);

    let yPosPdf = map(pdfValue, 0, yMax, padding.top + gH, padding.top);
    stroke(0, 50);
    line(padding.left, yPosPdf, padding.left + gW, yPosPdf); // 確率密度の補助線
    noStroke(); fill(0); textAlign(RIGHT, CENTER);
    text(pdfValue.toFixed(3), padding.left - 5, yPosPdf);
    text("0", padding.left - 5, padding.top + gH);

    // --- 確率密度関数 (PDF) の描画 ---
    let xPosA = map(a, xMin, xMax, padding.left, padding.left + gW);
    let xPosB = map(b, xMin, xMax, padding.left, padding.left + gW);
    
    fill(0, 123, 255, 30); // 薄い青色
    stroke(0, 123, 255);
    strokeWeight(2);
    rect(xPosA, yPosPdf, xPosB - xPosA, (padding.top + gH) - yPosPdf);

    // --- 生成された値のヒストグラム描画 ---
    if (generatedValues.length > 0) {
        let numBins = 30; // ヒストグラムの棒の数
        let binWidth = (b - a) / numBins;
        let counts = new Array(numBins).fill(0);

        for (let v of generatedValues) {
            let index = Math.floor((v - a) / binWidth);
            if (index >= numBins) index = numBins - 1; 
            if (index >= 0) counts[index]++;
        }

        fill(255, 99, 132, 150); // 薄い赤色
        stroke(255, 99, 132);
        strokeWeight(1);

        for (let i = 0; i < numBins; i++) {
            // 面積が1になるように「相対度数密度」を計算
            let density = (counts[i] / generatedValues.length) / binWidth;
            let binX1 = a + i * binWidth;
            
            let px = map(binX1, xMin, xMax, padding.left, padding.left + gW);
            let pw = map(binX1 + binWidth, xMin, xMax, padding.left, padding.left + gW) - px;
            let py = map(density, 0, yMax, padding.top + gH, padding.top);
            let ph = (padding.top + gH) - py;

            rect(px, py, pw, ph);
        }
    }
}

// X軸の目盛りを描く補助関数
function drawTickX(val, xMin, xMax, padding, gW, gH, label) {
    let px = map(val, xMin, xMax, padding.left, padding.left + gW);
    stroke(0); strokeWeight(1);
    line(px, padding.top + gH, px, padding.top + gH + 5);
    noStroke(); fill(0); textAlign(CENTER, TOP);
    text(label, px, padding.top + gH + 8);
}