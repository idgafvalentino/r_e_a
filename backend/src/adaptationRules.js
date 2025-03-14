/**
 * Adapter for adaptationRules.js
 * 
 * This file provides backward compatibility for code that imports from adaptationRules.js.
 * It re-exports the functionality from the refactored modules.
 */

// Import from the refactored modules
console.log("LOADING backend/src/adaptationRules.js");
const { rules } = require('../../src/adaptation');
const coreRules = require('../../src/adaptation/rules/core');
console.log("Loaded coreRules module:", Object.keys(coreRules));
const dilemmaRules = require('../../src/adaptation/rules/dilemma');
const situationRules = require('../../src/adaptation/rules/situation');
const frameworkRules = require('../../src/adaptation/rules/framework');

// Import utility functions
const { deepClone } = require('../../src/utils/general');

// Explicitly log the imported function types
console.log("Imported adaptReasoningForPeopleCount type:", typeof coreRules.adaptReasoningForPeopleCount);
console.log("Imported adaptNumberOfPeopleRule type:", typeof coreRules.adaptNumberOfPeopleRule);

/**
 * Adapt a reasoning path based on the number of people affected
 * @param {Object} path - The reasoning path to adapt
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} originalDilemma - The original dilemma for comparison
 * @returns {Object} Adapted reasoning path
 */
function adaptNumberOfPeopleRule(path, dilemma, originalDilemma) {
    console.log("LOCAL adaptNumberOfPeopleRule called with path:", typeof path);
    console.log("LOCAL adaptNumberOfPeopleRule called from:", new Error().stack);
    
    // Return original path for edge cases
    if (!path || !dilemma || !originalDilemma) {
        console.log("LOCAL adaptNumberOfPeopleRule: Edge case detected, returning original path");
        return path;
    }
    
    // Check if dilemma has the necessary parameters
    if (!dilemma.situation || !dilemma.situation.parameters || 
        !originalDilemma.situation || !originalDilemma.situation.parameters) {
        console.log("LOCAL adaptNumberOfPeopleRule: Missing parameters, returning original path");
        return path;
    }
    
    try {
        // Create a deep copy of the path to modify
        const adaptedPath = deepClone(path);
        console.log("LOCAL adaptNumberOfPeopleRule: Created deep copy of path:", typeof adaptedPath);
        
        // Get the number of people affected in both dilemmas
        const originalPeople = getNumberOfPeopleAffected(originalDilemma);
        const newPeople = getNumberOfPeopleAffected(dilemma);
        console.log(`LOCAL adaptNumberOfPeopleRule: originalPeople=${originalPeople}, newPeople=${newPeople}`);
        
        // If we couldn't extract the values, return the original path
        if (originalPeople === undefined || newPeople === undefined) {
            console.log("LOCAL adaptNumberOfPeopleRule: Could not extract people values, returning original path");
            return path;
        }
        
        // If the framework is utilitarian, adjust the strength based on the ratio
        if (path.framework && path.framework.toLowerCase().includes('utilitarian')) {
            if (newPeople > originalPeople) {
                // More people affected strengthens utilitarian conclusion
                adaptedPath.strength = strengthenConclusion(path.strength);
                adaptedPath.argument = adaptedPath.argument + 
                    `\n\nFrom a Utilitarianism perspective, this conclusion is strengthened because the increased number of people affected (${newPeople} vs ${originalPeople}) increases the overall utility calculation.`;
                console.log("LOCAL adaptNumberOfPeopleRule: Strengthened utilitarian conclusion");
            } else if (newPeople < originalPeople) {
                // Fewer people affected weakens utilitarian conclusion
                adaptedPath.strength = weakenConclusion(path.strength);
                adaptedPath.argument = adaptedPath.argument + 
                    `\n\nFrom a Utilitarianism perspective, this conclusion is weakened because the decreased number of people affected (${newPeople} vs ${originalPeople}) reduces the overall utility calculation.`;
                console.log("LOCAL adaptNumberOfPeopleRule: Weakened utilitarian conclusion");
            }
        }
        
        console.log("LOCAL adaptNumberOfPeopleRule: Returning adapted path:", typeof adaptedPath);
        console.log("LOCAL adaptNumberOfPeopleRule: Final adapted path:", JSON.stringify(adaptedPath));
        return adaptedPath;
    } catch (error) {
        console.error("Error in LOCAL adaptNumberOfPeopleRule:", error);
        return path; // Return the original path if there's an error
    }
}

/**
 * Adapt a reasoning path based on special obligations and relationships
 * @param {Object} path - The reasoning path to adapt
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} originalDilemma - The original dilemma for comparison
 * @returns {Object} Adapted reasoning path
 */
function adaptSpecialObligationsRule(path, dilemma, originalDilemma) {
    // Return original path for edge cases
    if (!path || !dilemma || !originalDilemma) {
        return path;
    }
    
    // Check if dilemma has the necessary parameters
    if (!dilemma.situation || !dilemma.situation.parameters || 
        !originalDilemma.situation || !originalDilemma.situation.parameters) {
        return path;
    }
    
    try {
        // Create a deep copy of the path to modify
        const adaptedPath = deepClone(path);
        
        // Get the relationship types in both dilemmas
        const originalRelationship = getRelationshipType(originalDilemma);
        const newRelationship = getRelationshipType(dilemma);
        
        // If we couldn't extract the values, return the original path
        if (originalRelationship === 'unknown' && newRelationship === 'unknown') {
            return path;
        }
        
        // If the framework is care ethics, adjust the strength based on the relationship
        // Use case-insensitive check for "care" anywhere in the framework name
        if (path.framework && path.framework.toLowerCase().includes('care')) {
            const relationshipProximity = compareRelationshipProximity(originalRelationship, newRelationship);
            
            if (relationshipProximity > 0) {
                // Closer relationship strengthens care ethics conclusion
                adaptedPath.strength = strengthenConclusion(path.strength);
                
                // If the relationship is significantly closer (like child vs stranger), change conclusion
                if (relationshipProximity >= 5 && adaptedPath.conclusion === 'seek_alternatives') {
                    adaptedPath.conclusion = 'steal_drug';
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nThis conclusion is changed from seeking alternatives to stealing the drug because the relationship (${newRelationship}) is significantly closer than in the original situation (${originalRelationship}). From a care ethics perspective, we have much stronger special obligations to those closest to us, which justifies taking more direct action.`;
                } else {
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nThis conclusion is strengthened because the relationship (${newRelationship}) is closer than in the original situation (${originalRelationship}), which increases the special obligation from a care ethics perspective.`;
                }
            } else if (relationshipProximity < 0) {
                // More distant relationship weakens care ethics conclusion
                adaptedPath.strength = weakenConclusion(path.strength);
                adaptedPath.argument = adaptedPath.argument + 
                    `\n\nThis conclusion is weakened because the relationship (${newRelationship}) is more distant than in the original situation (${originalRelationship}), which decreases the special obligation from a care ethics perspective.`;
            }
        }
        
        return adaptedPath;
    } catch (error) {
        console.error("Error in adaptSpecialObligationsRule:", error);
        return path; // Return the original path if there's an error
    }
}

/**
 * Adapt a reasoning path based on property value considerations
 * @param {Object} path - The reasoning path to adapt
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} originalDilemma - The original dilemma for comparison
 * @returns {Object} Adapted reasoning path
 */
function adaptPropertyValueRule(path, dilemma, originalDilemma) {
    console.log("adaptPropertyValueRule called with path:", typeof path);
    
    // Return original path for edge cases
    if (!path || !dilemma || !originalDilemma) {
        console.log("adaptPropertyValueRule: Edge case detected, returning original path");
        return path;
    }
    
    // Check if dilemma has the necessary parameters
    if (!dilemma.situation || !dilemma.situation.parameters || 
        !originalDilemma.situation || !originalDilemma.situation.parameters) {
        console.log("adaptPropertyValueRule: Missing parameters, returning original path");
        return path;
    }
    
    try {
        // Create a deep copy of the path to modify
        const adaptedPath = deepClone(path);
        console.log("adaptPropertyValueRule: Created deep copy of path:", typeof adaptedPath);
        
        // Get the property values in both dilemmas
        const originalValue = getPropertyValue(originalDilemma);
        const newValue = getPropertyValue(dilemma);
        console.log(`adaptPropertyValueRule: originalValue=${originalValue}, newValue=${newValue}`);
        
        // If we couldn't extract the values, return the original path
        if (originalValue === undefined || newValue === undefined) {
            console.log("adaptPropertyValueRule: Could not extract property values, returning original path");
            return path;
        }
        
        // Adjust the strength based on the property value and framework
        if (path.framework) {
            const framework = path.framework.toLowerCase();
            
            if (framework.includes('utilitarian')) {
                if (newValue < originalValue) {
                    // Lower property value strengthens utilitarian conclusion for taking the property
                    adaptedPath.strength = strengthenConclusion(path.strength);
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nFrom a Utilitarianism perspective, this conclusion is strengthened because the decreased property value (${newValue} vs ${originalValue}) reduces the harm in the utility calculation. The lower property value makes the action more justifiable as it reduces the overall harm caused.`;
                    console.log("adaptPropertyValueRule: Strengthened utilitarian conclusion");
                } else if (newValue > originalValue) {
                    // Higher property value weakens utilitarian conclusion for taking the property
                    adaptedPath.strength = weakenConclusion(path.strength);
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nFrom a Utilitarianism perspective, this conclusion is weakened because the increased property value (${newValue} vs ${originalValue}) increases the harm in the utility calculation. The higher property value makes the action less justifiable as it increases the overall harm caused.`;
                    console.log("adaptPropertyValueRule: Weakened utilitarian conclusion");
                }
            } else if (framework.includes('natural') && framework.includes('law')) {
                if (newValue > originalValue) {
                    // Higher property value weakens natural law conclusion
                    adaptedPath.strength = weakenConclusion(path.strength);
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nFrom a Natural Law Theory perspective, this conclusion is weakened because the increased property value (${newValue} vs ${originalValue}) increases the moral weight of property rights. The higher property value makes the action less proportionate to the need.`;
                    console.log("adaptPropertyValueRule: Weakened natural law conclusion");
                } else if (newValue < originalValue) {
                    // Lower property value strengthens natural law conclusion
                    adaptedPath.strength = strengthenConclusion(path.strength);
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nFrom a Natural Law Theory perspective, this conclusion is strengthened because the decreased property value (${newValue} vs ${originalValue}) decreases the moral weight of property rights. The lower property value makes the action more proportionate to the need.`;
                    console.log("adaptPropertyValueRule: Strengthened natural law conclusion");
                }
            } else if (framework.includes('deontolog') || framework.includes('kantian')) {
                if (newValue > originalValue) {
                    // Higher property value might weaken deontological conclusion
                    adaptedPath.strength = weakenConclusion(path.strength);
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nFrom a Kantian Deontology perspective, this conclusion is weakened because the increased property value (${newValue} vs ${originalValue}) increases the moral weight of property rights. The higher property value increases the significance of the duty not to take others' property.`;
                    console.log("adaptPropertyValueRule: Weakened deontological conclusion");
                } else if (newValue < originalValue) {
                    // Lower property value might strengthen deontological conclusion
                    adaptedPath.strength = strengthenConclusion(path.strength);
                    adaptedPath.argument = adaptedPath.argument + 
                        `\n\nFrom a Kantian Deontology perspective, this conclusion is strengthened because the decreased property value (${newValue} vs ${originalValue}) decreases the moral weight of property rights. The lower property value decreases the significance of the duty not to take others' property relative to other duties.`;
                    console.log("adaptPropertyValueRule: Strengthened deontological conclusion");
                }
            }
        }
        
        console.log("adaptPropertyValueRule: Returning adapted path:", typeof adaptedPath);
        return adaptedPath;
    } catch (error) {
        console.error("Error in adaptPropertyValueRule:", error);
        return path; // Return the original path if there's an error
    }
}

/**
 * Adapt a reasoning path based on life vs property considerations
 * @param {Object} path - The reasoning path to adapt
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} originalDilemma - The original dilemma for comparison
 * @returns {Object} Adapted reasoning path
 */
function adaptLifeVsPropertyRule(path, dilemma, originalDilemma) {
    console.log("adaptLifeVsPropertyRule called with path:", typeof path);
    
    // Return original path for edge cases
    if (!path || !dilemma || !originalDilemma) {
        console.log("adaptLifeVsPropertyRule: Edge case detected, returning original path");
        return path;
    }
    
    // Check if dilemma has the necessary parameters
    if (!dilemma.situation || !dilemma.situation.parameters || 
        !originalDilemma.situation || !originalDilemma.situation.parameters) {
        console.log("adaptLifeVsPropertyRule: Missing parameters, returning original path");
        return path;
    }
    
    try {
        // Create a deep copy of the path to modify
        const adaptedPath = deepClone(path);
        console.log("adaptLifeVsPropertyRule: Created deep copy of path:", typeof adaptedPath);
        
        // Check if life is at stake in both dilemmas
        const originalLifeAtStake = isLifeAtStake(originalDilemma);
        const newLifeAtStake = isLifeAtStake(dilemma);
        console.log(`adaptLifeVsPropertyRule: originalLifeAtStake=${originalLifeAtStake}, newLifeAtStake=${newLifeAtStake}`);
        
        // If we couldn't extract the values, return the original path
        if (originalLifeAtStake === undefined || newLifeAtStake === undefined) {
            console.log("adaptLifeVsPropertyRule: Could not extract life at stake values, returning original path");
            return path;
        }
        
        // If there's a change in whether life is at stake, adjust the strength
        if (originalLifeAtStake !== newLifeAtStake) {
            if (path.framework) {
                const framework = path.framework.toLowerCase();
                
                if (newLifeAtStake && !originalLifeAtStake) {
                    // Life now at stake strengthens most ethical conclusions
                    if (framework.includes('utilitarian')) {
                        // For utilitarian framework, strengthen the conclusion significantly
                        adaptedPath.strength = strengthenConclusion(path.strength);
                        adaptedPath.argument = adaptedPath.argument + 
                            `\n\nThis conclusion is strengthened because human life is now at stake, which significantly increases the utility of the action that saves life. From a utilitarian perspective, preventing death carries much greater weight than protecting property.`;
                        console.log("adaptLifeVsPropertyRule: Strengthened utilitarian conclusion");
                    } else if (framework.includes('natural') && framework.includes('law')) {
                        // For natural law framework, strengthen the conclusion significantly
                        adaptedPath.strength = strengthenConclusion(path.strength);
                        adaptedPath.argument = adaptedPath.argument + 
                            `\n\nThis conclusion is strengthened because human life is now at stake, which significantly increases the moral imperative to act. From a natural law perspective, the protection of human life is a fundamental good that takes precedence over property rights.`;
                        console.log("adaptLifeVsPropertyRule: Strengthened natural law conclusion");
                    } else {
                        // For other frameworks
                        adaptedPath.strength = strengthenConclusion(path.strength);
                        adaptedPath.argument = adaptedPath.argument + 
                            `\n\nThis conclusion is strengthened because human life is now at stake, which carries greater moral weight than property considerations alone.`;
                        console.log("adaptLifeVsPropertyRule: Strengthened other framework conclusion");
                    }
                } else if (!newLifeAtStake && originalLifeAtStake) {
                    // Life no longer at stake weakens most ethical conclusions
                    if (framework.includes('natural') && framework.includes('law')) {
                        // For natural law framework, weaken the conclusion significantly
                        adaptedPath.strength = weakenConclusion(path.strength);
                        adaptedPath.argument = adaptedPath.argument + 
                            `\n\nThis conclusion is weakened because human life is no longer at stake, which significantly reduces the moral imperative to act. From a natural law perspective, when only property is concerned rather than human life, the action becomes less justified.`;
                        console.log("adaptLifeVsPropertyRule: Weakened natural law conclusion");
                    } else if (framework.includes('utilitarian')) {
                        // For utilitarian framework, weaken the conclusion
                        adaptedPath.strength = weakenConclusion(path.strength);
                        adaptedPath.argument = adaptedPath.argument + 
                            `\n\nThis conclusion is weakened because human life is no longer at stake, which reduces the utility of the action. From a utilitarian perspective, when only property is concerned rather than human life, the potential benefit is significantly reduced.`;
                        console.log("adaptLifeVsPropertyRule: Weakened utilitarian conclusion");
                    } else {
                        // For other frameworks
                        adaptedPath.strength = weakenConclusion(path.strength);
                        adaptedPath.argument = adaptedPath.argument + 
                            `\n\nThis conclusion is weakened because human life is no longer at stake, which reduces the moral urgency of the situation.`;
                        console.log("adaptLifeVsPropertyRule: Weakened other framework conclusion");
                    }
                }
            }
        }
        
        console.log("adaptLifeVsPropertyRule: Returning adapted path:", typeof adaptedPath);
        return adaptedPath;
    } catch (error) {
        console.error("Error in adaptLifeVsPropertyRule:", error);
        return path; // Return the original path if there's an error
    }
}

/**
 * Apply all adaptation rules to a reasoning path
 * @param {Object} framework - The ethical framework
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} action - The action being considered
 * @returns {Object} Adapted reasoning path
 */
function applyAdaptationRules(framework, dilemma, action) {
    // Create a basic reasoning path
    const frameworkName = framework.id || framework.name;
    let frameworkDescription = '';
    
    // Add specific framework descriptions based on the framework type
    if (frameworkName.toLowerCase().includes('utilitarian')) {
        frameworkDescription = 'utilitarian';
    } else if (frameworkName.toLowerCase().includes('deontolog')) {
        frameworkDescription = 'deontological';
    } else if (frameworkName.toLowerCase().includes('care')) {
        frameworkDescription = 'care ethics';
    } else if (frameworkName.toLowerCase().includes('virtue')) {
        frameworkDescription = 'virtue ethics';
    } else {
        frameworkDescription = frameworkName;
    }
    
    const actionName = action.id || action.name || action;
    
    const path = {
        framework: frameworkName,
        action: actionName,
        strength: 'moderate',
        argument: `From a ${frameworkDescription} perspective, the action ${actionName} is ethically justified. This ${frameworkDescription} analysis considers the ethical implications according to ${frameworkName} principles.`
    };
    
    // Apply all adaptation rules
    return rules.applyAllRules ? rules.applyAllRules(path, dilemma, {}) : path;
}

// Helper functions
function getNumberOfPeopleAffected(dilemma) {
    if (!dilemma || !dilemma.situation || !dilemma.situation.parameters) {
        return undefined;
    }
    
    const params = dilemma.situation.parameters;
    
    if (params.num_people_affected !== undefined) {
        return typeof params.num_people_affected === 'object' 
            ? params.num_people_affected.value 
            : params.num_people_affected;
    }
    
    if (params.people_affected !== undefined) {
        return typeof params.people_affected === 'object'
            ? params.people_affected.value
            : params.people_affected;
    }
    
    return undefined;
}

function getRelationshipType(dilemma) {
    if (!dilemma || !dilemma.situation || !dilemma.situation.parameters) {
        return 'unknown';
    }
    
    const params = dilemma.situation.parameters;
    
    if (params.relationship_to_beneficiary !== undefined) {
        return typeof params.relationship_to_beneficiary === 'object'
            ? params.relationship_to_beneficiary.value
            : params.relationship_to_beneficiary;
    }
    
    return 'unknown';
}

function compareRelationshipProximity(original, current) {
    const proximityRanking = {
        'self': 10,
        'child': 9,
        'spouse': 8,
        'parent': 7,
        'sibling': 6,
        'family_member': 5,
        'friend': 4,
        'colleague': 3,
        'acquaintance': 2,
        'stranger': 1,
        'unknown': 0
    };
    
    const originalRank = proximityRanking[original.toLowerCase()] || 0;
    const currentRank = proximityRanking[current.toLowerCase()] || 0;
    
    return currentRank - originalRank;
}

function getPropertyValue(dilemma) {
    if (!dilemma || !dilemma.situation || !dilemma.situation.parameters) {
        return undefined;
    }
    
    const params = dilemma.situation.parameters;
    
    if (params.property_value !== undefined) {
        const value = typeof params.property_value === 'object'
            ? params.property_value.value
            : params.property_value;
        
        if (typeof value === 'number') {
            return value;
        }
        
        // Convert string values to numbers
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'high') return 3;
            if (value.toLowerCase() === 'moderate') return 2;
            if (value.toLowerCase() === 'low') return 1;
            
            // Try to parse as number
            const parsed = parseInt(value, 10);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
    }
    
    return undefined;
}

function isLifeAtStake(dilemma) {
    if (!dilemma || !dilemma.situation || !dilemma.situation.parameters) {
        return undefined;
    }
    
    const params = dilemma.situation.parameters;
    
    if (params.life_at_stake !== undefined) {
        const value = typeof params.life_at_stake === 'object'
            ? params.life_at_stake.value
            : params.life_at_stake;
        
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || 
                   value.toLowerCase() === 'yes' || 
                   value === '1';
        }
        
        return Boolean(value);
    }
    
    return undefined;
}

function strengthenConclusion(strength) {
    if (typeof strength === 'number') {
        return Math.min(1, strength + 0.2);
    }
    
    if (strength === 'weak') return 'moderate';
    if (strength === 'moderate') return 'strong';
    
    return 'strong';
}

function weakenConclusion(strength) {
    if (typeof strength === 'number') {
        return Math.max(0, strength - 0.2);
    }
    
    if (strength === 'strong') return 'moderate';
    if (strength === 'moderate') return 'weak';
    
    return 'weak';
}

// Export all adaptation rule functions - MODIFIED TO ENSURE LOCAL FUNCTIONS TAKE PRECEDENCE
module.exports = {
    // Core adaptation functions - explicitly declare these first to give them precedence
    adaptNumberOfPeopleRule,
    adaptSpecialObligationsRule,
    adaptPropertyValueRule,
    adaptLifeVsPropertyRule,
    applyAdaptationRules,
    
    // Re-export from refactored modules - these come AFTER our local functions
    ...coreRules,
    ...dilemmaRules,
    ...situationRules,
    ...frameworkRules
};
