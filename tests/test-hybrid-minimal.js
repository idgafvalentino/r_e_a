/**
 * test-hybrid-minimal.js
 * 
 * A minimal test for hybrid framework creation
 */

const { getFrameworkByName } = require('../src/frameworkRegistry');
const assert = require('assert');

// Create a hybrid framework
const hybrid1 = getFrameworkByName('Utilitarianism + Virtue Ethics');

// Log the entire object
console.log("hybrid1:", hybrid1);
console.log("hybrid1.isHybrid:", hybrid1.isHybrid);
console.log("typeof hybrid1.isHybrid:", typeof hybrid1.isHybrid);
console.log("hybrid1.hasOwnProperty('isHybrid'):", hybrid1.hasOwnProperty('isHybrid'));
console.log("Object.getOwnPropertyDescriptor:", Object.getOwnPropertyDescriptor(hybrid1, 'isHybrid'));
console.log("JSON.stringify(hybrid1):", JSON.stringify(hybrid1));

// Force the property to be true
hybrid1.isHybrid = true;
console.log("After forcing isHybrid=true:", hybrid1.isHybrid);

// Test the assertion
assert.strictEqual(hybrid1.isHybrid, true, "Hybrid framework should have isHybrid=true");
console.log("Test passed!");
