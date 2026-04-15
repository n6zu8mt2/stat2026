let recentDraws = []; // 直近10回分の抽選結果を保存

function runSimulation() {
    // 入力値を取得
    const numbersInput = document.getElementById('numbers').value.trim();
    const numDraws = parseInt(document.getElementById('num-draws').value);

    // 入力値のバリデーション
    const numbers = numbersInput.split(/\s+/).map(Number);
    if (numbers.length !== 6 || numbers.some(n => isNaN(n) || n < 1 || n > 43) || new Set(numbers).size !== 6) {
        alert('1～43の範囲で異なる6つの数字をスペース区切りで入力してください。');
        return;
    }
    if (isNaN(numDraws) || numDraws < 1) {
        alert('抽選回数は1以上の値を指定してください。');
        return;
    }

    // ボタンを無効化して処理中であることを示す
    const button = document.querySelector('.action-btn');
    button.disabled = true;
    button.textContent = '抽選処理中... 0%';

    // 当選回数の初期化
    const results = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, miss: 0 };
    recentDraws = [];
    let currentDraw = 0;

    // バッチ処理で非同期に抽選を実行（ブラウザのフリーズを防ぐ）
    function processBatch() {
        const batchSize = 50000; // 1回あたりの処理数
        const drawsToProcess = Math.min(batchSize, numDraws - currentDraw);

        for (let i = 0; i < drawsToProcess; i++) {
            // 本数字とボーナス数字を抽選
            const { mainNumbers, bonusNumber } = drawNumbers();
            // 当選判定
            const rank = checkWin(numbers, mainNumbers, bonusNumber);
            
            // 結果を記録
            if (rank === 'miss') {
                results.miss++;
            } else {
                results[rank]++;
            }

            // 直近10回分の抽選結果を保存
            if (recentDraws.length < 10) {
                recentDraws.push({ draw: currentDraw + 1, selected: numbers, main: mainNumbers, bonus: bonusNumber, rank });
            } else {
                recentDraws.shift();
                recentDraws.push({ draw: currentDraw + 1, selected: numbers, main: mainNumbers, bonus: bonusNumber, rank });
            }
            
            currentDraw++;
        }

        if (currentDraw < numDraws) {
            // 進捗をボタンに表示
            const percent = Math.floor((currentDraw / numDraws) * 100);
            button.textContent = `抽選処理中... ${percent}%`;
            // 次のバッチをスケジュール
            setTimeout(processBatch, 0);
        } else {
            // 全ての抽選が完了したら結果を表示
            displayDrawResults();
            const totalPrize = displayResults(results, numDraws);
            displaySummary(totalPrize, numDraws);
            
            // ボタンを元に戻す
            button.disabled = false;
            button.textContent = '抽選開始';
        }
    }

    // 処理開始
    setTimeout(processBatch, 0);
}

// 数字を抽選
function drawNumbers() {
    const numbers = Array.from({ length: 43 }, (_, i) => i + 1);
    const mainNumbers = [];
    // 本数字6個を選択
    for (let i = 0; i < 6; i++) {
        const index = Math.floor(Math.random() * numbers.length);
        mainNumbers.push(numbers.splice(index, 1)[0]);
    }
    mainNumbers.sort((a, b) => a - b);
    // ボーナス数字を選択（本数字と重複しない）
    const bonusNumber = numbers[Math.floor(Math.random() * numbers.length)];
    return { mainNumbers, bonusNumber };
}

// 当選判定
function checkWin(selectedNumbers, mainNumbers, bonusNumber) {
    const matchedMain = selectedNumbers.filter(num => mainNumbers.includes(num)).length;
    const matchedBonus = selectedNumbers.includes(bonusNumber);

    if (matchedMain === 6) {
        return 1; // 1等
    } else if (matchedMain === 5) {
        if (matchedBonus) {
            return 2; // 2等
        } else {
            return 3; // 3等
        }
    } else if (matchedMain === 4) {
        return 4; // 4等
    } else if (matchedMain === 3) {
        return 5; // 5等
    } else {
        return 'miss'; // ハズレ
    }
}

// 抽選結果を表示
function displayDrawResults() {
    const tableBody = document.getElementById('draw-table-body');
    tableBody.innerHTML = '';

    recentDraws.forEach(draw => {
        const row = document.createElement('tr');
        const cells = [
            draw.draw, // 回
            draw.selected.join(', '), // 選択した数字
            draw.main.join(', '), // 本数字
            draw.bonus, // ボーナス数字
            draw.rank === 'miss' ? 'ハズレ' : `${draw.rank}等` // 結果
        ];

        cells.forEach((cell, index) => {
            const td = document.createElement('td');
            td.textContent = cell;
            if (index === 4 && draw.rank !== 'miss') {
                td.classList.add(`rank-${draw.rank}`);
            }
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });
}

// 当選結果を表示（総獲得金額を返す）
function displayResults(results, numDraws) {
    const tableBody = document.getElementById('result-body');
    tableBody.innerHTML = '';

    const prizes = {
        1: 200000000, // 1等: 2億円
        2: 10000000,  // 2等: 1000万円
        3: 300000,    // 3等: 30万円
        4: 6800,      // 4等: 6800円
        5: 1000       // 5等: 1000円
    };

    const rows = [
        { rank: '1等', count: results[1], prize: prizes[1] * results[1], class: 'rank-1' },
        { rank: '2等', count: results[2], prize: prizes[2] * results[2], class: 'rank-2' },
        { rank: '3等', count: results[3], prize: prizes[3] * results[3], class: 'rank-3' },
        { rank: '4等', count: results[4], prize: prizes[4] * results[4], class: 'rank-4' },
        { rank: '5等', count: results[5], prize: prizes[5] * results[5], class: 'rank-5' },
        { rank: 'ハズレ', count: results.miss, prize: 0 }
    ];

    let totalPrize = 0;
    rows.forEach(row => {
        totalPrize += row.prize;
        const tr = document.createElement('tr');
        
        const tdRank = document.createElement('td');
        tdRank.textContent = row.rank;
        if (row.class) tdRank.classList.add(row.class);
        
        const tdCount = document.createElement('td');
        tdCount.textContent = row.count.toLocaleString(); // カンマ区切り
        
        const tdPrize = document.createElement('td');
        tdPrize.textContent = `${row.prize.toLocaleString()}円`;
        
        tr.appendChild(tdRank);
        tr.appendChild(tdCount);
        tr.appendChild(tdPrize);
        tableBody.appendChild(tr);
    });

    return totalPrize;
}

// 収支を表示
function displaySummary(totalPrize, numDraws) {
    const tableBody = document.getElementById('summary-body');
    tableBody.innerHTML = '';

    const costPerDraw = 200; // 1回あたりの購入費用（円）
    const totalCost = numDraws * costPerDraw;
    const profit = totalPrize - totalCost;

    const rows = [
        { label: '総獲得金額', value: totalPrize },
        { label: '総購入費用', value: totalCost },
        { label: '収支', value: profit }
    ];

    rows.forEach(row => {
        const tr = document.createElement('tr');
        
        const tdLabel = document.createElement('td');
        tdLabel.textContent = row.label;
        
        const tdValue = document.createElement('td');
        
        if (row.label === '収支') {
            tdValue.textContent = `${row.value > 0 ? '+' : ''}${row.value.toLocaleString()}円`;
            if (row.value > 0) {
                tdLabel.classList.add('profit-positive');
                tdValue.classList.add('profit-positive');
            } else if (row.value < 0) {
                tdLabel.classList.add('profit-negative');
                tdValue.classList.add('profit-negative');
            }
        } else {
            tdValue.textContent = `${row.value.toLocaleString()}円`;
        }
        
        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);
        tableBody.appendChild(tr);
    });
}