let isAnimating = false;
let isPaused = false;
let currentTrial = 0;
let numTrials = 0;
let counts = { 0: 0, 1: 0, 2: 0 };
let recentHistory = [];
let batchSize = 1;
let delay = 100;

function runSimulation() {
    if (isAnimating && !isPaused) return;

    // 入力値を取得
    numTrials = parseInt(document.getElementById('num-trials').value);

    // 入力値のバリデーション
    if (isNaN(numTrials) || numTrials < 1) {
        alert('試行回数は1以上の値を指定してください。');
        return;
    }

    isAnimating = true;
    isPaused = false;
    currentTrial = 0;
    counts = { 0: 0, 1: 0, 2: 0 };
    recentHistory = [];

    const btnStart = document.getElementById('btn-start');
    btnStart.disabled = true;
    btnStart.textContent = 'シミュレーション実行中...';
    
    const btnPause = document.getElementById('btn-pause');
    btnPause.disabled = false;
    btnPause.textContent = '一時停止';

    // UI初期化
    document.getElementById('total-trial').textContent = numTrials.toLocaleString();
    document.getElementById('current-trial').textContent = '0';
    
    document.getElementById('count-0').textContent = '0';
    document.getElementById('count-1').textContent = '0';
    document.getElementById('count-2').textContent = '0';
    document.getElementById('rate-0').textContent = '0.00%';
    document.getElementById('rate-1').textContent = '0.00%';
    document.getElementById('rate-2').textContent = '0.00%';
    
    document.getElementById('history-body').innerHTML = '';

    const coin1El = document.getElementById('coin1');
    const coin2El = document.getElementById('coin2');

    // コインを回転状態にする
    coin1El.classList.add('spinning');
    coin2El.classList.add('spinning');
    coin1El.classList.remove('show-back');
    coin2El.classList.remove('show-back');

    // 試行回数に応じたバッチサイズと遅延を設定
    batchSize = 1;
    delay = 100; // ms
    if (numTrials > 50) { batchSize = 5; delay = 50; }
    if (numTrials > 500) { batchSize = 50; delay = 20; }
    if (numTrials > 5000) { batchSize = 500; delay = 0; }
    if (numTrials > 50000) { batchSize = 5000; delay = 0; }
    if (numTrials > 500000) { batchSize = 20000; delay = 0; }

    setTimeout(processBatch, 100);
}

function togglePause() {
    if (!isAnimating) return;

    isPaused = !isPaused;
    const btnPause = document.getElementById('btn-pause');
    const btnStart = document.getElementById('btn-start');
    const coin1El = document.getElementById('coin1');
    const coin2El = document.getElementById('coin2');

    if (isPaused) {
        btnPause.textContent = '再開';
        btnStart.textContent = '一時停止中...';
        coin1El.classList.remove('spinning');
        coin2El.classList.remove('spinning');
    } else {
        btnPause.textContent = '一時停止';
        btnStart.textContent = 'シミュレーション実行中...';
        coin1El.classList.add('spinning');
        coin2El.classList.add('spinning');
        processBatch(); // 処理再開
    }
}

function processBatch() {
    if (isPaused) return;

    const drawsToProcess = Math.min(batchSize, numTrials - currentTrial);
    let lastCoin1, lastCoin2;

    for (let i = 0; i < drawsToProcess; i++) {
        lastCoin1 = Math.random() < 0.5 ? 0 : 1; // 0: 裏, 1: 表
        lastCoin2 = Math.random() < 0.5 ? 0 : 1;
        const heads = lastCoin1 + lastCoin2;
        counts[heads]++;
        currentTrial++;
        
        recentHistory.push({
            trial: currentTrial,
            coin1: lastCoin1 === 1 ? '表' : '裏',
            coin2: lastCoin2 === 1 ? '表' : '裏',
            heads: heads
        });
        if (recentHistory.length > 10) {
            recentHistory.shift();
        }
    }

    // 表示の更新
    document.getElementById('current-trial').textContent = currentTrial.toLocaleString();
    for (let i = 0; i <= 2; i++) {
        document.getElementById(`count-${i}`).textContent = counts[i].toLocaleString();
        document.getElementById(`rate-${i}`).textContent = ((counts[i] / currentTrial) * 100).toFixed(2) + '%';
    }
    
    updateHistoryDisplay();

    if (currentTrial < numTrials) {
        if (numTrials <= 50) {
            document.getElementById('coin1').classList.toggle('show-back', lastCoin1 === 0);
            document.getElementById('coin2').classList.toggle('show-back', lastCoin2 === 0);
        }
        
        if (delay > 0) {
            setTimeout(processBatch, delay);
        } else {
            requestAnimationFrame(processBatch);
        }
    } else {
        finishSimulation(lastCoin1, lastCoin2);
    }
}

function updateHistoryDisplay() {
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';
    
    // 最新のものが一番上に来るようにする
    const displayHistory = [...recentHistory].reverse();
    
    displayHistory.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.trial}</td>
            <td>${item.coin1}</td>
            <td>${item.coin2}</td>
            <td class="rank-${item.heads + 1}">${item.heads}</td>
        `;
        tbody.appendChild(tr);
    });
}

function finishSimulation(c1, c2) {
    const coin1El = document.getElementById('coin1');
    const coin2El = document.getElementById('coin2');
    
    coin1El.classList.remove('spinning');
    coin2El.classList.remove('spinning');
    
    coin1El.classList.toggle('show-back', c1 === 0);
    coin2El.classList.toggle('show-back', c2 === 0);

    isAnimating = false;
    isPaused = false;
    
    const btnStart = document.getElementById('btn-start');
    btnStart.disabled = false;
    btnStart.textContent = 'シミュレーション実行';
    
    const btnPause = document.getElementById('btn-pause');
    btnPause.disabled = true;
    btnPause.textContent = '一時停止';
}