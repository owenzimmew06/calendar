document.addEventListener('DOMContentLoaded', () => {
    const daysGrid = document.getElementById('daysGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const eventDetails = document.getElementById('eventDetails');
    const selectedDateText = document.getElementById('selectedDateText');
    const eventsList = document.getElementById('eventsList');
    const addEventBtn = document.getElementById('addEventBtn');

    const eventModal = document.getElementById('eventModal');
    const closeButton = document.querySelector('.close-button');
    const eventForm = document.getElementById('eventForm');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventTimeInput = document.getElementById('eventTime');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const eventDateInput = document.getElementById('eventDate'); // Hidden input for selected date
    const eventIdInput = document.getElementById('eventId'); // Hidden input for event ID (for editing)

    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let selectedDay = today.getDate(); // Keep track of the selected day
    let selectedDate = new Date(currentYear, currentMonth, selectedDay);

    // Store events in a simple object where keys are YYYY-MM-DD
    // Example: { '2023-10-26': [{id: '...', title: 'Meeting', time: '10:00', description: '...'}] }
    let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function renderCalendar() {
        daysGrid.innerHTML = ''; // Clear previous days
        currentMonthYear.textContent = `${months[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('day', 'empty');
            daysGrid.appendChild(emptyDiv);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');
            dayDiv.textContent = i;

            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && i === today.getDate()) {
                dayDiv.classList.add('today');
            }
            if (currentYear === selectedDate.getFullYear() && currentMonth === selectedDate.getMonth() && i === selectedDate.getDate()) {
                dayDiv.classList.add('selected');
            }
            if (events[dateKey] && events[dateKey].length > 0) {
                dayDiv.classList.add('has-event');
            }

            dayDiv.dataset.date = dateKey; // Store the full date for easy access

            dayDiv.addEventListener('click', () => {
                selectDay(i);
            });

            daysGrid.appendChild(dayDiv);
        }
        renderEventsForSelectedDate();
    }

    function selectDay(day) {
        // Remove 'selected' class from previously selected day
        const previouslySelected = document.querySelector('.day.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        selectedDay = day;
        selectedDate = new Date(currentYear, currentMonth, selectedDay);

        // Add 'selected' class to the newly selected day
        const currentSelected = document.querySelector(`.day[data-date="${formatDate(selectedDate)}"]`);
        if (currentSelected) {
            currentSelected.classList.add('selected');
        } else {
            // This case can happen if the selected day is not in the current month view
            // In that case, we might want to re-render the calendar or just update event details
            // For now, let's ensure the calendar re-renders if we jump to a new month/year
            renderCalendar();
            const newSelected = document.querySelector(`.day[data-date="${formatDate(selectedDate)}"]`);
            if (newSelected) {
                newSelected.classList.add('selected');
            }
        }
        renderEventsForSelectedDate();
    }

    function renderEventsForSelectedDate() {
        const dateKey = formatDate(selectedDate);
        selectedDateText.textContent = `(${formatDateString(selectedDate)})`;
        eventsList.innerHTML = ''; // Clear previous events

        const dayEvents = events[dateKey] || [];

        if (dayEvents.length === 0) {
            eventsList.innerHTML = '<p class="no-events">No events for this day.</p>';
        } else {
            dayEvents.sort((a, b) => a.time.localeCompare(b.time)); // Sort events by time
            dayEvents.forEach(event => {
                const eventItem = document.createElement('div');
                eventItem.classList.add('event-item');
                eventItem.innerHTML = `
                    <div class="event-info">
                        <h4>${event.title}</h4>
                        <p>${event.time} - ${event.description}</p>
                    </div>
                    <div class="event-actions">
                        <button class="edit-btn" data-id="${event.id}">✏️</button>
                        <button class="delete-btn" data-id="${event.id}">🗑️</button>
                    </div>
                `;
                eventsList.appendChild(eventItem);
            });
        }
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateString(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Event Handlers
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    addEventBtn.addEventListener('click', () => {
        eventModal.style.display = 'flex';
        eventForm.reset();
        eventDateInput.value = formatDate(selectedDate);
        eventIdInput.value = ''; // Clear ID for new event
        eventTitleInput.focus();
    });

    closeButton.addEventListener('click', () => {
        eventModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === eventModal) {
            eventModal.style.display = 'none';
        }
    });

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = eventTitleInput.value;
        const time = eventTimeInput.value || 'All Day';
        const description = eventDescriptionInput.value;
        const dateKey = eventDateInput.value;
        const existingEventId = eventIdInput.value;

        if (!title) {
            alert('Event title is required!');
            return;
        }

        if (!events[dateKey]) {
            events[dateKey] = [];
        }

        if (existingEventId) {
            // Edit existing event
            events[dateKey] = events[dateKey].map(event =>
                event.id === existingEventId ? { ...event, title, time, description } : event
            );
        } else {
            // Add new event
            const newEvent = {
                id: Date.now().toString(), // Simple unique ID
                title,
                time,
                description
            };
            events[dateKey].push(newEvent);
        }

        localStorage.setItem('calendarEvents', JSON.stringify(events));
        eventModal.style.display = 'none';
        renderCalendar(); // Re-render to update event dots
        renderEventsForSelectedDate();
    });

    // Event delegation for edit and delete buttons
    eventsList.addEventListener('click', (e) => {
        const eventId = e.target.dataset.id;
        const dateKey = formatDate(selectedDate);

        if (e.target.classList.contains('edit-btn')) {
            const eventToEdit = events[dateKey].find(event => event.id === eventId);
            if (eventToEdit) {
                eventTitleInput.value = eventToEdit.title;
                eventTimeInput.value = eventToEdit.time === 'All Day' ? '' : eventToEdit.time;
                eventDescriptionInput.value = eventToEdit.description;
                eventDateInput.value = dateKey;
                eventIdInput.value = eventToEdit.id; // Set ID for editing
                eventModal.style.display = 'flex';
            }
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this event?')) {
                events[dateKey] = events[dateKey].filter(event => event.id !== eventId);
                if (events[dateKey].length === 0) {
                    delete events[dateKey]; // Remove date key if no events left
                }
                localStorage.setItem('calendarEvents', JSON.stringify(events));
                renderCalendar(); // Re-render to update event dots
                renderEventsForSelectedDate();
            }
        }
    });

    // Initial render
    renderCalendar();
    selectDay(today.getDate()); // Select today's date by default
});
