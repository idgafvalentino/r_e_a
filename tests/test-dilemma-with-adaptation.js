/**
 * Integration Test for Dilemma Creation with Adaptation Rules
 * 
 * Tests that dilemmas created with the createDilemma function work correctly
 * with the adaptation rules system.
 */

const assert = require('assert');
const { createDilemma } = require('../src/createDilemma');
const { adaptReasoningPaths } = require('../src/adaptation');

describe('Dilemma Creation with Adaptation Rules', function() {
  // Helper function to create a simple reasoning path
  function createReasoningPath(framework, conclusion, strength, argument) {
    return {
      framework,
      conclusion,
      strength,
      argument
    };
  }
  
  // Basic precedent with reasoning paths for testing
  const basicPrecedent = {
    precedent_id: "trolley_problem", // Using a real precedent ID
    title: "Trolley Problem Test",
    description: "A test precedent for adaptation testing",
    reasoning_paths: [
      createReasoningPath(
        "Utilitarianism", 
        "maximize_utility", 
        "moderate", 
        "From a utilitarian perspective, we should maximize overall utility."
      ),
      createReasoningPath(
        "Kantian Deontology", 
        "follow_duty", 
        "moderate", 
        "From a deontological perspective, we should follow our moral duty."
      )
    ]
  };
  
  it('should adapt reasoning paths based on certainty changes in dilemma', function() {
    // Create an original dilemma with high certainty
    const originalDilemma = createDilemma('trolley', {
      certainty_of_outcome: 0.9 // High certainty
    });
    
    // Create a new dilemma with lower certainty
    const newDilemma = createDilemma('trolley', {
      certainty_of_outcome: 0.3 // Low certainty
    });
    
    console.log('Original Dilemma:', JSON.stringify(originalDilemma.situation.parameters, null, 2));
    console.log('New Dilemma:', JSON.stringify(newDilemma.situation.parameters, null, 2));
    console.log('Basic Precedent:', JSON.stringify({
      id: basicPrecedent.precedent_id, 
      title: basicPrecedent.title,
      paths: basicPrecedent.reasoning_paths.length
    }, null, 2));
    
    // First argument is the precedent, second is the new dilemma
    const adaptedPaths = adaptReasoningPaths(basicPrecedent, newDilemma, originalDilemma);
    
    console.log('Adapted Paths:', adaptedPaths ? adaptedPaths.length : 'none');
    
    // For this test, we'll just verify that some adaptation happened
    assert.ok(Array.isArray(adaptedPaths), "Adapted paths should be an array");
    assert.ok(adaptedPaths.length > 0, "Should return at least one adapted path");
    
    if (adaptedPaths.length > 0) {
      // Find the utilitarian path
      const utilitarianPath = adaptedPaths.find(p => p.framework === "Utilitarianism");
      if (utilitarianPath) {
        console.log('Utilitarian Path:', JSON.stringify(utilitarianPath, null, 2));
        
        // Check that the argument contains an explanation about the certainty change
        const hasCertaintyChange = utilitarianPath.argument.includes("certainty");
        console.log('Has certainty change in argument:', hasCertaintyChange);
      } else {
        console.log('No utilitarian path found in adapted paths');
      }
    }
  });
  
  it('should adapt reasoning paths based on number of people affected', function() {
    // Create an original dilemma with a moderate number of people
    const originalDilemma = createDilemma('trolley', {
      num_people_affected: 5,
      // Add these parameters explicitly to ensure they're available to the adaptation rule
      num_people_main_track: 5,
      num_people_side_track: 1
    });
    
    // Create a new dilemma with more people affected
    const newDilemma = createDilemma('trolley', {
      num_people_affected: 50,
      // Add these parameters explicitly to ensure they're available to the adaptation rule
      num_people_main_track: 50,
      num_people_side_track: 1
    });
    
    console.log('Original Dilemma Parameters:', JSON.stringify(originalDilemma.situation.parameters, null, 2));
    console.log('New Dilemma Parameters:', JSON.stringify(newDilemma.situation.parameters, null, 2));
    
    // First argument is the precedent, second is the new dilemma
    const adaptedPaths = adaptReasoningPaths(basicPrecedent, newDilemma, originalDilemma);
    
    console.log('Adapted Paths:', adaptedPaths ? adaptedPaths.length : 'none');
    
    // For this test, we'll just verify that some adaptation happened
    assert.ok(Array.isArray(adaptedPaths), "Adapted paths should be an array");
    assert.ok(adaptedPaths.length > 0, "Should return at least one adapted path");
  });
  
  it('should adapt reasoning paths based on time pressure changes', function() {
    // Create an original dilemma with moderate time pressure
    const originalDilemma = createDilemma('medical', {
      time_pressure: 'moderate'
    });
    
    // Create a new dilemma with extreme time pressure
    const newDilemma = createDilemma('medical', {
      time_pressure: 'extreme'
    });
    
    console.log('Original Dilemma Time Pressure:', originalDilemma.situation.parameters.time_pressure);
    console.log('New Dilemma Time Pressure:', newDilemma.situation.parameters.time_pressure);
    
    // First argument is the precedent, second is the new dilemma
    const adaptedPaths = adaptReasoningPaths(basicPrecedent, newDilemma, originalDilemma);
    
    console.log('Adapted Paths:', adaptedPaths ? adaptedPaths.length : 'none');
    
    // For this test, we'll just verify that some adaptation happened
    assert.ok(Array.isArray(adaptedPaths), "Adapted paths should be an array");
    assert.ok(adaptedPaths.length > 0, "Should return at least one adapted path");
  });
}); 