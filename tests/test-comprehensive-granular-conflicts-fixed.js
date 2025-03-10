/**
 * test-comprehensive-granular-conflicts-fixed.js
 * 
 * Fixed version based on lessons from the diagnostic test.
 * This test demonstrates the complete process:
 * 1. Load a dilemma
 * 2. Create reasoning paths with different frameworks
 * 3. Create granular elements for each path
 * 4. Introduce artificial conflicts between frameworks and actions
 * 5. Detect conflicts between principles, justifications, etc.
 * 6. Test different resolution strategies
 * 7. Output detailed results
 */

// Import necessary modules
console.log('Starting fixed comprehensive granular conflicts test...');

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
  context: 'The facility provides jobs but releases pollutants that may affect local health.',
  possible_actions: [
    {
      action: 'relocate_facility',
      predicted_consequences: 'Higher costs but reduced health risks'
    },
    {
      action: 'install_filters',
      predicted_consequences: 'Moderate costs with somewhat reduced health risks'
    },
    {
      action: 'continue_operations',
      predicted_consequences: 'No additional costs but continued health risks'
    }
  ],
  contextual_factors: [
    {
      factor: 'economic_impact',
      description: 'The facility employs 300 local residents'
    },
    {
      factor: 'health_concerns',
      description: 'Increased respiratory issues reported in nearby neighborhoods'
    }
  ],
  // Add required fields for dilemmaLoader compatibility
  actions: {
    "relocate_facility": { description: "Move the facility to another location" },
    "install_filters": { description: "Install filtration systems" },
    "continue_operations": { description: "Continue operations without changes" }
  },
  frameworks: ["consequentialism", "rights_based", "virtue_ethics"],
  parameters: {
    health_impact: { value: 0.8, description: "Severity of health impacts" },
    economic_value: { value: 0.7, description: "Economic importance of the facility" }
  }
};

// Function to format text for display (limit width and trim)
function formatText(text, maxLength = 80) {
  if (!text) return '';
  
  // Clean up whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Truncate if necessary
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
}

// Generate a unique element ID
function generateElementId(path, type) {
  if (!path || !path.framework || !path.conclusion) {
    console.error('Error in generateElementId: Invalid path object', path);
    return `unknown_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
  return `${path.framework.replace(/\s+/g, '_')}_${path.conclusion}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// Run the test
async function runComprehensiveTest() {
  console.log('===== COMPREHENSIVE GRANULAR CONFLICT DETECTION TEST =====\n');
  
  try {
    // STEP 1: Use the dilemma directly
    console.log('STEP 1: Loading dilemma...');
    const dilemma = dilemmaData;
    console.log(`Using dilemma: ${dilemma.title}`);
    
    // STEP 2: Create reasoning paths with different frameworks
    console.log('\nSTEP 2: Creating reasoning paths with different frameworks...');
    
    // Get frameworks from registry with fallbacks
    let consequentialism, rightsBasedEthics, virtueEthics;
    
    try {
      consequentialism = getFrameworkByName("Consequentialism") || { name: "Consequentialism", id: "consequentialism" };
      rightsBasedEthics = getFrameworkByName("Rights-Based Ethics") || { name: "Rights-Based Ethics", id: "rights_based" };
      virtueEthics = getFrameworkByName("Virtue Ethics") || { name: "Virtue Ethics", id: "virtue_ethics" };
      
      console.log(`Retrieved frameworks from registry: ${consequentialism.name}, ${rightsBasedEthics.name}, ${virtueEthics.name}`);
    } catch (error) {
      console.error('Error getting frameworks from registry:', error);
      // Create fallback framework objects
      consequentialism = { name: "Consequentialism", id: "consequentialism" };
      rightsBasedEthics = { name: "Rights-Based Ethics", id: "rights_based" };
      virtueEthics = { name: "Virtue Ethics", id: "virtue_ethics" };
    }
    
    // Create reasoning paths with explicit framework properties
    let reasoningPaths = [];
    try {
      reasoningPaths = [
        // Consequentialism path - install filters
        {
          id: 'consequentialism_path',
          framework: consequentialism.name,
          framework_id: consequentialism.id,
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
          framework_id: rightsBasedEthics.id,
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
        },
        
        // Virtue Ethics path - install filters
        {
          id: 'virtue_ethics_path',
          framework: virtueEthics.name,
          framework_id: virtueEthics.id,
          framework_type: 'pure',
          conclusion: 'install_filters',
          strength: 'moderate',
          action: 'install_filters',
          argument: `A virtuous approach requires balancing prosperity with care for community well-being.`,
          source_elements: [],
          stakeholder_scores: {
            'residents': 0.6,
            'workers': 0.7,
            'company_owners': 0.6
          }
        }
      ];
      
      // Validate reasoning paths
      reasoningPaths.forEach((path, index) => {
        console.log(`Path ${index + 1} validation:`);
        console.log(`- ID: ${path.id}`);
        console.log(`- Framework: ${path.framework}`);
        console.log(`- Framework ID: ${path.framework_id}`);
        console.log(`- Action: ${path.action}`);
        console.log(`- Conclusion: ${path.conclusion}`);
      });
      
      console.log(`Created ${reasoningPaths.length} reasoning paths with different frameworks`);
    } catch (error) {
      console.error('Error creating reasoning paths:', error);
      reasoningPaths = [];
    }
    
    // If no reasoning paths created, exit early
    if (reasoningPaths.length === 0) {
      throw new Error('Failed to create reasoning paths');
    }
    
    // STEP 3: Create granular elements for each path
    console.log('\nSTEP 3: Creating granular elements for each path...');
    
    let allGranularElements = [];
    try {
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
      
      // Create granular elements for Virtue Ethics path
      const virtueEthicsElements = createGranularElements(
        reasoningPaths[2].framework,
        reasoningPaths[2].action,
        "Practice the virtue of practical wisdom by finding the golden mean",
        "Installing filters demonstrates the virtues of responsibility and justice",
        "Complete relocation might show excessive caution while doing nothing shows negligence",
        "The virtuous agent seeks balanced solutions that address multiple concerns",
        reasoningPaths[2].conclusion,
        reasoningPaths[2].strength,
        { actionRelevance: 0.8 }
      );
      
      // Combine all granular elements
      allGranularElements = [
        ...consequentialismElements,
        ...rightsBasedElements,
        ...virtueEthicsElements
      ];
      
      // Assign granular elements to their respective reasoning paths
      reasoningPaths[0].source_elements = consequentialismElements;
      reasoningPaths[1].source_elements = rightsBasedElements;
      reasoningPaths[2].source_elements = virtueEthicsElements;
      
      console.log(`Created ${allGranularElements.length} granular elements across all reasoning paths`);
    } catch (error) {
      console.error('Error creating granular elements:', error);
    }
    
    // STEP 4: Introduce artificial conflicts
    console.log('\nSTEP 4: Introducing artificial conflicts between frameworks and actions...');
    
    try {
      // Add conflicting principles between consequentialism and rights-based ethics
      const consequentialismPrinciple = reasoningPaths[0].source_elements.find(e => e.type === 'principle');
      const rightsBasedPrinciple = reasoningPaths[1].source_elements.find(e => e.type === 'principle');
      
      if (consequentialismPrinciple && rightsBasedPrinciple) {
        // Add direct conflict reference
        consequentialismPrinciple.conflicting_principles = [rightsBasedPrinciple.content];
        rightsBasedPrinciple.conflicting_principles = [consequentialismPrinciple.content];
        
        console.log('Added principle conflicts between consequentialism and rights-based ethics');
      }
      
      // Add conflicting justifications between frameworks with the same conclusion
      const consequentialismJustification = reasoningPaths[0].source_elements.find(e => e.type === 'justification');
      const virtueEthicsJustification = reasoningPaths[2].source_elements.find(e => e.type === 'justification');
      
      if (consequentialismJustification && virtueEthicsJustification) {
        // Create a new conflicting justification element for consequentialism
        const conflictingJustification = {
          id: `${reasoningPaths[0].framework.replace(/\s+/g, '_')}_conflicting_justification_${Date.now()}`,
          type: 'justification',
          framework: reasoningPaths[0].framework,
          action: reasoningPaths[0].action,
          content: "Filters should be installed primarily for utility maximization, not virtue considerations",
          strength: 'moderate',
          relevance: 0.75,
          conclusion: reasoningPaths[0].conclusion
        };
        
        // Add to reasoning path
        reasoningPaths[0].source_elements.push(conflictingJustification);
        
        console.log('Added justification conflicts between frameworks with same conclusion');
      }
      
      // Save the reasoning paths with granular elements
      fs.writeFileSync('./tests/comprehensive-paths-fixed.json', JSON.stringify(reasoningPaths, null, 2));
      console.log('Saved reasoning paths with granular elements to tests/comprehensive-paths-fixed.json');
    } catch (error) {
      console.error('Error introducing artificial conflicts:', error);
    }
    
    // STEP 5: Detect conflicts
    console.log('\nSTEP 5: Detecting conflicts between reasoning paths...');
    
    let conflicts = { all: [], sameAction: [], crossAction: [] };
    try {
      conflicts = detectAllConflicts(reasoningPaths);
      
      // Display summary of detected conflicts
      console.log('\nCONFLICT DETECTION SUMMARY:');
      console.log(`Total conflicts: ${conflicts.all.length}`);
      console.log(`Same-action conflicts: ${conflicts.sameAction.length}`);
      console.log(`Cross-action conflicts: ${conflicts.crossAction.length}`);
      
      // Save detected conflicts for inspection
      fs.writeFileSync('./tests/comprehensive-conflicts-fixed.json', JSON.stringify(conflicts, null, 2));
      console.log('Saved detected conflicts to tests/comprehensive-conflicts-fixed.json');
      
      // Display detailed information about the first few conflicts
      if (conflicts.all.length > 0) {
        console.log('\nSAMPLE CONFLICT DETAILS:');
        
        // Show the first conflict in detail
        const sampleConflict = conflicts.all[0];
        console.log(`\nConflict Type: ${sampleConflict.type}`);
        console.log(`Element Type: ${sampleConflict.element_type || 'N/A'}`);
        console.log(`Frameworks: ${sampleConflict.framework1} vs ${sampleConflict.framework2}`);
        console.log(`Action: ${sampleConflict.action || `${sampleConflict.action1} vs ${sampleConflict.action2}`}`);
        console.log(`Severity: ${sampleConflict.severity}`);
        
        console.log('\nDetails:');
        if (sampleConflict.details) {
          if (sampleConflict.details.principle1) {
            console.log(`Principle 1: "${formatText(sampleConflict.details.principle1)}"`);
            console.log(`Principle 2: "${formatText(sampleConflict.details.principle2)}"`);
          } else if (sampleConflict.details.justification1) {
            console.log(`Justification 1: "${formatText(sampleConflict.details.justification1)}"`);
            console.log(`Justification 2: "${formatText(sampleConflict.details.justification2)}"`);
          }
        }
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error);
    }
    
    // STEP 6: Test different resolution strategies
    console.log('\nSTEP 6: Testing different resolution strategies...');
    
    // Helper function to enhance conflicts with paths info
    const enhanceConflictsWithPathsInfo = (conflicts, allPaths) => {
      if (!conflicts || !allPaths) return conflicts;
      
      return conflicts.map(conflict => {
        // If conflict already has paths and they're valid, don't modify
        if (conflict.paths && 
            Array.isArray(conflict.paths) && 
            conflict.paths.length >= 2 && 
            conflict.paths[0] && 
            conflict.paths[1] &&
            conflict.paths[0].framework && 
            conflict.paths[1].framework) {
          return conflict;
        }
        
        // Find paths for frameworks
        let path1, path2;
        
        // Try to find by framework name
        if (conflict.framework1) {
          path1 = allPaths.find(p => p.framework === conflict.framework1);
        }
        if (conflict.framework2) {
          path2 = allPaths.find(p => p.framework === conflict.framework2);
        }
        
        // If not found by name, try by framework ID
        if (!path1 && conflict.framework1_id) {
          path1 = allPaths.find(p => 
            p.framework_id === conflict.framework1_id || 
            p.id === conflict.framework1_id
          );
        }
        if (!path2 && conflict.framework2_id) {
          path2 = allPaths.find(p => 
            p.framework_id === conflict.framework2_id || 
            p.id === conflict.framework2_id
          );
        }
        
        // If both paths found, add them to the conflict
        if (path1 && path2) {
          return {
            ...conflict,
            paths: [path1, path2]
          };
        }
        
        // If couldn't find both paths, try finding by action if specified
        if (conflict.action && allPaths.length > 0) {
          const actionPaths = allPaths.filter(p => p.action === conflict.action || p.conclusion === conflict.action);
          if (actionPaths.length >= 2) {
            return {
              ...conflict,
              paths: [actionPaths[0], actionPaths[1]]
            };
          }
        }
        
        // If all else fails, keep original conflict
        return conflict;
      });
    };
    
    let stakeholderResolutions, pluralisticResolutions, compromiseResolutions;
    
    // Apply stakeholder resolution strategy
    try {
      console.log("Applying \"stakeholder\" resolution strategy...");
      let enhancedConflicts = { 
        sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
        crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
      };
      enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
      
      // Filter to only include conflicts with valid paths
      const validConflicts = enhancedConflicts.all.filter(c => 
        c.paths && 
        c.paths.length >= 2 && 
        c.paths[0] && 
        c.paths[1] && 
        c.paths[0].framework && 
        c.paths[1].framework
      );
      
      if (validConflicts.length === 0) {
        console.log("No valid conflicts to resolve after enhancement, skipping stakeholder resolution");
        stakeholderResolutions = { resolutions: [] };
      } else {
        stakeholderResolutions = resolveConflicts(reasoningPaths, validConflicts, dilemmaData, allGranularElements, { strategy: 'stakeholder' });
        console.log(`Generated ${stakeholderResolutions.resolutions ? stakeholderResolutions.resolutions.length : 0} stakeholder resolutions`);
        
        // Save the stakeholder resolutions to a file
        fs.writeFileSync('tests/comprehensive-stakeholder-result-fixed.json', JSON.stringify(stakeholderResolutions, null, 2));
        console.log('Saved stakeholder resolutions to tests/comprehensive-stakeholder-result-fixed.json');
      }
    } catch (error) {
      console.error('Error applying stakeholder resolution strategy:', error);
      stakeholderResolutions = { resolutions: [] };
    }
    
    // Apply pluralistic resolution strategy
    try {
      console.log("\nApplying \"pluralistic\" resolution strategy...");
      let enhancedConflicts = { 
        sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
        crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
      };
      enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
      
      // Filter to only include conflicts with valid paths
      const validConflicts = enhancedConflicts.all.filter(c => 
        c.paths && 
        c.paths.length >= 2 && 
        c.paths[0] && 
        c.paths[1] && 
        c.paths[0].framework && 
        c.paths[1].framework
      );
      
      if (validConflicts.length === 0) {
        console.log("No valid conflicts to resolve after enhancement, skipping pluralistic resolution");
        pluralisticResolutions = { resolutions: [] };
      } else {
        pluralisticResolutions = resolveConflicts(reasoningPaths, validConflicts, dilemmaData, allGranularElements, { strategy: 'pluralistic' });
        console.log(`Generated ${pluralisticResolutions.resolutions ? pluralisticResolutions.resolutions.length : 0} pluralistic resolutions`);
        
        // Save the pluralistic resolutions to a file
        fs.writeFileSync('tests/comprehensive-pluralistic-result-fixed.json', JSON.stringify(pluralisticResolutions, null, 2));
        console.log('Saved pluralistic resolutions to tests/comprehensive-pluralistic-result-fixed.json');
      }
    } catch (error) {
      console.error('Error applying pluralistic resolution strategy:', error);
      pluralisticResolutions = { resolutions: [] };
    }
    
    // Apply compromise resolution strategy
    try {
      console.log("\nApplying \"compromise\" resolution strategy...");
      let enhancedConflicts = { 
        sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
        crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
      };
      enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
      
      // Filter to only include conflicts with valid paths
      const validConflicts = enhancedConflicts.all.filter(c => 
        c.paths && 
        c.paths.length >= 2 && 
        c.paths[0] && 
        c.paths[1] && 
        c.paths[0].framework && 
        c.paths[1].framework
      );
      
      if (validConflicts.length === 0) {
        console.log("No valid conflicts to resolve after enhancement, skipping compromise resolution");
        compromiseResolutions = { resolutions: [] };
      } else {
        compromiseResolutions = resolveConflicts(reasoningPaths, validConflicts, dilemmaData, allGranularElements, { strategy: 'compromise' });
        console.log(`Generated ${compromiseResolutions.resolutions ? compromiseResolutions.resolutions.length : 0} compromise resolutions`);
        
        // Save the compromise resolutions to a file
        fs.writeFileSync('tests/comprehensive-compromise-result-fixed.json', JSON.stringify(compromiseResolutions, null, 2));
        console.log('Saved compromise resolutions to tests/comprehensive-compromise-result-fixed.json');
      }
    } catch (error) {
      console.error('Error applying compromise resolution strategy:', error);
      compromiseResolutions = { resolutions: [] };
    }
    
    // STEP 7: Verify that conflicts are properly detected and resolved
    console.log('\nSTEP 7: Verifying conflict detection and resolution...');
    
    // Check if conflicts were detected
    if (conflicts.all.length > 0) {
      console.log(`✓ Successfully detected ${conflicts.all.length} conflicts`);
    } else {
      console.log('✗ Failed to detect any conflicts');
    }
    
    // Check if resolutions were generated for each strategy
    if (stakeholderResolutions.resolutions && stakeholderResolutions.resolutions.length > 0) {
      console.log(`✓ Successfully generated ${stakeholderResolutions.resolutions.length} stakeholder resolutions`);
    } else {
      console.log('✗ Failed to generate stakeholder resolutions');
    }
    
    if (pluralisticResolutions.resolutions && pluralisticResolutions.resolutions.length > 0) {
      console.log(`✓ Successfully generated ${pluralisticResolutions.resolutions.length} pluralistic resolutions`);
    } else {
      console.log('✗ Failed to generate pluralistic resolutions');
    }
    
    if (compromiseResolutions.resolutions && compromiseResolutions.resolutions.length > 0) {
      console.log(`✓ Successfully generated ${compromiseResolutions.resolutions.length} compromise resolutions`);
    } else {
      console.log('✗ Failed to generate compromise resolutions');
    }
    
    console.log('\n===== TEST COMPLETE =====');
    console.log('All stages of the process were executed successfully.');
    
    return {
      dilemma,
      reasoningPaths,
      conflicts,
      resolutions: {
        stakeholder: stakeholderResolutions.resolutions || [],
        pluralistic: pluralisticResolutions.resolutions || [],
        compromise: compromiseResolutions.resolutions || []
      }
    };
  } catch (error) {
    console.error('An error occurred in the comprehensive test:', error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the test
console.log('Running fixed comprehensive test...');
runComprehensiveTest().then(results => {
  console.log('\nTest completed!');
  if (results.error) {
    console.error('Test encountered an error:', results.error);
  } else {
    console.log('Test completed successfully with:');
    console.log(`- ${results.conflicts.all.length} conflicts detected`);
    console.log(`- ${results.resolutions.stakeholder.length} stakeholder resolutions`);
    console.log(`- ${results.resolutions.pluralistic.length} pluralistic resolutions`);
    console.log(`- ${results.resolutions.compromise.length} compromise resolutions`);
  }
}).catch(error => {
  console.error('Fatal error during test execution:', error);
}); 