# Amelia's Beauty Skin - Internal Management System

This is a professional internal management application designed for Amelia's Beauty Skin. It centralizes the administration of service schedules, patient records, and specialized clinical forms.

## Project Description

The system provides a comprehensive solution for beauty salon operations, allowing staff to manage diverse services such as nail care, massage, eyelash treatments, and laser hair removal. It features a multi-resource calendar that organizes appointments by specialist, ensuring that each team member is assigned tasks according to their specific training and availability.

The application is built as a modern web stack that can be run natively as a Desktop Application using Electron.

## Core Features

- **Multi-Resource Agenda:** Daily and weekly views to manage appointments across different specialists.
- **Patient Management:** A centralized database for contact information, age, and basic medical history.
- **Service Catalog:** Configurable services with estimated durations and custom color-coding for the agenda.
- **Specialized Clinical Records:** Dedicated forms for laser hair removal, including an automatic Fitzpatrick Skin Type Scale calculator.
- **Staff and Specialties:** Management of employees and their specific areas of expertise to prevent improper service assignment.
- **Conflict Detection:** Visual alerts and confirmations when scheduling overlapping appointments for the same specialist.
- **PDF Export:** Automatic generation of reservation details and clinical records into downloadable PDF documents.

## Technology Stack

### Frontend

- **React 19** with **TypeScript**.
- **Vite** for fast builds and HMR.
- **Material UI (MUI)** (DataGrid, DatePickers, etc.) for a robust and accessible interface.
- **TanStack Query** for state management and API synchronization.
- **React Big Calendar** for scheduling visualization.
- **React Hook Form & Zod** for form state management and validation.
- **SweetAlert2** for custom alerts and dialogs.
- **jsPDF** for generating clinical and reservation PDFs.

### Backend & Desktop Wrapper

- **Node.js** with **Express** and **TypeScript**.
- **Electron** to wrap the server and frontend into a standalone desktop application.
- **Better-SQLite3** via **Knex.js** for a high-performance, portable local database.
- **Winston and Morgan** for logging and HTTP request monitoring.

## Installation and Setup

### Prerequisites

- Node.js installed on your local machine.

### 1. Frontend Configuration

Navigate to the `frontend` directory and install dependencies:

```bash
cd frontend
npm install
```

### 2. Backend Configuration

Navigate to the `backend` directory, install dependencies, and setup the environment:

```bash
cd ../backend
npm install
```

Create a `.env` file in the backend directory:

```bash
PORT=3000
DB_PATH=../db/amelias.db
```

## Running the Application

**Development Mode (Web)**
Run the backend and frontend separately to enjoy Hot Module Replacement (HMR).

1.- Start the backend server:

```bash
cd backend
npm run dev
```

2.- Start the frontend application:

```bash
cd frontend
npm run dev
```

**Desktop Mode (Electron)**
To run the application as a desktop app during development:

```bash
cd backend
npm run electron:start
```

**Packaging for Production (Windows)**
To build the executable `.exe` file for Windows:

```bash
cd frontend
npm run build
cd ../backend
npm run electron:pack
```

The packaged application will be available in the `backend/release` directory.

## Data Management

The application uses a local SQLite database file (`amelias.db`).

- In development, it is located in the `db/` directory.
- In production (packaged Electron app), the database is securely copied and maintained inside the user's `AppData` directory to persist data across application updates.
  To create manual backups, simply copy the `amelias.db` file to a secure location.

## License

Copyright (c) 2026 Amelia's Beauty Skin. All rights reserved.

Proprietary License - All Rights Reserved. Strict prohibition of copying, distribution, modification, or commercial use without prior written consent.
