# replit.md

## Overview

QuickShare is a temporary file and content sharing application built with a modern full-stack architecture. The application allows users to share text, URLs, and files with customizable expiration times, password protection, and one-time viewing options. It features real-time chat functionality for shared content and provides URL metadata previews for enhanced user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Language**: TypeScript for full-stack type safety
- **Real-time Communication**: WebSocket server for live chat functionality
- **File Handling**: Multer for multipart file uploads with memory storage
- **Security**: bcrypt for password hashing, rate limiting for API protection
- **Session Management**: Express sessions with PostgreSQL session store

### Data Storage Solutions
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Database Provider**: Neon Database for serverless PostgreSQL hosting
- **Schema Design**: 
  - `shares` table for storing shared content with metadata
  - `chat_messages` table for real-time messaging
  - `chat_sessions` table for managing active chat sessions
- **Fallback Storage**: In-memory storage implementation for development/testing

### Real-time Features
- **WebSocket Integration**: Custom WebSocket manager for reliable connections
- **Chat System**: Real-time messaging tied to shared content
- **Connection Management**: Automatic reconnection handling and user presence tracking
- **Message Persistence**: Chat messages stored in database for session continuity

### Security and Rate Limiting
- **Password Protection**: Optional bcrypt-hashed passwords for sensitive shares
- **Rate Limiting**: Express rate limiter to prevent abuse (10 requests per 15 minutes for share creation)
- **Input Validation**: Zod schemas for request validation and type safety
- **File Upload Limits**: 2MB maximum file size restriction
- **Expiration Management**: Automatic cleanup of expired content

### Development and Deployment
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend hot reload
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Environment Configuration**: Environment-based configuration for database connections
- **Database Migrations**: Drizzle Kit for schema migrations and database management

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connect PG Simple**: PostgreSQL session store for Express sessions

### UI and Styling
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with design tokens
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Replit Integration**: Development environment support with error overlays
- **Google Fonts**: External font loading for typography
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Third-party Services
- **URL Metadata Fetching**: Server-side URL preview generation for shared links
- **WebSocket Protocol**: Standard WebSocket implementation for real-time features
- **Multer**: File upload middleware for handling multipart/form-data

### Security and Validation
- **bcrypt**: Industry-standard password hashing
- **Zod**: TypeScript-first schema validation
- **Express Rate Limit**: Request rate limiting middleware
- **Crypto**: Node.js built-in module for secure random code generation