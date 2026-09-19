# QueueFlow — Smart Digital Queue Management

> **Waiting lines belong in the past.**

QueueFlow is a modern digital queue and appointment management platform designed to help businesses eliminate physical waiting lines.

Customers can join a queue directly from their phone, receive a digital token, and track their position and estimated waiting time in real time. Meanwhile, businesses can manage their entire queue from one centralized dashboard.

![QueueFlow Preview](public/preview.png)

## Live Demo

🚀 **Live Application:** https://queue-compass-live.lovable.app

## Features

### 🏢 Business Dashboard

QueueFlow provides businesses with a powerful dashboard to manage their daily customer flow.

- View the live queue in real time
- See the customer currently being served
- Call the next customer with one action
- Mark customers as completed or skipped
- Pause or reopen the queue
- Manage multiple services
- Configure estimated service durations
- Monitor daily queue statistics

### 📱 Customer Experience

Customers can join and track the queue directly from their mobile device.

- Select a service
- Enter customer details
- Receive a digital token
- Track live queue position
- See the number of people ahead
- View estimated waiting time
- Receive real-time queue updates

### 🎟️ Digital Token

After joining the queue, customers receive a live digital ticket showing:

- Token number
- Current queue position
- Number of people ahead
- Estimated waiting time
- Live queue status

## Demo Business

The application includes realistic demo data for **NovaCare Clinic**.

### Available Services

| Service | Estimated Duration |
|---------|-------------------|
| General Consultation | 15 minutes |
| Follow-up Consultation | 10 minutes |
| Lab Test | 5 minutes |

The demo queue includes customers in different states to create a realistic, interactive experience.

## How It Works

```text
Customer Opens Queue Link
          ↓
Selects a Service
          ↓
Enters Name & Phone Number
          ↓
Receives Digital Token
          ↓
Tracks Position Live
          ↓
Business Calls Next Customer
          ↓
Queue Updates Automatically
```

## Product Pages

### Landing Page

A modern SaaS landing page introducing QueueFlow and its core benefits.

### Business Dashboard

A centralized command center for managing customers, services, queue activity, and business settings.

### Public Queue

A mobile-first experience where customers can select a service and join the queue.

### My Token

A live digital ticket where customers can track their queue position and estimated waiting time.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Lovable

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/malik-tanveer/queue-compass-live.git
```

Move into the project directory:

```bash
cd queue-compass-live
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in your terminal to view the application.

## Design System

QueueFlow follows a premium SaaS design direction:

- Dark navy and near-black backgrounds
- Clean white typography
- Subtle blue accents
- Rounded interface elements
- Smooth micro-interactions
- Responsive layouts
- Mobile-first customer experience

The goal is to make QueueFlow feel like a modern startup product rather than a traditional admin dashboard.

## Future Improvements

- Real-time backend integration
- Customer notifications
- QR code queue access
- Multiple business locations
- Appointment scheduling
- Advanced analytics
- Live display mode for waiting areas

## Project Structure

```text
queue-compass-live/
│
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── lib/
│
├── package.json
├── vite.config.ts
└── README.md
```

## Author

**Tanveer Malik**

- GitHub: https://github.com/malik-tanveer
- Portfolio: https://tanveer-49ddc.web.app
- LinkedIn: https://www.linkedin.com/in/malik-tanveer-8bbaa13b2/

---

Built as a modern SaaS product prototype to demonstrate digital queue management, interactive user flows, and responsive web application design.