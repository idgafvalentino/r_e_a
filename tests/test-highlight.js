// Test script for the highlightChanges function
const utils = require('./utils');

// Run the highlightChanges test function
utils.testHighlightChanges();

// Additional tests with real examples from the ethical reasoning paths
console.log("\n=== TESTING WITH REAL EXAMPLES ===");

// Real example from number of people rule
const originalArg = "Pulling the lever leads to one death instead of five, minimizing the total harm. The moral value of an action is determined by its consequences, specifically its utility in maximizing happiness or minimizing suffering. In this case, the death of one person represents less suffering than the death of five people.";

const adaptedArg = "Pulling the lever leads to one death instead of five, minimizing the total harm. The moral value of an action is determined by its consequences, specifically its utility in maximizing happiness or minimizing suffering. In this case, the death of one person represents less suffering than the death of five people. This conclusion is strengthened by the higher ratio of people saved (5:1).";

console.log("Real Example Result:", utils.highlightChanges(originalArg, adaptedArg));

// Real example involving text replacement
const originalKantian = "Pulling the lever uses the one person as a means to save the five, violating the principle that persons should always be treated as ends in themselves, never merely as means.";

const adaptedKantian = "Pulling the lever violates the principle that persons should always be treated as ends in themselves.";

console.log("Removal Example Result:", utils.highlightChanges(originalKantian, adaptedKantian));

console.log("=== END TESTING ==="); 