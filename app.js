let rawData = [];
let currentMode = 'class'; // 'class' | 'teacher' | 'room'
let selectedItem = '';

// 初始化：載入 JSON 資料
fetch('schedule.json')
  .then(res => res.json())
  .then(data => {
    rawData = data;
    updateStats();
    renderSidebar();
  });

// 切換 Tab
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentMode = e.target.dataset.mode;
    selectedItem = '';
    renderSidebar();
    renderSchedule();
  });
});

// 搜尋過濾
document.getElementById('search-input').addEventListener('input', (e) => {
  renderSidebar(e.target.value);
});

// 更新上方統計資訊
function updateStats() {
  const teachers = new Set(rawData.map(d => d.teacher_name)).size;
  const classes = new Set(rawData.map(d => d.class_name)).size;
  document.getElementById('stats-info').innerText = `收錄 ${classes} 個班級・${teachers} 位教師`;
}

// 取得當前模式的所有唯一選單項目
function getUniqueItems() {
  let set = new Set();
  rawData.forEach(d => {
    if (currentMode === 'class' && d.class_name) set.add(d.class_name);
    if (currentMode === 'teacher' && d.teacher_name) set.add(d.teacher_name);
    if (currentMode === 'room' && d.room) set.add(d.room);
  });
  return Array.from(set).sort();
}

// 渲染側邊欄清單
function renderSidebar(filterText = '') {
  const container = document.getElementById('sidebar-list');
  container.innerHTML = '';
  const items = getUniqueItems().filter(item => item.includes(filterText));

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = `item-btn ${item === selectedItem ? 'active' : ''}`;
    btn.innerText = item;
    btn.onclick = () => {
      selectedItem = item;
      renderSidebar(filterText);
      renderSchedule();
    };
    container.appendChild(btn);
  });
}

// 渲染課表
function renderSchedule() {
  const titleEl = document.getElementById('current-title');
  const tbody = document.getElementById('schedule-body');
  tbody.innerHTML = '';

  if (!selectedItem) {
    titleEl.innerText = '請選擇查詢項目';
    return;
  }

  titleEl.innerText = `${selectedItem} 的課表`;

  // 篩選出選取項目的所有課程
  const filtered = rawData.filter(d => {
    if (currentMode === 'class') return d.class_name === selectedItem;
    if (currentMode === 'teacher') return d.teacher_name === selectedItem;
    if (currentMode === 'room') return d.room === selectedItem;
  });

  // 建立 1~8 節與星期 1~5 的二維網格
  for (let period = 1; period <= 8; period++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>第 ${period} 節</td>`;

    for (let day = 1; day <= 5; day++) {
      const match = filtered.find(d => d.day === day && d.period === period);
      const td = document.createElement('td');

      if (match) {
        let subLink = '';
        if (currentMode === 'class') {
          subLink = `<span class="cell-link" onclick="jumpTo('teacher', '${match.teacher_name}')">${match.teacher_name}</span>`;
          if(match.room) subLink += `<span class="cell-link" onclick="jumpTo('room', '${match.room}')">${match.room}</span>`;
        } else if (currentMode === 'teacher') {
          subLink = `<span class="cell-link" onclick="jumpTo('class', '${match.class_name}')">${match.class_name}</span>`;
        } else {
          subLink = `<span class="cell-link" onclick="jumpTo('class', '${match.class_name}')">${match.class_name}</span>
                     <span class="cell-link" onclick="jumpTo('teacher', '${match.teacher_name}')">${match.teacher_name}</span>`;
        }

        td.innerHTML = `<div class="cell-subject">${match.subject}</div>${subLink}`;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

// 點擊課表內連結時直接跳轉模式與選取對象
function jumpTo(mode, target) {
  currentMode = mode;
  selectedItem = target;
  
  // 更新 Tab UI
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  renderSidebar();
  renderSchedule();
}