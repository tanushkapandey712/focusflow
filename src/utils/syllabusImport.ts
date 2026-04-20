import type { SyllabusUnit } from "../types/models";
import { createSyllabusTopic, createSyllabusUnit } from "./syllabus";

const UNIT_LABEL_PATTERN = "unit|module|chapter|part|section|lesson|week|theme|block|paper";
const EXPLICIT_UNIT_PREFIX_PATTERN = new RegExp(
  `^(${UNIT_LABEL_PATTERN})\\b(?:\\s*[-:]?\\s*(?:\\(?[ivxlcdm]+\\)?|\\(?\\d+\\)?|[a-z]))?`,
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
const TRAILING_CONNECTIVE_PATTERN =
  /\b(?:and|or|of|the|to|in|for|with|on|by|from|into|using|based|including|through)\s*$/i;
const CONTINUATION_START_PATTERN =
  /^(?:[a-z(]|and\b|or\b|of\b|the\b|to\b|in\b|for\b|with\b|on\b|by\b|from\b|using\b|based\b|including\b|through\b)/;

interface ParsedLine {
  sanitized: string;
  isBlank: boolean;
}

interface ExplicitUnitHeader {
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

const normalizeUnitTitle = (line: string) =>
  sanitizeLine(line)
    .replace(/\s*:\s*$/, "")
    .replace(/\s+-\s+$/, "")
    .trim();

const stripLeadingTopicMarker = (line: string) =>
  sanitizeLine(line)
    .replace(LEADING_BULLET_PATTERN, "")
    .replace(LEADING_ENUMERATION_PATTERN, "")
    .trim();

const getWordCount = (line: string) => line.split(" ").filter(Boolean).length;

const isMostlyUppercase = (line: string) =>
  line === line.toUpperCase() && /[A-Z]/.test(line);

const isHeadingStyled = (line: string) => {
  const words = line.split(" ").filter(Boolean);

  if (words.length === 0) {
    return false;
  }

  const connectiveWords = new Set([
    "and",
    "or",
    "of",
    "the",
    "to",
    "in",
    "for",
    "with",
    "on",
    "by",
  ]);

  return words.every((word, index) => {
    if (connectiveWords.has(word.toLowerCase())) {
      return index !== 0;
    }

    return /^[A-Z0-9(]/.test(word);
  });
};

const splitAndSanitize = (value: string, pattern: RegExp) =>
  value
    .split(pattern)
    .map((segment) => sanitizeLine(segment))
    .filter(Boolean);

const isSimpleColonHeading = (line: string) => {
  const normalized = sanitizeLine(line);

  return normalized.endsWith(":") && getWordCount(normalized.replace(/:$/, "")) <= 8;
};

const shouldSplitCommaSegments = (segments: string[], force = false) =>
  segments.length > 1 &&
  (force ||
    segments.every(
      (segment) =>
        getWordCount(segment) <= 8 &&
        !/[.!?]$/.test(segment) &&
        !/\b(?:include|includes|including|consists? of|such as)\b/i.test(segment),
    ));

const getCommaSeparatedSegments = (line: string, force = false) => {
  const commaSegments = splitAndSanitize(line, COMMA_SPLIT_PATTERN);

  return shouldSplitCommaSegments(commaSegments, force) ? commaSegments : [];
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

const parseExplicitUnitHeader = (line: string): ExplicitUnitHeader | null => {
  const normalized = sanitizeLine(line);
  const match = normalized.match(EXPLICIT_UNIT_PREFIX_PATTERN);

  if (!match) {
    return null;
  }

  const headingPrefix = normalizeUnitTitle(match[0]);
  const remainder = normalizeUnitTitle(
    normalized.slice(match[0].length).replace(/^\s*[-:.]\s*/, ""),
  );

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

const isExplicitUnitHeader = (line: string) =>
  Boolean(parseExplicitUnitHeader(line)) || isSimpleColonHeading(line);

const isTopicListLine = (line: string) => {
  const normalized = sanitizeLine(line);

  return (
    LEADING_BULLET_PATTERN.test(normalized) ||
    LEADING_ENUMERATION_PATTERN.test(normalized) ||
    INLINE_BULLET_SPLIT_PATTERN.test(stripLeadingTopicMarker(normalized))
  );
};

const shouldMergeBrokenLine = (previousLine: string, currentLine: string) => {
  if (!previousLine || !currentLine) {
    return false;
  }

  if (
    isExplicitUnitHeader(previousLine) ||
    isExplicitUnitHeader(currentLine) ||
    isSimpleColonHeading(previousLine) ||
    isSimpleColonHeading(currentLine) ||
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
    CONTINUATION_START_PATTERN.test(currentLine)
  );
};

const mergeBrokenLine = (previousLine: string, currentLine: string) => {
  if (/-$/.test(previousLine)) {
    return sanitizeLine(`${previousLine.slice(0, -1)}${currentLine}`);
  }

  return sanitizeLine(`${previousLine} ${currentLine}`);
};

const parseLines = (rawText: string): ParsedLine[] => {
  const normalizedLines = rawText.split(/\r?\n/).reduce<string[]>((acc, rawLine) => {
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
      shouldMergeBrokenLine(previousLine, sanitized)
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

const getNextMeaningfulIndex = (lines: ParsedLine[], startIndex: number) => {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].isBlank) {
      return index;
    }
  }

  return -1;
};

const collectFollowersUntilBoundary = (lines: ParsedLine[], startIndex: number) => {
  const followers: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].isBlank) {
      break;
    }

    if (isExplicitUnitHeader(lines[index].sanitized)) {
      break;
    }

    followers.push(lines[index].sanitized);
  }

  return followers;
};

// Treat short, heading-styled lines as unit headers only when they introduce a block of followers.
const shouldTreatAsStandaloneHeader = (
  line: string,
  lines: ParsedLine[],
  index: number,
  currentUnit: SyllabusUnit | null,
) => {
  const normalized = normalizeUnitTitle(stripLeadingTopicMarker(line));

  if (!normalized || isExplicitUnitHeader(line) || isTopicListLine(line)) {
    return false;
  }

  if (/[.!?]$/.test(normalized) || getWordCount(normalized) > 7) {
    return false;
  }

  if (currentUnit && currentUnit.topics.length === 0) {
    return false;
  }

  const nextMeaningfulIndex = getNextMeaningfulIndex(lines, index);

  if (nextMeaningfulIndex === -1) {
    return false;
  }

  const followers = collectFollowersUntilBoundary(lines, index);

  if (followers.length === 0) {
    return false;
  }

  const previousLineIsBlank = index === 0 || lines[index - 1].isBlank;
  const hasTopicLikeFollowers = followers.some(
    (follower) => !isExplicitUnitHeader(follower),
  );
  const styleSignal =
    previousLineIsBlank || isMostlyUppercase(normalized) || isHeadingStyled(normalized);

  return styleSignal && hasTopicLikeFollowers;
};

const splitTopicSegments = (
  line: string,
  options?: { forceCommaSplit?: boolean },
) => {
  const normalized = stripLeadingTopicMarker(line);

  if (!normalized) {
    return [];
  }

  const bulletSegments = splitAndSanitize(normalized, INLINE_BULLET_SPLIT_PATTERN);

  if (bulletSegments.length > 1) {
    return bulletSegments;
  }

  const enumeratedSegments = splitAndSanitize(normalized, INLINE_ENUMERATION_SPLIT_PATTERN);

  if (enumeratedSegments.length > 1) {
    return enumeratedSegments.map(stripLeadingTopicMarker).filter(Boolean);
  }

  const semicolonSegments = splitAndSanitize(normalized, SEMICOLON_SPLIT_PATTERN);

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

  const normalized = stripLeadingTopicMarker(line);

  if (!normalized || isExplicitUnitHeader(normalized) || isTopicListLine(line)) {
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
        splitTopicSegments(line.sanitized, { forceCommaSplit: true }),
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

export const parseSyllabusText = (rawText: string): SyllabusUnit[] => {
  try {
    const lines = parseLines(rawText);

    if (lines.every((line) => line.isBlank)) {
      return [];
    }

    const units: SyllabusUnit[] = [];
    let currentUnit: SyllabusUnit | null = null;

    lines.forEach((line, index) => {
      if (line.isBlank) {
        return;
      }

      const explicitUnitHeader = parseExplicitUnitHeader(line.sanitized);

      if (explicitUnitHeader) {
        currentUnit = createSyllabusUnit(explicitUnitHeader.unitTitle);
        units.push(currentUnit);

        if (explicitUnitHeader.inlineTopicText) {
          pushTopicSegments(
            currentUnit,
            splitTopicSegments(explicitUnitHeader.inlineTopicText, {
              forceCommaSplit: true,
            }),
          );
        }

        return;
      }

      if (isSimpleColonHeading(line.sanitized)) {
        currentUnit = createSyllabusUnit(normalizeUnitTitle(line.sanitized));
        units.push(currentUnit);
        return;
      }

      if (shouldTreatAsStandaloneHeader(line.sanitized, lines, index, currentUnit)) {
        currentUnit = createSyllabusUnit(
          normalizeUnitTitle(stripLeadingTopicMarker(line.sanitized)),
        );
        units.push(currentUnit);
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

      pushTopicSegments(currentUnit, splitTopicSegments(line.sanitized));
    });

    const finalizedUnits = finalizeUnits(units);

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
