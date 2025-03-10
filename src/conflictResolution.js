/*
 * conflictResolution.js - Consolidated conflict resolution module
 * Combines functionalities from conflict-resolution.js and conflictResolution.js
 */

const { highlightChanges, deepClone, calculateStringSimilarity } = require('./utils');
const { extractPriorities } = require('./conflictDetection');

/**
 * Finds a framework by name or ID in reasoning paths
 * @param {string} frameworkIdentifier - The name or ID of the framework to find
 * @param {Array} reasoningPaths - Array of reasoning paths to search
 * @returns {Object|null} The framework object or null if not found
 */
function findFrameworkByName(frameworkIdentifier, reasoningPaths) {
    if (!frameworkIdentifier || !reasoningPaths) {
        return null;
    }
    
    // First try to find by framework name
    for (const path of reasoningPaths) {
        if (path.framework === frameworkIdentifier) {
            return path; // Return the framework object itself
        }
    }
    
    // Then try to find by ID if available
    for (const path of reasoningPaths) {
        if (path.id === frameworkIdentifier || path.framework_id === frameworkIdentifier) {
            return path;
        }
    }
    
    // If not found, try to find a partial match in framework names
    for (const path of reasoningPaths) {
        if (path.framework && frameworkIdentifier && 
            (path.framework.includes(frameworkIdentifier) || 
             frameworkIdentifier.includes(path.framework))) {
            return path;
        }
    }
    
    return null; // Return null if not found
}

/**
 * Gets a human-readable description of a priority level.
 * @param {string} priority - The priority level (e.g., "welfare", "rights", "community").
 * @returns {string} A description of the priority.
 */
function getPriorityDescription(priority) {
  switch (priority) {
    case 'welfare':
      return "primarily focuses on maximizing overall well-being and minimizing harm.";
    case 'rights':
      return "emphasizes the protection of individual rights and freedoms.";
    case 'community':
      return "prioritizes the needs and values of the community.";
        case "care":
            return "emphasizes the importance of relationships and care for others.";
        case "virtue":
            return "focuses on cultivating virtuous character traits.";
        case "justice":
            return "emphasizes fairness and equitable treatment.";
        case "autonomy":
            return "emphasizes respecting individual self-governance.";
        case "duty":
            return "focuses on fulfilling moral obligations and duties.";
        // Add other cases as needed for different priority types
    default:
            return `focuses on ${priority}.`; // Just return the priority if not found
    }
}

/**
 * Gets a human-readable description of a priority value
 * @param {string} priority - Priority value
 * @returns {string} Human-readable description
 */
function getPriorityValue(priority) {
    if (!priority) return "unspecified value";
    
    const priorityMap = {
        "welfare": "Overall well-being and happiness",
        "rights": "Individual rights and freedoms", 
        "justice": "Fairness and equality",
        "virtue": "Character and virtue development",
        "care": "Relationships and care for others",
        "community": "Community welfare and social bonds"
    };
    
    return priorityMap[priority] || priority;
}

/**
 * Represents a strategy for resolving ethical conflicts.
 * @typedef {Object} ResolutionStrategy
 * @property {string} type - The type of resolution strategy (e.g., "balance", "stakeholder", "compromise", "pluralism").
 * @property {string} description - A brief description of the strategy.
 * @property {function} resolve - A function that takes conflicts, reasoningPaths, and a dilemma and returns resolved paths.
 */

/**
 * A collection of predefined resolution strategies.
 * @type {Object.<string, ResolutionStrategy>}
 */
const resolutionStrategies = {
  balance: {
    type: "balance",
    description: "Balance resolution strategy using createBalancedArgument",
    resolve: (reasoningPaths, conflicts, dilemma, options = {}) => {
      if (!conflicts || conflicts.length === 0) {
        console.log("No conflicts to resolve with balance strategy.");
        return { resolutions: [] }; // Return an empty resolutions array
      }

      const resolutions = [];

      for (const conflict of conflicts) {
        // Ensure conflict has a frameworks array
        if (!conflict.frameworks) {
          // Try to create frameworks array from framework1/framework2 properties
          if (conflict.framework1_name && conflict.framework2_name) {
            conflict.frameworks = [conflict.framework1_name, conflict.framework2_name];
          } else if (conflict.framework1 && conflict.framework2) {
            conflict.frameworks = [conflict.framework1, conflict.framework2];
          } else {
            console.warn(`Skipping conflict with insufficient framework references: ${JSON.stringify(conflict)}`);
            continue;
          }
        }
        
        // Check if frameworks array has at least 2 elements
        if (!Array.isArray(conflict.frameworks) || conflict.frameworks.length < 2) {
          console.warn(`Skipping conflict with insufficient framework references: ${JSON.stringify(conflict)}`);
          continue;
        }
        // 1. Log the strategy being used
        console.log(`Applying balance strategy to resolve conflict between ${conflict.frameworks[0]} and ${conflict.frameworks[1]}`);

        // 2. Get proper Framework objects from framework registry
        const { getFrameworkByName } = require('./frameworkRegistry');
        const fw1 = getFrameworkByName(conflict.frameworks[0]);
        const fw2 = getFrameworkByName(conflict.frameworks[1]);

        // Handle Unknown Frameworks
        if (!fw1 || fw1.isUnknown || !fw2 || fw2.isUnknown) {
          console.warn(`Skipping conflict due to unknown framework: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict
        }

        // Find the actual reasoning path objects for these frameworks
        const framework1 = reasoningPaths.find(p => p.framework === conflict.frameworks[0]);
        const framework2 = reasoningPaths.find(p => p.framework === conflict.frameworks[1]);

        if (!framework1 || !framework2) {
          console.warn(`Could not find reasoning paths for both frameworks: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict if we don't have the reasoning paths
        }

        // Check for hybrid frameworks
        if (fw1.isHybrid || fw2.isHybrid) {
          console.log(`Handling hybrid framework resolution for ${fw1.name} or ${fw2.name}`);
          // Special handling for hybrid frameworks could be added here
          // For now, we'll continue with the standard approach
        }

        // 3. Strategy-specific logic - create balanced argument
        const argument = createBalancedArgument(framework1, framework2, conflict, dilemma);

        // 4. Return standardized resolution object
        resolutions.push({
          framework: `Reconciled ${fw1.name}-${fw2.name} (Balanced)`, // Consistent naming
          action: conflict.action,
          strength: determineStrength(fw1, fw2, conflict), // You'll implement this
          argument: argument,
          originalFrameworks: [fw1.name, fw2.name],
          conflictType: conflict.type,
          resolutionStrategy: 'balance',
          resolutionDescription: 'Resolves conflict by balancing competing ethical perspectives.'
        });
      }
      return { resolutions };
    }
  },

  stakeholder: {
    type: "stakeholder",
    description: "Stakeholder-focused resolution strategy",
    resolve: (reasoningPaths, conflicts, dilemma, options = {}) => {
      if (!conflicts || conflicts.length === 0) {
        console.log("No conflicts to resolve with stakeholder strategy.");
        return { resolutions: [] }; // Return an empty resolutions array
      }

      const resolutions = [];

      for (const conflict of conflicts) {
        if (!conflict.frameworks || conflict.frameworks.length < 2) {
          console.warn(`Skipping conflict with insufficient framework references: ${JSON.stringify(conflict)}`);
          continue;
        }
        // 1. Log the strategy being used
        console.log(`Applying stakeholder strategy to resolve conflict between ${conflict.frameworks[0]} and ${conflict.frameworks[1]}`);

        // 2. Get proper Framework objects from framework registry
        const { getFrameworkByName } = require('./frameworkRegistry');
        const fw1 = getFrameworkByName(conflict.frameworks[0]);
        const fw2 = getFrameworkByName(conflict.frameworks[1]);

        // Handle Unknown Frameworks
        if (!fw1 || fw1.isUnknown || !fw2 || fw2.isUnknown) {
          console.warn(`Skipping conflict due to unknown framework: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict
        }

        // Find the actual reasoning path objects for these frameworks
        const framework1 = reasoningPaths.find(p => p.framework === conflict.frameworks[0]);
        const framework2 = reasoningPaths.find(p => p.framework === conflict.frameworks[1]);

        if (!framework1 || !framework2) {
          console.warn(`Could not find reasoning paths for both frameworks: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict if we don't have the reasoning paths
        }

        // 3. Strategy-specific logic - create stakeholder argument
        const stakeholderArgument = createStakeholderAnalysisArgument(framework1, framework2, conflict, dilemma);

        // 4. Return standardized resolution object
        resolutions.push({
          framework: `Reconciled ${fw1.name}-${fw2.name} (Stakeholder)`,
          action: conflict.action,
          strength: determineStrength(fw1, fw2, conflict), // You'll implement this
          argument: stakeholderArgument,
          originalFrameworks: [fw1.name, fw2.name],
          conflictType: conflict.type,
          resolutionStrategy: 'stakeholder',
          resolutionDescription: 'Resolves conflict by prioritizing the interests of the most affected stakeholders.'
        });
      }
      return { resolutions };
    }
  },

  compromise: {
    type: "compromise",
    description: "Compromise resolution strategy",
    resolve: (reasoningPaths, conflicts, dilemma, options = {}) => {
      if (!conflicts || conflicts.length === 0) {
        console.log("No conflicts to resolve with compromise strategy.");
        return { resolutions: [] }; // Return an empty resolutions array
      }

      const resolutions = [];

      for (const conflict of conflicts) {
        if (!conflict.frameworks || conflict.frameworks.length < 2) {
          console.warn(`Skipping conflict with insufficient framework references: ${JSON.stringify(conflict)}`);
          continue;
        }
        // 1. Log the strategy being used
        console.log(`Applying compromise strategy to resolve conflict between ${conflict.frameworks[0]} and ${conflict.frameworks[1]}`);

        // 2. Get proper Framework objects from framework registry
        const { getFrameworkByName } = require('./frameworkRegistry');
        const fw1 = getFrameworkByName(conflict.frameworks[0]);
        const fw2 = getFrameworkByName(conflict.frameworks[1]);

        // Handle Unknown Frameworks
        if (!fw1 || fw1.isUnknown || !fw2 || fw2.isUnknown) {
          console.warn(`Skipping conflict due to unknown framework: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict
        }

        // Find the actual reasoning path objects for these frameworks
        const framework1 = reasoningPaths.find(p => p.framework === conflict.frameworks[0]);
        const framework2 = reasoningPaths.find(p => p.framework === conflict.frameworks[1]);

        if (!framework1 || !framework2) {
          console.warn(`Could not find reasoning paths for both frameworks: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict if we don't have the reasoning paths
        }

        // 3. Strategy-specific logic 
        // Generate compromise points and create argument
        const compromisePoints = identifyCompromisePoints(framework1, framework2, dilemma);
        const compromiseArgument = createCompromiseArgument(framework1, framework2, conflict, dilemma, compromisePoints);

        // 4. Return standardized resolution object
        resolutions.push({
          framework: `Reconciled ${fw1.name}-${fw2.name} (Compromise)`,
          action: conflict.action,
          strength: "moderate", // Default for compromise
          argument: compromiseArgument,
          originalFrameworks: [fw1.name, fw2.name],
          conflictType: conflict.type,
          resolutionStrategy: 'compromise',
          resolutionDescription: 'Resolves conflict by finding a middle ground between competing ethical frameworks.'
        });
      }
      return { resolutions };
    }
  },

  pluralistic: {
    type: "pluralistic",
    description: "Pluralistic resolution strategy",
    resolve: (reasoningPaths, conflicts, dilemma, options = {}) => {
      if (!conflicts || conflicts.length === 0) {
        console.log("No conflicts to resolve with pluralistic strategy.");
        return { resolutions: [] }; // Return an empty resolutions array
      }

      const resolutions = [];

      for (const conflict of conflicts) {
        if (!conflict.frameworks || conflict.frameworks.length < 2) {
          console.warn(`Skipping conflict with insufficient framework references: ${JSON.stringify(conflict)}`);
          continue;
        }
        // 1. Log the strategy being used
        console.log(`Applying pluralistic strategy to resolve conflict between ${conflict.frameworks[0]} and ${conflict.frameworks[1]}`);

        // 2. Get proper Framework objects from framework registry
        const { getFrameworkByName } = require('./frameworkRegistry');
        const fw1 = getFrameworkByName(conflict.frameworks[0]);
        const fw2 = getFrameworkByName(conflict.frameworks[1]);

        // Handle Unknown Frameworks
        if (!fw1 || fw1.isUnknown || !fw2 || fw2.isUnknown) {
          console.warn(`Skipping conflict due to unknown framework: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict
        }

        // Find the actual reasoning path objects for these frameworks
        const framework1 = reasoningPaths.find(p => p.framework === conflict.frameworks[0]);
        const framework2 = reasoningPaths.find(p => p.framework === conflict.frameworks[1]);

        if (!framework1 || !framework2) {
          console.warn(`Could not find reasoning paths for both frameworks: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict if we don't have the reasoning paths
        }

        // 3. Strategy-specific logic - create pluralistic argument
        const pluralisticArgument = createPluralisticArgument(framework1, framework2, conflict, dilemma);

        // 4. Return standardized resolution object
        resolutions.push({
          framework: `Multiple Perspectives: ${fw1.name} and ${fw2.name}`,
          action: conflict.action,
          strength: "variable", // Pluralistic approaches have variable strength
          argument: pluralisticArgument,
          originalFrameworks: [fw1.name, fw2.name],
          conflictType: conflict.type,
          resolutionStrategy: 'pluralistic',
          resolutionDescription: 'Acknowledges multiple valid ethical perspectives without enforcing a single resolution.'
        });
      }
      return { resolutions };
    }
  },

  fallback: {
    type: "fallback",
    description: "Fallback resolution strategy when other strategies aren't applicable",
    resolve: (reasoningPaths, conflicts, dilemma, options = {}) => {
      if (!conflicts || conflicts.length === 0) {
        console.log("No conflicts to resolve with fallback strategy.");
        return { resolutions: [] }; // Return an empty resolutions array
      }

      const resolutions = [];

      for (const conflict of conflicts) {
        if (!conflict.frameworks || conflict.frameworks.length < 2) {
          console.warn(`Skipping conflict with insufficient framework references: ${JSON.stringify(conflict)}`);
          continue;
        }

        // Find the actual reasoning path objects for these frameworks
        const framework1 = reasoningPaths.find(p => p.framework === conflict.frameworks[0]);
        const framework2 = reasoningPaths.find(p => p.framework === conflict.frameworks[1]);

        if (!framework1 || !framework2) {
          console.warn(`Could not find reasoning paths for both frameworks in fallback: ${conflict.frameworks[0]} vs ${conflict.frameworks[1]}`);
          continue; // Skip this conflict if we don't have the reasoning paths
        }

        // Create fallback resolution
        const fallbackResolution = generateFallbackResolution(conflict, framework1, framework2, dilemma);
        resolutions.push(fallbackResolution);
      }
      return { resolutions };
    }
  }
};

/**
 * Selects the appropriate resolution strategy based on conflict type, dilemma, and user preferences.
 * @param {Array} reasoningPaths - Reasoning paths from different ethical frameworks
 * @param {Array} conflicts - Detected conflicts between reasoning paths
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} options - Options including user preferences
 * @returns {Object} The selected resolution strategy
 */
function selectResolutionStrategy(reasoningPaths, conflicts, dilemma, options = {}) {
  // Log the selection process
  console.log(`Selecting resolution strategy for ${conflicts.length} conflicts...`);
  
  // Prioritize based on options, then conflict type, then a default
  const strategy = options.strategy || 'balance'; // Default to 'balance'
  
  if (resolutionStrategies[strategy]) {
    console.log(`Using explicitly provided strategy: ${strategy}`);
    return resolutionStrategies[strategy];
  }
  
  console.warn(`Strategy "${strategy}" not found. Using fallback strategy.`);
  return resolutionStrategies.fallback;
}

/**
 * Resolves ethical conflicts using selected resolution strategies.
 * @param {Array} reasoningPaths - Reasoning paths from different ethical frameworks
 * @param {Array} conflicts - Detected conflicts between reasoning paths
 * @param {Object} dilemma - The ethical dilemma
 * @param {Array} granularElements - Array of granular elements with relevance scores
 * @param {Object} options - Options including preferred resolution strategy
 * @returns {Object} Object containing resolved conflicts
 */
function resolveConflicts(reasoningPaths, conflicts, dilemma, granularElements = [], options = {}) {
  if (!reasoningPaths || reasoningPaths.length === 0) {
    console.warn("No reasoning paths provided to resolveConflicts.");
    return { resolutions: [] }; // Return an empty resolutions array
  }
  
  if (!conflicts || conflicts.length === 0) {
    console.log("No conflicts to resolve.");
    return { resolutions: [] }; // Return empty resolutions if there are no conflicts
  }
  
  console.log(`Resolving ${conflicts.length} detected conflicts...`);

  // Sort conflicts by action relevance if granular elements are provided
  if (granularElements && granularElements.length > 0) {
    console.log("Sorting conflicts by action relevance...");
    
    // Create a copy of conflicts to sort
    const sortedConflicts = [...conflicts].sort((a, b) => {
      // Find relevant granular elements for each conflict's action
      const elementA = granularElements.find(el => 
        el.action === a.action || 
        (el.conclusion && el.conclusion === a.action)
      );
      
      const elementB = granularElements.find(el => 
        el.action === b.action || 
        (el.conclusion && el.conclusion === b.action)
      );
      
      // Get relevance scores (default to 0 if not found)
      const relevanceA = elementA && elementA.relevance !== undefined ? elementA.relevance : 0;
      const relevanceB = elementB && elementB.relevance !== undefined ? elementB.relevance : 0;
      
      // Sort by descending relevance (higher relevance first)
      return relevanceB - relevanceA;
    });
    
    // Use the sorted conflicts for resolution
    conflicts = sortedConflicts;
    
    // Log the sorting results for debugging
    console.log(`Sorted ${conflicts.length} conflicts by relevance. Top conflict action: ${conflicts[0]?.action || 'unknown'}`);
  }

  const selectedStrategy = selectResolutionStrategy(reasoningPaths, conflicts, dilemma, options);

  if (!selectedStrategy) {
    console.error("No valid resolution strategy found.");
    return { resolutions: [] }; // Return empty resolutions
  }

  const resolved = selectedStrategy.resolve(reasoningPaths, conflicts, dilemma, options);
  
  // Check if resolved is undefined or null
  if (!resolved || !resolved.resolutions) {
    console.warn(`Strategy ${selectedStrategy.type} returned no resolutions.`);
    return { resolutions: [] }; // Ensure 'resolutions' is always returned
  }
  
  // Sort conflicts by priority score if granular elements are provided
  if (granularElements && granularElements.length > 0) {
    console.log("Prioritizing conflicts based on multiple factors...");
    
    // Create a copy of conflicts to sort
    const prioritizedConflicts = [...conflicts].sort((a, b) => {
      // Calculate comprehensive priority scores
      const scoreA = calculatePriorityScore(a, granularElements, reasoningPaths, dilemma);
      const scoreB = calculatePriorityScore(b, granularElements, reasoningPaths, dilemma);
      
      // Log scores for debugging
      console.log(`Priority score for conflict (${a.action || a.action1 || 'unknown'}): ${scoreA.toFixed(2)}`);
      console.log(`Priority score for conflict (${b.action || b.action1 || 'unknown'}): ${scoreB.toFixed(2)}`);
      
      // Sort by descending priority score
      return scoreB - scoreA;
    });
    
    // Use the prioritized conflicts for resolution
    conflicts = prioritizedConflicts;
    
    console.log(`Sorted ${conflicts.length} conflicts by priority score`);
  }
  
  // Apply action relevance to resolution descriptions if available
  if (granularElements && granularElements.length > 0 && resolved.resolutions.length > 0) {
    for (const resolution of resolved.resolutions) {
      if (resolution.action) {
        const relevantElement = granularElements.find(el => 
          el.action === resolution.action || 
          (el.conclusion && el.conclusion === resolution.action)
        );
        
        if (relevantElement && relevantElement.relevance !== undefined) {
          // Add relevance information to the resolution description
          resolution.actionRelevance = relevantElement.relevance;
          
          // Enhance resolution description with relevance information
          if (!resolution.resolutionDescription) {
            resolution.resolutionDescription = '';
          }
          
          if (relevantElement.relevance > 0.8) {
            resolution.resolutionDescription += ` This resolution addresses a highly relevant action (${(relevantElement.relevance * 100).toFixed(0)}% relevance).`;
          } else if (relevantElement.relevance > 0.5) {
            resolution.resolutionDescription += ` This resolution addresses a moderately relevant action (${(relevantElement.relevance * 100).toFixed(0)}% relevance).`;
          } else {
            resolution.resolutionDescription += ` This resolution addresses a less central action (${(relevantElement.relevance * 100).toFixed(0)}% relevance).`;
          }
        }
      }
    }
  }
  
  return resolved;
}

/**
 * Determines the strength of a resolution based on the frameworks and conflict.
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} conflict - Conflict object
 * @returns {string} Strength value (weak, moderate, strong)
 */
function determineStrength(framework1, framework2, conflict) {
  // Default strength
  return "moderate";
  
  // More complex strength determination logic could be implemented here
  // based on framework compatibility, conflict severity, etc.
}

/**
 * Calculate priority score for a conflict
 * @param {Object} conflict - Conflict object
 * @param {Array} granularElements - Granular elements for additional context
 * @param {Array} reasoningPaths - Reasoning paths for framework information
 * @param {Object} dilemma - Dilemma object
 * @returns {number} Priority score between 0 and 1
 */
function calculatePriorityScore(conflict, granularElements = [], reasoningPaths = [], dilemma = {}) {
  // Ensure our parameters exist
  if (!conflict || !granularElements) {
    console.warn("Conflict or Granular Elements is missing.");
    return 0;
  }
  
  // Start with severity as base score (convert to numeric value)
  const { convertSeverityToScore } = require('./utils');
  const severityScore = convertSeverityToScore(conflict.severity || 'medium');
  
  // Get action relevance score - Ensure conflict.action is defined
  let relevanceScore = 0;
  if (conflict.action) {
    const relevantElement = granularElements.find(element => element.action === conflict.action);
    relevanceScore = relevantElement && relevantElement.relevance !== undefined ? relevantElement.relevance : 0;
  } else {
    console.warn(`Conflict is missing action property: ${JSON.stringify(conflict)}`);
  }
  
  // Get framework importance score
  let frameworkImportance = 0;
  if (conflict.frameworks && Array.isArray(conflict.frameworks)) {
    // Get framework registry
    const { getFrameworkByName } = require('./frameworkRegistry');
    const { calculateFrameworkImportance } = require('./frameworkUtils');
    
    // Find the highest importance
    conflict.frameworks.forEach(fr => {
      const framework = getFrameworkByName(fr);
      if (framework) { // Make sure the framework is valid
        const importance = calculateFrameworkImportance(framework, dilemma, []);
        if (importance > frameworkImportance) {
          frameworkImportance = importance;
        }
      }
    });
  }
  
  // Calculate weighted score
  const weightedScore = (severityScore * 0.5) + (relevanceScore * 0.3) + (frameworkImportance * 0.2);
  
  // Log detailed scoring for debugging
  console.log(`Priority score components for ${conflict.action || conflict.action1 || 'unknown'}: severity=${severityScore.toFixed(2)}, relevance=${relevanceScore.toFixed(2)}, framework=${frameworkImportance.toFixed(2)}`);
  
  return weightedScore;
}

/**
 * Identify compromise points between two frameworks
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} dilemma - Dilemma object
 * @returns {Array} Array of compromise points
 */
function identifyCompromisePoints(framework1, framework2, dilemma) {
  // Handle null or undefined inputs gracefully
  if (!framework1 || !framework2) {
    return [{
      description: "Consider a middle ground approach that balances key concerns.",
      type: "generic",
      confidence: "moderate"
    }];
  }
  
  // Extract framework names and arguments safely
  const frameworkName1 = framework1.framework || framework1.frameworkName || "First Framework";
  const frameworkName2 = framework2.framework || framework2.frameworkName || "Second Framework";
  const frameworkArg1 = framework1.argument || "";
  const frameworkArg2 = framework2.argument || "";
  
  // Generic compromise points that work for most ethical conflicts
  const genericPoints = [
    { 
      description: `Balance ${frameworkName1} and ${frameworkName2} considerations through a hybrid approach.`,
      type: "generic",
      confidence: "high"
    },
    { 
      description: "Implement robust oversight mechanisms to address concerns from both perspectives.",
      type: "process",
      confidence: "high"
    },
    { 
      description: "Create clear boundaries and limitations on actions that may conflict with core principles.",
      type: "constraint",
      confidence: "high"
    }
  ];
  
  // Framework-specific compromise points based on framework types
  const specificPoints = [];
  
  // Helper function to safely check if a framework name includes a term
  const frameworkIncludes = (name, term) => name.toLowerCase().includes(term.toLowerCase());
  
  // Check framework types and generate appropriate compromise points
  
  // Rights-based frameworks (e.g., Kantian, Rights-based ethics)
  if (frameworkIncludes(frameworkName1, "right") || frameworkIncludes(frameworkName2, "right") ||
      frameworkIncludes(frameworkName1, "kant") || frameworkIncludes(frameworkName2, "kant") ||
      frameworkIncludes(frameworkName1, "deontolog") || frameworkIncludes(frameworkName2, "deontolog")) {
    specificPoints.push({ 
      description: "Ensure basic rights are protected while allowing for contextual considerations.",
      type: "rights-based",
      confidence: "high"
    });
    
    specificPoints.push({ 
      description: "Create procedural safeguards that respect individual autonomy while addressing collective concerns.",
      type: "rights-based",
      confidence: "high"
    });
  }
  
  // Utilitarian frameworks
  if (frameworkIncludes(frameworkName1, "util") || frameworkIncludes(frameworkName2, "util") ||
      frameworkIncludes(frameworkName1, "consequen") || frameworkIncludes(frameworkName2, "consequen")) {
    specificPoints.push({ 
      description: "Consider overall welfare while establishing meaningful protections for individuals.",
      type: "utilitarian",
      confidence: "high"
    });
    
    specificPoints.push({ 
      description: "Implement threshold requirements that must be met before utility considerations can override other values.",
      type: "utilitarian",
      confidence: "high"
    });
  }
  
  // Virtue ethics
  if (frameworkIncludes(frameworkName1, "virtue") || frameworkIncludes(frameworkName2, "virtue") ||
      frameworkIncludes(frameworkName1, "character") || frameworkIncludes(frameworkName2, "character")) {
    specificPoints.push({ 
      description: "Identify character traits and dispositions that can be cultivated to balance competing considerations.",
      type: "virtue-ethics",
      confidence: "high"
    });
    
    specificPoints.push({ 
      description: "Focus on developing decision-making processes that embody both practical wisdom and compassion.",
      type: "virtue-ethics",
      confidence: "high"
    });
  }
  
  // Care ethics
  if (frameworkIncludes(frameworkName1, "care") || frameworkIncludes(frameworkName2, "care") ||
      frameworkIncludes(frameworkName1, "feminist") || frameworkIncludes(frameworkName2, "feminist")) {
    specificPoints.push({ 
      description: "Prioritize relationship maintenance while acknowledging broader ethical principles.",
      type: "care-ethics",
      confidence: "high"
    });
    
    specificPoints.push({ 
      description: "Create decision frameworks that embed care for vulnerable stakeholders in all processes.",
      type: "care-ethics",
      confidence: "high"
    });
  }
  
  // Social contract or communitarian approaches
  if (frameworkIncludes(frameworkName1, "contract") || frameworkIncludes(frameworkName2, "contract") ||
      frameworkIncludes(frameworkName1, "social") || frameworkIncludes(frameworkName2, "social") ||
      frameworkIncludes(frameworkName1, "communit") || frameworkIncludes(frameworkName2, "communit")) {
    specificPoints.push({ 
      description: "Establish transparent governance mechanisms that represent diverse stakeholder perspectives.",
      type: "social-contract",
      confidence: "high"
    });
    
    specificPoints.push({ 
      description: "Design participatory processes that allow affected communities to shape implementation details.",
      type: "social-contract",
      confidence: "high"
    });
  }
  
  // Professional ethics
  if (frameworkIncludes(frameworkName1, "profession") || frameworkIncludes(frameworkName2, "profession") ||
      frameworkIncludes(frameworkName1, "medical") || frameworkIncludes(frameworkName2, "medical")) {
    specificPoints.push({ 
      description: "Develop standards that balance professional obligations with context-specific considerations.",
      type: "professional-ethics",
      confidence: "high"
    });
    
    specificPoints.push({ 
      description: "Create escalation procedures for when professional duties conflict with other important values.",
      type: "professional-ethics",
      confidence: "high"
    });
  }
  
  // Natural law
  if (frameworkIncludes(frameworkName1, "natural") || frameworkIncludes(frameworkName2, "natural") ||
      frameworkIncludes(frameworkName1, "religious") || frameworkIncludes(frameworkName2, "religious")) {
    specificPoints.push({ 
      description: "Identify areas where natural law principles can be interpreted flexibly to accommodate other values.",
      type: "natural-law",
      confidence: "high"
    });
    
    specificPoints.push({ 
      description: "Distinguish between core principles and their application in complex contexts.",
      type: "natural-law",
      confidence: "high"
    });
  }
  
  // Dilemma-specific compromise points based on dilemma attributes
  const dilemmaPoints = [];
  
  // Add dilemma-specific points if we have context
  if (dilemma && typeof dilemma === 'object') {
    // If dilemma involves medical contexts
    if (dilemma.description && 
        (dilemma.description.includes("medical") || 
         dilemma.description.includes("doctor") || 
         dilemma.description.includes("patient") ||
         dilemma.description.includes("hospital"))) {
      dilemmaPoints.push({
        description: "Implement a tiered decision-making process with medical ethics committee oversight.",
        type: "medical-context",
        confidence: "high"
      });
      
      dilemmaPoints.push({
        description: "Establish clear procedures for handling conscientious objections while ensuring patient care.",
        type: "medical-context",
        confidence: "high"
      });
    }
    
    // If dilemma involves technology or surveillance
    if (dilemma.description && 
        (dilemma.description.includes("tech") || 
         dilemma.description.includes("surveillance") || 
         dilemma.description.includes("data") ||
         dilemma.description.includes("privacy"))) {
      dilemmaPoints.push({
        description: "Implement privacy-by-design principles with transparent oversight mechanisms.",
        type: "technology-context",
        confidence: "high"
      });
      
      dilemmaPoints.push({
        description: "Create sunset provisions and regular review processes for technological implementations.",
        type: "technology-context",
        confidence: "high"
      });
    }
    
    // If dilemma involves resource allocation
    if (dilemma.description && 
        (dilemma.description.includes("resource") || 
         dilemma.description.includes("allocation") || 
         dilemma.description.includes("distribute") ||
         dilemma.description.includes("scarce"))) {
      dilemmaPoints.push({
        description: "Develop multi-factor allocation frameworks that balance efficiency and equity considerations.",
        type: "resource-allocation",
        confidence: "high"
      });
      
      dilemmaPoints.push({
        description: "Create appeals processes for exceptional cases that don't fit standard allocation models.",
        type: "resource-allocation",
        confidence: "high"
      });
    }
  }
  
  // Combine all compromise points
  const allPoints = [...genericPoints, ...specificPoints, ...dilemmaPoints];
  
  // Add source attribution to each point
  const attributedPoints = allPoints.map(point => ({
    ...point,
    source: `Generated from conflict between ${frameworkName1} and ${frameworkName2}`,
    framework1: frameworkName1,
    framework2: frameworkName2
  }));
  
  return attributedPoints;
}

/* Additional helper functions from conflict-resolution.js (placeholders) */

function groupConflictsByAction(conflicts) {
  const groups = {};
  conflicts.forEach(conflict => {
    const action = conflict.action || "unknown";
    if (!groups[action]) {
      groups[action] = [];
    }
    groups[action].push(conflict);
  });
  return groups;
}

function createReconciledPath(path1, path2, conflict, strategy) {
  // This function creates a reconciled reasoning path using a given strategy.
  return strategy.resolve(conflict, path1, path2, conflict.dilemma || {});
}

function createHybridArgument(path1, path2, conflict) {
  // Placeholder: Implement hybrid argument creation logic
  return `Hybrid argument combining ${path1.framework} and ${path2.framework}`;
}

/**
 * Generates a balanced conclusion for the conflict resolution
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} dilemma - The dilemma
 * @param {Object} conflict - The conflict details
 * @returns {string} A balanced conclusion
 */
function generateBalancedConclusion(framework1, framework2, dilemma, conflict) {
    if (!framework1 || !framework2 || !dilemma) {
        return "Unable to generate a balanced conclusion due to missing data.";
    }
    
    const framework1Name = framework1.framework || "First Framework";
    const framework2Name = framework2.framework || "Second Framework";
    const action = conflict && conflict.action ? conflict.action : "the action under consideration";
    
    // Determine priorities from frameworks - handle undefined values gracefully
    let priority1 = "ethical considerations";
    let priority2 = "ethical considerations";
    
    if (framework1.priority) {
        priority1 = getPriorityValue(framework1.priority);
    } else if (framework1Name.toLowerCase().includes("right")) {
        priority1 = "individual rights";
    } else if (framework1Name.toLowerCase().includes("util")) {
        priority1 = "overall welfare";
    } else if (framework1Name.toLowerCase().includes("virtue")) {
        priority1 = "character development";
    }
    
    if (framework2.priority) {
        priority2 = getPriorityValue(framework2.priority);
    } else if (framework2Name.toLowerCase().includes("right")) {
        priority2 = "individual rights";
    } else if (framework2Name.toLowerCase().includes("util")) {
        priority2 = "overall welfare";
    } else if (framework2Name.toLowerCase().includes("virtue")) {
        priority2 = "character development";
    }
    
    // Extract specific actions from the dilemma if available
    let actionDescription = action.replace(/_/g, ' ');
    if (dilemma.actions && dilemma.actions[action] && dilemma.actions[action].description) {
        actionDescription = dilemma.actions[action].description;
    }
    
    // List of potential balanced resolution patterns
    const balancedPatterns = [
        `A balanced approach would proceed with ${actionDescription}, but with modifications that address the concerns of both ethical frameworks.`,
        `The most balanced resolution would implement ${actionDescription} with specific safeguards to protect ${priority1} while still advancing ${priority2}.`,
        `Given the tensions between ${framework1Name} and ${framework2Name}, a nuanced approach to ${actionDescription} is warranted, one that integrates key considerations from both perspectives.`,
        `Neither ${framework1Name} nor ${framework2Name} provides a complete ethical answer. Instead, ${actionDescription} should be approached with a hybrid framework that respects ${priority1} as emphasized by ${framework1Name} while acknowledging the importance of ${priority2} from ${framework2Name}.`
    ];
    
    // Randomly select a pattern for variety
    const selectedPattern = balancedPatterns[Math.floor(Math.random() * balancedPatterns.length)];
    
    // Generate specific recommendations based on the dilemma and frameworks
    let recommendations = "Specific recommendations include:";
    
    // Add recommendations based on any parameters in the dilemma
    if (dilemma.parameters) {
        for (const key in dilemma.parameters) {
            if (dilemma.parameters.hasOwnProperty(key) && (key.includes('level') || key.includes('impact') || key.includes('risk'))) {
                recommendations += `\n- Implement controls to manage ${key.replace(/_/g, ' ')}`;
            }
        }
    }
    
    // Add default recommendations if none were generated
    if (recommendations === "Specific recommendations include:") {
        recommendations += `
- Establish clear oversight mechanisms
- Create transparent decision-making processes
- Regularly review and assess outcomes
- Provide opportunities for stakeholder feedback`;
    }
    
    return `${selectedPattern}\n\n${recommendations}`;
}

/**
 * Creates a balanced argument for resolving ethical conflicts
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @param {Object} conflict - Conflict object
 * @param {Object} dilemma - Dilemma object
 * @returns {string} Balanced argument
 */
function createBalancedArgument(path1, path2, conflict, dilemma) {
    if (!path1 || !path2 || !dilemma) {
        return "Error: Insufficient data to generate balanced argument.";
    }

    // Get framework registry to ensure we use proper framework names
    const { getFrameworkByName } = require('./frameworkRegistry');
    const fw1 = getFrameworkByName(path1.framework);
    const fw2 = getFrameworkByName(path2.framework);

    // Use proper framework names from registry when available
    const framework1Name = fw1 ? fw1.name : (path1.framework || "First Framework");
    const framework2Name = fw2 ? fw2.name : (path2.framework || "Second Framework");
    
    const dilemmaTitle = dilemma.title || "Ethical Dilemma";
    const dilemmaDescription = dilemma.description || "No description provided";
    const framework1PriorityDesc = path1.priority ? getPriorityDescription(path1.priority) : "No priority description available";
    const framework2PriorityDesc = path2.priority ? getPriorityDescription(path2.priority) : "No priority description available";
    
    // Extract conflict elements if available
    let framework1Claim = "No specific claim provided";
    let framework2Claim = "No specific claim provided";
    
    if (conflict && conflict.conflicting_elements && Array.isArray(conflict.conflicting_elements)) {
        const element1 = conflict.conflicting_elements.find(ele => ele.framework === path1.framework);
        const element2 = conflict.conflicting_elements.find(ele => ele.framework === path2.framework);
        
        if (element1 && element1.content) {
            framework1Claim = element1.content;
        }
        
        if (element2 && element2.content) {
            framework2Claim = element2.content;
        }
    }
    
    // Extract key claims using the improved function
    const keyClaims1 = extractKeyClaims(path1.argument) || [];
    const keyClaims2 = extractKeyClaims(path2.argument) || [];
    
    const contextualInfo = formatContextualConsiderations(dilemma);

    // --- Trade-off Analysis and Contextualization ---
    let balancedResolution = `# Balanced Perspective on "${dilemmaTitle}"

## Values in Tension
This ethical dilemma involves tension between different values from ${framework1Name} and ${framework2Name}:

- **${framework1Name}** ${framework1Claim}
- **${framework2Name}** ${framework2Claim}

## Detailed Analysis

### ${framework1Name} Perspective
${framework1Name}'s focus on ${path1.priority || 'ethical considerations'} suggests that:
`;

    // Add key claims from each framework
    if (keyClaims1 && keyClaims1.length > 0) {
        for (let i = 0; i < Math.min(keyClaims1.length, 3); i++) {
            balancedResolution += `- ${keyClaims1[i]}\n`;
        }
    } else {
        balancedResolution += "- No specific claims identified\n";
    }
    
    balancedResolution += `\n### ${framework2Name} Perspective
${framework2Name}'s emphasis on ${path2.priority || 'ethical considerations'} counters that:
`;
    if (keyClaims2 && keyClaims2.length > 0) {
        for (let i = 0; i < Math.min(keyClaims2.length, 3); i++) {
            balancedResolution += `- ${keyClaims2[i]}\n`;
        }
    } else {
        balancedResolution += "- No specific claims identified\n";
    }

    // Add contextual analysis
    balancedResolution += `\n## Contextual Analysis

In the specific context of this dilemma (${dilemmaDescription}), several factors are particularly relevant:\n\n`;

    // Extract and analyze context-specific factors
    let contextFactors = [];
    if (dilemma.context) {
        contextFactors.push(`- The context of ${dilemma.context} creates unique ethical considerations`);
    }
    
    if (dilemma.parameters) {
        balancedResolution += "The following parameters significantly influence how we should balance these competing considerations:\n\n";
        
        for (const param in dilemma.parameters) {
            if (dilemma.parameters.hasOwnProperty(param)) {
                const paramObj = dilemma.parameters[param];
                const paramValue = paramObj.value !== undefined ? paramObj.value : paramObj;
                const paramDescription = paramObj.description || param.replace(/_/g, ' ');
                
                try {
                    balancedResolution += `- **${paramDescription}** (${paramValue}): ${analyzeParameterImplication(paramDescription, paramValue, path1, path2)}\n`;
                } catch (error) {
                    balancedResolution += `- **${paramDescription}** (${paramValue}): Influences the ethical evaluation\n`;
                }
            }
        }
    }
    
    // Add balance framework
    balancedResolution += `\n## Balanced Approach

A balanced resolution to this conflict must acknowledge both the ${path1.priority || 'concerns'} raised by ${framework1Name} and the ${path2.priority || 'considerations'} emphasized by ${framework2Name}. Neither framework alone provides a complete solution.\n\n`;
    
    balancedResolution += `Instead, we should adopt an approach that:\n\n`;
    balancedResolution += `1. Preserves the core ${path1.priority || 'ethical considerations'} of ${framework1Name}\n`;
    balancedResolution += `2. Addresses the important ${path2.priority || 'ethical considerations'} of ${framework2Name}\n`;
    balancedResolution += `3. Adapts the approach based on the specific context and parameters of this dilemma\n`;

    // --- Generate Specific, Actionable Recommendations ---
    balancedResolution += `\n## Recommendations

Based on the above analysis, a balanced approach would involve:\n\n`;

    balancedResolution += `1. Establish clear boundaries and limitations that respect ${framework2Name}'s concerns\n`;
    balancedResolution += `2. Implement oversight mechanisms to ensure ${framework1Name}'s objectives are met responsibly\n`;
    balancedResolution += `3. Create a governance framework with equal representation from both ethical perspectives\n`;

    return balancedResolution;
}

/**
 * Analyzes the implications of a parameter's value for balancing framework concerns
 * @param {string} paramDescription - Parameter description
 * @param {number|string} paramValue - Parameter value
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @returns {string} Analysis of parameter implication
 */
function analyzeParameterImplication(paramDescription, paramValue, framework1, framework2) {
    // Convert parameter value to a number if possible
    const numValue = typeof paramValue === 'number' ? paramValue : parseFloat(paramValue);
    
    // If we have a numeric value, provide value-based analysis
    if (!isNaN(numValue)) {
        if (numValue > 0.7) {
            return `This high value suggests a significant level of ${paramDescription.toLowerCase()}, which strengthens the case for ${framework2.framework}'s concerns about ${framework2.priority || 'important considerations'}.`;
        } else if (numValue > 0.4) {
            return `This moderate value indicates a balanced approach is needed, weighing both ${framework1.framework}'s and ${framework2.framework}'s perspectives.`;
        } else {
            return `This relatively low value suggests ${framework1.framework}'s emphasis on ${framework1.priority || 'key considerations'} may deserve greater weight in this context.`;
        }
    } 
    // For non-numeric parameters, provide generic analysis
    else {
        return `This factor needs careful consideration from both ${framework1.framework} and ${framework2.framework} perspectives to determine its ethical implications.`;
    }
}

/**
 * Generates text explaining how to preserve a framework's core values
 * @param {Object} framework - The ethical framework
 * @returns {string} Text explaining how to preserve the framework's values
 */
function generateFrameworkPreservation(framework) {
    const priority = framework.priority || 'ethical considerations';
    
    switch (priority) {
        case 'rights':
            return 'core rights are respected and only limited when absolutely necessary';
        case 'welfare':
            return 'overall well-being is enhanced and harm is minimized';
        case 'justice':
            return 'fair treatment and equitable distribution are maintained';
        case 'care':
            return 'relationships and care for individuals are prioritized';
        case 'virtue':
            return 'actions reflect and develop virtuous character';
        case 'duty':
            return 'fundamental moral duties are fulfilled';
        case 'autonomy':
            return 'individual self-governance is respected wherever possible';
        case 'community':
            return 'community values and cohesion are strengthened';
        default:
            return `${priority} is appropriately considered and respected`;
    }
}

/**
 * Checks if a dilemma has a specific parameter
 * @param {Object} dilemma - The dilemma object
 * @param {string} paramName - The parameter name to check for
 * @returns {boolean} Whether the parameter exists
 */
function hasParameter(dilemma, paramName) {
    return dilemma && dilemma.parameters && dilemma.parameters[paramName] !== undefined;
}

/**
 * Gets the value of a dilemma parameter
 * @param {Object} dilemma - The dilemma object
 * @param {string} paramName - The parameter name
 * @returns {number|string|null} The parameter value or null if not found
 */
function getParameterValue(dilemma, paramName) {
    if (!hasParameter(dilemma, paramName)) {
        return null;
    }
    
    const param = dilemma.parameters[paramName];
    return param.value !== undefined ? param.value : param;
}

/**
 * Analyzes the points of conflict and agreement between two framework arguments.
 * @param {string} argument1 The first framework's argument.
 * @param {string} argument2 The second framework's argument.
 * @returns {Object} An object containing points of conflict and agreement.
 */
function analyzeConflictAndAgreement(argument1, argument2) {
    if (!argument1 || !argument2) {
        return { pointsOfConflict: [], pointsOfAgreement: [] };
    }

    const pointsOfConflict = [];
    const pointsOfAgreement = [];
    const possibleContradictions = [];

    // Improved sentence splitting with regex
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences1 = (argument1.match(sentenceRegex) || []).map(s => s.trim());
    const sentences2 = (argument2.match(sentenceRegex) || []).map(s => s.trim());

    // Create a simple map of key terms that might indicate opposing views
    const opposingTerms = {
        "right": ["wrong", "incorrect", "harmful", "detrimental"],
        "good": ["bad", "harmful", "unethical", "wrong"],
        "benefit": ["harm", "damage", "hurt", "negative"],
        "permissible": ["impermissible", "forbidden", "prohibited", "unacceptable"],
        "allowed": ["forbidden", "prohibited", "disallowed"],
        "moral": ["immoral", "unethical", "wrong"],
        "ethical": ["unethical", "immoral", "wrong"],
        "should": ["should not", "shouldn't", "must not", "mustn't"],
        "must": ["must not", "mustn't", "should not", "shouldn't"],
        "always": ["never", "rarely", "not always"],
        "never": ["always", "sometimes", "often"]
    };

    // Check for opposing terms in sentences
    function containsOpposingTerms(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        
        for (const term in opposingTerms) {
            if (s1.includes(term)) {
                for (const opposite of opposingTerms[term]) {
                    if (s2.includes(opposite)) {
                        return true;
                    }
                }
            }
            
            // Check the reverse direction
            if (s2.includes(term)) {
                for (const opposite of opposingTerms[term]) {
                    if (s1.includes(opposite)) {
                        return true;
                    }
                }
            }
        }
        
        // Check basic negation pattern
        const hasNot1 = s1.includes(" not ") || s1.includes("n't");
        const hasNot2 = s2.includes(" not ") || s2.includes("n't");
        
        // If one has negation and the other doesn't, check word similarity
        if (hasNot1 !== hasNot2) {
            // Remove "not" and contractions to compare the core statement
            const core1 = s1.replace(/ not | n't/g, " ");
            const core2 = s2.replace(/ not | n't/g, " ");
            
            // If the core statements are similar but one is negated, they conflict
            const similarity = calculateStringSimilarity(core1, core2);
            if (similarity > 0.6) {
                return true;
            }
        }
        
        return false;
    }

    // Compare sentences using improved similarity detection
    for (const sentence1 of sentences1) {
        for (const sentence2 of sentences2) {
            // Check for direct conflicts using opposing terms
            if (containsOpposingTerms(sentence1, sentence2)) {
                pointsOfConflict.push({
                    sentence1,
                    sentence2,
                    similarity: 0,
                    reason: "Opposing terms detected"
                });
                continue;
            }
            
            // Calculate semantic similarity using the utils function
            const similarity = calculateStringSimilarity(sentence1, sentence2);
            
            // High similarity indicates agreement
            if (similarity > 0.7) {
                pointsOfAgreement.push({
                    sentence1,
                    sentence2,
                    similarity,
                    reason: "High semantic similarity"
                });
            }
            // Medium similarity with opposing structure might indicate conflict
            else if (similarity > 0.4 && similarity <= 0.7) {
                // Check for sentence structure indicators of disagreement
                const s1Lower = sentence1.toLowerCase();
                const s2Lower = sentence2.toLowerCase();
                
                // Different stance indicators: "however", "but", "although", "disagree", etc.
                const stanceWords = ["however", "but", "although", "contrary", "disagree", "oppose", "rather", "instead"];
                const hasStanceIndicator = stanceWords.some(word => s1Lower.includes(word) || s2Lower.includes(word));
                
                if (hasStanceIndicator) {
                    possibleContradictions.push({
                        sentence1,
                        sentence2,
                        similarity,
                        reason: "Medium similarity with stance indicators"
                    });
                }
            }
        }
    }
    
    // Filter out possible contradictions if they're already covered by clear conflicts
    const finalConflicts = [...pointsOfConflict];
    
    for (const possible of possibleContradictions) {
        // Only add if not already covered by a clearer conflict
        const alreadyCovered = pointsOfConflict.some(conflict => 
            (conflict.sentence1 === possible.sentence1 || conflict.sentence2 === possible.sentence2));
            
        if (!alreadyCovered) {
            finalConflicts.push(possible);
        }
    }

    // Enhanced analysis of agreement patterns
    const deepAgreements = findDeepAgreements(sentences1, sentences2);
    const implicitDisagreements = findImplicitDisagreements(sentences1, sentences2);
    
    // Add contextual understanding
    const contextualizedConflicts = pointsOfConflict.map(conflict => {
        return {
            ...conflict,
            context: findArgumentContext(conflict.sentence1, argument1),
            implications: deriveImplications(conflict.sentence1, conflict.sentence2)
        };
    });
    
    return { 
        pointsOfConflict: contextualizedConflicts, 
        pointsOfAgreement,
        deepAgreements,
        implicitDisagreements
    };
}

function directlyContradicts(arg1, arg2) {
  // Placeholder for checking if two arguments directly contradict each other.
  return false;
}

function prioritizeArgument(arg1, arg2, path1, path2) {
  // Placeholder for prioritizing one argument over another.
  return arg1;
}

function calculatePrioritiesSimilarity(path1, path2) {
  // Placeholder: Calculate similarity between priorities of two paths.
  return 0.5;
}

function getActionScore(action) {
  // Placeholder: Return a score for an action.
  return 1;
}

function countContradictions(path1, path2) {
  // Placeholder: Count contradictions between two reasoning paths.
  return 0;
}

function evaluateConflictSeverity(conflict) {
  // Placeholder: Evaluate conflict severity. For example, return 2 (medium severity).
  return 2;
}

function createStakeholderAnalysisArgument(framework1, framework2, conflict, dilemma) {
    if (!framework1 || !framework2 || !dilemma) {
        return `# Stakeholder Resolution - Error\n\nInsufficient data to generate a stakeholder analysis. Missing framework or dilemma data.`;
    }

    const dilemmaTitle = dilemma.title || "Ethical Dilemma";
    const framework1Name = framework1.framework || "First Framework";
    const framework2Name = framework2.framework || "Second Framework";
    
    // Extract key claims from frameworks
    const keyClaims1 = extractKeyClaims(framework1.argument);
    const keyClaims2 = extractKeyClaims(framework2.argument);
    
    // Identify stakeholders from the dilemma
    const stakeholders = extractStakeholdersFromDilemma(dilemma);
    
    // Create stakeholder table
    let stakeholderTable = "| Stakeholder | Impact Level | Primary Interests | Under " + framework1Name + " | Under " + framework2Name + " |\n";
    stakeholderTable += "|------------|--------------|-------------------|-------------------|-------------------|\n";
    
    // Ensure stakeholders array exists
    if (!stakeholders || !Array.isArray(stakeholders) || stakeholders.length === 0) {
        stakeholderTable += "| No stakeholders identified | N/A | N/A | N/A | N/A |\n";
    } else {
        stakeholders.forEach(stakeholder => {
            // Safe access to stakeholder properties with defaults
            const name = stakeholder.name || "Unnamed Stakeholder";
            const impact = stakeholder.impact || "Unknown";
            
            // Safely handle interests array
            let interests = "Not specified";
            if (stakeholder.interests) {
                if (Array.isArray(stakeholder.interests)) {
                    interests = stakeholder.interests.join(", ");
                } else if (typeof stakeholder.interests === 'string') {
                    interests = stakeholder.interests;
                }
            }
            
            // Framework impacts - simplified for this fix
            const framework1Impact = "Needs analysis";
            const framework2Impact = "Needs analysis";
            
            stakeholderTable += `| ${name} | ${impact} | ${interests} | ${framework1Impact} | ${framework2Impact} |\n`;
        });
    }
    
    // Build the complete argument with minimal but functional content
    const argument = `# Stakeholder-Centered Resolution for "${dilemmaTitle}"

## Stakeholder Analysis
This ethical dilemma affects multiple stakeholders with different levels of impact. A stakeholder-centered approach analyzes how different ethical frameworks impact these stakeholders, with special attention to vulnerable populations.

## Framework Perspectives

### ${framework1Name} Perspective
${keyClaims1.length > 0 ? keyClaims1[0] : "No key claims identified."}

### ${framework2Name} Perspective
${keyClaims2.length > 0 ? keyClaims2[0] : "No key claims identified."}

## Stakeholder Impact Table
${stakeholderTable}

## Recommended Approach
A stakeholder-centered resolution would:

1. Prioritize protection of the most vulnerable stakeholders
2. Ensure representation of all affected parties in the decision-making process
3. Implement oversight mechanisms that include stakeholder participation
4. Regularly reassess impacts and adjust policies based on stakeholder feedback

`;

    return argument;
}

function createConditionalArgument(path1, path2, conflict) {
  // Placeholder: Create a conditional argument.
  return `Conditional argument for ${path1.framework} vs. ${path2.framework}`;
}

/**
 * Create a pluralistic argument presenting multiple ethical perspectives
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} conflict - Conflict object
 * @param {Object} dilemma - Dilemma object
 * @returns {string} Pluralistic argument
 */
function createPluralisticArgument(framework1, framework2, conflict, dilemma) {
    if (!framework1 || !framework2 || !dilemma) {
        return `# Pluralistic Approach - Error\n\nInsufficient data to generate a pluralistic perspective. Missing framework or dilemma data.`;
    }

    // Extract dilemma information
    const dilemmaTitle = dilemma.title || dilemma.name || "Unnamed Dilemma";
    const dilemmaDescription = dilemma.description || "No description provided.";
    
    // Extract framework information
    const framework1Name = framework1.framework || "First Framework";
    const framework2Name = framework2.framework || "Second Framework";
    
    // Get priority values for each framework
    const priority1 = getPriorityValue(framework1.priority || "unspecified");
    const priority2 = getPriorityValue(framework2.priority || "unspecified");
    
    // Identify the action from the conflict
    const action = conflict && conflict.action ? conflict.action.replace(/_/g, ' ') : "the action in question";
    
    // Extract key arguments from each framework
    const framework1Argument = extractKeyPoints(framework1.argument, 3);
    const framework2Argument = extractKeyPoints(framework2.argument, 3);
    
    // Generate reflective questions from each framework's perspective
    const reflectiveQuestions1 = generateFrameworkQuestions(framework1, dilemma);
    const reflectiveQuestions2 = generateFrameworkQuestions(framework2, dilemma);
    
    // Extract contextual factors for decision-making
    const contextualFactors = extractContextualFactors(dilemma);
    
    // Construct a decision-making framework
    const decisionFramework = buildDecisionFramework(framework1, framework2, dilemma);
    
    // Construct the pluralistic argument
    const pluralisticArgument = `# Multiple Ethical Perspectives on "${dilemmaTitle}"

## Pluralistic Analysis

This ethical dilemma can be meaningfully analyzed from multiple valid ethical perspectives. Rather than prescribing a single "correct" resolution, this analysis presents different frameworks and offers guidance for contextual ethical decision-making.

## ${framework1Name} Perspective

**Core Values:** ${priority1}

**Key Arguments:**
${framework1Argument.map(point => `- ${point}`).join('\n')}

**Reflective Questions from this Perspective:**
${reflectiveQuestions1.map((question, i) => `${i + 1}. ${question}`).join('\n')}

## ${framework2Name} Perspective

**Core Values:** ${priority2}

**Key Arguments:**
${framework2Argument.map(point => `- ${point}`).join('\n')}

**Reflective Questions from this Perspective:**
${reflectiveQuestions2.map((question, i) => `${i + 1}. ${question}`).join('\n')}

## Contextual Factors for Ethical Decision-Making

${contextualFactors.map(factor => `- **${factor.name}**: ${factor.description}`).join('\n')}

## Decision-Making Framework

Rather than enforcing a single resolution, a pluralistic approach suggests the following decision-making process:

1. **Identify Values at Stake:** ${decisionFramework.valuesAtStake}

2. **Consider Multiple Perspectives:**
   - From ${framework1Name}: ${decisionFramework.firstPerspective}
   - From ${framework2Name}: ${decisionFramework.secondPerspective}

3. **Weigh Contextual Factors:** ${decisionFramework.contextFactors}

4. **Make a Situated Ethical Decision:** ${decisionFramework.situatedDecision}

## Conclusion

Regarding ${action}, both ${framework1Name} and ${framework2Name} offer valid ethical considerations. The ethical decision should be made while:

1. Acknowledging the legitimacy of both perspectives
2. Considering the specific contextual factors in this case
3. Recognizing that reasonable people may disagree on the ethical course of action
4. Taking responsibility for the ethical decision while showing respect for both ethical frameworks

This pluralistic approach does not eliminate ethical conflict but rather provides a framework for navigating it with awareness of multiple valid ethical perspectives.`;

    return pluralisticArgument;
}

/**
 * Extract key points from a framework's argument
 * @param {string} argument - Framework argument text
 * @param {number} count - Number of key points to extract
 * @returns {Array} Array of key points
 */
function extractKeyPoints(argument, count = 3) {
    if (!argument) return ["No argument provided"];
    
    // Split into sentences
    const sentences = argument.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
    
    // If we have fewer sentences than requested count, return all sentences
    if (sentences.length <= count) {
        return sentences.map(s => {
            // Ensure sentences end with proper punctuation
            if (!/[.!?]$/.test(s)) return s + '.';
            return s;
        });
    }
    
    // Otherwise, return the first 'count' sentences
    return sentences.slice(0, count).map(s => {
        // Ensure sentences end with proper punctuation
        if (!/[.!?]$/.test(s)) return s + '.';
        return s;
    });
}

/**
 * Generate reflective questions from a framework's perspective
 * @param {Object} framework - Framework object
 * @param {Object} dilemma - Dilemma object
 * @returns {Array} Array of reflective questions
 */
function generateFrameworkQuestions(framework, dilemma) {
    if (!framework) {
        return ["What are the relevant ethical considerations in this context?"];
    }
    
    const frameworkName = framework.framework || "";
    const frameworkArgument = framework.argument || "";
    
    const commonQuestions = [
        "What ethical values are most important in this situation?",
        "How should competing considerations be balanced in this context?",
        "What are the long-term implications of this decision?"
    ];
    
    // Generate framework-specific questions
    const specificQuestions = [];
    
    if (frameworkName.toLowerCase().includes("right")) {
        // Rights-based questions
        specificQuestions.push(
            "Whose rights might be violated by this action?",
            "Are there rights that take precedence in this situation?",
            "How can we respect individual autonomy while addressing collective concerns?"
        );
    } else if (frameworkName.toLowerCase().includes("util")) {
        // Utilitarian questions
        specificQuestions.push(
            "What course of action produces the greatest good for the greatest number?",
            "Have we properly accounted for the interests of all affected parties?",
            "Are there minority interests that need special consideration?"
        );
    } else if (frameworkName.toLowerCase().includes("virt")) {
        // Virtue ethics questions
        specificQuestions.push(
            "What would a person of good character do in this situation?",
            "Which virtues are most relevant to this dilemma?",
            "How does this decision reflect on the character of the decision-makers?"
        );
    } else if (frameworkName.toLowerCase().includes("care")) {
        // Care ethics questions
        specificQuestions.push(
            "How does this decision impact the most vulnerable stakeholders?",
            "How can we maintain caring relationships while addressing this dilemma?",
            "Are we responding to the specific needs of those most affected?"
        );
    } else {
        // Generic questions based on argument content
        const lowerArg = frameworkArgument.toLowerCase();
        
        if (lowerArg.includes("right") || lowerArg.includes("freedom") || lowerArg.includes("libert")) {
            specificQuestions.push(
                "How can individual rights be protected in this situation?",
                "Are there competing rights at stake?",
                "What limitations on rights might be justified in this context?"
            );
        } else if (lowerArg.includes("happiness") || lowerArg.includes("welfare") || lowerArg.includes("benefit")) {
            specificQuestions.push(
                "How can we maximize overall welfare in this situation?",
                "Have we considered both short-term and long-term consequences?",
                "Are there significant harms that might outweigh potential benefits?"
            );
        } else if (lowerArg.includes("character") || lowerArg.includes("virtue") || lowerArg.includes("wisdom")) {
            specificQuestions.push(
                "What does this decision reveal about our character and values?",
                "How can we approach this situation with wisdom and moderation?",
                "What would be considered an excellent response to this dilemma?"
            );
        } else {
            // If we can't determine framework type, use common questions
            specificQuestions.push(...commonQuestions.slice(0, 3));
        }
    }
    
    // Combine specific and common questions, ensuring we have at least 3
    let combinedQuestions = [...specificQuestions];
    
    // Add common questions if we need more
    for (let i = 0; i < commonQuestions.length && combinedQuestions.length < 3; i++) {
        if (!combinedQuestions.includes(commonQuestions[i])) {
            combinedQuestions.push(commonQuestions[i]);
        }
    }
    
    return combinedQuestions.slice(0, 5); // Return at most 5 questions
}

/**
 * Extract contextual factors for decision-making from the dilemma
 * @param {Object} dilemma - Dilemma object
 * @returns {Array} Array of contextual factor objects
 */
function extractContextualFactors(dilemma) {
    const factors = [];
    
    // Add description as a factor if available
    if (dilemma.description) {
        factors.push({
            name: "Dilemma Context",
            description: dilemma.description
        });
    }
    
    // Add specific context if available
    if (dilemma.context) {
        factors.push({
            name: "Specific Setting",
            description: dilemma.context
        });
    }
    
    // Add parameters as factors
    if (dilemma.parameters) {
        for (const key in dilemma.parameters) {
            if (dilemma.parameters.hasOwnProperty(key)) {
                const param = dilemma.parameters[key];
                let description;
                
                if (typeof param === 'object') {
                    description = param.description ? 
                        `${param.value} (${param.description})` : 
                        `${param.value}`;
                } else {
                    description = `${param}`;
                }
                
                factors.push({
                    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: description
                });
            }
        }
    }
    
    // If we have no factors, add a generic one
    if (factors.length === 0) {
        factors.push({
            name: "Context Consideration",
            description: "Consider the specific circumstances of this dilemma for ethical decision-making."
        });
    }
    
    return factors;
}

/**
 * Build a decision framework for contextual ethical decision-making
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} dilemma - Dilemma object
 * @returns {Object} Decision framework object
 */
function buildDecisionFramework(framework1, framework2, dilemma) {
    const framework1Name = framework1.framework || "First Framework";
    const framework2Name = framework2.framework || "Second Framework";
    const priority1 = framework1.priority || "unspecified";
    const priority2 = framework2.priority || "unspecified";
    
    // Generate a decision framework based on the frameworks and dilemma
    return {
        valuesAtStake: `This dilemma involves tension between ${getPriorityValue(priority1)} (emphasized by ${framework1Name}) and ${getPriorityValue(priority2)} (emphasized by ${framework2Name}).`,
        
        firstPerspective: extractFirstParagraph(framework1.argument) || `This perspective emphasizes ${getPriorityValue(priority1)}.`,
        
        secondPerspective: extractFirstParagraph(framework2.argument) || `This perspective emphasizes ${getPriorityValue(priority2)}.`,
        
        contextFactors: `The specific context of this dilemma (${dilemma.context || dilemma.description || "as described"}) must inform how these ethical perspectives are applied.`,
        
        situatedDecision: `A decision should be made based on careful consideration of both frameworks, with special attention to which values are most critical in this specific context.`
    };
}

/**
 * Extract first paragraph from text
 * @param {string} text - Input text
 * @returns {string} First paragraph
 */
function extractFirstParagraph(text) {
    if (!text) return "";
    
    // Split by double newlines (paragraph breaks)
    const paragraphs = text.split(/\n\s*\n/);
    
    // Return first paragraph or whole text if no clear paragraphs
    return paragraphs[0] || text;
}

/**
 * Create a compromise proposal
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Array} middleGroundOptions - Array of middle ground option objects
 * @param {Object} dilemma - Dilemma object
 * @returns {Object} Compromise proposal object
 */
function createCompromiseProposal(framework1, framework2, middleGroundOptions, dilemma) {
    // Default proposal if missing information
    if (!framework1 || !framework2 || !middleGroundOptions || middleGroundOptions.length === 0) {
        return {
            implementationPlan: "Insufficient information to create a detailed compromise implementation plan.",
            framework1Concessions: ["Would need to concede on some positions"],
            framework2Concessions: ["Would need to concede on some positions"],
            specificRecommendations: [
                "Gather more information from both ethical frameworks",
                "Identify specific points of tension",
                "Develop a targeted compromise strategy"
            ],
            actionRecommendation: "consider the action carefully, weighing all ethical perspectives",
            action: "undetermined"
        };
    }
    
    // Extract key information
    const f1Name = framework1.framework || "Framework 1";
    const f2Name = framework2.framework || "Framework 2";
    const f1Priority = framework1.priority || "unspecified priority";
    const f2Priority = framework2.priority || "unspecified priority";
    const f1Action = framework1.action || "undetermined";
    const f2Action = framework2.action || "undetermined";
    
    // Determine recommended action
    let actionRecommendation, action;
    if (f1Action === f2Action) {
        // If actions agree, adopt that action
        action = f1Action;
        actionRecommendation = f1Action === "yes" ? 
            "proceed with the action with agreed safeguards" : 
            "refrain from the action with agreed monitoring mechanisms";
    } else if (f1Action === "yes" && f2Action === "no") {
        // Framework 1 says yes, Framework 2 says no
        action = "conditional";
        actionRecommendation = "proceed with the action only under specific conditions that protect core " + f2Priority + " concerns";
    } else if (f1Action === "no" && f2Action === "yes") {
        // Framework 1 says no, Framework 2 says yes
        action = "conditional";
        actionRecommendation = "proceed with the action only under specific conditions that protect core " + f1Priority + " concerns";
    } else {
        // Unclear or other actions
        action = "conditional";
        actionRecommendation = "consider a conditional approach that balances competing ethical considerations";
    }
    
    // Generate implementation plan from best middle ground option
    const bestOption = middleGroundOptions[0] || { description: "No clear compromise option identified." };
    const implementationPlan = `To implement this compromise, we recommend: ${bestOption.description} This approach would require ${f1Name} to make ${bestOption.framework1Concessions.toLowerCase()} while ${f2Name} would need to make ${bestOption.framework2Concessions.toLowerCase()}.`;
    
    // Generate framework concessions
    const framework1Concessions = [
        `Accept some limitation on ${f1Priority} to accommodate ${f2Priority}`,
        `Acknowledge the legitimacy of ${f2Name} concerns even when they conflict with core ${f1Priority}`,
        `Adopt additional safeguards that may not be strictly required from a ${f1Priority} perspective`
    ];
    
    const framework2Concessions = [
        `Accept some limitation on ${f2Priority} to accommodate ${f1Priority}`,
        `Acknowledge the legitimacy of ${f1Name} concerns even when they conflict with core ${f2Priority}`,
        `Adopt additional safeguards that may not be strictly required from a ${f2Priority} perspective`
    ];
    
    // Generate specific recommendations
    const specificRecommendations = [
        `Implement transparent oversight mechanisms accountable to both ${f1Priority} and ${f2Priority} concerns`,
        `Establish clear thresholds for when ${f1Priority} should take precedence and when ${f2Priority} should dominate`,
        `Create a joint stakeholder process that incorporates perspectives from both ethical frameworks`,
        `Develop metrics to evaluate outcomes against both ${f1Priority} and ${f2Priority} standards`
    ];
    
    // If dilemma has parameters, add parameter-specific recommendation
    if (dilemma && dilemma.parameters && dilemma.parameters.length > 0) {
        const relevantParam = dilemma.parameters.find(p => 
            typeof p.value === 'number' || 
            p.name.toLowerCase().includes('level') ||
            p.name.toLowerCase().includes('degree')
        );
        
        if (relevantParam) {
            specificRecommendations.push(
                `Adjust the ${relevantParam.name.replace(/_/g, ' ')} to a moderate level that balances ${f1Priority} and ${f2Priority}`
            );
        }
    }
    
    return {
        implementationPlan,
        framework1Concessions,
        framework2Concessions,
        specificRecommendations,
        actionRecommendation,
        action
    };
}

/**
 * Helper function to capitalize first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Extracts framework positions for compromise
 * @param {Object} framework - Framework object
 * @param {number} limit - Maximum number of positions to extract
 * @returns {Array} Array of position statements
 */
function extractFrameworkPositions(framework, limit = 3) {
    if (!framework || !framework.argument) {
        return ["No position available"];
    }

    const positions = [];
    const argument = framework.argument;
    
    // Extract normative statements from the argument
    const sentences = argument.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Find sentences that have normative language
    const normativeSentences = sentences.filter(s => {
        const lower = s.toLowerCase();
        return (
            lower.includes("should") || 
            lower.includes("must") || 
            lower.includes("ought") || 
            lower.includes("right") || 
            lower.includes("wrong") ||
            lower.includes("obligat") ||
            lower.includes("duty") ||
            lower.includes("responsibility") ||
            lower.includes("important") ||
            lower.includes("essential") ||
            lower.includes("necessary")
        );
    });
    
    // If normative sentences found, use those
    if (normativeSentences.length > 0) {
        for (let i = 0; i < Math.min(limit, normativeSentences.length); i++) {
            positions.push(normativeSentences[i].trim());
        }
    } else {
        // Fall back to first sentences
        for (let i = 0; i < Math.min(limit, sentences.length); i++) {
            positions.push(sentences[i].trim());
        }
    }
    
    // If still no positions, create a generic one based on framework properties
    if (positions.length === 0) {
        const frameworkName = framework.framework || "This framework";
        const priority = framework.priority || "ethical principles";
        
        positions.push(`${frameworkName} prioritizes ${priority} in ethical decision-making.`);
        
        if (framework.action === "yes") {
            positions.push(`${frameworkName} supports taking action in this context.`);
        } else if (framework.action === "no") {
            positions.push(`${frameworkName} opposes taking action in this context.`);
        }
    }
    
    return positions;
}

/**
 * Extracts a key paragraph from argument text
 * @param {string} text - The argument text
 * @returns {string} A key paragraph
 */
function extractKeyParagraph(text) {
    if (!text) return '';
    
    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    // If only one paragraph, return it
    if (paragraphs.length <= 1) return text;
    
    // Check for key indicator phrases
    const indicatorPhrases = [
        'most important', 'central', 'key', 'critical', 'essential',
        'primary', 'crucial', 'fundamental', 'core'
    ];
    
    // Look for paragraphs with indicator phrases
    for (const paragraph of paragraphs) {
        const lowerPara = paragraph.toLowerCase();
        if (indicatorPhrases.some(phrase => lowerPara.includes(phrase))) {
            return paragraph;
        }
    }
    
    // Return first paragraph as fallback
    return paragraphs[0];
}

/**
 * Generates questions based on a framework's perspective
 * @param {Object} framework - Framework object
 * @param {Object} dilemma - Dilemma object
 * @param {Object} conflict - Conflict object
 * @returns {Array} Array of questions
 */
function generateFrameworkQuestions(framework, dilemma, conflict) {
    if (!framework) {
        return ["How would you approach this ethical situation from different perspectives?"];
    }

    const frameworkName = framework.framework || "ethical framework";
    const priority = framework.priority || "ethical considerations";
    const action = framework.action || "ethical action";
    
    // Generate questions based on framework type
    const questions = [];
    
    // Basic questions based on framework
    if (frameworkName.toLowerCase().includes("utilitarian") || priority === "welfare") {
        questions.push(`What outcomes would maximize overall welfare for all parties involved?`);
        questions.push(`How do we accurately measure and compare the welfare impacts on different stakeholders?`);
    } else if (frameworkName.toLowerCase().includes("kant") || priority === "justice" || priority === "rights") {
        questions.push(`What universal principles should guide our action in this situation?`);
        questions.push(`Are we treating all persons involved as ends in themselves rather than means?`);
    } else if (frameworkName.toLowerCase().includes("virtue") || priority === "virtue") {
        questions.push(`What would a person of good character do in this situation?`);
        questions.push(`What virtues are most relevant to this ethical dilemma?`);
    } else if (frameworkName.toLowerCase().includes("care") || priority === "care") {
        questions.push(`How will our actions impact the web of relationships involved?`);
        questions.push(`How can we best respond to the needs of vulnerable parties in this situation?`);
    } else {
        // Generic questions for any framework
        questions.push(`How would a ${frameworkName} approach prioritize the values at stake in this dilemma?`);
        questions.push(`From a ${frameworkName} perspective, what considerations should have the most weight?`);
    }
    
    // Add conflict-specific questions
    if (conflict) {
        if (conflict.type === "VALUE") {
            questions.push(`When ${conflict.details.value1} and ${conflict.details.value2} conflict, how should they be prioritized in this specific context?`);
        } else if (conflict.type === "PRIORITY") {
            questions.push(`Why might ${priority} considerations outweigh other ethical concerns in this case?`);
        } else if (conflict.type === "ACTION") {
            questions.push(`What specific conditions would justify ${action === 'yes' ? 'proceeding with' : 'refraining from'} the proposed action?`);
        }
    }
    
    // Add dilemma-specific question
    if (dilemma && dilemma.description) {
        questions.push(`How does the specific context of "${dilemma.title || 'this dilemma'}" affect how ${frameworkName} principles should be applied?`);
    }
    
    return questions;
}

/**
 * Extracts contextual factors from dilemma to consider in pluralistic reasoning
 * @param {Object} dilemma - Dilemma object
 * @returns {Array} Array of context factor objects
 */
function extractDilemmaContextFactors(dilemma) {
    if (!dilemma) {
        return [{
            name: "No Context Available",
            description: "Insufficient contextual information provided",
            relevance: "Unable to assess relevance without context",
            alignsMore: 0
        }];
    }
    
    const factors = [];
    
    // Extract time factors
    if (dilemma.contexts && dilemma.contexts.some(c => c.includes("time") || c.includes("urgent"))) {
        factors.push({
            name: "Time Pressure",
            description: "The decision must be made under time constraints",
            relevance: "Affects the ability to gather complete information and deliberate fully",
            alignsMore: 1 // Often aligns more with consequentialist frameworks
        });
    }
    
    // Extract resource factors
    if (dilemma.contexts && dilemma.contexts.some(c => c.includes("resource") || c.includes("scarcity") || c.includes("limited"))) {
        factors.push({
            name: "Resource Limitations",
            description: "The availability of resources is a constraint",
            relevance: "Affects the ability to implement solutions",
            alignsMore: 1 // Often aligns more with consequentialist frameworks
        });
    }
    
    // Extract social factors
    if (dilemma.contexts && dilemma.contexts.some(c => c.includes("social") || c.includes("community") || c.includes("social cohesion"))) {
        factors.push({
            name: "Social Cohesion",
            description: "The strength of social bonds and cohesion in the community",
            relevance: "Affects the ability to implement solutions",
            alignsMore: 1 // Often aligns more with consequentialist frameworks
        });
    }
    
    // Extract ethical factors
    if (dilemma.contexts && dilemma.contexts.some(c => c.includes("ethical") || c.includes("moral") || c.includes("values"))) {
        factors.push({
            name: "Ethical Values",
            description: "The ethical principles and values guiding the decision",
            relevance: "Affects the choice of ethical approach",
            alignsMore: 1 // Often aligns more with consequentialist frameworks
        });
    }
    
    // Extract cultural factors
    if (dilemma.contexts && dilemma.contexts.some(c => c.includes("cultural") || c.includes("tradition") || c.includes("custom"))) {
        factors.push({
            name: "Cultural Values",
            description: "The cultural norms and traditions that influence the decision",
            relevance: "Affects the choice of ethical approach",
            alignsMore: 1 // Often aligns more with consequentialist frameworks
        });
    }
    
    // Extract political factors
    if (dilemma.contexts && dilemma.contexts.some(c => c.includes("political") || c.includes("government") || c.includes("policy"))) {
        factors.push({
            name: "Political Factors",
            description: "The political environment and policies that influence the decision",
            relevance: "Affects the choice of ethical approach",
            alignsMore: 1 // Often aligns more with consequentialist frameworks
        });
    }
    
    // Extract economic factors
    if (dilemma.contexts && dilemma.contexts.some(c => c.includes("economic") || c.includes("wealth") || c.includes("capitalism"))) {
        factors.push({
            name: "Economic Factors",
            description: "The economic system and its impact on the decision",
            relevance: "Affects the choice of ethical approach",
            alignsMore: 1 // Often aligns more with consequentialist frameworks
        });
    }
    
    return factors;
}

/**
 * Builds decision matrix for pluralistic approach
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} dilemma - Dilemma object
 * @param {Object} conflict - Conflict object
 * @returns {Array} 2D array representing decision matrix
 */
function buildDecisionMatrix(framework1, framework2, dilemma, conflict) {
    // Create header row
    const matrix = [];
    const header = ["Context Factor", framework1.framework || "Framework 1", framework2.framework || "Framework 2", "Pluralistic Approach"];
    matrix.push(header);
    
    // Extract context factors
    const contextFactors = extractDilemmaContextFactors(dilemma);
    
    // Add rows for each context factor
    contextFactors.forEach(factor => {
        const row = [];
        row.push(factor.name);
        
        // Framework 1 approach to this factor
        row.push(framework1.action === "yes" ? "Supports action" : "Opposes action");
        
        // Framework 2 approach to this factor
        row.push(framework2.action === "yes" ? "Supports action" : "Opposes action");
        
        // Pluralistic approach
        row.push("Consider both perspectives");
        
        matrix.push(row);
    });
    
    return matrix;
}

/**
 * Creates decision-making process for pluralistic resolution
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Array} decisionMatrix - Decision matrix
 * @returns {Object} Decision process object
 */
function createDecisionProcess(framework1, framework2, decisionMatrix) {
    return {
        valuesAtStake: `Consider both ${framework1.priority || 'the priority of framework 1'} and ${framework2.priority || 'the priority of framework 2'} as legitimate ethical concerns.`,
        contextualFactors: `Assess the specific contextual factors detailed in the decision matrix.`,
        perspective1: `${framework1.framework || 'Framework 1'} offers valuable insights regarding ${framework1.priority || 'ethical considerations'}.`,
        perspective2: `${framework2.framework || 'Framework 2'} offers valuable insights regarding ${framework2.priority || 'ethical considerations'}.`,
        weighOptions: `Consider how the specific context might give more weight to one framework or establish conditions where both can be partially satisfied.`,
        conclusion: `Make a situated ethical decision that acknowledges the legitimacy of multiple perspectives, even if they cannot be fully reconciled.`
    };
}

/**
 * Assesses the strength of a pluralistic resolution
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} conflict - Conflict object
 * @returns {string} Strength assessment
 */
function assessPluralisticStrength(framework1, framework2, conflict) {
    // Default to moderate if insufficient information
    if (!framework1 || !framework2 || !conflict) {
        return "moderate";
    }
    
    // Assessing how fundamentally different the frameworks are
    let frameworkDifference = 0;
    
    // Priority difference increases framework difference
    if (framework1.priority && framework2.priority && framework1.priority !== framework2.priority) {
        frameworkDifference += 0.3;
    }
    
    // Action difference increases framework difference
    if (framework1.action !== framework2.action) {
        frameworkDifference += 0.3;
    }
    
    // Conflict type affects framework difference
    if (conflict.type === "VALUE") {
        frameworkDifference += 0.2;
    } else if (conflict.type === "PRIORITY") {
        frameworkDifference += 0.4;
    } else if (conflict.type === "ACTION") {
        frameworkDifference += 0.5;
    }
    
    // Determine strength based on framework difference
    if (frameworkDifference > 0.7) {
        return "weak"; // Highly different frameworks make pluralistic resolution less convincing
    } else if (frameworkDifference > 0.4) {
        return "moderate";
    } else {
        return "moderately strong"; // Similar frameworks with minor differences
    }
}

// Helper function to extract the first sentence from a given text
function extractFirstSentence(text) {
    if (!text) return "";
    // Replace newline characters with space for uniform processing
    text = text.replace(/\n/g, ' ');
    // Split the text into sentences using period, exclamation point, or question mark as delimiters
    const sentences = text.split(/[.!?]\s+/);
    if (sentences.length > 0) {
        let sentence = sentences[0].trim();
        // Append a period if not present and sentence is non-empty
        if (sentence && !/[.!?]$/.test(sentence)) {
            sentence += '.';
        }
        return sentence;
    }
    return "";
}

// Helper function to format contextual considerations from a dilemma object
function formatContextualConsiderations(dilemma) {
    let parts = [];
    if (dilemma.description) {
        parts.push("Description: " + dilemma.description);
    }
    if (dilemma.parameters) {
        if (Array.isArray(dilemma.parameters)) {
            const params = dilemma.parameters.map(p => p.name ? `${p.name}: ${p.value}` : p.value).join(", ");
            parts.push("Parameters: " + params);
        } else if (typeof dilemma.parameters === "object") {
            let paramArr = [];
            for (const key in dilemma.parameters) {
                if (dilemma.parameters.hasOwnProperty(key)) {
                    const param = dilemma.parameters[key];
                    const value = (typeof param === 'object' && param.value !== undefined) ? param.value : param;
                    paramArr.push(`${key}: ${value}`);
                }
            }
            parts.push("Parameters: " + paramArr.join(", "));
        }
    }
    if (dilemma.context) {
        parts.push("Context: " + dilemma.context);
    }
    return parts.join("\n");
}

/**
 * Extract stakeholders from a dilemma description.
 * @param {Object} dilemma - The dilemma object
 * @returns {Array} Array of stakeholder objects
 */
function extractStakeholdersFromDilemma(dilemma) {
    // If dilemma has explicit stakeholders property, use it
    if (dilemma.stakeholders && Array.isArray(dilemma.stakeholders)) {
        return dilemma.stakeholders;
    }
    
    // Otherwise, try to infer stakeholders from dilemma description
    const stakeholders = [];
    
    // Always include direct subjects of the dilemma
    stakeholders.push({
        name: "Direct Subjects",
        impact: "High",
        interests: ["Fair treatment", "Autonomy", "Well-being"],
        power: "Variable"
    });
    
    // Decision makers or implementers
    stakeholders.push({
        name: "Decision Makers",
        impact: "Medium",
        interests: ["Effectiveness", "Legitimacy", "Reputation"],
        power: "High"
    });
    
    // Wider society
    stakeholders.push({
        name: "General Public",
        impact: "Low to Medium",
        interests: ["Justice", "Security", "Social cohesion"],
        power: "Collective"
    });
    
    // Dilemma-specific stakeholders
    if (dilemma.title) {
        const title = dilemma.title.toLowerCase();
        
        // Surveillance dilemmas
        if (title.includes('surveillance') || title.includes('privacy')) {
            stakeholders.push({
                name: "Monitored Individuals",
                impact: "High",
                interests: ["Privacy", "Freedom from monitoring", "Autonomy"],
                power: "Low"
            });
            stakeholders.push({
                name: "Security Agencies",
                impact: "Medium",
                interests: ["Effective monitoring", "Crime prevention", "Information access"],
                power: "High"
            });
        }
        
        // Resource allocation dilemmas
        else if (title.includes('resource') || title.includes('allocat')) {
            stakeholders.push({
                name: "Resource Recipients",
                impact: "High",
                interests: ["Fair access", "Sufficient resources", "Needs met"],
                power: "Low to Medium"
            });
            stakeholders.push({
                name: "Resource Providers",
                impact: "Medium",
                interests: ["Efficient use", "Effectiveness", "Accountability"],
                power: "High"
            });
            stakeholders.push({
                name: "Excluded Groups",
                impact: "High",
                interests: ["Inclusion", "Fair consideration", "Basic needs"],
                power: "Low"
            });
        }
        
        // Technology or AI dilemmas
        else if (title.includes('technolog') || title.includes('ai') || title.includes('artificial intelligence')) {
            stakeholders.push({
                name: "Technology Users",
                impact: "High",
                interests: ["Utility", "Safety", "Privacy", "Control"],
                power: "Medium"
            });
            stakeholders.push({
                name: "Technology Developers",
                impact: "Medium",
                interests: ["Innovation", "Adoption", "Regulatory compliance"],
                power: "High"
            });
            stakeholders.push({
                name: "Technologically Disadvantaged",
                impact: "High",
                interests: ["Access", "Fairness", "Non-discrimination"],
                power: "Low"
            });
        }
        
        // Healthcare or medical dilemmas
        else if (title.includes('health') || title.includes('medic')) {
            stakeholders.push({
                name: "Patients",
                impact: "High",
                interests: ["Health outcomes", "Autonomy", "Privacy", "Care"],
                power: "Low to Medium"
            });
            stakeholders.push({
                name: "Healthcare Providers",
                impact: "Medium",
                interests: ["Effective treatment", "Professional standards", "Resource access"],
                power: "High"
            });
            stakeholders.push({
                name: "Vulnerable Patients",
                impact: "Very High",
                interests: ["Access to care", "Quality treatment", "Support"],
                power: "Very Low"
            });
        }
        
        // Environmental dilemmas
        else if (title.includes('environment') || title.includes('climate') || title.includes('sustainable')) {
            stakeholders.push({
                name: "Local Communities",
                impact: "High",
                interests: ["Environmental health", "Economic opportunities", "Quality of life"],
                power: "Medium"
            });
            stakeholders.push({
                name: "Future Generations",
                impact: "High",
                interests: ["Sustainable environment", "Resource availability", "Climate stability"],
                power: "None"
            });
            stakeholders.push({
                name: "Industry/Business",
                impact: "Medium",
                interests: ["Regulatory certainty", "Operational freedom", "Profit"],
                power: "High"
            });
        }
    }
    
    return stakeholders;
}

/**
 * Analyze how a framework addresses stakeholder concerns
 * @param {Object} framework - Framework object
 * @param {Array} stakeholders - Array of stakeholder objects
 * @returns {Object} - Analysis object
 */
function analyzeFrameworkStakeholderImpact(framework, stakeholders) {
    const analysis = [];
    
    // Get framework type and priority for analysis
    const frameworkType = framework.framework ? framework.framework.toLowerCase() : "";
    const priority = framework.priority ? framework.priority.toLowerCase() : "";
    
    for (const stakeholder of stakeholders) {
        let impact = "Neutral";
        let explanation = "No specific impact identified.";
        
        // Rights-based frameworks
        if (frameworkType.includes('right') || priority === 'rights' || priority === 'autonomy') {
            if (stakeholder.interests.some(i => i.toLowerCase().includes('right') || 
                                             i.toLowerCase().includes('autonom') || 
                                             i.toLowerCase().includes('privac') || 
                                             i.toLowerCase().includes('libert'))) {
                impact = "Positive";
                explanation = "Rights protections align with stakeholder's interests in autonomy and freedom.";
            }
            
            if (stakeholder.power === "Low" || stakeholder.power === "Very Low") {
                impact = "Potentially Positive";
                explanation = "Rights frameworks can protect those with less power.";
            }
        }
        
        // Utilitarian/consequentialist frameworks
        else if (frameworkType.includes('utilit') || frameworkType.includes('consequent') || 
                priority === 'welfare' || priority === 'well-being') {
            if (stakeholder.name === "General Public" || stakeholder.name.includes("Community")) {
                impact = "Likely Positive";
                explanation = "Utilitarian approaches typically prioritize majority welfare.";
            }
            
            if (stakeholder.power === "Very Low" && stakeholder.impact === "High") {
                impact = "Risk of Negative";
                explanation = "May sacrifice minority interests for greater overall welfare.";
            }
        }
        
        // Care ethics frameworks
        else if (frameworkType.includes('care') || priority === 'care' || priority === 'relationship') {
            if (stakeholder.interests.some(i => i.toLowerCase().includes('care') || 
                                             i.toLowerCase().includes('relationship') || 
                                             i.toLowerCase().includes('support'))) {
                impact = "Positive";
                explanation = "Care ethics emphasizes relationships and support systems.";
            }
            
            if (stakeholder.power === "Very Low" || stakeholder.impact === "Very High") {
                impact = "Strongly Positive";
                explanation = "Care ethics prioritizes the most vulnerable.";
            }
        }
        
        // Virtue ethics frameworks
        else if (frameworkType.includes('virtue') || priority === 'virtue' || priority === 'character') {
            impact = "Variable";
            explanation = "Impact depends on which virtues are prioritized in this context.";
            
            if (stakeholder.interests.some(i => i.toLowerCase().includes('fair') || 
                                             i.toLowerCase().includes('just'))) {
                impact = "Potentially Positive";
                explanation = "Virtue ethics typically values justice and fairness.";
            }
        }
        
        // Justice frameworks
        else if (frameworkType.includes('justice') || priority === 'justice' || priority === 'fairness') {
            if (stakeholder.interests.some(i => i.toLowerCase().includes('fair') || 
                                             i.toLowerCase().includes('just') || 
                                             i.toLowerCase().includes('equit'))) {
                impact = "Positive";
                explanation = "Justice frameworks align with fairness interests.";
            }
            
            if (stakeholder.power === "Low" || stakeholder.power === "Very Low") {
                impact = "Potentially Positive";
                explanation = "Justice frameworks often aim to address power imbalances.";
            }
        }
        
        // Kantian and duty-based frameworks
        else if (frameworkType.includes('kant') || frameworkType.includes('duty') || 
                priority === 'duty' || priority === 'dignity') {
            impact = "Neutral to Positive";
            explanation = "Depends on how universal principles are applied in this case.";
            
            if (stakeholder.interests.some(i => i.toLowerCase().includes('dignit') || 
                                             i.toLowerCase().includes('respect'))) {
                impact = "Positive";
                explanation = "Kantian ethics emphasizes respect for dignity of all persons.";
            }
        }
        
        // Add to analysis
        analysis.push({
            stakeholder: stakeholder.name,
            impact: impact,
            explanation: explanation
        });
    }
    
    return analysis;
}

/**
 * Identifies stakeholders who are particularly vulnerable in this dilemma.
 * @param {Array} stakeholders - Array of stakeholder objects
 * @returns {Array} Vulnerable stakeholders with reasons
 */
function identifyVulnerableStakeholders(stakeholders) {
    const vulnerable = [];
    
    for (const stakeholder of stakeholders) {
        // Check for explicitly low power
        if (stakeholder.power === "Low" || stakeholder.power === "Very Low") {
            vulnerable.push({
                name: stakeholder.name,
                vulnerabilityReason: "Low power to advocate for their own interests"
            });
        }
        
        // Check for high impact
        else if (stakeholder.impact === "High" || stakeholder.impact === "Very High") {
            vulnerable.push({
                name: stakeholder.name,
                vulnerabilityReason: "Highly impacted by the outcome of this dilemma"
            });
        }
        
        // Check for vulnerable-suggesting names
        else if (stakeholder.name.toLowerCase().includes("vulnerable") || 
                stakeholder.name.toLowerCase().includes("marginalized") || 
                stakeholder.name.toLowerCase().includes("disadvantaged") || 
                stakeholder.name.toLowerCase().includes("future generation")) {
            vulnerable.push({
                name: stakeholder.name,
                vulnerabilityReason: "Inherently vulnerable based on their status or capacity"
            });
        }
    }
    
    return vulnerable;
}

/**
 * Determines which framework better protects vulnerable stakeholders
 * @param {Object} framework1Analysis - Analysis of first framework
 * @param {Object} framework2Analysis - Analysis of second framework
 * @param {Array} vulnerableStakeholders - Array of vulnerable stakeholder objects
 * @returns {Object} - Optimal framework object
 */
function determineOptimalFramework(framework1Analysis, framework2Analysis, vulnerableStakeholders) {
    let framework1Score = 0;
    let framework2Score = 0;
    
    // Scoring system for impact assessments
    const impactScores = {
        "Strongly Positive": 3,
        "Positive": 2,
        "Potentially Positive": 1,
        "Neutral": 0,
        "Variable": 0,
        "Neutral to Positive": 0.5,
        "Potentially Negative": -1,
        "Risk of Negative": -1,
        "Negative": -2,
        "Strongly Negative": -3
    };
    
    // Calculate scores with emphasis on vulnerable stakeholders
    for (const stakeholder of vulnerableStakeholders) {
        const framework1Impact = framework1Analysis.find(a => a.stakeholder === stakeholder.name);
        const framework2Impact = framework2Analysis.find(a => a.stakeholder === stakeholder.name);
        
        if (framework1Impact) {
            framework1Score += impactScores[framework1Impact.impact] || 0;
        }
        
        if (framework2Impact) {
            framework2Score += impactScores[framework2Impact.impact] || 0;
        }
    }
    
    // Calculate overall scores for all stakeholders (with less weight)
    for (const analysis of framework1Analysis) {
        if (!vulnerableStakeholders.some(s => s.name === analysis.stakeholder)) {
            framework1Score += (impactScores[analysis.impact] || 0) * 0.5;
        }
    }
    
    for (const analysis of framework2Analysis) {
        if (!vulnerableStakeholders.some(s => s.name === analysis.stakeholder)) {
            framework2Score += (impactScores[analysis.impact] || 0) * 0.5;
        }
    }
    
    // Determine which framework is better for vulnerable stakeholders
    if (framework1Score > framework2Score + 1) {
        return {
            framework: framework1Analysis[0]?.stakeholder.framework || "First Framework",
            reason: "it better protects the interests of vulnerable stakeholders",
            score: framework1Score,
            comparisonScore: framework2Score
        };
    } else if (framework2Score > framework1Score + 1) {
        return {
            framework: framework2Analysis[0]?.stakeholder.framework || "Second Framework",
            reason: "it better protects the interests of vulnerable stakeholders",
            score: framework2Score,
            comparisonScore: framework1Score
        };
    } else {
        return {
            framework: "Hybrid",
            reason: "both frameworks offer comparable protection for vulnerable stakeholders",
            score1: framework1Score,
            score2: framework2Score
        };
    }
}

/**
 * Generate recommendations based on stakeholder analysis
 * @param {Object} optimalFramework - The optimal framework object
 * @param {Array} stakeholders - Array of stakeholder objects
 * @param {Object} dilemma - Dilemma object
 * @returns {Array} - Array of recommendation strings
 */
function generateStakeholderRecommendations(optimalFramework, stakeholders, dilemma) {
    let recommendations = "";
    
    // Core recommendation based on optimal framework
    if (optimalFramework.framework !== "Hybrid") {
        recommendations += `1. **Primary Approach**: Adopt the ${optimalFramework.framework} as the primary ethical framework because ${optimalFramework.reason}.\n\n`;
    } else {
        recommendations += "1. **Hybrid Approach**: Integrate elements from both ethical frameworks since they offer comparable benefits for stakeholders.\n\n";
    }
    
    // Procedural justice recommendations
    recommendations += "2. **Inclusive Process**: Ensure all stakeholders, especially vulnerable ones, have meaningful input in the decision-making process:\n";
    recommendations += "   - Create accessible feedback mechanisms for all stakeholder groups\n";
    recommendations += "   - Provide resources to enable meaningful participation by less powerful stakeholders\n";
    recommendations += "   - Document how stakeholder input influenced the final decision\n\n";
    
    // Impact mitigation recommendations
    recommendations += "3. **Impact Mitigation**: Establish safeguards and compensation mechanisms for negatively affected stakeholders:\n";
    recommendations += "   - Create monitoring systems to track impacts on all stakeholder groups\n";
    recommendations += "   - Develop contingency plans for unexpected negative consequences\n";
    recommendations += "   - Establish compensation mechanisms for unavoidable harms\n\n";
    
    // Vulnerable stakeholder protection
    recommendations += "4. **Vulnerable Stakeholder Protection**: Implement special protections for the most vulnerable stakeholders:\n";
    
    // Add specific protections based on dilemma type
    if (dilemma.title.toLowerCase().includes('surveillance') || dilemma.title.toLowerCase().includes('privacy')) {
        recommendations += "   - Create opt-out options for vulnerable groups where feasible\n";
        recommendations += "   - Implement stronger anonymization for vulnerable populations\n";
        recommendations += "   - Establish independent advocates with real authority\n\n";
    } else if (dilemma.title.toLowerCase().includes('resource') || dilemma.title.toLowerCase().includes('allocat')) {
        recommendations += "   - Establish minimum guaranteed resource allocations for vulnerable groups\n";
        recommendations += "   - Create expedited appeals processes for vulnerable stakeholders\n";
        recommendations += "   - Implement regular equity audits of resource distribution\n\n";
    } else if (dilemma.title.toLowerCase().includes('ai') || dilemma.title.toLowerCase().includes('tech')) {
        recommendations += "   - Conduct specific impact assessments on vulnerable populations\n";
        recommendations += "   - Implement technology design requirements that consider accessibility\n";
        recommendations += "   - Create monitoring systems for algorithmic bias\n\n";
    } else if (dilemma.title.toLowerCase().includes('health') || dilemma.title.toLowerCase().includes('medic')) {
        recommendations += "   - Establish specialized advocates for vulnerable patients\n";
        recommendations += "   - Create priority access protocols for vulnerable groups\n";
        recommendations += "   - Implement cultural competency requirements for care providers\n\n";
    } else {
        recommendations += "   - Establish dedicated advocacy channels for vulnerable stakeholders\n";
        recommendations += "   - Create preferential consideration policies where appropriate\n";
        recommendations += "   - Implement regular equity impact assessments\n\n";
    }
    
    // Accountability recommendations
    recommendations += "5. **Accountability**: Establish ongoing mechanisms to ensure stakeholder interests continue to be protected:\n";
    recommendations += "   - Regular stakeholder impact audits with public reporting\n";
    recommendations += "   - Adjustment mechanisms when negative impacts are identified\n";
    recommendations += "   - Multi-stakeholder oversight committee with representation from all stakeholder groups, especially vulnerable ones\n";
    
    return recommendations;
}

/**
 * Summarizes a framework's impact on stakeholders.
 * @param {Array} frameworkAnalysis - Analysis of a framework's stakeholder impact
 * @returns {string} Summary of impact
 */
function summarizeFrameworkImpact(frameworkAnalysis) {
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let positiveStakeholders = [];
    let negativeStakeholders = [];
    
    for (const analysis of frameworkAnalysis) {
        if (analysis.impact.includes("Positive") || analysis.impact === "Positive") {
            positive++;
            positiveStakeholders.push(analysis.stakeholder);
        } else if (analysis.impact.includes("Negative") || analysis.impact === "Negative") {
            negative++;
            negativeStakeholders.push(analysis.stakeholder);
        } else {
            neutral++;
        }
    }
    
    let summary = `This framework has a positive impact on ${positive} stakeholders, a negative impact on ${negative} stakeholders, and a neutral impact on ${neutral} stakeholders.\n\n`;
    
    if (positive > 0) {
        summary += `**Positive impact** on: ${positiveStakeholders.join(", ")}\n\n`;
    }
    
    if (negative > 0) {
        summary += `**Negative impact** on: ${negativeStakeholders.join(", ")}\n\n`;
    }
    
    return summary;
}

/**
 * Generate recommendations based on compromise points
 * @param {Array} compromisePoints - Array of compromise points
 * @param {string} framework1Name - Name of first framework
 * @param {string} framework2Name - Name of second framework
 * @param {string} action - Action being considered
 * @returns {Array} Array of recommendation strings
 */
function generateCompromiseRecommendations(compromisePoints, framework1Name, framework2Name, action) {
    const recommendations = [];
    
    // Generate recommendations from compromise points
    if (Array.isArray(compromisePoints) && compromisePoints.length > 0) {
        compromisePoints.forEach(point => {
            const pointText = point.description || point;
            if (typeof pointText === 'string') {
                // Transform compromise point into an actionable recommendation
                if (pointText.toLowerCase().includes("balance")) {
                    recommendations.push(`Establish a balance between ${framework1Name} and ${framework2Name} concerns by implementing ${action} with appropriate safeguards.`);
                } else if (pointText.toLowerCase().includes("oversight") || pointText.toLowerCase().includes("monitor")) {
                    recommendations.push(`Create transparent oversight mechanisms to ensure that ${action} respects both ethical frameworks.`);
                } else if (pointText.toLowerCase().includes("limit") || pointText.toLowerCase().includes("scope")) {
                    recommendations.push(`Limit the scope and application of ${action} to situations where both frameworks' concerns can be addressed.`);
                } else {
                    // General transformation
                    recommendations.push(`Implement a modified approach to ${action} that ${pointText.toLowerCase()}.`);
                }
            }
        });
    }
    
    // If we haven't generated enough recommendations, add generic ones
    if (recommendations.length < 2) {
        recommendations.push(`Establish clear criteria based on both ${framework1Name} and ${framework2Name} for when ${action} is appropriate.`);
        recommendations.push(`Implement regular review processes to ensure that the compromise solution continues to address the concerns of both ethical frameworks.`);
        recommendations.push(`Create mechanisms for stakeholder feedback to adjust the approach to ${action} if it fails to adequately balance the competing ethical considerations.`);
    }
    
    return recommendations;
}

/**
 * Extracts key ethical claims from an argument with improved NLP techniques.
 * @param {string} argument The argument string.
 * @returns {Array<Object>} An array of key claims with metadata.
 */
function extractKeyClaims(argument) {
    if (!argument) {
        return ["No core claim provided."];
    }

    // Break into sentences with improved regex
    const sentences = argument.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
    const claims = [];
    
    // Define word patterns for different types of ethical claims
    const patterns = {
        obligation: /\b(?:should|must|ought to|have to|required to|necessary to)\b/i,
        permission: /\b(?:may|can|allowed to|permitted to|acceptable to)\b/i,
        prohibition: /\b(?:should not|must not|cannot|may not|prohibited|forbidden|wrong to)\b/i,
        value: /\b(?:good|bad|right|wrong|beneficial|harmful|just|unjust|fair|unfair|valuable|important)\b/i,
        principle: /\b(?:principle|autonomy|justice|welfare|rights|dignity|liberty|equality|privacy|security)\b/i
    };

    for (const sentence of sentences) {
        // Identify claim type based on patterns
        let claimType = "general";
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(sentence)) {
                claimType = type;
                break;
            }
        }
        
        // Store claim and type information
        claims.push({
            claimText: sentence,
            type: claimType,
            strength: claimType === 'obligation' || claimType === 'prohibition' ? 'strong' : 'moderate'
        });
    }
    
    // Sort claims by strength and type (prioritize obligations and prohibitions)
    const sortedClaims = claims.sort((a, b) => {
        if (a.strength !== b.strength) {
            return a.strength === 'strong' ? -1 : 1;
        }
        return 0;
    });
    
    // Return just the claim text as strings
    return sortedClaims.map(claim => claim.claimText);
}

/**
 * Analyzes trade-offs between conflicting ethical frameworks.
 * @param {Array<Object>} claims1 Claims from first framework
 * @param {Array<Object>} claims2 Claims from second framework
 * @param {Object} dilemma The dilemma object
 * @returns {Object} Analysis of trade-offs
 */
function analyzeEthicalTradeoffs(claims1, claims2, framework1, framework2, dilemma) {
    // Identify directly conflicting claims
    const conflicts = [];
    const compatibilities = [];
    
    // Compare each claim from framework1 with each claim from framework2
    for (const claim1 of claims1) {
        for (const claim2 of claims2) {
            // Check for direct conflicts (e.g., obligation vs. prohibition)
            if ((claim1.type === 'obligation' && claim2.type === 'prohibition') ||
                (claim1.type === 'prohibition' && claim2.type === 'obligation')) {
                
                // Check if they're about the same subject
                const similarity = calculateClaimSimilarity(claim1, claim2);
                if (similarity > 0.4) {
                    conflicts.push({
                        claim1: claim1.claim,
                        claim2: claim2.claim,
                        type: 'direct_conflict',
                        similarity,
                        subject: claim1.subjects
                    });
                }
            }
            // Check for compatible claims
            else if ((claim1.type === claim2.type) && 
                     (claim1.type === 'obligation' || claim1.type === 'permission')) {
                const similarity = calculateClaimSimilarity(claim1, claim2);
                if (similarity > 0.5) {
                    compatibilities.push({
                        claim1: claim1.claim,
                        claim2: claim2.claim,
                        type: 'compatibility',
                        similarity,
                        subject: claim1.subjects
                    });
                }
            }
        }
    }
    
    // Identify value priorities in the dilemma
    const valuePriorities = analyzeValuePriorities(framework1, framework2, dilemma);
    
    // Identify contextual factors that influence the trade-offs
    const contextualFactors = [];
    if (dilemma.parameters) {
        for (const param in dilemma.parameters) {
            if (dilemma.parameters.hasOwnProperty(param)) {
                const paramValue = getParameterValue(dilemma, param);
                const paramDescription = dilemma.parameters[param].description || param;
                
                // Determine which framework's claims this parameter supports
                const framework1Alignment = calculateParameterAlignment(param, paramValue, framework1);
                const framework2Alignment = calculateParameterAlignment(param, paramValue, framework2);
                
                contextualFactors.push({
                    factor: paramDescription,
                    value: paramValue,
                    framework1Support: framework1Alignment,
                    framework2Support: framework2Alignment,
                    differential: framework1Alignment - framework2Alignment
                });
            }
        }
    }
    
    // Generate trade-off analysis text
    let tradeoffAnalysis = `This dilemma presents ${conflicts.length} key conflicts between ${framework1.framework} and ${framework2.framework}:\n\n`;
    
    if (conflicts.length > 0) {
        conflicts.forEach((conflict, index) => {
            tradeoffAnalysis += `${index + 1}. **Conflict**: ${framework1.framework} claims "${conflict.claim1}" while ${framework2.framework} argues "${conflict.claim2}"\n`;
        });
    } else {
        tradeoffAnalysis += `While there are no direct logical contradictions, the frameworks emphasize different ethical priorities.\n`;
    }
    
    tradeoffAnalysis += `\n### Contextual Analysis\n\n`;
    contextualFactors.forEach(factor => {
        if (factor.differential > 0.3) {
            tradeoffAnalysis += `- The ${factor.factor} (${factor.value}) strongly supports ${framework1.framework}'s position\n`;
        } else if (factor.differential < -0.3) {
            tradeoffAnalysis += `- The ${factor.factor} (${factor.value}) strongly supports ${framework2.framework}'s position\n`;
        } else {
            tradeoffAnalysis += `- The ${factor.factor} (${factor.value}) requires balancing both frameworks' considerations\n`;
        }
    });
    
    // Value priorities
    tradeoffAnalysis += `\n### Value Priority Analysis\n\n`;
    tradeoffAnalysis += `In this specific context, the relative priorities of values are:\n`;
    
    valuePriorities.forEach(priority => {
        tradeoffAnalysis += `- ${priority.value}: ${priority.weight.toFixed(1)} (${priority.framework})\n`;
    });
    
    return {
        conflicts,
        compatibilities,
        contextualFactors,
        valuePriorities,
        tradeoffAnalysis
    };
}

/**
 * Calculates the similarity between two claims.
 */
function calculateClaimSimilarity(claim1, claim2) {
    // Simple word overlap for demonstration
    // In production, use embeddings or more sophisticated NLP
    const words1 = new Set(claim1.claim.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(claim2.claim.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
}

/**
 * Analyzes which values should be prioritized based on the dilemma context.
 */
function analyzeValuePriorities(framework1, framework2, dilemma) {
    const valuePriorities = [];
    
    // Extract core values from each framework
    const framework1Values = extractFrameworkValues(framework1);
    const framework2Values = extractFrameworkValues(framework2);
    
    // Calculate contextual weight for each value
    for (const value of framework1Values) {
        const contextualWeight = calculateContextualWeight(value, dilemma);
        valuePriorities.push({
            value: value,
            framework: framework1.framework,
            weight: contextualWeight
        });
    }
    
    for (const value of framework2Values) {
        const contextualWeight = calculateContextualWeight(value, dilemma);
        valuePriorities.push({
            value: value,
            framework: framework2.framework,
            weight: contextualWeight
        });
    }
    
    // Sort by weight descending
    return valuePriorities.sort((a, b) => b.weight - a.weight);
}

/**
 * Extracts core ethical values from a framework.
 */
function extractFrameworkValues(framework) {
    const coreValues = [];
    
    if (framework.priority) {
        coreValues.push(framework.priority);
    }
    
    // Additional value extraction based on framework type
    switch (framework.framework?.toLowerCase()) {
        case 'utilitarianism':
            coreValues.push('welfare', 'happiness', 'well-being');
            break;
        case 'rights-based ethics':
        case 'rights theory':
            coreValues.push('rights', 'autonomy', 'dignity');
            break;
        case 'care ethics':
            coreValues.push('care', 'relationships', 'compassion');
            break;
        case 'virtue ethics':
            coreValues.push('virtue', 'character', 'excellence');
            break;
        case 'justice ethics':
            coreValues.push('justice', 'fairness', 'equality');
            break;
        case 'kantian ethics':
            coreValues.push('duty', 'dignity', 'universalizability');
            break;
        case 'consequentialism':
            coreValues.push('outcomes', 'consequences', 'effectiveness');
            break;
    }
    
    return coreValues;
}

/**
 * Calculates contextual weight for a value based on dilemma parameters.
 */
function calculateContextualWeight(value, dilemma) {
    let weight = 5.0; // Base weight
    
    // Adjust weight based on dilemma parameters
    if (dilemma.parameters) {
        for (const param in dilemma.parameters) {
            if (dilemma.parameters.hasOwnProperty(param)) {
                const paramValue = getParameterValue(dilemma, param);
                
                // Increase weight for relevant parameters
                if (param.includes(value) || 
                    (param.includes('risk') && (value === 'welfare' || value === 'security')) ||
                    (param.includes('autonomy') && (value === 'rights' || value === 'autonomy')) ||
                    (param.includes('vulnerable') && (value === 'care' || value === 'justice'))) {
                    
                    weight += (paramValue * 2);
                }
            }
        }
    }
    
    return Math.min(weight, 10.0); // Cap at 10
}

/**
 * Calculates how much a parameter aligns with a framework's values.
 */
function calculateParameterAlignment(param, value, framework) {
    // Extract framework values
    const frameworkValues = extractFrameworkValues(framework);
    let alignment = 0.5; // Neutral starting point
    
    // Parameter name suggests alignment with specific values
    for (const frameworkValue of frameworkValues) {
        if (param.toLowerCase().includes(frameworkValue.toLowerCase())) {
            // Parameter directly relates to this framework's values
            alignment += 0.2;
        }
    }
    
    // Parameter value analysis
    if (typeof value === 'number') {
        // Some parameters at high values support certain frameworks
        if (value > 0.7) {
            if ((param.includes('risk') || param.includes('harm')) && 
                frameworkValues.some(v => ['welfare', 'security', 'protection'].includes(v))) {
                alignment += 0.3;
            }
            
            if ((param.includes('autonomy') || param.includes('privacy')) && 
                frameworkValues.some(v => ['rights', 'autonomy', 'dignity'].includes(v))) {
                alignment += 0.3;
            }
        }
    }
    
    return Math.min(alignment, 1.0); // Ensure alignment is at most 1.0
}

/**
 * Generates detailed, context-specific recommendations based on ethical analysis.
 * @param {Object} framework1 First ethical framework
 * @param {Object} framework2 Second ethical framework
 * @param {Object} conflict Conflict information
 * @param {Object} dilemma The dilemma object
 * @param {Object} tradeoffAnalysis Result of trade-off analysis
 * @returns {string} Detailed recommendations
 */
function generateContextualizedRecommendations(framework1, framework2, conflict, dilemma, tradeoffAnalysis) {
    // Determine which approach to use based on value priorities and contextual factors
    const approachStrategy = determineApproachStrategy(tradeoffAnalysis);
    
    // Generate framework-specific constraints
    const framework1Constraints = generateFrameworkConstraints(framework1, dilemma);
    const framework2Constraints = generateFrameworkConstraints(framework2, dilemma);
    
    // Generate dilemma-specific recommendations
    let recommendations = `### ${approachStrategy.name}\n\n`;
    recommendations += `${approachStrategy.description}\n\n`;
    
    // Tiered recommendations (from most specific to more general)
    recommendations += "#### Primary Recommendations\n\n";
    
    // Determine primary action approach based on dilemma type and parameters
    if (conflict.action) {
        const actionApproach = determineActionApproach(conflict.action, dilemma, tradeoffAnalysis);
        recommendations += `1. **${actionApproach.title}**: ${actionApproach.description}\n`;
        
        // Add implementation details for the primary action
        actionApproach.steps.forEach((step, index) => {
            recommendations += `   ${String.fromCharCode(97 + index)}. ${step}\n`;
        });
        
        recommendations += "\n";
    }
    
    // Add framework safeguards
    recommendations += "2. **Framework Safeguards**:\n";
    recommendations += `   a. From ${framework1.framework}: ${framework1Constraints.primary}\n`;
    recommendations += `   b. From ${framework2.framework}: ${framework2Constraints.primary}\n\n`;
    
    // Governance and oversight
    recommendations += "#### Governance and Oversight\n\n";
    
    const governance = generateGovernanceRecommendations(framework1, framework2, dilemma);
    governance.forEach((rec, index) => {
        recommendations += `${index + 1}. ${rec}\n`;
    });
    
    recommendations += "\n#### Long-term Considerations\n\n";
    
    // Long-term considerations
    const longTerm = generateLongTermConsiderations(framework1, framework2, dilemma);
    longTerm.forEach((consideration, index) => {
        recommendations += `${index + 1}. ${consideration}\n`;
    });
    
    return recommendations;
}

/**
 * Determines the best approach strategy based on analysis.
 */
function determineApproachStrategy(tradeoffAnalysis) {
    // Get top two values by weight
    const topValues = tradeoffAnalysis.valuePriorities.slice(0, 2);
    
    // Check if there's a clear dominant value
    const dominantValue = topValues[0].weight > topValues[1].weight + 2.0;
    
    // Check contextual factors for clear direction
    const contextFactors = tradeoffAnalysis.contextualFactors;
    const factorDirection = contextFactors.reduce((sum, factor) => sum + factor.differential, 0);
    
    if (dominantValue && factorDirection > 1.0) {
        // Strong case for prioritizing framework1
        return {
            name: "Value-Priority Approach",
            description: `Given the strong contextual support for ${topValues[0].value} from ${topValues[0].framework}, this approach prioritizes these concerns while establishing minimum safeguards for ${topValues[1].value}.`
        };
    } else if (dominantValue && factorDirection < -1.0) {
        // Strong case for prioritizing framework2
        return {
            name: "Value-Priority Approach",
            description: `Given the strong contextual support for ${topValues[0].value} from ${topValues[0].framework}, this approach prioritizes these concerns while establishing minimum safeguards for ${topValues[1].value}.`
        };
    } else if (Math.abs(factorDirection) < 0.5 && topValues[0].weight - topValues[1].weight < 1.0) {
        // Balanced approach needed
        return {
            name: "Balanced Integration Approach",
            description: `As both ${topValues[0].value} and ${topValues[1].value} have comparable weight in this context, this approach seeks to satisfy both ethical frameworks through careful integration of their core principles.`
        };
    } else {
        // Default to proportional approach
        return {
            name: "Proportional Constraints Approach",
            description: `This approach applies ethical constraints proportionate to the contextual importance of each value, with ${topValues[0].value} given somewhat greater weight than ${topValues[1].value} in the final determination.`
        };
    }
}

/**
 * Generates constraints based on an ethical framework.
 */
function generateFrameworkConstraints(framework, dilemma) {
    const constraints = {
        primary: "",
        secondary: []
    };
    
    switch (framework.framework?.toLowerCase()) {
        case 'utilitarianism':
        case 'consequentialism':
            constraints.primary = "Ensure actions maximize overall welfare and minimize harm";
            constraints.secondary = [
                "Regular outcome assessment with quantifiable metrics",
                "Feedback mechanisms to adjust approach based on actual consequences",
                "Special consideration for potentially overlooked negative impacts"
            ];
            break;
            
        case 'rights-based ethics':
        case 'rights theory':
            constraints.primary = "Establish non-negotiable rights protections that cannot be violated";
            constraints.secondary = [
                "Informed consent mechanisms where applicable",
                "Appeal processes for perceived rights violations",
                "Clear documentation of rights limitations and their justifications"
            ];
            break;
            
        case 'care ethics':
            constraints.primary = "Prioritize relationships and address concrete needs of affected individuals";
            constraints.secondary = [
                "Individualized approaches rather than rigid rule application",
                "Emotional impact assessments and mitigation strategies",
                "Special attention to vulnerable relationship networks"
            ];
            break;
            
        case 'virtue ethics':
            constraints.primary = "Ensure actions reflect and promote virtuous character development";
            constraints.secondary = [
                "Regular ethical reflection opportunities",
                "Transparent decision-making that reflects core virtues",
                "Leadership selection based on demonstrated virtue"
            ];
            break;
            
        case 'justice ethics':
            constraints.primary = "Establish fair procedures and equitable distribution of benefits and burdens";
            constraints.secondary = [
                "Regular distributional impact assessments",
                "Mechanisms to address identified inequities",
                "Transparent justification of any unequal treatment"
            ];
            break;
            
        case 'kantian ethics':
            constraints.primary = "Ensure actions treat persons as ends in themselves, never merely as means";
            constraints.secondary = [
                "Test of universalizability for all policies",
                "Respect for individual dignity in all interactions",
                "Rejection of using people as mere instruments"
            ];
            break;
            
        default:
            if (framework.priority) {
                constraints.primary = `Ensure ${framework.priority} is adequately protected and promoted`;
                constraints.secondary = [
                    `Regular assessment of impact on ${framework.priority}`,
                    `Mechanisms to adjust approach if ${framework.priority} is compromised`,
                    `Clear documentation of how ${framework.priority} was considered`
                ];
            } else {
                constraints.primary = "Ensure ethical considerations are explicitly addressed";
                constraints.secondary = [
                    "Regular ethical review of procedures and outcomes",
                    "Transparent documentation of ethical reasoning",
                    "Diverse input into ethical decision-making"
                ];
            }
    }
    
    return constraints;
}

/**
 * Determines the specific action approach based on conflict, dilemma, and analysis.
 */
function determineActionApproach(action, dilemma, tradeoffAnalysis) {
    // This would be a large function with many dilemma-specific recommendations
    // Here's a simplified version that handles a few common actions
    
    const actionName = action.replace(/_/g, ' ');
    
    // Surveillance dilemmas
    if (actionName.includes('surveillance') || actionName.includes('monitor')) {
        const privacyFactor = getDilemmaFactor(dilemma, 'privacy');
        const riskFactor = getDilemmaFactor(dilemma, 'risk');
        
        if (privacyFactor > 0.7 && riskFactor > 0.7) {
            // High privacy impact, high risk
            return {
                title: "Tiered Surveillance with Strong Safeguards",
                description: "Implement surveillance in high-risk areas only, with robust privacy protections and oversight.",
                steps: [
                    "Deploy surveillance only in areas with documented high risk (top 10% of incidents)",
                    "Implement privacy-by-design features including automatic blurring of faces until warranted",
                    "Create a multi-stakeholder oversight committee with actual authority",
                    "Establish 30-day data retention limits with auditable deletion protocols",
                    "Require judicial approval for accessing identified data"
                ]
            };
        } else if (privacyFactor > 0.7) {
            // High privacy impact, lower risk
            return {
                title: "Minimal Surveillance with Maximum Privacy",
                description: "Implement highly targeted surveillance with strict limitations and robust privacy protections.",
                steps: [
                    "Limit surveillance to specific incidents rather than continuous monitoring",
                    "Implement anonymous data collection by default with strict controls on re-identification",
                    "Create opt-out mechanisms where feasible",
                    "Establish 7-day data retention limits with automatic deletion",
                    "Require senior-level approval for any surveillance implementation"
                ]
            };
        } else if (riskFactor > 0.7) {
            // Lower privacy impact, high risk
            return {
                title: "Comprehensive Surveillance with Basic Safeguards",
                description: "Implement broader surveillance with standard privacy protections to address high-risk situations.",
                steps: [
                    "Deploy surveillance in all high and moderate risk areas",
                    "Implement standard privacy features including data minimization",
                    "Establish transparent usage policies with public reporting",
                    "Set 90-day data retention limits for non-incident data",
                    "Regular privacy impact assessments and adjustments"
                ]
            };
        } else {
            // Lower privacy impact, lower risk
            return {
                title: "Selective Surveillance with Standard Protections",
                description: "Implement limited surveillance with normal privacy protections.",
                steps: [
                    "Deploy surveillance only in response to specific identified needs",
                    "Implement standard privacy protections",
                    "Establish clear usage guidelines",
                    "Regular review of necessity and effectiveness",
                    "Public transparency about surveillance locations and purposes"
                ]
            };
        }
    }
    
    // Resource allocation dilemmas
    else if (actionName.includes('allocat') || actionName.includes('distribute') || actionName.includes('resource')) {
        const scarcityFactor = getDilemmaFactor(dilemma, 'scarc') || getDilemmaFactor(dilemma, 'limit');
        const vulnerableFactor = getDilemmaFactor(dilemma, 'vulnerab');
        
        if (scarcityFactor > 0.7 && vulnerableFactor > 0.7) {
            // High scarcity, high vulnerable population
            return {
                title: "Need-Based Tiered Allocation",
                description: "Implement a multi-tiered allocation system that prioritizes baseline access for vulnerable populations while optimizing remaining resources.",
                steps: [
                    "Reserve 30% of resources for vulnerable populations identified through transparent criteria",
                    "Allocate remaining resources based on evidence-based impact assessment",
                    "Implement appeals process for those denied resources",
                    "Regular review of outcomes with attention to distributional justice",
                    "Establish transparent waiting list procedures when demand exceeds supply"
                ]
            };
        } else if (scarcityFactor > 0.7) {
            // High scarcity, lower vulnerable population
            return {
                title: "Efficiency-Optimized Allocation with Baseline Guarantees",
                description: "Maximize resource impact while ensuring minimum standards for all.",
                steps: [
                    "Implement evidence-based allocation focused on outcome maximization",
                    "Establish minimum resource guarantees for all eligible recipients",
                    "Create transparent allocation criteria with stakeholder input",
                    "Regular outcome assessment and criteria refinement",
                    "Develop resource expansion strategies to address scarcity"
                ]
            };
        } else {
            // Lower scarcity
            return {
                title: "Balanced Multi-Factor Allocation",
                description: "Allocate resources using multiple ethical criteria with stakeholder input.",
                steps: [
                    "Develop allocation formula that incorporates need, likely benefit, and fairness",
                    "Create mechanisms for stakeholder input into allocation decisions",
                    "Regular review of allocation patterns for unintended biases",
                    "Establish flexible policies that can adapt to changing circumstances",
                    "Transparent documentation of allocation reasoning"
                ]
            };
        }
    }
    
    // Technology implementation dilemmas
    else if (actionName.includes('technolog') || actionName.includes('implement') || actionName.includes('deploy') || actionName.includes('ai')) {
        const impactFactor = getDilemmaFactor(dilemma, 'impact');
        const oversightFactor = getDilemmaFactor(dilemma, 'oversight');
        
        if (impactFactor > 0.7 && oversightFactor < 0.4) {
            // High impact, low oversight capability
            return {
                title: "Staged Implementation with Strong Safeguards",
                description: "Implement technology in carefully controlled phases with robust safeguards and exit strategies.",
                steps: [
                    "Begin with limited pilot deployments in controlled environments",
                    "Establish clear success/failure criteria before each expansion phase",
                    "Implement multiple redundant oversight mechanisms",
                    "Create 'kill switch' protocols for rapid decommissioning if necessary",
                    "Regular independent ethical and technical audits"
                ]
            };
        } else if (impactFactor > 0.7) {
            // High impact, adequate oversight
            return {
                title: "Comprehensive Implementation with Dynamic Oversight",
                description: "Implement technology with comprehensive monitoring and adaptive oversight.",
                steps: [
                    "Full implementation with real-time monitoring capabilities",
                    "Establish multi-level oversight including automated alerts",
                    "Regular stakeholder feedback mechanisms",
                    "Continuous improvement protocols based on performance data",
                    "Transparency reporting on impacts and oversight activities"
                ]
            };
        } else {
            // Lower impact
            return {
                title: "Standard Implementation with Basic Safeguards",
                description: "Implement technology with standard ethical guidelines and monitoring.",
                steps: [
                    "Deploy with established best practices for the technology type",
                    "Standard monitoring and evaluation protocols",
                    "Regular maintenance and updates",
                    "Clear documentation of design choices and ethical considerations",
                    "Mechanisms for user feedback and improvement"
                ]
            };
        }
    }
    
    // Default approach for other action types
    return {
        title: "Balanced Ethical Implementation",
        description: `Implement ${actionName} with careful attention to multiple ethical considerations.`,
        steps: [
            "Establish clear ethical guidelines before implementation",
            "Create mechanisms for monitoring ethical impacts",
            "Implement feedback and adaptation processes",
            "Ensure transparency in decision-making",
            "Regular ethical review with diverse perspectives"
        ]
    };
}

/**
 * Gets a dilemma factor value by searching for parameter keys containing the term.
 */
function getDilemmaFactor(dilemma, term) {
    if (!dilemma.parameters) return 0.5; // Default midpoint
    
    for (const key in dilemma.parameters) {
        if (key.toLowerCase().includes(term.toLowerCase())) {
            return getParameterValue(dilemma, key);
        }
    }
    
    return 0.5; // Default if not found
}

/**
 * Generates governance and oversight recommendations.
 */
function generateGovernanceRecommendations(framework1, framework2, dilemma) {
    // Common governance recommendations
    const recommendations = [
        "**Oversight Structure**: Establish a diverse oversight committee with representatives from different stakeholder groups and ethical perspectives.",
        "**Transparency Protocols**: Implement regular public reporting on implementation, outcomes, and ethical considerations.",
        "**Review Mechanisms**: Schedule periodic reviews of the approach with the ability to make substantive changes based on findings."
    ];
    
    // Add framework-specific governance elements
    if (framework1.framework.toLowerCase().includes('right') || framework2.framework.toLowerCase().includes('right')) {
        recommendations.push("**Rights Protection**: Create dedicated channels for reporting potential rights violations with clear remediation processes.");
    }
    
    if (framework1.framework.toLowerCase().includes('utilit') || framework2.framework.toLowerCase().includes('utilit') || 
        framework1.framework.toLowerCase().includes('consequent') || framework2.framework.toLowerCase().includes('consequent')) {
        recommendations.push("**Outcome Tracking**: Implement comprehensive metrics to track both intended benefits and potential harms, with regular public reporting.");
    }
    
    if (framework1.framework.toLowerCase().includes('care') || framework2.framework.toLowerCase().includes('care')) {
        recommendations.push("**Relationship Impact**: Create mechanisms to assess impacts on relationships and communities, not just individuals.");
    }
    
    // Add dilemma-specific governance elements
    if (dilemma.title.toLowerCase().includes('surveillance') || dilemma.title.toLowerCase().includes('privacy')) {
        recommendations.push("**Privacy Governance**: Establish a specific privacy oversight function with technical expertise and the authority to block improper data usage.");
    }
    
    if (dilemma.title.toLowerCase().includes('resource') || dilemma.title.toLowerCase().includes('allocat')) {
        recommendations.push("**Allocation Oversight**: Create a resource allocation committee with diverse representation to regularly review distribution patterns and outcomes.");
    }
    
    if (dilemma.title.toLowerCase().includes('ai') || dilemma.title.toLowerCase().includes('tech')) {
        recommendations.push("**Technical Oversight**: Establish a technical ethics committee with both ethical and technical expertise to review algorithms and implementations.");
    }
    
    return recommendations;
}

/**
 * Generates long-term considerations for the ethical approach.
 */
function generateLongTermConsiderations(framework1, framework2, dilemma) {
    // Common long-term considerations
    const considerations = [
        "**Policy Evolution**: Establish mechanisms to evolve policies based on emerging evidence and changing contexts.",
        "**Ethical Learning**: Create processes to document ethical lessons learned and apply them to future decisions."
    ];
    
    // Add framework-specific long-term considerations
    if (framework1.framework.toLowerCase().includes('virtue') || framework2.framework.toLowerCase().includes('virtue')) {
        considerations.push("**Character Development**: Consider how long-term implementation affects the character and virtues of those involved.");
    }
    
    if (framework1.framework.toLowerCase().includes('justice') || framework2.framework.toLowerCase().includes('justice')) {
        considerations.push("**Distributive Effects**: Monitor long-term distributive effects to prevent systematic disparities from emerging over time.");
    }
    
    // Add dilemma-specific long-term considerations
    if (dilemma.title.toLowerCase().includes('surveillance') || dilemma.title.toLowerCase().includes('privacy')) {
        considerations.push("**Normalization Risk**: Regularly assess the risk of surveillance normalization and privacy expectation shifts in society.");
    }
    
    if (dilemma.title.toLowerCase().includes('resource') || dilemma.title.toLowerCase().includes('allocat')) {
        considerations.push("**Resource Development**: Invest in expanding available resources to reduce the need for difficult allocation decisions in the future.");
    }
    
    if (dilemma.title.toLowerCase().includes('ai') || dilemma.title.toLowerCase().includes('tech')) {
        considerations.push("**Technological Evolution**: Establish processes to reassess ethical implications as the technology evolves.");
    }
    
    if (dilemma.title.toLowerCase().includes('health') || dilemma.title.toLowerCase().includes('medic')) {
        considerations.push("**Long-term Health Impacts**: Implement monitoring of both intended and unintended health outcomes over extended timeframes.");
    }
    
    return considerations;
}

// Add a fallback resolution strategy generation function
/**
 * Generates a fallback resolution strategy for any type of conflict
 * This is used when no specific resolution strategies are available or when ideal methods fail
 * @param {Object} conflict - The conflict to resolve
 * @param {Object} framework1 - First framework in conflict
 * @param {Object} framework2 - Second framework in conflict
 * @param {Object} dilemma - The dilemma being analyzed
 * @returns {Object} A fallback resolution
 */
function generateFallbackResolution(conflict, framework1, framework2, dilemma) {
    console.log("Generating fallback resolution...");
    
    // Default values for missing properties
    const action = conflict.action || conflict.action1 || "unknown";
    const framework1Name = framework1.framework || conflict.framework1_name || conflict.framework1 || "Framework 1";
    const framework2Name = framework2.framework || conflict.framework2_name || conflict.framework2 || "Framework 2";
    
    // Extract principles and values from both frameworks
    const principles1 = extractPrinciples(framework1);
    const principles2 = extractPrinciples(framework2);
    const values1 = extractValues(framework1);
    const values2 = extractValues(framework2);
    
    // Create a balanced recommendation based on extracted information
    let recommendation = `After considering perspectives from ${framework1Name} and ${framework2Name}, `;
    
    if (action === "unknown" && conflict.action1 && conflict.action2) {
        // For cross-action conflicts
        recommendation += `a nuanced approach is needed. While ${framework1Name} recommends ${conflict.action1.replace(/_/g, ' ')}, and ${framework2Name} suggests ${conflict.action2.replace(/_/g, ' ')}, a balanced approach would involve:`;
        recommendation += "\n\n1. Prioritize actions that protect fundamental rights and prevent irreversible harm";
        recommendation += "\n2. Implement safeguards to address legitimate concerns from both perspectives";
        recommendation += "\n3. Establish monitoring mechanisms to assess outcomes and adjust as needed";
        recommendation += "\n4. Create inclusive decision-making processes that involve affected stakeholders";
    } else {
        // For same-action conflicts
        recommendation += `regarding ${action.replace(/_/g, ' ')}, a balanced approach would acknowledge the ${conflict.type ? conflict.type.toLowerCase() : "ethical"} tension between these ethical perspectives. `;
        recommendation += "A practicable resolution would incorporate:";
        recommendation += "\n\n1. Acknowledge the validity of multiple ethical considerations";
        recommendation += "\n2. Implement the action with specific safeguards to address concerns";
        recommendation += "\n3. Establish ongoing evaluation to ensure ethical outcomes";
        recommendation += "\n4. Create transparent processes for adjusting the approach if needed";
    }
    
    // Add principles if available
    if (principles1.length > 0 || principles2.length > 0) {
        recommendation += "\n\nKey principles to consider:";
        if (principles1.length > 0) recommendation += `\n- From ${framework1Name}: ${principles1[0]}`;
        if (principles2.length > 0) recommendation += `\n- From ${framework2Name}: ${principles2[0]}`;
    }
    
    // Add values if available
    if (values1.length > 0 || values2.length > 0) {
        recommendation += "\n\nUnderlying values at stake:";
        if (values1.length > 0) recommendation += `\n- ${values1[0]}`;
        if (values2.length > 0) recommendation += `\n- ${values2[0]}`;
    }
    
    return {
        framework: `Reconciled: ${framework1Name} + ${framework2Name} (Fallback)`,
        action: action,
        strength: "moderate",
        argument: recommendation,
        originalFrameworks: `${framework1Name} and ${framework2Name}`,
        conflictType: conflict.type || "UNKNOWN",
        resolutionStrategy: 'fallback',
        resolutionDescription: 'A practical resolution based on available ethical considerations.'
    };
}

/**
 * Extracts principles from a framework object
 * @param {Object} framework - Framework object
 * @returns {Array} Array of principle statements
 */
function extractPrinciples(framework) {
    const principles = [];
    
    // Try to extract from source_elements if available
    if (framework.source_elements && Array.isArray(framework.source_elements)) {
        const principleElements = framework.source_elements.filter(elem => elem.type === 'principle');
        if (principleElements.length > 0) {
            return principleElements.map(p => p.content);
        }
    }
    
    // Try to extract from argument text
    if (framework.argument) {
        const principleMatches = framework.argument.match(/principle of [\w\s]+|the principle that[\w\s\.,]+|ethical principle[\w\s\.,]+|moral principle[\w\s\.,]+|we should[\w\s\.,]+|one should[\w\s\.,]+/gi);
        if (principleMatches && principleMatches.length > 0) {
            return principleMatches.slice(0, 2);
        }
    }
    
    return principles;
}

/**
 * Extracts values from a framework object
 * @param {Object} framework - Framework object
 * @returns {Array} Array of value statements
 */
function extractValues(framework) {
    const values = [];
    
    // Try to extract from source_elements if available
    if (framework.source_elements && Array.isArray(framework.source_elements)) {
        const valueElements = framework.source_elements.filter(elem => elem.type === 'value' || elem.type === 'core_value');
        if (valueElements.length > 0) {
            return valueElements.map(v => v.content);
        }
    }
    
    // Try to extract values from framework name
    if (framework.framework) {
        if (framework.framework.toLowerCase().includes('consequential') || framework.framework.toLowerCase().includes('utilitar')) {
            values.push('Maximizing overall welfare and good outcomes');
        }
        if (framework.framework.toLowerCase().includes('right') || framework.framework.toLowerCase().includes('deontolog')) {
            values.push('Respecting individual rights and dignity');
        }
        if (framework.framework.toLowerCase().includes('virtue')) {
            values.push('Cultivating virtuous character and excellence');
        }
        if (framework.framework.toLowerCase().includes('care')) {
            values.push('Maintaining caring relationships and responding to vulnerability');
        }
        if (framework.framework.toLowerCase().includes('justice')) {
            values.push('Ensuring fairness and equitable treatment');
        }
    }
    
    // If still no values, extract from argument
    if (values.length === 0 && framework.argument) {
        const valueMatches = framework.argument.match(/values?\s[\w\s]+|importance of[\w\s]+|significant[\w\s]+|critical[\w\s]+|essential[\w\s]+/gi);
        if (valueMatches && valueMatches.length > 0) {
            return valueMatches.slice(0, 2);
        }
    }
    
    return values;
}

/**
 * Creates a compromise argument between two frameworks
 * @param {Object} framework1 - First framework
 * @param {Object} framework2 - Second framework
 * @param {Object} conflict - Conflict object
 * @param {Object} dilemma - Dilemma object
 * @param {Array} compromisePoints - Array of compromise points
 * @returns {string} Compromise argument
 */
function createCompromiseArgument(framework1, framework2, conflict, dilemma, compromisePoints) {
    if (!framework1 || !framework2 || !conflict) {
        return "Insufficient information to create a compromise argument.";
    }

    // Adjust weights based on reasoning strength
    const framework1Weight = adjustWeightByReasoningStrength(framework1);
    const framework2Weight = adjustWeightByReasoningStrength(framework2);
    
    // Extract framework names
    const framework1Name = framework1.framework || "Framework 1";
    const framework2Name = framework2.framework || "Framework 2";
    
    // Extract core positions
    const framework1Position = extractFirstParagraph(framework1.argument) || '';
    const framework2Position = extractFirstParagraph(framework2.argument) || '';
    
    // Create a weighted combination of positions based on reasoning strength
    let corePositionsSection = '## Core Positions\n\n';
    
    if (framework1Weight > framework2Weight) {
        corePositionsSection += `### ${framework1Name} Position (Stronger)\n${framework1Position}\n\n`;
        corePositionsSection += `### ${framework2Name} Position\n${framework2Position}\n\n`;
    } else if (framework2Weight > framework1Weight) {
        corePositionsSection += `### ${framework2Name} Position (Stronger)\n${framework2Position}\n\n`;
        corePositionsSection += `### ${framework1Name} Position\n${framework1Position}\n\n`;
    } else {
        corePositionsSection += `### ${framework1Name} Position\n${framework1Position}\n\n`;
        corePositionsSection += `### ${framework2Name} Position\n${framework2Position}\n\n`;
    }
    
    // Extract values in tension
    const valuesInTensionSection = '## Values in Tension\n' +
        `This dilemma involves tension between ${getPriorityValue(framework1.priority)} (emphasized by ${framework1Name}) and ${getPriorityValue(framework2.priority)} (emphasized by ${framework2Name}).\n\n`;
    
    // Identify compromise points
    const compromisePointsSection = '## Identified Compromise Points\n';
    const points = compromisePoints || identifyCompromisePoints(framework1, framework2, dilemma);
    let pointsList = '';
    points.forEach((point, index) => {
        pointsList += `${index + 1}. ${point}\n`;
    });
    
    // Extract contextual considerations
    const contextualConsiderationsSection = '## Contextual Considerations\n';
    let contextDescription = '';
    if (dilemma) {
        contextDescription += `Description: ${dilemma.description || 'Not provided'}\n`;
        if (dilemma.parameters) {
            const paramEntries = Object.entries(dilemma.parameters);
            if (paramEntries.length > 0) {
                contextDescription += `Parameters: ${paramEntries.map(([key, value]) => `${key}: ${value.value || value}`).join(', ')}\n`;
            }
        }
        contextDescription += `Context: ${dilemma.context || 'Not provided'}\n`;
    } else {
        contextDescription = 'No contextual information available.\n';
    }
    
    // Generate compromise recommendations
    const recommendationsSection = '## Compromise Recommendations\n';
    const recommendations = generateCompromiseRecommendations(points, framework1Name, framework2Name, conflict.action || conflict.action1);
    
    // Create conclusion
    const conclusionSection = '## Conclusion\n' +
        'By addressing the above compromise points, a middle-ground solution can be reached that partially satisfies the key ethical concerns of both frameworks. ' +
        'This compromise solution does not fully realize either framework\'s ideal, but it addresses essential moral concerns in a balanced manner.';
    
    // Combine all sections
    const argument = `# Compromise Resolution for "${dilemma?.title || 'Ethical Dilemma'}"\n\n` +
        corePositionsSection +
        valuesInTensionSection +
        compromisePointsSection +
        pointsList + '\n' +
        contextualConsiderationsSection +
        contextDescription + '\n' +
        recommendationsSection +
        recommendations + '\n' +
        conclusionSection;
    
    return argument;
}

/**
 * Generate compromise recommendations based on compromise points
 * @param {Array} compromisePoints - Array of compromise points
 * @param {string} framework1Name - Name of first framework
 * @param {string} framework2Name - Name of second framework
 * @param {string} action - The action being considered
 * @returns {Array} Array of recommendation strings
 */
function generateCompromiseRecommendations(compromisePoints, framework1Name, framework2Name, action) {
  if (!Array.isArray(compromisePoints) || compromisePoints.length === 0) {
    return ["Consider a balanced approach that respects key concerns from both ethical frameworks."];
  }
  
  // Convert compromise points to actionable recommendations
  const recommendations = compromisePoints.map(point => {
    const desc = point.description || point;
    
    // Turn description into recommendation
    if (typeof desc === 'string') {
      // If it already sounds like a recommendation, use as is
      if (desc.startsWith("Implement") || desc.startsWith("Establish") || 
          desc.startsWith("Create") || desc.startsWith("Ensure") ||
          desc.startsWith("Consider") || desc.startsWith("Develop") ||
          desc.startsWith("Address") || desc.startsWith("Balance")) {
        return desc;
      }
      
      // Otherwise, formulate as recommendation
      return `Implement measures to ${desc.charAt(0).toLowerCase() + desc.slice(1)}`;
    }
    
    return "Consider a balanced approach.";
  });
  
  // Add framework-specific recommendations
  recommendations.push(`Establish ongoing dialogue between proponents of ${framework1Name} and ${framework2Name} approaches.`);
  recommendations.push(`Create evaluation metrics that assess how well the compromise addresses concerns from both ethical perspectives.`);
  
  return recommendations;
}

/**
 * Adjusts the weight of a framework based on its reasoning strength
 * @param {Object} framework - The framework object
 * @returns {number} The adjusted weight
 */
function adjustWeightByReasoningStrength(framework) {
    if (!framework || !framework.strength) {
        return 1.0; // Default weight
    }
    
    // Adjust weight based on reasoning strength
    switch (framework.strength) {
        case 'very_strong':
            return 1.5; // Give more weight to very strong reasoning
        case 'strong':
            return 1.2;
        case 'moderate':
            return 1.0;
        case 'weak':
            return 0.8;
        case 'very_weak':
            return 0.5; // Give less weight to very weak reasoning
        default:
            return 1.0;
    }
}

// In the createCompromiseArgument function, incorporate the reasoning strength
function createCompromiseArgument(framework1, framework2, conflict, dilemma, compromisePoints) {
    // ... existing code ...
    
    // Adjust weights based on reasoning strength
    const framework1Weight = adjustWeightByReasoningStrength(framework1);
    const framework2Weight = adjustWeightByReasoningStrength(framework2);
    
    // Use the adjusted weights when combining positions
    const framework1Position = extractFirstParagraph(framework1.argument) || '';
    const framework2Position = extractFirstParagraph(framework2.argument) || '';
    
    // Create a weighted combination of positions
    let combinedPosition = '';
    if (framework1Weight > framework2Weight) {
        combinedPosition = `${framework1Position} While acknowledging that ${framework2Position.toLowerCase()}`;
    } else if (framework2Weight > framework1Weight) {
        combinedPosition = `${framework2Position} While acknowledging that ${framework1Position.toLowerCase()}`;
    } else {
        combinedPosition = `${framework1Position} On the other hand, ${framework2Position.toLowerCase()}`;
    }
    
    // ... rest of the function ...
}

// Export the functions and strategies
module.exports = { 
  resolveConflicts, 
  resolutionStrategies, 
  selectResolutionStrategy,
  determineStrength,
  identifyCompromisePoints,
  generateCompromiseRecommendations,
  // Include existing exports
  createBalancedArgument,
  createStakeholderAnalysisArgument,
  createCompromiseArgument,
  createPluralisticArgument,
  generateFallbackResolution,
  extractFirstSentence,
  formatContextualConsiderations,
  getPriorityValue
};
