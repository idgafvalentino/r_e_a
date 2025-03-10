/**
 * test-framework-enhancement.js
 * 
 * This script tests the enhanced framework reference structure 
 * added to reasoning elements.
 */

const { extractAndCombineReasoningElements } = require('../src/granular-extraction');

// Create a small test dilemma
const testDilemma = {
  id: 'test_dilemma',
  title: 'Test Dilemma',
  description: 'A test dilemma for framework reference enhancement testing',
  context: 'This is a simplified context for testing purposes.',
  possible_actions: [
    { action: 'action_a', predicted_consequences: 'Some consequences for A' },
    { action: 'action_b', predicted_consequences: 'Some consequences for B' }
  ],
  contextual_factors: [
    { factor: 'factor_1', description: 'Description of factor 1' }
  ]
};

// Create simplified test precedents
const testPrecedents = [
  {
    id: 'precedent_1',
    title: 'Test Precedent 1',
    description: 'A test precedent for framework reference enhancement testing',
    reasoning_paths: [
      {
        id: 'path_1',
        framework: 'consequentialism',
        argument: 'A simple consequentialist argument. The principle of utility states that we should maximize overall wellbeing.',
        strength: 'strong',
        conclusion: 'action_a'
      },
      {
        id: 'path_2',
        framework: 'rights_based',
        argument: 'A simple rights-based argument. People have the right to autonomy and dignity.',
        strength: 'moderate',
        conclusion: 'action_b'
      }
    ]
  },
  {
    id: 'precedent_2',
    title: 'Test Precedent 2',
    description: 'Another test precedent with a hybrid framework',
    reasoning_paths: [
      {
        id: 'path_3',
        framework: 'Hybrid: consequentialism + virtue_ethics',
        argument: 'A hybrid argument combining consequentialism and virtue ethics. Virtuous character leads to good consequences.',
        strength: 'strong',
        conclusion: 'action_a'
      }
    ]
  }
];

// Run the test
async function testFrameworkEnhancement() {
  console.log('===== TESTING FRAMEWORK REFERENCE ENHANCEMENT =====\n');
  
  try {
    // Extract reasoning elements with our enhanced framework references
    const result = extractAndCombineReasoningElements(testDilemma, testPrecedents);
    
    // Check if elements have the enhanced properties
    console.log(`Total elements extracted: ${result.extractedElements.length}`);
    
    // Sample some elements to check enhanced properties
    const sampleSize = Math.min(5, result.extractedElements.length);
    console.log(`\nExamining ${sampleSize} sample elements for enhanced properties:\n`);
    
    for (let i = 0; i < sampleSize; i++) {
      const element = result.extractedElements[i];
      
      console.log(`Element ${i+1}: ${element.element_type}`);
      console.log(`- Content: "${element.content.substring(0, 40)}..."`);
      console.log(`- Framework: ${element.framework}`);
      console.log(`- Framework ID: ${element.framework_id}`);
      console.log(`- Framework Type: ${element.framework_type}`);
      console.log(`- Other properties: id=${element.id}, weight=${element.weight}, relevance=${element.relevance}\n`);
    }
    
    // Check if hybrid frameworks are correctly identified
    const hybridElements = result.extractedElements.filter(e => e.framework_type === 'hybrid');
    console.log(`Elements with hybrid framework type: ${hybridElements.length}`);
    
    if (hybridElements.length > 0) {
      console.log(`Sample hybrid element: Framework=${hybridElements[0].framework}, Type=${hybridElements[0].framework_type}`);
    }
    
    // Check if framework IDs are correctly assigned
    const uniqueFrameworkIds = new Set(result.extractedElements.map(e => e.framework_id));
    console.log(`Number of unique framework IDs: ${uniqueFrameworkIds.size}`);
    
    console.log('\n===== FRAMEWORK REFERENCE ENHANCEMENT TEST COMPLETE =====');
    
    return {
      success: true,
      extractedElements: result.extractedElements,
      hybridElements: hybridElements,
      uniqueFrameworkIds: Array.from(uniqueFrameworkIds)
    };
  } catch (error) {
    console.error('Error during test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testFrameworkEnhancement().then(result => {
  if (result.success) {
    console.log('\n✅ Framework reference enhancement test PASSED');
  } else {
    console.log('\n❌ Framework reference enhancement test FAILED');
  }
}); 