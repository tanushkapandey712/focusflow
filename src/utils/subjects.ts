import type { Subject, StudySession } from "../types/models";
import { normalizeGoalTitle } from "./goals";

const FALLBACK_COLORS = ["#5a55f5", "#0f766e", "#ea580c", "#06b6d4", "#dc2626", "#7c3aed"];

const hashString = (value: string) =>
  value.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);

const fallbackColorFor = (value: string) =>
  FALLBACK_COLORS[Math.abs(hashString(value)) % FALLBACK_COLORS.length];

export const normalizeSubjectName = (value: string | undefined) => value?.trim().toLowerCase() ?? "";

export interface ResolvedSubject {
  id: string;
  name: string;
  color: string;
}

const ensureHexColor = (value: string | undefined, fallbackSeed: string) => {
  if (!value) return fallbackColorFor(fallbackSeed);

  const normalized = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallbackColorFor(fallbackSeed);
};

const createSubjectId = (value: string) => {
  const normalized = normalizeSubjectName(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `subject-${Math.abs(hashString(value))}`;
};

export const parseSubjectNames = (value: string) => {
  const uniqueNames: string[] = [];
  const seen = new Set<string>();

  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const normalized = normalizeSubjectName(item);
      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      uniqueNames.push(item);
    });

  return uniqueNames;
};

export const buildSubjectsFromNames = (subjectNames: string[], existingSubjects: Subject[] = []): Subject[] => {
  const existingByName = new Map(
    existingSubjects.map((subject) => [normalizeSubjectName(subject.name), subject] as const),
  );

  return subjectNames.reduce<Subject[]>((acc, name) => {
    const normalized = normalizeSubjectName(name);
    if (!normalized) {
      return acc;
    }

    const existing = existingByName.get(normalized);
    acc.push({
      id: existing?.id ?? createSubjectId(name),
      name: existing?.name ?? name,
      color: ensureHexColor(existing?.color, existing?.name ?? name),
    });

    return acc;
  }, []);
};

export const subjectNamesToText = (subjects: Subject[]) => subjects.map((subject) => subject.name).join("\n");

export const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const parsed = Number.parseInt(expanded, 16);

  if (Number.isNaN(parsed)) {
    return { r: 90, g: 85, b: 245 };
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

export const withAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getResolvedSubject = (
  subjects: Subject[],
  params: { subjectId?: string; subjectName?: string },
): ResolvedSubject | undefined => {
  const byId = params.subjectId ? subjects.find((subject) => subject.id === params.subjectId) : undefined;
  if (byId) {
    return {
      id: byId.id,
      name: byId.name,
      color: ensureHexColor(byId.color, byId.name),
    };
  }

  const byName = params.subjectName
    ? subjects.find((subject) => normalizeSubjectName(subject.name) === normalizeSubjectName(params.subjectName))
    : undefined;

  if (byName) {
    return {
      id: byName.id,
      name: byName.name,
      color: ensureHexColor(byName.color, byName.name),
    };
  }

  if (!params.subjectName) {
    return undefined;
  }

  return {
    id: params.subjectId ?? params.subjectName.toLowerCase().replace(/\s+/g, "-"),
    name: params.subjectName,
    color: ensureHexColor(undefined, params.subjectName),
  };
};

export const getSubjectVisuals = (color: string) => ({
  badgeStyle: {
    borderColor: withAlpha(color, 0.22),
    backgroundColor: withAlpha(color, 0.12),
    color,
  },
  panelStyle: {
    borderColor: withAlpha(color, 0.2),
    background: `linear-gradient(135deg, ${withAlpha(color, 0.18)}, rgba(255,255,255,0.9))`,
    boxShadow: `0 18px 38px -28px ${withAlpha(color, 0.55)}`,
  },
  fillStyle: {
    background: `linear-gradient(90deg, ${color}, ${withAlpha(color, 0.72)})`,
  },
  dotStyle: {
    backgroundColor: color,
  },
});

export const getDominantSubjectFromSessions = (
  sessions: StudySession[],
  subjects: Subject[],
): ResolvedSubject | undefined => {
  const minutesBySubject = new Map<string, { subject: ResolvedSubject; minutes: number }>();

  sessions.forEach((session) => {
    const subject = getResolvedSubject(subjects, {
      subjectId: session.subjectId,
      subjectName: session.subjectName,
    });

    if (!subject) {
      return;
    }

    const current = minutesBySubject.get(subject.id);
    minutesBySubject.set(subject.id, {
      subject,
      minutes: (current?.minutes ?? 0) + session.actualMinutes,
    });
  });

  return [...minutesBySubject.values()].sort((a, b) => b.minutes - a.minutes)[0]?.subject;
};

export const getGoalSubject = (
  goalTitle: string,
  sessions: StudySession[],
  subjects: Subject[],
): ResolvedSubject | undefined => {
  const normalizedGoalTitle = normalizeGoalTitle(goalTitle);

  if (!normalizedGoalTitle) {
    return undefined;
  }

  const goalSessions = sessions.filter(
    (session) => normalizeGoalTitle(session.goal) === normalizedGoalTitle,
  );

  return getDominantSubjectFromSessions(goalSessions, subjects);
};
