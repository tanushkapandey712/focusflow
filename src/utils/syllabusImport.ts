import type { SyllabusUnit } from "../types/models";
import { createSyllabusTopic, createSyllabusUnit } from "./syllabus";

const UNIT_LABEL_PATTERN = "unit|module|chapter|part|section|lesson|week|theme|block|paper";
const STRONG_UNIT_HEADING_PATTERN = new RegExp(
  `^(${UNIT_LABEL_PATTERN})\\s*(?:[-:]?\\s*)?(\\(?\\d+\\)?|\\(?[ivxlcdm]+\\)?)(?:\\s*(?:[:.-])\\s*|\\s+)?(.*)$`,
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
const SEMICOLON_SPLIT_PATTERN = /\s*;\s*/;
const COMMA_SPLIT_PATTERN = /\s*,\s*/;
const COMMA_TOPIC_LIST_BLOCKER_PATTERN =
  /\b(?:include|includes|including|consists? of|such as|for example|e\.g\.|i\.e\.|namely)\b/i;
const TRAILING_CONNECTIVE_PATTERN =
  /\b(?:and|or|of|the|to|in|for|with|on|by|from|into|using|based|including|through)\s*$/i;
const CONTINUATION_START_PATTERN =
  /^(?:[a-z(]|and\b|or\b|of\b|the\b|to\b|in\b|for\b|with\b|on\b|by\b|from\b|using\b|based\b|including\b|through\b)/;
const SAFE_WRAPPED_TOPIC_START_PATTERN =
  /^(?:[a-z0-9(]|and\b|or\b|of\b|the\b|to\b|in\b|for\b|with\b|on\b|by\b|from\b|using\b|based\b|including\b|through\b)/;

interface ParsedLine {
  sanitized: string;
  isBlank: boolean;
}

interface UnitHeadingMatch {
  unitTitle: string;
  inlineTopicText?: string;
}

const normalizeCharacters = (value: string) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[\u2013\u2014]/g, "-");

const sanitizeLine = (value: string) =>
  normalizeCharacters(value)
    .replace(/\t+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeExtractedText = (value: string) =>
  normalizeCharacters(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const normalizeUnitTitle = (line: string) =>
  sanitizeLine(line)
    .replace(/\s*:\s*$/, "")
    .replace(/\s+-\s+$/, "")
    .trim();

const normalizeTopicText = (line: string) =>
  sanitizeLine(line)
    .replace(LEADING_BULLET_PATTERN, "")
    .replace(LEADING_ENUMERATION_PATTERN, "")
    .trim();

const getWordCount = (line: string) => line.split(" ").filter(Boolean).length;

const splitAndSanitize = (value: string, pattern: RegExp) =>
  value
    .split(pattern)
    .map((segment) => sanitizeLine(segment))
    .filter(Boolean);

const isSentenceLikeTopicText = (text: string) =>
  /[.!?]$/.test(text) || COMMA_TOPIC_LIST_BLOCKER_PATTERN.test(text);

const isReasonableTopicSegment = (segment: string, maxWords: number) => {
  const normalized = normalizeTopicText(segment);

  return (
    normalized.length > 0 &&
    getWordCount(normalized) <= maxWords &&
    !/[.!?]$/.test(normalized)
  );
};

const shouldSplitCommaTopics = (
  text: string,
  segments: string[],
  force = false,
) => {
  if (segments.length <= 1) {
    return false;
  }

  if (force) {
    return true;
  }

  const normalized = sanitizeLine(text);

  if (isSentenceLikeTopicText(normalized)) {
    return false;
  }

  const maxWordsPerSegment = segments.length >= 3 ? 18 : 8;

  return segments.every((segment) => isReasonableTopicSegment(segment, maxWordsPerSegment));
};

const getCommaSeparatedSegments = (line: string, force = false) => {
  const commaSegments = splitAndSanitize(line, COMMA_SPLIT_PATTERN);

  return shouldSplitCommaTopics(line, commaSegments, force)
    ? commaSegments.map(normalizeTopicText).filter(Boolean)
    : [];
};

const shouldSplitHeadingRemainderAsTopics = (value: string) => {
  const normalized = sanitizeLine(value);

  if (!normalized) {
    return false;
  }

  return (
    LEADING_BULLET_PATTERN.test(normalized) ||
    LEADING_ENUMERATION_PATTERN.test(normalized) ||
    INLINE_BULLET_SPLIT_PATTERN.test(normalized) ||
    SEMICOLON_SPLIT_PATTERN.test(normalized) ||
    getCommaSeparatedSegments(normalized, true).length > 1
  );
};

const extractUnitHeading = (line: string): UnitHeadingMatch | null => {
  const normalized = sanitizeLine(line);
  const match = normalized.match(STRONG_UNIT_HEADING_PATTERN);

  if (!match) {
    return null;
  }

  const label = match[1];
  const index = match[2];
  const remainder = normalizeUnitTitle(match[3] ?? "");
  const headingPrefix = normalizeUnitTitle(`${label} ${index}`);

  if (!remainder) {
    return {
      unitTitle: headingPrefix,
    };
  }

  if (shouldSplitHeadingRemainderAsTopics(remainder)) {
    return {
      unitTitle: headingPrefix,
      inlineTopicText: remainder,
    };
  }

  return {
    unitTitle: normalizeUnitTitle(`${headingPrefix}: ${remainder}`),
  };
};

const isUnitHeading = (line: string) => Boolean(extractUnitHeading(line));

const extractUnitTitle = (line: string) => extractUnitHeading(line)?.unitTitle ?? null;

const extractInlineTopicText = (line: string) => extractUnitHeading(line)?.inlineTopicText;

const isTopicListLine = (line: string) => {
  const normalized = sanitizeLine(line);

  return (
    LEADING_BULLET_PATTERN.test(normalized) ||
    LEADING_ENUMERATION_PATTERN.test(normalized) ||
    INLINE_BULLET_SPLIT_PATTERN.test(normalizeTopicText(normalized))
  );
};

const isLikelyWrappedTopicLine = (previousLine: string, currentLine: string) => {
  const previous = sanitizeLine(previousLine);
  const current = sanitizeLine(currentLine);

  if (!previous || !current) {
    return false;
  }

  if (
    isUnitHeading(previous) ||
    isUnitHeading(current) ||
    isTopicListLine(previous) ||
    isTopicListLine(current)
  ) {
    return false;
  }

  if (/[.!?:;]$/.test(previous)) {
    return false;
  }

  return (
    getWordCount(previous) >= 5 &&
    getWordCount(current) <= 5 &&
    SAFE_WRAPPED_TOPIC_START_PATTERN.test(current)
  );
};

const isLikelyIndentedContinuation = (
  rawLine: string,
  previousLine: string,
  currentLine: string,
) => {
  const previous = sanitizeLine(previousLine);
  const current = sanitizeLine(currentLine);

  if (!/^\s+/.test(rawLine) || !previous || !current) {
    return false;
  }

  if (
    isUnitHeading(previous) ||
    isUnitHeading(current) ||
    isTopicListLine(previous) ||
    isTopicListLine(current)
  ) {
    return false;
  }

  if (/[.!?:;,]$/.test(previous)) {
    return false;
  }

  return getWordCount(previous) <= 3 && getWordCount(current) <= 3;
};

const shouldMergeBrokenLine = (
  previousLine: string,
  currentLine: string,
  options?: { rawLine?: string },
) => {
  if (!previousLine || !currentLine) {
    return false;
  }

  if (
    isUnitHeading(previousLine) ||
    isUnitHeading(currentLine) ||
    isTopicListLine(previousLine) ||
    isTopicListLine(currentLine)
  ) {
    return false;
  }

  if (
    SEMICOLON_SPLIT_PATTERN.test(previousLine) ||
    COMMA_SPLIT_PATTERN.test(previousLine) ||
    INLINE_BULLET_SPLIT_PATTERN.test(previousLine)
  ) {
    return false;
  }

  return (
    /-$/.test(previousLine) ||
    TRAILING_CONNECTIVE_PATTERN.test(previousLine) ||
    CONTINUATION_START_PATTERN.test(currentLine) ||
    isLikelyWrappedTopicLine(previousLine, currentLine) ||
    isLikelyIndentedContinuation(options?.rawLine ?? "", previousLine, currentLine)
  );
};

const mergeBrokenLine = (previousLine: string, currentLine: string) => {
  if (/-$/.test(previousLine)) {
    return sanitizeLine(`${previousLine.slice(0, -1)}${currentLine}`);
  }

  return sanitizeLine(`${previousLine} ${currentLine}`);
};

const parseLines = (rawText: string): ParsedLine[] => {
  const normalizedText = normalizeExtractedText(rawText);
  const normalizedLines = normalizedText.split("\n").reduce<string[]>((acc, rawLine) => {
    const sanitized = sanitizeLine(rawLine);

    if (!sanitized) {
      if (acc[acc.length - 1] !== "") {
        acc.push("");
      }
      return acc;
    }

    const lastIndex = acc.length - 1;
    const previousLine = lastIndex >= 0 ? acc[lastIndex] : undefined;

    if (
      previousLine &&
      previousLine !== "" &&
      shouldMergeBrokenLine(previousLine, sanitized, { rawLine })
    ) {
      acc[lastIndex] = mergeBrokenLine(previousLine, sanitized);
      return acc;
    }

    acc.push(sanitized);
    return acc;
  }, []);

  return normalizedLines.map((line) => ({
    sanitized: line,
    isBlank: line.length === 0,
  }));
};

const splitTopics = (
  text: string,
  options?: { forceCommaSplit?: boolean },
) => {
  const normalized = normalizeTopicText(text);

  if (!normalized) {
    return [];
  }

  const bulletSegments = splitAndSanitize(normalized, INLINE_BULLET_SPLIT_PATTERN);

  if (bulletSegments.length > 1) {
    return bulletSegments.map(normalizeTopicText).filter(Boolean);
  }

  const enumeratedSegments = splitAndSanitize(normalized, INLINE_ENUMERATION_SPLIT_PATTERN);

  if (enumeratedSegments.length > 1) {
    return enumeratedSegments.map(normalizeTopicText).filter(Boolean);
  }

  const semicolonSegments = splitAndSanitize(normalized, SEMICOLON_SPLIT_PATTERN)
    .map(normalizeTopicText)
    .filter(Boolean);

  if (
    semicolonSegments.length > 1 &&
    semicolonSegments.every(
      (segment) => getWordCount(segment) <= 12 && !/[.!?]$/.test(segment),
    )
  ) {
    return semicolonSegments;
  }

  const commaSegments = getCommaSeparatedSegments(
    normalized,
    options?.forceCommaSplit === true,
  );

  if (commaSegments.length > 1) {
    return commaSegments;
  }

  return [normalized];
};

// Wrapped topic lines often come through as a lowercase continuation of the previous topic.
const shouldAppendToPreviousTopic = (line: string, currentUnit: SyllabusUnit | null) => {
  if (!currentUnit || currentUnit.topics.length === 0) {
    return false;
  }

  const normalized = normalizeTopicText(line);

  if (!normalized || isUnitHeading(normalized) || isTopicListLine(line)) {
    return false;
  }

  return CONTINUATION_START_PATTERN.test(normalized);
};

const pushTopicSegments = (unit: SyllabusUnit, segments: string[]) => {
  segments
    .filter((segment) => segment.length > 0)
    .forEach((segment) => {
      unit.topics.push(createSyllabusTopic(segment));
    });
};

const appendToLastTopic = (unit: SyllabusUnit, value: string) => {
  const lastTopic = unit.topics[unit.topics.length - 1];

  if (!lastTopic) {
    return;
  }

  lastTopic.title = sanitizeLine(`${lastTopic.title} ${value}`);
};

const finalizeUnits = (units: SyllabusUnit[]) =>
  units
    .map((unit) => ({
      ...unit,
      title: normalizeUnitTitle(unit.title),
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

const buildFallbackUnits = (lines: ParsedLine[]) => {
  const fallbackUnit = createSyllabusUnit("Imported Topics");

  lines
    .filter((line) => !line.isBlank)
    .forEach((line) => {
      pushTopicSegments(
        fallbackUnit,
        splitTopics(line.sanitized, { forceCommaSplit: true }),
      );
    });

  if (fallbackUnit.topics.length === 0) {
    const compactText = lines
      .filter((line) => !line.isBlank)
      .map((line) => line.sanitized)
      .join(" ");

    if (compactText) {
      fallbackUnit.topics.push(createSyllabusTopic(compactText));
    }
  }

  return finalizeUnits([fallbackUnit]);
};

const parseSyllabusLines = (lines: ParsedLine[]) => {
  const units: SyllabusUnit[] = [];
  let currentUnit: SyllabusUnit | null = null;

  lines.forEach((line) => {
    if (line.isBlank) {
      return;
    }

    if (isUnitHeading(line.sanitized)) {
      const unitTitle = extractUnitTitle(line.sanitized);

      if (!unitTitle) {
        return;
      }

      currentUnit = createSyllabusUnit(unitTitle);
      units.push(currentUnit);

      const inlineTopicText = extractInlineTopicText(line.sanitized);

      if (inlineTopicText) {
        pushTopicSegments(
          currentUnit,
          splitTopics(inlineTopicText, {
            forceCommaSplit: true,
          }),
        );
      }

      return;
    }

    if (!currentUnit) {
      currentUnit = createSyllabusUnit("Imported Topics");
      units.push(currentUnit);
    }

    if (shouldAppendToPreviousTopic(line.sanitized, currentUnit)) {
      appendToLastTopic(currentUnit, line.sanitized);
      return;
    }

    pushTopicSegments(currentUnit, splitTopics(line.sanitized));
  });

  return finalizeUnits(units);
};

export const parseSyllabusText = (rawText: string): SyllabusUnit[] => {
  try {
    const lines = parseLines(rawText);

    if (lines.every((line) => line.isBlank)) {
      return [];
    }

    const finalizedUnits = parseSyllabusLines(lines);

    return finalizedUnits.length > 0 ? finalizedUnits : buildFallbackUnits(lines);
  } catch {
    const lines = parseLines(rawText);
    return buildFallbackUnits(lines);
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
