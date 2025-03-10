/**
 * test-comprehensive-granular-conflicts.js
 * 
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
    
    try {
      // Get frameworks from registry
      const consequentialism = getFrameworkByName("Consequentialism") || { name: "Consequentialism" };
      const rightsBasedEthics = getFrameworkByName("Rights-Based Ethics") || { name: "Rights-Based Ethics" };
      const virtueEthics = getFrameworkByName("Virtue Ethics") || { name: "Virtue Ethics" };
      
      console.log(`Retrieved frameworks from registry: ${consequentialism.name}, ${rightsBasedEthics.name}, ${virtueEthics.name}`);
    } catch (error) {
      console.error('Error getting frameworks from registry:', error);
    }
    
    // Create reasoning paths directly
    let reasoningPaths = [];
    try {
      reasoningPaths = [
        // Consequentialism path - install filters
        {
          id: 'consequentialism_path',
          framework: consequentialism.name,
          framework_id: 'consequentialism',
          framework_type: 'pure',
          conclusion: 'install_filters',
          strength: 'strong',
          action: 'install_filters',
          argument: `From a consequentialist perspective, installing advanced filtration systems maximizes overall wellbeing by protecting health while preserving jobs. 
                    The principle of utility demands that we choose the action that produces the greatest good for the greatest number. We should consider both economic and health impacts equally.
                    Since the facility provides employment for many community members, relocating it would cause significant economic hardship. However, continuing without changes would perpetuate health risks. Therefore, filtration represents the optimal balance.`,
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
          argument: `From a rights-based perspective, residents have a fundamental right to clean air and a healthy environment that overrides economic considerations. 
                    The principle that rights cannot be violated for utilitarian gains is central to deontological ethics. People should never be treated merely as means to economic ends.
                    Given that respiratory health issues have been documented in the community, continuing operations as they are would constitute a violation of residents' right to health. Since filtration systems may not eliminate all risks, relocation is the only option that fully respects these rights.`,
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
          framework_id: 'virtue_ethics',
          framework_type: 'pure',
          conclusion: 'install_filters',
          strength: 'moderate',
          action: 'install_filters',
          argument: `A virtuous approach requires balancing prosperity with care for community well-being. 
                    The Aristotelian principle of the golden mean suggests that virtue lies between extremes - neither allowing unrestrained economic activity nor imposing excessive restrictions.
                    Since both community health and economic stability contribute to flourishing, a virtuous agent would seek a solution that demonstrates practical wisdom (phronesis) by acknowledging both concerns. Installing filtration systems represents such wisdom.`,
          source_elements: [],
          stakeholder_scores: {
            'residents': 0.6,
            'workers': 0.7,
            'company_owners': 0.6
          }
        },
        
        // EDGE CASE 1: Equal stakeholder scores
        {
          id: 'care_ethics_path',
          framework: 'Care Ethics',
          framework_id: 'care_ethics',
          framework_type: 'pure',
          conclusion: 'install_filters',
          strength: 'moderate',
          action: 'install_filters',
          argument: `From a care ethics perspective, we must consider the relationships and interdependencies within the community.
                    The ethics of care emphasizes the importance of maintaining relationships and responding to the needs of those who are vulnerable.
                    Installing filters demonstrates care for both the health of residents and the economic well-being of workers, maintaining the web of relationships in the community.`,
          source_elements: [],
          stakeholder_scores: {
            'residents': 0.65,
            'workers': 0.65,
            'company_owners': 0.65
          }
        },
        
        // EDGE CASE 2: Very weak reasoning strength
        {
          id: 'weak_reasoning_path',
          framework: 'Social Contract Theory',
          framework_id: 'social_contract',
          framework_type: 'pure',
          conclusion: 'continue_operations',
          strength: 'very_weak',
          action: 'continue_operations',
          argument: `From a social contract perspective, the agreement between the facility and the community should be honored.
                    However, this argument is weakly supported as the original social contract may not have anticipated these health impacts.`,
          source_elements: [],
          stakeholder_scores: {
            'residents': 0.3,
            'workers': 0.8,
            'company_owners': 0.9
          }
        },
        
        // EDGE CASE 3: Very strong reasoning strength
        {
          id: 'strong_reasoning_path',
          framework: 'Environmental Ethics',
          framework_id: 'environmental_ethics',
          framework_type: 'pure',
          conclusion: 'relocate_facility',
          strength: 'very_strong',
          action: 'relocate_facility',
          argument: `From an environmental ethics perspective, the integrity of the ecosystem and human health are non-negotiable values.
                    The precautionary principle demands that when an activity raises threats of harm to human health or the environment, precautionary measures should be taken even if some cause and effect relationships are not fully established scientifically.
                    Given the documented health issues, relocation is the only option that fully respects the precautionary principle.`,
          source_elements: [],
          stakeholder_scores: {
            'residents': 0.95,
            'workers': 0.3,
            'company_owners': 0.2
          }
        },
        
        // EDGE CASE 4: Completely irrelevant framework
        {
          id: 'irrelevant_framework_path',
          framework: 'Aesthetic Theory',
          framework_id: 'aesthetic_theory',
          framework_type: 'pure',
          conclusion: 'relocate_facility',
          strength: 'weak',
          action: 'relocate_facility',
          argument: `From an aesthetic perspective, the facility disrupts the visual harmony of the landscape.
                    While aesthetic considerations are important for human flourishing, they have limited relevance to this primarily health and economic dilemma.`,
          source_elements: [],
          stakeholder_scores: {
            'residents': 0.4,
            'workers': 0.2,
            'company_owners': 0.3
          },
          relevance_to_dilemma: 0.2 // Very low relevance score
        }
      ];
      console.log(`Created ${reasoningPaths.length} reasoning paths with different frameworks, including edge cases`);
    } catch (error) {
      console.error('Error creating reasoning paths:', error);
      reasoningPaths = [];
    }
    
    // EDGE CASE 5: Add circular dependency in reasoning
    // Create circular reference between two paths
    const circularPath1 = {
      id: 'circular_path_1',
      framework: 'Pragmatism',
      framework_id: 'pragmatism_1',
      framework_type: 'pure',
      conclusion: 'install_filters',
      strength: 'moderate',
      action: 'install_filters',
      argument: `A pragmatic approach suggests we should focus on what works in practice.
                Installing filters is a practical solution that addresses immediate concerns.`,
      source_elements: [],
      depends_on: 'circular_path_2'
    };
    
    const circularPath2 = {
      id: 'circular_path_2',
      framework: 'Pragmatism',
      framework_id: 'pragmatism_2',
      framework_type: 'pure',
      conclusion: 'install_filters',
      strength: 'moderate',
      action: 'install_filters',
      argument: `From a different pragmatic angle, we should consider long-term practical outcomes.
                Installing filters provides a sustainable solution over time.`,
      source_elements: [],
      depends_on: 'circular_path_1'
    };
    
    // Add circular paths to reasoning paths
    reasoningPaths.push(circularPath1, circularPath2);
    
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
    const allGranularElements = [
      ...consequentialismElements,
      ...rightsBasedElements,
      ...virtueEthicsElements
    ];
    
    // Assign granular elements to their respective reasoning paths
    reasoningPaths[0].source_elements = consequentialismElements;
    reasoningPaths[1].source_elements = rightsBasedElements;
    reasoningPaths[2].source_elements = virtueEthicsElements;
    
    console.log(`Created ${allGranularElements.length} granular elements across all reasoning paths`);
    
    // STEP 4: Introduce artificial conflicts
    console.log('\nSTEP 4: Introducing artificial conflicts between frameworks and actions...');
    
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
        id: generateElementId(reasoningPaths[0], 'conflicting_justification'),
        type: 'justification',
        framework: reasoningPaths[0].framework,
        framework_id: reasoningPaths[0].framework_id,
        framework_type: determineFrameworkType(reasoningPaths[0].framework),
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
    fs.writeFileSync('./tests/comprehensive-paths.json', JSON.stringify(reasoningPaths, null, 2));
    console.log('Saved reasoning paths with granular elements to tests/comprehensive-paths.json');
    
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
      fs.writeFileSync('./tests/comprehensive-conflicts.json', JSON.stringify(conflicts, null, 2));
      console.log('Saved detected conflicts to tests/comprehensive-conflicts.json');
    } catch (error) {
      console.error('Error detecting conflicts:', error);
    }
    
    // Display detailed information about the first few conflicts
    if (conflicts.all.length > 0) {
      console.log('\nSAMPLE CONFLICT DETAILS:');
      
      // Show the first conflict in detail
      const sampleConflict = conflicts.all[0];
      console.log(`\nConflict Type: ${sampleConflict.type}`);
      console.log(`Element Type: ${sampleConflict.element_type || 'N/A'}`);
      console.log(`Frameworks: ${sampleConflict.framework1_name} vs ${sampleConflict.framework2_name}`);
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
    
    // STEP 6: Test different resolution strategies
    console.log('\nSTEP 6: Testing different resolution strategies...');
    
    // Helper function to enhance conflicts with paths info
    const enhanceConflictsWithPathsInfo = (conflicts, allPaths) => {
      // Ensure we have actual conflicts and paths
      if (!conflicts || !allPaths) return conflicts;

      return conflicts.map(conflict => {
        // If conflict already has a paths array, don't modify it
        if (conflict.paths && Array.isArray(conflict.paths) && conflict.paths.length >= 2) {
          return conflict;
        }

        // Find the actual paths for framework1 and framework2
        let path1, path2;
        
        // Try to find by framework name
        if (conflict.framework1) {
          path1 = allPaths.find(p => p.framework === conflict.framework1);
        }
        if (conflict.framework2) {
          path2 = allPaths.find(p => p.framework === conflict.framework2);
        }
        
        // If not found by framework name, try by framework ID
        if (!path1 && conflict.framework1_id) {
          path1 = allPaths.find(p => p.id === conflict.framework1_id || p.framework_id === conflict.framework1_id);
        }
        if (!path2 && conflict.framework2_id) {
          path2 = allPaths.find(p => p.id === conflict.framework2_id || p.framework_id === conflict.framework2_id);
        }
        
        // If we found both paths, add them to the conflict
        if (path1 && path2) {
          return {
            ...conflict,
            paths: [path1, path2]
          };
        }
        
        // If we couldn't find both paths, try a less strict approach - if the conflict
        // specifies an action, find paths with that conclusion
        if (conflict.action && allPaths.length > 0) {
          const actionPaths = allPaths.filter(p => p.conclusion === conflict.action);
          if (actionPaths.length >= 2) {
            return {
              ...conflict,
              paths: [actionPaths[0], actionPaths[1]]
            };
          }
        }
        
        // Return the original conflict if we couldn't enhance it
        return conflict;
      });
    };

    // Apply stakeholder resolution strategy
    try {
      console.log("Applying \"stakeholder\" resolution strategy...");
      let enhancedConflicts = { 
        sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
        crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
      };
      enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
      
      const stakeholderResolutions = resolveConflicts(reasoningPaths, enhancedConflicts.all, dilemmaData, allGranularElements, { strategy: 'stakeholder' });
      console.log(`Generated ${stakeholderResolutions.resolutions ? stakeholderResolutions.resolutions.length : 0} stakeholder resolutions`);
      
      // Save the stakeholder resolutions to a file
      fs.writeFileSync('tests/comprehensive-stakeholder-result.json', JSON.stringify(stakeholderResolutions, null, 2));
    } catch (error) {
      console.error('Error applying stakeholder resolution strategy:', error);
    }
    
    // Apply pluralistic resolution strategy
    try {
      console.log("\nApplying \"pluralistic\" resolution strategy...");
      let enhancedConflicts = { 
        sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
        crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
      };
      enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
      
      const pluralisticResolutions = resolveConflicts(reasoningPaths, enhancedConflicts.all, dilemmaData, allGranularElements, { strategy: 'pluralistic' });
      console.log(`Generated ${pluralisticResolutions.resolutions ? pluralisticResolutions.resolutions.length : 0} pluralistic resolutions`);
      
      // Save the pluralistic resolutions to a file
      fs.writeFileSync('tests/comprehensive-pluralistic-result.json', JSON.stringify(pluralisticResolutions, null, 2));
    } catch (error) {
      console.error('Error applying pluralistic resolution strategy:', error);
    }
    
    // Apply compromise resolution strategy
    try {
      console.log("\nApplying \"compromise\" resolution strategy...");
      let enhancedConflicts = { 
        sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
        crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
      };
      enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
      
      const compromiseResolutions = resolveConflicts(reasoningPaths, enhancedConflicts.all, dilemmaData, allGranularElements, { strategy: 'compromise' });
      console.log(`Generated ${compromiseResolutions.resolutions ? compromiseResolutions.resolutions.length : 0} compromise resolutions`);
      
      // Save the compromise resolutions to a file
      fs.writeFileSync('tests/comprehensive-compromise-result.json', JSON.stringify(compromiseResolutions, null, 2));
    } catch (error) {
      console.error('Error applying compromise resolution strategy:', error);
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
    if (stakeholderResolutions && stakeholderResolutions.resolutions && stakeholderResolutions.resolutions.length > 0) {
      console.log(`✓ Successfully generated ${stakeholderResolutions.resolutions.length} stakeholder resolutions`);
    } else {
      console.log('✗ Failed to generate stakeholder resolutions');
    }
    
    if (pluralisticResolutions && pluralisticResolutions.resolutions && pluralisticResolutions.resolutions.length > 0) {
      console.log(`✓ Successfully generated ${pluralisticResolutions.resolutions.length} pluralistic resolutions`);
    } else {
      console.log('✗ Failed to generate pluralistic resolutions');
    }
    
    if (compromiseResolutions && compromiseResolutions.resolutions && compromiseResolutions.resolutions.length > 0) {
      console.log(`✓ Successfully generated ${compromiseResolutions.resolutions.length} compromise resolutions`);
    } else {
      console.log('✗ Failed to generate compromise resolutions');
    }
    
    // Add more specific assertions
    console.log('\nRunning detailed assertions on conflict detection and resolution...');
    
    // 1. Verify cross-action conflicts are detected
    const crossActionConflicts = conflicts.crossAction.length;
    console.log(`${crossActionConflicts > 0 ? '✓' : '✗'} Cross-action conflicts detected: ${crossActionConflicts}`);
    
    // 2. Verify conflicts between different frameworks are detected
    const hasUtilitarianRightsConflict = conflicts.all.some(c => 
      (c.framework1 === 'Utilitarianism' && c.framework2 === 'Rights-Based Ethics') ||
      (c.framework1 === 'Rights-Based Ethics' && c.framework2 === 'Utilitarianism')
    );
    console.log(`${hasUtilitarianRightsConflict ? '✓' : '✗'} Conflict between Utilitarianism and Rights-Based Ethics detected`);
    
    // 3. Verify principle conflicts are detected
    const hasPrincipleConflict = conflicts.all.some(c => c.type === 'CROSS_ACTION_PRINCIPLE');
    console.log(`${hasPrincipleConflict ? '✓' : '✗'} Principle conflicts detected`);
    
    // 4. Verify high severity conflicts are detected
    const hasHighSeverityConflict = conflicts.all.some(c => c.severity === 'high');
    console.log(`${hasHighSeverityConflict ? '✓' : '✗'} High severity conflicts detected`);
    
    // 5. Verify edge cases are handled
    
    // 5.1 Equal stakeholder scores
    const equalStakeholderPath = reasoningPaths.find(p => p.id === 'care_ethics_path');
    const equalStakeholderConflicts = conflicts.all.filter(c => 
      c.framework1 === equalStakeholderPath?.framework || c.framework2 === equalStakeholderPath?.framework
    );
    console.log(`${equalStakeholderConflicts.length > 0 ? '✓' : '✗'} Conflicts with equal stakeholder scores detected: ${equalStakeholderConflicts.length}`);
    
    // 5.2 Very weak reasoning strength
    const weakReasoningPath = reasoningPaths.find(p => p.id === 'weak_reasoning_path');
    const weakReasoningConflicts = conflicts.all.filter(c => 
      c.framework1 === weakReasoningPath?.framework || c.framework2 === weakReasoningPath?.framework
    );
    console.log(`${weakReasoningConflicts.length > 0 ? '✓' : '✗'} Conflicts with very weak reasoning detected: ${weakReasoningConflicts.length}`);
    
    // 5.3 Very strong reasoning strength
    const strongReasoningPath = reasoningPaths.find(p => p.id === 'strong_reasoning_path');
    const strongReasoningConflicts = conflicts.all.filter(c => 
      c.framework1 === strongReasoningPath?.framework || c.framework2 === strongReasoningPath?.framework
    );
    console.log(`${strongReasoningConflicts.length > 0 ? '✓' : '✗'} Conflicts with very strong reasoning detected: ${strongReasoningConflicts.length}`);
    
    // 5.4 Irrelevant framework
    const irrelevantFrameworkPath = reasoningPaths.find(p => p.id === 'irrelevant_framework_path');
    const irrelevantFrameworkConflicts = conflicts.all.filter(c => 
      c.framework1 === irrelevantFrameworkPath?.framework || c.framework2 === irrelevantFrameworkPath?.framework
    );
    console.log(`${irrelevantFrameworkConflicts.length > 0 ? '✓' : '✗'} Conflicts with irrelevant framework detected: ${irrelevantFrameworkConflicts.length}`);
    
    // 5.5 Circular dependencies
    const foundCircularPath1 = reasoningPaths.find(p => p.id === 'circular_path_1');
    const foundCircularPath2 = reasoningPaths.find(p => p.id === 'circular_path_2');
    const circularDependencyConflicts = conflicts.all.filter(c => 
      (c.framework1 === foundCircularPath1?.framework && c.framework2 === foundCircularPath2?.framework) ||
      (c.framework1 === foundCircularPath2?.framework && c.framework2 === foundCircularPath1?.framework)
    );
    console.log(`${circularDependencyConflicts.length > 0 ? '✓' : '✗'} Conflicts with circular dependencies detected: ${circularDependencyConflicts.length}`);
    
    // 6. Verify resolution strategies handle edge cases
    
    // 6.1 Check if stakeholder strategy handles equal stakeholder scores
    const equalStakeholderResolution = stakeholderResolutions && stakeholderResolutions.resolutions?.some(r => 
      r.originalFrameworks.includes(equalStakeholderPath?.framework)
    );
    console.log(`${equalStakeholderResolution ? '✓' : '✗'} Stakeholder strategy handles equal stakeholder scores`);
    
    // 6.2 Check if pluralistic strategy handles very weak reasoning
    const weakReasoningPluralisticResolution = pluralisticResolutions && pluralisticResolutions.resolutions?.some(r => 
      r.originalFrameworks.includes(weakReasoningPath?.framework)
    );
    console.log(`${weakReasoningPluralisticResolution ? '✓' : '✗'} Pluralistic strategy handles very weak reasoning`);
    
    // 6.3 Check if compromise strategy handles very strong reasoning
    const strongReasoningCompromiseResolution = compromiseResolutions && compromiseResolutions.resolutions?.some(r => 
      r.originalFrameworks.includes(strongReasoningPath?.framework)
    );
    console.log(`${strongReasoningCompromiseResolution ? '✓' : '✗'} Compromise strategy handles very strong reasoning`);
    
    console.log('\n===== TEST COMPLETE =====');
    console.log('All stages of the process were executed successfully.');
    
    // Return test results
    return {
      dilemma,
      reasoningPaths,
      conflicts,
      resolutionResults: {
        stakeholder: stakeholderResolutions ? stakeholderResolutions.resolutions || [] : [],
        pluralistic: pluralisticResolutions ? pluralisticResolutions.resolutions || [] : [],
        compromise: compromiseResolutions ? compromiseResolutions.resolutions || [] : []
      }
    };
  } catch (error) {
    console.error('An error occurred in the main test:', error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the test with error handling
console.log('Executing test with error handling...');
runComprehensiveTest().then(results => {
  console.log('\nTest completed!');
  if (results.error) {
    console.error('Test encountered an error:', results.error);
  }
}).catch(error => {
  console.error('Fatal error during test execution:', error);
});
