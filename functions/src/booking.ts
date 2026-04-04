export const SLOT_DURATION_MINUTES = 90;

export type TimeRange = {
  startTime: string;
  endTime: string;
};

export type DaySchedule = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

export type WeeklySchedule = Record<string, DaySchedule>;

export const weekDayKeys = ["0", "1", "2", "3", "4", "5", "6"] as const;

export const defaultWeeklySchedule: WeeklySchedule = {
  "0": { enabled: false, openTime: "10:00", closeTime: "14:00" },
  "1": { enabled: true, openTime: "11:00", closeTime: "19:00" },
  "2": { enabled: true, openTime: "11:00", closeTime: "19:00" },
  "3": { enabled: true, openTime: "11:00", closeTime: "19:00" },
  "4": { enabled: true, openTime: "11:00", closeTime: "19:00" },
  "5": { enabled: true, openTime: "11:00", closeTime: "19:00" },
  "6": { enabled: true, openTime: "10:00", closeTime: "14:00" },
};

export function mergeWeeklySchedule(schedule?: Partial<WeeklySchedule> | null): WeeklySchedule {
  return weekDayKeys.reduce<WeeklySchedule>((accumulator, dayKey) => {
    const current = schedule?.[dayKey];

    accumulator[dayKey] = {
      enabled: current?.enabled ?? defaultWeeklySchedule[dayKey].enabled,
      openTime: current?.openTime ?? defaultWeeklySchedule[dayKey].openTime,
      closeTime: current?.closeTime ?? defaultWeeklySchedule[dayKey].closeTime,
    };

    return accumulator;
  }, {} as WeeklySchedule);
}

export function getWorkingRangesForDate(dateValue: string, schedule?: Partial<WeeklySchedule> | null): TimeRange[] {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();
  const normalizedSchedule = mergeWeeklySchedule(schedule);
  const dayConfig = normalizedSchedule[String(day)];

  if (!dayConfig?.enabled) {
    return [];
  }

  return [{ startTime: dayConfig.openTime, endTime: dayConfig.closeTime }];
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addMinutesToTime(time: string, durationMinutes: number) {
  return minutesToTime(timeToMinutes(time) + durationMinutes);
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const startAMinutes = timeToMinutes(startA);
  const endAMinutes = timeToMinutes(endA);
  const startBMinutes = timeToMinutes(startB);
  const endBMinutes = timeToMinutes(endB);

  if ([startAMinutes, endAMinutes, startBMinutes, endBMinutes].some((value) => Number.isNaN(value))) {
    return false;
  }

  return startAMinutes < endBMinutes && startBMinutes < endAMinutes;
}

function subtractRange(window: TimeRange, exclusion: TimeRange) {
  if (!rangesOverlap(window.startTime, window.endTime, exclusion.startTime, exclusion.endTime)) {
    return [window];
  }

  const result: TimeRange[] = [];

  if (timeToMinutes(exclusion.startTime) > timeToMinutes(window.startTime)) {
    result.push({
      startTime: window.startTime,
      endTime: exclusion.startTime,
    });
  }

  if (timeToMinutes(exclusion.endTime) < timeToMinutes(window.endTime)) {
    result.push({
      startTime: exclusion.endTime,
      endTime: window.endTime,
    });
  }

  return result.filter((range) => timeToMinutes(range.endTime) > timeToMinutes(range.startTime));
}

export function subtractExclusionsFromRanges(windows: TimeRange[], exclusions: TimeRange[]) {
  return exclusions.reduce<TimeRange[]>(
    (currentWindows, exclusion) => currentWindows.flatMap((window) => subtractRange(window, exclusion)),
    windows,
  );
}

export function buildSlotsFromRanges(ranges: TimeRange[], slotDurationMinutes = SLOT_DURATION_MINUTES) {
  const slots: string[] = [];

  for (const range of ranges) {
    let cursor = timeToMinutes(range.startTime);
    const rangeEnd = timeToMinutes(range.endTime);

    while (cursor + slotDurationMinutes <= rangeEnd) {
      slots.push(minutesToTime(cursor));
      cursor += slotDurationMinutes;
    }
  }

  return slots;
}

export function getAvailableSlotsForDate(
  dateValue: string,
  exclusions: TimeRange[] = [],
  schedule?: Partial<WeeklySchedule> | null,
) {
  const workingRanges = getWorkingRangesForDate(dateValue, schedule);
  const availableRanges = subtractExclusionsFromRanges(workingRanges, exclusions);

  return buildSlotsFromRanges(availableRanges);
}
