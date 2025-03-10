/**
 * Focused Test for Life vs Property Adaptation Rule
 */

const assert = require('assert');
const { adaptReasoningPaths } = require('../src/adaptation');
const { adaptLifeVsPropertyRule } = require('../src/adaptationRules');
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

// ===== TEST SUITE FOR LIFE VS PROPERTY RULE =====
console.log("\n==================================================");
console.log("TESTING ADAPTATION RULE: adaptLifeVsPropertyRule");
console.log("==================================================");

// Test 1: Life vs Property adaptation - Life at stake to no life at stake
testAdaptation(
  "Life vs Property Adaptation - Life at Stake to No Life at Stake",
  {
    precedent_id: "heinz_dilemma",
    situation: {
      parameters: {
        life_at_stake: { value: true },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        property_value: { value: "moderate" }
      },
      contextual_factors: [
        { factor: "life_threatened", value: true },
        { factor: "time_pressure", value: "moderate" }
      ]
    },
    reasoning_paths: [{
      framework: "Natural Law Theory",
      conclusion: "steal_drug",
      strength: "strong",
      argument: "When life is at stake, Natural Law prioritizes life preservation over property rights."
    }]
  },
  {
    situation: {
      parameters: {
        life_at_stake: { value: false },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        property_value: { value: "moderate" }
      },
      contextual_factors: [
        { factor: "life_threatened", value: false },
        { factor: "time_pressure", value: "moderate" }
      ]
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "moderate", "No longer life at stake should weaken Natural Law conclusion");
    assert.match(adaptedPaths[0].argument, /life.*no longer at stake/i, "Argument should mention life no longer at stake");
  }
);

// Test 2: Life vs Property - No life at stake to life at stake
testAdaptation(
  "Life vs Property - No Life at Stake to Life at Stake",
  {
    precedent_id: "heinz_dilemma",
    situation: {
      parameters: {
        life_at_stake: { value: false },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        property_value: { value: "moderate" }
      },
      contextual_factors: [
        { factor: "life_threatened", value: false },
        { factor: "time_pressure", value: "moderate" }
      ]
    },
    reasoning_paths: [{
      framework: "Utilitarianism",
      conclusion: "seek_alternatives",
      strength: "moderate",
      argument: "Without life at stake, utilitarian calculus balances multiple considerations."
    }]
  },
  {
    situation: {
      parameters: {
        life_at_stake: { value: true },
        num_people_affected: { value: 2 },
        certainty_of_outcome: { value: 0.9 },
        relationship_to_beneficiary: { value: "family_member" },
        property_value: { value: "moderate" }
      },
      contextual_factors: [
        { factor: "life_threatened", value: true },
        { factor: "time_pressure", value: "moderate" }
      ]
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "strong", "Life now at stake should strengthen utilitarian conclusion");
    assert(adaptedPaths[0].argument.includes("now at stake") && adaptedPaths[0].argument.includes("dramatically"), 
      "Argument should mention life now at stake dramatically changing the calculus");
  }
);

// Test 3: Life threat from contextual factors
testAdaptation(
  "Life Threat From Contextual Factors",
  {
    precedent_id: "heinz_dilemma",
    situation: {
      contextual_factors: [
        { factor: "life_threatened", value: true }
      ]
    },
    reasoning_paths: [{
      framework: "Natural Law Theory",
      conclusion: "steal_drug",
      strength: "strong",
      argument: "When life is threatened, Natural Law prioritizes life preservation."
    }]
  },
  {
    situation: {
      contextual_factors: [
        { factor: "life_threatened", value: false }
      ]
    }
  },
  (adaptedPaths) => {
    assert(adaptedPaths[0].strength === "moderate", "Life no longer threatened should weaken Natural Law conclusion");
    assert.match(adaptedPaths[0].argument, /no longer at stake/i, "Argument should mention life no longer at stake");
  }
);

// Test 4: String value format test
testAdaptationRule(
  "adaptLifeVsPropertyRule",
  adaptLifeVsPropertyRule,
  "Life vs Property Direct Test - String Format",
  {
    framework: "Utilitarianism",
    conclusion: "steal_drug",
    strength: "moderate",
    argument: "Original argument..."
  },
  {
    parameters: {
      life_at_stake: { value: false }
    },
    situation: {
      parameters: {
        life_at_stake: { value: false }
      }
    }
  },
  {
    parameters: {
      life_at_stake: { value: true }
    },
    situation: {
      parameters: {
        life_at_stake: { value: true }
      }
    }
  },
  (adaptedPath) => {
    const util = getFrameworkByName("Utilitarianism");
    const virtue = getFrameworkByName("Virtue Ethics");
    const natural = getFrameworkByName("Natural Law Theory");
    const care = getFrameworkByName("Care Ethics");
    const kantian = getFrameworkByName("Kantian Ethics");
    
    assert(adaptedPath.strength === "weak", "Strength should be weakened");
    assert.match(adaptedPath.argument, /no longer at stake/i, "Argument should mention life no longer at stake");
  }
);

// Test 5: Test with Kantian framework where strength doesn't change
testAdaptationRule(
  "adaptLifeVsPropertyRule",
  adaptLifeVsPropertyRule,
  "Life vs Property Direct Test - Kantian Framework",
  {
    framework: "Kantian Deontology",
    conclusion: "context_dependent",
    strength: "moderate",
    argument: "Original argument..."
  },
  {
    parameters: {
      life_at_stake: { value: false }
    },
    situation: {
      parameters: {
        life_at_stake: { value: false }
      }
    }
  },
  {
    parameters: {
      life_at_stake: { value: true }
    },
    situation: {
      parameters: {
        life_at_stake: { value: true }
      }
    }
  },
  (adaptedPath) => {
    assert(adaptedPath.strength === "moderate", "Strength should remain unchanged for Kantian ethics");
    assert.match(adaptedPath.argument, /life.*at stake/i, "Argument should mention life now at stake");
    assert(adaptedPath.argument.includes("dignity"), "Argument should mention human dignity");
  }
);

// Test 6: Test with Care Ethics framework
testAdaptationRule(
  "adaptLifeVsPropertyRule",
  adaptLifeVsPropertyRule,
  "Life vs Property Direct Test - Care Ethics Framework",
  {
    framework: "Care Ethics",
    conclusion: "steal_drug",
    strength: "strong",
    argument: "Original argument..."
  },
  {
    parameters: {
      life_at_stake: { value: false }
    },
    situation: {
      parameters: {
        life_at_stake: { value: false }
      }
    }
  },
  {
    parameters: {
      life_at_stake: { value: true }
    },
    situation: {
      parameters: {
        life_at_stake: { value: true }
      }
    }
  },
  (adaptedPath) => {
    assert(adaptedPath.strength === "moderate", "Strength should be weakened for Care Ethics");
    assert(adaptedPath.argument.includes("caring response"), "Argument should mention caring response");
  }
);

// Print summary
console.log("\n==================================================");
console.log(`TESTING COMPLETE: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(2)}%)`);
console.log("=================================================="); 