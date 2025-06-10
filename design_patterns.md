# TalashNow Project: Design Patterns Implementation

This document outlines the design patterns implemented in the TalashNow web application, explaining where and why each pattern is used, along with their benefits.

## 1. Creational Patterns

### 1.1 Singleton Pattern

**Implementation**: The Singleton pattern ensures a class has only one instance and provides a global point of access to it.

**Files**: `js/api.js`

**How it's used**: The `ApiSingleton` is implemented using the Singleton pattern to ensure that only one instance of the API client exists throughout the application. This is important for maintaining consistent state and avoiding duplicate HTTP requests.

**Benefits**:
- Ensures centralized management of API requests
- Reduces memory footprint by avoiding multiple instances
- Provides a global point of access to API functionality

### 1.2 Factory Pattern

**Implementation**: The Factory Method pattern provides an interface for creating objects but allows subclasses to decide which classes to instantiate.

**Files**: `/D:/GitHub/TalashNow-Backend/talashnow/src/main/java/omermoazzam/talashnow/model/ItemFactory.java`

**How it's used**: The `ItemFactory` class encapsulates the object creation logic for creating `LostItem` and `FoundItem` objects. It exposes a factory method called `createItem()` that takes a parameter to determine which type of item to create.

**Benefits**:
- Encapsulates the creation logic, making the code more maintainable
- Clients don't need to know the specific classes needed for creation
- Simplifies adding new types of items in the future

### 1.3 Builder Pattern

**Implementation**: The Builder pattern separates the construction of a complex object from its representation, allowing the same construction process to create different representations.

**Files**:
- `/D:/GitHub/TalashNow-Backend/talashnow/src/main/java/omermoazzam/talashnow/model/LostItem.java`
- `/D:/GitHub/TalashNow-Backend/talashnow/src/main/java/omermoazzam/talashnow/model/FoundItem.java`

**How it's used**: Both `LostItem` and `FoundItem` classes use inner Builder classes to construct item objects with many optional parameters in a readable and maintainable way.

**Benefits**:
- Enables step-by-step construction of complex objects
- Allows construction of objects with different parameters without numerous constructors
- Makes the code more readable and maintainable

## 2. Structural Patterns

### 2.1 Adapter Pattern

**Implementation**: The Adapter pattern converts the interface of a class into another interface that clients expect.

**Files**: Backend services that adapt between repository/database models and REST API models

**How it's used**: In the services layer, adapters are used to convert between the internal model representation and the JSON representation sent over HTTP.

**Benefits**:
- Allows incompatible interfaces to work together
- Provides a clean separation between data storage format and API format
- Enhances maintainability by isolating changes to data models

### 2.2 Bridge Pattern

**Implementation**: The Bridge pattern decouples an abstraction from its implementation so that the two can vary independently.

**Files**: API abstraction in frontend that bridges the gap between UI and backend services

**How it's used**: The API layer in the frontend acts as a bridge between the UI components and the backend implementation, allowing each to evolve independently.

**Benefits**:
- Separates the interface from implementation
- Enables independent evolution of both UI and API
- Supports adding new types of requests or UI components without affecting existing code

### 2.3 Composite Pattern

**Implementation**: The Composite pattern composes objects into tree structures to represent part-whole hierarchies.

**Files**: Various UI components in HTML/CSS/JS

**How it's used**: The UI components are organized in a hierarchical structure, with container components (like forms) containing child components (like input fields).

**Benefits**:
- Creates hierarchical structures of objects
- Enables clients to treat individual objects and compositions uniformly
- Simplifies the client code that handles complex structures

## 3. Behavioral Patterns

### 3.1 Chain of Responsibility Pattern

**Implementation**: The Chain of Responsibility pattern passes requests along a chain of handlers, each of which decides whether to process the request or pass it to the next handler.

**Files**: Backend request validation and authentication logic

**How it's used**: Requests pass through a chain of middleware handlers (authentication, validation, etc.) before reaching the controller.

**Benefits**:
- Decouples request senders from receivers
- Adds flexibility in assigning responsibilities to objects
- Allows dynamic modification of the chain at runtime

### 3.2 Command Pattern

**Implementation**: The Command pattern encapsulates a request as an object, allowing for parameterization of clients with different requests, queueing, and logging of requests.

**Files**: 
- `/D:/GitHub/TalashNow-Backend/talashnow/src/main/java/omermoazzam/talashnow/service/command/ReportLostItemCommand.java`
- JS API calls in `js/api.js`

**How it's used**: Commands like `ReportLostItemCommand` encapsulate all the information needed to perform an action, allowing for separation of concerns and undo/redo functionality.

**Benefits**:
- Decouples the object invoking the operation from the one that knows how to perform it
- Supports undo/redo operations
- Allows for queueing and logging of operations

### 3.3 Mediator Pattern

**Implementation**: The Mediator pattern defines an object that encapsulates how a set of objects interact, promoting loose coupling.

**Files**: Frontend event handling and components communication

**How it's used**: The scripts.js file acts as a mediator between different UI components, centralizing communication and reducing direct references between components.

**Benefits**:
- Reduces coupling between components
- Centralizes communication logic
- Makes it easier to modify how components interact

### 3.4 Observer Pattern

**Implementation**: The Observer pattern defines a one-to-many dependency between objects, so that when one object changes state, all its dependents are notified and updated automatically.

**Files**: Event listeners in JavaScript

**How it's used**: Components register event listeners to observe user actions or state changes.

**Benefits**:
- Supports the principle of loose coupling
- Allows for dynamic relationships between objects at runtime
- Enables broadcast communication

### 3.5 Null Object Pattern

**Implementation**: The Null Object pattern provides a default object with do-nothing behavior.

**Files**:
- `/D:/GitHub/TalashNow-Backend/talashnow/src/main/java/omermoazzam/talashnow/model/NullLostItem.java`
- `/D:/GitHub/TalashNow-Backend/talashnow/src/main/java/omermoazzam/talashnow/model/NullFoundItem.java`

**How it's used**: When no lost or found item is found, a `NullLostItem` or `NullFoundItem` is returned instead of null, eliminating the need for null checks in client code.

**Benefits**:
- Eliminates null reference checks in client code
- Provides default behavior for missing objects
- Simplifies code by avoiding conditional statements

## Conclusion

TalashNow implements a variety of design patterns to create a maintainable, extensible, and robust application. These patterns help in achieving separation of concerns, loose coupling, and high cohesion throughout the codebase. By following established design patterns, the application is more structured and easier to understand, modify, and extend. 