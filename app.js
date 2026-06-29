(() => {
  const STORAGE_KEY = 'rescueDogHomePlanLuxe2026';
  const HOME_DATE = new Date('2026-07-12T09:00:00');
  const state = loadState();
  let toastTimer;

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { fields: {}, tasks: {}, costs: {}, logs: [] };
    } catch {
      return { fields: {}, tasks: {}, costs: {}, logs: [] };
    }
  }

  function saveState(showMessage = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (showMessage) showToast('已儲存在這台裝置');
    } catch {
      showToast('瀏覽器無法儲存資料，請使用匯出備份');
    }
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function initSavedFields() {
    document.querySelectorAll('[data-save]').forEach(input => {
      const key = input.dataset.save;
      if (Object.prototype.hasOwnProperty.call(state.fields, key)) input.value = state.fields[key];
      input.addEventListener('input', () => {
        state.fields[key] = input.value;
        syncEmergencyField(key, input.value);
        updateBudget();
        saveState();
      });
    });
    syncEmergencyField('dogName', state.fields.dogName || '');
    syncEmergencyField('microchip', state.fields.microchip || '');
  }

  function syncEmergencyField(key, value) {
    const map = { dogName: 'emergencyDogName', microchip: 'emergencyChip' };
    const targetKey = map[key];
    if (!targetKey || state.fields[targetKey]) return;
    const target = document.querySelector(`[data-save="${targetKey}"]`);
    if (target) target.value = value;
  }

  function initTasks() {
    document.querySelectorAll('.task-check').forEach(check => {
      const key = check.dataset.task;
      check.checked = Boolean(state.tasks[key]);
      check.addEventListener('change', () => {
        state.tasks[key] = check.checked;
        saveState();
        updateProgress();
      });
    });
    updateProgress();
  }

  function updateProgress() {
    const checks = [...document.querySelectorAll('.task-check')];
    const checked = checks.filter(item => item.checked).length;
    const total = checks.length;
    const percent = total ? Math.round((checked / total) * 100) : 0;
    const ring = document.getElementById('progressRing');
    ring.style.setProperty('--p', percent);
    ring.setAttribute('aria-label', `整體完成度 ${percent}%`);
    document.getElementById('progressNumber').textContent = `${percent}%`;
    document.getElementById('checkedCount').textContent = checked;
    document.getElementById('remainingCount').textContent = total - checked;
  }

  function initCosts() {
    document.querySelectorAll('.cost-input').forEach(input => {
      const key = input.dataset.cost;
      if (Object.prototype.hasOwnProperty.call(state.costs, key)) input.value = state.costs[key];
      input.addEventListener('input', () => {
        state.costs[key] = input.value;
        saveState();
        updateBudget();
      });
    });
    updateBudget();
  }

  function updateBudget() {
    const total = Object.values(state.costs).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const formatted = new Intl.NumberFormat('zh-Hant').format(total);
    const currency = state.fields.currency?.trim() || '金額';
    document.getElementById('budgetTotal').textContent = formatted;
    document.getElementById('budgetDisplay').textContent = formatted;
    document.getElementById('currencyLabel').textContent = currency;
  }

  function updateDateInfo() {
    const now = new Date();
    const delta = HOME_DATE - now;
    const countdown = document.getElementById('countdownValue');
    const hint = document.getElementById('phaseHint');
    const title = document.getElementById('todayTitle');
    const text = document.getElementById('todayText');

    if (delta > 0) {
      const days = Math.ceil(delta / 86400000);
      countdown.textContent = `${days} 天`;
      hint.textContent = '現在最重要的是防走失、醫療預約與安靜空間';
      title.textContent = '接回前準備期';
      text.textContent = '完成獸醫預約、居家防逃、雙點固定、原食物與家庭共同規則。';
      return;
    }

    const daysHome = Math.floor(Math.abs(delta) / 86400000);
    countdown.textContent = daysHome === 0 ? '今天回家' : `回家第 ${daysHome + 1} 天`;
    if (daysHome <= 2) {
      hint.textContent = '減壓、睡眠、飲水、排泄與健康觀察';
      title.textContent = '前 72 小時';
      text.textContent = '不要測試服從或安排社交，只維持簡單動線與可預測作息。';
    } else if (daysHome <= 13) {
      hint.textContent = '建立規律與低壓力的基礎能力';
      title.textContent = '第 1-2 週';
      text.textContent = '練如廁、名字、碰手、墊子與數秒鐘獨處，散步以嗅聞為主。';
    } else if (daysHome <= 27) {
      hint.textContent = '慢慢擴大生活半徑';
      title.textContent = '第 3-4 週';
      text.textContent = '一次只增加一種難度，開始合作照護和低強度訪客練習。';
    } else {
      hint.textContent = '把技能帶到更多日常情境';
      title.textContent = '第 2-3 個月與長期';
      text.textContent = '依健康與情緒增加運動、獨處與環境泛化，持續追蹤體態和行為。';
    }
  }

  function initTabs() {
    const tabs = [...document.querySelectorAll('.phase-tab')];
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(item => {
          const active = item === tab;
          item.classList.toggle('active', active);
          item.setAttribute('aria-selected', String(active));
        });
        document.querySelectorAll('.phase-panel').forEach(panel => {
          const active = panel.id === tab.dataset.phase;
          panel.classList.toggle('active', active);
          panel.hidden = !active;
        });
      });
    });
  }

  function initLogs() {
    const form = document.getElementById('logForm');
    const dateInput = document.getElementById('logDate');
    dateInput.value = new Date().toISOString().slice(0, 10);

    form.addEventListener('submit', event => {
      event.preventDefault();
      state.logs.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: dateInput.value,
        appetite: document.getElementById('logAppetite').value,
        stool: document.getElementById('logStool').value,
        mood: document.getElementById('logMood').value,
        notes: document.getElementById('logNotes').value.trim()
      });
      document.getElementById('logNotes').value = '';
      saveState();
      renderLogs();
      showToast('觀察紀錄已新增');
    });

    document.getElementById('downloadLogButton').addEventListener('click', downloadLogs);
    renderLogs();
  }

  function renderLogs() {
    const body = document.getElementById('logTableBody');
    if (!state.logs.length) {
      body.innerHTML = '<tr><td colspan="6">尚無紀錄</td></tr>';
      return;
    }
    body.innerHTML = state.logs.map(log => `
      <tr>
        <td>${escapeHtml(log.date)}</td>
        <td>${escapeHtml(log.appetite)}</td>
        <td>${escapeHtml(log.stool)}</td>
        <td>${escapeHtml(log.mood)}</td>
        <td>${escapeHtml(log.notes || '-')}</td>
        <td><button class="delete-log" type="button" data-delete-log="${escapeHtml(log.id)}">刪除</button></td>
      </tr>`).join('');
    body.querySelectorAll('[data-delete-log]').forEach(button => {
      button.addEventListener('click', () => {
        state.logs = state.logs.filter(log => log.id !== button.dataset.deleteLog);
        saveState();
        renderLogs();
      });
    });
  }

  function downloadLogs() {
    if (!state.logs.length) return showToast('目前沒有可下載的觀察紀錄');
    const rows = [['日期', '食慾', '糞便', '情緒', '備註'], ...state.logs.map(log => [log.date, log.appetite, log.stool, log.mood, log.notes])];
    const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    downloadBlob(csv, '狗狗每日觀察紀錄.csv', 'text/csv;charset=utf-8');
  }

  function initQuiz() {
    document.getElementById('quizForm').addEventListener('submit', event => {
      event.preventDefault();
      const answers = { q1: 'b', q2: 'c', q3: 'b', q4: 'b' };
      const explanations = {
        q1: '室內失誤通常表示管理與帶出時機需要調整；事後責罵無法教會正確地點。',
        q2: '拒食加上僵硬是壓力升高訊號，應立刻增加距離。',
        q3: '這些可能是分離或禁閉相關焦慮，必須降低難度並讓專業人員評估。',
        q4: '短回合、高成功率，且一次只增加一種難度，最容易維持安全感。'
      };
      const form = new FormData(event.target);
      let score = 0;
      const notes = [];
      Object.entries(answers).forEach(([key, correct]) => {
        const selected = form.get(key);
        if (selected === correct) score += 1;
        else notes.push(explanations[key]);
      });
      const result = document.getElementById('quizResult');
      result.hidden = false;
      result.innerHTML = `<strong>答對 ${score}/4 題。</strong>${notes.length ? `<p>${notes.map(item => `• ${escapeHtml(item)}`).join('<br>')}</p>` : '<p>你已掌握核心原則：先降低壓力，再用獎勵教會可替代的行為。</p>'}`;
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function initUtilities() {
    const menuButton = document.getElementById('menuButton');
    const nav = document.getElementById('mainNav');
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));

    document.getElementById('printButton').addEventListener('click', () => window.print());
    document.getElementById('printEmergencyButton').addEventListener('click', () => {
      document.body.classList.add('print-emergency');
      window.print();
      setTimeout(() => document.body.classList.remove('print-emergency'), 300);
    });

    document.getElementById('exportButton').addEventListener('click', () => {
      const content = JSON.stringify({ exportedAt: new Date().toISOString(), ...state }, null, 2);
      downloadBlob(content, '流浪犬迎家計畫-進度備份.json', 'application/json');
    });

    document.getElementById('resetButton').addEventListener('click', () => {
      if (!confirm('確定要清除這台裝置上的所有勾選、金額、檔案與觀察紀錄嗎？')) return;
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
  }

  initSavedFields();
  initTasks();
  initCosts();
  initTabs();
  initLogs();
  initQuiz();
  initUtilities();
  updateDateInfo();
})();
