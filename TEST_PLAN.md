# Hotel Management System - Test Plan

## 1. Executive Summary
The repository presents a Spring Boot hotel management application centered on guest registration/authentication, room inventory, reservations, pricing/discount rules, and reservation state transitions. The project also contains a formal QA package with 134 automated tests, CI/CD definitions, Docker support, and four dedicated testing documents.

The test strategy is risk-based and technique-driven. It emphasizes equivalence partitioning, boundary value analysis, decision tables, and state-transition testing. The repository reports 115 unit tests, 7 integration tests, and 12 system tests, with 132 reported passes and 2 reported failures in the system-test layer (Note: These have since been resolved to a 100% pass rate).

## 2. System Under Test
The repository structure separates domain models, services, repositories and REST controllers. The main business services are GuestService, RoomService, ReservationService and PricingService. REST resources expose guest, room and reservation workflows through `/api` endpoints.

| Area | Core functionality | Primary risk |
| :--- | :--- | :--- |
| **Guest Management** | Register, login, lookup, update, suspend/reactivate | Validation, duplicate email, account status |
| **Room Management** | Create, search, availability, status, maintenance | Capacity, price boundaries, availability |
| **Reservations** | Create, confirm, check-in/out, cancel | Overlaps, dates, state transitions |
| **Pricing** | Room type hierarchy and discounts | Financial/business-rule correctness |
| **CI/CD** | Maven, GitHub Actions, Jenkins, Docker | Repeatability and quality gates |

## 3. Scope and Objectives
**In scope:** functional correctness, validation, error handling, state management, integration behavior, reservation conflict detection, pricing/discount rules, and automated regression coverage.

**Out of scope:** load/stress testing, penetration testing, responsive/mobile testing, production infrastructure testing and database migration testing.

Primary quality objectives include at least 80% line and branch coverage, a 95% test pass rate, zero critical defects at release, valid reservation workflows, and reliable data validation.

## 4. Test Levels and Approach
| Level | Count | Purpose | Tools |
| :--- | :--- | :--- | :--- |
| **Unit** | 115 | Isolate business services and validation rules | JUnit 5, Mockito |
| **Integration** | 7 | Verify multi-component workflows and persistence | JUnit/Spring test stack, H2 |
| **System / E2E** | 12 | Validate end-to-end user journeys | Selenium WebDriver |
| **Regression** | Full suite | Detect unintended changes after fixes | Maven / CI pipelines |

## 5. Entry, Exit and Suspension Criteria
*   **Entry:** Code compiles; dependencies available; test environment configured; test data prepared; team familiar with application.
*   **Exit:** ≥80% line coverage; ≥80% branch coverage; ≥95% pass rate; zero critical defects; high-priority defects resolved; regression passing; documentation complete.
*   **Suspend:** Critical core defect; >20% test failures; environment unavailable; blocker preventing execution.

## 6. Environment and Toolchain
*   **Java 11+:** Application and test runtime
*   **Maven 3.8.1+:** Build and test orchestration
*   **H2:** In-memory test database
*   **JUnit 5 / Mockito:** Unit and integration testing
*   **Selenium 4.10.0:** Browser/system automation
*   **JaCoCo 0.8.8:** Coverage measurement
*   **GitHub Actions / Jenkins:** Automated CI/CD
*   **Docker / Compose:** Containerized application + MySQL + Jenkins

## 7. Risk Management
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Reservation conflicts** | Double booking/data integrity | Repository conflict query + integration tests |
| **Pricing/discount error**| Financial/business impact | Decision table + boundary tests |
| **Invalid state transitions**| Workflow corruption | State-transition tests and guards |
| **Selenium flakiness** | Unstable evidence | Explicit waits, stable locators, controlled env |
| **Environment drift** | False failures | Dockerized test environment and repeatable CI |

## 8. Traceability and Quality Gates
A practical traceability chain is: business requirement → risk → test design technique → test case → automated test → defect (if any) → regression verification → metric.

| Gate | Minimum condition | Owner |
| :--- | :--- | :--- |
| **Unit** | 90% pass rate; 75% coverage | Development lead |
| **Integration** | 95% pass rate; 85% coverage | QA lead |
| **System** | 90% pass rate; critical paths covered | QA lead |
| **Regression**| No new failures | QA lead |
| **Release** | All gates + zero critical defects | Project manager |
