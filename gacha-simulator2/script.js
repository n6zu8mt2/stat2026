let totalDraws = 0;
let successCount = 0;
let firstSuccessDraw = null;
let results = [];

// アニメーション制御用フラグ
let isAnimating = false;
let animFrameId = null;
let animTimeoutId = null;

function getProbability() {
    const pPercent = parseFloat(document.getElementById('probability').value);
    if (isNaN(pPercent) || pPercent <= 0 || pPercent >= 100) return 0.01;
    return pPercent / 100.0;
}

// 確率判定のみを行う純粋な関数
function _checkSuccess(p) {
    return Math.random() < p;
}

// グローバル変数を更新する関数
function _applyDraw(isSuccess) {
    totalDraws++;
    if (isSuccess) {
        if (firstSuccessDraw === null) firstSuccessDraw = totalDraws;
        successCount++;
    }
    results.push(isSuccess);
}

// 通常のガチャ（一瞬で結果を表示）
function drawGacha(times) {
    if (isAnimating) return; // 演出中はブロック
    
    const p = getProbability();
    const grid = document.getElementById('resultGrid');
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < times; i++) {
        const isSuccess = _checkSuccess(p);
        _applyDraw(isSuccess);
        
        const div = document.createElement('div');
        div.className = isSuccess ? 'pull-item success drawing' : 'pull-item drawing';
        div.title = `${totalDraws - times + i + 1}回目`;
        fragment.appendChild(div);
    }
    
    grid.appendChild(fragment);
    scrollToBottom(grid);
    updateSummary();
}

function drawTen() { drawGacha(10); }

function drawM() {
    const m = parseInt(document.getElementById('extraDraws').value);
    const times = (isNaN(m) || m < 1) ? 10 : m;
    drawGacha(times);
}

// ✨ 「出るまで引く」のアニメーション演出付き処理 ✨
function drawUntilSuccess() {
    if (isAnimating) return;
    isAnimating = true;

    const p = getProbability();
    const btn = document.getElementById('btn-until-success');
    btn.disabled = true;

    const grid = document.getElementById('resultGrid');
    
    let drawsInThisRun = 0;
    let isSuccess = false;
    const LIMIT = 100000;
    const memoryPulls = [];

    // 1. 高速で結果だけを先に計算 (Dry Run)
    while (!isSuccess && drawsInThisRun < LIMIT) {
        isSuccess = _checkSuccess(p);
        memoryPulls.push(isSuccess);
        drawsInThisRun++;
    }

    // 2. 演出（アニメーション）フェーズ
    // 数万回ハマることもあるため、最大でも約1.5秒（90フレーム）で演出が終わるように速度を自動調整
    const batchSize = Math.max(1, Math.ceil((memoryPulls.length - 1) / 90));
    let currentIndex = 0;

    function renderFrame() {
        if (!isAnimating) return; // リセットでキャンセルされた場合

        const fragment = document.createDocumentFragment();
        let renderedThisFrame = 0;

        // ハズレの箱を画面に追加していく（バッチ処理）
        while (currentIndex < memoryPulls.length - 1 && renderedThisFrame < batchSize) {
            const success = memoryPulls[currentIndex];
            _applyDraw(success);
            
            const div = document.createElement('div');
            div.className = 'pull-item drawing'; 
            fragment.appendChild(div);
            
            currentIndex++;
            renderedThisFrame++;
        }

        if (renderedThisFrame > 0) {
            grid.appendChild(fragment);
            scrollToBottom(grid);
            updateSummary();
        }

        // まだハズレが残っていれば次のフレームへ
        if (currentIndex < memoryPulls.length - 1) {
            animFrameId = requestAnimationFrame(renderFrame);
        } else {
            // 3. 最後の1回（確定演出）
            animTimeoutId = setTimeout(() => {
                if (!isAnimating) return;

                const finalSuccess = memoryPulls[currentIndex];
                _applyDraw(finalSuccess);
                
                const div = document.createElement('div');
                // 当たりの場合はド派手な専用クラスを付与
                div.className = finalSuccess ? 'pull-item success dramatic-success' : 'pull-item';
                grid.appendChild(div);
                scrollToBottom(grid);
                updateSummary();

                // 確定ポップアップ演出が終わる頃にリザルトモーダルを表示
                animTimeoutId = setTimeout(() => {
                    if (!isAnimating) return;
                    showModal(drawsInThisRun, totalDraws, finalSuccess);
                    btn.disabled = false;
                    isAnimating = false;
                }, 1300);

            }, 400); // ★ここがガチャ特有の「無音のタメ（0.4秒）」です
        }
    }

    // アニメーション開始
    animFrameId = requestAnimationFrame(renderFrame);
}

// リザルトモーダルの表示
function showModal(drawsInThisRun, total, isSuccess) {
    const modal = document.getElementById('gachaModal');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const card = document.getElementById('gacha-card');

    if (isSuccess) {
        title.innerHTML = '🎉 おめでとうございます！';
        title.style.color = '#e65100';
        card.style.background = 'linear-gradient(135deg, #ffd54f 0%, #ff6f00 100%)';
        card.innerHTML = '<span class="card-text">SSR</span>';
        desc.innerHTML = `欲しいキャラが <strong>${drawsInThisRun.toLocaleString()}回目</strong> で出ました！<br>（総計: ${total.toLocaleString()}回目）`;
    } else {
        title.innerHTML = '💀 限界突破...';
        title.style.color = '#d32f2f';
        card.style.background = 'linear-gradient(135deg, #90a4ae 0%, #455a64 100%)';
        card.innerHTML = '<span class="card-text">...</span>';
        desc.innerHTML = `${drawsInThisRun.toLocaleString()}回引いても出ませんでした。<br>確率の設定を見直してください。`;
    }

    modal.style.display = 'flex';
    void modal.offsetWidth; // アニメーションを確実に発火させるためのリフロー
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('gachaModal');
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

// グリッドを一番下までスクロール
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

// 概要テキストの更新
function updateSummary() {
    const summaryDiv = document.getElementById('summary');
    let html = `現在 <strong>${totalDraws.toLocaleString()} 回</strong> 引いて、欲しいキャラが <strong>${successCount.toLocaleString()} 回</strong> 出ました。<br>`;
    
    if (totalDraws > 0) {
        const actualRate = (successCount / totalDraws) * 100;
        html += `実際の排出率: <strong>${actualRate.toFixed(3)} %</strong> <br>`;
    }

    if (firstSuccessDraw) {
        html += `<span style="color: #d32f2f; font-weight: bold;">初めて出たのは ${firstSuccessDraw.toLocaleString()} 回目です！</span>`;
    }
    summaryDiv.innerHTML = html;
}

// 大規模シミュレーション
function simulateMultipleDraws() {
    const drawsPerPerson = parseInt(document.getElementById('drawsPerSimulation').value) || 100;
    const peopleCount = parseInt(document.getElementById('simulationCount').value) || 10000;
    const p = getProbability();
    
    let luckyPeople = 0;

    for (let i = 0; i < peopleCount; i++) {
        let hasSuccess = false;
        for (let j = 0; j < drawsPerPerson; j++) {
            if (Math.random() < p) {
                hasSuccess = true;
                break; 
            }
        }
        if (hasSuccess) luckyPeople++;
    }

    const theoreticalProb = (1 - Math.pow(1 - p, drawsPerPerson)) * 100;
    const actualProb = (luckyPeople / peopleCount) * 100;

    const resultBox = document.getElementById('simulationResult');
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
        <h4>シミュレーション完了</h4>
        <p style="text-align:center; margin-bottom: 10px;">${peopleCount.toLocaleString()} 人中 <strong>${luckyPeople.toLocaleString()} 人</strong> が当たりを引きました。</p>
        <div class="sim-compare">
            <div>
                理論値（計算上の確率）<br>
                <span class="val">${theoreticalProb.toFixed(2)} %</span>
            </div>
            <div>
                実測値（今回の結果）<br>
                <span class="val">${actualProb.toFixed(2)} %</span>
            </div>
        </div>
    `;
}

function toggleGrid() {
    const grid = document.getElementById('resultGrid');
    const toggle = document.getElementById('tableToggle').checked;
    grid.style.display = toggle ? 'flex' : 'none';
}

// 全リセット（アニメーションの強制終了処理含む）
function resetAll() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (animTimeoutId) clearTimeout(animTimeoutId);
    isAnimating = false;
    document.getElementById('btn-until-success').disabled = false;

    totalDraws = 0;
    successCount = 0;
    firstSuccessDraw = null;
    results = [];
    
    document.getElementById('resultGrid').innerHTML = '';
    document.getElementById('simulationResult').style.display = 'none';
    document.getElementById('summary').innerHTML = 'ガチャを引いてください。';
}