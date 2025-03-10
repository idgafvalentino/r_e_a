// reasoningPath.js - Generates reasoning paths for ethical dilemmas

const { calculateSimilarity } = require('./similarity');
const { applyAdaptationRules } = require('./adaptationRules');
const { deepCopy } = require('./utils');
const { detectConflicts, detectAllConflicts } = require('./conflictDetection'); // Import conflict detection
const { resolveConflicts } = require('./conflictResolution'); // Import conflict resolution
const { extractAndCombineReasoningElements } = require('./granular-extraction');
const frameworkLogger = require('./frameworkLogger'); // Import framework logger
const { getFrameworkByName } = require('./frameworkRegistry'); // Import framework registry

/**
 * Extracts reasoning elements (core and sub-arguments) from a framework.
 * @param {Object} framework - The ethical framework.
 * @param {string} actionKey - The key representing the chosen action.
 * @returns {Object|null} An object containing the core and sub-arguments, or null if not found.
 */
function extractReasoningElements(framework, actionKey) {
    if (!framework || !framework.actions || !framework.actions[actionKey]) {
        return null;
    }

    const action = framework.actions[actionKey];
    if (!action.arguments) {
        return null;
    }

    const core_argument = action.arguments.core_argument;
    const sub_argument = action.arguments.sub_argument;

    if (!core_argument || !sub_argument) {
        return null;
    }

    return { core_argument, sub_argument };
}

/**
 * Finds the best precedent for a given dilemma and action.
 *  *No longer returns an array*. Returns a single best precedent or null.
 */
function findBestPrecedent(dilemma, action, precedents) {
   if (!precedents || precedents.length === 0) {
        return null; // No precedents available
    }

    let bestPrecedent = null;
    let highestSimilarity = -1; // Initialize with a value lower than any possible similarity

    for (const precedent of precedents) {
        const similarity = calculateSimilarity(dilemma, precedent);

        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestPrecedent = precedent;
        }
    }

    //DEBUG
    if (bestPrecedent) {
        console.log(`Best precedent for ${action}: ${bestPrecedent.title} (similarity: ${highestSimilarity.toFixed(2)})`);
    }
    else
    {
        console.log("No precedent found")
    }

    return bestPrecedent; // Return the single best precedent
}

/**
 * Handles the case where no relevant precedents were found
 * @param {Object} dilemma - The dilemma object
 * @param {Array} precedents - Precedents that can be used as fallback
 * @returns {Array} Generated reasoning paths
 */
async function handleNoMatchCase(dilemma, precedents) {
  console.log("\n====== ENTERING handleNoMatchCase ======");
  
  // Validate inputs and log debugging info
  console.log("Validating inputs to handleNoMatchCase:");
  console.log(`- Dilemma provided: ${Boolean(dilemma)}`);
  if (dilemma) {
    console.log(`- Dilemma title: ${dilemma.title || 'No title'}`);
    console.log(`- Dilemma description length: ${dilemma.description ? dilemma.description.length : 0} chars`);
  }
  
  console.log(`- Precedents provided: ${Boolean(precedents)}`);
  console.log(`- Precedents type: ${typeof precedents}`);
  
  if (precedents) {
    if (Array.isArray(precedents)) {
      console.log(`- Precedents array length: ${precedents.length}`);
      
      // Log some basic info about the precedents
      if (precedents.length > 0) {
        console.log("- Examining precedents array content:");
        for (let i = 0; i < Math.min(precedents.length, 2); i++) {
          const precedent = precedents[i];
          console.log(`  - Precedent [${i}]:`);
          console.log(`    - Type: ${typeof precedent}`);
          
          if (precedent) {
            // Check if this is already a precedent object or needs to be unwrapped
            if (precedent.precedent) {
              console.log(`    - Nested precedent object`);
              console.log(`    - Precedent ID: ${precedent.precedent.id || precedent.precedent.precedent_id || 'No ID'}`);
              console.log(`    - Title: ${precedent.precedent.title || 'No title'}`);
              console.log(`    - Has reasoning_paths: ${Boolean(precedent.precedent.reasoning_paths)}`);
              if (precedent.precedent.reasoning_paths) {
                console.log(`    - Reasoning paths count: ${precedent.precedent.reasoning_paths.length}`);
              }
              console.log(`    - Similarity score: ${precedent.similarity !== undefined ? precedent.similarity.toFixed(2) : 'Not available'}`);
            } else {
              console.log(`    - Direct precedent object (no nesting)`);
              console.log(`    - ID: ${precedent.id || precedent.precedent_id || 'No ID'}`);
              console.log(`    - Title: ${precedent.title || 'No title'}`);
              console.log(`    - Keys: ${Object.keys(precedent).join(', ')}`);
              console.log(`    - Has reasoning_paths: ${Boolean(precedent.reasoning_paths)}`);
              if (precedent.reasoning_paths) {
                console.log(`    - Reasoning paths count: ${precedent.reasoning_paths.length}`);
              }
              console.log(`    - No similarity score`);
            }
          } else {
            console.log(`    - NULL or UNDEFINED precedent`);
          }
        }
      }
    } else {
      console.log(`  - Precedents is not an array. Type: ${typeof precedents}`);
    }
  } else {
    console.log("ERROR: No precedents provided to handleNoMatchCase");
    // Log framework failure
    frameworkLogger.logFrameworkFailure(
      "unknown", 
      "handleNoMatchCase", 
      "No precedents provided", 
      { dilemma: dilemma ? { title: dilemma.title, id: dilemma.id } : null },
      { function: "handleNoMatchCase", precedentsProvided: false }
    );
  }
  
  console.log("\nUsing granular extraction approach for synthetic path generation...");
  
  try {
    console.log("Calling extractAndCombineReasoningElements with dilemma and precedents");
    // Call the granular extraction to create hybrid frameworks based on both
    // the dilemma structure and any precedents
    const result = await extractAndCombineReasoningElements(dilemma, precedents);
    
    console.log("Results from extractAndCombineReasoningElements:");
    console.log(`- Has syntheticPaths: ${Boolean(result.syntheticPaths)}`);
    console.log(`- SyntheticPaths count: ${result.syntheticPaths ? result.syntheticPaths.length : 0}`);
    console.log(`- Has extractedElements: ${Boolean(result.extractedElements)}`);
    console.log(`- ExtractedElements count: ${result.extractedElements ? result.extractedElements.length : 0}`);
    
    if (result.syntheticPaths && result.syntheticPaths.length > 0) {
      console.log("Returning synthetic paths as reasoning paths");
      
      // Log framework references for each synthetic path and validate with registry
      // Check for the frameworks actually being used
      for (const path of result.syntheticPaths) {
        console.log(`Checking synthetic path framework: ${path.framework}`);
        
        // If there are frameworks in the database, register them
        if (path.framework && typeof path.framework === 'string') {
          // Try to register framework with registry
          const framework = getFrameworkByName(path.framework);
          
          // If this appears to be a hybrid framework, ensure it's properly flagged
          if (path.framework.toLowerCase().includes('hybrid')) {
            // Just use getFrameworkByName which handles hybrid frameworks
            getFrameworkByName(path.framework);
          }
        } else {
          console.warn("Path has invalid framework: ", path.framework);
        }
      }
      
      return result.syntheticPaths;
    } else {
      console.log("No synthetic paths generated, returning empty array");
      return [];
    }
  } catch (error) {
    console.error(`Error in handleNoMatchCase: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return [];
  } finally {
    console.log("====== EXITING handleNoMatchCase ======");
  }
}

/**
 * Generate reasoning paths for a dilemma using precedent-based reasoning
 * @param {Object} dilemma - The dilemma to generate reasoning paths for
 * @param {Array} precedentStore - The precedent database
 * @param {Object} options - Optional options for generating reasoning paths
 * @returns {Object} Object containing matchCase and reasoningPaths arrays
 */
async function generateReasoningPaths(dilemma, precedentStore, options = {}) {
  console.log("\n====== ENTERING generateReasoningPaths ======");
  console.log(`Processing dilemma: "${dilemma.title || 'Untitled dilemma'}"`);
  
  // Debug logging for input validation
  console.log("Validating inputs to generateReasoningPaths:");
  console.log(`- Dilemma provided: ${Boolean(dilemma)}`);
  if (!dilemma) {
    console.error("ERROR: No dilemma provided to generateReasoningPaths");
    
    // Log framework failure
    frameworkLogger.logFrameworkFailure(
      "dilemma", 
      "generateReasoningPaths", 
      "No dilemma provided", 
      { dilemma: null },
      { function: "generateReasoningPaths" }
    );
    
    console.log("====== EXITING generateReasoningPaths with ERROR ======");
    return { matchCase: 'no_match', reasoningPaths: [] };
  }
  
  console.log(`- Precedent store provided: ${Boolean(precedentStore)}`);
  if (!precedentStore) {
    console.warn("WARNING: No precedent store provided, using empty array");
    precedentStore = [];
    
    // Log framework warning
    frameworkLogger.logFrameworkLookup(
      "precedent_store", 
      "generateReasoningPaths", 
      false, 
      { 
        dilemmaTitle: dilemma.title || "Untitled",
        dilemmaId: dilemma.id || "Unknown"
      }
    );
  }
  
  // Gather options with defaults
  const similarityThreshold = options.similarityThreshold || 0.5;
  const maxPrecedents = options.maxPrecedents || 5;
  const returnAllPaths = options.returnAllPaths || false;
  
  console.log(`- Options: threshold=${similarityThreshold}, maxPrecedents=${maxPrecedents}, returnAllPaths=${returnAllPaths}`);
  
  try {
    // Find relevant precedents based on similarity
    console.log("\nFinding relevant precedents...");
    const relevantPrecedents = await findRelevantPrecedents(dilemma, precedentStore, similarityThreshold, maxPrecedents);
    
    console.log(`Found ${relevantPrecedents.length} relevant precedents`);
    
    // Log each relevant precedent for debugging
    if (relevantPrecedents.length > 0) {
      console.log("Relevant precedents details:");
      relevantPrecedents.forEach((relevantPrecedent, i) => {
        if (!relevantPrecedent) {
          console.log(`[${i}] NULL or UNDEFINED precedent in relevantPrecedents array`);
          return;
        }
        
        const precedent = relevantPrecedent.precedent || relevantPrecedent;
        const similarity = relevantPrecedent.similarity || 'N/A';
        const id = precedent.id || 'No ID';
        const title = precedent.title || 'Untitled';
        
        console.log(`[${i}] "${title}" (ID: ${id}), similarity: ${similarity}`);
        console.log(`    - Has reasoning_paths: ${Boolean(precedent.reasoning_paths)} (${precedent.reasoning_paths ? precedent.reasoning_paths.length : 0} paths)`);
        
        // Log precedent lookup success
        frameworkLogger.logFrameworkLookup(
          `precedent:${id}`, 
          "generateReasoningPaths.findRelevantPrecedents", 
          true, 
          { 
            precedentTitle: title,
            similarity: similarity,
            hasReasoningPaths: Boolean(precedent.reasoning_paths),
            reasoningPathCount: precedent.reasoning_paths ? precedent.reasoning_paths.length : 0
          }
        );
      });
    }
    
    // Determine if we have any matches
    if (relevantPrecedents.length === 0) {
      console.log("No relevant precedents found, handling as no-match case");
      
      // Log framework lookup failure
      frameworkLogger.logFrameworkLookup(
        "relevant_precedents", 
        "generateReasoningPaths.findRelevantPrecedents", 
        false, 
        { 
          dilemmaTitle: dilemma.title || "Untitled",
          dilemmaId: dilemma.id || "Unknown",
          similarityThreshold: similarityThreshold,
          precedentStoreSize: precedentStore.length
        }
      );
      
      // No matches found, handle with synthetic reasoning generation
      const syntheticPaths = await handleNoMatchCase(dilemma, precedentStore);
      
      console.log(`Generated ${syntheticPaths.length} synthetic paths`);
      console.log("====== EXITING generateReasoningPaths with NO_MATCH ======");
      
      return {
        matchCase: 'no_match',
        reasoningPaths: syntheticPaths
      };
    }
    
    console.log("\nAdapting reasoning paths from precedents...");
    
    // Process precedents to adapt reasoning paths
    const adaptedPaths = [];
    let matchCase = 'partial_match';
    
    // Track if we have any strong matches (exact or close)
    let hasStrongMatch = false;
    
    // Process each precedent to create adapted reasoning paths
    for (const relevantPrecedent of relevantPrecedents) {
      if (!relevantPrecedent) {
        console.log("Skipping NULL or UNDEFINED precedent in relevantPrecedents loop");
        continue;
      }
      
      const precedent = relevantPrecedent.precedent || relevantPrecedent;
      const similarity = relevantPrecedent.similarity || 0;
      
      console.log(`Processing precedent "${precedent.title || 'Untitled'}" (similarity: ${similarity})`);
      
      // If similarity is very high, consider it a direct match
      if (similarity > 0.85) {
        console.log(`Strong match found (similarity ${similarity}), marking as exact_match`);
        matchCase = 'exact_match';
        hasStrongMatch = true;
      } else if (similarity > 0.75 && !hasStrongMatch) {
        console.log(`Close match found (similarity ${similarity}), marking as close_match`);
        matchCase = 'close_match';
        hasStrongMatch = true;
      }
      
      // Check if the precedent has reasoning paths
      if (!precedent.reasoning_paths || !Array.isArray(precedent.reasoning_paths)) {
        console.warn(`Precedent "${precedent.title || 'Untitled'}" has no reasoning_paths array`);
        
        // Log framework lookup failure
        frameworkLogger.logFrameworkLookup(
          `precedent:${precedent.id || 'unknown'}:reasoning_paths`, 
          "generateReasoningPaths.adaptPaths", 
          false, 
          { 
            precedentTitle: precedent.title || "Untitled",
            similarity: similarity,
            reason: "No reasoning_paths array"
          }
        );
        
        continue;
      }
      
      console.log(`Adapting ${precedent.reasoning_paths.length} reasoning paths from precedent`);
      
      // Apply adaptation rules to each reasoning path
      for (const path of precedent.reasoning_paths) {
        try {
          // Log framework reference before adaptation
          if (path.framework) {
            frameworkLogger.logFrameworkReference(
              path.framework,
              "generateReasoningPaths.beforeAdaptation",
              {
                precedentId: precedent.id || "unknown",
                precedentTitle: precedent.title || "Untitled",
                pathId: path.id || "unknown",
                conclusion: path.conclusion || "unknown"
              }
            );
          }
          
          const adaptedPath = applyAdaptationRules(path, dilemma, precedent, similarity);
          if (adaptedPath) {
            adaptedPaths.push(adaptedPath);
            console.log(`Added adapted path for framework "${adaptedPath.framework}"`);
            
            // Log successful framework adaptation
            frameworkLogger.logFrameworkLookup(
              adaptedPath.framework || "unknown_framework",
              "generateReasoningPaths.adaptPath",
              true,
              {
                originalFramework: path.framework,
                precedentId: precedent.id || "unknown",
                precedentTitle: precedent.title || "Untitled",
                similarity: similarity
              }
            );
          } else {
            console.warn(`Failed to adapt path for framework "${path.framework}"`);
            
            // Log framework adaptation failure
            frameworkLogger.logFrameworkLookup(
              path.framework || "unknown_framework",
              "generateReasoningPaths.adaptPath",
              false,
              {
                precedentId: precedent.id || "unknown",
                precedentTitle: precedent.title || "Untitled",
                reason: "Adaptation returned null"
              }
            );
          }
        } catch (error) {
          console.error(`Error adapting reasoning path: ${error.message}`);
          
          // Log framework adaptation error
          frameworkLogger.logFrameworkFailure(
            path.framework || "unknown_framework",
            "generateReasoningPaths.adaptPath",
            `Error: ${error.message}`,
            { path, error: error.stack },
            {
              precedentId: precedent.id || "unknown",
              precedentTitle: precedent.title || "Untitled"
            }
          );
        }
      }
    }
    
    // If we found relevant precedents but couldn't create any paths, handle as no match
    if (adaptedPaths.length === 0) {
      console.warn("No adapted paths could be created from relevant precedents, falling back to no-match case");
      
      // Log framework failure
      frameworkLogger.logFrameworkFailure(
        "adapted_paths",
        "generateReasoningPaths",
        "No adapted paths could be created",
        { relevantPrecedentsCount: relevantPrecedents.length },
        {
          dilemmaTitle: dilemma.title || "Untitled",
          dilemmaId: dilemma.id || "Unknown"
        }
      );
      
      const syntheticPaths = await handleNoMatchCase(dilemma, precedentStore);
      
      console.log(`Generated ${syntheticPaths.length} synthetic paths as fallback`);
      console.log("====== EXITING generateReasoningPaths with NO_MATCH fallback ======");
      
      return {
        matchCase: 'no_match',
        reasoningPaths: syntheticPaths
      };
    }
    
    console.log(`Successfully adapted ${adaptedPaths.length} reasoning paths`);
    console.log(`Match case determined as: ${matchCase}`);
    console.log("====== EXITING generateReasoningPaths with SUCCESS ======");
    
    return {
      matchCase: matchCase,
      reasoningPaths: adaptedPaths
    };
  } catch (error) {
    console.error(`Error in generateReasoningPaths: ${error.message}`);
    
    // Log framework failure
    frameworkLogger.logFrameworkFailure(
      "generateReasoningPaths",
      "generateReasoningPaths",
      `Error: ${error.message}`,
      { error: error.stack },
      {
        dilemmaTitle: dilemma ? dilemma.title : "unknown",
        dilemmaId: dilemma ? dilemma.id : "unknown"
      }
    );
    
    console.log("====== EXITING generateReasoningPaths with ERROR ======");
    
    // Return empty result with error flag
    return {
      matchCase: 'error',
      reasoningPaths: [],
      error: error.message
    };
  }
}

/**
 * Adapts a reasoning path from a precedent to a new dilemma
 * @param {Object} precedent - The precedent containing the reasoning path
 * @param {Object} basePath - The reasoning path to adapt
 * @param {Object} dilemma - The dilemma to adapt the reasoning path to
 * @returns {Object} The adapted reasoning path
 */
async function adaptReasoningPath(precedent, basePath, dilemma) {
    if (!precedent || !basePath || !dilemma) {
        console.warn("adaptReasoningPath: Missing required parameters");
        
        // Log framework failure
        frameworkLogger.logFrameworkFailure(
          "adaptReasoningPath",
          "adaptReasoningPath",
          "Missing required parameters",
          { 
            hasPrecedent: Boolean(precedent),
            hasBasePath: Boolean(basePath),
            hasDilemma: Boolean(dilemma)
          },
          { function: "adaptReasoningPath" }
        );
        
        return null;
    }

    try {
        // Create a deep copy to avoid modifying the original
        const adaptedPath = deepCopy(basePath);
        
        // Add source information
        adaptedPath.adapted_from = {
            precedent_id: precedent.id,
            precedent_title: precedent.title,
            original_path_id: basePath.id
        };
        
        // Look up the framework in the registry if it exists
        let frameworkName = basePath.framework;
        let canonicalFramework = null;
        
        if (frameworkName) {
            // Trim whitespace and look up in registry
            frameworkName = frameworkName.trim();
            canonicalFramework = getFrameworkByName(frameworkName);
            
            // Use canonical name if found
            if (canonicalFramework) {
                console.log(`Found canonical framework for "${frameworkName}": "${canonicalFramework.name}"`);
                adaptedPath.framework = canonicalFramework.name;
                adaptedPath.framework_id = canonicalFramework.id;
            }
            
            // Log framework lookup
            frameworkLogger.logFrameworkLookup(
                frameworkName,
                "adaptReasoningPath.frameworkLookup",
                Boolean(canonicalFramework),
                {
                    matchedFramework: canonicalFramework ? canonicalFramework.name : null,
                    precedentId: precedent.id || "unknown",
                    precedentTitle: precedent.title || "Untitled",
                    pathId: basePath.id || "unknown"
                }
            );
        }
        
        // Generate a new ID for the adapted path
        // Use canonical framework ID if available
        const frameworkId = canonicalFramework ? canonicalFramework.id : (basePath.framework || 'unknown');
        adaptedPath.id = `${dilemma.precedent_id || 'new'}-${frameworkId}-${Date.now()}`;
        
        // Mark as adapted
        adaptedPath.source = 'adapted';
        
        // Log framework reference
        if (frameworkName) {
            // Use canonical name if available
            const nameToLog = canonicalFramework ? canonicalFramework.name : frameworkName;
            
            frameworkLogger.logFrameworkReference(
                nameToLog,
                "adaptReasoningPath",
                {
                    precedentId: precedent.id || "unknown",
                    precedentTitle: precedent.title || "Untitled",
                    pathId: basePath.id || "unknown",
                    dilemmaId: dilemma.id || "unknown",
                    dilemmaTitle: dilemma.title || "Untitled",
                    canonicalName: Boolean(canonicalFramework)
                }
            );
        }
        
        // Apply adaptation rules
        // This is a placeholder - you would implement more sophisticated adaptation logic here
        adaptedPath.argument = `[ADAPTED: This reasoning has been adapted from the "${precedent.title}" precedent to the "${dilemma.title}" dilemma.]\n\n${adaptedPath.argument}`;
        
        return adaptedPath;
    } catch (error) {
        console.error("Error in adaptReasoningPath:", error);
        
        // Log framework failure
        frameworkLogger.logFrameworkFailure(
          basePath.framework || "unknown_framework",
          "adaptReasoningPath",
          `Error: ${error.message}`,
          { error: error.stack },
          {
            precedentId: precedent.id || "unknown",
            precedentTitle: precedent.title || "Untitled",
            dilemmaId: dilemma.id || "unknown",
            dilemmaTitle: dilemma.title || "Untitled"
          }
        );
        
        return null;
    }
}

/**
 * Find precedents relevant to a dilemma
 * @param {Object} dilemma - The dilemma to find precedents for
 * @param {Array} precedentDatabase - The precedent database
 * @returns {Array} Array of relevant precedents
 */
function findRelevantPrecedents(dilemma, precedentDatabase, similarityThreshold = 0.5, maxResults = 5) {
  console.log("\n====== ENTERING findRelevantPrecedents ======");
  
  // Validation logging
  console.log("Validating inputs to findRelevantPrecedents:");
  console.log(`- Dilemma provided: ${Boolean(dilemma)}`);
  if (dilemma) {
    console.log(`- Dilemma title: ${dilemma.title || 'Untitled'}`);
  } else {
    console.error("ERROR: No dilemma provided");
    
    // Log framework failure
    frameworkLogger.logFrameworkFailure(
      "dilemma",
      "findRelevantPrecedents",
      "No dilemma provided",
      { dilemma: null },
      { function: "findRelevantPrecedents" }
    );
    
    console.log("====== EXITING findRelevantPrecedents with ERROR ======");
    return [];
  }
  
  console.log(`- Precedent store provided: ${Boolean(precedentDatabase)}`);
  if (!precedentDatabase) {
    console.warn("WARNING: No precedent store provided");
    
    // Log framework warning
    frameworkLogger.logFrameworkLookup(
      "precedent_database",
      "findRelevantPrecedents",
      false,
      {
        dilemmaTitle: dilemma.title || "Untitled",
        dilemmaId: dilemma.id || "Unknown"
      }
    );
    
    console.log("====== EXITING findRelevantPrecedents with empty array ======");
    return [];
  }
  
  console.log(`- Precedent store is array: ${Array.isArray(precedentDatabase)}`);
  if (!Array.isArray(precedentDatabase)) {
    console.error("ERROR: Precedent store is not an array");
    
    // Log framework failure
    frameworkLogger.logFrameworkFailure(
      "precedent_database",
      "findRelevantPrecedents",
      "Precedent store is not an array",
      { precedentDatabase: typeof precedentDatabase },
      { function: "findRelevantPrecedents" }
    );
    
    console.log("====== EXITING findRelevantPrecedents with ERROR ======");
    return [];
  }
  
  console.log(`- Precedent store length: ${precedentDatabase.length}`);
  console.log(`- Similarity threshold: ${similarityThreshold}`);
  console.log(`- Max results: ${maxResults}`);
  
  // If no precedents are in the store, return empty array
  if (precedentDatabase.length === 0) {
    console.log("No precedents in store, returning empty array");
    console.log("====== EXITING findRelevantPrecedents with empty array ======");
    return [];
  }
  
  try {
    // Create dilemma text for comparison
    console.log("Creating dilemma text for comparison...");
    const dilemmaText = createDilemmaText(dilemma);
    console.log(`Dilemma text length: ${dilemmaText.length} characters`);
    
    // Calculate similarity scores for each precedent
    console.log("Calculating similarity for each precedent...");
    
    const scoredPrecedents = [];
    
    for (let i = 0; i < precedentDatabase.length; i++) {
      const precedent = precedentDatabase[i];
      
      // Skip null or undefined precedents
      if (!precedent) {
        console.log(`Precedent [${i}] is null or undefined, skipping`);
        continue;
      }
      
      console.log(`\nProcessing precedent [${i}]:`);
      console.log(`- Type: ${typeof precedent}`);
      
      if (typeof precedent !== 'object') {
        console.log(`- Not an object, skipping`);
        continue;
      }
      
      // Log precedent details
      const id = precedent.id || 'No ID';
      const title = precedent.title || 'Untitled';
      console.log(`- ID: ${id}`);
      console.log(`- Title: ${title}`);
      
      // Create precedent text
      let precedentText = "";
      
      if (precedent.description) {
        precedentText += precedent.description + " ";
      }
      
      if (precedent.title) {
        precedentText += precedent.title + " ";
      }
      
      if (precedent.context) {
        precedentText += precedent.context + " ";
      }
      
      // Include reasoning paths if available
      if (precedent.reasoning_paths && Array.isArray(precedent.reasoning_paths)) {
        console.log(`- Has ${precedent.reasoning_paths.length} reasoning paths`);
        
        precedent.reasoning_paths.forEach(path => {
          if (path.argument) precedentText += path.argument + " ";
          if (path.conclusion) precedentText += path.conclusion + " ";
          
          // Log framework reference
          if (path.framework) {
            frameworkLogger.logFrameworkReference(
              path.framework,
              "findRelevantPrecedents.precedentPath",
              {
                precedentId: id,
                precedentTitle: title,
                pathId: path.id || 'unknown',
                frameworkId: path.framework_id || 'unknown'
              }
            );
          }
        });
      }
      
      // Calculate similarity
      console.log(`- Calculating similarity between dilemma and precedent...`);
      const similarity = calculateSimilarity(dilemmaText, precedentText);
      console.log(`- Similarity score: ${similarity.toFixed(4)}`);
      
      // Add to scored precedents if it meets threshold
      if (similarity >= similarityThreshold) {
        console.log(`- Above threshold (${similarityThreshold}), adding to results`);
        scoredPrecedents.push({
          precedent,
          similarity
        });
      } else {
        console.log(`- Below threshold (${similarityThreshold}), skipping`);
      }
    }
    
    // Sort by similarity (highest first)
    console.log(`\nSorting ${scoredPrecedents.length} precedents by similarity...`);
    scoredPrecedents.sort((a, b) => b.similarity - a.similarity);
    
    // Limit to max results
    const result = scoredPrecedents.slice(0, maxResults);
    console.log(`Returning top ${result.length} precedents from ${scoredPrecedents.length} matches`);
    
    console.log("====== EXITING findRelevantPrecedents ======");
    return result;
  } catch (error) {
    console.error(`Error in findRelevantPrecedents: ${error.message}`);
    console.error(error.stack);
    
    // Log the error
    frameworkLogger.logFrameworkFailure(
      "findRelevantPrecedents",
      "findRelevantPrecedents",
      `Exception: ${error.message}`,
      { dilemma: dilemma.title || "Unknown" },
      { error: error.stack }
    );
    
    console.log("====== EXITING findRelevantPrecedents with ERROR ======");
    return [];
  }
}

/**
 * Creates a text representation of a dilemma for similarity comparison
 * @param {Object} dilemma - The dilemma object
 * @returns {string} Text representation of the dilemma
 */
function createDilemmaText(dilemma) {
  if (!dilemma) return "";
  
  let dilemmaText = "";
  
  // Add title
  if (dilemma.title) {
    dilemmaText += dilemma.title + " ";
  }
  
  // Add description
  if (dilemma.description) {
    dilemmaText += dilemma.description + " ";
  }
  
  // Add context
  if (dilemma.context) {
    dilemmaText += dilemma.context + " ";
  }
  
  // Add possible actions
  if (dilemma.possible_actions && Array.isArray(dilemma.possible_actions)) {
    dilemmaText += dilemma.possible_actions.join(" ") + " ";
  }
  
  // Add contextual factors
  if (dilemma.contextual_factors && Array.isArray(dilemma.contextual_factors)) {
    dilemmaText += dilemma.contextual_factors.join(" ");
  }
  
  return dilemmaText;
}

// Export functions
module.exports = {
  extractReasoningElements,
  findBestPrecedent,
  handleNoMatchCase,
  generateReasoningPaths,
  adaptReasoningPath,
  findRelevantPrecedents,
  createDilemmaText
};
