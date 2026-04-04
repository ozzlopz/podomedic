export const SLOT_DURATION_MINUTES = 90;

export const weekdayTimeSlots = ['11:00', '12:30', '16:00', '17:30'];
export const saturdayTimeSlots = ['10:00', '11:30'];

export function getTimeSlotsForDay(day: number) {
  if (day === 6) {
    return [...saturdayTimeSlots];
  }

  if (day === 0) {
    return [];
  }

  return [...weekdayTimeSlots];
}

export function normalizeDateValue(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function extractScheduledDateAndTime(entry: {
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledAt?: { seconds?: number };
}) {
  if (entry.scheduledDate && entry.scheduledTime) {
    return {
      date: entry.scheduledDate,
      time: entry.scheduledTime,
    };
  }

  if (entry.scheduledAt?.seconds) {
    const date = new Date(entry.scheduledAt.seconds * 1000);
    return {
      date: formatDateValue(date),
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    };
  }

  return {
    date: '',
    time: '',
  };
}
