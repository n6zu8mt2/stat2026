let draws = []; // ガチャ結果を保持
let numItems = 5; // 景品の種類数（グローバルで保持）
let totalDraws = 0; // 現在の総ガチャ回数

// 理論値（期待値）のHTMLと数式を生成する関数
function generateTheoryHTML(n) {
    let expected = 0;
    for (let i = 1; i <= n; i++) {
        expected += n / i;
    }

    let formula = `$$ E = n \\sum_{k=1}^{n} \\frac{1}{k} = n \\left( \\frac{1}{1} + \\frac{1}{2} + \\cdots + \\frac{1}{n} \\right) $$`;
    
    let subTerms = "";
    // nが10以下の場合はすべての項を展開して表示
    if (n <= 10) {
        let terms = [];
        for(let i = 1; i <= n; i++) {
            terms.push(`\\frac{1}{${i}}`);
        }
        subTerms = terms.join(' + ');
    } else {
        // 大きすぎる場合は省略記号を使用
        subTerms = `\\frac{1}{1} + \\frac{1}{2} + \\cdots + \\frac{1}{${n}}`;
    }

    let substitution = `$$ = ${n} \\left( ${subTerms} \\right) \\approx ${expected.toFixed(1)} \\text{ 回} $$`;

    return `
        💡 <strong>数学の理論値（期待値）:</strong><br>
        $n$ 種類の景品をすべて集めるのに必要なガチャ回数の期待値 $E$ は、以下の式で計算されます。
        ${formula}
        現在設定されている <strong>$n = ${n}$</strong> を代入すると：
        ${substitution}
    `;
}

// 初回ガチャシミュレーション
function runSimulation() {
    const inputItems = parseInt(document.getElementById('num-items').value);
    const numDraws = parseInt(document.getElementById('num-draws').value);

    if (isNaN(inputItems) || inputItems < 1) {
        alert('景品の種類数は1以上の値を指定してください。');
        return;
    }
    if (isNaN(numDraws) || numDraws < 1) {
        alert('ガチャを引く回数は1以上の値を指定してください。');
        return;
    }

    // 初期化
    numItems = inputItems; // 基準となる種類数を更新
    draws = [];
    totalDraws = 0;

    // ガチャを引く
    drawGacha(numDraws);
    displayResults();
}

// 追加ガチャ
function additionalDraw() {
    if (draws.length === 0) {
        alert('まずは「ガチャを引く」ボタンで開始してください。');
        return;
    }
    const additionalDraws = parseInt(document.getElementById('additional-draws').value);

    if (isNaN(additionalDraws) || additionalDraws < 1) {
        alert('追加で引く回数は1以上の値を指定してください。');
        return;
    }

    drawGacha(additionalDraws);
    displayResults();
}

// コンプリートするまで引く
function drawUntilComplete() {
    if (draws.length === 0) {
        // まだ開始していない場合は現在の入力値で開始
        numItems = parseInt(document.getElementById('num-items').value);
        if (isNaN(numItems) || numItems < 1) {
            alert('景品の種類数は1以上の値を指定してください。');
            return;
        }
    }

    // 現在の集めた種類数を計算
    let collectedPrizes = new Set(draws.map(draw => draw.prize));
    let safetyLimit = 50000; // 無限ループ防止（万が一種類数が多すぎた場合）

    while (collectedPrizes.size < numItems && safetyLimit > 0) {
        const prize = Math.floor(Math.random() * numItems);
        draws.push({ drawNumber: totalDraws + 1, prize: prize });
        collectedPrizes.add(prize);
        totalDraws++;
        safetyLimit--;
    }

    if (safetyLimit === 0) {
        alert('回数が多すぎるため途中で停止しました。');
    }

    displayResults();
}

// ガチャを引く共通処理
function drawGacha(numDraws) {
    for (let i = 0; i < numDraws; i++) {
        const prize = Math.floor(Math.random() * numItems); 
        draws.push({ drawNumber: totalDraws + 1, prize: prize });
        totalDraws++;
    }
}

// 結果を表示
function displayResults() {
    // 1. 各景品の取得数をカウント
    const prizeCounts = new Array(numItems).fill(0);
    draws.forEach(draw => {
        prizeCounts[draw.prize]++;
    });

    let collectedCount = 0;

    // 2. アルバム（コンプリート状況）の描画
    const inventoryGrid = document.getElementById('inventory-grid');
    inventoryGrid.innerHTML = '';
    
    for (let i = 0; i < numItems; i++) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        
        if (prizeCounts[i] > 0) {
            // 取得済み
            collectedCount++;
            itemDiv.classList.add('collected');
            itemDiv.classList.add(`color-${i % 10}`);
            itemDiv.innerHTML = `景品<br>${i + 1}`;
            
            // バッジ（取得数）
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = prizeCounts[i];
            itemDiv.appendChild(badge);
        } else {
            // 未取得
            itemDiv.innerHTML = `？`;
        }
        inventoryGrid.appendChild(itemDiv);
    }

    // 3. 理論値（数式）と結果概要のテキスト表示
    document.getElementById('theory-box').innerHTML = generateTheoryHTML(numItems);

    const summaryHTML = `総ガチャ回数: <strong style="font-size:1.3em;">${totalDraws} 回</strong><br>
                         集めた景品の種類数: <strong>${collectedCount} / ${numItems} 種類</strong>`;
    
    const summaryElem = document.getElementById('summary-text');
    if (collectedCount === numItems) {
        summaryElem.innerHTML = summaryHTML + `<br><span style="color: #e91e63; font-weight:bold; font-size:1.2em;">🎉 コンプリート達成！</span>`;
    } else {
        summaryElem.innerHTML = summaryHTML;
    }

    // 4. ガチャ履歴テーブルの描画
    const tbody = document.getElementById('gacha-tbody');
    tbody.innerHTML = '';

    // 列数を決定（見やすさのため最大20列程度）
    const columns = Math.min(20, Math.ceil(Math.sqrt(totalDraws)));
    const rows = Math.ceil(totalDraws / columns);

    let drawIndex = 0;
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < columns; j++) {
            const cell = document.createElement('td');
            if (drawIndex < draws.length) {
                const draw = draws[drawIndex];
                cell.textContent = `${draw.drawNumber}回目`;
                cell.innerHTML += `<br>景品${draw.prize + 1}`;
                cell.classList.add(`color-${draw.prize % 10}`);
            }
            row.appendChild(cell);
            drawIndex++;
        }
        tbody.appendChild(row);
    }

    // テーブルの一番下までスクロールさせる
    const historyWrapper = document.querySelector('.history-wrapper');
    historyWrapper.scrollTop = historyWrapper.scrollHeight;

    // MathJaxの再レンダリング（動的に追加した数式を描画するため）
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

// リセット
function resetSimulation() {
    draws = [];
    totalDraws = 0;

    document.getElementById('gacha-tbody').innerHTML = '';
    document.getElementById('inventory-grid').innerHTML = '';
    document.getElementById('summary-text').textContent = 'ガチャを引いてください。';
    document.getElementById('theory-box').innerHTML = '';
}