# Group Tracker App

## Overview

This is a real-time group tracking application built with React and Express. It allows users to create groups, join them using codes, share locations, send messages, and ping other members. The app is designed for coordinating group activities and maintaining awareness of group member locations and status.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and building
- **Styling**: Tailwind CSS with custom design tokens

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM (migrated from in-memory storage)
- **Real-time Communication**: WebSockets for live updates
- **Session Management**: PostgreSQL-backed sessions

### Key Components

#### Database Schema (PostgreSQL)
- **Groups**: Store group information with unique codes and expiration times
- **Members**: Track group members with location data, status, and preferences
- **Messages**: Store chat messages and quick messages
- **Pings**: Track ping notifications between members

#### Real-time Features
- **WebSocket Server**: Handles real-time updates for location sharing, messages, and pings
- **Location Tracking**: Browser geolocation API integration
- **Live Updates**: Member status changes broadcast to all group members

#### UI Components
- **Map Integration**: Leaflet maps for location visualization
- **Chat System**: Real-time messaging with quick action buttons
- **Member Management**: Live member list with status indicators
- **Settings Panel**: Location sharing and notification preferences

## Data Flow

1. **Group Creation**: User creates a group, receives a unique code
2. **Member Joining**: Users join groups using codes, become active members
3. **Location Sharing**: Members share location data, updated in real-time
4. **Communication**: Messages and pings sent through WebSocket connections
5. **Status Updates**: Member status changes (active/paused/offline) broadcast to group

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **express**: Web server framework
- **ws**: WebSocket server implementation
- **leaflet**: Map visualization library

### UI Libraries
- **@radix-ui/***: Comprehensive UI component library
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development
- Uses Vite dev server with HMR (Hot Module Replacement)
- Express server runs with tsx for TypeScript execution
- WebSocket server integrated with HTTP server

### Production Build
- Frontend built with Vite to static assets
- Backend bundled with esbuild as ESM module
- Database migrations handled with Drizzle Kit
- Static assets served by Express in production

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific configuration for development tools

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 04, 2025. Initial setup
- July 04, 2025. Migrated from in-memory storage to PostgreSQL database using Drizzle ORM for persistent data storage