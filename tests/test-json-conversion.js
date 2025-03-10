const fs = require('fs');
const path = require('path');

// Create a test with the simplified structure (flat parameters and object-based factors)
const simplifiedDilemma = {
  title: "Medical Resource Allocation - Simplified Format",
  description: "A doctor must decide how to allocate scarce medical resources.",
  parameters: {
    num_total_people: 10,
    num_can_be_saved: 6,
    resource_type: "ventilators",
    time_constraint: "urgent"
  },
  contextual_factors: {
    decision_maker_role: "doctor",
    time_pressure: "high",
    resource_scarcity: "severe",
    certainty_of_outcome: "medium"
  }
};

// Save the simplified test file
const simplifiedFilePath = path.join(__dirname, 'simplified-dilemma.json');
fs.writeFileSync(simplifiedFilePath, JSON.stringify(simplifiedDilemma, null, 2));

console.log("Simplified structure dilemma created at:", simplifiedFilePath);
console.log("\nSimplified structure contents:");
console.log(JSON.stringify(simplifiedDilemma, null, 2));
console.log("\nThis file uses a simplified format with flat parameters and object-based contextual factors.");
console.log("The system should convert this to the standardized format on input.");

// Create a test with the detailed structure (situation.parameters and array-based factors)
const detailedDilemma = {
  title: "Medical Resource Allocation - Detailed Format",
  description: "A doctor must decide how to allocate scarce medical resources.",
  situation: {
    type: "ResourceAllocationDilemma",
    description: "During a pandemic, a hospital has limited ventilators for patients in need.",
    parameters: {
      num_total_people: 10,
      num_can_be_saved: 6,
      resource_type: "ventilators",
      time_constraint: "urgent"
    }
  },
  contextual_factors: [
    {
      factor: "decision_maker_role",
      value: "doctor",
      relevance: "high"
    },
    {
      factor: "time_pressure", 
      value: "high",
      relevance: "high"
    },
    {
      factor: "resource_scarcity",
      value: "severe",
      relevance: "high"
    },
    {
      factor: "certainty_of_outcome",
      value: "medium",
      relevance: "medium"
    }
  ]
};

// Save the detailed test file
const detailedFilePath = path.join(__dirname, 'detailed-dilemma.json');
fs.writeFileSync(detailedFilePath, JSON.stringify(detailedDilemma, null, 2));

console.log("\n\nDetailed structure dilemma created at:", detailedFilePath);
console.log("\nDetailed structure contents:");
console.log(JSON.stringify(detailedDilemma, null, 2));
console.log("\nThis file uses the standardized format matching the precedent database structure.");
console.log("The system should process this directly without conversion.");

console.log("\n\nTo test the conversion functionality:");
console.log("1. Run the main application: node index.js");
console.log("2. Choose option 3 (Load from JSON file)");
console.log("3. Type: loadfile simplified-dilemma.json");
console.log("4. Observe the conversion process in the output");
console.log("5. Repeat with: loadfile detailed-dilemma.json");
console.log("6. Compare the final dilemma structures"); 