/**
 * Focused Test for Resource Divisibility Adaptation Rule
 */

const assert = require('assert');
const { adaptReasoningPaths } = require('../src/adaptation');
const { adaptResourceDivisibilityRule } = require('../src/adaptationRules');
const { highlightChanges } = require('../src/utils');
const { getFrameworkByName } = require('../src/frameworkRegistry');

// Counter for tracking passed and failed tests
let totalTests = 0;
let passedTests = 0;

/**
 * Test helper function to check if adaptation was successful
 */
function testAdaptation(testName, precedent, newSituation, assertionFn, skipArgumentAdaptation = false) {
  totalTests++;
  console.log(`\n=== Running Test: ${testName} ===`);
  console.log("=== Inside testAdaptation ===");
  console.log(`Test Name: ${testName}`);
  console.log(`Original Dilemma: ${JSON.stringify(precedent, null, 2)}`);
  console.log(`New Situation: ${JSON.stringify(newSituation, null, 2)}`);
  console.log(`Skip Argument Adaptation: ${skipArgumentAdaptation}`);
  
  try {
    const adaptedPaths = adaptReasoningPaths(precedent, newSituation, skipArgumentAdaptation);
    console.log(`Adapted paths for ${testName}: ${JSON.stringify(adaptedPaths, null, 2)}`);
    assertionFn(adaptedPaths);
    console.log(`[${new Date().toISOString()}] Test passed: ${testName}`);
    console.log(`✅ PASSED: ${testName}`);
    passedTests++;
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Test failed: ${testName} - ${error.message}`);
    console.log(`❌ FAILED: ${testName} - ${error.message}`);
  }
}

/**
 * Helper function to test specific adaptation rule
 */
function testAdaptationRule(ruleName, ruleFn, testName, reasoningPath, newSituation, originalDilemma, assertionFn) {
  totalTests++;
  console.log(`\n=== Running Direct Rule Test: ${testName} ===`);
  
  try {
    const adaptedPath = ruleFn(reasoningPath, newSituation, originalDilemma);
    assertionFn(adaptedPath);
    console.log(`[${new Date().toISOString()}] Direct rule test passed: ${testName}`);
    console.log(`✅ PASSED: ${testName}`);
    passedTests++;
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Direct rule test failed: ${testName} - ${error.message}`);
    console.log(`❌ FAILED: ${testName} - ${error.message}`);
  }
}

// ===== TEST SUITE FOR RESOURCE DIVISIBILITY RULE =====
console.log("\n==================================================");
console.log("TESTING ADAPTATION RULE: adaptResourceDivisibilityRule");
console.log("==================================================");

// Test 1: Resource divisibility adaptation - indivisible to divisible
testAdaptation(
  "Resource Divisibility Adaptation - Indivisible to Divisible",
  {
    precedent_id: "resource_allocation_dilemma",
    situation: {
      parameters: {
        resource_divisibility: { value: "indivisible" }
      }
    },
    reasoning_paths: [{
      framework: "Utilitarianism",
      conclusion: "criteria_based_selection",
      strength: "moderate",
      argument: "With indivisible resources, a criteria-based approach selects those who will benefit most."
    }]
  },
  {
    situation: {
      parameters: {
        resource_divisibility: { value: "divisible" }
      }
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "strong", "Divisible resources should strengthen utilitarian conclusion");
    assert(adaptedPaths[0].argument.includes("divisible"), 
      "Argument should mention flexibility with divisible resources");
  }
);

// Test 2: Resource divisibility adaptation - divisible to indivisible
testAdaptation(
  "Resource Divisibility - Divisible to Indivisible",
  {
    precedent_id: "resource_allocation_dilemma",
    situation: {
      parameters: {
        resource_divisibility: { value: "divisible" }
      }
    },
    reasoning_paths: [{
      framework: "Utilitarianism",
      conclusion: "proportional_allocation",
      strength: "moderate",
      argument: "With divisible resources, proportional allocation maximizes utility across all stakeholders."
    }]
  },
  {
    situation: {
      parameters: {
        resource_divisibility: { value: "indivisible" }
      }
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "weak", "Indivisible resources should weaken proportional approach");
    assert(adaptedPaths[0].argument.includes("indivisible"), 
      "Should mention zero-sum situation with indivisible resources");
  }
);

// Test 3: Resource divisibility from contextual factors
testAdaptation(
  "Resource Divisibility From Contextual Factors",
  {
    precedent_id: "resource_allocation_dilemma",
    situation: {
      contextual_factors: [
        { factor: "resource_divisibility", value: "indivisible" }
      ]
    },
    reasoning_paths: [{
      framework: "Utilitarianism",
      conclusion: "criteria_based_selection",
      strength: "moderate",
      argument: "With indivisible resources, a criteria-based approach selects those who will benefit most."
    }]
  },
  {
    situation: {
      contextual_factors: [
        { factor: "resource_divisibility", value: "divisible" }
      ]
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "strong", "Divisible resources should strengthen utilitarian conclusion");
    assert(adaptedPaths[0].argument.includes("divisible"), 
      "Argument should mention flexibility with divisible resources");
  }
);

// Test 4: Direct rule test with object format
testAdaptationRule(
  "adaptResourceDivisibilityRule",
  adaptResourceDivisibilityRule,
  "Resource Divisibility Direct Test - Object Format",
  {
    framework: "Utilitarianism",
    conclusion: "criteria_based_selection",
    strength: "moderate",
    argument: "Original argument..."
  },
  {
    situation: {
      parameters: {
        resource_divisibility: { value: "divisible" }
      }
    }
  },
  {
    situation: {
      parameters: {
        resource_divisibility: { value: "indivisible" }
      }
    }
  },
  (adaptedPath) => {
    assert(adaptedPath.strength === "strong", "Strength should be strengthened");
    assert(adaptedPath.argument.includes("divisible"), "Argument should mention divisibility");
  }
);

// Test 5: Direct rule test with string format
testAdaptationRule(
  "adaptResourceDivisibilityRule",
  adaptResourceDivisibilityRule,
  "Resource Divisibility Direct Test - String Format",
  {
    framework: "Utilitarianism",
    conclusion: "criteria_based_selection",
    strength: "moderate",
    argument: "Original argument..."
  },
  {
    situation: {
      parameters: {
        resource_divisibility: { value: "divisible" }
      }
    }
  },
  {
    situation: {
      parameters: {
        resource_divisibility: { value: "indivisible" }
      }
    }
  },
  (adaptedPath) => {
    assert(adaptedPath.strength === "strong", "Strength should be strengthened");
    assert(adaptedPath.argument.includes("divisible"), "Argument should mention divisibility");
  }
);

// Print summary
console.log("\n==================================================");
console.log(`TESTING COMPLETE: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(2)}%)`);
console.log("=================================================="); 