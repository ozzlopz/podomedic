export const SLOT_DURATION_MINUTES = 90;

export const weekdayTimeSlots = ["11:00", "12:30", "16:00", "17:30"];
export const saturdayTimeSlots = ["10:00", "11:30"];

export function getTimeSlotsForDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();

  if (day === 6) {
    return [...saturdayTimeSlots];
  }

  if (day === 0) {
    return [];
  }

  return [...weekdayTimeSlots];
}

export function isValidTimeSlot(dateValue: string, timeValue: string) {
  return getTimeSlotsForDate(dateValue).includes(timeValue);
}
