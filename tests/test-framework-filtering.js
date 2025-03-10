/**
 * Test script for framework filtering in findRelevantPrecedents
 * 
 * This test verifies that the framework filtering functionality in the
 * findRelevantPrecedents function works correctly.
 */

const similarity = require('../src/similarity');
const utils = require('../src/utils');

// Sample dilemma for testing
const testDilemma = {
  title: "Test Ethical Dilemma",
  description: "A test dilemma to verify framework filtering functionality",
  situation: {
    type: "Ethical Dilemma",
    context: ["test scenario", "ethical decision"],
    key_factors: ["test factor 1", "test factor 2"]
  }
};

// Sample precedents with different frameworks
const testPrecedents = [
  {
    precedent_id: "precedent_1",
    title: "Utilitarian Precedent",
    description: "A precedent using utilitarian reasoning",
    frameworks: ["Utilitarianism"],
    situation: {
      type: "Ethical Dilemma",
      context: ["test scenario", "ethical decision"],
      key_factors: ["test factor 1", "test factor 2"]
    },
    reasoning_paths: [
      {
        framework: "Utilitarianism",
        conclusion: "action_1",
        strength: "strong",
        argument: "Utilitarian argument for action 1"
      }
    ]
  },
  {
    precedent_id: "precedent_2",
    title: "Deontological Precedent",
    description: "A precedent using deontological reasoning",
    frameworks: ["Kantian Deontology"],
    situation: {
      type: "Ethical Dilemma",
      context: ["test scenario", "ethical decision"],
      key_factors: ["test factor 1", "test factor 2"]
    },
    reasoning_paths: [
      {
        framework: "Kantian Deontology",
        conclusion: "action_2",
        strength: "strong",
        argument: "Deontological argument for action 2"
      }
    ]
  },
  {
    precedent_id: "precedent_3",
    title: "Virtue Ethics Precedent",
    description: "A precedent using virtue ethics reasoning",
    frameworks: ["Virtue Ethics"],
    situation: {
      type: "Ethical Dilemma",
      context: ["test scenario", "ethical decision"],
      key_factors: ["test factor 1", "test factor 2"]
    },
    reasoning_paths: [
      {
        framework: "Virtue Ethics",
        conclusion: "action_3",
        strength: "strong",
        argument: "Virtue ethics argument for action 3"
      }
    ]
  },
  {
    precedent_id: "precedent_4",
    title: "Multiple Frameworks Precedent",
    description: "A precedent using multiple ethical frameworks",
    frameworks: ["Utilitarianism", "Virtue Ethics"],
    situation: {
      type: "Ethical Dilemma",
      context: ["test scenario", "ethical decision"],
      key_factors: ["test factor 1", "test factor 2"]
    },
    reasoning_paths: [
      {
        framework: "Utilitarianism",
        conclusion: "action_4a",
        strength: "moderate",
        argument: "Utilitarian argument for action 4a"
      },
      {
        framework: "Virtue Ethics",
        conclusion: "action_4b",
        strength: "moderate",
        argument: "Virtue ethics argument for action 4b"
      }
    ]
  }
];

// Test cases
async function runTests() {
  console.log("=== Testing Framework Filtering in findRelevantPrecedents ===\n");

  // Test 1: No framework filter (should return all precedents)
  console.log("Test 1: No framework filter");
  const noFilterResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    null,
    0.1, // Low threshold to ensure all precedents are included
    10   // High max results to ensure all precedents are included
  );
  console.log(`Found ${noFilterResults.length} precedents without framework filter`);
  console.log(`Expected: 4, Actual: ${noFilterResults.length}`);
  console.log(`Result: ${noFilterResults.length === 4 ? 'PASS' : 'FAIL'}\n`);

  // Test 2: Filter by Utilitarianism (should return precedents 1 and 4)
  console.log("Test 2: Filter by Utilitarianism");
  const utilitarianResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    "Utilitarianism",
    0.1,
    10
  );
  console.log(`Found ${utilitarianResults.length} precedents with Utilitarianism filter`);
  console.log(`Expected: 2, Actual: ${utilitarianResults.length}`);
  
  const utilitarianIds = utilitarianResults.map(r => r.precedent.precedent_id);
  console.log(`Precedent IDs: ${utilitarianIds.join(', ')}`);
  const hasCorrectUtilitarianIds = 
    utilitarianIds.includes("precedent_1") && 
    utilitarianIds.includes("precedent_4");
  console.log(`Has correct precedent IDs: ${hasCorrectUtilitarianIds ? 'Yes' : 'No'}`);
  console.log(`Result: ${utilitarianResults.length === 2 && hasCorrectUtilitarianIds ? 'PASS' : 'FAIL'}\n`);

  // Test 3: Filter by Kantian Deontology (should return only precedent 2)
  console.log("Test 3: Filter by Kantian Deontology");
  const deontologyResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    "Kantian Deontology",
    0.1,
    10
  );
  console.log(`Found ${deontologyResults.length} precedents with Kantian Deontology filter`);
  console.log(`Expected: 1, Actual: ${deontologyResults.length}`);
  
  const deontologyIds = deontologyResults.map(r => r.precedent.precedent_id);
  console.log(`Precedent IDs: ${deontologyIds.join(', ')}`);
  const hasCorrectDeontologyIds = deontologyIds.includes("precedent_2");
  console.log(`Has correct precedent IDs: ${hasCorrectDeontologyIds ? 'Yes' : 'No'}`);
  console.log(`Result: ${deontologyResults.length === 1 && hasCorrectDeontologyIds ? 'PASS' : 'FAIL'}\n`);

  // Test 4: Filter by Virtue Ethics (should return precedents 3 and 4)
  console.log("Test 4: Filter by Virtue Ethics");
  const virtueResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    "Virtue Ethics",
    0.1,
    10
  );
  console.log(`Found ${virtueResults.length} precedents with Virtue Ethics filter`);
  console.log(`Expected: 2, Actual: ${virtueResults.length}`);
  
  const virtueIds = virtueResults.map(r => r.precedent.precedent_id);
  console.log(`Precedent IDs: ${virtueIds.join(', ')}`);
  const hasCorrectVirtueIds = 
    virtueIds.includes("precedent_3") && 
    virtueIds.includes("precedent_4");
  console.log(`Has correct precedent IDs: ${hasCorrectVirtueIds ? 'Yes' : 'No'}`);
  console.log(`Result: ${virtueResults.length === 2 && hasCorrectVirtueIds ? 'PASS' : 'FAIL'}\n`);

  // Test 5: Filter by non-existent framework (should return empty array)
  console.log("Test 5: Filter by non-existent framework");
  const nonExistentResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    "Non-Existent Framework",
    0.1,
    10
  );
  console.log(`Found ${nonExistentResults.length} precedents with non-existent framework filter`);
  console.log(`Expected: 0, Actual: ${nonExistentResults.length}`);
  console.log(`Result: ${nonExistentResults.length === 0 ? 'PASS' : 'FAIL'}\n`);

  // Test 6: Empty precedent database (should return empty array)
  console.log("Test 6: Empty precedent database");
  const emptyResults = await similarity.findRelevantPrecedents(
    testDilemma,
    [],
    "Utilitarianism",
    0.1,
    10
  );
  console.log(`Found ${emptyResults.length} precedents with empty database`);
  console.log(`Expected: 0, Actual: ${emptyResults.length}`);
  console.log(`Result: ${emptyResults.length === 0 ? 'PASS' : 'FAIL'}\n`);

  // Test 7: Precedent with empty frameworks array (should not be included in filtered results)
  const precedentsWithEmpty = [
    ...testPrecedents,
    {
      precedent_id: "precedent_5",
      title: "Empty Frameworks Precedent",
      description: "A precedent with an empty frameworks array",
      frameworks: [],
      situation: {
        type: "Ethical Dilemma",
        context: ["test scenario", "ethical decision"],
        key_factors: ["test factor 1", "test factor 2"]
      },
      reasoning_paths: []
    }
  ];

  console.log("Test 7: Precedent with empty frameworks array");
  const emptyFrameworksResults = await similarity.findRelevantPrecedents(
    testDilemma,
    precedentsWithEmpty,
    "Utilitarianism",
    0.1,
    10
  );
  console.log(`Found ${emptyFrameworksResults.length} precedents with Utilitarianism filter`);
  console.log(`Expected: 2, Actual: ${emptyFrameworksResults.length}`);
  
  const emptyFrameworksIds = emptyFrameworksResults.map(r => r.precedent.precedent_id);
  console.log(`Precedent IDs: ${emptyFrameworksIds.join(', ')}`);
  const hasCorrectEmptyFrameworksIds = 
    emptyFrameworksIds.includes("precedent_1") && 
    emptyFrameworksIds.includes("precedent_4") &&
    !emptyFrameworksIds.includes("precedent_5");
  console.log(`Has correct precedent IDs: ${hasCorrectEmptyFrameworksIds ? 'Yes' : 'No'}`);
  console.log(`Result: ${emptyFrameworksResults.length === 2 && hasCorrectEmptyFrameworksIds ? 'PASS' : 'FAIL'}\n`);

  console.log("=== Framework Filtering Tests Complete ===");
}

// Run the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
});
