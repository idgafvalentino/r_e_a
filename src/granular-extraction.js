// granular-extraction.js - Framework for granular extraction and combination of reasoning elements

// Dependency on similarity and adaptation functions
const { calculateSimilarity } = require('./similarity');
const { adaptReasoningPaths } = require('./adaptation');
const frameworkLogger = require('./frameworkLogger'); // Import framework logger
const frameworkRegistry = require('./frameworkRegistry'); // Import framework registry
const utils = require('./utils'); // Import all utility functions
const { 
  generateId, 
  deepCopy, 
  actionRelevanceScore 
} = utils; // Destructure commonly used functions for direct access

/**
 * Main function to extract and combine reasoning elements from precedents
 * to create more nuanced synthetic reasoning paths
 */
async function extractAndCombineReasoningElements(dilemma, relevantPrecedents = []) {
  console.log("\n====== ENTERING extractAndCombineReasoningElements ======");
  
  // Validation logging
  console.log("Validating parameters:");
  console.log(`- Dilemma: ${dilemma ? (typeof dilemma === 'object' ? 'Valid object' : typeof dilemma) : 'UNDEFINED'}`);
  if (dilemma) {
    console.log(`- Dilemma title: ${dilemma.title || 'No title'}`);
    console.log(`- Dilemma description: ${dilemma.description ? 'Present' : 'Missing'}`);
  }
  
  console.log(`- Relevant precedents: ${relevantPrecedents ? 'Provided' : 'UNDEFINED'}`);
  if (relevantPrecedents) {
    if (Array.isArray(relevantPrecedents)) {
      console.log(`- Precedents array length: ${relevantPrecedents.length}`);
      
      // Log some basic info about the first few precedents
      if (relevantPrecedents.length > 0) {
        console.log("- Sample precedent info:");
        for (let i = 0; i < Math.min(2, relevantPrecedents.length); i++) {
          const precedent = relevantPrecedents[i];
          console.log(`  [${i}] Type: ${typeof precedent}`);
          
          if (precedent) {
            console.log(`  [${i}] Has precedent property: ${Boolean(precedent.precedent)}`);
            
            if (precedent.precedent) {
              console.log(`  [${i}] Precedent ID: ${precedent.precedent.id || 'N/A'}`);
              console.log(`  [${i}] Precedent title: ${precedent.precedent.title || 'N/A'}`);
              console.log(`  [${i}] Has reasoning_paths: ${Boolean(precedent.precedent.reasoning_paths)}`);
            } else {
              console.log(`  [${i}] ID: ${precedent.id || 'N/A'}`);
              console.log(`  [${i}] Title: ${precedent.title || 'N/A'}`);
              console.log(`  [${i}] Has reasoning_paths: ${Boolean(precedent.reasoning_paths)}`);
            }
          } else {
            console.log(`  [${i}] NULL or UNDEFINED precedent`);
          }
        }
      } else {
        console.log("- No precedents in array");
      }
    } else {
      console.log(`- Precedents is not an array. Type: ${typeof relevantPrecedents}`);
    }
  }
  
  try {
    // Make sure we have possible actions in the dilemma
    if (!dilemma.possible_actions || !Array.isArray(dilemma.possible_actions) || dilemma.possible_actions.length === 0) {
      console.warn("No possible actions found in dilemma, creating default actions");
      
      // Check if we have actions in another format (for backward compatibility)
      if (dilemma.actions && typeof dilemma.actions === 'object') {
        // Convert actions object to array of action objects
        dilemma.possible_actions = Object.entries(dilemma.actions).map(([name, details]) => ({
          action: name,
          name: name,
          description: details.description || name
        }));
        console.log(`Created ${dilemma.possible_actions.length} possible actions from dilemma.actions`);
      } else {
        // Create a default action
        dilemma.possible_actions = [
          { 
            action: 'default_action', 
            name: 'default_action',
            description: 'Default action when no actions are specified' 
          }
        ];
        console.log("Created a default action");
      }
    }
    
    console.log("\nExtracting reasoning elements...");
    // Extract raw reasoning elements from precedents
    const extractedElements = extractReasoningElements(dilemma, relevantPrecedents);
    console.log(`Extracted ${extractedElements.length} reasoning elements`);
    
    // If we have no precedents, try to extract contextual factors as elements
    if ((!relevantPrecedents || relevantPrecedents.length === 0) && extractedElements.length === 0) {
      console.log("No relevant precedents found or provided, extracting contextual factors");
      
      // Extract contextual factors from the dilemma
      const contextualFactors = utils.extractContextualFactors(dilemma);
      if (contextualFactors && contextualFactors.length > 0) {
        console.log(`Extracted ${contextualFactors.length} contextual factors`);
        
        // Add these as elements
        for (const factor of contextualFactors) {
          extractedElements.push({
            id: `context_${factor}_${Date.now()}`,
            element_type: 'contextual_factor',
            content: `Contextual Factor: ${factor}`,
            frameworks: ['default_framework'], // Assign to default framework
            weight: 0.7,
            strength: 'moderate',
            relevance: 0.8
          });
        }
        console.log(`Added ${contextualFactors.length} contextual factors as elements`);
      } else {
        console.warn("No contextual factors could be extracted");
      }
    }
    
    console.log("\nGrouping by framework...");
    // Group elements by framework
    const elementsByFramework = groupElementsByFramework(extractedElements);
    
    console.log(`Grouped elements into ${Object.keys(elementsByFramework).length} frameworks`);
    
    console.log("\nIdentifying conflicts...");
    // Find conflicts between frameworks
    const conflicts = identifyConflicts(elementsByFramework);
    console.log(`Identified ${conflicts.length} conflicts between frameworks`);
    
    console.log("\nGenerating hybrid frameworks...");
    // Create all possible combinations of 2-3 frameworks
    const availableFrameworks = Object.keys(elementsByFramework);
    const frameworkCombinations = [];
    
    // Generate pairs (combinations of 2)
    for (let i = 0; i < availableFrameworks.length; i++) {
      for (let j = i + 1; j < availableFrameworks.length; j++) {
        frameworkCombinations.push([availableFrameworks[i], availableFrameworks[j]]);
      }
    }
    
    // Generate triplets (combinations of 3) if we have at least 3 frameworks
    if (availableFrameworks.length >= 3) {
      for (let i = 0; i < availableFrameworks.length; i++) {
        for (let j = i + 1; j < availableFrameworks.length; j++) {
          for (let k = j + 1; k < availableFrameworks.length; k++) {
            frameworkCombinations.push([availableFrameworks[i], availableFrameworks[j], availableFrameworks[k]]);
          }
        }
      }
    }
    
    console.log(`Generated ${frameworkCombinations.length} framework combinations`);
    
    // Generate hybrid frameworks
    const hybridFrameworks = generateHybridFrameworks(frameworkCombinations, elementsByFramework, conflicts);
    console.log(`Generated ${hybridFrameworks.length} hybrid frameworks`);
    
    // Prepare frameworks array for the synthetic reasoning paths
    const frameworks = [];
    
    // If hybrid frameworks were generated, use them
    if (hybridFrameworks.length > 0) {
        frameworks.push(...hybridFrameworks);
    } else {
        console.warn("No hybrid frameworks generated, creating default framework");
        // Create a DEFAULT FRAMEWORK *OBJECT*:
        const defaultFramework = new frameworkRegistry.Framework(
            "default_framework",  // ID
            "Default Framework",   // Name
            "A fallback framework when no others are identified", // Description
            [] //aliases
        );
        defaultFramework.isUnknown = true; //mark it
        frameworks.push(defaultFramework);
    }

    console.log("Creating synthetic reasoning paths...");
    // Now we can safely call createSyntheticReasoningPaths,
    // as 'frameworks' is guaranteed to be an array of Framework objects.
    const syntheticPaths = await createSyntheticReasoningPaths(
      frameworks.length > 0 ? frameworks : [defaultFramework], 
      extractedElements, 
      dilemma
    );
    
    console.log(`Created ${syntheticPaths.length} synthetic reasoning paths`);
    
    console.log("\n====== EXITING extractAndCombineReasoningElements ======");
    console.log(`Returning ${hybridFrameworks.length} hybrid frameworks with ${extractedElements.length} elements and ${syntheticPaths.length} synthetic paths`);
    
    return {
      hybridFrameworks: hybridFrameworks,
      extractedElements: extractedElements,
      syntheticPaths: syntheticPaths
    };
  } catch (error) {
    console.error("Error in extractAndCombineReasoningElements:", error);
    return {
      hybridFrameworks: [],
      extractedElements: [],
      syntheticPaths: []
    };
  }
}

/**
 * Extract reasoning elements from a dilemma and relevant precedents
 * 
 * @param {Object} dilemma - The dilemma to extract elements for
 * @param {Array} relevantPrecedents - Array of relevant precedents
 * @returns {Array} Array of extracted reasoning elements
 */
function extractReasoningElements(dilemma, relevantPrecedents) {
  console.log("=== DEBUG: PRECEDENT DETAILS IN extractReasoningElements ===");
  console.log(`Dilemma title: ${dilemma ? dilemma.title : 'undefined'}`);
  console.log(`Precedents array: ${relevantPrecedents ? (Array.isArray(relevantPrecedents) ? `Array with ${relevantPrecedents.length} items` : 'Not an array') : 'undefined'}`);
  
  // Extract elements from precedents
  console.log("Extracting reasoning elements from precedents...");
  
  const extractedElements = [];
  
  // Extract key concepts and terms from the dilemma for relevance assessment
  const dilemmaKeywords = extractKeywordsFromDilemma(dilemma);
  console.log(`Extracted ${dilemmaKeywords.length} keywords from dilemma: ${dilemmaKeywords.join(', ')}`);
  
  // First, check if the dilemma has predefined granular elements
  if (dilemma && dilemma.granular_reasoning_elements) {
    console.log("Found predefined granular elements in the dilemma");
    
    // Process predefined elements from the dilemma
    for (const [elementName, elementData] of Object.entries(dilemma.granular_reasoning_elements)) {
      console.log(`Processing elements from predefined ${elementName}`);
      
      // Create a core element
      const coreElement = {
        id: `dilemma_${elementName}_core`,
        element: elementData.element,
        frameworks: elementData.frameworks || [],
        element_type: 'core_argument',
        content: elementData.element,
        precedent_title: elementName,
        weight: 1.0,
        strength: 'moderate', // Default strength
        relevance: 1.0        // Maximum relevance for predefined elements
      };
      
      extractedElements.push(coreElement);
      
      // Add sub-arguments if available
      if (elementData.sub_arguments && Array.isArray(elementData.sub_arguments)) {
        elementData.sub_arguments.forEach((subArg, index) => {
          const subElement = {
            id: `dilemma_${elementName}_sub_${index}`,
            element_type: 'sub_argument',
            content: subArg,
            frameworks: elementData.frameworks || [],
            precedent_title: elementName,
            weight: 0.8, // Slightly lower weight for sub-arguments
            strength: 'moderate',
            relevance: 1.0
          };
          
          extractedElements.push(subElement);
        });
      }
    }
  } else {
    console.log("No predefined granular elements found in the dilemma");
  }
  
  // Then, extract elements from the relevant precedents
  if (relevantPrecedents && Array.isArray(relevantPrecedents) && relevantPrecedents.length > 0) {
    // Count only valid precedents with an actual precedent object
    const validPrecedentCount = relevantPrecedents.filter(p => p && typeof p === 'object').length;
    console.log(`Processing ${validPrecedentCount} precedents for granular extraction...`);
    
    relevantPrecedents.forEach((relevantPrecedent, index) => {
      // Debug the current precedent object
      console.log(`\nExamining precedent [${index}]:`);
      console.log(`- Type: ${typeof relevantPrecedent}`);
      
      if (!relevantPrecedent) {
        console.log(`- ISSUE: Precedent [${index}] is null or undefined`);
        return;
      }
      
      if (typeof relevantPrecedent !== 'object') {
        console.log(`- ISSUE: Precedent [${index}] is not an object (type: ${typeof relevantPrecedent})`);
        return;
      }
      
      console.log(`- Keys: ${Object.keys(relevantPrecedent).join(', ')}`);
      
      // The precedent might be stored directly or in a 'precedent' property
      let precedent = relevantPrecedent;
      let precedentTitle = precedent.title || precedent.id || `Unknown_Precedent_${index}`;
      let similarity = relevantPrecedent.similarity || 0.5;
      
      // If the object has a 'precedent' property, it may be a wrapper with similarity info
      if (relevantPrecedent.precedent) {
        precedent = relevantPrecedent.precedent;
        precedentTitle = precedent.title || precedent.id || `Unknown_Precedent_${index}`;
        console.log(`- Found 'precedent' property, using it for extraction`);
        console.log(`- Precedent title: ${precedentTitle}`);
      } else {
        console.log(`- No 'precedent' property, using the object directly`);
        console.log(`- Precedent title: ${precedentTitle}`);
      }
      
      // Check for reasoning paths
      if (!precedent.reasoning_paths || !Array.isArray(precedent.reasoning_paths)) {
        console.log(`- ISSUE: No reasoning_paths array found in precedent ${precedentTitle}`);
        return;
      }
      
      console.log(`- Found ${precedent.reasoning_paths.length} reasoning paths`);
      
      // Extract from each reasoning path
      precedent.reasoning_paths.forEach((path, pathIndex) => {
        console.log(`  - Processing path ${pathIndex}: framework = ${path.framework || 'Unknown'}`);
        
        // Calculate relevance based on keyword matching
        const pathText = path.argument || '';
        const relevanceScore = calculateRelevance(pathText, dilemmaKeywords);
        console.log(`    - Relevance score: ${relevanceScore.toFixed(2)}`);
        
        // Enhanced extraction for different element types
        
        // 1. Extract core argument
        if (path.argument) {
          const coreElement = {
            id: `precedent_${precedentTitle}_path_${pathIndex}_core`,
            element_type: 'core_argument',
            content: path.argument,
            frameworks: [path.framework], // Keep existing frameworks array
            framework: path.framework, // Add single framework for direct reference
            framework_id: generateFrameworkId(path, pathIndex, precedentTitle),
            framework_type: determineFrameworkType(path.framework),
            precedent_title: precedentTitle,
            path_index: pathIndex,
            similarity: similarity,
            weight: 0.7 * similarity, // Weight based on precedent similarity
            strength: path.strength || 'moderate',
            relevance: relevanceScore,
            conclusion: path.conclusion || null
          };
          
          extractedElements.push(coreElement);
          console.log(`    - Added core argument from path ${pathIndex}`);
        } else {
          console.log(`    - ISSUE: Path ${pathIndex} has no argument`);
        }
        
        // 2. Extract principles
        const principles = extractPrinciples(path.argument);
        principles.forEach((principle, i) => {
          const principleElement = {
            id: `precedent_${precedentTitle}_path_${pathIndex}_principle_${i}`,
            element_type: 'principle',
            content: principle,
            frameworks: [path.framework],
            framework: path.framework,
            framework_id: generateFrameworkId(path, pathIndex, precedentTitle),
            framework_type: determineFrameworkType(path.framework),
            precedent_title: precedentTitle,
            path_index: pathIndex,
            similarity: similarity,
            weight: 0.6 * similarity,
            strength: 'moderate',
            relevance: relevanceScore * 0.9 // Slightly reduce relevance for derived elements
          };
          
          extractedElements.push(principleElement);
          console.log(`    - Added principle: "${principle.substring(0, 40)}..."`);
        });
        
        // 3. Extract justifications
        const justifications = extractJustifications(path.argument);
        justifications.forEach((justification, i) => {
          const justElement = {
            id: `precedent_${precedentTitle}_path_${pathIndex}_just_${i}`,
            element_type: 'justification',
            content: justification,
            frameworks: [path.framework],
            framework: path.framework,
            framework_id: generateFrameworkId(path, pathIndex, precedentTitle),
            framework_type: determineFrameworkType(path.framework),
            precedent_title: precedentTitle,
            path_index: pathIndex,
            similarity: similarity,
            weight: 0.65 * similarity,
            strength: 'moderate',
            relevance: relevanceScore * 0.8
          };
          
          extractedElements.push(justElement);
          console.log(`    - Added justification: "${justification.substring(0, 40)}..."`);
        });
        
        // 4. Extract objections
        const objections = extractObjections(path.argument);
        objections.forEach((objection, i) => {
          const objectionElement = {
            id: `precedent_${precedentTitle}_path_${pathIndex}_obj_${i}`,
            element_type: 'objection',
            content: objection,
            frameworks: [path.framework],
            framework: path.framework,
            framework_id: generateFrameworkId(path, pathIndex, precedentTitle),
            framework_type: determineFrameworkType(path.framework),
            precedent_title: precedentTitle,
            path_index: pathIndex,
            similarity: similarity,
            weight: 0.5 * similarity,
            strength: 'moderate',
            relevance: relevanceScore * 0.7
          };
          
          extractedElements.push(objectionElement);
          console.log(`    - Added objection: "${objection.substring(0, 40)}..."`);
        });
        
        // 5. Extract responses to objections
        const responses = extractResponses(path.argument);
        responses.forEach((response, i) => {
          const responseElement = {
            id: `precedent_${precedentTitle}_path_${pathIndex}_resp_${i}`,
            element_type: 'response',
            content: response,
            frameworks: [path.framework],
            framework: path.framework,
            framework_id: generateFrameworkId(path, pathIndex, precedentTitle),
            framework_type: determineFrameworkType(path.framework),
            precedent_title: precedentTitle,
            path_index: pathIndex,
            similarity: similarity,
            weight: 0.55 * similarity,
            strength: 'moderate',
            relevance: relevanceScore * 0.75
          };
          
          extractedElements.push(responseElement);
          console.log(`    - Added response: "${response.substring(0, 40)}..."`);
        });
        
        // 6. Extract examples
        const examples = extractExamples(path.argument);
        examples.forEach((example, i) => {
          const exampleElement = {
            id: `precedent_${precedentTitle}_path_${pathIndex}_ex_${i}`,
            element_type: 'example',
            content: example,
            frameworks: [path.framework],
            framework: path.framework,
            framework_id: generateFrameworkId(path, pathIndex, precedentTitle),
            framework_type: determineFrameworkType(path.framework),
            precedent_title: precedentTitle,
            path_index: pathIndex,
            similarity: similarity,
            weight: 0.4 * similarity,
            strength: 'moderate',
            relevance: relevanceScore * 0.6
          };
          
          extractedElements.push(exampleElement);
          console.log(`    - Added example: "${example.substring(0, 40)}..."`);
        });
        
        // 7. Extract definitions
        const definitions = extractDefinitions(path.argument);
        definitions.forEach((definition, i) => {
          const defElement = {
            id: `precedent_${precedentTitle}_path_${pathIndex}_def_${i}`,
            element_type: 'definition',
            content: definition,
            frameworks: [path.framework],
            framework: path.framework,
            framework_id: generateFrameworkId(path, pathIndex, precedentTitle),
            framework_type: determineFrameworkType(path.framework),
            precedent_title: precedentTitle,
            path_index: pathIndex,
            similarity: similarity,
            weight: 0.45 * similarity,
            strength: 'moderate',
            relevance: relevanceScore * 0.85
          };
          
          extractedElements.push(defElement);
          console.log(`    - Added definition: "${definition.substring(0, 40)}..."`);
        });
        
        // Log reference to this framework and check if it exists in the registry
        if (path.framework) {
          // Trim whitespace and look up in registry
          const frameworkName = path.framework.trim();
          const framework = frameworkRegistry.getFrameworkByName(frameworkName);
          
          // Use canonical name if found
          const nameToLog = framework ? framework.name : frameworkName;
          
          // Log framework reference
          frameworkLogger.logFrameworkReference(
            nameToLog,
            'extractReasoningElements',
            {
              precedent: precedentTitle,
              dilemma: dilemma.title || 'unknown',
              canonicalName: Boolean(framework)
            }
          );
          
          // Log lookup success/failure
          frameworkLogger.logFrameworkLookup(
            frameworkName, 
            'extractReasoningElements', 
            Boolean(framework),
            {
              precedent: precedentTitle,
              dilemma: dilemma.title || 'unknown',
              matchedFramework: framework ? framework.name : null
            }
          );
          
          // If framework not found in registry, log a failure
          if (!framework) {
            console.log(`  - Framework '${frameworkName}' is not found in the framework registry`);
            frameworkLogger.logFrameworkFailure(
              frameworkName,
              'extractReasoningElements',
              'Framework not found in registry',
              { type: 'unknown_framework' },
              {
                precedent: precedentTitle,
                dilemma: dilemma.title || 'unknown',
                path_index: pathIndex
              }
            );
          }
        }
      });
    });
  } else {
    console.log("No relevant precedents found or provided, using only dilemma-defined elements");
  }
  
  // Sort elements by relevance and weight
  extractedElements.sort((a, b) => {
    // Sort by relevance first
    if (b.relevance !== a.relevance) {
      return b.relevance - a.relevance;
    }
    // Then by weight
    return b.weight - a.weight;
  });
  
  console.log(`Extracted ${extractedElements.length} reasoning elements in total`);
  return extractedElements;
}

/**
 * Extract keywords from a dilemma for relevance assessment
 * 
 * @param {Object} dilemma - The dilemma to extract keywords from
 * @returns {Array} Array of keywords
 */
function extractKeywordsFromDilemma(dilemma) {
  if (!dilemma) return [];
  
  let text = '';
  
  // Collect all text fields from the dilemma
  if (dilemma.title) text += dilemma.title + ' ';
  if (dilemma.description) text += dilemma.description + ' ';
  
  // Add contextual factors
  if (dilemma.contextual_factors && Array.isArray(dilemma.contextual_factors)) {
    dilemma.contextual_factors.forEach(factor => {
      if (typeof factor === 'string') {
        text += factor + ' ';
      } else if (factor.description) {
        text += factor.description + ' ';
      } else if (factor.factor) {
        text += factor.factor + ' ';
      }
    });
  }
  
  // Add possible actions
  if (dilemma.possible_actions && Array.isArray(dilemma.possible_actions)) {
    dilemma.possible_actions.forEach(action => {
      if (typeof action === 'string') {
        text += action + ' ';
      } else if (action.action) {
        text += action.action + ' ';
        if (action.predicted_consequences) {
          text += action.predicted_consequences + ' ';
        }
      }
    });
  }
  
  // Process text to extract keywords
  // Remove common stopwords and keep only meaningful terms
  const stopwords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                     'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
                     'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'at', 'by', 
                     'for', 'with', 'about', 'against', 'between', 'into', 'through',
                     'during', 'before', 'after', 'above', 'below', 'up', 'down', 'of', 
                     'that', 'this', 'these', 'those', 'it', 'they', 'them', 'we', 'us', 'he', 'she'];
  
  // Tokenize, filter stopwords, and convert to lowercase
  const words = text.toLowerCase()
                   .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
                   .split(/\s+/)             // Split on whitespace
                   .filter(word => word.length > 2 && !stopwords.includes(word));
  
  // Count word frequencies
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Get unique words sorted by frequency
  const uniqueWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
  
  // Return top keywords (limited to 15)
  return uniqueWords.slice(0, 15);
}

/**
 * Calculate relevance of a text to a set of keywords
 * 
 * @param {string} text - The text to calculate relevance for
 * @param {Array} keywords - Array of keywords
 * @returns {number} Relevance score (0-1)
 */
function calculateRelevance(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return 0.5; // Default moderate relevance
  
  const lowerText = text.toLowerCase();
  let matchCount = 0;
  
  // Count how many keywords appear in the text
  keywords.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  });
  
  // Calculate relevance as the proportion of keywords found
  return Math.min(1, (matchCount / Math.min(keywords.length, 5)) * 0.8 + 0.2);
}

/**
 * Extract principles from argument text
 * 
 * @param {string} text - The text to extract principles from
 * @returns {Array} Array of extracted principles
 */
function extractPrinciples(text) {
  if (!text) return [];
  
  const principles = [];
  
  // Pattern matching for principles
  const principlePatterns = [
    /(?:principle of|the principle that|ethical principle|moral principle)[^.!?]*[.!?]/gi,
    /(?:rights|duties|obligations|virtues)[^.!?]*(?:require|demand|dictate)[^.!?]*[.!?]/gi,
    /(?:we should|one should|people should|individuals should|society should)[^.!?]*[.!?]/gi,
    /it is (?:morally|ethically) (?:right|wrong|obligatory|required|prohibited|permissible)[^.!?]*[.!?]/gi
  ];
  
  // Apply each pattern
  principlePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    principles.push(...matches);
  });
  
  // Extract sentences with ethical frameworks mentioned
  const frameworkTerms = [
    'utilitarianism', 'consequentialism', 'deontology', 'virtue ethics', 
    'rights', 'justice', 'care ethics', 'kantian', 'aristotelian'
  ];
  
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (frameworkTerms.some(term => lowerSentence.includes(term)) && 
        !principles.some(p => p.includes(sentence))) {
      principles.push(sentence.trim() + '.');
    }
  });
  
  return [...new Set(principles)]; // Remove duplicates
}

/**
 * Extract justifications from argument text
 * 
 * @param {string} text - The text to extract justifications from
 * @returns {Array} Array of extracted justifications
 */
function extractJustifications(text) {
  if (!text) return [];
  
  const justifications = [];
  
  // Pattern matching for justifications
  const justificationPatterns = [
    /(?:because|since|as|given that)[^.!?]*[.!?]/gi,
    /(?:the reason|for this reason|this is because|this follows from)[^.!?]*[.!?]/gi,
    /(?:evidence|research|studies|data) (?:shows|indicates|suggests|demonstrates)[^.!?]*[.!?]/gi
  ];
  
  // Apply each pattern
  justificationPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    justifications.push(...matches);
  });
  
  return [...new Set(justifications)]; // Remove duplicates
}

/**
 * Extract objections from argument text
 * 
 * @param {string} text - The text to extract objections from
 * @returns {Array} Array of extracted objections
 */
function extractObjections(text) {
  if (!text) return [];
  
  const objections = [];
  
  // Pattern matching for objections
  const objectionPatterns = [
    /(?:however|but|yet|nonetheless|nevertheless|on the other hand|critics argue)[^.!?]*[.!?]/gi,
    /(?:one might object|it could be objected|one objection|an objection|a challenge)[^.!?]*[.!?]/gi,
    /(?:contrary to|in contrast to|against this view)[^.!?]*[.!?]/gi
  ];
  
  // Apply each pattern
  objectionPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    objections.push(...matches);
  });
  
  return [...new Set(objections)]; // Remove duplicates
}

/**
 * Extract responses to objections from argument text
 * 
 * @param {string} text - The text to extract responses from
 * @returns {Array} Array of extracted responses
 */
function extractResponses(text) {
  if (!text) return [];
  
  const responses = [];
  
  // Pattern matching for responses
  const responsePatterns = [
    /(?:in response|responding to this|this objection fails|in reply)[^.!?]*[.!?]/gi,
    /(?:this criticism|this challenge|this concern) (?:overlooks|ignores|fails to)[^.!?]*[.!?]/gi,
    /(?:while this may seem|although it might appear|despite this concern)[^.!?]*[.!?]/gi
  ];
  
  // Apply each pattern
  responsePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    responses.push(...matches);
  });
  
  return [...new Set(responses)]; // Remove duplicates
}

/**
 * Extract examples from argument text
 * 
 * @param {string} text - The text to extract examples from
 * @returns {Array} Array of extracted examples
 */
function extractExamples(text) {
  if (!text) return [];
  
  const examples = [];
  
  // Pattern matching for examples
  const examplePatterns = [
    /(?:for example|for instance|consider the case|take the example|as an illustration)[^.!?]*[.!?]/gi,
    /(?:an example|one example|a case in point)[^.!?]*[.!?]/gi,
    /(?:to illustrate|illustrating this|this is illustrated by)[^.!?]*[.!?]/gi
  ];
  
  // Apply each pattern
  examplePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    examples.push(...matches);
  });
  
  return [...new Set(examples)]; // Remove duplicates
}

/**
 * Extract definitions from argument text
 * 
 * @param {string} text - The text to extract definitions from
 * @returns {Array} Array of extracted definitions
 */
function extractDefinitions(text) {
  if (!text) return [];
  
  const definitions = [];
  
  // Pattern matching for definitions
  const definitionPatterns = [
    /(?:is defined as|can be defined as|refers to|means)[^.!?]*[.!?]/gi,
    /(?:the concept of|the idea of|the term)[^.!?]*(?:refers to|denotes|signifies)[^.!?]*[.!?]/gi,
    /(?:by|the term|the notion of)[^.!?]*(?:we mean|is meant)[^.!?]*[.!?]/gi
  ];
  
  // Apply each pattern
  definitionPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    definitions.push(...matches);
  });
  
  return [...new Set(definitions)]; // Remove duplicates
}

/**
 * Group extracted elements by framework
 */
function groupElementsByFramework(extractedElements) {
    console.log("Grouping elements by framework...");
    const elementsByFramework = {};
    
    for (const element of extractedElements) {
      // If element has multiple frameworks, add it to each framework's list
      if (element.frameworks && element.frameworks.length > 0) {
        for (const framework of element.frameworks) {
          if (!elementsByFramework[framework]) {
            elementsByFramework[framework] = [];
          }
          elementsByFramework[framework].push(element);
        }
      } else {
        // If no specific framework, add to "Generic" category
        if (!elementsByFramework['Generic']) {
          elementsByFramework['Generic'] = [];
        }
        elementsByFramework['Generic'].push(element);
      }
    }
    
    console.log(`Grouped elements into ${Object.keys(elementsByFramework).length} frameworks`);
    return elementsByFramework;
  }
  
  /**
   * Identify conflicts between reasoning elements
   */
  function identifyConflicts(elementsByFramework) {
    console.log("Identifying conflicts between reasoning elements...");
    const conflicts = [];
    
    // Get all frameworks
    const frameworks = Object.keys(elementsByFramework);
    
    // For each pair of frameworks, check for conflicts
    for (let i = 0; i < frameworks.length; i++) {
      const framework1 = frameworks[i];
      const elements1 = elementsByFramework[framework1];
      
      for (let j = i + 1; j < frameworks.length; j++) {
        const framework2 = frameworks[j];
        const elements2 = elementsByFramework[framework2];
        
        // Check for conflicts between elements
        for (const element1 of elements1) {
          for (const element2 of elements2) {
            const conflict = checkElementConflict(element1, element2);
            
            if (conflict) {
              conflicts.push({
                frameworks: [framework1, framework2],
                elements: [element1, element2],
                type: conflict.type,
                description: conflict.description
              });
            }
          }
        }
      }
    }
    
    console.log(`Identified ${conflicts.length} conflicts between reasoning elements`);
    return conflicts;
  }
  
  /**
   * Check if two elements are in conflict
   */
  function checkElementConflict(element1, element2) {
    // Skip conflict check for certain element types
    const skipTypes = ['supporting_principle'];
    if (skipTypes.includes(element1.element_type) || skipTypes.includes(element2.element_type)) {
      return null;
    }
    
    // Check for conflicting conclusions
    if (element1.conclusion && element2.conclusion && element1.conclusion !== element2.conclusion) {
      // Check if the conclusions are inherently opposing
      if (areOpposingConclusions(element1.conclusion, element2.conclusion)) {
        return {
          type: 'conclusion',
          description: `Conflicting conclusions: "${element1.conclusion}" vs "${element2.conclusion}"`
        };
      }
    }
    
    // Check for conflicting strength assessments
    if (element1.strength && element2.strength && element1.element_type === element2.element_type) {
      if (areConflictingStrengths(element1.strength, element2.strength)) {
        return {
          type: 'strength',
          description: `Conflicting strength assessments: "${element1.strength}" vs "${element2.strength}" for similar arguments`
        };
      }
    }
    
    // Check for semantic conflicts in content
    if (element1.content && element2.content) {
      const semanticConflict = detectSemanticConflict(element1.content, element2.content);
      if (semanticConflict) {
        return {
          type: 'semantic',
          description: semanticConflict
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check for semantic conflicts between two text contents
   */
  function detectSemanticConflict(content1, content2) {
    // Define keyword pairs that indicate potential conflicts
    const conflictingKeywordPairs = [
      ['rights', 'utility'],
      ['individual', 'community'],
      ['consent', 'override'],
      ['autonomy', 'welfare'],
      ['privacy', 'security'],
      ['freedom', 'safety'],
      ['duty', 'consequences'],
      ['means', 'ends'],
      ['principle', 'outcome'],
      ['deontological', 'utilitarian']
    ];
    
    // Convert contents to lowercase for case-insensitive matching
    const text1 = content1.toLowerCase();
    const text2 = content2.toLowerCase();
    
    // Check for opposing keyword pairs
    for (const [keyword1, keyword2] of conflictingKeywordPairs) {
      if (text1.includes(keyword1) && text2.includes(keyword2)) {
        // Check if they appear in conflicting contexts
        if (indicatesConflict(text1, text2, keyword1, keyword2)) {
          return `Potential value conflict: "${keyword1}" vs "${keyword2}"`;
        }
      }
      
      // Also check the reverse
      if (text1.includes(keyword2) && text2.includes(keyword1)) {
        if (indicatesConflict(text1, text2, keyword2, keyword1)) {
          return `Potential value conflict: "${keyword2}" vs "${keyword1}"`;
        }
      }
    }
    
    // Check for direct contradictions using negation patterns
    const negationPatterns = [
      'not', 'cannot', 'should not', 'must not', 'never', 'disagree'
    ];
    
    // Get the key phrases from each content
    const phrases1 = extractKeyPhrases(text1);
    const phrases2 = extractKeyPhrases(text2);
    
    for (const phrase of phrases1) {
      // Check if the phrase appears in content2 with a negation
      for (const negation of negationPatterns) {
        if (text2.includes(`${negation} ${phrase}`)) {
          return `Direct contradiction: "${phrase}" vs "${negation} ${phrase}"`;
        }
      }
    }
    
    for (const phrase of phrases2) {
      // Check if the phrase appears in content1 with a negation
      for (const negation of negationPatterns) {
        if (text1.includes(`${negation} ${phrase}`)) {
          return `Direct contradiction: "${phrase}" vs "${negation} ${phrase}"`;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Helper to check if keywords appear in conflicting contexts
   */
  function indicatesConflict(text1, text2, keyword1, keyword2) {
    // Simple approach: check if first text promotes keyword1 over keyword2
    // and second text does the opposite
    const prioritizesText1 = (
      text1.includes(`${keyword1} over ${keyword2}`) ||
      text1.includes(`prioritize ${keyword1}`) ||
      text1.includes(`${keyword1} is more important`)
    );
    
    const prioritizesText2 = (
      text2.includes(`${keyword2} over ${keyword1}`) ||
      text2.includes(`prioritize ${keyword2}`) ||
      text2.includes(`${keyword2} is more important`)
    );
    
    return prioritizesText1 && prioritizesText2;
  }
  
  /**
   * Extract key phrases from text for contradiction analysis
   */
  function extractKeyPhrases(text) {
    // This is a simplified implementation
    // In a production system, this would use NLP techniques
    
    // Split by common punctuation and keep phrases of 2-4 words
    const sentences = text.split(/[.!?;,]/);
    const phrases = [];
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      
      for (let i = 0; i < words.length; i++) {
        // Extract 2-word phrases
        if (i + 1 < words.length) {
          phrases.push(`${words[i]} ${words[i + 1]}`.toLowerCase());
        }
        
        // Extract 3-word phrases
        if (i + 2 < words.length) {
          phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase());
        }
      }
    }
    
    return phrases.filter(phrase => phrase.length > 5); // Filter out very short phrases
  }
  
  /**
   * Check if strengths are in conflict
   */
  function areConflictingStrengths(strength1, strength2) {
    const strengthOrder = ['weak', 'moderate', 'strong'];
    const index1 = strengthOrder.indexOf(strength1);
    const index2 = strengthOrder.indexOf(strength2);
    
    if (index1 === -1 || index2 === -1) return false;
    
    // If the strengths are at opposite ends, consider it a conflict
    return Math.abs(index1 - index2) === 2;
  }
  
  /**
   * Helper function to check if two conclusions are opposing
   */
  function areOpposingConclusions(conclusion1, conclusion2) {
    // This is a simplified check - in a real system, you would have
    // more sophisticated logic to determine opposing conclusions
    
    // Common opposing pairs
    const opposingPairs = [
      ['pull_lever', 'do_nothing'],
      ['steal_drug', 'respect_law'],
      ['criteria_based_selection', 'random_selection'],
      ['override_refusal', 'respect_refusal'],
      ['full_implementation', 'reject_implementation'],
      ['limited_implementation', 'reject_implementation']
    ];
    
    // Check if the given conclusions form an opposing pair
    for (const [option1, option2] of opposingPairs) {
      if ((conclusion1 === option1 && conclusion2 === option2) ||
          (conclusion1 === option2 && conclusion2 === option1)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Generate hybrid frameworks based on dilemma specification
   */
  function generateHybridFrameworks(frameworkCombinations, elementsByFramework, conflicts) {
    console.log("Generating hybrid frameworks...");
    
    const hybridFrameworks = [];
    
    // If we don't have elementsByFramework, create an empty object to avoid errors
    if (!elementsByFramework) {
      elementsByFramework = {};
    }
    
    if (frameworkCombinations && frameworkCombinations.length > 0) {
      console.log(`Using ${frameworkCombinations.length} predefined framework combinations`);
      
      for (const combination of frameworkCombinations) {
        // Handle different formats of framework combinations
        let frameworks = [];
        
        if (typeof combination === 'string') {
          // If it's a string like "framework1,framework2", split it
          frameworks = combination.split(",").map(f => f.trim());
        } else if (Array.isArray(combination)) {
          // If it's already an array of framework names
          frameworks = combination;
        } else if (typeof combination === 'object' && combination !== null) {
          // If it's an object with a component_frameworks property
          frameworks = combination.component_frameworks || combination.frameworks || [];
        }
        
        // Skip invalid combinations
        if (!frameworks || frameworks.length === 0) {
          console.log("Invalid framework combination, skipping");
          continue;
        }
        
        console.log(`Processing combination: ${frameworks.join(", ")}`);
        
        // Create the hybrid framework name
        const hybridName = `Hybrid: ${frameworks.join(" + ")}`;
        
        // Log reference to all constituent frameworks and the hybrid framework
        frameworks.forEach(framework => {
          // Trim whitespace and look up in registry
          const frameworkName = framework.trim();
          const registryFramework = frameworkRegistry.getFrameworkByName(frameworkName);
          
          // Use canonical name if found
          const nameToLog = registryFramework ? registryFramework.name : frameworkName;
          
          // Log framework reference
          frameworkLogger.logFrameworkReference(
            nameToLog,
            'generateHybridFrameworks',
            {
              hybrid: hybridName,
              canonicalName: Boolean(registryFramework)
            }
          );
          
          // Check if this framework exists in our element database
          const existsInElements = Boolean(elementsByFramework[framework]);
          
          // Log lookup for each constituent framework
          frameworkLogger.logFrameworkLookup(
            frameworkName, 
            'generateHybridFrameworks', 
            Boolean(registryFramework) || existsInElements,
            {
              hybrid: hybridName,
              matchedFramework: registryFramework ? registryFramework.name : null,
              existsInElements: existsInElements
            }
          );
          
          // Log failure for frameworks not found
          if (!registryFramework && !existsInElements) {
            frameworkLogger.logFrameworkFailure(
              frameworkName,
              'generateHybridFrameworks',
              'Framework not found in registry or element database',
              null,
              { hybrid: hybridName }
            );
          }
        });
        
        // Log the hybrid framework as a reference
        frameworkLogger.logFrameworkReference(hybridName, 'generateHybridFrameworks');
        
        // Create a proper Framework object instead of just a string
        const hybridFramework = new frameworkRegistry.Framework(
            `hybrid_${Date.now()}`,
            hybridName,
            `Hybrid framework combining: ${frameworks.join(', ')}`,
            []
        );
        hybridFramework.isHybrid = true;
        hybridFramework.components = frameworks;
        
        hybridFrameworks.push(hybridFramework);
        console.log(`Added hybrid framework: ${hybridName}`);
      }
    } else {
      console.log("No framework combinations provided, skipping hybrid framework generation");
    }
    
    console.log(`Generated ${hybridFrameworks.length} hybrid frameworks`);
    return hybridFrameworks;
  }
  
  /**
   * Create synthetic reasoning paths for each framework and action combination
   * @param {Array} frameworks - List of frameworks to use
   * @param {Array} extractedElements - Previously extracted elements
   * @param {Object} dilemma - The dilemma to analyze
   * @returns {Array} Array of synthetic reasoning paths
   */
  async function createSyntheticReasoningPaths(frameworks, extractedElements, dilemma) {
    console.log('Creating synthetic reasoning paths...');
    
    if (!dilemma) {
      console.warn("No dilemma provided to createSyntheticReasoningPaths");
      return [];
    }
    
    // Extract possible actions from the dilemma
    let possibleActions = dilemma.possible_actions || dilemma.actions || [];
    
    if (possibleActions.length === 0) {
      console.warn("No possible actions found in dilemma, creating a default action");
      possibleActions = [{ action: 'default_action', name: 'default_action', description: 'Default action' }]; // Use an object
    }

    const paths = [];

    // Process each framework
    for (const framework of frameworks) {
        // Check if the framework is valid
        if (!framework || typeof framework !== 'object' || !framework.name) {
            console.warn("Invalid framework object encountered:", framework);
            continue; // Skip this invalid framework object
        }
        //Use name
        let frameworkName = framework.name;

        // Process each possible action
        for (const action of possibleActions) {
            console.log(`Creating synthetic reasoning path for ${frameworkName} and action object: ${JSON.stringify(action)}`);

            try {
                // Calculate the relevance score using action.name (the string)
                const dilemmaText = utils.extractDilemmaText(dilemma);
                // Since actionRelevanceScore is now async, we need to await it
                const relevance = await utils.actionRelevanceScore(dilemmaText, action.name, dilemma);
                
                // Make sure relevance is a number before calling toFixed
                const relevanceNumber = typeof relevance === 'number' ? relevance : 0.5;
                
                // Create a synthetic reasoning path
                const newPath = {
                    id: `synthetic_${framework.id}_${action.action}_${Date.now()}`, // Unique ID, include action
                    framework: frameworkName, // Use the framework object
                    action: action.action, // Include the action
                    conclusion: action.action, //Initially set to the same.
                    strength: relevanceNumber > 0.5 ? 'moderate' : 'weak',  //  strength based on relevance
                    argument: `A ${frameworkName} perspective suggests ${action.description}.`, //Use description here
                    relevance: parseFloat(relevanceNumber.toFixed(2)), // Store the calculated relevance
                    is_synthetic: true,
                    source_elements: [] // Initialize source_elements
                };

                paths.push(newPath);
            } catch (error) {
                console.error(`Error creating path for ${frameworkName} and action ${action.action}: ${error.message}`);
            }
        }
    }

    return paths;
  }
  
  // Helper function to determine framework type
  function determineFrameworkType(framework) {
    if (!framework) return 'unknown';
    if (framework.includes('+')) return 'hybrid';
    if (framework.toLowerCase().includes('hybrid')) return 'hybrid';
    return 'pure';
  }

  // Helper function to generate a unique framework ID if none exists
  function generateFrameworkId(path, pathIndex, precedentTitle) {
    // If path already has an ID, use it
    if (path.id) return path.id;
    
    // Try to get canonical ID from registry if framework name is available
    if (path.framework) {
      // Trim whitespace and look up in registry
      const frameworkName = path.framework.trim();
      const framework = frameworkRegistry.getFrameworkByName(frameworkName);
      
      // If found in registry, use canonical ID
      if (framework) {
        console.log(`Using canonical ID "${framework.id}" for framework "${frameworkName}"`);
        return framework.id;
      } else {
        console.log(`No canonical ID found for framework "${frameworkName}", generating fallback ID`);
      }
    }
    
    // Fallback to generated ID
    return `${precedentTitle}_path_${pathIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
  
  // Export the functions
  module.exports = {
    extractAndCombineReasoningElements,
    extractReasoningElements,
    identifyConflicts,
    generateHybridFrameworks,
    extractKeywordsFromDilemma,
    calculateRelevance,
    extractPrinciples,
    extractJustifications,
    extractObjections,
    extractResponses,
    extractExamples,
    extractDefinitions
  };
