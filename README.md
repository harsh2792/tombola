# Tombola

## Overview
This project implements a Tombola using NestJS. The service generates bingo tickets, verifies ticket claims, and manages a real-time game through WebSockets.

## Features
- **Ticket Generation**: Generates a 3x9 bingo ticket with specific constraints.
- **Ticket Verification**: Verifies ticket claims based on drawn numbers.
- **Real-Time Game Management**: Manages user connections, ticket generation, claims, and number drawing in real-time.

## Setup
Follow these steps to set up and run the application.

### Prerequisites
- Node.js
- npm

### Installation
1. Clone the repository:
   - `git clone https://github.com/harsh2792/tombola.git`
   - `cd tombola`
2. Install dependencies:
   - `npm install`

### Running the Application
1. Start the application:
   - `npm run start`
2. The application will be available at `http://localhost:3000`.

## Testing
This project uses Jest for testing. You can run unit tests, integration tests, and generate a code coverage report.

### Running Tests
- To run all tests: `npm test`
- To run unit tests: `npm run test:unit`
- To run integration tests: `npm run test:integration`

### Generating Code Coverage Report
- To generate a code coverage report: `npm run test:coverage`
- The coverage report will be generated in the `coverage` directory.

img

![Coverage report](images/code-coverage.jpeg "Coverage report image")



## Project Structure
```
.
│
├───html
│       index.html
│       script.js
│       style.css
│
├───src
│   │   app.controller.spec.ts
│   │   app.controller.ts
│   │   app.module.ts
│   │   app.service.ts
│   │   main.ts
│   │
│   ├───game
│   │       game.controller.spec.ts
│   │       game.controller.ts
│   │       game.gateway.spec.ts
│   │       game.gateway.ts
│   │
│   └───ticket
│       │   ticket.controller.spec.ts
│       │   ticket.controller.ts
│       │   ticket.module.ts
│       │   ticket.service.spec.ts
│       │   ticket.service.ts
│       │
│       └───interfaces
│               iTicket.service.ts
│
└───test
        app.e2e-spec.ts
        game.gateway.e2e-spec.ts
        jest-e2e.json
```

## Flow charts

### 1. **Ticket Generation Flowchart**

```mermaid
graph TD
    A[Start] --> B["Initialize ticket array (3x9) with '_'"]
    B --> C["For each row (3 rows)"]
    C --> D[Add 5 unique numbers ensuring constraints]
    D --> E[Sort each column individually in ascending order]
    E --> F[Save ticket for user]
    F --> G[Return generated ticket]
    G --> H[End]
```

### 2. **Ticket Verification Flowchart**

```mermaid
graph TD
    A[Start] --> B[Retrieve ticket for user]
    B --> C[Check claim type and validate ticket numbers against drawn numbers]
    C --> D[If claim is valid]
    D -->|Yes| E[Announce user as winner]
    D -->|No| F[Reject claim]
    E --> G[End]
    F --> G[End]
```

### 3. **WebSocket Event Handling Flowchart**

```mermaid
graph TD
    A["Client connection (WebSocket)"] --> B[Emit list of joined users]
    B --> C["On 'enterUsername' event"]
    C --> D[Generate ticket for user]
    D --> E[Emit 'ticketGenerated' event]
    E --> F[On 'claimTicket' event]
    F --> G[Validate claim using TicketService]
    G --> H[If valid]
    H -->|Yes| I[Emit 'winnerAnnounced' event]
    H -->|No| J[Emit 'socketErr' event]
    I --> K[On 'startGame' event]
    J --> K
    K --> L[Reset game state]
    L --> M[Emit 'gameStarted' event]
    M --> N[On 'drawNumber' event]
    N --> O[Generate random number]
    O --> P[Emit 'numberDrawn' event]
    P --> Q["Client disconnection (WebSocket)"]
    Q --> R[Remove user]
    R --> S[Emit 'userLeft' event]
    S --> T[End]
```

### 4. **Sequence Diagram**

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Gateway
    participant TicketService

    User->>Client: Connect to WebSocket
    Client->>Gateway: handleConnection()
    Gateway->>Client: Emit joinedUsers

    User->>Client: Enter Username
    Client->>Gateway: handleEnterUsername(username)
    Gateway->>TicketService: generateTicket(username)
    TicketService-->>Gateway: ticket
    Gateway-->>Client: Emit ticketGenerated(ticket)
    Gateway->>Client: Emit userJoined

```

### 5. **Class Diagram**

```mermaid
classDiagram
    class TicketService {
        +generateTicket(username: string): Ticket
        +getTicket(username: string): Ticket
        +verifyTicket(username: string, claimType: TicketClaimType, drawnNumbers: number[]): boolean
    }
    class GameGateway {
        +handleConnection(client: Socket): void
        +handleDisconnect(client: Socket): void
        +handleEnterUsername(client: Socket, username: string): void
        +handleClaimTicket(client: Socket, data: TicketClaimData): void
        +handleStartGame(): void
        +handleDrawNumber(): void
    }
    class TicketClaimData {
        +username: string
        +claimType: TicketClaimType
    }
    class TicketClaimType {
        <<enumeration>>
        FirstRow
        SecondRow
        ThirdRow
        EarlyFive
        FullHouse
    }
    GameGateway --> TicketService
    GameGateway --> TicketClaimData
    TicketClaimData --> TicketClaimType

```
