# AI Exam Monitoring System --- Product Requirements Document (PRD)

## 1. Project Overview

### Project Name

AI Exam Monitoring System

### Project Type

AI-powered online examination and monitoring web application.

### Primary Goal

Build a deployable web application that allows students to take online
exams while computer-vision models running on the student's device
monitor the webcam feed for predefined suspicious activities. The system
records monitoring events and provides an administrator/examiner
dashboard for reviewing exam attempts and violations.

### Internship Context

The internship defines an Online Exam Monitoring project as a platform
that uses pre-trained convolutional neural-network/computer-vision
models to detect abnormal activities or malpractice during online
examinations. The internship notes state that an end-to-end
implementation is preferred, while a baseline model is acceptable. The
project may be completed individually or in a team of up to three
members.

------------------------------------------------------------------------

# 2. Product Vision

Create a realistic, polished prototype of an online examination platform
with integrated AI-assisted proctoring.

The product should demonstrate:

1.  A complete student examination workflow.
2.  Webcam-based monitoring.
3.  Real-time computer-vision analysis.
4.  Detection of selected suspicious conditions.
5.  A violation/event scoring mechanism.
6.  Persistent exam and monitoring data.
7.  An administrator dashboard.
8.  A production-style deployment architecture using free/low-cost
    services.

The application is a prototype for educational/internship demonstration.
It must not claim that AI detections are perfectly accurate or that a
detected event conclusively proves cheating.

------------------------------------------------------------------------

# 3. Target Users

## 3.1 Student

A student who: - Logs into the platform. - Starts an assigned exam. -
Grants webcam permission. - Takes the exam. - Is monitored during the
examination. - Receives warnings when suspicious conditions are
detected. - Submits the exam.

## 3.2 Admin / Examiner

An examiner who: - Creates exams. - Adds questions. -
Publishes/activates exams. - Views student attempts. - Views monitoring
events. - Reviews suspicious activity. - Views final exam results and
monitoring summaries.

------------------------------------------------------------------------

# 4. Core User Journeys

## 4.1 Student Exam Journey

1.  Student opens application.
2.  Student logs in.
3.  Student sees available exam(s).
4.  Student opens exam instructions.
5.  Student completes a pre-exam system check.
6.  Browser requests webcam permission.
7.  Application verifies that a usable camera stream exists.
8.  Student starts exam.
9.  Timer begins.
10. Exam questions are displayed.
11. Webcam monitoring starts.
12. AI monitoring runs continuously at an optimized sampling rate.
13. Suspicious events are generated when configured conditions are
    detected.
14. Student receives non-disruptive warnings when appropriate.
15. Student completes and submits the exam.
16. Exam answers and monitoring summary are stored.
17. Student sees submission confirmation/result according to exam
    configuration.

## 4.2 Admin Journey

1.  Admin logs in.
2.  Admin sees dashboard.
3.  Admin creates an exam.
4.  Admin adds questions and answers.
5.  Admin publishes the exam.
6.  Students attempt the exam.
7.  Admin views active/completed attempts.
8.  Admin opens a student's monitoring report.
9.  Admin sees:
    -   Total monitoring events.
    -   Event categories.
    -   Event timestamps.
    -   Severity.
    -   Overall monitoring risk score.
10. Admin can review an attempt and make the final judgment manually.

------------------------------------------------------------------------

# 5. Functional Requirements

## 5.1 Authentication

### Student

-   Register/login.
-   Secure password handling.
-   Logout.
-   Role-based access.

### Admin

-   Admin login.
-   Admin-only routes.
-   Admin dashboard access.

### Roles

-   `STUDENT`
-   `ADMIN`

Do not expose admin functionality to student accounts.

------------------------------------------------------------------------

# 6. Student Dashboard

The student dashboard should display:

-   Student name.
-   Available exams.
-   Exam status.
-   Exam duration.
-   Number of questions.
-   Start button.
-   Previously submitted exams.
-   Result/status where applicable.

Example:

``` text
My Exams

------------------------------------------------
Data Structures Test
20 Questions
30 Minutes
Status: Available

[ Start Exam ]
------------------------------------------------
```

------------------------------------------------------------------------

# 7. Exam Creation

Admin should be able to:

-   Create exam.
-   Set title.
-   Set description/instructions.
-   Set duration.
-   Add questions.
-   Add multiple-choice options.
-   Mark correct answer.
-   Set exam availability/status.
-   Edit/delete questions before publishing.
-   Publish/unpublish exam.

For MVP, use MCQ questions.

### Question Model

Each question should support:

-   Question text.
-   Option A.
-   Option B.
-   Option C.
-   Option D.
-   Correct option.
-   Marks.

------------------------------------------------------------------------

# 8. Exam Interface

The student exam page should include:

### Header

-   Exam title.
-   Remaining time.
-   Student name.
-   Monitoring status.

### Main Area

-   Current question.
-   Answer options.
-   Previous/Next buttons.
-   Question navigation.

### Sidebar

-   Question number list.
-   Answered/unanswered status.
-   Submit button.

### Monitoring Panel

A small webcam preview should show that monitoring is active.

Example:

``` text
------------------------------------------------
Exam: Computer Networks        Time: 24:31
------------------------------------------------

Question 7 of 20

What is TCP?

○ A
○ B
○ C
○ D

[ Previous ]                 [ Next ]

                 ┌───────────────┐
                 │   WEBCAM      │
                 │   Monitoring  │
                 └───────────────┘

Monitoring: ● Active
Warnings: 2
------------------------------------------------
```

------------------------------------------------------------------------

# 9. Pre-Exam System Check

Before the exam begins, show a setup screen.

Checks should include:

-   Camera availability.
-   Camera permission.
-   Face detection.
-   Basic lighting/visibility check if practical.
-   Browser support.
-   Monitoring model readiness.

The student should not be allowed to start the monitored exam until the
required checks pass.

Provide useful error messages such as:

-   "Camera permission is required."
-   "No camera detected."
-   "Please position your face inside the camera frame."
-   "AI monitoring model is still loading."

------------------------------------------------------------------------

# 10. AI Monitoring System

## 10.1 Architectural Principle

For the free-deployment MVP, AI inference should run primarily in the
student's browser rather than sending the continuous webcam stream to
the backend.

Preferred flow:

``` text
Student Webcam
      |
      v
Browser
      |
      +--> Computer Vision Model
      |
      v
Suspicious Event Detection
      |
      v
Backend API
      |
      v
PostgreSQL Database
```

Do NOT continuously upload raw webcam video to the server for the MVP.

This reduces: - Server CPU/GPU requirements. - Bandwidth usage. -
Storage requirements. - Privacy exposure. - Free-hosting limitations.

------------------------------------------------------------------------

# 11. AI Detection Features

Implement the following detection capabilities where technically
practical.

## 11.1 Face Presence

Detect whether a face is visible.

Events:

-   `FACE_MISSING`

Trigger when no face is detected for a configurable continuous duration.

Do not create an event for every individual frame.

Example:

``` text
Face missing for 3+ seconds
        ↓
Create one FACE_MISSING event
```

Use cooldown/debouncing to prevent duplicate events.

------------------------------------------------------------------------

## 11.2 Multiple Face Detection

Detect when more than one face is visible.

Event:

-   `MULTIPLE_FACES`

Example:

``` text
1 face  → normal
2+ faces → suspicious event
```

The system should wait for a configurable number of consecutive
detections before generating an event.

------------------------------------------------------------------------

## 11.3 Phone/Object Detection

If the selected browser-compatible object-detection model supports it,
detect a phone/mobile device in the camera frame.

Event:

-   `PHONE_DETECTED`

This should be treated as a suspicious signal rather than automatic
proof of malpractice.

------------------------------------------------------------------------

## 11.4 Looking Away / Head Pose

Where technically feasible, estimate whether the student is repeatedly
looking substantially away from the screen/camera.

Event:

-   `LOOKING_AWAY`

Use a threshold and duration rather than triggering on a single frame.

Example:

``` text
Looking away
    |
    |  < threshold duration
    v
Ignore

Looking away
    |
    |  >= threshold duration
    v
Create event
```

------------------------------------------------------------------------

## 11.5 Person Missing

If the face/person is no longer visible for a longer configurable
duration, create:

-   `PERSON_ABSENT`

This can be separate from short `FACE_MISSING` events.

------------------------------------------------------------------------

# 12. Event Severity

Each monitoring event should have a severity.

Suggested values:

-   `LOW`
-   `MEDIUM`
-   `HIGH`

Suggested initial mapping:

  Event            Severity
  ---------------- ----------
  Looking Away     LOW
  Face Missing     MEDIUM
  Multiple Faces   HIGH
  Phone Detected   HIGH
  Person Absent    HIGH

The mapping must remain configurable.

------------------------------------------------------------------------

# 13. Violation Scoring

Create a simple monitoring risk score.

Example:

``` text
Looking Away      = +1
Face Missing      = +2
Multiple Faces    = +5
Phone Detected    = +5
Person Absent     = +4
```

The score should be configurable rather than hard-coded throughout the
application.

Example interpretation:

``` text
0–4     Normal
5–9     Needs Review
10+     High Suspicion
```

Important:

The score is an AI-generated monitoring indicator. It must NOT
automatically declare a student guilty of cheating.

------------------------------------------------------------------------

# 14. Anti-Spam / Event Debouncing

This is a critical requirement.

The AI model may detect the same condition on many consecutive frames.

Do NOT store:

``` text
10:10:01 Multiple Faces
10:10:02 Multiple Faces
10:10:03 Multiple Faces
10:10:04 Multiple Faces
...
```

Instead:

``` text
10:10:01 → Multiple faces detected
10:10:10 → Condition cleared
```

Store one event with:

-   Start timestamp.
-   End timestamp if available.
-   Duration.
-   Event type.
-   Severity.
-   Confidence score if available.

Implement: - Detection persistence threshold. - Event cooldown. - Event
merging.

------------------------------------------------------------------------

# 15. Confidence Scores

If the selected AI model exposes confidence values, store them.

Example:

``` text
event_type: PHONE_DETECTED
confidence: 0.91
```

Do not display false precision to users.

The UI may display:

``` text
Confidence: High
```

instead of exposing unnecessary decimal values.

------------------------------------------------------------------------

# 16. Monitoring Status

The exam interface should show:

``` text
Monitoring ● Active
```

Possible states:

-   `INITIALIZING`
-   `ACTIVE`
-   `WARNING`
-   `CAMERA_ERROR`
-   `MODEL_ERROR`
-   `PAUSED`
-   `ENDED`

If monitoring fails, the student should receive a clear warning.

The application should decide whether an exam can continue based on
configurable exam policy.

For MVP, do not automatically terminate an exam because of a temporary
camera/model error.

------------------------------------------------------------------------

# 17. Admin Dashboard

Create a polished dashboard.

### Dashboard Summary Cards

``` text
Total Exams
24

Total Attempts
318

Attempts To Review
17

High-Risk Attempts
5
```

### Attempts Table

Columns:

-   Student.
-   Exam.
-   Start time.
-   Submission time.
-   Score.
-   Monitoring score.
-   Status.
-   Review status.

Example:

``` text
Student    Exam        Score   Risk      Status
---------------------------------------------------
Aman       DBMS        82%     Low       Normal
Priya      OS          91%     High      Review
Rahul      Networks    76%     Medium    Review
```

------------------------------------------------------------------------

# 18. Monitoring Report

When admin opens an attempt:

## Student Information

-   Name.
-   Email/ID.
-   Exam.
-   Start time.
-   End time.
-   Score.

## Monitoring Summary

``` text
Monitoring Risk: HIGH

Total Events: 7

Multiple Faces: 2
Phone Detected: 1
Looking Away: 3
Face Missing: 1
```

## Timeline

``` text
10:14:21  Looking Away      LOW
10:18:42  Face Missing     MEDIUM
10:22:13  Multiple Faces   HIGH
10:25:08  Looking Away      LOW
10:31:50  Phone Detected    HIGH
```

Admin should be able to filter by event type and severity.

------------------------------------------------------------------------

# 19. Manual Review

Admin must be able to mark an attempt:

-   `NORMAL`
-   `REVIEWED`
-   `FLAGGED`

Admin may optionally add a review note.

Example:

``` text
Review Status: FLAGGED

Note:
Multiple people were detected during the exam.
```

AI output must remain advisory.

------------------------------------------------------------------------

# 20. Exam Results

After submission:

Store:

-   Student.
-   Exam.
-   Answers.
-   Score.
-   Total marks.
-   Submission time.
-   Monitoring score.
-   Monitoring events.

For MVP, automatically calculate MCQ score.

------------------------------------------------------------------------

# 21. Database Requirements

Use PostgreSQL.

Recommended tables:

## users

``` text
id
name
email
password_hash
role
created_at
```

## exams

``` text
id
title
description
duration_minutes
status
created_by
created_at
updated_at
```

## questions

``` text
id
exam_id
question_text
option_a
option_b
option_c
option_d
correct_option
marks
```

## attempts

``` text
id
exam_id
student_id
started_at
submitted_at
score
monitoring_score
status
review_status
review_note
```

## answers

``` text
id
attempt_id
question_id
selected_option
is_correct
```

## monitoring_events

``` text
id
attempt_id
event_type
severity
confidence
started_at
ended_at
duration_seconds
metadata
```

Use appropriate foreign keys and indexes.

------------------------------------------------------------------------

# 22. Recommended Technology Stack

Use a modern, maintainable stack.

## Frontend

Preferred:

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS

Alternative: - React + Vite

Use whichever produces the most reliable implementation.

## Backend

Preferred:

-   Next.js API routes/server actions OR
-   FastAPI

Do not introduce a separate backend service unless it provides a real
benefit.

For the simplest deployment, prefer a unified Next.js application where
practical.

## Database

-   PostgreSQL
-   Prisma ORM

Use a hosted PostgreSQL provider with a free tier for development/demo
deployment.

## AI / Computer Vision

Use browser-compatible pretrained models.

Possible technologies include:

-   MediaPipe
-   TensorFlow.js
-   ONNX Runtime Web
-   Other suitable pretrained browser-compatible computer-vision models

Select models based on actual browser performance and ease of
deployment.

Do not train a large custom CNN from scratch unless necessary.

------------------------------------------------------------------------

# 23. AI Model Selection Requirements

Before implementing the final model, evaluate:

1.  Browser compatibility.
2.  CPU performance.
3.  Model size.
4.  Detection accuracy.
5.  Licensing.
6.  Ability to detect required objects/conditions.
7.  Ease of deployment.
8.  Whether inference can run without a GPU.

Prioritize a reliable working prototype over unnecessarily complex
models.

------------------------------------------------------------------------

# 24. Privacy Requirements

The application must clearly inform students that:

-   Webcam access is required for monitored exams.
-   The camera is used for AI monitoring.
-   Monitoring events may be stored for exam review.

For the MVP:

-   Do not store continuous webcam video.
-   Do not upload raw camera frames continuously.
-   Store only monitoring events and metadata required for the
    application.
-   Stop webcam access after the exam ends.
-   Do not request unnecessary permissions.

Add a privacy/consent notice before starting the exam.

------------------------------------------------------------------------

# 25. Security Requirements

Implement:

-   Password hashing.
-   Authentication middleware.
-   Role-based authorization.
-   Server-side validation.
-   Input sanitization.
-   Protected admin routes.
-   Protected exam submission endpoints.
-   Rate limiting where practical.
-   Environment variables for secrets.
-   Never expose database credentials to the browser.

Never put: - Database passwords. - JWT secrets. - API secrets.

inside frontend source code.

------------------------------------------------------------------------

# 26. Exam Integrity

The frontend must not be trusted for scoring or security-critical
decisions.

The server should validate:

-   Exam exists.
-   Attempt belongs to the student.
-   Attempt is active.
-   Submitted answers belong to the exam.
-   Submission has not already occurred.

Do not rely solely on a frontend timer.

The backend should calculate/validate elapsed exam duration using server
timestamps.

------------------------------------------------------------------------

# 27. Responsive UI

The application should work on:

-   Desktop.
-   Laptop.

Primary target:

**Desktop/laptop browsers with webcams.**

Mobile support is not required for MVP.

------------------------------------------------------------------------

# 28. UI/UX Requirements

Design should look like a real SaaS application, not a basic college
demo.

Use:

-   Clean dashboard.
-   Consistent typography.
-   Cards.
-   Tables.
-   Status badges.
-   Toast notifications.
-   Loading states.
-   Empty states.
-   Error states.
-   Confirmation dialogs.

Avoid excessive animations.

Prioritize usability and clarity.

------------------------------------------------------------------------

# 29. Required Pages

## Public

-   `/`
-   `/login`

## Student

-   `/student/dashboard`
-   `/student/exams/[examId]`
-   `/student/exams/[examId]/setup`
-   `/student/results/[attemptId]`

## Admin

-   `/admin/dashboard`
-   `/admin/exams`
-   `/admin/exams/new`
-   `/admin/exams/[examId]`
-   `/admin/attempts`
-   `/admin/attempts/[attemptId]`

Route names may be adjusted if the framework requires a different
structure.

------------------------------------------------------------------------

# 30. API Requirements

Create clean API endpoints or server actions for:

### Authentication

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Exams

``` text
GET    /api/exams
POST   /api/exams
GET    /api/exams/:id
PUT    /api/exams/:id
DELETE /api/exams/:id
```

### Questions

``` text
POST   /api/exams/:id/questions
PUT    /api/questions/:id
DELETE /api/questions/:id
```

### Attempts

``` text
POST /api/exams/:id/start
GET  /api/attempts/:id
POST /api/attempts/:id/answers
POST /api/attempts/:id/submit
```

### Monitoring

``` text
POST /api/attempts/:id/monitoring-events
GET  /api/attempts/:id/monitoring-events
```

### Review

``` text
PUT /api/attempts/:id/review
```

If using server actions instead of REST APIs, preserve the same logical
separation.

------------------------------------------------------------------------

# 31. Monitoring Event Payload

Example:

``` json
{
  "eventType": "MULTIPLE_FACES",
  "severity": "HIGH",
  "confidence": 0.94,
  "startedAt": "2026-09-04T12:10:00Z",
  "endedAt": "2026-09-04T12:10:06Z",
  "durationSeconds": 6
}
```

The backend must validate event type and severity instead of blindly
trusting arbitrary client input.

------------------------------------------------------------------------

# 32. Performance Requirements

The AI monitoring loop should not attempt unnecessary full-resolution,
maximum-FPS inference.

Use:

-   Downscaled frames where appropriate.
-   Reasonable inference interval.
-   Model loading only once.
-   Efficient canvas/video processing.
-   Event debouncing.
-   Cleanup when leaving exam page.

The exam UI must remain responsive while AI inference runs.

Target a smooth user experience on a normal modern laptop.

------------------------------------------------------------------------

# 33. Failure Handling

Handle:

### Camera failure

Show:

> Camera unavailable. Please check your browser permissions and camera
> connection.

### Model loading failure

Show:

> AI monitoring could not be initialized. Please retry.

### Network failure

Queue monitoring events locally where practical and retry sending them.

Do not lose the entire exam because a single monitoring-event request
fails.

### Server failure

Student should see a useful message rather than a blank screen.

------------------------------------------------------------------------

# 34. Free Deployment Architecture

The project should be deployable using free-tier services for an
internship/demo workload.

Preferred architecture:

``` text
                 ┌─────────────────────┐
                 │      Student        │
                 │  Browser + Webcam   │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Frontend / Web App  │
                 │      Next.js        │
                 └──────────┬──────────┘
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      Browser AI Models              Backend/API
      MediaPipe/TF.js/etc.                │
             │                             │
             └──────────────┬──────────────┘
                            ▼
                    PostgreSQL DB
```

The architecture must avoid requiring a dedicated GPU server.

------------------------------------------------------------------------

# 35. Environment Variables

Use `.env.local` for local development.

Example:

``` text
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
```

Only variables that genuinely need public exposure may use the
`NEXT_PUBLIC_` prefix.

Provide `.env.example`.

Never commit real secrets.

------------------------------------------------------------------------

# 36. Seed Data

Create a seed script that generates:

### Admin

``` text
Email: admin@example.com
Password: configurable through environment/seeding configuration
```

### Sample Student

``` text
Email: student@example.com
Password: configurable through environment/seeding configuration
```

### Sample Exam

Create a sample 10-question MCQ exam.

Do not hard-code production passwords.

------------------------------------------------------------------------

# 37. Testing Requirements

Implement tests for:

### Authentication

-   Student login.
-   Admin login.
-   Unauthorized admin access.

### Exam

-   Create exam.
-   Add questions.
-   Start exam.
-   Save answers.
-   Submit exam.
-   Prevent duplicate submission.

### Monitoring

-   Create event.
-   Debounce duplicate event.
-   Calculate monitoring score.
-   Display event history.

### Authorization

-   Student cannot access admin pages.
-   Student cannot modify another student's attempt.
-   Admin can view attempts.

------------------------------------------------------------------------

# 38. Acceptance Criteria

The project is considered complete when:

## Authentication

-   Student and admin can log in.
-   Roles are enforced.

## Exam

-   Admin can create and publish an exam.
-   Student can start an exam.
-   Student can answer MCQs.
-   Timer works.
-   Student can submit.
-   Score is calculated.

## AI Monitoring

-   Webcam permission works.
-   AI model loads in the browser.
-   Face presence can be detected.
-   Multiple faces can be detected.
-   At least one additional suspicious activity detector is implemented.
-   Duplicate events are debounced.
-   Events are persisted.

## Dashboard

-   Admin can see exam attempts.
-   Admin can see monitoring scores.
-   Admin can inspect event timelines.
-   Admin can mark attempts as reviewed/flagged.

## Deployment

-   Application works from a public URL.
-   Database is remotely accessible.
-   No local-only dependency is required.
-   Secrets are stored as environment variables.
-   No paid GPU is required for the MVP.

------------------------------------------------------------------------

# 39. MVP Priority

If time becomes limited, implement in this order:

### P0 --- Must Have

1.  Authentication.
2.  Student dashboard.
3.  Admin dashboard.
4.  Exam creation.
5.  MCQ exam.
6.  Timer.
7.  Exam submission.
8.  Webcam access.
9.  Face detection.
10. Multiple-face detection.
11. Monitoring event storage.
12. Monitoring score.
13. Admin monitoring report.
14. Deployment.

### P1 --- Should Have

1.  Phone detection.
2.  Looking-away detection.
3.  Pre-exam system check.
4.  Event timeline.
5.  Review workflow.
6.  Better error handling.
7.  Responsive polished UI.

### P2 --- Nice to Have

1.  Live admin monitoring.
2.  Email notifications.
3.  Advanced analytics.
4.  Exam scheduling.
5.  Question randomization.
6.  Export monitoring report.
7.  Screenshot capture on selected events.
8.  Advanced anti-cheating signals.

Do not allow P2 features to delay completion of P0.

------------------------------------------------------------------------

# 40. Development Strategy

Build incrementally.

## Phase 1 --- Project Setup

-   Initialize application.
-   Configure TypeScript.
-   Configure styling.
-   Configure database.
-   Configure ORM.
-   Create environment variables.
-   Create folder structure.

## Phase 2 --- Authentication

-   User model.
-   Login.
-   Registration if required.
-   Sessions.
-   Roles.
-   Protected routes.

## Phase 3 --- Exam System

-   Exam CRUD.
-   Question CRUD.
-   Student exam listing.
-   Exam interface.
-   Timer.
-   Submission.
-   Scoring.

## Phase 4 --- AI Monitoring

-   Webcam component.
-   Model loading.
-   Face detection.
-   Multiple-face detection.
-   Additional detector.
-   Detection thresholds.
-   Debouncing.
-   Monitoring event API.

## Phase 5 --- Monitoring Dashboard

-   Attempt list.
-   Monitoring summary.
-   Risk score.
-   Event timeline.
-   Review functionality.

## Phase 6 --- Security and Reliability

-   Authorization checks.
-   Server-side validation.
-   Error handling.
-   Database constraints.
-   Rate limiting where appropriate.
-   Cleanup of webcam/model resources.

## Phase 7 --- UI Polish

-   Responsive layouts.
-   Loading states.
-   Empty states.
-   Toasts.
-   Better visual hierarchy.

## Phase 8 --- Deployment

-   Deploy application.
-   Configure database.
-   Configure environment variables.
-   Test production build.
-   Test webcam permissions over HTTPS.
-   Test complete student flow.
-   Test complete admin flow.

------------------------------------------------------------------------

# 41. Code Quality Requirements

Use:

-   TypeScript.
-   Clear component boundaries.
-   Reusable UI components.
-   Reusable API/database utilities.
-   Meaningful names.
-   No unnecessary duplication.
-   Proper error handling.
-   Comments only where they explain non-obvious logic.

Avoid:

-   One giant component.
-   Hard-coded credentials.
-   Hard-coded database IDs.
-   Hard-coded monitoring results.
-   Fake AI detections.
-   Storing unnecessary video data.
-   Excessive dependencies.

------------------------------------------------------------------------

# 42. Important AI Implementation Rule

Do not fake the AI functionality.

If a requested detector cannot reliably run in the browser with the
selected model:

1.  Explain the limitation in code comments/documentation.
2.  Implement the strongest practical detector available.
3.  Keep the architecture extensible for another model later.

The application must distinguish between:

``` text
AI detection
     ↓
Suspicious event
     ↓
Risk indicator
     ↓
Human review
```

It must NOT present:

``` text
AI detection = confirmed cheating
```

------------------------------------------------------------------------

# 43. Deliverables

The final project should include:

1.  Working source code.
2.  Database schema/migrations.
3.  Seed data.
4.  `.env.example`.
5.  README.
6.  Setup instructions.
7.  Deployment instructions.
8.  AI model explanation.
9.  Architecture explanation.
10. Screenshots/demo documentation.
11. Test coverage for critical flows.

------------------------------------------------------------------------

# 44. README Requirements

README must contain:

## Project Overview

Explain what the system does.

## Features

List student, admin and AI monitoring features.

## Tech Stack

List frontend, backend, database and AI technologies.

## Architecture

Explain browser-side AI inference and backend event storage.

## Local Setup

Include:

``` text
git clone ...
npm install
cp .env.example .env.local
npm run dev
```

Adjust commands to the actual framework.

## Database Setup

Explain migrations and seed command.

## Deployment

Explain how to deploy the frontend/backend and connect the production
database.

## Demo Accounts

Provide demo credentials only if safe to include.

## Limitations

Clearly explain: - AI can produce false positives/negatives. - Browser
hardware affects performance. - The system is a prototype. - AI events
should be manually reviewed.

------------------------------------------------------------------------

# 45. Final Product Principle

The finished application should feel like a real online exam platform
with an AI monitoring layer.

The priority is:

**Reliable end-to-end functionality \> unnecessary AI complexity.**

A smaller system that actually works, is deployed publicly, and can be
demonstrated from start to finish is better than a complicated AI system
that only works locally.

------------------------------------------------------------------------

# 46. Instructions to the AI Coding Agent

You are the lead full-stack engineer responsible for implementing this
product.

Before writing code:

1.  Analyze this PRD.
2.  Identify the minimum viable architecture.
3.  Choose technologies that are easy to deploy using free-tier
    services.
4.  Prefer browser-side AI inference to avoid requiring a GPU backend.
5.  Create a clear implementation plan.
6.  Create the project structure.
7.  Implement the application incrementally.

While coding:

-   Do not skip core functionality.
-   Do not replace AI functionality with fake/random detections.
-   Do not hard-code secrets.
-   Do not expose database credentials.
-   Validate data server-side.
-   Enforce authentication and authorization.
-   Keep AI monitoring modular.
-   Keep the UI polished.
-   Keep the application deployable.

When a technical choice is ambiguous, prefer the simplest
production-like solution that satisfies the requirements.

Do not add unnecessary features before all P0 requirements are working.

After implementation:

1.  Run linting.
2.  Run tests.
3.  Run a production build.
4.  Fix build/runtime errors.
5.  Verify database migrations.
6.  Verify seed data.
7.  Verify student flow.
8.  Verify admin flow.
9.  Verify webcam/AI monitoring.
10. Verify monitoring events are persisted.
11. Verify deployment configuration.
12. Update README with exact setup and deployment instructions.

Do not claim that the project is complete until the application builds
successfully and the core flows have been tested.

------------------------------------------------------------------------

# 47. Source Context

The internship meeting notes define two major project choices: AI image
classification and online exam monitoring. The online exam monitoring
option is described as a platform using pre-trained CNN models to detect
abnormal activities or malpractice during online exams. The notes also
state that an end-to-end implementation is preferred, while a baseline
model is acceptable.

This PRD expands that project option into an implementable software
product while keeping the core project concept aligned with the
internship requirement.
