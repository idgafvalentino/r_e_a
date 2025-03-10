/**
 * Dilemma Creation Utility
 * 
 * This file contains functions for creating comprehensive dilemma objects
 * with all required parameters and contextual factors needed by adaptation rules.
 */

/**
 * Creates a complete dilemma object with all required parameters
 * @param {string} type - The type of dilemma to create (e.g., 'trolley', 'medical', 'resource')
 * @param {Object} options - Optional parameters to customize the dilemma
 * @returns {Object} A complete dilemma object
 */
function createDilemma(type, options = {}) {
  // Default options with reasonable values
  const defaults = {
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Dilemma`,
    description: `A dilemma involving ${type} decisions.`,
    certainty_of_outcome: 0.7,
    information_availability: 'complete',
    time_pressure: 'moderate',
    resource_divisibility: 'divisible',
    alternatives: 'available',
    relationship_to_beneficiary: 'none',
    property_value: 'medium',
    life_at_stake: true,
    num_people_affected: 5,
    contextType: 'Generic'
  };

  // Merge defaults with provided options
  const settings = { ...defaults, ...options };

  // Base dilemma structure
  const dilemma = {
    title: settings.title,
    description: settings.description,
    situation: {
      type: settings.contextType,
      context: [type],
      key_factors: [],
      // Parameters expected by adaptation rules - USING THE CORRECT STRUCTURE WITH VALUE PROPERTY
      parameters: {
        certainty_of_outcome: { value: settings.certainty_of_outcome },
        information_availability: { value: settings.information_availability },
        time_pressure: { value: settings.time_pressure },
        resource_divisibility: { value: settings.resource_divisibility },
        alternatives: { value: settings.alternatives },
        relationship_to_beneficiary: { value: settings.relationship_to_beneficiary },
        property_value: { value: settings.property_value },
        life_at_stake: { value: settings.life_at_stake },
        num_people_affected: { value: settings.num_people_affected }
      }
    },
    possible_actions: []
  };

  // Add type-specific elements
  switch (type.toLowerCase()) {
    case 'trolley':
      return createTrolleyDilemma(dilemma, settings);
    case 'medical':
      return createMedicalDilemma(dilemma, settings);
    case 'resource':
      return createResourceDilemma(dilemma, settings);
    case 'property':
      return createPropertyDilemma(dilemma, settings);
    default:
      return dilemma;
  }
}

/**
 * Creates a trolley problem dilemma
 * @param {Object} baseDilemma - The base dilemma object
 * @param {Object} settings - Settings for the dilemma
 * @returns {Object} A complete trolley problem dilemma
 */
function createTrolleyDilemma(baseDilemma, settings) {
  const dilemma = { ...baseDilemma };
  
  // Override defaults with trolley-specific values
  dilemma.title = settings.title || 'Trolley Problem';
  dilemma.description = settings.description || 'A runaway trolley is heading down the tracks toward five people who will be killed if it continues. You can pull a lever to divert the trolley to another track where it will kill one person instead. Would you pull the lever?';
  dilemma.situation.type = 'Ethical Dilemma';
  dilemma.situation.context = ['Life-or-death decision', 'significant consequences'];
  dilemma.situation.key_factors = ['lives at stake', 'active intervention', 'responsibility for outcome'];
  
  // Add trolley-specific parameters with value property
  dilemma.situation.parameters.num_people_main_track = { value: settings.num_people_main_track || 5 };
  dilemma.situation.parameters.num_people_side_track = { value: settings.num_people_side_track || 1 };
  
  // Add possible actions
  dilemma.possible_actions = [
    { action: 'pull_lever', description: 'Pull the lever to divert the trolley to the side track' },
    { action: 'dont_pull', description: 'Do not pull the lever, allowing the trolley to continue on the main track' }
  ];
  
  return dilemma;
}

/**
 * Creates a medical ethics dilemma
 * @param {Object} baseDilemma - The base dilemma object
 * @param {Object} settings - Settings for the dilemma
 * @returns {Object} A complete medical ethics dilemma
 */
function createMedicalDilemma(baseDilemma, settings) {
  const dilemma = { ...baseDilemma };
  
  // Override defaults with medical-specific values
  dilemma.title = settings.title || 'Medical Triage Dilemma';
  dilemma.description = settings.description || 'In a mass casualty event with limited medical resources, you must decide which patients to treat first.';
  dilemma.situation.type = 'Medical Ethics';
  dilemma.situation.context = ['Hospital Setting', 'Emergency Situation'];
  dilemma.situation.key_factors = ['medical ethics', 'resource scarcity', 'professional duty'];
  
  // Set medical-specific parameters with value property
  dilemma.situation.parameters.medical_context = { value: settings.medical_context || 'hospital_emergency' };
  dilemma.situation.parameters.treatment_scarcity = { value: settings.treatment_scarcity || 'high' };
  
  // Add possible actions
  dilemma.possible_actions = [
    { action: 'prioritize_greatest_good', description: 'Prioritize patients with highest chance of survival' },
    { action: 'treat_equally_urgent_cases_first', description: 'Treat the most critically injured patients first regardless of survival chances' },
    { action: 'follow_triage_protocol', description: 'Follow standard triage protocols without deviation' }
  ];
  
  return dilemma;
}

/**
 * Creates a resource allocation dilemma
 * @param {Object} baseDilemma - The base dilemma object
 * @param {Object} settings - Settings for the dilemma
 * @returns {Object} A complete resource allocation dilemma
 */
function createResourceDilemma(baseDilemma, settings) {
  const dilemma = { ...baseDilemma };
  
  // Override defaults with resource-specific values
  dilemma.title = settings.title || 'Resource Allocation Dilemma';
  dilemma.description = settings.description || 'You must decide how to allocate limited resources among multiple groups with competing needs.';
  dilemma.situation.type = 'Resource Allocation';
  dilemma.situation.context = ['Scarcity', 'Distribution Decision'];
  dilemma.situation.key_factors = ['fairness', 'need', 'utility', 'resource constraints'];
  
  // Set resource-specific parameters with value property
  dilemma.situation.parameters.resource_type = { value: settings.resource_type || 'essential' };
  dilemma.situation.parameters.urgency = { value: settings.urgency || 'high' };
  
  // Add possible actions
  dilemma.possible_actions = [
    { action: 'equal_distribution', description: 'Distribute resources equally among all groups' },
    { action: 'need_based', description: 'Distribute resources based on greatest need' },
    { action: 'utility_based', description: 'Distribute resources to maximize overall utility' },
    { action: 'merit_based', description: 'Distribute resources based on merit or contribution' }
  ];
  
  return dilemma;
}

/**
 * Creates a property rights dilemma
 * @param {Object} baseDilemma - The base dilemma object
 * @param {Object} settings - Settings for the dilemma
 * @returns {Object} A complete property rights dilemma
 */
function createPropertyDilemma(baseDilemma, settings) {
  const dilemma = { ...baseDilemma };
  
  // Override defaults with property-specific values
  dilemma.title = settings.title || 'Property Rights Dilemma';
  dilemma.description = settings.description || 'You must decide whether to violate property rights to serve a greater need.';
  dilemma.situation.type = 'Property Ethics';
  dilemma.situation.context = ['Emergency', 'Property Rights'];
  dilemma.situation.key_factors = ['ownership', 'need', 'public good', 'harm prevention'];
  
  // Set property-specific parameters with value property
  dilemma.situation.parameters.property_type = { value: settings.property_type || 'private' };
  dilemma.situation.parameters.owner_present = { value: settings.owner_present || false };
  
  // Add possible actions
  dilemma.possible_actions = [
    { action: 'respect_property', description: 'Respect property rights above all else' },
    { action: 'violate_for_need', description: 'Violate property rights to meet an urgent need' },
    { action: 'seek_permission', description: 'Attempt to contact the owner for permission' },
    { action: 'compensate_later', description: 'Use the property but compensate the owner later' }
  ];
  
  return dilemma;
}

/**
 * Validates a dilemma to ensure it has all required parameters
 * @param {Object} dilemma - The dilemma to validate
 * @returns {Object} Validation result with success flag and missing parameters
 */
function validateDilemma(dilemma) {
  const requiredParameters = [
    'certainty_of_outcome',
    'information_availability',
    'time_pressure',
    'resource_divisibility',
    'alternatives',
    'relationship_to_beneficiary',
    'property_value',
    'life_at_stake',
    'num_people_affected'
  ];
  
  const missingParameters = [];
  
  // Check in parameters object
  const parametersCheck = (dilemma.situation && dilemma.situation.parameters) || {};
  for (const param of requiredParameters) {
    if (parametersCheck[param] === undefined || parametersCheck[param].value === undefined) {
      missingParameters.push(`parameters.${param}`);
    }
  }
  
  return {
    success: missingParameters.length === 0,
    missingParameters
  };
}

module.exports = {
  createDilemma,
  validateDilemma
}; 