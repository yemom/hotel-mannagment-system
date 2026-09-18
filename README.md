#  Hotel Management System
[![CI/CD](https://github.com/yemom/hotel-mannagment-system/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yemom/hotel-mannagment-system/actions)

A comprehensive **Hotel Management System** built with **Spring Boot** and Java, providing RESTful APIs for guest management, room inventory, reservations, pricing, and reservation lifecycle management.

The project also includes a structured **software testing and quality-assurance framework** with unit, integration, and Selenium system tests, code-coverage analysis, defect tracking, CI/CD automation, Docker support, and formal test-design techniques.

> **Academic Project — Software Testing & Validation**
> Repository: [yemom/hotel-mannagment-system](https://github.com/yemom/hotel-mannagment-system)

---

##  Project Overview

The Hotel Management System is designed as a backend-oriented hotel operations platform that manages the core lifecycle of:

*  Guests
*  Rooms
*  Reservations
*  Pricing and discount rules
*  Reservation status transitions
*  Automated testing
*  Code coverage and quality metrics
*  CI/CD execution
*  Containerized deployment

The application follows a layered architecture separating domain models, business services, repositories, and REST controllers.

The repository currently contains **134 documented automated tests** distributed across unit, integration, and system-testing levels.

---

##  Key Features

###  Guest Management

The guest-management module provides functionality for:

* Guest registration
* Guest authentication/login
* Guest lookup by ID
* Guest lookup by email
* Listing all guests
* Listing active guests
* Updating guest profiles
* Suspending guest accounts
* Reactivating guest accounts
* Duplicate-email validation
* Age validation

The documented validation rules define a supported guest age range of **18–120 years** and require unique, valid email addresses.

---

###  Room Management

The room-management module supports:

* Creating rooms
* Retrieving rooms
* Listing all rooms
* Searching by room type
* Finding available rooms by type
* Searching by room status
* Searching room availability by date and guest capacity
* Updating room status
* Sending rooms to maintenance
* Returning rooms to available status

The documented room validation rules include:

| Rule        | Valid Range                            |
| ----------- | -------------------------------------- |
| Room price  | `> 0` and `<= 10,000`                  |
| Capacity    | `1–20` guests                          |
| Room status | `AVAILABLE`, `OCCUPIED`, `MAINTENANCE` |

Boundary tests specifically target values such as `0`, `0.01`, `10,000`, `10,001`, `0`, `1`, `20`, and `21`.

---

###  Reservation Management

The reservation module manages the complete reservation lifecycle:

```text
PENDING
   │
   ├── confirm() ──────► CONFIRMED
   │                       │
   │                       ├── checkIn() ──► CHECKED_IN
   │                       │                     │
   │                       │                     └── checkOut() ──► CHECKED_OUT
   │                       │
   │                       └── cancel() ──► CANCELLED
   │
   └── cancel() ──────► CANCELLED
```

Invalid transitions are explicitly tested and rejected.

Examples include:

* `CHECKED_IN → CANCELLED` 
* `PENDING → CHECKED_IN` 
* `CHECKED_OUT → CANCELLED` 

Valid transitions include:

* `PENDING → CONFIRMED`
* `CONFIRMED → CHECKED_IN`
* `CHECKED_IN → CHECKED_OUT`
* `PENDING → CANCELLED`
* `CONFIRMED → CANCELLED`

These state-transition rules are part of the formal test design.

---

###  Pricing & Discount Management

The pricing logic evaluates several business conditions:

* Length of stay
* Guest age
* VIP status
* Season/off-peak status

The documented decision-table rules include:

| Condition      | Rule                               |
| -------------- | ---------------------------------- |
| Long stay      | `>= 3 nights`                      |
| Very long stay | `7+ nights`                        |
| Senior guest   | `>= 60 years`                      |
| VIP guest      | Email ending in `@vip.com`         |
| Off-peak       | Based on documented seasonal rules |

Examples of documented discount rules include:

* Senior + VIP + off-peak → **25%**
* Senior + non-VIP + off-peak → **15%**
* VIP long stay → **15%**
* Senior + non-VIP + off-peak → **10%**
* 7+ night stay → **12%**
* 3–6 night stay → **5%**
* No qualifying condition → **0%**

The test design documents seven pricing rules and reports full rule coverage.

---

#  Architecture

The application follows a layered Spring architecture:

```text
                    ┌──────────────────────┐
                    │      REST API        │
                    │    Controllers      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Services        │
                    │                      │
                    │ GuestService         │
                    │ RoomService          │
                    │ ReservationService   │
                    │ PricingService       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Repositories      │
                    │                      │
                    │ GuestRepository      │
                    │ RoomRepository       │
                    │ ReservationRepository│
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Database       │
                    │ H2 / MySQL           │
                    └──────────────────────┘
```

The repository structure separates models, services, repositories, controllers, and automated tests.

---

#  Technology Stack

| Technology             | Purpose                            |
| ---------------------- | ---------------------------------- |
| **Java 11**            | Application runtime                |
| **Spring Boot 2.7.14** | Backend framework                  |
| **Spring REST**        | REST API                           |
| **Maven 3.8.1+**       | Build and dependency management    |
| **JPA**                | Persistence/data access            |
| **H2**                 | In-memory testing database         |
| **MySQL**              | Containerized database environment |
| **JUnit 5**            | Unit/integration testing           |
| **Mockito 4.11.0**     | Mocking                            |
| **AssertJ 3.24.1**     | Assertions                         |
| **Selenium 4.10.0**    | System/browser testing             |
| **JaCoCo 0.8.8**       | Code coverage                      |
| **GitHub Actions**     | CI/CD                              |
| **Jenkins**            | CI/CD automation                   |
| **Docker**             | Containerization                   |
| **Docker Compose**     | Multi-service orchestration        |

## The versions and toolchain are documented in the repository and QA documents.

#  Project Structure

```text
hotel-mannagment-system/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── src/
│   ├── main/
│   │   ├── java/com/hotelmanagement/
│   │   │
│   │   ├── HotelManagementApplication.java
│   │   │
│   │   ├── model/
│   │   │   ├── Guest.java
│   │   │   ├── Room.java
│   │   │   ├── Reservation.java
│   │   │   └── enums/
│   │   │
│   │   ├── service/
│   │   │   ├── GuestService.java
│   │   │   ├── RoomService.java
│   │   │   ├── ReservationService.java
│   │   │   └── PricingService.java
│   │   │
│   │   ├── repository/
│   │   │   ├── GuestRepository.java
│   │   │   ├── RoomRepository.java
│   │   │   └── ReservationRepository.java
│   │   │
│   │   └── controller/
│   │       ├── GuestController.java
│   │       ├── RoomController.java
│   │       └── ReservationController.java
│   │
│   ├── test/
│   │   └── java/com/hotelmanagement/
│   │       ├── GuestServiceTest.java
│   │       ├── RoomServiceTest.java
│   │       ├── ReservationServiceTest.java
│   │       ├── PricingServiceTest.java
│   │       ├── HotelManagementIntegrationTest.java
│   │       ├── HotelManagementSystemTest.java
│   │       │
│   │       └── pageobjects/
│   │           ├── BasePage.java
│   │           ├── LoginPage.java
│   │           ├── RegistrationPage.java
│   │           ├── SearchRoomsPage.java
│   │           ├── BookingPage.java
│   │           └── BaseSystemTest.java
│   │
│   └── resources/
│       └── application.properties
│
├── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
├── pom.xml
│
├── DEFECT_LOG.md
├── FOUNDATIONS_REFLECTION.md
├── METRICS_REPORT.md
├── TEST_DESIGN.md
├── TEST_PLAN.md
└── TEST_SUMMARY.md
```

The repository documents this layered structure and its associated test classes.

---

#  Getting Started

## Prerequisites

Install the following:

* Java 11 or later
* Maven 3.8.1 or later
* Git
* Docker and Docker Compose — optional

Verify the installations:

```bash
java -version
mvn -version
git --version
docker --version
docker-compose --version
```

---

#  Clone the Repository

```bash
git clone https://github.com/yemom/hotel-mannagment-system.git
cd hotel-mannagment-system
```

---

#  Build the Application

Run a clean Maven build:

```bash
mvn clean package
```

The generated JAR is:

```text
target/hotel-management-1.0.0.jar
```

The repository also generates a JaCoCo coverage report under:

```text
target/site/jacoco/index.html
```

---

#  Run the Application

## Option 1 — Spring Boot

```bash
mvn spring-boot:run
```

The documented application configuration uses:

```text
Host:        localhost
Port:        8080
Context:     /api
```

Therefore, the API base URL is:

```text
http://localhost:8080/api
```

---

## Option 2 — Run the JAR

```bash
java -jar target/hotel-management-1.0.0.jar
```

---

#  Docker

## Build Docker Image

```bash
docker build -t hotel-management:latest .
```

## Run Container

```bash
docker run -d \
  --name hotel-app \
  -p 8080:8080 \
  hotel-management:latest
```

View logs:

```bash
docker logs hotel-app
```

Stop the application:

```bash
docker stop hotel-app
```

---

#  Docker Compose

The project includes a Docker Compose environment containing the documented application, MySQL, and Jenkins services.

Start the environment:

```bash
docker-compose up -d
```

Services:

| Service     | Address                     |
| ----------- | --------------------------- |
| Application | `http://localhost:8080/api` |
| Jenkins     | `http://localhost:8081`     |
| MySQL       | `localhost:3306`            |

View logs:

```bash
docker-compose logs -f
```

Stop everything:

```bash
docker-compose down
```

The Compose configuration uses the `hotel-network` network and persistent volumes for MySQL and Jenkins data.

---

#  Health Check

The application exposes the documented actuator health endpoint:

```bash
curl http://localhost:8080/api/actuator/health
```

Expected response:

```json
{
  "status": "UP"
}
```

---

#  REST API

All API endpoints are exposed under:

```text
/api
```

##  Guest API

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| `POST` | `/api/guests/register`        | Register guest      |
| `POST` | `/api/guests/login`           | Authenticate guest  |
| `GET`  | `/api/guests/{id}`            | Get guest           |
| `GET`  | `/api/guests/email/{email}`   | Find guest by email |
| `GET`  | `/api/guests/all`             | Get all guests      |
| `GET`  | `/api/guests/active/list`     | Get active guests   |
| `PUT`  | `/api/guests/{id}`            | Update guest        |
| `POST` | `/api/guests/{id}/suspend`    | Suspend guest       |
| `POST` | `/api/guests/{id}/reactivate` | Reactivate guest    |

---

##  Room API

| Method | Endpoint                           | Description                 |
| ------ | ---------------------------------- | --------------------------- |
| `POST` | `/api/rooms`                       | Create room                 |
| `GET`  | `/api/rooms/{id}`                  | Get room                    |
| `GET`  | `/api/rooms/all`                   | Get all rooms               |
| `GET`  | `/api/rooms/type/{type}`           | Get rooms by type           |
| `GET`  | `/api/rooms/type/{type}/available` | Get available rooms by type |
| `GET`  | `/api/rooms/status/{status}`       | Get rooms by status         |
| `GET`  | `/api/rooms/available`             | Search available rooms      |
| `PUT`  | `/api/rooms/{id}/status`           | Update room status          |
| `POST` | `/api/rooms/{id}/maintenance`      | Set room to maintenance     |
| `POST` | `/api/rooms/{id}/available`        | Mark room available         |

---

##  Reservation API

| Method | Endpoint                            | Description            |
| ------ | ----------------------------------- | ---------------------- |
| `POST` | `/api/reservations`                 | Create reservation     |
| `GET`  | `/api/reservations/{id}`            | Get reservation        |
| `GET`  | `/api/reservations/all`             | Get all reservations   |
| `GET`  | `/api/reservations/guest/{guestId}` | Get guest reservations |
| `GET`  | `/api/reservations/room/{roomId}`   | Get room reservations  |
| `POST` | `/api/reservations/{id}/confirm`    | Confirm reservation    |
| `POST` | `/api/reservations/{id}/check-in`   | Check in guest         |
| `POST` | `/api/reservations/{id}/check-out`  | Check out guest        |
| `POST` | `/api/reservations/{id}/cancel`     | Cancel reservation     |

The endpoint inventory above is taken from the repository's documented API section.

---

#  Testing Strategy

Testing is one of the central components of this project.

The test strategy uses three primary levels:

```text
                 ┌───────────────────┐
                 │   System / E2E    │
                 │    Selenium       │
                 └─────────▲─────────┘
                           │
                 ┌─────────┴─────────┐
                 │   Integration     │
                 │    Spring + H2    │
                 └─────────▲─────────┘
                           │
                 ┌─────────┴─────────┐
                 │       Unit        │
                 │ JUnit + Mockito   │
                 └───────────────────┘
```

### Unit Testing

**115 tests**

| Test Class               |   Tests |
| ------------------------ | ------: |
| `GuestServiceTest`       |      50 |
| `ReservationServiceTest` |      30 |
| `RoomServiceTest`        |      20 |
| `PricingServiceTest`     |      15 |
| **Total**                | **115** |

Unit tests primarily validate service-layer business logic and validation rules.

### Integration Testing

**7 tests**

Integration tests validate:

* Multi-component workflows
* Persistence
* Reservation lifecycle
* Cross-component behavior
* Database interactions

The integration layer uses Spring's test infrastructure and H2.

### System Testing

**12 Selenium tests**

System testing uses:

* Selenium WebDriver
* Page Object Model
* Browser automation
* End-to-end scenarios

Page objects include:

```text
BasePage
LoginPage
RegistrationPage
SearchRoomsPage
BookingPage
BaseSystemTest
```

---

#  Formal Test Design Techniques

The project applies four formal testing techniques.

## 1. Equivalence Partitioning

The project partitions input values into valid and invalid classes.

Examples:

```text
Guest Age
├── < 18       → Invalid
├── 18–120     → Valid
└── > 120      → Invalid

Room Price
├── <= 0       → Invalid
├── > 0–10,000 → Valid
└── > 10,000   → Invalid

Capacity
├── 0          → Invalid
├── 1–20       → Valid
└── > 20       → Invalid
```

The documented design contains **17 equivalence partitions and 34 test cases**.

---

## 2. Boundary Value Analysis

Boundary tests focus on values immediately around business limits.

Examples:

| Input         | Boundary Values       |
| ------------- | --------------------- |
| Age minimum   | 17, 18, 19            |
| Age maximum   | 119, 120, 121         |
| Price minimum | 0, 0.01, 0.99         |
| Price maximum | 9,999, 10,000, 10,001 |
| Capacity      | 0, 1, 19, 20, 21      |

The metrics report documents **24 boundary tests** and six detected defects.

---

## 3. Decision Table Testing

Decision tables are used primarily for pricing and discount logic.

Conditions include:

* Long stay
* Senior guest
* VIP guest
* Off-peak season

The design contains **seven documented rules** and reports full rule coverage.

---

## 4. State Transition Testing

Reservation lifecycle transitions are explicitly tested.

```text
PENDING
   │
   ├── CONFIRM ──────► CONFIRMED
   │                       │
   │                       └── CHECK-IN ──► CHECKED_IN
   │                                           │
   │                                           └── CHECK-OUT ──► CHECKED_OUT
   │
   └── CANCEL ───────► CANCELLED
```

Invalid transitions are also included in the test suite.

---

#  Quality Metrics

The repository reports the following testing baseline:

| Metric                       | Reported Value | Target |
| ---------------------------- | -------------: | -----: |
| Automated tests              |            134 |   100+ |
| Passed                       |            132 |      — |
| Failed                       |              2 |      — |
| Pass rate                    |          98.5% |    95% |
| Line coverage                |            92% |    80% |
| Branch coverage              |            88% |    80% |
| Method coverage              |            95% |    85% |
| Class coverage               |           100% |    90% |
| Reported defects             |             16 |      — |
| Reported resolved defects    |             16 |      — |
| Reported outstanding defects |              0 |      0 |

The repository reports these values as its documented QA baseline.

The metrics report independently records the same 134-test execution, 132 passes, 2 failures, and coverage figures.

> **Evidence note:** These are repository-reported measurements. They were not freshly executed during this README-generation session. The QA documentation explicitly states that the repository was inspected but the Maven/Selenium suite was not executed in the review environment.

---

#  Defect Management

The project includes a formal defect-management process:

```text
OPEN
  ↓
IN_PROGRESS
  ↓
RESOLVED
  ↓
VERIFIED
  ↓
CLOSED
```

Defects are documented with:

* Unique defect ID
* Description
* Severity
* Priority
* Root cause
* Resolution
* Verification
* Closure evidence

The detailed defect register contains examples involving:

* Age validation
* Duplicate email handling
* Room capacity
* Room price validation
* Reservation overlap
* Reservation state transitions
* Guest suspension
* Discount calculation
* Room status
* Date validation
* Guest reservation lookup

### Important Documentation Note

The QA documentation reports **16 defects**, but the visible detailed defect register contains **15 IDs (`DEFECT-001` through `DEFECT-015`)**.

This discrepancy should be reconciled against the source test results before the defect count is treated as a final auditable metric.

---

#  Defect Distribution

The metrics documentation reports:

| Component     |  LOC | Reported Defects | Density / 100 LOC |
| ------------- | ---: | ---------------: | ----------------: |
| Domain Models |  350 |                6 |               1.7 |
| Services      |  600 |                8 |               1.3 |
| Repositories  |   50 |                2 |               4.0 |
| Overall       | ~800 |               16 |               2.0 |

The repository identifies data-access/repository logic as an area requiring continued attention.

---

#  CI/CD

The project supports both **GitHub Actions** and **Jenkins**.

## GitHub Actions

The documented workflow performs:

1. Build and test
2. Regression testing
3. Optional SonarQube analysis
4. Coverage verification
5. Test-result summary

The coverage quality gate is documented at **80%**.

---

## Jenkins

The project contains an **11-stage Jenkins pipeline**:

```text
1.  Checkout
2.  Clean
3.  Build
4.  Unit Tests
5.  Integration Tests
6.  Code Coverage
7.  Verify Threshold
8.  Package
9.  Archive
10. Regression Test
11. Post-Actions
```

The pipeline publishes JUnit results and HTML coverage reports.

---

#  Quality Gates

The documented release criteria include:

* At least 80% line coverage
* At least 80% branch coverage
* At least 95% test pass rate
* Zero critical defects
* High-priority defects resolved
* Regression suite passing
* Documentation complete

---

#  Traceability

The project uses a structured traceability chain:

```text
Business Requirement
        ↓
Risk
        ↓
Test Design Technique
        ↓
Test Case
        ↓
Automated Test
        ↓
Defect
        ↓
Regression Verification
        ↓
Quality Metric
```

Examples include:

| Requirement           | Risk                  | Test Technique   | Test Layer       |
| --------------------- | --------------------- | ---------------- | ---------------- |
| Guest age validation  | Invalid guests        | EP + BVA         | Unit             |
| Unique email          | Duplicate accounts    | EP               | Unit/Integration |
| Room price            | Financial/data errors | EP + BVA         | Unit             |
| Room capacity         | Overbooking           | EP + BVA         | Unit             |
| Discount calculation  | Incorrect charges     | Decision Table   | Unit             |
| Reservation lifecycle | Invalid workflow      | State Transition | Unit/Integration |
| Overlap prevention    | Double booking        | EP + Integration | Integration      |
| End-to-end journeys   | Cross-layer defects   | Scenario testing | System           |

---

#  Running Tests

## Run Complete Test Suite

```bash
mvn test
```

The repository's documented baseline is:

```text
Tests:       134
Passed:      132
Failed:      2
Pass Rate:   98.5%
Duration:    ~45 seconds
```

---

## Run Individual Test Class

```bash
mvn test -Dtest=GuestServiceTest
```

Multiple classes:

```bash
mvn test \
  -Dtest=GuestServiceTest,RoomServiceTest,ReservationServiceTest
```

---

## Generate Coverage

```bash
mvn clean verify
```

Coverage report:

```text
target/site/jacoco/index.html
```

Open on Windows:

```bash
start target/site/jacoco/index.html
```

Linux/macOS:

```bash
open target/site/jacoco/index.html
```

---

#  Test Distribution

```text
Unit Tests
├── GuestServiceTest ............... 50
├── ReservationServiceTest ......... 30
├── RoomServiceTest ................ 20
└── PricingServiceTest ............. 15
                                     ──
                                     115

Integration Tests ................... 7

System / Selenium Tests ............. 12
                                     ──
Total .............................. 134
```

## The repository and metrics report both document this overall test distribution.

#  Configuration

The main application configuration is located at:

```text
src/main/resources/application.properties
```

Documented settings include:

```text
Server Port:       8080
Context Path:      /api
Test Database:     H2
Persistence:       JPA
```

The Docker Compose configuration additionally provides a MySQL service for the containerized environment.

---

#  Development Workflow

Recommended workflow:

```text
1. Clone repository
       ↓
2. Create/update tests
       ↓
3. Implement feature
       ↓
4. Run unit tests
       ↓
5. Run integration tests
       ↓
6. Generate coverage
       ↓
7. Run regression tests
       ↓
8. Commit changes
       ↓
9. Push to GitHub
       ↓
10. CI/CD validation
```

Example:

```bash
git clone https://github.com/yemom/hotel-mannagment-system.git

cd hotel-mannagment-system

mvn clean package

mvn test

mvn verify

git add .

git commit -m "Add feature with tests"

git push origin main
```

The repository documents a test-first development workflow and CI/CD execution after changes are pushed.

---

#  Troubleshooting

## `Cannot find javac`

Verify:

```bash
java -version
```

Set `JAVA_HOME` to your JDK installation and retry:

```bash
mvn test
```

---

## Maven Is Not Recognized

Verify:

```bash
mvn -version
```

If Maven is installed but unavailable, add Maven's `bin` directory to your system `PATH`.

---

## Port 8080 Already in Use

Windows:

```bash
netstat -ano | findstr :8080
```

Terminate the process:

```bash
taskkill /PID <PID> /F
```

Or run the application on another port:

```bash
mvn spring-boot:run \
  -Dspring-boot.run.arguments="--server.port=8081"
```

---

## Docker Build Failure

First verify that the Maven build succeeds:

```bash
mvn clean package
```

Then:

```bash
docker build -t hotel-management:latest .
```

Check Docker:

```bash
docker ps
```

---

#  QA Documentation

The repository includes a complete testing documentation package:

| Document                    | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `TEST_PLAN.md`              | Overall QA strategy, scope, risks and criteria |
| `TEST_DESIGN.md`            | Formal test-design techniques and traceability |
| `DEFECT_LOG.md`             | Defect register and root-cause analysis        |
| `METRICS_REPORT.md`         | Coverage, execution and defect metrics         |
| `TEST_SUMMARY.md`           | Test execution summary and release assessment  |
| `FOUNDATIONS_REFLECTION.md` | Software-testing theory and reflection         |

The uploaded QA documents confirm the same organization and describe the project as a formal academic software-testing package.

---

#  Current QA Evidence Notes

The project documentation contains several items that should be kept transparent:

### 1. Defect Count Reconciliation

The metrics report states 16 defects, while the detailed visible register contains 15 IDs.

### 2. System-Test Results

The repository reports two system-test failures. The QA documentation associates these with UI limitations, while Selenium system-test artifacts are present. This should be clarified in future revisions.

### 3. Controller Coverage

The metrics documentation reports that controllers were not tested, despite strong overall coverage. Controller/API contract tests are therefore identified as an improvement area.

### 4. Reported vs. Reproduced Metrics

The test numbers and coverage values in this README represent the project's documented baseline; they should not be interpreted as a fresh execution result from the README-generation review.

---

#  Future Improvements

Based on the documented QA gaps and project structure, potential future work includes:

* Add controller/API contract tests
* Reconcile the 15-vs-16 defect discrepancy
* Generate machine-readable test artifacts for every headline metric
* Improve system-test environment/prerequisite documentation
* Expand API-level integration testing
* Add additional security testing
* Add load and stress testing
* Add penetration/security testing
* Add responsive/mobile testing if a production UI is introduced
* Add production database migration testing
* Strengthen CI quality gates with reproducible reports

The current QA plan explicitly places load/stress testing, penetration testing, responsive/mobile testing, production infrastructure testing, and database migration testing outside the current scope.

---

#  Project Scope

### Currently Included

* Guest management
* Room management
* Reservation management
* Pricing and discounts
* Reservation lifecycle
* REST APIs
* Unit testing
* Integration testing
* Selenium system testing
* Code coverage
* Defect management
* CI/CD
* Docker
* Jenkins
* GitHub Actions

### Currently Outside Scope

* Load/stress testing
* Penetration testing
* Responsive/mobile testing
* Production infrastructure testing
* Database migration testing

---

#  Team

| Name                | Student ID  | Responsibility       |
| ------------------- | ----------- | -------------------- |
| **Esrom Basazinaw** | ATE/5227/14 | Automation / Backend |
| **Rediet Mesfin**   | ATE/5020/14 | Test Design / Unit   |
| **Yohanes Seyum**   | ATE/5195/14 | System / Selenium    |
| **Samuel Fantahun** | ATE/4115/14 | CI/CD / Metrics      |

These responsibilities are documented consistently across the QA package.

---

#  Academic Context

This project was developed as part of a **Software Testing & Validation** course and combines software implementation with a structured quality-assurance process.

The QA package demonstrates:

* Test planning
* Test design
* Automated testing
* Boundary analysis
* Equivalence partitioning
* Decision-table testing
* State-transition testing
* Integration testing
* System testing
* Defect management
* Root-cause analysis
* Code coverage
* CI/CD
* Quality gates
* Testing metrics

---

#  License

This project is documented in the repository as an academic software-testing project intended for internal/academic use.

See the repository for the applicable project terms.

---

#  Repository

**GitHub:**
https://github.com/yemom/hotel-mannagment-system

---

#  Project at a Glance

```text
┌─────────────────────────────────────────────┐
│        HOTEL MANAGEMENT SYSTEM              │
├─────────────────────────────────────────────┤
│ Backend              Spring Boot / Java 11  │
│ API                  REST                    │
│ Build                Maven                  │
│ Database             H2 / MySQL             │
│ Unit Tests           115                    │
│ Integration Tests      7                    │
│ System Tests          12                    │
│ Total Tests         134                     │
│ Reported Pass Rate   98.5%                  │
│ Line Coverage        92%                    │
│ Branch Coverage      88%                    │
│ Method Coverage      95%                    │
│ Class Coverage      100%                    │
│ CI/CD                GitHub Actions/Jenkins │
│ Containers            Docker                 │
│ Browser Testing      Selenium                │
│ Coverage             JaCoCo                 │
└─────────────────────────────────────────────┘
```

---

##  Summary

The Hotel Management System combines a Spring Boot REST backend with a formal software-testing and quality-assurance framework. Its documented architecture covers guest, room, reservation, and pricing services, while its QA layer includes **134 automated tests, formal test-design techniques, JaCoCo coverage analysis, defect tracking, Selenium system testing, Docker, GitHub Actions, and an 11-stage Jenkins pipeline**.

The project is particularly structured around validation-heavy hotel business rules such as age limits, room capacity, room pricing, reservation conflicts, discounts, and reservation state transitions. The QA documentation provides traceability from requirements and risks through test techniques, automated tests, defects, regression verification, and metrics.

For an academically and professionally maintainable project, the next documentation priority is to reconcile the remaining metric inconsistencies and ensure each reported metric can be reproduced from a machine-generated test or coverage artifact.
