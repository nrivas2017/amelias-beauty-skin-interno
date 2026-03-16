# Amelia's Beauty Skin - Internal Management System

This is a professional internal management application designed for Amelia's Beauty Skin. It centralizes the administration of service schedules, patient records, and specialized clinical forms.

## Project Description

The system provides a comprehensive solution for beauty salon operations, allowing staff to manage diverse services such as nail care, massage, eyelash treatments, and laser hair removal. It features a multi-resource calendar that organizes appointments by specialist, ensuring that each team member is assigned tasks according to their specific training and availability.

## Core Features

- Multi-Resource Agenda: Daily and weekly views to manage appointments across different specialists.
- Patient Management: A centralized database for contact information, age, and basic medical history.
- Service Catalog: Configurable services with estimated durations and custom color-coding for the agenda.
- Specialized Clinical Records: Dedicated forms for laser hair removal, including an automatic Fitzpatrick Skin Type Scale calculator.
- Staff and Specialties: Management of employees and their specific areas of expertise to prevent improper service assignment.
- Conflict Detection: Visual alerts and confirmations when scheduling overlapping appointments for the same specialist.

## Technology Stack

### Frontend

- React 19 with TypeScript.
- Vite for builds and HMR.
- Tailwind CSS and Shadcn UI for the interface.
- TanStack Query for state management and API synchronization.
- React Big Calendar for scheduling visualization.

### Backend

- Node.js with Express and TypeScript.
- SQLite3 via Knex.js for a lightweight, portable local database.
- Winston and Morgan for logging and HTTP request monitoring.

## Installation and Setup

1. Prerequisites: Install Node.js on the local machine.
2. Clone the Repository: Obtain the source code folder.
3. Backend Configuration:
   - Navigate to the `backend` directory.
   - Run `npm install`.
   - Create a `.env` file and define `PORT` and `DB_PATH`.
4. Frontend Configuration:
   - Navigate to the `frontend` directory.
   - Run `npm install`.
5. Running the Application:
   - Start the backend server using `npm run dev`.
   - Start the frontend application using `npm run dev`.

## Data Management

The application uses a local SQLite database file located in the `db/` directory. For internal backups, simply copy the `amelias.db` file to a secure location.

## License

Copyright (c) 2026 Amelia's Beauty Skin. All rights reserved.
