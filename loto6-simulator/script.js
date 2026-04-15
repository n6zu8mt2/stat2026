let recentDraws = []; // 直近10回分の抽選結果を保存

// クイックピック機能（1〜43からランダムに6個選ぶ）
function generateQuickPick() {
    const nums = new Set();
    while (nums.size < 6) {
        nums.add(Math.floor(Math.random() * 43) + 1);
    }
    const sortedNums = Array.from(nums).sort((a, b) => a - b);
    document.getElementById('numbers').value = sortedNums.join(' ');
}

function runSimulation() {
    // 入力値を取得
    const numbersInput = document.getElementById('numbers').value.trim();
    const numDraws = parseInt(document.getElementById('num-draws').value);

    // 入力値のバリデーション
    const numbers = numbersInput.split(/\s+/).map(Number);
    if (numbers.length !== 6 || numbers.some(n => isNaN(n) || n < 1 || n > 43) || new Set(numbers).size !== 6) {
        alert('1～43の範囲で異なる6つの数字をスペース区切りで入力してください。（クイックピックボタンも便利です）');
        return;
    }
    if (isNaN(numDraws) || numDraws < 1) {
        alert('抽選回数は1以上の値を指定してください。');
        return;
    }

    // ボタンを無効化して処理中であることを示す
    const button = document.getElementById('btn-start');
    button.disabled = true;
    button.textContent = '抽選処理中... 0%';

    // 当選回数の初期化
    const results = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, miss: 0 };
    recentDraws = [];
    let currentDraw = 0;

    // バッチ処理で非同期に抽選を実行（UIフリーズ防止）
    function processBatch() {
        const batchSize = 50000; // 1回あたりの処理数
        const drawsToProcess = Math.min(batchSize, numDraws - currentDraw);

        for (let i = 0; i < drawsToProcess; i++) {
            const { mainNumbers, bonusNumber } = drawNumbers();
            const rank = checkWin(numbers, mainNumbers, bonusNumber);
            
            if (rank === 'miss') {
                results.miss++;
            } else {
                results[rank]++;
            }

            // 直近10回分の抽選結果を保存
            recentDraws.push({ draw: currentDraw + 1, selected: numbers, main: mainNumbers, bonus: bonusNumber, rank });
            if (recentDraws.length > 10) {
                recentDraws.shift();
            }
            
            currentDraw++;
        }

        if (currentDraw < numDraws) {
            const percent = Math.floor((currentDraw / numDraws) * 100);
            button.textContent = `抽選処理中... ${percent}%`;
            setTimeout(processBatch, 0);
        } else {
            // 全ての抽選が完了したら結果を表示
            displayDrawResults(numbers);
            const totalPrize = displayResults(results, numDraws);
            displaySummary(totalPrize, numDraws);
            
            button.disabled = false;
            button.textContent = '抽選開始';
        }
    }

    setTimeout(processBatch, 10);
}

// 数字を抽選する関数
function drawNumbers() {
    const allNumbers = Array.from({ length: 43 }, (_, i) => i + 1);
    const mainNumbers = [];
    
    // 本数字6個を選択
    for (let i = 0; i < 6; i++) {
        const index = Math.floor(Math.random() * allNumbers.length);
        mainNumbers.push(allNumbers.splice(index, 1)[0]);
    }
    mainNumbers.sort((a, b) => a - b);
    
    // 残りからボーナス数字を選択
    const bonusNumber = allNumbers[Math.floor(Math.random() * allNumbers.length)];
    return { mainNumbers, bonusNumber };
}

// 当選判定関数
function checkWin(selectedNumbers, mainNumbers, bonusNumber) {
    const matchedMain = selectedNumbers.filter(num => mainNumbers.includes(num)).length;
    const matchedBonus = selectedNumbers.includes(bonusNumber);

    if (matchedMain === 6) return 1;
    if (matchedMain === 5 && matchedBonus) return 2;
    if (matchedMain === 5) return 3;
    if (matchedMain === 4) return 4;
    if (matchedMain === 3) return 5;
    return 'miss';
}

// 抽選結果の履歴を表示（一致した数字をハイライト）
function displayDrawResults(selectedNumbers) {
    const tableBody = document.getElementById('draw-table-body');
    tableBody.innerHTML = '';

    // 最新の抽選が一番上に来るように逆順で表示
    const displayHistory = [...recentDraws].reverse();

    displayHistory.forEach(draw => {
        const row = document.createElement('tr');
        
        // 本数字のフォーマット（選んだ数字と一致したらハイライト）
        const formattedMain = draw.main.map(n => {
            return selectedNumbers.includes(n) ? `<span class="match-main">${n}</span>` : n;
        }).join(', ');

        // ボーナス数字のフォーマット
        const formattedBonus = selectedNumbers.includes(draw.bonus) ? `<span class="match-bonus">${draw.bonus}</span>` : draw.bonus;

        row.innerHTML = `
            <td>${draw.draw.toLocaleString()}</td>
            <td style="letter-spacing:1px;">${selectedNumbers.join(', ')}</td>
            <td style="letter-spacing:1px;">${formattedMain}</td>
            <td>${formattedBonus}</td>
            <td class="${draw.rank !== 'miss' ? 'rank-' + draw.rank : ''}">${draw.rank === 'miss' ? 'ハズレ' : draw.rank + '等'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 当選結果、割合、理論値を計算して表示
function displayResults(results, numDraws) {
    const tableBody = document.getElementById('result-body');
    tableBody.innerHTML = '';

    const prizes = {
        1: 200000000, // 2億円
        2: 10000000,  // 1000万円
        3: 300000,    // 30万円
        4: 6800,      // 6800円
        5: 1000       // 1000円
    };

    // 理論値（全組み合わせ 6,096,454 通り）
    const totalCombos = 6096454;
    const theoretical = {
        1: ((1 / totalCombos) * 100).toFixed(6) + '%',
        2: ((6 / totalCombos) * 100).toFixed(6) + '%',
        3: ((216 / totalCombos) * 100).toFixed(4) + '%',
        4: ((9990 / totalCombos) * 100).toFixed(4) + '%',
        5: ((155400 / totalCombos) * 100).toFixed(4) + '%',
        miss: ((5930841 / totalCombos) * 100).toFixed(4) + '%'
    };

    const ranks = [
        { key: 1, label: '1等' },
        { key: 2, label: '2等' },
        { key: 3, label: '3等' },
        { key: 4, label: '4等' },
        { key: 5, label: '5等' },
        { key: 'miss', label: 'ハズレ' }
    ];

    let totalPrize = 0;

    ranks.forEach(rank => {
        const count = results[rank.key];
        const prizeSum = rank.key !== 'miss' ? prizes[rank.key] * count : 0;
        totalPrize += prizeSum;
        const actualRate = ((count / numDraws) * 100);
        
        // 桁数調整（1等2等は小さすぎるので小数点以下6桁まで表示）
        const rateStr = rank.key === 1 || rank.key === 2 
            ? actualRate.toFixed(6) + '%' 
            : actualRate.toFixed(4) + '%';

        const tr = document.createElement('tr');
        if (rank.key !== 'miss') tr.classList.add(`rank-${rank.key}`);

        tr.innerHTML = `
            <td>${rank.label}</td>
            <td class="num">${count.toLocaleString()}</td>
            <td class="num">${rateStr}</td>
            <td class="num" style="color:#7f8c8d;">${theoretical[rank.key]}</td>
            <td class="num">${prizeSum > 0 ? prizeSum.toLocaleString() + '円' : '-'}</td>
        `;
        tableBody.appendChild(tr);
    });

    return totalPrize;
}

// 収支を表示
function displaySummary(totalPrize, numDraws) {
    const tableBody = document.getElementById('summary-body');
    tableBody.innerHTML = '';

    const costPerDraw = 200; // 1回あたりの購入費用
    const totalCost = numDraws * costPerDraw;
    const profit = totalPrize - totalCost;

    const rows = [
        { label: '総購入費用', value: totalCost },
        { label: '総獲得金額', value: totalPrize },
        { label: '最終収支', value: profit }
    ];

    rows.forEach(row => {
        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        const tdValue = document.createElement('td');
        
        tdLabel.textContent = row.label;
        
        if (row.label === '最終収支') {
            tdValue.textContent = `${row.value > 0 ? '+' : ''}${row.value.toLocaleString()}円`;
            if (row.value > 0) {
                tdLabel.classList.add('profit-positive');
                tdValue.classList.add('profit-positive');
            } else if (row.value < 0) {
                tdLabel.classList.add('profit-negative');
                tdValue.classList.add('profit-negative');
            } else {
                tdValue.classList.add('num');
            }
        } else {
            tdValue.textContent = `${row.value.toLocaleString()}円`;
            tdValue.classList.add('num');
        }
        
        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);
        tableBody.appendChild(tr);
    });
}