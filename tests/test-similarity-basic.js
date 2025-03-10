// Basic test for similarity functions
const similarity = require('../src/similarity');

console.log("Testing string similarity calculation");

// Test string similarity
const stringTests = [
  ["time pressure", "time pressure", "Exact match"],
  ["high crime rate", "increased crime", "Similar concepts"],
  ["patient consent", "patient gave consent", "Similar phrases"],
  ["public opinion", "community sentiment", "Similar concepts"],
  ["medical ethics", "ethics board", "Related concepts"],
  ["time pressure", "financial cost", "Unrelated concepts"],
  ["yes", "no", "Opposites"]
];

console.log("\nString similarity results:");
stringTests.forEach(([str1, str2, desc]) => {
  const score = similarity.calculateStringSimilarity(str1, str2);
  console.log(`"${str1}" vs "${str2}" (${desc}): ${score.toFixed(3)}`);
});

console.log("\nTesting object similarity calculation");

// Test object similarity
const obj1 = {
  name: "Test Object 1",
  type: "example",
  value: 42,
  active: true,
  tags: ["test", "example", "object"]
};

const obj2 = {
  name: "Test Object 2",
  type: "example",
  value: 43,
  active: true,
  tags: ["test", "sample", "object"]
};

const objScore = similarity.calculateObjectSimilarity(obj1, obj2);
console.log(`Object similarity score: ${objScore.toFixed(3)}`);

console.log("\nTest completed successfully"); 