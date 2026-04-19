import type { StudySession } from "../types/models";

export interface LineChartPoint {
  key: string;
  label: string;
  value: number;
}

export interface MultiLineChartPoint {
  key: string;
  label: string;
  focusScore: number;
  distractions: number;
}

export interface DonutChartPoint {
  id: string;
  label: string;
  value: number;
  percentage: number;
  subjectId?: string;
}

export interface HeatmapCell {
  key: string;
  dateLabel: string;
  dayNumber: number;
  minutes: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  subjectId?: string;
  subjectName?: string;
}

const asDayKey = (date: Date) => date.toISOString().split("T")[0];

const dayLabel = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
  });

export const getDailyStudyTime = (sessions: StudySession[], days = 7): LineChartPoint[] => {
  const buckets = new Map<string, number>();
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    buckets.set(asDayKey(day), 0);
  }

  sessions.forEach((session) => {
    const key = asDayKey(new Date(session.endedAt));
    if (!buckets.has(key)) return;
    buckets.set(key, (buckets.get(key) ?? 0) + session.actualMinutes);
  });

  return Array.from(buckets.entries()).map(([key, value]) => ({
    key,
    label: dayLabel(new Date(key)),
    value,
  }));
};

export const getWeeklyTrend = (sessions: StudySession[], weeks = 6): LineChartPoint[] => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const points: LineChartPoint[] = [];

  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(startOfWeek.getDate() - offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const minutes = sessions
      .filter((session) => {
        const endedAt = new Date(session.endedAt);
        return endedAt >= weekStart && endedAt < weekEnd;
      })
      .reduce((sum, session) => sum + session.actualMinutes, 0);

    points.push({
      key: asDayKey(weekStart),
      label: `W${weeks - offset}`,
      value: minutes,
    });
  }

  return points;
};

export const getSubjectDistribution = (sessions: StudySession[]): DonutChartPoint[] => {
  const totals = new Map<string, { subjectId?: string; label: string; minutes: number }>();

  sessions.forEach((session) => {
    const key = session.subjectId || session.subjectName;
    const current = totals.get(key);
    totals.set(key, {
      subjectId: session.subjectId,
      label: session.subjectName,
      minutes: (current?.minutes ?? 0) + session.actualMinutes,
    });
  });

  const totalMinutes = Array.from(totals.values()).reduce((sum, value) => sum + value.minutes, 0);
  if (totalMinutes === 0) return [];

  return Array.from(totals.entries())
    .map(([key, entry]) => ({
      id: key.toLowerCase().replace(/\s+/g, "-"),
      subjectId: entry.subjectId,
      label: entry.label,
      value: entry.minutes,
      percentage: Math.round((entry.minutes / totalMinutes) * 100),
    }))
    .sort((a, b) => b.value - a.value);
};

export const getFocusTrends = (sessions: StudySession[], days = 7): LineChartPoint[] => {
  const daily = getDailyStudyTime(sessions, days).map((day) => ({
    ...day,
    value: 0,
  }));
  const scoreBuckets = new Map<string, { sum: number; count: number }>(
    daily.map((point) => [point.key, { sum: 0, count: 0 }]),
  );

  sessions.forEach((session) => {
    const key = asDayKey(new Date(session.endedAt));
    const bucket = scoreBuckets.get(key);
    if (!bucket) return;
    const score = Math.round((session.actualMinutes / Math.max(1, session.plannedMinutes)) * 100);
    bucket.sum += Math.min(score, 100);
    bucket.count += 1;
  });

  return daily.map((point) => {
    const bucket = scoreBuckets.get(point.key);
    if (!bucket || bucket.count === 0) return { ...point, value: 0 };
    return { ...point, value: Math.round(bucket.sum / bucket.count) };
  });
};

export const getDistractionTrends = (sessions: StudySession[], days = 7): LineChartPoint[] => {
  const daily = getDailyStudyTime(sessions, days).map((day) => ({
    ...day,
    value: 0,
  }));
  const buckets = new Map<string, number>(daily.map((point) => [point.key, 0]));

  sessions.forEach((session) => {
    const key = asDayKey(new Date(session.endedAt));
    if (!buckets.has(key)) return;
    buckets.set(key, (buckets.get(key) ?? 0) + (session.distractionCount ?? 0));
  });

  return daily.map((point) => ({
    ...point,
    value: buckets.get(point.key) ?? 0,
  }));
};

export const getFocusVsDistractionTrend = (
  sessions: StudySession[],
  days = 7,
): MultiLineChartPoint[] => {
  const focus = getFocusTrends(sessions, days);
  const distractions = getDistractionTrends(sessions, days);

  return focus.map((focusPoint, index) => ({
    key: focusPoint.key,
    label: focusPoint.label,
    focusScore: focusPoint.value,
    distractions: distractions[index]?.value ?? 0,
  }));
};

export const getStudyHeatmap = (sessions: StudySession[], days = 28): HeatmapCell[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const buckets = new Map<
    string,
    {
      date: Date;
      minutes: number;
      subjectTotals: Map<string, { subjectId?: string; subjectName: string; minutes: number }>;
    }
  >();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    buckets.set(asDayKey(date), {
      date,
      minutes: 0,
      subjectTotals: new Map(),
    });
  }

  sessions.forEach((session) => {
    const key = asDayKey(new Date(session.endedAt));
    const bucket = buckets.get(key);

    if (!bucket) {
      return;
    }

    bucket.minutes += session.actualMinutes;
    const subjectKey = session.subjectId || session.subjectName;
    const current = bucket.subjectTotals.get(subjectKey);
    bucket.subjectTotals.set(subjectKey, {
      subjectId: session.subjectId,
      subjectName: session.subjectName,
      minutes: (current?.minutes ?? 0) + session.actualMinutes,
    });
  });

  const maxMinutes = Math.max(...Array.from(buckets.values()).map((bucket) => bucket.minutes), 0);

  return Array.from(buckets.entries()).map(([key, bucket]) => {
    const dominantSubject = [...bucket.subjectTotals.values()].sort((a, b) => b.minutes - a.minutes)[0];
    const ratio = maxMinutes === 0 ? 0 : bucket.minutes / maxMinutes;
    const intensity = bucket.minutes === 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil(ratio * 4))) as 1 | 2 | 3 | 4);

    return {
      key,
      dateLabel: bucket.date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      dayNumber: bucket.date.getDate(),
      minutes: bucket.minutes,
      intensity,
      isToday: key === asDayKey(now),
      subjectId: dominantSubject?.subjectId,
      subjectName: dominantSubject?.subjectName,
    };
  });
};
