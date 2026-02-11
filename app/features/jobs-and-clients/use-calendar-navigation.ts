/**
 * Custom hook for calendar navigation (previous/next day, today)
 */

import { useCallback, useState } from "react";

import { addDays, isToday, subtractDays } from "./jobs-and-clients-helpers";

export function useCalendarNavigation(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const isCurrentDateToday = isToday(currentDate);

  const goToPreviousDay = useCallback(() => {
    setCurrentDate((prev) => subtractDays(prev, 1));
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return {
    currentDate,
    goToNextDay,
    goToPreviousDay,
    goToToday,
    isCurrentDateToday,
  };
}
