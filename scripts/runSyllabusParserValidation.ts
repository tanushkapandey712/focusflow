import { runSyllabusParserValidation } from "../src/utils/syllabusImport.validation";

const report = runSyllabusParserValidation();

report.results.forEach((result, index) => {
  const prefix = result.passed ? "PASS" : "FAIL";
  console.log(`${prefix} ${index + 1}. ${result.name}`);

  if (!result.passed) {
    console.log("Raw input:");
    console.log(result.rawInput);
    console.log("Expected parsed units:");
    console.log(JSON.stringify(result.expectedParsedUnits, null, 2));
    console.log("Actual parsed units:");
    console.log(JSON.stringify(result.actualParsedUnits, null, 2));
    console.log("Expected topic arrays:");
    console.log(JSON.stringify(result.expectedTopicArrays, null, 2));
    console.log("Actual topic arrays:");
    console.log(JSON.stringify(result.actualTopicArrays, null, 2));
  }
});

if (!report.passed) {
  throw new Error(
    `${report.failedCount} of ${report.caseCount} syllabus parser validation cases failed.`,
  );
}

console.log(`All ${report.caseCount} syllabus parser validation cases passed.`);
