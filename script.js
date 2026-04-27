const dateDisplay = document.getElementById('date-display');
const dateText = document.getElementById('date-text');
const prevDayBtn = document.getElementById('prev-day');
const nextDayBtn = document.getElementById('next-day');
const memoInput = document.getElementById('memo-input');
const addBtn = document.getElementById('add-btn');
const memoList = document.getElementById('memo-list');
const emptyMsg = document.getElementById('empty-msg');

// Calendar Modal elements
const calendarModal = document.getElementById('calendar-modal');
const calMonthYear = document.getElementById('cal-month-year');
const calPrevBtn = document.getElementById('cal-prev-month');
const calNextBtn = document.getElementById('cal-next-month');
const calDaysContainer = document.getElementById('calendar-days');

let currentDate = new Date();
let viewDate = new Date(); // Date used for viewing in calendar modal
let allMemos = JSON.parse(localStorage.getItem('serene-notes-data')) || {};

// --- Date Logic ---
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekdays[date.getDay()];
    return `${year}. ${month}. ${day} (${weekDay})`;
}

function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function updateDateDisplay() {
    dateText.innerText = formatDate(currentDate);
    renderMemos();
}

prevDayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentDate.setDate(currentDate.getDate() - 1);
    updateDateDisplay();
    closeCalendar();
});

nextDayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateDisplay();
    closeCalendar();
});

// --- Calendar Modal Logic ---
dateDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    if (calendarModal.classList.contains('active')) {
        closeCalendar();
    } else {
        openCalendar();
    }
});

function openCalendar() {
    viewDate = new Date(currentDate);
    renderCalendar();
    calendarModal.classList.add('active');
}

function closeCalendar() {
    calendarModal.classList.remove('active');
}

function renderCalendar() {
    calDaysContainer.innerHTML = '';
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    calMonthYear.innerText = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Empty days before first day of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calDaysContainer.appendChild(emptyDiv);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.innerText = day;

        const dayDate = new Date(year, month, day);
        
        if (dayDate.getDay() === 0) dayDiv.classList.add('sunday');
        if (getDateKey(dayDate) === getDateKey(today)) dayDiv.classList.add('today');
        if (getDateKey(dayDate) === getDateKey(currentDate)) dayDiv.classList.add('selected');

        dayDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate = new Date(year, month, day);
            updateDateDisplay();
            closeCalendar();
        });

        calDaysContainer.appendChild(dayDiv);
    }
}

calPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
});

calNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
});

// Close calendar on click outside
document.addEventListener('click', () => {
    closeCalendar();
});

calendarModal.addEventListener('click', (e) => {
    e.stopPropagation();
});

// --- Memo Logic ---
function saveMemos() {
    localStorage.setItem('serene-notes-data', JSON.stringify(allMemos));
}

function addMemo() {
    const text = memoInput.value.trim();
    if (text === '') return;

    const dateKey = getDateKey(currentDate);
    if (!allMemos[dateKey]) allMemos[dateKey] = [];

    const newMemo = {
        id: Date.now(),
        text: text,
        completed: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    allMemos[dateKey].unshift(newMemo);
    saveMemos();
    memoInput.value = '';
    renderMemos();
}

function toggleMemo(id) {
    const dateKey = getDateKey(currentDate);
    const memo = allMemos[dateKey].find(m => m.id === id);
    if (memo) {
        memo.completed = !memo.completed;
        saveMemos();
        renderMemos();
    }
}

function deleteMemo(id) {
    const dateKey = getDateKey(currentDate);
    allMemos[dateKey] = allMemos[dateKey].filter(m => m.id !== id);
    saveMemos();
    renderMemos();
}

function editMemo(id, liElement) {
    const dateKey = getDateKey(currentDate);
    const memo = allMemos[dateKey].find(m => m.id === id);
    const body = liElement.querySelector('.memo-body');
    const originalText = memo.text;
    
    body.innerHTML = `<input type="text" class="edit-input" value="${originalText}">`;
    const input = body.querySelector('input');
    input.focus();
    
    const finishEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            memo.text = newText;
            saveMemos();
        }
        renderMemos();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') finishEdit();
    });
}

function renderMemos() {
    const dateKey = getDateKey(currentDate);
    const todayMemos = allMemos[dateKey] || [];
    
    memoList.innerHTML = '';
    emptyMsg.style.display = todayMemos.length === 0 ? 'block' : 'none';

    todayMemos.forEach(memo => {
        const li = document.createElement('li');
        if (memo.completed) li.classList.add('completed');
        
        li.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${memo.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
            <div class="memo-body">
                <span class="memo-text">${memo.text}</span>
                <span class="memo-time">${memo.time}</span>
            </div>
            <div class="actions">
                <button class="action-btn edit-btn" title="수정">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                </button>
                <button class="action-btn delete-btn" title="삭제">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;

        li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleMemo(memo.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteMemo(memo.id));
        li.querySelector('.edit-btn').addEventListener('click', () => editMemo(memo.id, li));
        
        memoList.appendChild(li);
    });
}

addBtn.addEventListener('click', addMemo);
memoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addMemo();
});

// Initialize
updateDateDisplay();
