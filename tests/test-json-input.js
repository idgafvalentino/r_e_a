const fs = require('fs');
const path = require('path');

// Create a test JSON file that matches the structure in precedentDatabase
const testDilemma = {
  title: "Test Medical Triage Dilemma",
  description: "A doctor must decide how to allocate a limited life-saving medication among multiple patients with varying chances of survival and needs.",
  situation: {
    type: "ResourceAllocationDilemma",
    description: "A hospital has received a limited supply of a life-saving medication during a crisis. There are more patients who need the medication than available doses. The doctor must decide how to allocate the scarce resource.",
    parameters: {
      num_total_people: 7,
      num_can_be_saved: 5,
      resource_type: "medication",
      time_constraint: "urgent",
      selection_method_options: [
        "random",
        "criteria_based",
        "first_come_first_served"
      ]
    }
  },
  contextual_factors: [
    {
      factor: "certainty_of_outcome",
      value: "high",
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
      factor: "decision_maker_role",
      value: "professional_authority",
      relevance: "high"
    },
    {
      factor: "relationship_between_stakeholders",
      value: "professional_care_relationship",
      relevance: "medium"
    }
  ]
};

// Save the test file
const testFilePath = path.join(__dirname, 'test-dilemma.json');
fs.writeFileSync(testFilePath, JSON.stringify(testDilemma, null, 2));

console.log("Test dilemma JSON file created at:", testFilePath);
console.log("To test, run the main application and use option 3 to load this file.");
console.log("\nTest file contents:");
console.log(JSON.stringify(testDilemma, null, 2));

// Create another test case with minimal required fields
const minimalDilemma = {
  title: "Minimal Test Dilemma",
  description: "A simplified test dilemma with minimal fields.",
  situation: {
    type: "SimplifiedDilemma",
    description: "A simplified ethical dilemma for testing.",
    parameters: {
      difficulty: "medium"
    }
  },
  contextual_factors: [
    {
      factor: "time_pressure",
      value: "low",
      relevance: "medium"
    }
  ]
};

// Save the minimal test file
const minimalFilePath = path.join(__dirname, 'minimal-dilemma.json');
fs.writeFileSync(minimalFilePath, JSON.stringify(minimalDilemma, null, 2));

console.log("\nMinimal test dilemma JSON file created at:", minimalFilePath);
console.log("This file tests the system's ability to handle simple dilemmas.");
console.log("\nMinimal test file contents:");
console.log(JSON.stringify(minimalDilemma, null, 2));

// Create an invalid test case (with syntax error)
const invalidJson = '{ "title": "Invalid JSON Dilemma", "description": "This JSON has a syntax error, missing closing brace"';

// Save the invalid test file
const invalidFilePath = path.join(__dirname, 'invalid-dilemma.json');
fs.writeFileSync(invalidFilePath, invalidJson);

console.log("\nInvalid test dilemma JSON file created at:", invalidFilePath);
console.log("This file tests the system's error handling for invalid JSON."); 