/**
 * Test for Dilemma Creation Functionality
 * 
 * Tests the createDilemma and validateDilemma functions to ensure
 * they create dilemmas with all required parameters.
 */

const assert = require('assert');
const { createDilemma, validateDilemma } = require('../src/createDilemma');

describe('Dilemma Creation', function() {
  it('should create a valid trolley dilemma with all required parameters', function() {
    const dilemma = createDilemma('trolley');
    const validation = validateDilemma(dilemma);
    
    assert.strictEqual(validation.success, true, `Missing parameters: ${validation.missingParameters.join(', ')}`);
    assert.strictEqual(dilemma.title, 'Trolley Dilemma');
    assert.strictEqual(dilemma.situation.type, 'Ethical Dilemma');
    assert.strictEqual(dilemma.possible_actions.length, 2);
    assert.strictEqual(dilemma.situation.parameters.num_people_main_track.value, 5);
  });
  
  it('should create a valid medical dilemma with all required parameters', function() {
    const dilemma = createDilemma('medical');
    const validation = validateDilemma(dilemma);
    
    assert.strictEqual(validation.success, true, `Missing parameters: ${validation.missingParameters.join(', ')}`);
    assert.strictEqual(dilemma.title, 'Medical Dilemma');
    assert.strictEqual(dilemma.situation.type, 'Medical Ethics');
    assert.strictEqual(dilemma.possible_actions.length, 3);
    assert.strictEqual(dilemma.situation.parameters.medical_context.value, 'hospital_emergency');
  });
  
  it('should create a valid resource dilemma with all required parameters', function() {
    const dilemma = createDilemma('resource');
    const validation = validateDilemma(dilemma);
    
    assert.strictEqual(validation.success, true, `Missing parameters: ${validation.missingParameters.join(', ')}`);
    assert.strictEqual(dilemma.title, 'Resource Dilemma');
    assert.strictEqual(dilemma.situation.type, 'Resource Allocation');
    assert.strictEqual(dilemma.possible_actions.length, 4);
    assert.strictEqual(dilemma.situation.parameters.resource_type.value, 'essential');
  });
  
  it('should create a valid property dilemma with all required parameters', function() {
    const dilemma = createDilemma('property');
    const validation = validateDilemma(dilemma);
    
    assert.strictEqual(validation.success, true, `Missing parameters: ${validation.missingParameters.join(', ')}`);
    assert.strictEqual(dilemma.title, 'Property Dilemma');
    assert.strictEqual(dilemma.situation.type, 'Property Ethics');
    assert.strictEqual(dilemma.possible_actions.length, 4);
    assert.strictEqual(dilemma.situation.parameters.property_type.value, 'private');
  });
  
  it('should create a generic dilemma when an unknown type is provided', function() {
    const dilemma = createDilemma('unknown');
    const validation = validateDilemma(dilemma);
    
    assert.strictEqual(validation.success, true, `Missing parameters: ${validation.missingParameters.join(', ')}`);
    assert.strictEqual(dilemma.title, 'Unknown Dilemma');
    assert.strictEqual(dilemma.possible_actions.length, 0);
  });
  
  it('should allow customization of dilemma properties', function() {
    const dilemma = createDilemma('trolley', {
      title: 'Custom Trolley Problem',
      description: 'A custom trolley problem description',
      certainty_of_outcome: 0.3,
      num_people_main_track: 10,
      num_people_side_track: 2
    });
    
    assert.strictEqual(dilemma.title, 'Custom Trolley Problem');
    assert.strictEqual(dilemma.description, 'A custom trolley problem description');
    assert.strictEqual(dilemma.situation.parameters.certainty_of_outcome.value, 0.3);
    assert.strictEqual(dilemma.situation.parameters.num_people_main_track.value, 10);
    assert.strictEqual(dilemma.situation.parameters.num_people_side_track.value, 2);
  });
  
  it('should detect missing parameters in invalid dilemmas', function() {
    const invalidDilemma = {
      title: 'Invalid Dilemma',
      description: 'A dilemma with missing parameters',
      situation: {
        type: 'Generic',
        context: ['Test'],
        parameters: {
          // Missing most parameters
          certainty_of_outcome: { value: 0.5 }
        }
      }
    };
    
    const validation = validateDilemma(invalidDilemma);
    assert.strictEqual(validation.success, false);
    assert.ok(validation.missingParameters.length > 0);
  });
}); 