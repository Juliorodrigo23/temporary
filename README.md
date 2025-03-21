# Causal Robot Arm Simulation & Intervention Platform

This project simulates a 2D robotic arm using physics and visualizes macro-level state changes to support causal analysis. It integrates dynamic causal interventions through a server backend and enables visualization of causal relationships in event logs via a DAG (Directed Acyclic Graph).

---

## 📁 Project Structure
juliorodrigo23-temporary/
├── README.md
├── causal-intervention-server.js
├── DAG.html
├── Sim.html
└── Sim_Intervention.html

---

## 🧠 Key Features

-   **2D Physics Simulation**: Interactive robotic arm simulation using Matter.js.
-   **Macro-Level Logging**: Captures events such as ball pick-up/release, collisions, and movements.
-   **Causal Interventions**: A Node.js server detects event patterns and injects interventions (e.g., freezing hand/ball positions or preventing collisions).
-   **DAG Visualizer**: Upload logs and explore causal links using D3.js.
-   **Arcade-Inspired Interface**: Overlaid arcade visuals for an engaging retro style.

---

## 🖥️ Files Overview

### 🔧 `causal-intervention-server.js`

-   Node.js Express backend to process recent event logs from the simulation.
-   Determines and manages active interventions with a cooldown.
-   API Endpoints:
    -   `POST /process_events`: Sends recent events, receives interventions.
    -   `GET /get_interventions`: Poll for active interventions or restoration signals.
    -   `GET /force_intervention/:type`: Force manual intervention for testing (`hand`, `ball`, or `collision`).
    -   `GET /debug/history`: View intervention history and cooldown state.

### 🎮 `Sim.html`

-   Full-featured robotic arm simulation.
-   Modes:
    -   Random movement
    -   Mouse control
-   Logs macro states into CSV with causal attributes (`eventType`, `collision`, `handAxis`, etc.).
-   Downloadable logs for DAG analysis.

### 🧪 `Sim_Intervention.html`

-   Extension of `Sim.html` that integrates with the intervention server.
-   Sends recent events to the server every 3 seconds.
-   Polls for interventions every second.
-   Applies received interventions (e.g., locks hand, freezes ball, prevents collisions).
-   Displays intervention state visually on-screen.

### 📊 `DAG.html`

-   Upload CSV logs from simulation to visualize causal DAGs.
-   D3.js based interactive graph.
-   Nodes represent physical quantities and interactions (e.g., `arm_x`, `ball_y`, `grab`, `release`).
-   Edges inferred from event patterns and relationships.

---

## 🛠️ Getting Started

### 1. Clone Repository

### 2. Install Server Dependencies

npm install express body-parser cors

### 3. Run the Intervention Server

node causal-intervention-server.js
The server starts on http://localhost:5001.

### 4. Open the Simulation
For standalone simulation: open Sim.html in a browser.
For server-integrated simulation with interventions: open Sim_Intervention.html.

### 5. View DAG
After downloading a CSV from the simulation, open DAG.html and upload the file to view its causal structure.

🧪 Example Use Cases
- Study how interventions affect robotic behavior.
- Test causal assumptions in movement/collision logs.
- Visualize cause-effect chains in robotic systems.
- Use DAG analysis for debugging or hypothesis testing.

