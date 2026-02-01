# SongsProject — iTunes Search (Angular 19)

Production-oriented Angular 19 (Standalone) application for searching songs and albums using the iTunes Search API.

The project focuses on clean architecture, deterministic state management with Angular Signals, resilient UI state transitions, and scalable client-side pagination using Infinite Scroll.

## Project Goal

The purpose of this project is to demonstrate:

- Feature-based architecture
- Explicit state management without external store libraries
- Controlled async flows (debounce and cancellation)
- Robust infinite scrolling logic
- Clear separation between UI state and business logic
- Production-ready error handling patterns

## Technology Stack

- Angular 19 (Standalone Components)
- TypeScript (Strict Mode)
- Angular Signals (signal, computed, effect)
- RxJS (debounceTime, switchMap, catchError)
- IntersectionObserver API
- iTunes Search API
- JSONP (CORS workaround)
- Tailwind CSS
- RTL Hebrew UI

## Architecture

The application follows a feature-driven modular structure:

- core  
  Domain models and shared services

- shared  
  Reusable UI components and directives

- features  
  Feature-level logic (Search / Details)

## Architectural Principles

**Single Responsibility:**  
Business logic resides inside the Feature Store, not components.

**Unidirectional Data Flow:**  
User input → Store → API → Store → ViewModel → UI.

**Separation of Concerns:**  
Components are presentation-focused.  
The Store owns state and side-effects.

**Explicit UI State Modeling:**  
Loading, empty, ready, and error states are treated as explicit states.

## State Management Strategy

Instead of using NgRx or a global state solution, this project uses a Feature Store built with Angular Signals.

Reasons for using Signals:

- Predictable reactive updates
- No external dependencies
- Fine-grained reactivity
- Reduced boilerplate compared to traditional state libraries

### SearchStore Responsibilities

- Query state
- Search type
- Offset pagination
- Incremental loading
- Sorting
- Error channels
- UI state computation

Components do not subscribe manually.  
A computed ViewModel exposes the minimal reactive surface to the template.

## Async Flow and Request Control

The search flow implements:

- Debounced user input
- Cancellation of stale requests using switchMap
- Mapping to a unified domain model (MusicItem)
- Controlled state transitions
- Explicit offset progression for pagination

This ensures:

- No race conditions
- No stale data overwriting fresh results
- Deterministic UI behavior

## Infinite Scroll Engineering

Infinite Scroll is implemented via a custom directive using IntersectionObserver.

Engineering safeguards include:

- Guard against duplicate requests
- Offset progression only after successful append
- Separate loading and loadingMore states
- No state reset during incremental loading
- Automatic stop when API returns fewer than pageSize items

Offset sequence:  
0 → 25 → 50 → 75 → ...

## Album Filtering Strategy

The iTunes API inconsistently labels Singles and EPs as Albums.

To ensure real album integrity, filtering logic applies:

- wrapperType equals collection
- collectionType equals Album
- trackCount greater than or equal to 6

This is a data-quality decision to avoid Singles and EPs appearing as full albums.

## Error Handling Design

The application distinguishes between:

- Initial Search Errors → Full error state
- Incremental Load Errors → Secondary non-destructive message

Incremental failures never clear existing results.

## UI State Modeling

Explicit UI states:

- idle
- loading
- ready
- empty
- error

Each state is derived via computed Signals rather than multiple ad-hoc booleans.

## Deployment

Production build command:

```bash
ng build --configuration production
```

The application builds into a static bundle under:

```
dist
```

It can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- Any static hosting provider

No backend is required.

## Repository

Public Repository:  
https://github.com/rivka7171/music-search-app.git    

 
## Live Demo

https://music-search-app-rivka-nwwahgzfq-rivka-breuers-projects.vercel.app/

Demonstrates:

- Real-time search
- Infinite Scroll
- Sorting
- Album filtering
- Details page
- Hebrew RTL layout

## Production Readiness Highlights

- Strict TypeScript configuration
- Feature-based modular architecture
- Deterministic state transitions
- Cancelable async flows
- Guarded infinite scroll
- Clean separation between UI and domain logic
- Defensive error handling
- No unmanaged subscriptions

## Future Improvements

- Scroll restoration when returning from details
- Query result caching layer
- Virtual scrolling for large result sets
- Optional backend proxy instead of JSONP
- Unit tests for Store and Services

## Technical Trade-offs

JSONP was chosen due to public API CORS restrictions.  
Signals Store chosen over NgRx to reduce complexity.  
Client-only architecture with no server-side caching.

## Conclusion

This project demonstrates production-grade Angular architecture, disciplined state management, and careful UI-state modeling without external complexity.

The focus is clarity, determinism, and maintainability rather than over-engineering.
