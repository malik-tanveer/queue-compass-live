# Queue Compass Live

Build a fully functional, modern SaaS web application called **QueueFlow** — a smart digital queue and appointment management platform for businesses.

## Core Concept

QueueFlow helps businesses eliminate physical waiting lines. Customers can join a digital queue from their phone and track their position in real time, while business owners manage customers from a powerful dashboard.

The product should feel like a real startup product, not a basic admin dashboard.

## User Experience

There are two main experiences:

### 1. Business Dashboard

Create a professional dashboard where a business owner can:

- View the live queue in real time
- See the currently serving customer
- Click **Call Next** to move to the next customer
- Mark customers as completed or skipped
- Add and manage multiple services
- Set estimated service duration
- View today's total customers and completed customers
- View average waiting time
- Pause or reopen the queue

Each customer card should show:

- Token number
- Customer name
- Selected service
- Queue status
- Estimated waiting time

### 2. Customer Queue Experience

Create a clean mobile-first experience where a customer can:

- Scan or open a business queue link
- Select a service
- Enter their name and phone number
- Receive a digital token
- See their live queue position
- See how many people are ahead of them
- See an estimated waiting time
- Get a beautiful confirmation screen

The customer queue screen should automatically update when the business moves to the next customer.

## Main Pages

### Landing Page

Create a modern SaaS landing page with:

- Strong hero section
- Headline: **"Waiting lines belong in the past."**
- Short explanation of the product
- Interactive product preview
- Features section
- How it works section
- CTA to create a queue

### Dashboard

Include:

- Sidebar navigation
- Live Queue
- Services
- Analytics
- Settings

The main dashboard should prominently display the current queue status and make the **Call Next** action easy to access.

### Public Queue Page

Design this primarily for mobile users.

Show:

- Business logo and name
- Queue status
- Service selection
- Join queue form

### My Token Page

After joining, show a visually appealing live ticket with:

- Large token number
- Current position
- Number of people ahead
- Estimated waiting time
- Live status indicator

## Demo Data

Create realistic demo data for a fictional business called **NovaCare Clinic**.

Include services such as:

- General Consultation — 15 min
- Follow-up Consultation — 10 min
- Lab Test — 5 min

Populate the queue with several sample customers in different statuses so the application looks alive immediately.

## Design Direction

Use a premium, modern SaaS aesthetic.

- Dark navy and near-black primary background
- Clean white text
- Subtle blue accents
- Glassmorphism only where it improves the interface
- Smooth micro-interactions and transitions
- Rounded cards and clean spacing
- Lucide icons
- Responsive design with special attention to mobile

Avoid excessive gradients, excessive colors, or a generic template appearance.

## Important Product Details

Make the application feel interactive and functional.

- Queue positions should update dynamically
- Calling the next customer should update the queue state
- Estimated waiting time should change based on the queue
- Include empty states where appropriate
- Include loading and success feedback
- Make all navigation and buttons functional

Build this as a polished product prototype with a realistic user flow and production-quality UI.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://queue-compass-live.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/148d2283-f224-4b1c-8ed0-53dcccf765ef).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
