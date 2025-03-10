/**
 * Focused Test for Property Value Adaptation Rule
 */

const assert = require('assert');
const { adaptReasoningPaths } = require('../src/adaptation');
const { adaptPropertyValueRule } = require('../src/adaptationRules');
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

// ===== TEST SUITE FOR PROPERTY VALUE RULE =====
console.log("\n==================================================");
console.log("TESTING ADAPTATION RULE: adaptPropertyValueRule");
console.log("==================================================");

// Test 1: Property value adaptation - high to low
testAdaptation(
  "Property Value Adaptation - High to Low",
  {
    precedent_id: "heinz_dilemma",
    situation: {
      parameters: {
        property_value: { value: "high" },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        life_at_stake: { value: true }
      },
      contextual_factors: [
        { factor: "resource_value", value: "high" },
        { factor: "time_pressure", value: "moderate" }
      ]
    },
    reasoning_paths: [{
      framework: "Utilitarianism",
      conclusion: "context_dependent",
      strength: "moderate",
      argument: "Under Utilitarianism, the high property value must be weighed against other factors."
    }]
  },
  {
    situation: {
      parameters: {
        property_value: { value: "low" },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        life_at_stake: { value: true }
      },
      contextual_factors: [
        { factor: "resource_value", value: "low" },
        { factor: "time_pressure", value: "moderate" }
      ]
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "strong", "Lower property value should strengthen utilitarian conclusion");
    assert(adaptedPaths[0].argument.includes("decreased") && adaptedPaths[0].argument.includes("strengthens"), 
      "Argument should mention decreased property value strengthening the argument");
  }
);

// Test 2: Property value adaptation - low to high
testAdaptation(
  "Property Value - Low to High",
  {
    precedent_id: "heinz_dilemma",
    situation: {
      parameters: {
        property_value: { value: "low" },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        life_at_stake: { value: true }
      }
    },
    reasoning_paths: [{
      framework: "Natural Law Theory",
      conclusion: "steal_drug",
      strength: "strong",
      argument: "Under Natural Law Theory, the low property value compared to life makes this a clear case."
    }]
  },
  {
    situation: {
      parameters: {
        property_value: { value: "high" },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        life_at_stake: { value: true }
      }
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].argument.includes("increased"), 
      "Argument should mention increased property value");
  }
);

// Test 3: Property value from contextual factors
testAdaptation(
  "Property Value From Contextual Factors",
  {
    precedent_id: "heinz_dilemma",
    situation: {
      contextual_factors: [
        { factor: "resource_value", value: "low" }
      ]
    },
    reasoning_paths: [{
      framework: "Utilitarianism",
      conclusion: "steal_drug",
      strength: "moderate",
      argument: "With low property value, the utilitarian calculus favors action."
    }]
  },
  {
    situation: {
      contextual_factors: [
        { factor: "resource_value", value: "high" }
      ]
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "weak", "Higher property value from contextual factors should weaken utilitarian conclusion");
    assert(adaptedPaths[0].argument.includes("increased"), 
      "Argument should mention increased property value");
  }
);

// Test 4: Direct rule test with string format - low to high
testAdaptationRule(
  "adaptPropertyValueRule",
  adaptPropertyValueRule,
  "Property Value Direct Test - Low to High",
  {
    framework: "Utilitarianism",
    conclusion: "steal_drug",
    strength: "moderate",
    argument: "Original argument..."
  },
  {
    situation: {
      parameters: {
        property_value: { value: "high" }
      }
    }
  },
  {
    situation: {
      parameters: {
        property_value: { value: "low" }
      }
    }
  },
  (adaptedPath) => {
    assert(adaptedPath.strength === "weak", "Strength should be weakened");
    assert(adaptedPath.argument.includes("increased"), "Argument should mention increased property value");
    assert(!adaptedPath.argument.includes("decreased"), "Argument should not mention decreased property value");
  }
);

// Test 5: Test with Kantian framework where strength doesn't change
testAdaptationRule(
  "adaptPropertyValueRule",
  adaptPropertyValueRule,
  "Property Value Direct Test - Kantian Framework",
  {
    framework: "Kantian Deontology",
    conclusion: "context_dependent",
    strength: "moderate",
    argument: "Original argument..."
  },
  {
    situation: {
      parameters: {
        property_value: { value: "high" }
      }
    }
  },
  {
    situation: {
      parameters: {
        property_value: { value: "low" }
      }
    }
  },
  (adaptedPath) => {
    assert(adaptedPath.strength === "moderate", "Strength should remain unchanged for Kantian ethics");
    assert(adaptedPath.argument.includes("increased"), "Argument should mention increased property value");
    assert(!adaptedPath.argument.includes("decreased"), "Argument should not mention decreased property value");
    assert(adaptedPath.argument.includes("material context"), "Argument should mention material context not changing moral duties");
  }
);

// Print summary
console.log("\n==================================================");
console.log(`TESTING COMPLETE: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(2)}%)`);
console.log("=================================================="); 