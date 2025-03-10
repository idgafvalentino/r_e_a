/**
 * test-simplified-conflicts.js
 * 
 * Simplified version of test-comprehensive-granular-conflicts.js with more verbose logging
 */

// Import necessary modules
console.log('Starting simplified conflicts test...');

const { detectAllConflicts } = require('../src/conflictDetection');
const { resolveConflicts } = require('../src/conflictResolution');
const { getFrameworkByName } = require('../src/frameworkRegistry');
const { createGranularElements, determineFrameworkType } = require('../src/utils');
const fs = require('fs');

// Define test dilemma - Environmental Justice case
const dilemmaData = {
  id: 'env_justice_dilemma',
  title: 'Environmental Justice Dilemma',
  description: 'A community is facing potential health risks from a nearby industrial facility.',
  possible_actions: [
    {
      action: 'relocate_facility',
      predicted_consequences: 'Higher costs but reduced health risks'
    },
    {
      action: 'install_filters',
      predicted_consequences: 'Moderate costs with somewhat reduced health risks'
    }
  ],
  actions: {
    "relocate_facility": { description: "Move the facility to another location" },
    "install_filters": { description: "Install filtration systems" }
  },
  frameworks: ["consequentialism", "rights_based"],
  parameters: {
    health_impact: { value: 0.8, description: "Severity of health impacts" },
    economic_value: { value: 0.7, description: "Economic importance of the facility" }
  }
};

// Function to format text for display
function formatText(text, maxLength = 80) {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
}

// Generate a unique element ID
function generateElementId(path, type) {
  return `${path.framework.replace(/\s+/g, '_')}_${path.conclusion}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// Run the test
async function runSimplifiedTest() {
  console.log('===== SIMPLIFIED CONFLICT DETECTION TEST =====\n');
  
  // STEP 1: Use the dilemma directly
  console.log('STEP 1: Loading dilemma...');
  const dilemma = dilemmaData;
  console.log(`Using dilemma: ${dilemma.title}`);
  
  // STEP 2: Create reasoning paths with different frameworks
  console.log('\nSTEP 2: Creating reasoning paths with different frameworks...');
  
  // Get frameworks from registry
  const consequentialism = getFrameworkByName("Consequentialism") || { name: "Consequentialism" };
  const rightsBasedEthics = getFrameworkByName("Rights-Based Ethics") || { name: "Rights-Based Ethics" };
  
  console.log(`Frameworks from registry: ${consequentialism.name}, ${rightsBasedEthics.name}`);
  
  // Create reasoning paths directly
  const reasoningPaths = [
    // Consequentialism path - install filters
    {
      id: 'consequentialism_path',
      framework: consequentialism.name,
      framework_id: 'consequentialism',
      framework_type: 'pure',
      conclusion: 'install_filters',
      strength: 'strong',
      action: 'install_filters',
      argument: `From a consequentialist perspective, installing advanced filtration systems maximizes overall wellbeing by protecting health while preserving jobs.`,
      source_elements: [],
      stakeholder_scores: {
        'residents': 0.7,
        'workers': 0.7,
        'company_owners': 0.6
      }
    },
    
    // Rights-Based Ethics path - relocate facility
    {
      id: 'rights_based_path',
      framework: rightsBasedEthics.name,
      framework_id: 'rights_based',
      framework_type: 'pure',
      conclusion: 'relocate_facility',
      strength: 'strong',
      action: 'relocate_facility',
      argument: `From a rights-based perspective, residents have a fundamental right to clean air and a healthy environment that overrides economic considerations.`,
      source_elements: [],
      stakeholder_scores: {
        'residents': 0.9,
        'workers': 0.4,
        'company_owners': 0.3
      }
    }
  ];
  
  console.log(`Created ${reasoningPaths.length} reasoning paths with different frameworks`);
  
  // STEP 3: Create granular elements for each path
  console.log('\nSTEP 3: Creating granular elements for each path...');
  
  // Create granular elements for Consequentialism path
  const consequentialismElements = createGranularElements(
    reasoningPaths[0].framework,
    reasoningPaths[0].action,
    "Maximize overall wellbeing by balancing health and economic concerns",
    "Installing filters provides the optimal balance between health protection and economic stability",
    "Filters may not completely eliminate health risks",
    "Even partial risk reduction is better than no action, and the economic benefits are preserved",
    reasoningPaths[0].conclusion,
    reasoningPaths[0].strength,
    { actionRelevance: 0.9 }
  );
  
  // Create granular elements for Rights-Based Ethics path
  const rightsBasedElements = createGranularElements(
    reasoningPaths[1].framework,
    reasoningPaths[1].action,
    "Respect the fundamental right to health and clean environment",
    "Relocating the facility is the only way to fully protect residents' rights to health",
    "Relocation may violate workers' rights to economic security",
    "Health rights take precedence over economic considerations when both cannot be fully satisfied",
    reasoningPaths[1].conclusion,
    reasoningPaths[1].strength,
    { actionRelevance: 0.85 }
  );
  
  // Combine all granular elements
  const allGranularElements = [
    ...consequentialismElements,
    ...rightsBasedElements
  ];
  
  // Assign granular elements to their respective reasoning paths
  reasoningPaths[0].source_elements = consequentialismElements;
  reasoningPaths[1].source_elements = rightsBasedElements;
  
  console.log(`Created ${allGranularElements.length} granular elements across all reasoning paths`);
  
  // STEP 4: Add artificial conflicts
  console.log('\nSTEP 4: Adding artificial conflicts...');
  
  // Add conflicting principles between consequentialism and rights-based ethics
  const consequentialismPrinciple = reasoningPaths[0].source_elements.find(e => e.type === 'principle');
  const rightsBasedPrinciple = reasoningPaths[1].source_elements.find(e => e.type === 'principle');
  
  if (consequentialismPrinciple && rightsBasedPrinciple) {
    // Add direct conflict reference
    consequentialismPrinciple.conflicting_principles = [rightsBasedPrinciple.content];
    rightsBasedPrinciple.conflicting_principles = [consequentialismPrinciple.content];
    
    console.log('Added principle conflicts between consequentialism and rights-based ethics');
  } else {
    console.log('Could not find principle elements to create conflicts');
  }
  
  // Save the reasoning paths with granular elements
  try {
    fs.writeFileSync('./tests/simplified-paths.json', JSON.stringify(reasoningPaths, null, 2));
    console.log('Saved reasoning paths with granular elements to tests/simplified-paths.json');
  } catch (error) {
    console.error('Error saving paths:', error.message);
  }
  
  // STEP 5: Detect conflicts
  console.log('\nSTEP 5: Detecting conflicts between reasoning paths...');
  
  const conflicts = detectAllConflicts(reasoningPaths);
  
  // Display summary of detected conflicts
  console.log('\nCONFLICT DETECTION SUMMARY:');
  console.log(`Total conflicts: ${conflicts.all.length}`);
  console.log(`Same-action conflicts: ${conflicts.sameAction.length}`);
  console.log(`Cross-action conflicts: ${conflicts.crossAction.length}`);
  
  try {
    // Save detected conflicts for inspection
    fs.writeFileSync('./tests/simplified-conflicts.json', JSON.stringify(conflicts, null, 2));
    console.log('Saved detected conflicts to tests/simplified-conflicts.json');
  } catch (error) {
    console.error('Error saving conflicts:', error.message);
  }
  
  // STEP 6: Test a resolution strategy
  console.log('\nSTEP 6: Testing balance resolution strategy...');
  
  // Helper function to enhance conflicts with paths info
  const enhanceConflictsWithPathsInfo = (conflicts, allPaths) => {
    if (!conflicts || !allPaths) return conflicts;
    
    return conflicts.map(conflict => {
      if (conflict.paths && Array.isArray(conflict.paths) && conflict.paths.length >= 2) {
        return conflict;
      }
      
      // Find the actual paths for framework1 and framework2
      let path1, path2;
      
      if (conflict.framework1) {
        path1 = allPaths.find(p => p.framework === conflict.framework1);
      }
      if (conflict.framework2) {
        path2 = allPaths.find(p => p.framework === conflict.framework2);
      }
      
      if (!path1 && conflict.framework1_id) {
        path1 = allPaths.find(p => p.id === conflict.framework1_id || p.framework_id === conflict.framework1_id);
      }
      if (!path2 && conflict.framework2_id) {
        path2 = allPaths.find(p => p.id === conflict.framework2_id || p.framework_id === conflict.framework2_id);
      }
      
      if (path1 && path2) {
        return {
          ...conflict,
          paths: [path1, path2]
        };
      }
      
      return conflict;
    });
  };
  
  // Apply balance resolution strategy
  try {
    console.log("Applying balance resolution strategy...");
    let enhancedConflicts = { 
      sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
      crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
    };
    enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
    
    const balanceResolutions = resolveConflicts(reasoningPaths, enhancedConflicts.all, dilemmaData, allGranularElements, { strategy: 'balance' });
    console.log(`Generated ${balanceResolutions.resolutions ? balanceResolutions.resolutions.length : 0} balance resolutions`);
    
    try {
      // Save the balance resolutions to a file
      fs.writeFileSync('tests/simplified-balance-result.json', JSON.stringify(balanceResolutions, null, 2));
      console.log('Saved balance resolutions to tests/simplified-balance-result.json');
    } catch (error) {
      console.error('Error saving balance resolutions:', error.message);
    }
  } catch (error) {
    console.error('Error resolving conflicts with balance strategy:', error.message);
  }
  
  console.log('\n===== TEST COMPLETE =====');
  
  return {
    dilemma,
    reasoningPaths,
    conflicts,
    balanceResolutions: balanceResolutions ? balanceResolutions.resolutions || [] : []
  };
}

// Run the test
console.log('Running simplified test...');
runSimplifiedTest().then(results => {
  console.log('\nTest completed successfully!');
}).catch(error => {
  console.error('Error during test execution:', error);
}); 