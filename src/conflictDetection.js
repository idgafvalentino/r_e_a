// conflictDetection.js - Consolidated conflict detection functionality

/**
 * Detects conflicts between reasoning paths
 * @param {Array} reasoningPaths - Array of reasoning paths
 * @param {Object} options - Optional parameters
 * @returns {Array} Array of conflicts
 */
function detectConflicts(reasoningPaths, options = {}) {
    if (!reasoningPaths || !Array.isArray(reasoningPaths) || reasoningPaths.length === 0) {
        return [];
    }

    const conflicts = [];
    
    // Set to track conflicts between framework pairs to avoid duplicates
    const conflictSet = new Set();

    for (let i = 0; i < reasoningPaths.length; i++) {
        for (let j = i + 1; j < reasoningPaths.length; j++) {
            const path1 = reasoningPaths[i];
            const path2 = reasoningPaths[j];
            
            // Skip if both paths are from reconciled sources
            if (path1.source === 'reconciled' && path2.source === 'reconciled') {
                continue;
            }
            
            // Only compare paths with the same action
            if (path1.action !== path2.action) {
                continue;
            }
            
            // Skip if we've already recorded a conflict between these frameworks
            const frameworkPair = [path1.framework, path2.framework].sort().join('-');
            if (conflictSet.has(frameworkPair)) {
                continue;
            }
            
            // Detect value conflicts
            if (path1.action === path2.action && path1.argument && path2.argument) {
                const priorities1 = extractPriorities(path1.argument);
                const priorities2 = extractPriorities(path2.argument);
                
                const values1 = extractValues(path1.argument);
                const values2 = extractValues(path2.argument);
                
                // Check for conflicting priorities
                if (path1.priority && path2.priority && path1.priority !== path2.priority) {
                    conflicts.push({
                        id: `priority_${path1.id}_${path2.id}`,
                        type: 'PRIORITY',
                        action: path1.action,
                        framework1: path1.framework,
                        framework2: path2.framework,
                        details: {
                            priority1: path1.priority,
                            priority2: path2.priority
                        },
                        severity: 'medium'
                    });
                    
                    // Record that we've found a conflict between these frameworks
                    conflictSet.add(frameworkPair);
                }
                
                // Check for different values
                const valueConflicts = findValueConflicts(values1, values2);
                if (valueConflicts.length > 0) {
                    conflicts.push({
                        id: `value_${path1.id}_${path2.id}`,
                        type: 'VALUE',
                        action: path1.action,
                        framework1: path1.framework,
                        framework2: path2.framework,
                        details: {
                            value1: valueConflicts[0].value1,
                            value2: valueConflicts[0].value2
                        },
                        severity: 'medium'
                    });
                    
                    // Record that we've found a conflict between these frameworks
                    conflictSet.add(frameworkPair);
                }
                
                // Check for different frameworks but same action
                else if (path1.framework !== path2.framework) {
                    // Check if there are contradictions in the arguments
                    const contradictions = findContradictions(path1.argument, path2.argument);
                    if (contradictions) {
                        conflicts.push({
                            id: `action_${path1.id}_${path2.id}`,
                            type: 'ACTION',
                            action: path1.action,
                            framework1: path1.framework,
                            framework2: path2.framework,
                            details: {
                                contradiction: contradictions
                            },
                            severity: 'high'
                        });
                        
                        // Record that we've found a conflict between these frameworks
                        conflictSet.add(frameworkPair);
                    }
                }
            }
        }
    }
    
    return conflicts;
}

/**
 * Groups reasoning paths by their action/conclusion.
 * @param {Array<Object>} reasoningPaths - An array of reasoning path objects
 * @returns {Object} An object with actions as keys and arrays of paths as values
 */
function groupPathsByAction(reasoningPaths) {
    const pathsByAction = {};
    
    for (const path of reasoningPaths) {
        const action = path.conclusion || path.action;
        if (!action) {
            console.warn(`Path missing action/conclusion: ${path.id || 'unknown'}`);
            continue;
        }
        
        if (!pathsByAction[action]) {
            pathsByAction[action] = [];
        }
        
        pathsByAction[action].push(path);
    }
    
    return pathsByAction;
}

/**
 * Identifies conflicts between two reasoning paths for the same action.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @param {string} action - The action both paths are analyzing
 * @returns {Object|null} A conflict object or null if no conflict
 */
function identifyConflict(path1, path2, action) {
    // Check for different types of conflicts
    const priorityConflict = checkPriorityConflict(path1, path2);
    if (priorityConflict) {
        return {
            type: 'PRIORITY',
            description: `Different priorities: ${priorityConflict.priority1} vs ${priorityConflict.priority2}`,
            path1_id: path1.id,
            path2_id: path2.id,
            framework1: path1.framework,
            framework2: path2.framework,
            action: action,
            details: priorityConflict,
            resolutionStrategies: suggestResolutionStrategies('PRIORITY', 'medium', path1.framework, path2.framework)
        };
    }
    
    const valuationConflict = checkValuationConflict(path1, path2);
    if (valuationConflict) {
        return {
            type: 'VALUE',
            description: `Different value assessments: ${valuationConflict.factor} valued differently`,
            path1_id: path1.id,
            path2_id: path2.id,
            framework1: path1.framework,
            framework2: path2.framework,
            action: action,
            details: valuationConflict,
            resolutionStrategies: suggestResolutionStrategies('VALUE', 'medium', path1.framework, path2.framework)
        };
    }
    
    const factualConflict = checkFactualConflict(path1, path2);
    if (factualConflict) {
        return {
            type: 'FACTUAL',
            description: `Different factual interpretations: ${factualConflict.factor}`,
            path1_id: path1.id,
            path2_id: path2.id,
            framework1: path1.framework,
            framework2: path2.framework,
            action: action,
            details: factualConflict,
            resolutionStrategies: suggestResolutionStrategies('FACTUAL', 'high', path1.framework, path2.framework)
        };
    }
    
    const methodConflict = checkMethodConflict(path1, path2);
    if (methodConflict) {
        return {
            type: 'METHOD',
            description: `Different ethical methods: ${methodConflict.method1} vs ${methodConflict.method2}`,
            path1_id: path1.id,
            path2_id: path2.id,
            framework1: path1.framework,
            framework2: path2.framework,
            action: action,
            details: methodConflict,
            resolutionStrategies: suggestResolutionStrategies('METHOD', 'low', path1.framework, path2.framework)
        };
    }
    
    // No conflict detected
    return null;
}

/**
 * Checks for priority conflicts between two reasoning paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {Object|null} A priority conflict object or null
 */
function checkPriorityConflict(path1, path2) {
    const priority1 = getPriority(path1);
    const priority2 = getPriority(path2);
    
    if (priority1 && priority2 && priority1 !== priority2) {
        return {
            priority1: priority1,
            priority2: priority2,
            severity: 'medium'
        };
    }
    
    return null;
}

/**
 * Checks for value assessment conflicts between two reasoning paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {Object|null} A valuation conflict object or null
 */
function checkValuationConflict(path1, path2) {
    // This is a simplified check - in reality, you would analyze the actual values in the arguments
    if (hasValuationConflict(path1, path2)) {
        return {
            factor: 'ethical value assessment',
            path1_assessment: 'differs from path2',
            path2_assessment: 'differs from path1',
            severity: 'medium'
        };
    }
    
    return null;
}

/**
 * Checks for factual interpretation conflicts between two reasoning paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {Object|null} A factual conflict object or null
 */
function checkFactualConflict(path1, path2) {
    // This is a simplified check - in reality, you would look for factual claims in the arguments
    if (detectFactualInterpretationConflict(path1, path2)) {
        return {
            factor: 'factual interpretation',
            path1_interpretation: 'differs from path2',
            path2_interpretation: 'differs from path1',
            severity: 'high'
        };
    }
    
    return null;
}

/**
 * Checks for method conflicts between two reasoning paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {Object|null} A method conflict object or null
 */
function checkMethodConflict(path1, path2) {
    // This is a simplified check - in reality, you would detect the actual methods used
    if (hasMethodConflict(path1, path2)) {
        return {
            method1: path1.framework || 'unknown',
            method2: path2.framework || 'unknown',
            severity: 'low'
        };
    }
    
    return null;
}

/**
 * Suggests resolution strategies for a conflict.
 * @param {string} conflictType - The type of conflict (PRIORITY, VALUE, FACTUAL, METHOD)
 * @param {string} severity - The severity of the conflict (low, medium, high)
 * @param {string} framework1 - The name of the first framework
 * @param {string} framework2 - The name of the second framework
 * @returns {Array<Object>} An array of resolution strategy objects
 */
function suggestResolutionStrategies(conflictType, severity, framework1, framework2) {
    const strategies = [];
    
    // Add basic strategy based on conflict type
    switch (conflictType) {
        case 'PRIORITY':
            strategies.push({
                type: 'stakeholder',
                description: 'Prioritize the most affected stakeholders',
                frameworks: [framework1, framework2]
            });
            strategies.push({
                type: 'balance',
                description: 'Find a balance between competing priorities',
                frameworks: [framework1, framework2]
            });
            break;
            
        case 'VALUE':
            strategies.push({
                type: 'compromise',
                description: 'Find a middle ground between different value assessments',
                frameworks: [framework1, framework2]
            });
            strategies.push({
                type: 'conditional',
                description: 'Apply different value assessments based on contextual factors',
                frameworks: [framework1, framework2]
            });
            break;
            
        case 'FACTUAL':
            strategies.push({
                type: 'epistemic',
                description: 'Acknowledge factual uncertainty and proceed with caution'
            });
            strategies.push({
                type: 'evidence',
                description: 'Gather more evidence to resolve the factual disagreement'
            });
            break;
            
        case 'METHOD':
            strategies.push({
                type: 'hybrid',
                description: 'Create a hybrid approach combining elements of both methods'
            });
            strategies.push({
                type: 'pluralistic',
                description: 'Acknowledge the validity of multiple ethical methods and present the action assessment from each perspective'
            });
            break;
    }
    
    // Add severity-based strategies
    if (severity === 'high') {
        strategies.push({
            type: 'pluralistic',
            description: 'Acknowledge fundamental differences and present multiple perspectives',
            frameworks: [framework1, framework2]
        });
    } else if (severity === 'medium') {
        strategies.push({
            type: 'balance',
            description: 'Balance competing considerations',
            frameworks: [framework1, framework2]
        });
    } else {
        strategies.push({
            type: 'simple_weighting',
            description: 'Apply simple weighting to resolve minor conflicts',
            frameworks: [framework1, framework2]
        });
    }
    
    return strategies;
}

/**
 * Extracts priorities from an argument text.
 * @param {string} argument - The argument text
 * @returns {Array<string>} An array of priority strings
 */
function extractPriorities(argument) {
    if (!argument) return [];
    
    const priorities = [];
    
    // Keywords associated with different ethical priorities
    const keywordMapping = {
        welfare: ['utility', 'happiness', 'well-being', 'welfare', 'benefit', 'harm', 'consequence', 'outcome', 'result'],
        rights: ['right', 'dignity', 'autonomy', 'freedom', 'liberty', 'consent', 'privacy', 'justice'],
        virtue: ['character', 'virtue', 'excellence', 'flourishing', 'eudaimonia', 'integrity', 'honesty'],
        care: ['care', 'compassion', 'empathy', 'relationship', 'connection', 'vulnerability', 'need'],
        community: ['community', 'tradition', 'culture', 'social', 'collective', 'common good', 'harmony']
    };
    
    // Check for each priority type
    for (const [priority, keywords] of Object.entries(keywordMapping)) {
        for (const keyword of keywords) {
            if (argument.toLowerCase().includes(keyword.toLowerCase())) {
                if (!priorities.includes(priority)) {
                    priorities.push(priority);
                }
                break;  // Once we've identified this priority, move to the next
            }
        }
    }
    
    return priorities;
}

/**
 * Gets the priority of a reasoning path.
 * @param {Object} framework - The framework or path object
 * @returns {string|null} The priority or null
 */
function getPriority(framework) {
    // First try to get the priority directly from the framework object
    if (framework && framework.priority) {
        return framework.priority;
    }
    
    // If that fails, try to extract it from the argument
    if (framework && framework.argument) {
        const priorities = extractPriorities(framework.argument);
        return priorities.length > 0 ? priorities[0] : null;
    }
    
    return null;
}

/**
 * Detects conflicts between synthetic reasoning paths.
 * Enhanced version that includes resolution strategies.
 * @param {Array} syntheticPaths - Array of synthetic reasoning paths
 * @returns {Array} - Array of detected conflicts with resolution strategies
 */
function detectPathConflicts(syntheticPaths) {
    console.log("Detecting conflicts between reasoning paths...");
    const conflicts = [];

    // Compare each pair of paths
    for (let i = 0; i < syntheticPaths.length; i++) {
        const path1 = syntheticPaths[i];

        for (let j = i + 1; j < syntheticPaths.length; j++) {
            const path2 = syntheticPaths[j];

            // Only compare paths analyzing the same action
            if (path1.conclusion !== path2.conclusion) continue;

            // Check for conflicts
            const conflict = checkPathConflict(path1, path2);
            if (conflict) {
                conflicts.push({
                    framework1_id: path1.id, // Ensure each path has a unique 'id'
                    framework2_id: path2.id,
                    paths: [path1, path2],
                    frameworks: [path1.framework, path2.framework],
                    framework1_name: path1.framework,
                    framework2_name: path2.framework,
                    action: path1.conclusion,
                    type: conflict.type,
                    description: conflict.description,
                    severity: conflict.severity,
                    resolutionStrategies: generateResolutionStrategies(path1, path2, conflict)
                });
            }
        }
    }

    console.log(`Detected ${conflicts.length} conflicts between reasoning paths`);
    return conflicts;
}

/**
 * Checks for conflicts between two reasoning paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {Object|null} A conflict object or null
 */
function checkPathConflict(path1, path2) {
    // Check for missing framework information
    if (!path1.framework || !path2.framework) {
        console.warn(`Missing framework information in checkPathConflict: 
            Path1: ${path1.id || 'unknown'}, framework: ${path1.framework || 'unknown'}
            Path2: ${path2.id || 'unknown'}, framework: ${path2.framework || 'unknown'}`);
    }

    // Check for priority conflicts
    const priorityConflict = detectPriorityConflict(path1, path2);
    if (priorityConflict) {
        return {
            type: 'PRIORITY',
            description: `Conflicting ethical priorities between ${path1.framework || 'Framework 1'} and ${path2.framework || 'Framework 2'}`,
            severity: priorityConflict.severity,
            details: priorityConflict
        };
    }

    // Check for value conflicts
    if (hasValuationConflict(path1, path2)) {
        return {
            type: 'VALUE',
            description: `Different value assessments between ${path1.framework || 'Framework 1'} and ${path2.framework || 'Framework 2'}`,
            severity: 'medium',
            details: { type: 'value_conflict' }
        };
    }

    // Check for factual conflicts
    const factualConflict = detectFactualInterpretationConflict(path1, path2);
    if (factualConflict) {
        return {
            type: 'FACTUAL',
            description: `Different factual interpretations between ${path1.framework || 'Framework 1'} and ${path2.framework || 'Framework 2'}`,
            severity: 'high',
            details: factualConflict
        };
    }

    // Check for methodological conflicts
    if (hasMethodConflict(path1, path2)) {
        return {
            type: 'METHOD',
            description: `Different ethical methods between ${path1.framework || 'Framework 1'} and ${path2.framework || 'Framework 2'}`,
            severity: 'low',
            details: { frameworks: [path1.framework, path2.framework] }
        };
    }

    return null;
}

/**
 * Checks if two paths have a valuation conflict.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {boolean} True if there is a valuation conflict
 */
function hasValuationConflict(path1, path2) {
    // Simplified implementation - looks for keywords that indicate valuation differences
    const valueKeywords = ['value', 'important', 'significant', 'crucial', 'critical', 'essential'];
    
    let path1ValuationStatements = [];
    let path2ValuationStatements = [];
    
    // Extract value statements from path1
    if (path1.argument) {
        const sentences = path1.argument.split(/[.!?]+/);
        path1ValuationStatements = sentences.filter(sentence => 
            valueKeywords.some(keyword => sentence.toLowerCase().includes(keyword)));
    }
    
    // Extract value statements from path2
    if (path2.argument) {
        const sentences = path2.argument.split(/[.!?]+/);
        path2ValuationStatements = sentences.filter(sentence => 
            valueKeywords.some(keyword => sentence.toLowerCase().includes(keyword)));
    }
    
    // If both paths have value statements, check for conflicts
    // This is highly simplified and would need more sophisticated NLP in a real system
    if (path1ValuationStatements.length > 0 && path2ValuationStatements.length > 0) {
        // For demonstration, we'll assume conflict if they have different numbers of value statements
        // A real implementation would compare the actual content of the statements
        return path1ValuationStatements.length !== path2ValuationStatements.length;
    }
    
    return false;
}

/**
 * Detects priority conflicts between two reasoning paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {Object|null} A priority conflict object or null
 */
function detectPriorityConflict(path1, path2) {
    const priorities1 = extractPriorities(path1.argument);
    const priorities2 = extractPriorities(path2.argument);
    
    // If either path lacks priorities, no conflict can be detected
    if (priorities1.length === 0 || priorities2.length === 0) {
        return null;
    }
    
    // Check if the primary priorities are different
    if (priorities1[0] !== priorities2[0]) {
        // Determine severity based on how fundamentally different the priorities are
        const conflictingPriorities = {
            welfare: ['rights', 'community'],
            rights: ['welfare', 'community'],
            community: ['rights', 'welfare'],
            virtue: ['welfare'],
            care: ['welfare']
        };
        
        const priority1 = priorities1[0];
        const priority2 = priorities2[0];
        
        let severity = 'medium';
        if (conflictingPriorities[priority1] && conflictingPriorities[priority1].includes(priority2)) {
            severity = 'high';
        }
        
        return {
            priority1,
            priority2,
            severity
        };
    }
    
    return null;
}

/**
 * Detects factual interpretation conflicts between reasoning paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {Object|null} A factual conflict object or null
 */
function detectFactualInterpretationConflict(path1, path2) {
    // This implementation is simplified
    // A real implementation would use NLP to extract and compare factual claims
    
    // Look for contradictory statements about facts
    const factKeywords = ['fact', 'evidence', 'data', 'study', 'research', 'statistics', 'survey'];
    const contradictionPatterns = [
        { positive: /increases|improved|higher|better|more/, negative: /decreases|worsened|lower|worse|less/ },
        { positive: /always|all|every|must/, negative: /never|none|no|cannot/ },
        { positive: /certain|definitely|clearly/, negative: /uncertain|possibly|arguably/ }
    ];
    
    // Function to extract factual sentences
    const extractFactualSentences = (text) => {
        if (!text) return [];
        const sentences = text.split(/[.!?]+/);
        return sentences.filter(sentence => 
            factKeywords.some(keyword => sentence.toLowerCase().includes(keyword)));
    };
    
    const path1Facts = extractFactualSentences(path1.argument);
    const path2Facts = extractFactualSentences(path2.argument);
    
    // Check for contradictions
    for (const pattern of contradictionPatterns) {
        const path1Positive = path1Facts.some(fact => pattern.positive.test(fact.toLowerCase()));
        const path1Negative = path1Facts.some(fact => pattern.negative.test(fact.toLowerCase()));
        
        const path2Positive = path2Facts.some(fact => pattern.positive.test(fact.toLowerCase()));
        const path2Negative = path2Facts.some(fact => pattern.negative.test(fact.toLowerCase()));
        
        // If one path makes a positive claim and the other makes a negative claim about the same type of thing
        if ((path1Positive && path2Negative) || (path1Negative && path2Positive)) {
            return {
                factType: 'contradictory claims',
                path1Claim: path1Positive ? 'positive' : 'negative',
                path2Claim: path2Positive ? 'positive' : 'negative',
                severity: 'high'
            };
        }
    }
    
    return null;
}

/**
 * Checks if two paths have a method conflict.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @returns {boolean} True if there is a method conflict
 */
function hasMethodConflict(path1, path2) {
    // Method conflicts are identified by different framework names
    if (path1.framework && path2.framework && path1.framework !== path2.framework) {
        // Different frameworks often use different methods
        return true;
    }
    
    // Framework-specific methodological keywords
    const methodKeywords = {
        consequentialist: ['consequence', 'outcome', 'result', 'utility', 'benefit', 'harm'],
        deontological: ['duty', 'obligation', 'right', 'wrong', 'principle', 'rule', 'categorical'],
        virtue: ['character', 'virtue', 'vice', 'excellence', 'flourishing', 'habit'],
        care: ['care', 'relationship', 'connection', 'vulnerability', 'need', 'attention'],
        communitarian: ['community', 'tradition', 'culture', 'social', 'common good', 'history']
    };
    
    // Count method keywords in each path
    const countMethodKeywords = (text, method) => {
        if (!text) return 0;
        return methodKeywords[method].filter(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())).length;
    };
    
    // Determine the dominant method for each path
    const determineDominantMethod = (text) => {
        if (!text) return null;
        
        let dominantMethod = null;
        let highestCount = 0;
        
        for (const method in methodKeywords) {
            const count = countMethodKeywords(text, method);
            if (count > highestCount) {
                highestCount = count;
                dominantMethod = method;
            }
        }
        
        return dominantMethod;
    };
    
    const path1Method = determineDominantMethod(path1.argument);
    const path2Method = determineDominantMethod(path2.argument);
    
    // If both paths have identifiable methods and they're different, that's a conflict
    return path1Method && path2Method && path1Method !== path2Method;
}

/**
 * Generates resolution strategies for a conflict between two paths.
 * @param {Object} path1 - First reasoning path
 * @param {Object} path2 - Second reasoning path
 * @param {Object} conflict - The conflict object
 * @returns {Array<Object>} An array of resolution strategy objects
 */
function generateResolutionStrategies(path1, path2, conflict) {
    const strategies = [];
    
    // Add core strategy based on conflict type
    switch (conflict.type) {
        case 'PRIORITY':
            strategies.push({
                type: 'balance',
                description: 'Balance the competing priorities with contextual weighting'
            });
            strategies.push({
                type: 'stakeholder',
                description: 'Prioritize the most affected stakeholders'
            });
            break;
            
        case 'VALUE':
            strategies.push({
                type: 'compromise',
                description: 'Find a compromise position between the differing value assessments'
            });
            strategies.push({
                type: 'conditional',
                description: 'Apply different value assessments based on contextual factors'
            });
            break;
            
        case 'FACTUAL':
            strategies.push({
                type: 'epistemic',
                description: 'Acknowledge factual uncertainty and proceed with caution'
            });
            strategies.push({
                type: 'evidence',
                description: 'Gather more evidence to resolve the factual disagreement'
            });
            break;
            
        case 'METHOD':
            strategies.push({
                type: 'hybrid',
                description: 'Create a hybrid approach combining elements of both methods'
            });
            strategies.push({
                type: 'pluralistic',
                description: 'Acknowledge the validity of multiple ethical methods and present the action assessment from each perspective'
            });
            break;
    }

    return strategies;
}

/**
 * Extracts the core principle from a reasoning path.
 * @param {Object} path - The reasoning path
 * @returns {string} - The core principle
 */
function extractCorePrinciple(path) {
  return path.priority || getPriority(path) || 'general ethical considerations';
}

/**
 * Extract the main priority from a path
 * @param {Object} path - The reasoning path
 * @returns {string} - The main priority
 */
function extractMainPriority(path) {
  return extractCorePrinciple(path);
}

/**
 * Extract the secondary priority from a path
 * @param {Object} path - The reasoning path
 * @returns {string} - The secondary priority
 */
function extractSecondaryPriority(path) {
  const priorities = extractPriorities(path.argument);
  return priorities.length > 1 ? priorities[1] : 'other considerations';
}

/**
 * Extracts values mentioned in the argument text
 * @param {string} text - Argument text to analyze
 * @returns {Array} Array of values mentioned in the text
 */
function extractValues(text) {
    if (!text) return [];
    
    // Common ethical values to look for
    const commonValues = [
        "life", "lives", "autonomy", "rights", "welfare", "justice", "fairness", 
        "equality", "freedom", "liberty", "privacy", "dignity", "responsibility",
        "care", "compassion", "integrity", "honesty", "transparency", "duty",
        "virtue", "character", "community", "respect", "trust", "consent",
        "security", "safety", "efficiency", "benefit", "harm", "utility"
    ];
    
    // Extract values based on common ethical vocabulary
    const values = [];
    const lowerText = text.toLowerCase();
    
    for (const value of commonValues) {
        if (lowerText.includes(value.toLowerCase())) {
            values.push(value);
        }
    }
    
    return values;
}

/**
 * Finds conflicts between two sets of values
 * @param {Array} values1 - First set of values
 * @param {Array} values2 - Second set of values
 * @returns {Array} Array of conflicts between values
 */
function findValueConflicts(values1, values2) {
    const conflicts = [];
    
    // Common opposing value pairs
    const opposingValues = [
        ["freedom", "security"],
        ["autonomy", "welfare"],
        ["individual", "community"],
        ["efficiency", "equality"],
        ["privacy", "transparency"]
    ];
    
    // Check for opposing values in the two sets
    for (const pair of opposingValues) {
        const value1 = pair[0];
        const value2 = pair[1];
        
        const hasValue1 = values1.includes(value1);
        const hasValue2 = values2.includes(value2);
        
        if (hasValue1 && hasValue2) {
            conflicts.push({
                value1: value1,
                value2: value2
            });
        }
        
        // Check the reverse order too
        const hasReverseValue1 = values1.includes(value2);
        const hasReverseValue2 = values2.includes(value1);
        
        if (hasReverseValue1 && hasReverseValue2) {
            conflicts.push({
                value1: value2,
                value2: value1
            });
        }
    }
    
    return conflicts;
}

/**
 * Finds contradictions between two argument texts
 * @param {string} argument1 - First argument text
 * @param {string} argument2 - Second argument text
 * @returns {string|null} Description of the contradiction or null if none found
 */
function findContradictions(argument1, argument2) {
    // Simplified implementation - in reality, you would use NLP to identify contradictions
    // For now, we'll look for simple keyword oppositions
    
    const opposingPairs = [
        ["should", "should not"],
        ["must", "must not"],
        ["right", "wrong"],
        ["good", "bad"],
        ["beneficial", "harmful"],
        ["increase", "decrease"],
        ["allow", "forbid"]
    ];
    
    const lowerArg1 = argument1.toLowerCase();
    const lowerArg2 = argument2.toLowerCase();
    
    for (const pair of opposingPairs) {
        const term1 = pair[0];
        const term2 = pair[1];
        
        if (lowerArg1.includes(term1) && lowerArg2.includes(term2)) {
            return `Opposing actions: "${term1}" vs "${term2}"`;
        }
        
        if (lowerArg1.includes(term2) && lowerArg2.includes(term1)) {
            return `Opposing actions: "${term2}" vs "${term1}"`;
        }
    }
    
    return null;
}

/**
 * Helper function to increase conflict severity
 * @param {string} severity - Current severity level
 * @returns {string} Increased severity level
 */
function increaseSeverity(severity) {
    if (severity === 'low') return 'medium';
    if (severity === 'medium') return 'high';
    return 'high';
}

/**
 * Helper function to decrease conflict severity
 * @param {string} severity - Current severity level
 * @returns {string} Decreased severity level
 */
function decreaseSeverity(severity) {
    if (severity === 'high') return 'medium';
    if (severity === 'medium') return 'low';
    return 'low';
}

/**
 * Adjusts conflict severity based on action relevance
 * @param {Object} conflict - The conflict to adjust
 * @param {Array} granularElements - Array of granular elements with relevance scores
 * @returns {Object} Adjusted conflict
 */
function adjustForActionRelevance(conflict, granularElements = []) {
    // If no granular elements, return the conflict unchanged
    if (!granularElements || granularElements.length === 0) {
        return conflict;
    }

    let relevanceScore = 0.5; // Default medium relevance
    
    // For regular conflicts (same action)
    if (conflict.action) {
        const relevantElement = granularElements.find(element => 
            element.action === conflict.action || 
            (element.conclusion && element.conclusion === conflict.action)
        );
        
        if (relevantElement && relevantElement.relevance !== undefined) {
            relevanceScore = relevantElement.relevance;
        }
    } 
    // For cross-action conflicts
    else if (conflict.action1 && conflict.action2) {
        const relevantElement1 = granularElements.find(element => 
            element.action === conflict.action1 || 
            (element.conclusion && element.conclusion === conflict.action1)
        );
        
        const relevantElement2 = granularElements.find(element => 
            element.action === conflict.action2 || 
            (element.conclusion && element.conclusion === conflict.action2)
        );
        
        let relevance1 = 0.5;
        let relevance2 = 0.5;
        
        if (relevantElement1 && relevantElement1.relevance !== undefined) {
            relevance1 = relevantElement1.relevance;
        }
        
        if (relevantElement2 && relevantElement2.relevance !== undefined) {
            relevance2 = relevantElement2.relevance;
        }
        
        // Use the higher relevance for cross-action conflicts
        relevanceScore = Math.max(relevance1, relevance2);
    }
    
    // Adjust severity based on relevance
    let adjustedConflict = { ...conflict };
    
    if (relevanceScore > 0.7) {
        // High relevance - increase severity
        adjustedConflict.severity = increaseSeverity(conflict.severity || 'medium');
        adjustedConflict.relevanceAdjustment = 'increased';
    } else if (relevanceScore < 0.3) {
        // Low relevance - decrease severity
        adjustedConflict.severity = decreaseSeverity(conflict.severity || 'medium');
        adjustedConflict.relevanceAdjustment = 'decreased';
    }
    
    return adjustedConflict;
}

/**
 * Calculates the severity of a conflict based on:
 * 1. Conflict type
 * 2. Action relevance from granular elements
 * 3. Framework importance 
 * 4. Strength of conflicting elements
 * 
 * @param {Object} conflict - The conflict object
 * @param {Array} granularElements - Array of granular elements with pre-calculated relevance scores
 * @param {Array} reasoningPaths - Array of reasoning paths
 * @returns {string} Severity level ('low', 'medium', 'high', 'critical')
 */
function calculateConflictSeverity(conflict, granularElements = [], reasoningPaths = []) {
    console.log("\n====== CALCULATING CONFLICT SEVERITY ======");
    
    if (!conflict) {
        console.error("Conflict is undefined");
        return 'medium'; // Default severity
    }
    
    console.log(`Conflict type: ${conflict.type}`);
    console.log(`Frameworks involved: ${conflict.framework1 || ''} and ${conflict.framework2 || ''}`);
    if (conflict.action) {
        console.log(`Action: ${conflict.action}`);
    } else if (conflict.action1 && conflict.action2) {
        console.log(`Actions: ${conflict.action1} and ${conflict.action2}`);
    }
    
    // 1. Initial Severity based on Conflict Type
    let severity;
    switch (conflict.type) {
        case 'PRIORITY':
            severity = 'medium';
            break;
        case 'VALUE':
        case 'CROSS_ACTION_VALUE':
            severity = 'medium';
            break;
        case 'PRINCIPLE':
        case 'CROSS_ACTION_PRINCIPLE':
            severity = 'high';
            break;
        case 'FACTUAL':
            severity = 'high';
            break;
        case 'METHOD':
            severity = 'low';
            break;
        default:
            severity = 'medium';
    }
    console.log(`Initial severity based on conflict type: ${severity}`);
    
    // 2. Adjust for Action Relevance using pre-calculated scores in granularElements
    if (granularElements && granularElements.length > 0) {
        console.log("Adjusting severity based on action relevance from granular elements...");
        const relevantElements = [];
        
        // Handle CROSS_ACTION_VALUE conflicts (and others with action1/action2)
        if (conflict.action1 && conflict.action2) {
            for (const element of granularElements) {
                if (element.action === conflict.action1 || element.action === conflict.action2) {
                    console.log(`Found relevant element for action ${element.action}: relevance = ${element.relevance ? element.relevance.toFixed(2) : 'undefined'}`);
                    relevantElements.push(element);
                }
            }
        } else if (conflict.action) { // Handle conflicts with a single action
            for (const element of granularElements) {
                if (element.action === conflict.action) {
                    console.log(`Found relevant element for action ${element.action}: relevance = ${element.relevance ? element.relevance.toFixed(2) : 'undefined'}`);
                    relevantElements.push(element);
                }
            }
        }
        // If no action, but framework relevance
        else if (conflict.framework1 || conflict.framework2) {
            for (const element of granularElements) {
                if ((conflict.framework1 && element.framework === conflict.framework1) || 
                    (conflict.framework2 && element.framework === conflict.framework2)) {
                    console.log(`Found relevant element for framework ${element.framework}: relevance = ${element.relevance ? element.relevance.toFixed(2) : 'undefined'}`);
                    relevantElements.push(element);
                }
            }
        }
        
        // Calculate average relevance for the elements
        if (relevantElements.length > 0) {
            const relevantElementsWithScores = relevantElements.filter(el => typeof el.relevance === 'number');
            if (relevantElementsWithScores.length > 0) {
                const avgRelevance = relevantElementsWithScores.reduce((sum, el) => sum + el.relevance, 0) / relevantElementsWithScores.length;
                console.log(`Average relevance: ${avgRelevance.toFixed(2)}`);
                
                if (avgRelevance > 0.7) {
                    severity = increaseSeverity(severity);
                    console.log(`Increased severity to ${severity} due to high action relevance (${avgRelevance.toFixed(2)})`);
                } else if (avgRelevance < 0.3) {
                    severity = decreaseSeverity(severity);
                    console.log(`Decreased severity to ${severity} due to low action relevance (${avgRelevance.toFixed(2)})`);
                }
            }
        }
    }
    
    // 3. Adjust for Framework Importance using frameworkUtils
    console.log("Adjusting severity based on framework importance...");
    if (conflict.framework1 || conflict.framework2 || conflict.frameworks) {
        const { getFrameworkByName } = require('./frameworkRegistry');
        const { calculateFrameworkImportance } = require('./frameworkUtils');
        const dilemma = reasoningPaths.length > 0 && reasoningPaths[0].dilemma ? reasoningPaths[0].dilemma : null;
        const frameworksToCheck = conflict.frameworks || 
            [conflict.framework1, conflict.framework2].filter(f => f);
        
        let totalImportance = 0;
        let frameworkCount = 0;

        for (const frameworkName of frameworksToCheck) {
            const framework = getFrameworkByName(frameworkName);
            if (framework) {
                // Use calculateFrameworkImportance from frameworkUtils
                const importance = calculateFrameworkImportance(framework, dilemma);
                totalImportance += importance;
                frameworkCount++;
                console.log(`Framework importance for ${frameworkName}: ${importance.toFixed(2)}`);
            }
        }

        // Adjust severity based on average framework importance
        if (frameworkCount > 0) {
            const avgImportance = totalImportance / frameworkCount;
            console.log(`Average framework importance: ${avgImportance.toFixed(2)}`);
            
            if (avgImportance > 0.7) {
                severity = increaseSeverity(severity);
                console.log(`Increased severity to ${severity} due to high framework importance (${avgImportance.toFixed(2)})`);
            } else if (avgImportance < 0.3) {
                severity = decreaseSeverity(severity);
                console.log(`Decreased severity to ${severity} due to low framework importance (${avgImportance.toFixed(2)})`);
            }
        }
    }
    
    // 4. Additional factors can modify severity
    console.log("Checking additional severity factors...");
    
    // Factor: Strength of elements if available
    if (conflict.element1 && conflict.element2) {
        console.log(`Element strengths: ${conflict.element1.strength || 'undefined'} and ${conflict.element2.strength || 'undefined'}`);
        if (conflict.element1.strength === 'strong' && conflict.element2.strength === 'strong') {
            severity = increaseSeverity(severity);
            console.log(`Increased severity to ${severity} due to strong elements`);
        } else if (conflict.element1.strength === 'weak' && conflict.element2.strength === 'weak') {
            severity = decreaseSeverity(severity);
            console.log(`Decreased severity to ${severity} due to weak elements`);
        }
    }
    
    console.log(`Final conflict severity: ${severity}`);
    console.log("====== CONFLICT SEVERITY CALCULATION COMPLETE ======\n");
    return severity;
}

/**
 * Detects circular dependencies between reasoning paths
 * @param {Array} reasoningPaths - Array of reasoning paths
 * @returns {Array} Array of circular dependency conflicts
 */
function detectCircularDependencies(reasoningPaths) {
    if (!reasoningPaths || !Array.isArray(reasoningPaths) || reasoningPaths.length === 0) {
        return [];
    }

    const conflicts = [];
    const dependencyMap = new Map();

    // Build dependency map
    reasoningPaths.forEach(path => {
        if (path.depends_on) {
            dependencyMap.set(path.id, path.depends_on);
        }
    });

    // Check for circular dependencies
    dependencyMap.forEach((dependsOn, pathId) => {
        const visited = new Set();
        let currentId = pathId;
        
        while (dependencyMap.has(currentId) && !visited.has(currentId)) {
            visited.add(currentId);
            currentId = dependencyMap.get(currentId);
            
            // If we've reached the original path, we have a circular dependency
            if (currentId === pathId) {
                // Find the actual paths involved
                const path1 = reasoningPaths.find(p => p.id === pathId);
                const path2 = reasoningPaths.find(p => p.id === dependsOn);
                
                if (path1 && path2) {
                    conflicts.push({
                        type: 'CIRCULAR_DEPENDENCY',
                        framework1: path1.framework,
                        framework2: path2.framework,
                        frameworks: [path1.framework, path2.framework],
                        action1: path1.action,
                        action2: path2.action,
                        description: `Circular dependency detected between ${path1.framework} and ${path2.framework}`,
                        severity: 'high',
                        paths: [path1, path2]
                    });
                }
                break;
            }
        }
    });

    return conflicts;
}

/**
 * Detects all conflicts within and across actions
 * @param {Array} reasoningPaths - Array of reasoning paths
 * @param {Object} dilemma - The dilemma object
 * @param {Array} granularElements - Array of granular elements
 * @returns {Object} Object containing all detected conflicts
 */
function detectAllConflicts(reasoningPaths, dilemma = null, granularElements = []) {
    console.log("Detecting all conflicts (within and across actions)...");
    console.log("Reasoning Paths (detectAllConflicts):", JSON.stringify(reasoningPaths, null, 2)); // Log paths
    console.log("Granular Elements (detectAllConflicts):", JSON.stringify(granularElements, null, 2)); // Log elements
  
    const allConflicts = [];
    const sameActionConflicts = [];
    const crossActionConflicts = [];
  
    console.log("Detecting granular element conflicts between reasoning paths...");
    const granularConflicts = detectGranularElementConflicts(reasoningPaths, granularElements); //Pass elements
    console.log(`Detected ${granularConflicts.length} granular element conflicts`);
    allConflicts.push(...granularConflicts);
    sameActionConflicts.push(...granularConflicts);
  
    console.log("Detecting cross-action conflicts...");
    const crossAction = detectCrossActionConflicts(reasoningPaths, dilemma, granularElements); // Pass granular elements
    console.log(`Detected ${crossAction.length} cross-action conflicts`);
    allConflicts.push(...crossAction);
    crossActionConflicts.push(...crossAction);
  
    // Detect circular dependencies
    const circularDependencyConflicts = detectCircularDependencies(reasoningPaths);
    console.log(`Detected ${circularDependencyConflicts.length} circular dependency conflicts`);
    allConflicts.push(...circularDependencyConflicts);
  
    // Removed severity calculation as it will be done in the test file
    console.log(`Found ${allConflicts.length} conflicts`);
    
    const result = {
      all: allConflicts,
      sameAction: sameActionConflicts,
      crossAction: crossActionConflicts,
      granular: granularConflicts
    };
    console.log("Detected Conflicts:", JSON.stringify(result, null, 2));
  
    return result;
}

/**
 * Detects conflicts between paths that recommend different actions
 * @param {Array} reasoningPaths - Array of reasoning paths
 * @param {Object} dilemma - The dilemma object
 * @param {Array} granularElements - Array of granular elements
 * @returns {Array} Array of detected cross-action conflicts
 */
function detectCrossActionConflicts(reasoningPaths, dilemma, granularElements) {
    if (!reasoningPaths || !Array.isArray(reasoningPaths) || reasoningPaths.length < 2) {
        return [];
    }

    const conflicts = [];
    const pathsByAction = groupPathsByAction(reasoningPaths);
    
    // Compare paths with different actions
    const actions = Object.keys(pathsByAction);
    
    for (let i = 0; i < actions.length; i++) {
        for (let j = i + 1; j < actions.length; j++) {
            const action1 = actions[i];
            const action2 = actions[j];
            
            const paths1 = pathsByAction[action1];
            const paths2 = pathsByAction[action2];
            
            for (const path1 of paths1) {
                for (const path2 of paths2) {
                    // Skip if both paths are from reconciled sources
                    if (path1.source === 'reconciled' && path2.source === 'reconciled') {
                        continue;
                    }
                    
                    // Check for different frameworks recommending different actions
                    if (path1.framework !== path2.framework) {
                        const conflict = {
                            type: 'CROSS_ACTION_VALUE',
                            framework1: path1.framework,
                            framework2: path2.framework,
                            frameworks: [path1.framework, path2.framework],
                            action1: path1.action || path1.conclusion,
                            action2: path2.action || path2.conclusion,
                            // Set a primary action for the conflict (use the first action as default)
                            action: path1.action || path1.conclusion,
                            description: `Different actions recommended by different frameworks: ${path1.framework} recommends ${path1.action || path1.conclusion} while ${path2.framework} recommends ${path2.action || path2.conclusion}`,
                            severity: 'medium',
                            paths: [path1, path2]
                        };
                        
                        conflicts.push(conflict);
                    }
                    
                    // Check for conflicting principles between different actions
                    if (path1.source_elements && path2.source_elements) {
                        const principles1 = path1.source_elements.filter(e => e.type === 'principle');
                        const principles2 = path2.source_elements.filter(e => e.type === 'principle');
                        
                        for (const principle1 of principles1) {
                            for (const principle2 of principles2) {
                                // Check if principles are explicitly marked as conflicting
                                const isConflicting = 
                                    (principle1.conflicting_principles && principle1.conflicting_principles.includes(principle2.content)) ||
                                    (principle2.conflicting_principles && principle2.conflicting_principles.includes(principle1.content));
                                
                                if (isConflicting) {
                                    const conflict = {
                                        type: 'CROSS_ACTION_PRINCIPLE',
                                        framework1: path1.framework,
                                        framework2: path2.framework,
                                        frameworks: [path1.framework, path2.framework],
                                        action1: path1.action || path1.conclusion,
                                        action2: path2.action || path2.conclusion,
                                        // Set a primary action for the conflict (use the first action as default)
                                        action: path1.action || path1.conclusion,
                                        element1: principle1,
                                        element2: principle2,
                                        description: `Conflicting principles between different actions: ${principle1.content} (${path1.action || path1.conclusion}) vs ${principle2.content} (${path2.action || path2.conclusion})`,
                                        severity: 'high',
                                        paths: [path1, path2]
                                    };
                                    
                                    conflicts.push(conflict);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    return conflicts;
}

/**
 * Detects conflicts between granular elements
 * @param {Array} reasoningPaths - Array of reasoning paths (not used directly but kept for API consistency)
 * @param {Array} granularElements - Array of granular elements
 * @returns {Array} Array of detected conflicts
 */
function detectGranularElementConflicts(reasoningPaths, granularElements) {
    const conflicts = [];
    if (!granularElements || granularElements.length === 0) {
        return conflicts;
    }

    console.log("Detecting granular element conflicts with", granularElements.length, "elements");
    
    // Check for internal conflicts within each element
    granularElements.forEach(element => {
        // Normalize the type check to support both 'PRINCIPLE' and 'principle'
        const isPrinciple = element.type && 
            (element.type.toUpperCase() === 'PRINCIPLE' || 
             element.type.toLowerCase() === 'principle');
             
        if (isPrinciple && element.conflicting_principles && element.conflicting_principles.length > 0) {
            const principle = element.principle || element.content;
            console.log("Found element with conflicting principles:", principle, element.conflicting_principles);
            
            element.conflicting_principles.forEach(conflictingPrinciple => {
                // Get the actual element that has this content
                let conflictElement = granularElements.find((el) => 
                    (el.principle === conflictingPrinciple || el.content === conflictingPrinciple));
                
                if (!conflictElement) {
                    console.log("Could not locate element with principle/content:", conflictingPrinciple);
                    // Create a dummy element if we can't find the actual one
                    conflictElement = { 
                        type: 'PRINCIPLE',
                        principle: conflictingPrinciple,
                        content: conflictingPrinciple,
                        framework: element.framework // Use the same framework
                    };
                } else {
                    console.log("Found matching conflict element:", conflictElement.principle || conflictElement.content);
                }
                
                // Create a PRINCIPLE conflict
                const newConflict = {
                    type: 'PRINCIPLE',
                    framework1: element.framework,
                    framework2: element.framework, // Same framework for internal conflicts
                    frameworks: [element.framework], // Array of frameworks involved
                    action1: element.action,
                    element1: element,
                    element2: conflictElement,
                    description: `Conflicting principles within ${element.framework}: ${principle} vs. ${conflictingPrinciple}`,
                    severity: 'medium', // Default severity, will be adjusted later
                    reason: `Conflicting principles: ${principle} vs. ${conflictingPrinciple}`
                };
                
                conflicts.push(newConflict);
                console.log("Added PRINCIPLE conflict:", principle, "vs", conflictingPrinciple);
            });
        }
    });
    
    // Also check for conflicts between different elements
    for (let i = 0; i < granularElements.length; i++) {
        for (let j = i + 1; j < granularElements.length; j++) {
            const element1 = granularElements[i];
            const element2 = granularElements[j];
            
            // Both should be principles
            const isPrinciple1 = element1.type && 
                (element1.type.toUpperCase() === 'PRINCIPLE' || 
                 element1.type.toLowerCase() === 'principle');
                 
            const isPrinciple2 = element2.type && 
                (element2.type.toUpperCase() === 'PRINCIPLE' || 
                 element2.type.toLowerCase() === 'principle');
            
            // Same framework, same action, both are principles
            if (element1.framework === element2.framework && 
                element1.action === element2.action && 
                isPrinciple1 && isPrinciple2) {
                
                const principle1 = element1.principle || element1.content;
                const principle2 = element2.principle || element2.content;
                
                // Check if element1 lists element2's content as conflicting
                if (element1.conflicting_principles && 
                    element1.conflicting_principles.includes(principle2)) {
                    
                    // Create a PRINCIPLE conflict
                    const newConflict = {
                        type: 'PRINCIPLE',
                        framework1: element1.framework,
                        framework2: element2.framework,
                        frameworks: [element1.framework], // Same framework
                        action1: element1.action,
                        element1: element1,
                        element2: element2,
                        description: `Conflicting principles within ${element1.framework}: ${principle1} vs. ${principle2}`,
                        severity: 'medium', // Default severity
                        reason: `Conflicting principles: ${principle1} vs. ${principle2}`
                    };
                    
                    conflicts.push(newConflict);
                    console.log("Added PRINCIPLE conflict between different elements:", principle1, "vs", principle2);
                }
                
                // Check the reverse direction too
                if (element2.conflicting_principles && 
                    element2.conflicting_principles.includes(principle1)) {
                    
                    // Create a PRINCIPLE conflict (avoid duplicates)
                    if (!conflicts.some(c => 
                        c.type === 'PRINCIPLE' && 
                        c.element1 === element2 && 
                        c.element2 === element1)) {
                            
                        const newConflict = {
                            type: 'PRINCIPLE',
                            framework1: element2.framework,
                            framework2: element1.framework,
                            frameworks: [element2.framework], // Same framework
                            action1: element2.action,
                            element1: element2,
                            element2: element1,
                            description: `Conflicting principles within ${element2.framework}: ${principle2} vs. ${principle1}`,
                            severity: 'medium', // Default severity
                            reason: `Conflicting principles: ${principle2} vs. ${principle1}`
                        };
                        
                        conflicts.push(newConflict);
                        console.log("Added PRINCIPLE conflict (reverse):", principle2, "vs", principle1);
                    }
                }
            }
        }
    }
    
    console.log(`Detected ${conflicts.length} granular element conflicts`);
    return conflicts;
}

// Export the functions
module.exports = {
    detectConflicts,
    groupPathsByAction,
    identifyConflict,
    checkPriorityConflict,
    checkValuationConflict,
    checkFactualConflict,
    checkMethodConflict,
    suggestResolutionStrategies,
    extractPriorities,
    getPriority,
    detectPathConflicts,
    checkPathConflict,
    hasValuationConflict,
    detectPriorityConflict,
    detectFactualInterpretationConflict,
    hasMethodConflict,
    generateResolutionStrategies,
    extractCorePrinciple,
    extractMainPriority,
    extractSecondaryPriority,
    extractValues,
    findValueConflicts,
    findContradictions,
    increaseSeverity,
    decreaseSeverity,
    adjustForActionRelevance,
    calculateConflictSeverity,
    detectAllConflicts,
    detectCrossActionConflicts,
    detectGranularElementConflicts,
    detectCircularDependencies
};
