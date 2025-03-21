const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// Store active intervention state
let currentIntervention = null;
let interventionHistory = [];

// Add a cooldown timer to prevent rapid consecutive interventions
let lastInterventionEndTime = 0;
const INTERVENTION_COOLDOWN = 5000; // 5 seconds cooldown between interventions

/**
 * Processes event data to determine if an intervention should be applied
 * MODIFIED: Increased probability of interventions
 */
function processEvents(events) {
  const now = Date.now();
  
  // If we already have an active intervention, don't generate a new one
  if (currentIntervention && currentIntervention.active) {
    console.log(`Active intervention in progress: ${currentIntervention.type} on ${currentIntervention.node}, expires in ${Math.round((currentIntervention.expiresAt - now)/1000)}s`);
    return [];
  }
  
  // Check if we're still in the cooldown period after the last intervention
  if (now - lastInterventionEndTime < INTERVENTION_COOLDOWN) {
    const remainingCooldown = Math.round((INTERVENTION_COOLDOWN - (now - lastInterventionEndTime)) / 1000);
    console.log(`In cooldown period, waiting ${remainingCooldown}s before next possible intervention`);
    return [];
  }
  
  // Analyze events to detect patterns
  console.log(`Processing ${events.length} events for potential interventions`);
  
  // MODIFIED: Fixed random trigger with higher probability (50% chance after cooldown)
  if (Math.random() < 0.5) {
    // Choose a random intervention type
    const interventionTypes = ['handPosition', 'ballPosition', 'collision'];
    const selectedType = interventionTypes[Math.floor(Math.random() * interventionTypes.length)];
    
    console.log(`INTERVENTION TRIGGER: Creating ${selectedType} intervention`);
    
    let intervention;
    
    // Create intervention based on selected type
    switch(selectedType) {
      case 'handPosition':
        intervention = {
          type: 'handPosition',
          node: 'handPosition',
          action: 'fix',
          x: 200 + (Math.random() * 100 - 50), // Randomize position slightly
          y: 150 + (Math.random() * 100 - 50),
          duration: 5000, // 5 seconds
          reason: 'Testing causal effect of fixed hand position'
        };
        break;
        
      case 'ballPosition':
        intervention = {
          type: 'ballPosition',
          node: 'ballPosition',
          action: 'fix',
          x: 100 + (Math.random() * 100 - 50),
          y: 100 + (Math.random() * 100 - 50),
          duration: 5000,
          reason: 'Testing causal effect of fixed ball position'
        };
        break;
        
      case 'collision':
        intervention = {
          type: 'collision',
          node: 'collision',
          action: 'prevent',
          duration: 5000,
          reason: 'Testing causal effect of prevented collisions'
        };
        break;
    }
    
    console.log(`Created intervention: ${intervention.node} ${intervention.action} for ${intervention.duration/1000}s`);
    return [intervention];
  }
  
  // MODIFIED: Fallback trigger based on event patterns
  // Analyze if there's any significant hand or ball movement
  let handMovement = false;
  let ballMovement = false;
  
  // Check last few events for movement
  const recentEvents = events.slice(-3);
  for (const event of recentEvents) {
    if (event.handVx && Math.abs(event.handVx) > 1) handMovement = true;
    if (event.handVy && Math.abs(event.handVy) > 1) handMovement = true;
    if (event.ballVx && Math.abs(event.ballVx) > 1) ballMovement = true;
    if (event.ballVy && Math.abs(event.ballVy) > 1) ballMovement = true;
  }
  
  // If there's any movement, 30% chance of intervention
  if ((handMovement || ballMovement) && Math.random() < 0.3) {
    console.log(`INTERVENTION TRIGGER: Movement detected, creating hand position intervention`);
    
    const intervention = {
      type: 'handPosition',
      node: 'handPosition',
      action: 'fix',
      x: 200,
      y: 150,
      duration: 5000,
      reason: 'Movement-triggered intervention'
    };
    
    console.log(`Created intervention: ${intervention.node} ${intervention.action} for ${intervention.duration/1000}s`);
    return [intervention];
  }
  
  return [];
}

// API endpoints
app.post('/process_events', (req, res) => {
  try {
    const eventLog = req.body.events;
    
    if (!eventLog || !Array.isArray(eventLog)) {
      console.log("ERROR: Invalid event data format received");
      return res.status(400).json({ 
        error: "Invalid event data format",
        interventions: [] 
      });
    }
    
    // Process events and determine intervention
    const interventions = processEvents(eventLog);
    
    // If a new intervention is generated, store it
    if (interventions.length > 0) {
      const interventionDuration = interventions[0].duration;
      currentIntervention = {
        ...interventions[0],
        timestamp: Date.now(),
        active: true,
        expiresAt: Date.now() + interventionDuration
      };
      
      // Store in history
      interventionHistory.push(currentIntervention);
      console.log(`INTERVENTION ACTIVATED: ${currentIntervention.node} ${currentIntervention.action} - active for ${interventionDuration/1000}s`);
      
      // Set timeout to clear active intervention
      setTimeout(() => {
        if (currentIntervention) {
          console.log(`INTERVENTION EXPIRED: ${currentIntervention.type} on ${currentIntervention.node}`);
          currentIntervention.active = false;
          currentIntervention = null; // Fully clear the intervention state
          lastInterventionEndTime = Date.now(); // Update cooldown timer
        }
      }, interventionDuration);
      
    } else {
      console.log("No intervention triggered at this time");
    }
    
    res.json({ interventions });
  } catch (error) {
    console.error("ERROR processing events:", error);
    res.status(500).json({ 
      error: "Server error processing events",
      interventions: [] 
    });
  }
});

app.get('/get_interventions', (req, res) => {
  const now = Date.now();

  // Check if we have an active intervention that hasn't expired yet
  if (currentIntervention && currentIntervention.active && currentIntervention.expiresAt > now) {
    console.log(`Sending active intervention: ${currentIntervention.node} ${currentIntervention.action}`);
    res.json({ interventions: [currentIntervention] });
  } 
  else {
    // Handle expired interventions
    if (currentIntervention && currentIntervention.active) {
      console.log(`EXPIRED INTERVENTION DETECTED: ${currentIntervention.node} - sending restore command`);
      
      // Mark it as inactive and set the cooldown
      currentIntervention.active = false;
      lastInterventionEndTime = now;
      
      // Send an explicit restore command with the intervention type
      const restoreCommand = {
        type: "restore",
        node: "restore",
        originalType: currentIntervention.type,
        originalNode: currentIntervention.node,
        forceRestore: true
      };
      
      // Store the fact we sent a restore command in history
      interventionHistory.push({
        ...restoreCommand,
        timestamp: now,
        isRestoreCommand: true
      });
      
      // Clear the current intervention
      currentIntervention = null;
      
      // Send the restore command to the client
      return res.json({ interventions: [restoreCommand] });
    }
    
    // No interventions, just check if we recently completed one
    const recentlyConcluded = (now - lastInterventionEndTime) < 2000; // Within 2 seconds
    
    if (recentlyConcluded) {
      // Still send restore commands for a brief period after intervention ends
      // This ensures the client gets the signal even if it missed the first one
      console.log("Recently concluded intervention - reinforcing restore command");
      return res.json({ 
        interventions: [{
          type: "restore",
          node: "restore",
          forceRestore: true
        }]
      });
    }
    
    // No active interventions and not recently concluded
    console.log("No active interventions");
    res.json({ interventions: [] });
  }
});

// Add a forced intervention endpoint for testing
app.get('/force_intervention/:type', (req, res) => {
  const interventionType = req.params.type;
  const duration = parseInt(req.query.duration || 5000);
  
  let intervention;
  
  switch(interventionType) {
    case 'hand':
      intervention = {
        type: 'handPosition',
        node: 'handPosition',
        action: 'fix',
        x: 200,
        y: 150,
        duration: duration,
        reason: 'Manual test intervention'
      };
      break;
      
    case 'ball':
      intervention = {
        type: 'ballPosition',
        node: 'ballPosition',
        action: 'fix',
        x: 150,
        y: 100,
        duration: duration,
        reason: 'Manual test intervention'
      };
      break;
      
    case 'collision':
      intervention = {
        type: 'collision',
        node: 'collision',
        action: 'prevent',
        duration: duration,
        reason: 'Manual test intervention'
      };
      break;
      
    default:
      return res.status(400).json({ error: 'Invalid intervention type' });
  }
  
  // Store the intervention
  currentIntervention = {
    ...intervention,
    timestamp: Date.now(),
    active: true,
    expiresAt: Date.now() + duration
  };
  
  // Store in history
  interventionHistory.push(currentIntervention);
  
  // Set auto-expiry
  setTimeout(() => {
    if (currentIntervention) {
      console.log(`FORCED INTERVENTION EXPIRED: ${currentIntervention.type}`);
      currentIntervention.active = false;
      currentIntervention = null;
      lastInterventionEndTime = Date.now();
    }
  }, duration);
  
  console.log(`FORCED INTERVENTION CREATED: ${intervention.type} for ${duration/1000}s`);
  res.json({ success: true, intervention });
});

// Debug endpoint to view intervention history and cooldown status
app.get('/debug/history', (req, res) => {
  const now = Date.now();
  const cooldownRemaining = Math.max(0, INTERVENTION_COOLDOWN - (now - lastInterventionEndTime));
  
  console.log("Debug endpoint accessed - returning intervention history");
  res.json({
    current: currentIntervention,
    history: interventionHistory,
    cooldown: {
      active: cooldownRemaining > 0,
      remainingMs: cooldownRemaining,
      remainingSec: Math.round(cooldownRemaining / 1000)
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Causal Intervention Server running on http://localhost:${PORT}`);
  console.log(`Intervention cooldown period: ${INTERVENTION_COOLDOWN/1000} seconds`);
  console.log(`Available intervention types:`);
  console.log(`  1. handPosition - Fixes the hand at a specific position`);
  console.log(`  2. ballPosition - Fixes the ball at a specific position`);
  console.log(`  3. collision - Prevents collisions between hand and ball`);
  console.log(`\nTEST ENDPOINTS:`);
  console.log(`  - To force an intervention: GET /force_intervention/:type`);
  console.log(`    Available types: hand, ball, collision`);
  console.log(`    Example: http://localhost:${PORT}/force_intervention/hand?duration=8000`);
});