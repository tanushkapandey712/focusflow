import type { SyllabusUnit } from "../types/models";
import { parseSyllabusText } from "./syllabusImport";

interface ExpectedParsedUnit {
  title: string;
  topics: string[];
}

export interface SyllabusParserValidationCase {
  name: string;
  rawInput: string;
  expectedParsedUnits: ExpectedParsedUnit[];
  expectedTopicArrays: string[][];
}

export interface SyllabusParserValidationResult {
  name: string;
  passed: boolean;
  rawInput: string;
  expectedParsedUnits: ExpectedParsedUnit[];
  expectedTopicArrays: string[][];
  actualParsedUnits: ExpectedParsedUnit[];
  actualTopicArrays: string[][];
}

export interface SyllabusParserValidationSummary {
  passed: boolean;
  caseCount: number;
  failedCount: number;
  results: SyllabusParserValidationResult[];
}

const toComparableUnits = (units: SyllabusUnit[]): ExpectedParsedUnit[] =>
  units.map((unit) => ({
    title: unit.title,
    topics: unit.topics.map((topic) => topic.title),
  }));

const compareUnits = (actual: ExpectedParsedUnit[], expected: ExpectedParsedUnit[]) =>
  JSON.stringify(actual) === JSON.stringify(expected);

export const SYLLABUS_PARSER_VALIDATION_CASES: SyllabusParserValidationCase[] = [
  {
    name: "one-topic-per-line under a unit",
    rawInput: `Unit 1: Algebra
Linear equations
Polynomials
Matrices`,
    expectedParsedUnits: [
      {
        title: "Unit 1: Algebra",
        topics: ["Linear equations", "Polynomials", "Matrices"],
      },
    ],
    expectedTopicArrays: [["Linear equations", "Polynomials", "Matrices"]],
  },
  {
    name: "comma-separated topics under a unit",
    rawInput: `Unit 1: Ordinary Differential Equations
Solution of linear differential equations of nth order with constant coefficients, Simultaneous linear differential equations, Reduction of order, Normal form`,
    expectedParsedUnits: [
      {
        title: "Unit 1: Ordinary Differential Equations",
        topics: [
          "Solution of linear differential equations of nth order with constant coefficients",
          "Simultaneous linear differential equations",
          "Reduction of order",
          "Normal form",
        ],
      },
    ],
    expectedTopicArrays: [
      [
        "Solution of linear differential equations of nth order with constant coefficients",
        "Simultaneous linear differential equations",
        "Reduction of order",
        "Normal form",
      ],
    ],
  },
  {
    name: "semicolon-separated topics",
    rawInput: `Module 2: Probability
Events; Random variables; Probability distributions; Sampling`,
    expectedParsedUnits: [
      {
        title: "Module 2: Probability",
        topics: ["Events", "Random variables", "Probability distributions", "Sampling"],
      },
    ],
    expectedTopicArrays: [["Events", "Random variables", "Probability distributions", "Sampling"]],
  },
  {
    name: "bullet-list topics",
    rawInput: `Chapter 3: Mechanics
- Kinematics
- Laws of motion
- Work and energy`,
    expectedParsedUnits: [
      {
        title: "Chapter 3: Mechanics",
        topics: ["Kinematics", "Laws of motion", "Work and energy"],
      },
    ],
    expectedTopicArrays: [["Kinematics", "Laws of motion", "Work and energy"]],
  },
  {
    name: "multiple units in one input",
    rawInput: `Unit 1: Algebra
Linear equations
Polynomials

Unit 2: Geometry
Triangles, Circles, Coordinate Geometry`,
    expectedParsedUnits: [
      {
        title: "Unit 1: Algebra",
        topics: ["Linear equations", "Polynomials"],
      },
      {
        title: "Unit 2: Geometry",
        topics: ["Triangles", "Circles", "Coordinate Geometry"],
      },
    ],
    expectedTopicArrays: [
      ["Linear equations", "Polynomials"],
      ["Triangles", "Circles", "Coordinate Geometry"],
    ],
  },
  {
    name: "plain topic lines must not become units",
    rawInput: `Unit 1: Calculus
Applications of Derivatives
Mean Value Theorems
Taylor Expansion`,
    expectedParsedUnits: [
      {
        title: "Unit 1: Calculus",
        topics: ["Applications of Derivatives", "Mean Value Theorems", "Taylor Expansion"],
      },
    ],
    expectedTopicArrays: [["Applications of Derivatives", "Mean Value Theorems", "Taylor Expansion"]],
  },
  {
    name: "messy PDF-extracted text with irregular spacing",
    rawInput: `  Unit 1 :  Algebra

Linear
equations,   Polynomials,    Matrices


Unit-2:   Geometry
Triangles
Coordinate
 Geometry`,
    expectedParsedUnits: [
      {
        title: "Unit 1: Algebra",
        topics: ["Linear equations", "Polynomials", "Matrices"],
      },
      {
        title: "Unit 2: Geometry",
        topics: ["Triangles", "Coordinate Geometry"],
      },
    ],
    expectedTopicArrays: [
      ["Linear equations", "Polynomials", "Matrices"],
      ["Triangles", "Coordinate Geometry"],
    ],
  },
];

export const runSyllabusParserValidation = (): SyllabusParserValidationSummary => {
  const results = SYLLABUS_PARSER_VALIDATION_CASES.map((validationCase) => {
    const actualParsedUnits = toComparableUnits(parseSyllabusText(validationCase.rawInput));
    const actualTopicArrays = actualParsedUnits.map((unit) => unit.topics);
    const passed =
      compareUnits(actualParsedUnits, validationCase.expectedParsedUnits) &&
      JSON.stringify(actualTopicArrays) === JSON.stringify(validationCase.expectedTopicArrays);

    return {
      name: validationCase.name,
      passed,
      rawInput: validationCase.rawInput,
      expectedParsedUnits: validationCase.expectedParsedUnits,
      expectedTopicArrays: validationCase.expectedTopicArrays,
      actualParsedUnits,
      actualTopicArrays,
    };
  });

  const failedCount = results.filter((result) => !result.passed).length;

  return {
    passed: failedCount === 0,
    caseCount: results.length,
    failedCount,
    results,
  };
};
