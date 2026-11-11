# LabelLens — Product Requirements Document

> Source: user-provided PRD via shared ChatGPT conversation (chatgpt.com/share, retrieved Nov 11 2026). Verbatim content below.

---

Product Requirements Document (PRD)
LabelLens — Human-Centred Food Packaging Research Platform

Version: 1.0
Date: November 11, 2026
Status: MVP Development
Competition: Presage SmartSpectra SDK Challenge
Submission deadline: November 22, 2026
Target category: Best Thoughtful Real-World Use + Best Overall Human-Sensing Experience

1. Product Overview
1.1 Product name

LabelLens

1.2 Tagline

Understand how consumers interact with food labels.

1.3 One-line description

LabelLens is a camera-based food packaging research platform that combines real-time physiological measurements, participant behaviour and self-reported feedback to help food companies evaluate the usability and clarity of food packaging.

1.4 Problem statement

Food packaging communicates important information, including:

Nutritional information.
Ingredients.
Allergen declarations.
Serving sizes.
Storage instructions.
Expiry dates.
Food certifications.

However, food companies often struggle to understand whether consumers can easily locate, interpret and compare this information.

Traditional packaging research generally relies on:

Surveys.
Focus groups.
Manual observation.
Consumer preference tests.
Task completion rates.

These methods provide useful information but may not capture all physiological responses occurring during the interaction.

LabelLens combines conventional usability testing with contactless physiological measurements to provide researchers with additional context.

1.5 Product vision

Make food packaging research more measurable by combining what consumers do, what they report and what physiological measurements are observed during interactions.

2. Target Users
Primary users

1. Food product development teams

Companies developing new food products can compare packaging designs before commercial launch.

2. Food scientists and sensory researchers

Researchers can conduct structured consumer studies and analyse participant responses.

3. Packaging designers

Designers can understand whether consumers can locate and interpret important information.

Secondary users
University food technology departments.
Food startups.
Consumer research agencies.
Nutrition communication researchers.
Example user persona

A food scientist developing a new protein rice product wants to compare two nutritional label designs.

They upload both designs, create testing tasks and invite 10 participants.

After testing, they compare:

Task completion time.
Answer accuracy.
Self-reported difficulty.
Physiological signal trends.

They use the findings to improve the packaging design.

3. Core Product Concept

LabelLens has two main interfaces.

A. Researcher Dashboard

Researchers create experiments, upload packaging designs, configure tasks and analyse results.

B. Participant Testing Interface

Participants view packaging designs, complete assigned tasks and provide feedback while SmartSpectra captures physiological measurements with explicit camera consent.

Core workflow
text
Researcher creates experiment
          |
          v
Uploads packaging designs
          |
          v
Creates research tasks
          |
          v
Generates participant session
          |
          v
Participant gives camera consent
          |
          v
SmartSpectra initializes
          |
          v
Signal quality verification
          |
          v
Participant completes tasks
          |
          v
Behaviour + physiological data
          |
          v
Participant feedback
          |
          v
Researcher analytics dashboard
          |
          v
Packaging comparison report

4. Product Features and Requirements
Module 1: Researcher Dashboard

Priority: P0

The researcher dashboard is the central control panel.

Features

1. Experiment creation

Researchers can create a new experiment.

Required fields:

Experiment name.
Research objective.
Product category.
Description.
Number of packaging variants.
Participant target.

2. Packaging upload

Researchers can upload packaging images.

Supported formats:

PNG.
JPG.
JPEG.
WebP.

Each experiment should support at least two packaging variants.

Example:

Variant	Packaging
A	Original nutritional label
B	Redesigned nutritional label

3. Experiment management

Researchers can:

View experiments.
Edit experiment details.
Delete experiments.
View participant progress.
Access experiment results.
Acceptance criteria
Researchers can create an experiment.
Researchers can upload at least two packaging images.
Uploaded designs are visible in the experiment.
Experiments are saved locally.
Module 2: Task Builder

Priority: P0

Researchers need to create tasks that participants must complete.

Default task templates

LabelLens should provide predefined tasks.

Task	Participant instruction
Allergen identification	Find whether the product contains peanuts.
Sugar identification	Find the sugar content per serving.
Serving size	Identify the serving size mentioned on the package.
Ingredient identification	Find the first ingredient listed.
Sodium comparison	Identify which of two products contains less sodium.
Expiry information	Find the best-before date.
Nutrition comparison	Compare the protein content of two products.

Researchers can also create custom tasks.

Task configuration

Each task should have:

Task title.
Instructions.
Expected answer.
Answer type.
Time limit.
Packaging variant.
Task order.
Answer types
Multiple choice.
Numeric input.
Short text.
Acceptance criteria
Researchers can create and edit tasks.
Tasks can be assigned to packaging variants.
Tasks are displayed correctly to participants.
Responses are automatically recorded.
Module 3: Participant Testing Interface

Priority: P0

This is the most important user-facing interface.

It should be simple and distraction-free.

Step 1: Welcome screen

Display:

Experiment title.
Research description.
Estimated duration.
Camera usage explanation.
Privacy information.

Primary button:

Start Experiment

Step 2: Camera consent

Before activating the camera, explain:

Why the camera is required.
Which physiological measurements are collected.
Whether data is stored.
Whether video is recorded.
How participants can delete their data.

Require explicit consent.

The participant must be able to decline.

Step 3: Camera initialization

Initialize the Presage SmartSpectra SDK.

Display:

Camera preview.
Face positioning guidance.
Lighting guidance.
Signal quality.
SDK initialization status.

Example:

text
Camera status: Connected

Face detected: Yes

Signal quality: Good

Pulse measurement: Initializing

Please remain stationary.


Do not begin the experiment until the required signal-quality conditions are satisfied.

Step 4: Baseline measurement

Collect a baseline physiological measurement before showing the packaging task.

Suggested duration: 30–60 seconds.

Record:

Pulse.
HRV, if available.
Signal confidence.
Measurement timestamps.

This baseline allows researchers to compare subsequent measurements with the participant's own starting values.

Step 5: Packaging interaction

Display the selected packaging image.

Example:

text
Find the amount of sugar
per serving in this product.

[Packaging Image]

Your answer:

[ Enter answer ]

[Submit]


During this period:

Track task start time.
Track task completion time.
Capture participant answers.
Capture live SmartSpectra measurements.
Record timestamps.
Record signal quality.
Step 6: Participant feedback

After each task, ask:

How difficult was it to find this information?

Scale: 1–5.

1 = Very easy
5 = Very difficult

Optional question:

What made this information difficult to find?

This provides qualitative context for interpreting the physiological data.

Step 7: Session completion

Display:

text
Experiment completed.

Thank you for participating.

Your responses have been recorded.

5. SmartSpectra SDK Integration

Priority: P0 — Critical

This is the most important technical component for the competition.

The application must demonstrate actual live Presage measurements.

Signals to integrate
Signal	Priority	Purpose
Pulse rate	P0	Physiological trend analysis
Facial expressions	P0	Expression classification trends
Blinking	P1	Blinking activity
Talking detection	P1	Identify speaking periods
HRV	P1	Longer-window physiological observations
Breathing rate	P2	Optional additional measurement
Recommended implementation

Start with pulse rate and facial-expression measurements.

Add HRV after the basic integration works.

Do not make breathing a core measurement because participants need to remain stationary and avoid talking for reliable measurement.

Measurement architecture
text
             Webcam
                |
                v
        SmartSpectra SDK
                |
                v
        Signal Processing
                |
       +--------+--------+
       |        |        |
       v        v        v
     Pulse   HRV     Expressions
       |        |        |
       +--------+--------+
                |
                v
       Timestamped Signals
                |
                v
        Session Data Engine
                |
       +--------+--------+
       |                 |
       v                 v
  Task Events       Signal Timeline
       |                 |
       +--------+--------+
                |
                v
       Researcher Dashboard

Data points to capture

Each measurement should include:

json
{
  "timestamp": "2026-11-11T10:30:00Z",
  "pulse": 78,
  "hrv": null,
  "expression": "neutral",
  "expression_confidence": 0.91,
  "signal_quality": "good"
}


This is an illustrative data structure. Actual field names must follow the SDK.

Important implementation rules
Never invent measurements when the SDK returns no result.
Store confidence and quality information.
Handle missing measurements.
Use timestamps consistently.
Never interpret physiological changes as definitive emotional states.
Do not store raw camera footage.
Stop measurement when the participant withdraws consent.
Signal quality handling

If signal quality becomes poor:

text
Signal quality is currently low.

Please:
- Face the camera.
- Improve lighting.
- Keep your head stationary.

Measurement will resume when signal quality improves.


The application should distinguish between a missing signal and a genuine zero measurement.

6. Experiment Analytics Dashboard

Priority: P0

This is where LabelLens provides value to researchers.

The dashboard should communicate findings clearly without making unsupported psychological claims.

Dashboard overview

Display:

Total participants.
Completed sessions.
Average task completion time.
Overall answer accuracy.
Average self-reported difficulty.
Signal availability.
Packaging comparison

Example:

Metric	Design A	Design B
Participants	10	10
Average completion time	19 sec	8 sec
Correct responses	65%	92%
Average difficulty	3.8/5	1.9/5
Signal availability	94%	96%

Illustrative data only.

Physiological timeline

Create a timeline showing:

Pulse measurements.
HRV measurements, where available.
Expression classifications.
Task start and completion events.
Signal quality.

Researchers should be able to select a task and inspect its corresponding physiological timeline.

For example:

text
Task: Find allergen information

00:00 - Task started
00:05 - Pulse: 76 BPM
00:10 - Pulse: 79 BPM
00:15 - Pulse: 83 BPM
00:20 - Answer submitted

Completion time: 20 seconds
Answer: Incorrect
Self-reported difficulty: 4/5


These measurements should be presented descriptively.

The application must not conclude that the participant was confused or stressed because their pulse changed.

7. Packaging Comparison Engine

Priority: P1

This is the feature that turns LabelLens from a basic monitoring application into a research product.

Comparison dimensions
Task completion time.
Answer accuracy.
Self-reported difficulty.
Physiological signal availability.
Physiological measurements relative to baseline.
Comparison report

Researchers should be able to answer:

Which design allowed participants to find information faster?
Which design produced more correct answers?
Which design received better difficulty ratings?
Which tasks caused the most errors?
Were physiological measurements available throughout the experiment?
Statistical considerations

For the MVP, provide descriptive statistics:

Mean.
Median.
Standard deviation.
Percentage.
Participant-level comparisons.

Do not claim statistical significance without an appropriate statistical test and adequate experimental design.

Randomisation

Randomise packaging presentation order where possible.

For example:

Participant 1: A → B

Participant 2: B → A

This reduces potential order effects.

8. AI Research Assistant

Priority: P2 — Optional

AI should support researchers rather than become the central product.

Features

1. Automatic report generation

Generate a summary of the experiment.

Example:

"Packaging Design B had a shorter median task completion time and a higher answer accuracy than Design A. Participants also reported lower difficulty when locating allergen information."

2. Research observations

AI can identify:

Tasks with high error rates.
Packaging sections associated with longer completion times.
Differences between self-reported difficulty and task performance.
Missing physiological measurements.

3. Design recommendations

Example:

"Consider increasing the visual prominence of allergen declarations and improving the spacing around nutritional information."

Recommendations should be based on observed task performance, not inferred emotions.

AI implementation

Use Gemini API.

Send only anonymised, aggregated experiment data.

Do not send raw video or identifiable participant information.

9. UI/UX Requirements

The application should feel like a professional research tool, not a generic dashboard.

Design direction

Visual identity: Scientific minimalism.

Suggested colour palette:

Element	Colour
Background	#F8FAFC
Primary	#172554
Accent	#2563EB
Success	#16A34A
Warning	#D97706
Text	#0F172A
Borders	#E2E8F0
Typography
Inter for primary typography.
Medium font weights.
Clear numerical hierarchy.
Main navigation
text
LabelLens
│
├── Overview
│
├── Experiments
│   ├── All Experiments
│   ├── Create Experiment
│   └── Experiment Details
│
├── Participants
│
├── Analytics
│
└── Settings

Important screens
Landing page.
Researcher dashboard.
Experiment creation.
Packaging upload.
Task builder.
Participant welcome.
Consent screen.
Camera calibration.
Baseline measurement.
Participant testing.
Feedback screen.
Session completion.
Experiment analytics.
Packaging comparison.
Physiological timeline.
10. Technical Architecture
Recommended stack
Layer	Technology
Desktop application	Electron
Frontend	React
Language	TypeScript
Styling	Tailwind CSS
Components	shadcn/ui
Human sensing	Presage SmartSpectra Node.js SDK
Charts	Recharts
Database	SQLite
ORM	Prisma
AI	Gemini API
PDF reports	jsPDF
Packaging	Electron Builder
Why Electron?

Presage provides a Node.js/Electron starting point.

Electron allows us to integrate the SDK through its Node.js runtime and provide a dedicated desktop experience.

Do not assume SmartSpectra can run directly inside a normal browser environment.

Application architecture
text
LabelLens
│
├── Electron Main Process
│   ├── SDK Manager
│   ├── Camera Permission
│   ├── Signal Processor
│   └── Database Manager
│
├── React Renderer
│   ├── Research Dashboard
│   ├── Experiment Builder
│   ├── Participant Interface
│   └── Analytics
│
├── SQLite
│   ├── Experiments
│   ├── Packaging
│   ├── Tasks
│   ├── Participants
│   ├── Sessions
│   ├── Responses
│   └── Measurements
│
└── External Services
    └── Gemini API (Optional)

Suggested project structure
text
labellens/
│
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   └── services/
│       ├── smartspectra.ts
│       ├── camera.ts
│       └── database.ts
│
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── experiments/
│   │   ├── participant/
│   │   └── analytics/
│   │
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── prisma/
│   └── schema.prisma
│
├── public/
│
└── package.json

11. Database Design

The following entities are required.

Experiments
Field	Type
id	UUID
name	String
description	String
status	String
created_at	DateTime
Packaging
Field	Type
id	UUID
experiment_id	UUID
variant_name	String
image_path	String
Tasks
Field	Type
id	UUID
experiment_id	UUID
packaging_id	UUID
title	String
instruction	String
expected_answer	String
answer_type	String
Participants
Field	Type
id	UUID
experiment_id	UUID
anonymous_code	String
consent_given	Boolean
Sessions
Field	Type
id	UUID
participant_id	UUID
start_time	DateTime
end_time	DateTime
status	String
Responses
Field	Type
id	UUID
session_id	UUID
task_id	UUID
answer	String
is_correct	Boolean
completion_time	Integer
difficulty_rating	Integer
Measurements
Field	Type
id	UUID
session_id	UUID
timestamp	DateTime
pulse	Float
hrv	Float
expression	String
confidence	Float
signal_quality	String

Actual measurement fields should be adapted to the SDK's returned data structures.

12. Privacy and Responsible Data Handling

Priority: P0 — Mandatory for competition submission

This section is especially important because the competition explicitly requires a consent and data-handling disclosure.

Camera consent
Camera access must be explicitly requested.
Participants must understand why it is needed.
Participants can decline.
Participants can stop measurement at any time.
Data collection

Collect only information required for the experiment.

The MVP should collect:

Physiological measurements.
Signal confidence.
Task responses.
Task timing.
Self-reported difficulty.
Video storage

Default behaviour:

No raw video recording.
No video uploads.
No facial image storage.
Data storage
SQLite local database.
Local experiment records.
Anonymous participant identifiers.
Optional deletion of individual sessions.
AI processing
AI summaries are optional.
Only aggregated, anonymised information is sent.
No raw camera footage is sent.
SDK telemetry

Review Presage's telemetry documentation and configure telemetry according to the SDK's supported privacy settings.

Disclose any remaining telemetry or network communication accurately.

Medical disclaimer

LabelLens is not a medical device.

It does not diagnose, predict or treat any medical or psychological condition.

Physiological measurements are presented as observational research data, not definitive indicators of emotional state, confusion or preference.

13. MVP Scope

The deadline is November 22. We should be strict about scope.

Must have — P0
Feature	Priority
Electron application	P0
SmartSpectra integration	P0
Live pulse measurement	P0
Facial-expression measurements	P0
Researcher dashboard	P0
Experiment creation	P0
Packaging upload	P0
Task builder	P0
Participant consent	P0
Camera calibration	P0
Baseline measurement	P0
Task completion tracking	P0
Participant feedback	P0
Analytics dashboard	P0
Physiological timeline	P0
Data deletion	P0
Should have — P1
HRV integration.
Packaging randomisation.
PDF export.
Participant comparison.
More advanced analytics.
Could have — P2
AI-generated reports.
Custom research templates.
Multiple researcher accounts.
Cloud synchronisation.
Collaborative experiments.
Explicitly out of scope

For this competition, do not build:

Full SaaS authentication.
Subscription management.
Payment integration.
Mobile applications.
Advanced machine learning models.
Automatic emotion detection.
Automatic packaging redesign.
Medical or psychological assessments.
14. Success Metrics

We need to demonstrate that the application actually works.

Technical metrics
Metric	Target
SDK initialization	Successful
Live pulse readings	Successfully displayed
Signal confidence	Displayed
Measurement timestamps	Recorded
Task completion events	Recorded
Missing signal handling	Implemented
Camera consent	Mandatory
Raw video storage	None by default
Product metrics

For a demonstration experiment:

At least 5 participants.
At least 2 packaging variants.
At least 5 testing tasks.
At least 90% task-event recording success.
At least 1 complete packaging comparison report.

These are internal demonstration targets, not claims of scientific validity.

15. Development Roadmap: November 11–22

This is the most important section for execution.

Date	Work	Expected outcome
Nov 11	Read SDK documentation and configure development environment	SDK environment ready
Nov 12	Integrate SmartSpectra	Live camera measurements
Nov 13	Build Electron + React foundation	Application shell
Nov 14	Build researcher dashboard	Dashboard functional
Nov 15	Experiment creation and packaging upload	Experiment management
Nov 16	Task builder	Research task configuration
Nov 17	Participant interface and consent	Participant workflow
Nov 18	Integrate measurement capture with task events	Complete testing session
Nov 19	Build analytics dashboard	Experiment insights
Nov 20	Comparison engine and privacy controls	MVP complete
Nov 21	Testing, demo recording and DEV article	Submission ready
Nov 22	Final verification and submission	Competition entry

Critical dependency: Do not spend two days designing the dashboard before confirming that SmartSpectra works in your Electron environment.

SDK integration is the biggest technical risk.

16. Competition Submission Strategy

The submission should not look like a college project.

It should look like a functional research product.

Recommended demo video (2–3 minutes)

0:00–0:20 — Problem

Show two different food packaging designs.

Explain why researchers need to understand how consumers interact with nutritional information.

0:20–0:45 — Researcher dashboard

Create an experiment and upload packaging variants.

0:45–1:10 — SmartSpectra integration

Show the camera permission screen and live physiological measurements.

This is essential. Judges must be able to verify actual SDK usage.

1:10–1:45 — Participant experience

Complete an allergen identification task.

Show task timing, answer submission and participant feedback.

1:45–2:20 — Analytics

Show packaging comparisons and physiological timelines.

2:20–2:40 — Privacy

Explain consent, local data storage and the absence of raw video recording.

DEV article structure
Introduction.
The problem with conventional packaging research.
Introducing LabelLens.
How SmartSpectra powers the application.
Technical architecture.
Product demonstration.
Privacy and responsible sensing.
Challenges during development.
Future possibilities.
GitHub repository and demo video.

Required tag: #presagechallenge

17. Key Risks and Mitigation
Risk	Impact	Mitigation
SDK integration difficulties	Very high	Test SDK on day one
Poor camera signal	High	Calibration and quality checks
Insufficient participants	Medium	Conduct a small controlled demonstration
Inconsistent measurements	High	Store confidence and missing values
Misinterpreting physiological signals	Very high	Use descriptive, non-diagnostic analytics
Development time	High	Avoid unnecessary features
AI API failures	Low	Make AI optional
18. What Makes LabelLens Different?

The central differentiator is not the use of a webcam.

It is the combination of three research dimensions:

Dimension	Information
Behavioural	What did the participant do?
Self-reported	What did the participant say?
Physiological	What measurements were observed?

Traditional usability testing primarily focuses on the first two.

LabelLens introduces the third as an additional source of information.

This creates opportunities for researchers to investigate questions that would otherwise require separate measurement equipment and experimental workflows.

It does not establish that physiological measurements reveal confusion, attention or consumer preference. Those relationships would need to be validated through proper research.

19. Final Product Positioning
LabelLens

Understand packaging beyond what consumers say.

LabelLens helps food scientists, packaging designers and consumer researchers evaluate food packaging through structured usability experiments, participant feedback and contactless physiological measurements.

Powered by Presage SmartSpectra.

My recommendation for the actual build

There is one scope decision I would make before starting:

Build LabelLens as a desktop research application, not a cloud SaaS platform.

Reasons:

Presage provides a Node.js/Electron starting point.
Camera and SDK integration can be managed in one environment.
Local storage makes privacy easier to implement.
You avoid spending time building backend infrastructure.
You can deliver a complete working demonstration within the competition timeline.
Three things to do first
Clone the official SmartSpectra GitHub repository.
Get a live pulse measurement working using the official Electron starting point.
Build one complete experiment: upload two nutritional labels, ask participants to find sugar content, record their answers and display the results.

Do not build the entire PRD immediately. First prove the SDK integration and one complete research workflow. That is the foundation of the submission.
