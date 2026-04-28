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

// Supabase Configuration
const SUPABASE_URL = 'https://mpxfzdyqchqhlzhaugtz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGZ6ZHlxY2hxaGx6aGF1Z3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTgxMDMsImV4cCI6MjA5MjkzNDEwM30.508lmdomO_ET0RdgcJgEpk_EZGeEms-Jo7znH4gQWA4';
let supabaseClient;

// Global error logger for debugging on live site
window.onerror = function(msg, url, lineNo, columnNo, error) {
    alert('오류 발생: ' + msg + '\n위치: ' + lineNo + ':' + columnNo);
    return false;
};

try {
    if (typeof supabase === 'undefined') {
        alert('Supabase 라이브러리가 로드되지 않았습니다. 인터넷 연결이나 CDN 설정을 확인해주세요.');
    } else {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false // 추적 방지 기능으로 인한 차단을 피하기 위해 세션 저장 기능을 끕니다.
            }
        });
    }
} catch (e) {
    alert('Supabase 초기화 실패: ' + e.message);
}

let currentDate = new Date();
let viewDate = new Date(); // Date used for viewing in calendar modal
let allMemos = []; // Now stores only the memos for the current date fetched from Supabase

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
// Removed saveMemos since we use Supabase now

async function addMemo() {
    const text = memoInput.value.trim();
    if (text === '') return;

    const dateKey = getDateKey(currentDate);
    const newMemo = {
        text: text,
        completed: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date_key: dateKey
    };

    const { error } = await supabaseClient
        .from('memos')
        .insert([newMemo]);

    if (error) {
        console.error('Error adding memo:', error);
        alert('메모 추가 실패: ' + error.message);
        return;
    }

    memoInput.value = '';
    await renderMemos();
}

async function toggleMemo(id, currentStatus) {
    const { error } = await supabaseClient
        .from('memos')
        .update({ completed: !currentStatus })
        .eq('id', id);

    if (error) {
        console.error('Error toggling memo:', error);
        alert('상태 변경 실패: ' + error.message);
        return;
    }
    await renderMemos();
}

async function deleteMemo(id) {
    const { error } = await supabaseClient
        .from('memos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting memo:', error);
        alert('삭제 실패: ' + error.message);
        return;
    }
    await renderMemos();
}

async function editMemo(id, liElement, originalText) {
    const body = liElement.querySelector('.memo-body');
    
    body.innerHTML = `<input type="text" class="edit-input" value="${originalText}">`;
    const input = body.querySelector('input');
    input.focus();
    
    const finishEdit = async () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            const { error } = await supabaseClient
                .from('memos')
                .update({ text: newText })
                .eq('id', id);
            
            if (error) {
                console.error('Error updating memo:', error);
                alert('수정 실패: ' + error.message);
            }
        }
        await renderMemos();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') finishEdit();
    });
}

async function renderMemos() {
    const dateKey = getDateKey(currentDate);
    
    const { data: todayMemos, error } = await supabaseClient
        .from('memos')
        .select('*')
        .eq('date_key', dateKey)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching memos:', error);
        alert('데이터 로드 실패: ' + error.message);
        return;
    }
    
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

        li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleMemo(memo.id, memo.completed));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteMemo(memo.id));
        li.querySelector('.edit-btn').addEventListener('click', () => editMemo(memo.id, li, memo.text));
        
        memoList.appendChild(li);
    });
}

addBtn.addEventListener('click', addMemo);
memoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addMemo();
});

// Initialize
updateDateDisplay();
