import type { SyllabusUnit } from "../types/models";
import { createSyllabusTopic, createSyllabusUnit } from "./syllabus";

const UNIT_HEADER_PATTERN =
  /^(unit|module|chapter|part|section|lesson|topic)\s*([a-z0-9]+)?[\s:.-]+/i;

const LEADING_BULLET_PATTERN = /^[-*•]\s+/;
const LEADING_NUMBER_PATTERN = /^\d+[\].):-]?\s+/;

const sanitizeLine = (value: string) =>
  value
    .replace(/\t+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeUnitTitle = (line: string) =>
  line
    .replace(UNIT_HEADER_PATTERN, (match) => match.trim())
    .replace(/\s{2,}/g, " ")
    .trim();

const normalizeTopicTitle = (line: string) =>
  sanitizeLine(line).replace(LEADING_BULLET_PATTERN, "").replace(LEADING_NUMBER_PATTERN, "").trim();

const isLikelyUnitHeader = (line: string) => {
  if (UNIT_HEADER_PATTERN.test(line)) {
    return true;
  }

  if (line.endsWith(":")) {
    return true;
  }

  const words = line.split(" ").filter(Boolean);
  const isShortHeading = words.length > 0 && words.length <= 6;
  const isMostlyUppercase = line === line.toUpperCase() && /[A-Z]/.test(line);

  return isShortHeading && isMostlyUppercase;
};

const finalizeUnits = (units: SyllabusUnit[]) =>
  units
    .map((unit) => ({
      ...unit,
      title: sanitizeLine(unit.title),
      topics: unit.topics.filter((topic) => sanitizeLine(topic.title).length > 0),
    }))
    .filter((unit) => unit.title.length > 0 || unit.topics.length > 0)
    .map((unit, index) =>
      unit.title.length > 0
        ? unit
        : {
            ...unit,
            title: `Imported Unit ${index + 1}`,
          },
    );

export const parseSyllabusText = (rawText: string): SyllabusUnit[] => {
  const lines = rawText
    .split(/\r?\n/)
    .map(sanitizeLine)
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const units: SyllabusUnit[] = [];
  let currentUnit: SyllabusUnit | null = null;

  lines.forEach((line) => {
    if (isLikelyUnitHeader(line)) {
      currentUnit = createSyllabusUnit(normalizeUnitTitle(line.replace(/:$/, "")));
      units.push(currentUnit);
      return;
    }

    if (!currentUnit) {
      currentUnit = createSyllabusUnit("Imported Topics");
      units.push(currentUnit);
    }

    const topicTitle = normalizeTopicTitle(line);

    if (!topicTitle) {
      return;
    }

    currentUnit.topics.push(createSyllabusTopic(topicTitle));
  });

  return finalizeUnits(units);
};

export const normalizeReviewUnits = (units: SyllabusUnit[]) => finalizeUnits(units);

export const moveListItem = <T,>(
  items: T[],
  index: number,
  direction: "up" | "down",
) => {
  const nextIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || nextIndex < 0 || index >= items.length || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  [nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]];
  return nextItems;
};
