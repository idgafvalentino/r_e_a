// test-diagnostic.js
// Simplified diagnostic version of test-comprehensive-granular-conflicts.js

/**
 * This simplified test script aims to identify issues with 
 * test-comprehensive-granular-conflicts.js by running components one by one
 */

// Import necessary modules
console.log('Starting test-diagnostic.js...');

try {
  console.log('Importing modules...');
  
  // Try importing each module separately to identify which one might be failing
  try {
    const conflictDetection = require('../src/conflictDetection');
    console.log('✓ Successfully imported conflictDetection');
  } catch (error) {
    console.error('✗ Failed to import conflictDetection:', error.message);
  }
  
  try {
    const conflictResolution = require('../src/conflictResolution');
    console.log('✓ Successfully imported conflictResolution');
  } catch (error) {
    console.error('✗ Failed to import conflictResolution:', error.message);
  }
  
  try {
    const frameworkRegistry = require('../src/frameworkRegistry');
    console.log('✓ Successfully imported frameworkRegistry');
  } catch (error) {
    console.error('✗ Failed to import frameworkRegistry:', error.message);
  }
  
  try {
    const utils = require('../src/utils');
    console.log('✓ Successfully imported utils');
    
    // Check if createGranularElements exists in utils
    if (typeof utils.createGranularElements === 'function') {
      console.log('✓ createGranularElements function found in utils');
    } else {
      console.error('✗ createGranularElements function not found in utils');
    }
  } catch (error) {
    console.error('✗ Failed to import utils:', error.message);
  }
  
  // Define a simple test dilemma
  console.log('\nCreating test dilemma...');
  const dilemmaData = {
    id: 'test_dilemma',
    title: 'Test Dilemma',
    description: 'A simplified test dilemma.',
    possible_actions: [
      { action: 'action_a', predicted_consequences: 'Consequence A' },
      { action: 'action_b', predicted_consequences: 'Consequence B' }
    ],
    actions: {
      "action_a": { description: "Action A" },
      "action_b": { description: "Action B" }
    },
    frameworks: ["utilitarianism", "deontology"],
    parameters: {
      parameter_1: { value: 0.5, description: "Parameter 1" }
    }
  };
  
  console.log('✓ Test dilemma created');
  
  // Create a simple reasoning path
  console.log('\nCreating test reasoning path...');
  const testPath = {
    id: 'test_path',
    framework: 'Test Framework',
    framework_id: 'test_framework',
    framework_type: 'pure',
    conclusion: 'action_a',
    strength: 'moderate',
    action: 'action_a',
    argument: 'This is a test argument.',
    source_elements: []
  };
  
  console.log('✓ Test reasoning path created');
  
  // Try to create granular elements
  console.log('\nTrying to create granular elements...');
  try {
    // Import required functions first
    const { createGranularElements, determineFrameworkType } = require('../src/utils');
    
    const elements = createGranularElements(
      testPath.framework,
      testPath.action,
      "Test principle",
      "Test justification",
      "Test objection",
      "Test response",
      testPath.conclusion,
      testPath.strength,
      { actionRelevance: 0.9 }
    );
    
    console.log(`✓ Successfully created ${elements.length} granular elements`);
  } catch (error) {
    console.error('✗ Failed to create granular elements:', error.message);
  }
  
  // Try to detect conflicts
  console.log('\nTrying to detect conflicts...');
  try {
    const { detectAllConflicts } = require('../src/conflictDetection');
    const conflicts = detectAllConflicts([testPath, {...testPath, id: 'test_path_2', framework: 'Another Framework'}]);
    console.log(`✓ Successfully detected conflicts: ${conflicts.all ? conflicts.all.length : 'null'}`);
  } catch (error) {
    console.error('✗ Failed to detect conflicts:', error.message);
  }
  
  // Try to resolve conflicts
  console.log('\nTrying to resolve conflicts...');
  try {
    const { resolveConflicts } = require('../src/conflictResolution');
    const mockConflict = {
      type: 'VALUE',
      framework1: 'Test Framework',
      framework2: 'Another Framework',
      paths: [testPath, {...testPath, id: 'test_path_2', framework: 'Another Framework'}]
    };
    
    const resolution = resolveConflicts(
      [testPath, {...testPath, id: 'test_path_2', framework: 'Another Framework'}],
      [mockConflict],
      dilemmaData,
      [],
      { strategy: 'balance' }
    );
    
    console.log(`✓ Successfully resolved conflicts: ${resolution.resolutions ? resolution.resolutions.length : 'null'}`);
  } catch (error) {
    console.error('✗ Failed to resolve conflicts:', error.message);
  }
  
  console.log('\nDiagnostic test completed!');
} catch (error) {
  console.error('Unhandled error in diagnostic test:', error);
} 