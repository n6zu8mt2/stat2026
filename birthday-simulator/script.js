// アニメーション関連の変数
let isAnimating = false;
let animationInterval;
let currentIndex = 0;
let simBirthdays = [];
let simGroups = {};
let colorMap = {};
let nextColorIdx = 0;

// 初期化とイベントリスナー設定
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('slider-people');
    const input = document.getElementById('num-people');

    // スライダーと数値入力の同期
    slider.addEventListener('input', (e) => {
        input.value = e.target.value;
        updateProbability(parseInt(e.target.value));
    });

    input.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (val >= 1 && val <= 100) {
            slider.value = val;
            updateProbability(val);
        }
    });

    // 初期値で確率を計算
    updateProbability(parseInt(slider.value));
});

// 誕生日が一致する確率（理論値）を計算
function calculateBirthdayMatchProbability(n) {
    if (n <= 1) return 0;
    if (n > 365) return 1;

    let probDifferent = 1.0;
    for (let k = 0; k < n; k++) {
        probDifferent *= (365 - k) / 365;
    }
    return 1 - probDifferent;
}

// プログレスバーの表示更新
function updateProbability(n) {
    let prob = calculateBirthdayMatchProbability(n) * 100;
    document.getElementById('prob-value').textContent = prob.toFixed(2) + '%';
    document.getElementById('prob-bar').style.width = prob + '%';
}

// シミュレーション開始
function startSimulation() {
    let n = parseInt(document.getElementById('num-people').value);
    if(n < 1 || n > 100) {
        alert('人数は1〜100の間で入力してください（多すぎると表示が崩れます）。');
        return;
    }
    
    // UI初期化
    document.getElementById('cards-container').innerHTML = '';
    document.getElementById('result-text').innerHTML = '誕生日を生成中...';
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-skip').disabled = false;
    
    // データ生成
    simBirthdays = [];
    for(let i = 0; i < n; i++){
        let dayOfYear = Math.floor(Math.random() * 365) + 1; // うるう年なし 1〜365
        simBirthdays.push({
            id: i + 1,
            dayOfYear: dayOfYear,
            date: dayOfYearToDate(dayOfYear)
        });
    }
    
    // アニメーション用ステート初期化
    simGroups = {};
    colorMap = {};
    nextColorIdx = 0;
    currentIndex = 0;
    isAnimating = true;
    
    // アニメーション速度 (人数が多いほど速くする)
    let delay = n > 50 ? 30 : 80;
    animationInterval = setInterval(showNextCard, delay);
}

// カードを1枚ずつ表示する
function showNextCard() {
    if(currentIndex >= simBirthdays.length) {
        finishSimulation();
        return;
    }
    
    let person = simBirthdays[currentIndex];
    let key = person.dayOfYear;
    let isMatch = false;
    
    // マッチ判定
    if(!simGroups[key]) {
        simGroups[key] = [];
    } else {
        isMatch = true;
        // 初めてマッチした（2人目が出た）時、カラーを割り当て、1人目のカードも色付けする
        if(simGroups[key].length === 1) { 
            colorMap[key] = nextColorIdx % 10;
            nextColorIdx++;
            
            let firstPerson = simGroups[key][0];
            let firstCard = document.getElementById('card-' + firstPerson.id);
            if(firstCard) {
                firstCard.className = `card show match-${colorMap[key]} wobble`;
            }
        }
    }
    simGroups[key].push(person);
    
    // カード要素の生成
    let card = document.createElement('div');
    card.id = 'card-' + person.id;
    card.className = 'card';
    card.innerHTML = `
        <div class="number">${person.id}人目</div>
        <div class="date">${person.date}</div>
    `;
    
    if(isMatch) {
        card.classList.add('match-' + colorMap[key]);
        card.classList.add('wobble'); // アニメーション付与
    }
    
    document.getElementById('cards-container').appendChild(card);
    
    // 少し遅延させて scale(1) のトランジションを発火
    setTimeout(() => {
        card.classList.add('show');
    }, 10);
    
    currentIndex++;
}

// アニメーションをスキップして全結果を即座に表示
function skipAnimation() {
    if(!isAnimating) return;
    clearInterval(animationInterval);
    
    while(currentIndex < simBirthdays.length) {
        showNextCardSync(); // 即座に追加
        currentIndex++;
    }
    finishSimulation();
}

// タイマーなしでのカード追加
function showNextCardSync() {
    let person = simBirthdays[currentIndex];
    let key = person.dayOfYear;
    let isMatch = false;
    
    if(!simGroups[key]) {
        simGroups[key] = [];
    } else {
        isMatch = true;
        if(simGroups[key].length === 1) {
            colorMap[key] = nextColorIdx % 10;
            nextColorIdx++;
            let firstCard = document.getElementById('card-' + simGroups[key][0].id);
            if(firstCard) firstCard.className = `card show match-${colorMap[key]}`;
        }
    }
    simGroups[key].push(person);
    
    let card = document.createElement('div');
    card.id = 'card-' + person.id;
    card.className = 'card show'; // wobbleなしで即座に表示
    card.innerHTML = `
        <div class="number">${person.id}人目</div>
        <div class="date">${person.date}</div>
    `;
    if(isMatch) card.classList.add('match-' + colorMap[key]);
    
    document.getElementById('cards-container').appendChild(card);
}

// シミュレーション終了時の処理
function finishSimulation() {
    clearInterval(animationInterval);
    isAnimating = false;
    
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-skip').disabled = true;
    
    // 結果の集計
    let matchGroups = Object.values(simGroups).filter(g => g.length > 1);
    let resText = "";
    
    if(matchGroups.length > 0) {
        let details = matchGroups.map(g => `${g[0].date} (${g.length}人)`).join('、');
        resText = `<span style="color:#d35400; font-weight:bold; font-size:1.2em;">同じ誕生日の組が ${matchGroups.length} 組ありました！</span><br>一致した誕生日: ${details}`;
    } else {
        resText = `<span style="color:#2c3e50; font-weight:bold; font-size:1.2em;">今回は全員の誕生日がバラバラでした。</span>`;
    }
    
    document.getElementById('result-text').innerHTML = resText;
}

// 1〜365の日数を日付（月/日）に変換する関数
function dayOfYearToDate(dayOfYear) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let month = 1;
    let day = dayOfYear;

    for (let i = 0; i < daysInMonth.length; i++) {
        if (day <= daysInMonth[i]) break;
        day -= daysInMonth[i];
        month++;
    }

    return `${month}/${day}`;
}