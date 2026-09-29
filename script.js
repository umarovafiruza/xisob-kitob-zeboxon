/**
 * Oilaviy Expense Tracker - Kirim, Chiqim va Oylik Arxiv bilan
 * Sof Vanilla JavaScript
 */
(function () {
  'use strict';

  // 1. DOIMIYLIK: LocalStorage Kalitlari
  const STORAGE_KEY = 'oilaviy_tracker_expenses_v1';
  const BUDGET_KEY = 'oilaviy_tracker_budget_v1';

  // Oylar nomlari
  const MONTH_NAMES = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];

  // Chiqim toifalari (Ota-onalar va oila uchun moslangan)
  const CATEGORIES_EXPENSE = [
    { name: "Ro'zg'or / Oziq-ovqat", key: "ro-zg-or" },
    { name: "Dorixona / Salomatlik", key: "dorixona" },
    { name: "Kommunal to'lovlar", key: "kommunal" },
    { name: "Transport / Yo'l", key: "transport" },
    { name: "Ta'lim / Kurslar", key: "ta-lim" },
    { name: "Ehson / To'y-marosim", key: "ehson" },
    { name: "Kredit / Qarz", key: "kredit" },
    { name: "Boshqa xarajatlar", key: "boshqa" }
  ];

  // Kirim toifalari (Daromad turlari)
  const CATEGORIES_INCOME = [
    { name: "Oylik maosh", key: "income" },
    { name: "Pensiya", key: "income" },
    { name: "Biznes / Savdo", key: "income" },
    { name: "Qo'shimcha daromad", key: "income" },
    { name: "Sovg'a / Yordam", key: "income" },
    { name: "Boshqa tushum", key: "income" }
  ];

  // Dastlabki namunaviy ma'lumotlar
  const DEFAULT_SAMPLE_DATA = [
    {
      id: 'tx_1',
      type: 'income',
      title: "Oylik maosh",
      amount: 6000000,
      category: "Oylik maosh",
      date: getTodayDateString()
    },
    {
      id: 'tx_2',
      type: 'expense',
      title: "Bozorlik (Go'sht, un, mevalar)",
      amount: 850000,
      category: "Ro'zg'or / Oziq-ovqat",
      date: getTodayDateString()
    },
    {
      id: 'tx_3',
      type: 'expense',
      title: "Dorixona (Dori va vitaminlar)",
      amount: 180000,
      category: "Dorixona / Salomatlik",
      date: getTodayDateString()
    },
    {
      id: 'tx_4',
      type: 'expense',
      title: "Kommunal to'lovlar",
      amount: 320000,
      category: "Kommunal to'lovlar",
      date: getTodayDateString()
    }
  ];

  // 2. DOM ELEMENTLARI
  // Oylik navigator
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  const currentMonthLabel = document.getElementById('currentMonthLabel');
  const btnTodayShortcut = document.getElementById('btnTodayShortcut');

  // Navigatsiya tablari
  const tabButtons = document.querySelectorAll('[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');
  const btnGoToHistory = document.getElementById('btnGoToHistory');
  const btnQuickAddExpense = document.getElementById('btnQuickAddExpense');
  const btnQuickAddIncome = document.getElementById('btnQuickAddIncome');
  const btnCopyReport = document.getElementById('btnCopyReport');

  // Asosiy ko'rsatkichlar
  const netBalanceDisplay = document.getElementById('netBalanceDisplay');
  const monthIncomeDisplay = document.getElementById('monthIncomeDisplay');
  const monthExpenseDisplay = document.getElementById('monthExpenseDisplay');
  const budgetProgressFill = document.getElementById('budgetProgressFill');
  const budgetPercentText = document.getElementById('budgetPercentText');
  const budgetPlanSubtext = document.getElementById('budgetPlanSubtext');

  // Byudjet modali
  const btnOpenBudgetModal = document.getElementById('btnOpenBudgetModal');
  const budgetModal = document.getElementById('budgetModal');
  const btnCloseBudgetModal = document.getElementById('btnCloseBudgetModal');
  const btnCancelBudgetModal = document.getElementById('btnCancelBudgetModal');
  const budgetForm = document.getElementById('budgetForm');
  const budgetInput = document.getElementById('budgetInput');

  // Forma
  const formHeaderTitle = document.getElementById('formHeaderTitle');
  const btnToggleExpense = document.getElementById('btnToggleExpense');
  const btnToggleIncome = document.getElementById('btnToggleIncome');
  const transactionForm = document.getElementById('transactionForm');
  const labelTxTitle = document.getElementById('labelTxTitle');
  const txTitle = document.getElementById('txTitle');
  const txAmount = document.getElementById('txAmount');
  const txDate = document.getElementById('txDate');
  const txCategory = document.getElementById('txCategory');
  const btnSubmitForm = document.getElementById('btnSubmitForm');
  const addSuccessToast = document.getElementById('addSuccessToast');
  const toastText = document.getElementById('toastText');

  // Ro'yxatlar
  const recentTransactionsList = document.getElementById('recentTransactionsList');
  const categoryBreakdownList = document.getElementById('categoryBreakdownList');
  const incomeSourcesList = document.getElementById('incomeSourcesList');
  const analyticsMonthBadge = document.getElementById('analyticsMonthBadge');

  // Tarix
  const expensesList = document.getElementById('expensesList');
  const historyCounter = document.getElementById('historyCounter');
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const checkOnlySelectedMonth = document.getElementById('checkOnlySelectedMonth');
  const filterScopeMonthText = document.getElementById('filterScopeMonthText');
  const emptyState = document.getElementById('emptyState');
  const btnClearAll = document.getElementById('btnClearAll');

  // 3. HOLAT (STATE)
  let transactions = loadTransactions();
  let monthlyBudget = loadBudget();
  let formMode = 'expense'; // 'expense' yoki 'income'
  let toastTimer = null;

  // Hozirgi tanlangan oy (0-indexed: 0 = Yanvar, 8 = Sentabr)
  const today = new Date();
  let activeYear = today.getFullYear();
  let activeMonth = today.getMonth();

  // Boshlang'ich yuklash
  init();

  function init() {
    updateMonthDisplay();
    setFormMode('expense');
    if (txDate) txDate.value = getTodayDateString();

    // Hodisalarni ulash
    btnPrevMonth.addEventListener('click', () => changeMonth(-1));
    btnNextMonth.addEventListener('click', () => changeMonth(1));
    btnTodayShortcut.addEventListener('click', resetToTodayMonth);

    // Tablar
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    if (btnGoToHistory) {
      btnGoToHistory.addEventListener('click', () => switchTab('tab-history'));
    }

    if (btnQuickAddExpense) {
      btnQuickAddExpense.addEventListener('click', () => {
        setFormMode('expense');
        switchTab('tab-add');
      });
    }

    if (btnQuickAddIncome) {
      btnQuickAddIncome.addEventListener('click', () => {
        setFormMode('income');
        switchTab('tab-add');
      });
    }

    // Forma rejimini almashtirish
    btnToggleExpense.addEventListener('click', () => setFormMode('expense'));
    btnToggleIncome.addEventListener('click', () => setFormMode('income'));

    // Forma saqlash
    transactionForm.addEventListener('submit', handleAddTransaction);

    // Tarix va o'chirish
    expensesList.addEventListener('click', handleDeleteTransaction);
    recentTransactionsList.addEventListener('click', handleDeleteTransaction);
    searchInput.addEventListener('input', renderHistory);
    filterType.addEventListener('change', renderHistory);
    checkOnlySelectedMonth.addEventListener('change', renderHistory);
    btnClearAll.addEventListener('click', handleClearAll);

    // Telegram hisobotini nusxalash
    btnCopyReport.addEventListener('click', handleCopyTelegramReport);

    // Byudjet modali
    btnOpenBudgetModal.addEventListener('click', openBudgetModal);
    btnCloseBudgetModal.addEventListener('click', closeBudgetModal);
    btnCancelBudgetModal.addEventListener('click', closeBudgetModal);
    budgetModal.addEventListener('click', (e) => {
      if (e.target === budgetModal) closeBudgetModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && budgetModal.style.display === 'flex') {
        closeBudgetModal();
      }
    });
    budgetForm.addEventListener('submit', handleSaveBudget);

    // Ekranni chizish
    renderAll();
  }

  // ========================================================
  // 4. OYLIK NAVIGATOR FUNKSIYALARI
  // ========================================================
  function changeMonth(delta) {
    activeMonth += delta;
    if (activeMonth < 0) {
      activeMonth = 11;
      activeYear -= 1;
    } else if (activeMonth > 11) {
      activeMonth = 0;
      activeYear += 1;
    }
    updateMonthDisplay();
    renderAll();
  }

  function resetToTodayMonth() {
    const now = new Date();
    activeYear = now.getFullYear();
    activeMonth = now.getMonth();
    updateMonthDisplay();
    renderAll();
  }

  function updateMonthDisplay() {
    const monthName = MONTH_NAMES[activeMonth];
    currentMonthLabel.textContent = `${monthName}, ${activeYear}`;
    if (analyticsMonthBadge) analyticsMonthBadge.textContent = monthName;
    if (filterScopeMonthText) filterScopeMonthText.textContent = monthName;

    const now = new Date();
    const isCurrent = (activeYear === now.getFullYear() && activeMonth === now.getMonth());
    btnTodayShortcut.style.display = isCurrent ? 'none' : 'inline-block';
  }

  function getActiveMonthPrefix() {
    return `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
  }

  // ========================================================
  // 5. TAB VA FORMA REJIMI
  // ========================================================
  function switchTab(tabId) {
    tabContents.forEach(c => {
      if (c.id === tabId) {
        c.classList.add('active');
        c.style.display = 'block';
      } else {
        c.classList.remove('active');
        c.style.display = 'none';
      }
    });

    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (tabId === 'tab-add' && txTitle) {
      setTimeout(() => txTitle.focus(), 100);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setFormMode(mode) {
    formMode = mode;
    txCategory.innerHTML = '';

    if (mode === 'expense') {
      btnToggleExpense.className = 'btn-type-toggle active-expense';
      btnToggleIncome.className = 'btn-type-toggle';
      formHeaderTitle.textContent = "Yangi xarajat kiritish";
      labelTxTitle.textContent = "Xarajat nomi";
      txTitle.placeholder = "Masalan: Bozorlik, Go'sht, Dorixona, Taxi...";
      btnSubmitForm.textContent = "Xarajatni saqlash";
      btnSubmitForm.className = "btn-submit-main btn-submit-expense";

      CATEGORIES_EXPENSE.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        txCategory.appendChild(opt);
      });
    } else {
      btnToggleIncome.className = 'btn-type-toggle active-income';
      btnToggleExpense.className = 'btn-type-toggle';
      formHeaderTitle.textContent = "Yangi daromad kiritish";
      labelTxTitle.textContent = "Daromad manbasi / nomi";
      txTitle.placeholder = "Masalan: Oylik maosh, Pensiya, Qo'shimcha daromad...";
      btnSubmitForm.textContent = "+ Daromadni saqlash";
      btnSubmitForm.className = "btn-submit-main btn-submit-income";

      CATEGORIES_INCOME.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        txCategory.appendChild(opt);
      });
    }
  }

  // ========================================================
  // 6. YORDAMCHI FUNKSIYALAR
  // ========================================================
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatCurrency(num) {
    if (num === null || num === undefined || isNaN(num)) return "0 so'm";
    const formatted = Math.round(Number(num))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} so'm`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  }

  function getCategoryKey(catName, type) {
    if (type === 'income') return 'income';
    const found = CATEGORIES_EXPENSE.find(c => c.name === catName);
    return found ? found.key : 'boshqa';
  }

  // ========================================================
  // 7. LOCALSTORAGE BILAN ISHLASH
  // ========================================================
  function loadTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const list = JSON.parse(data);
        // Eski ma'lumotlar uchun moslashtirish (type mavjud bo'lmasa 'expense')
        return list.map(item => ({
          id: item.id || ('tx_' + Math.random()),
          type: item.type || 'expense',
          title: item.title || "Xarajat",
          amount: parseFloat(item.amount) || 0,
          category: item.category || "Boshqa xarajatlar",
          date: item.date || getTodayDateString()
        }));
      }
    } catch (e) {
      console.error("LocalStorage xatosi:", e);
    }
    saveTransactions(DEFAULT_SAMPLE_DATA);
    return [...DEFAULT_SAMPLE_DATA];
  }

  function saveTransactions(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("LocalStorage saqlash xatosi:", e);
    }
  }

  function loadBudget() {
    try {
      const saved = localStorage.getItem(BUDGET_KEY);
      if (saved !== null && !isNaN(saved)) {
        return parseFloat(saved);
      }
    } catch (e) {
      console.error("Budget yuklash xatosi:", e);
    }
    return 5000000;
  }

  function saveBudget(val) {
    try {
      localStorage.setItem(BUDGET_KEY, val.toString());
    } catch (e) {
      console.error("Budget saqlash xatosi:", e);
    }
  }

  // ========================================================
  // 8. ASOSIY OPERATSIYALAR
  // ========================================================
  function handleAddTransaction(e) {
    e.preventDefault();

    const title = txTitle.value.trim();
    const amount = parseFloat(txAmount.value);
    const category = txCategory.value;
    const date = txDate.value || getTodayDateString();

    if (!title) {
      txTitle.focus();
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      txAmount.focus();
      return;
    }

    const newTx = {
      id: 'tx_' + Date.now(),
      type: formMode, // 'expense' yoki 'income'
      title,
      amount,
      category,
      date
    };

    transactions.unshift(newTx);
    saveTransactions(transactions);

    // Kiritilgan sana qaysi oyga tegishli bo'lsa, o'sha oyga o'tish
    const [y, m] = date.split('-');
    if (y && m) {
      activeYear = parseInt(y, 10);
      activeMonth = parseInt(m, 10) - 1;
      updateMonthDisplay();
    }

    // Formani tozalash
    txTitle.value = '';
    txAmount.value = '';
    txDate.value = getTodayDateString();

    // Muvaffaqiyat xabari
    showToast(formMode === 'income' ? "✓ Daromad muvaffaqiyatli saqlandi!" : "✓ Xarajat muvaffaqiyatli saqlandi!");

    renderAll();
  }

  function showToast(msg) {
    if (!addSuccessToast) return;
    toastText.textContent = msg;
    addSuccessToast.style.display = 'flex';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      addSuccessToast.style.display = 'none';
    }, 2800);
  }

  function handleDeleteTransaction(e) {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;

    const id = btn.getAttribute('data-id');
    if (!id) return;

    transactions = transactions.filter(item => item.id !== id);
    saveTransactions(transactions);
    renderAll();
  }

  function handleClearAll() {
    if (transactions.length === 0) {
      alert("Hozircha tozalash uchun ma'lumotlar mavjud emas.");
      return;
    }

    const confirmed = confirm("Barcha kiritilgan xarajat va daromadlar o'chirilsinmi? Bu amalni ortga qaytarib bo'lmaydi.");
    if (confirmed) {
      transactions = [];
      saveTransactions(transactions);
      renderAll();
    }
  }

  // ========================================================
  // 9. TELEGRAMGA OYLIK HISOBOTNI NUSXALASH
  // ========================================================
  function handleCopyTelegramReport() {
    const ymPrefix = getActiveMonthPrefix();
    const monthItems = transactions.filter(t => t.date && t.date.startsWith(ymPrefix));

    const totalIncome = monthItems.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = monthItems.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const net = totalIncome - totalExpense;
    const monthName = MONTH_NAMES[activeMonth];

    // Eng katta sarf qilingan toifa
    const catTotals = {};
    monthItems.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount || 0);
    });

    let topCat = "—";
    let topCatVal = 0;
    for (const [cat, sum] of Object.entries(catTotals)) {
      if (sum > topCatVal) {
        topCatVal = sum;
        topCat = cat;
      }
    }

    const reportText = 
`📊 Oilaviy Byudjet Hisoboti (${monthName}, ${activeYear})

🟢 Jami Kirim: +${formatCurrency(totalIncome)}
🔴 Jami Chiqim: -${formatCurrency(totalExpense)}
💰 Qolgan Sof Qoldiq: ${formatCurrency(net)}
${topCatVal > 0 ? `🏆 Eng ko'p sarf: ${topCat} (${formatCurrency(topCatVal)})` : ''}

📱 "Oilaviy Byudjet" orqali hisoblandi.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        alert("✓ Oylik hisobot nusxalandi! Endi uni Telegramdagi oilaviy guruhga osongina 'Vставить' (Paste) qilib yuborishingiz mumkin.");
      }).catch(() => {
        fallbackCopy(reportText);
      });
    } else {
      fallbackCopy(reportText);
    }
  }

  function fallbackCopy(text) {
    window.prompt("Hisobot matnini nusxalab oling:", text);
  }

  // ========================================================
  // 10. BYUDJET MODALI
  // ========================================================
  function openBudgetModal() {
    budgetInput.value = monthlyBudget;
    budgetModal.style.display = 'flex';
    budgetInput.focus();
  }

  function closeBudgetModal() {
    budgetModal.style.display = 'none';
  }

  function handleSaveBudget(e) {
    e.preventDefault();
    const val = parseFloat(budgetInput.value);
    if (isNaN(val) || val < 0) {
      budgetInput.focus();
      return;
    }
    monthlyBudget = val;
    saveBudget(monthlyBudget);
    closeBudgetModal();
    renderBudget();
  }

  // ========================================================
  // 11. INTERFEYSNI RENDER QILISH (OYMA-OY)
  // ========================================================
  function renderAll() {
    const ymPrefix = getActiveMonthPrefix();
    const monthItems = transactions.filter(t => t.date && t.date.startsWith(ymPrefix));

    renderOverview(monthItems);
    renderBudget(monthItems);
    renderRecentTransactions(monthItems);
    renderAnalytics(monthItems);
    renderHistory();
  }

  function renderOverview(monthItems) {
    const totalIncome = monthItems.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = monthItems.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const net = totalIncome - totalExpense;

    monthIncomeDisplay.textContent = `+ ${formatCurrency(totalIncome)}`;
    monthExpenseDisplay.textContent = `- ${formatCurrency(totalExpense)}`;

    netBalanceDisplay.textContent = formatCurrency(net);
    if (net < 0) {
      netBalanceDisplay.classList.add('is-negative');
    } else {
      netBalanceDisplay.classList.remove('is-negative');
    }
  }

  function renderBudget(monthItems) {
    const totalExpense = monthItems.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    let percent = 0;
    if (monthlyBudget > 0) {
      percent = Math.round((totalExpense / monthlyBudget) * 100);
    }

    budgetPercentText.textContent = `${percent}% ishlatildi (${formatCurrency(totalExpense)})`;
    budgetPlanSubtext.textContent = `Limit: ${formatCurrency(monthlyBudget)}`;

    budgetProgressFill.className = 'budget-progress-fill';
    budgetProgressFill.style.width = `${Math.min(percent, 100)}%`;

    if (percent >= 100) {
      budgetProgressFill.classList.add('fill-danger');
    } else if (percent >= 80) {
      budgetProgressFill.classList.add('fill-warning');
    } else {
      budgetProgressFill.classList.add('fill-safe');
    }
  }

  function renderRecentTransactions(monthItems) {
    recentTransactionsList.innerHTML = '';
    const itemsToShow = (monthItems.length > 0 ? monthItems : transactions).slice(0, 4);

    if (itemsToShow.length === 0) {
      recentTransactionsList.innerHTML = `
        <li style="text-align: center; padding: 18px 0; color: var(--text-muted); font-size: 13px;">
          Hozircha amallar kiritilmadi
        </li>
      `;
      return;
    }

    itemsToShow.forEach(item => {
      const isIncome = item.type === 'income';
      const catKey = getCategoryKey(item.category, item.type);
      const li = document.createElement('li');
      li.className = `expense-item ${isIncome ? 'is-income-item' : 'is-expense-item'}`;
      li.innerHTML = `
        <div class="expense-left">
          <div class="expense-name-row">
            <span class="expense-name">${escapeHtml(item.title)}</span>
            <span class="expense-badge badge-${catKey}">${escapeHtml(item.category)}</span>
          </div>
          <span class="expense-date">${formatDate(item.date)}</span>
        </div>
        <div class="expense-right">
          <span class="expense-amount ${isIncome ? 'text-income' : 'text-expense'}">
            ${isIncome ? '+' : '-'} ${formatCurrency(item.amount)}
          </span>
          <button type="button" class="btn-delete" data-id="${item.id}" title="O'chirish">
            ✕
          </button>
        </div>
      `;
      recentTransactionsList.appendChild(li);
    });
  }

  function renderAnalytics(monthItems) {
    categoryBreakdownList.innerHTML = '';
    incomeSourcesList.innerHTML = '';

    // Chiqimlar tahlili
    const expenseItems = monthItems.filter(t => t.type === 'expense');
    const totalExpense = expenseItems.reduce((s, t) => s + Number(t.amount || 0), 0);

    const expenseMap = {};
    CATEGORIES_EXPENSE.forEach(c => {
      expenseMap[c.name] = { total: 0, count: 0, key: c.key };
    });

    expenseItems.forEach(item => {
      if (!expenseMap[item.category]) {
        expenseMap[item.category] = { total: 0, count: 0, key: 'boshqa' };
      }
      expenseMap[item.category].total += Number(item.amount || 0);
      expenseMap[item.category].count += 1;
    });

    CATEGORIES_EXPENSE.forEach(cat => {
      const data = expenseMap[cat.name] || { total: 0, count: 0, key: cat.key };
      const percent = totalExpense > 0 ? Math.round((data.total / totalExpense) * 100) : 0;

      const itemEl = document.createElement('div');
      itemEl.className = 'category-item';
      itemEl.innerHTML = `
        <div class="category-header">
          <div class="category-name-wrap">
            <span class="category-dot color-${cat.key}"></span>
            <span class="category-name">${cat.name}</span>
          </div>
          <span class="category-sum">${formatCurrency(data.total)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill color-${cat.key}" style="width: ${percent}%;"></div>
        </div>
        <div class="category-meta">
          <span>${percent}% ulush</span>
          <span>${data.count} ta xarajat</span>
        </div>
      `;
      categoryBreakdownList.appendChild(itemEl);
    });

    // Kirimlar tahlili
    const incomeItems = monthItems.filter(t => t.type === 'income');
    const totalIncome = incomeItems.reduce((s, t) => s + Number(t.amount || 0), 0);

    const incomeMap = {};
    CATEGORIES_INCOME.forEach(c => {
      incomeMap[c.name] = { total: 0, count: 0 };
    });

    incomeItems.forEach(item => {
      if (!incomeMap[item.category]) {
        incomeMap[item.category] = { total: 0, count: 0 };
      }
      incomeMap[item.category].total += Number(item.amount || 0);
      incomeMap[item.category].count += 1;
    });

    CATEGORIES_INCOME.forEach(cat => {
      const data = incomeMap[cat.name] || { total: 0, count: 0 };
      if (data.total > 0 || incomeItems.length === 0) {
        const percent = totalIncome > 0 ? Math.round((data.total / totalIncome) * 100) : 0;
        const itemEl = document.createElement('div');
        itemEl.className = 'category-item';
        itemEl.innerHTML = `
          <div class="category-header">
            <div class="category-name-wrap">
              <span class="category-dot" style="background:#059669;"></span>
              <span class="category-name">${cat.name}</span>
            </div>
            <span class="category-sum" style="color:#059669;">+ ${formatCurrency(data.total)}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percent}%; background:#059669;"></div>
          </div>
          <div class="category-meta">
            <span>${percent}% jami kirimdan</span>
            <span>${data.count} ta tushum</span>
          </div>
        `;
        incomeSourcesList.appendChild(itemEl);
      }
    });
  }

  function renderHistory() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedType = filterType ? filterType.value : 'all';
    const onlyMonth = checkOnlySelectedMonth ? checkOnlySelectedMonth.checked : true;
    const ymPrefix = getActiveMonthPrefix();

    const filtered = transactions.filter(item => {
      const matchQuery = !query || item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      const matchType = (selectedType === 'all') || (item.type === selectedType);
      const matchMonth = !onlyMonth || (item.date && item.date.startsWith(ymPrefix));
      return matchQuery && matchType && matchMonth;
    });

    historyCounter.textContent = `${filtered.length} ta`;
    expensesList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';

      filtered.forEach(item => {
        const isIncome = item.type === 'income';
        const catKey = getCategoryKey(item.category, item.type);
        const li = document.createElement('li');
        li.className = `expense-item ${isIncome ? 'is-income-item' : 'is-expense-item'}`;
        li.innerHTML = `
          <div class="expense-left">
            <div class="expense-name-row">
              <span class="expense-name">${escapeHtml(item.title)}</span>
              <span class="expense-badge badge-${catKey}">${escapeHtml(item.category)}</span>
            </div>
            <span class="expense-date">${formatDate(item.date)}</span>
          </div>
          <div class="expense-right">
            <span class="expense-amount ${isIncome ? 'text-income' : 'text-expense'}">
              ${isIncome ? '+' : '-'} ${formatCurrency(item.amount)}
            </span>
            <button type="button" class="btn-delete" data-id="${item.id}" title="O'chirish">
              ✕
            </button>
          </div>
        `;
        expensesList.appendChild(li);
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();
