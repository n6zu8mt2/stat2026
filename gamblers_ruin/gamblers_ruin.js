/**
 * ギャンブラーの破産問題 シミュレーター
 */

document.addEventListener('DOMContentLoaded', () => {
    let p5Instance = null;
    const startBtn = document.getElementById('start-live-btn');
    const skipBtn = document.getElementById('skip-live-btn');
    const stopBtn = document.getElementById('stop-live-btn');
    const statusText = document.getElementById('live-status');
    const liveMoneySpan = document.getElementById('live-money');
    const liveTurnsSpan = document.getElementById('live-turns');

    let isSkipping = false;
    let isStopped = false;

    // 理論値の計算
    function calcTheoreticalRuin(p, k, N) {
        if (p === 0.5) {
            return (N - k) / N;
        } else {
            let q = 1 - p;
            let alpha = q / p;
            return (Math.pow(alpha, k) - Math.pow(alpha, N)) / (1 - Math.pow(alpha, N));
        }
    }

    // イベントリスナー（スキップ・中断）
    skipBtn.addEventListener('click', () => { isSkipping = true; });
    stopBtn.addEventListener('click', () => { isStopped = true; });

    // -----------------------------------------
    // 1. ライブマッチ（単一ゲーム）の描画
    // -----------------------------------------
    function startLiveMatch() {
        startBtn.disabled = true;
        skipBtn.disabled = false;
        stopBtn.disabled = false;
        isSkipping = false;
        isStopped = false;

        statusText.textContent = "プレイ中...";
        statusText.style.color = "#555";
        liveMoneySpan.style.color = "#1976d2";
        
        if (p5Instance) p5Instance.remove();

        const p_prob = parseFloat(document.getElementById('prob_p').value) || 0.49;
        const k = parseInt(document.getElementById('init_k').value) || 10;
        const N = parseInt(document.getElementById('total_n').value) || 100;
        
        let path = [k];
        let currentT = 0;
        let isFinished = false;

        const sketch = (p) => {
            let tMax = 100; // 横軸の初期最大値

            p.setup = () => {
                const w = document.getElementById('walk-graph-container').clientWidth;
                p.createCanvas(w || 600, 300);
                p.frameRate(60); 
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 30, bottom: 40, left: 60, right: 20 };
                const gW = p.width - padding.left - padding.right;
                const gH = p.height - padding.top - padding.bottom;

                // --- データ更新 ---
                if (isSkipping && !isFinished) {
                    // スキップ押下時: 一気に最後まで計算する
                    while (!isFinished) {
                        currentT++;
                        let currentMoney = path[path.length - 1];
                        currentMoney += (Math.random() < p_prob) ? 1 : -1;
                        path.push(currentMoney);
                        if (currentMoney <= 0 || currentMoney >= N) {
                            isFinished = true;
                        }
                    }
                    if (currentT > tMax) tMax = Math.ceil(currentT * 1.1); // スケール調整
                } else if (isStopped && !isFinished) {
                    // 中断ボタン押下時
                    isFinished = true;
                    statusText.textContent = "🛑 途中棄権しました";
                    statusText.style.color = "#ff9800";
                    liveMoneySpan.style.color = "#ff9800";
                } else if (!isFinished) {
                    // 通常のアニメーション
                    currentT++;
                    let currentMoney = path[path.length - 1];
                    currentMoney += (Math.random() < p_prob) ? 1 : -1;
                    path.push(currentMoney);

                    if (currentT > tMax) tMax = Math.ceil(tMax * 1.5); 
                    
                    if (currentMoney <= 0) {
                        isFinished = true;
                    } else if (currentMoney >= N) {
                        isFinished = true;
                    }
                }

                // 終了時のステータス更新処理
                if (isFinished && !isStopped) {
                    let finalMoney = path[path.length - 1];
                    if (finalMoney <= 0) {
                        statusText.textContent = "💥 破産しました...";
                        statusText.style.color = "#d32f2f";
                        liveMoneySpan.style.color = "#d32f2f";
                    } else if (finalMoney >= N) {
                        statusText.textContent = "🎉 目標額達成（勝ち逃げ）！";
                        statusText.style.color = "#388e3c";
                        liveMoneySpan.style.color = "#388e3c";
                    }
                }

                liveMoneySpan.textContent = path[path.length - 1];
                liveTurnsSpan.textContent = currentT;

                if (isFinished) {
                    p.noLoop();
                    startBtn.disabled = false;
                    skipBtn.disabled = true;
                    stopBtn.disabled = true;
                }

                // --- 描画 ---
                p.noStroke();
                let yInit = p.map(k, 0, N, padding.top + gH, padding.top);
                p.fill(227, 242, 253, 100); 
                p.rect(padding.left, padding.top, gW, gH);

                p.stroke(220); p.strokeWeight(1);
                let stepY = Math.ceil(N / 10);
                for (let i = 0; i <= N; i += stepY) {
                    let y = p.map(i, 0, N, padding.top + gH, padding.top);
                    p.line(padding.left, y, padding.left + gW, y);
                }

                p.stroke('#388e3c'); p.strokeWeight(2);
                p.line(padding.left, padding.top, padding.left + gW, padding.top);
                p.stroke('#d32f2f'); p.strokeWeight(2);
                p.line(padding.left, padding.top + gH, padding.left + gW, padding.top + gH);
                p.stroke(100); p.strokeWeight(1); p.drawingContext.setLineDash([5, 5]);
                p.line(padding.left, yInit, padding.left + gW, yInit);
                p.drawingContext.setLineDash([]);

                p.noStroke(); p.fill(80); p.textSize(12);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(N + " (目標)", padding.left - 8, padding.top);
                p.text("0 (破産)", padding.left - 8, padding.top + gH);
                p.text(k + " (初期)", padding.left - 8, yInit);
                
                p.push();
                p.translate(padding.left - 45, padding.top + gH / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.fill(50); p.text("所持金", 0, 0);
                p.pop();

                p.textAlign(p.CENTER, p.TOP);
                p.fill(50); p.text("プレイ回数", padding.left + gW / 2, padding.top + gH + 20);
                p.fill(80); p.text(0, padding.left, padding.top + gH + 5);
                p.text(tMax, padding.left + gW, padding.top + gH + 5);

                p.stroke('#1976d2');
                p.strokeWeight(2);
                p.noFill();
                p.beginShape();
                // 描画の最適化（点の数が多すぎる場合は間引いて描画）
                let skipDraw = Math.ceil(currentT / gW); 
                for (let t = 0; t <= currentT; t += skipDraw) {
                    let x = p.map(t, 0, tMax, padding.left, padding.left + gW);
                    let y = p.map(path[t], 0, N, padding.top + gH, padding.top);
                    p.vertex(x, y);
                }
                // 最後の点を確実に結ぶ
                if (currentT % skipDraw !== 0) {
                    let x = p.map(currentT, 0, tMax, padding.left, padding.left + gW);
                    let y = p.map(path[currentT], 0, N, padding.top + gH, padding.top);
                    p.vertex(x, y);
                }
                p.endShape();

                // 先端のハイライト
                if (currentT >= 0) {
                    let lastX = p.map(currentT, 0, tMax, padding.left, padding.left + gW);
                    let lastY = p.map(path[currentT], 0, N, padding.top + gH, padding.top);
                    p.fill(path[currentT] <= 0 ? '#d32f2f' : (path[currentT] >= N ? '#388e3c' : '#1976d2'));
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

    // -----------------------------------------
    // 2. 大規模シミュレーション
    // -----------------------------------------
    const runSimBtn = document.getElementById('run_simulation_btn');
    
    runSimBtn.addEventListener('click', () => {
        runSimBtn.disabled = true;
        runSimBtn.textContent = '計算中...';

        setTimeout(() => {
            const p = parseFloat(document.getElementById('prob_p').value);
            const k = parseInt(document.getElementById('init_k').value);
            const N = parseInt(document.getElementById('total_n').value);
            const simCount = parseInt(document.getElementById('num_simulations').value);

            if (isNaN(p) || isNaN(k) || isNaN(N) || isNaN(simCount) || k <= 0 || k >= N || simCount < 1) {
                alert('有効な値を入力してください。（条件: 0 < k < N）');
                runSimBtn.disabled = false;
                runSimBtn.textContent = '大規模シミュレーション実行';
                return;
            }

            // 理論値の計算
            let theoryRuin = calcTheoreticalRuin(p, k, N);
            
            // 数式のHTML生成
            let formulaHTML = "";
            if (p === 0.5) {
                formulaHTML = `$$ P_{${k}} = 1 - \\frac{${k}}{${N}} = ${(theoryRuin).toFixed(4)} $$`;
            } else {
                let q = 1 - p;
                let alpha_str = `\\frac{${q.toFixed(2)}}{${p.toFixed(2)}}`;
                formulaHTML = `$$ P_{${k}} = \\frac{ \\left( ${alpha_str} \\right)^{${k}} - \\left( ${alpha_str} \\right)^{${N}} }{ 1 - \\left( ${alpha_str} \\right)^{${N}} } \\approx ${(theoryRuin).toFixed(4)} $$`;
            }
            document.getElementById('theory-formula').innerHTML = formulaHTML;
            if (window.MathJax) {
                MathJax.typesetPromise([document.getElementById('theory-formula')]);
            }
            
            // 実測値の計算
            let ruinCount = 0;
            let winCount = 0;

            for (let i = 0; i < simCount; i++) {
                let money = k;
                while (money > 0 && money < N) {
                    if (Math.random() < p) {
                        money++;
                    } else {
                        money--;
                    }
                }
                if (money === 0) {
                    ruinCount++;
                } else {
                    winCount++;
                }
            }

            let actualRuinProb = ruinCount / simCount;

            // UIへの反映
            document.getElementById('results-area').style.display = 'block';
            
            document.getElementById('theory-ruin-prob').textContent = (theoryRuin * 100).toFixed(2) + ' %';
            document.getElementById('actual-ruin-prob').textContent = (actualRuinProb * 100).toFixed(2) + ' %';
            document.getElementById('count-ruin').textContent = ruinCount.toLocaleString();
            document.getElementById('count-win').textContent = winCount.toLocaleString();

            const insightBox = document.getElementById('insight-text');
            if (p < 0.5) {
                insightBox.innerHTML = `
                    プレイヤーに不利な設定（p < 0.5）です。<br>
                    相手の資金（${N-k}）が十分大きい場合、<strong>「大数の法則」によってカジノ側が確実に利益を回収する</strong>ため、プレイヤーの破産確率は非常に高くなります。
                `;
            } else if (p === 0.5) {
                insightBox.innerHTML = `
                    完全に公平なゲーム（p = 0.5）です。<br>
                    破産確率は純粋に <strong>資金力の比率（相手の資金 / 全体資金）</strong> だけで決まります。
                `;
            } else {
                insightBox.innerHTML = `
                    プレイヤーに有利な設定（p > 0.5）です。<br>
                    有利なギャンブルであれば、相手の資金がいくらあっても勝ち逃げできる可能性が高くなります。
                `;
            }

            runSimBtn.disabled = false;
            runSimBtn.textContent = '大規模シミュレーション実行';
        }, 50); 
    });
});