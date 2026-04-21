import type { SyllabusUnit } from "../types/models";
import { createSyllabusTopic, createSyllabusUnit } from "./syllabus";

const UNIT_LABEL_PATTERN = "unit|module|chapter";
const UNIT_INDEX_PATTERN = "(?:\\d+|[ivxlcdm]+)";
const STRONG_UNIT_HEADING_PATTERN = new RegExp(
  `^(${UNIT_LABEL_PATTERN})\\s*[-:]?\\s*(${UNIT_INDEX_PATTERN})(?:\\s*(?:[:.-])\\s*(.*))?$`,
  "i",
);
const LEADING_BULLET_PATTERN =
  /^(?:[-*]|\u2022|\u00b7|\u25aa|\u25e6|\u25cf|\u25cb)\s+/;
const LEADING_ENUMERATION_PATTERN =
  /^(?:\(?\d+\)?|[ivxlcdm]+|[a-z])(?:[.)\]-])\s+/i;
const INLINE_BULLET_SPLIT_PATTERN =
  /\s*(?:\u2022|\u00b7|\u25aa|\u25e6|\u25cf|\u25cb)\s*/;
const INLINE_ENUMERATION_SPLIT_PATTERN =
  /\s+(?=(?:\(?\d+\)?|[ivxlcdm]+|[a-z])[.)\]-]\s+)/i;
const NEWLINE_SPLIT_PATTERN = /\n+/;
const SEMICOLON_SPLIT_PATTERN = /\s*;\s*/;
const COMMA_SPLIT_PATTERN = /\s*,\s*/;
const COMMA_FRAGMENT_BLOCKER_PATTERN = /^(?:and|or)$/i;
const TRAILING_CONNECTIVE_PATTERN =
  /\b(?:and|or|of|the|to|in|for|with|on|by|from|into|using|based|including|through)\s*$/i;
const TRAILING_OPEN_DELIMITER_PATTERN = /(?:\(|\[|\/|&)\s*$/;
const LOWERCASE_CONTINUATION_PATTERN =
  /^(?:[a-z(]|and\b|or\b|of\b|the\b|to\b|in\b|for\b|with\b|on\b|by\b|from\b|using\b|based\b|including\b|through\b)/;

interface UnitHeadingMatch {
  unitTitle: string;
  inlineTopics: string[];
}

const normalizeCharacters = (value: string) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/\u00ad/g, "")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[\u2013\u2014]/g, "-");

const normalizeLineNoise = (value: string) =>
  value
    .replace(/[|¦]+/g, " ")
    .replace(/[ \t]*([,;:])[ \t]*/g, "$1 ")
    .replace(/[ \t]+([.?!])/g, "$1")
    .replace(/([([])[ \t]+/g, "$1")
    .replace(/[ \t]+([)\]])/g, "$1")
    .replace(/^[~`]+/g, "");

const collapseInternalWhitespace = (value: string) =>
  value
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ");

const sanitizeLine = (value: string) =>
  collapseInternalWhitespace(normalizeLineNoise(normalizeCharacters(value))).trim();

const normalizeUnitText = (value: string) =>
  sanitizeLine(value)
    .replace(/\s*:\s*$/, "")
    .replace(/\s+-\s+$/, "")
    .trim();

const normalizeTopicText = (value: string) =>
  sanitizeLine(value)
    .replace(LEADING_BULLET_PATTERN, "")
    .replace(LEADING_ENUMERATION_PATTERN, "")
    .replace(/[.;]\s*$/, "")
    .trim();

const getWordCount = (value: string) => value.split(" ").filter(Boolean).length;

const splitAndSanitize = (value: string, pattern: RegExp) =>
  value
    .split(pattern)
    .map((segment) => sanitizeLine(segment))
    .filter(Boolean);

const normalizeTopicSegments = (segments: string[]) =>
  segments.map((segment) => normalizeTopicText(segment)).filter(Boolean);

const startsWithTopicMarker = (value: string) => {
  const normalized = sanitizeLine(value);

  return (
    LEADING_BULLET_PATTERN.test(normalized) ||
    LEADING_ENUMERATION_PATTERN.test(normalized) ||
    INLINE_BULLET_SPLIT_PATTERN.test(normalized)
  );
};

const getSafeCommaSegments = (value: string, force = false) => {
  const commaSegments = splitAndSanitize(value, COMMA_SPLIT_PATTERN)
    .map(normalizeTopicText)
    .filter(Boolean);
  const meaningfulSegments = commaSegments.filter(
    (segment) =>
      segment.length > 3 && !COMMA_FRAGMENT_BLOCKER_PATTERN.test(segment),
  );

  if (force) {
    return meaningfulSegments;
  }

  if (meaningfulSegments.length <= 1) {
    return [];
  }

  return meaningfulSegments;
};

export const splitTopics = (
  text: string,
  options?: { forceCommaSplit?: boolean },
) => {
  const splitTopicLine = (topicLine: string): string[] => {
    const normalizedLine = normalizeTopicText(topicLine);

    if (!normalizedLine) {
      return [];
    }

    const bulletSegments = normalizeTopicSegments(
      splitAndSanitize(normalizedLine, INLINE_BULLET_SPLIT_PATTERN),
    );

    if (bulletSegments.length > 1) {
      return bulletSegments.flatMap((segment) => splitTopicLine(segment));
    }

    const enumeratedSegments = normalizeTopicSegments(
      splitAndSanitize(normalizedLine, INLINE_ENUMERATION_SPLIT_PATTERN),
    );

    if (enumeratedSegments.length > 1) {
      return enumeratedSegments.flatMap((segment) => splitTopicLine(segment));
    }

    const semicolonSegments = normalizeTopicSegments(
      splitAndSanitize(normalizedLine, SEMICOLON_SPLIT_PATTERN),
    );

    if (semicolonSegments.length > 1) {
      return semicolonSegments.flatMap((segment) => splitTopicLine(segment));
    }

    const commaSegments = getSafeCommaSegments(
      normalizedLine,
      options?.forceCommaSplit === true,
    );

    if (commaSegments.length > 1) {
      return commaSegments;
    }

    return [normalizedLine];
  };

  const normalizedBlock = normalizeCharacters(text).replace(/\r\n?/g, "\n");
  const topicLines = splitAndSanitize(normalizedBlock, NEWLINE_SPLIT_PATTERN);

  return topicLines.flatMap((topicLine) => splitTopicLine(topicLine));
};

const getUnitHeadingMatch = (line: string): UnitHeadingMatch | null => {
  const normalized = sanitizeLine(line);
  const match = normalized.match(STRONG_UNIT_HEADING_PATTERN);

  if (!match) {
    return null;
  }

  const label = normalizeUnitText(match[1]);
  const index = normalizeUnitText(match[2]);
  const headingPrefix = normalizeUnitText(`${label} ${index}`);
  const remainder = normalizeUnitText(match[3] ?? "");

  if (!remainder) {
    return {
      unitTitle: headingPrefix,
      inlineTopics: [],
    };
  }

  const inlineTopics = splitTopics(remainder, { forceCommaSplit: true });

  if (inlineTopics.length > 1) {
    return {
      unitTitle: headingPrefix,
      inlineTopics,
    };
  }

  return {
    unitTitle: normalizeUnitText(`${headingPrefix}: ${remainder}`),
    inlineTopics: [],
  };
};

export const isUnitHeading = (line: string) => Boolean(getUnitHeadingMatch(line));

export const extractUnitTitle = (line: string) => getUnitHeadingMatch(line)?.unitTitle ?? null;

const extractInlineTopics = (line: string) => getUnitHeadingMatch(line)?.inlineTopics ?? [];

const shouldMergeWrappedLine = (
  previousLine: string,
  currentLine: string,
  rawCurrentLine: string,
) => {
  const previous = sanitizeLine(previousLine);
  const current = sanitizeLine(currentLine);

  if (!previous || !current) {
    return false;
  }

  if (
    isUnitHeading(previous) ||
    isUnitHeading(current) ||
    startsWithTopicMarker(previous) ||
    startsWithTopicMarker(current)
  ) {
    return false;
  }

  if (
    SEMICOLON_SPLIT_PATTERN.test(previous) ||
    COMMA_SPLIT_PATTERN.test(previous) ||
    INLINE_BULLET_SPLIT_PATTERN.test(previous)
  ) {
    return false;
  }

  if (/-$/.test(previous) || TRAILING_CONNECTIVE_PATTERN.test(previous)) {
    return true;
  }

  if (TRAILING_OPEN_DELIMITER_PATTERN.test(previous)) {
    return true;
  }

  if (!/[.!?:;]$/.test(previous) && LOWERCASE_CONTINUATION_PATTERN.test(current)) {
    return true;
  }

  return (
    /^\s+/.test(rawCurrentLine) &&
    !/[.!?:;,]$/.test(previous) &&
    getWordCount(previous) <= 3 &&
    getWordCount(current) <= 3
  );
};

const mergeWrappedLine = (previousLine: string, currentLine: string) => {
  if (/-$/.test(previousLine)) {
    return sanitizeLine(`${previousLine.slice(0, -1)}${currentLine}`);
  }

  return sanitizeLine(`${previousLine} ${currentLine}`);
};

export const normalizeRawText = (text: string) => {
  const normalizedSource = normalizeCharacters(text)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  const mergedLines = normalizedSource.split("\n").reduce<string[]>((lines, rawLine) => {
    const sanitized = sanitizeLine(rawLine);

    if (!sanitized) {
      if (lines[lines.length - 1] !== "") {
        lines.push("");
      }
      return lines;
    }

    const lastIndex = lines.length - 1;
    const previousLine = lastIndex >= 0 ? lines[lastIndex] : undefined;

    if (
      previousLine &&
      previousLine !== "" &&
      shouldMergeWrappedLine(previousLine, sanitized, rawLine)
    ) {
      lines[lastIndex] = mergeWrappedLine(previousLine, sanitized);
      return lines;
    }

    lines.push(sanitized);
    return lines;
  }, []);

  return mergedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const pushTopicSegments = (unit: SyllabusUnit, segments: string[]) => {
  segments.filter(Boolean).forEach((segment) => {
    unit.topics.push(createSyllabusTopic(segment));
  });
};

const finalizeUnits = (units: SyllabusUnit[]) =>
  units
    .map((unit) => ({
      ...unit,
      title: normalizeUnitText(unit.title),
      topics: unit.topics
        .map((topic) => ({
          ...topic,
          title: normalizeTopicText(topic.title),
        }))
        .filter((topic) => topic.title.length > 0),
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

export const parseSyllabusLines = (lines: string[]) => {
  const units: SyllabusUnit[] = [];
  let currentUnit: SyllabusUnit | null = null;

  lines.forEach((line) => {
    const sanitized = sanitizeLine(line);

    if (!sanitized) {
      return;
    }

    if (isUnitHeading(sanitized)) {
      const unitTitle = extractUnitTitle(sanitized);

      if (!unitTitle) {
        return;
      }

      currentUnit = createSyllabusUnit(unitTitle);
      units.push(currentUnit);

      const inlineTopics = extractInlineTopics(sanitized);

      if (inlineTopics.length > 0) {
        pushTopicSegments(currentUnit, inlineTopics);
      }

      return;
    }

    if (!currentUnit) {
      currentUnit = createSyllabusUnit("Imported Topics");
      units.push(currentUnit);
    }

    pushTopicSegments(currentUnit, splitTopics(sanitized));
  });

  return finalizeUnits(units);
};

export const parseSyllabusText = (text: string): SyllabusUnit[] => {
  try {
    const normalizedText = normalizeRawText(text);

    if (!normalizedText) {
      return [];
    }

    return parseSyllabusLines(normalizedText.split("\n"));
  } catch {
    const fallbackText = normalizeTopicText(text);

    if (!fallbackText) {
      return [];
    }

    const fallbackUnit = createSyllabusUnit("Imported Topics");
    pushTopicSegments(fallbackUnit, splitTopics(fallbackText, { forceCommaSplit: true }));
    return finalizeUnits([fallbackUnit]);
  }
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
