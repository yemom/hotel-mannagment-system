# Hotel Management System - Test Plan (Part A)

**Document Version**: 1.0  
**Date Created**: 2026-01-15  
**Last Updated**: 2026-01-22  
**Prepared By**: QA Team  
**Reviewed By**: Project Manager  
**Status**: Approved

---

## Executive Summary

This test plan documents the comprehensive testing strategy for the Hotel Management System, a Spring Boot REST API application built with Java 11. The plan covers all testing phases from unit testing through system testing, with emphasis on formal test design techniques.

The hotel management system manages guest accounts, room inventory, reservations with complex discount rules, and workflow state transitions. The system requires rigorous testing due to business-critical functions like reservation management and payment calculations.

**Test Scope**: 134 total test cases across unit, integration, and system testing layers
**Project Timeline**: 4 weeks
**Test Execution Duration**: ~45 seconds (full automated suite)

---

## 1. Test Objectives

### Primary Objectives

1. **Verify Core Functionality**
   - Guest registration, authentication, and profile management
   - Room inventory management and availability queries
   - Reservation creation with complex discount calculations
   - Multi-step reservation workflow (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT)

2. **Ensure Data Integrity**
   - Validate input constraints (age, price, capacity, dates)
   - Prevent invalid state transitions
   - Detect and prevent overlapping reservations

3. **Verify Business Rules**
   - Decision table: 7 discount rules based on stay duration, guest age, VIP status, season
   - State machine: Proper state transitions with guards
   - Pricing hierarchy: SINGLE < DOUBLE < SUITE < DELUXE < PENTHOUSE

4. **Achieve Quality Metrics**
   - Minimum 80% code coverage (Line coverage: Target 80%, Goal 90%)
   - Minimum 80% branch coverage
   - 95% test pass rate
   - Zero critical defects at release

5. **Enable Continuous Improvement**
   - Establish metrics baseline for future releases
   - Document test design rationale for maintenance
   - Demonstrate formal testing techniques

---

## 2. Test Scope

### In Scope - What We Test

#### Business Components
- **Guest Management**: Registration, authentication, account status, profile updates
- **Room Management**: Room creation, availability queries, status transitions, pricing
- **Reservation Management**: Creation, confirmation, check-in, check-out, cancellation
- **Pricing & Discounts**: Price validation, room type hierarchy, complex discount logic
- **Business Rules**: State machines, discount decisions, conflict detection

#### Quality Attributes
- **Functional Correctness**: Features work as specified
- **Data Validation**: Input validation, boundary conditions
- **Error Handling**: Appropriate error messages for invalid operations
- **State Management**: Valid transitions, guard conditions
- **Integration**: Multiple components working together

#### Test Types
- **Unit Tests**: 115 test cases for individual components
- **Integration Tests**: 7 test cases for multi-component workflows
- **System Tests**: 12 test cases for end-to-end user journeys

### Out of Scope - What We Don't Test

- **Performance Testing**: Load, stress, and scalability testing (future release)
- **Security Testing**: OWASP vulnerabilities, penetration testing (future release)
- **Mobile/Responsive UI**: Not applicable (REST API only in this phase)
- **Browser Compatibility**: System tests focus on core functionality
- **Production Deployment**: Infrastructure and deployment strategies (DevOps team)
- **Database Migration**: Only test with H2 in-memory database

---

## 3. Test Strategy

### Testing Approach

The testing strategy employs **formal test design techniques** to systematically identify test cases and ensure comprehensive coverage:

#### 3.1 Equivalence Partitioning
Divide input domains into classes where test cases behave similarly:

- **Age Partitions**: (Invalid: <18), (Valid: 18-120), (Invalid: >120)
- **Price Partitions**: (Budget: <$100), (Standard: $100-300), (Premium: $300-500), (Luxury: $500-10000), (Invalid: >10000)
- **Capacity Partitions**: (Invalid: 0), (Valid: 1-20), (Invalid: >20)
- **Stay Duration**: (Short: 1 night), (Medium: 2-6 nights), (Long: 7+ nights)
- **Email Format**: (Valid: user@domain.com), (Invalid: no@), (Duplicate: existing email)
- **Room Status**: (AVAILABLE), (OCCUPIED), (MAINTENANCE)

#### 3.2 Boundary Value Analysis
Test at partition boundaries where errors are likely:

- **Age**: 17, 18, 119, 120, 121
- **Price**: $0, $0.01, $9999, $10000, $10001
- **Capacity**: 0, 1, 19, 20, 21
- **Check-in/Check-out**: Today, Tomorrow, Yesterday
- **Guest Count**: 0, 1, 20, 21

#### 3.3 Decision Table Testing
Test complex business rules with combinations of conditions:

**Discount Calculation (4 conditions, 7 rules)**:
- Condition 1: Long stay (≥3 nights)
- Condition 2: Senior age (≥60)
- Condition 3: VIP email domain (@vip.com)
- Condition 4: Off-peak season (not Jun/Jul/Aug/Dec/Jan)

| Rule | Long Stay | Senior | VIP | Off-Peak | Discount |
|------|---|---|---|---|---|
| 1 | Y | Y | Y | Y | 25% |
| 2 | Y | Y | N | Y | 15% |
| 3 | Y | N | Y | Y/N | 15% |
| 4 | N | Y | N | Y | 10% |
| 5 | Y (7+) | N | N | N | 12% |
| 6 | Y (3-6) | N | N | N | 5% |
| 7 | N | N | N | N | 0% |

#### 3.4 State Transition Testing
Test workflow state machines with valid/invalid transitions:

**Reservation States**:
```
PENDING ──confirm──→ CONFIRMED ──checkIn──→ CHECKED_IN ──checkOut──→ CHECKED_OUT
   ↓                     ↓
   └─ cancel ──→ CANCELLED
```

Test Cases:
- ✅ PENDING → CONFIRMED (valid)
- ✅ CONFIRMED → CHECKED_IN (valid)
- ✅ CHECKED_IN → CHECKED_OUT (valid)
- ✅ PENDING → CANCELLED (valid)
- ✅ CONFIRMED → CANCELLED (valid)
- ❌ CHECKED_IN → CANCELLED (invalid)
- ❌ PENDING → CHECKED_IN (invalid - must confirm first)

### Risk-Based Test Prioritization

**Critical Components** (High Priority - Test First):
- Reservation discount calculation (financial impact)
- Reservation conflict detection (data integrity)
- Guest suspension (legal compliance)
- State transition guards (workflow integrity)

**Important Components** (Medium Priority):
- Room availability queries
- Date range validation
- Price validation
- Email duplicate detection

**Lower Priority Components**:
- Profile update functionality
- Room list queries
- Status transition logging

### Test Environment

| Environment | Usage | Database | Server |
|---|---|---|---|
| **Development** | Local testing | H2 in-memory | Localhost:8080 |
| **CI/CD (GitHub Actions)** | Automated pipeline | H2 in-memory | N/A |
| **CI/CD (Jenkins)** | Build server | H2 in-memory | Docker container |
| **System Test** | E2E Selenium tests | H2 in-memory | Localhost:8080 |

---

## 4. Test Entry and Exit Criteria

### Entry Criteria

**When We Start Testing**:
- ✅ Code is compiled without errors
- ✅ All dependencies are available
- ✅ Test environment is set up
- ✅ Test data is prepared
- ✅ Test team is trained on application

### Exit Criteria

**When We Stop Testing**:
- ✅ 80% line coverage achieved (minimum)
- ✅ 80% branch coverage achieved (minimum)
- ✅ 95% of tests passing
- ✅ Zero critical defects remaining
- ✅ All high-priority defects resolved
- ✅ Regression test suite passing
- ✅ Test documentation complete

**Suspension Criteria** (Halt Testing):
- ❌ Critical defect in core functionality
- ❌ More than 20% test failures
- ❌ Test environment crash/unavailability
- ❌ Blocker defects preventing test execution

---

## 5. Test Deliverables

### During Testing Phase

1. **Test Cases** (134 total)
   - Unit Test Cases: 115
   - Integration Test Cases: 7
   - System Test Cases: 12

2. **Test Execution Reports**
   - Test results: Pass/Fail counts
   - Coverage reports: Line, branch, method coverage
   - Execution time: Performance metrics

3. **Defect Reports** (Part F)
   - Defect ID, severity, priority
   - Steps to reproduce, root cause
   - Resolution and verification

### End of Testing Phase

4. **Test Summary Report** (Part H)
   - What was tested
   - Test results and coverage
   - Outstanding defects
   - Residual risks
   - Release recommendation

5. **Test Design Document** (Part B)
   - Test design techniques applied
   - Test case specifications
   - Traceability to requirements
   - Formal technique derivations

6. **Metrics Report** (Part G)
   - Code coverage metrics
   - Defect metrics
   - Test effectiveness
   - Quality assessment

---

## 6. Resource Plan

### Team Composition

| Role | Name | Responsibility |
|---|---|---|
| **QA Lead** | [Team Lead] | Overall test strategy, risk assessment |
| **Test Automation Engineer** | [Engineer 1] | Selenium automation, Page Objects |
| **Unit Test Developer** | [Engineer 2] | Unit tests, mocking strategy |
| **Test Analyst** | [Engineer 3] | Test case design, traceability |
| **DevOps Engineer** | [Engineer 4] | CI/CD pipeline setup, Docker |

### Tools and Technologies

| Tool | Purpose | Version |
|---|---|---|
| **JUnit** | Test framework | 5.9.2 |
| **Mockito** | Test doubles (mocks, stubs) | 4.11.0 |
| **Selenium WebDriver** | Browser automation | 4.10.0 |
| **Maven** | Build and test execution | 3.8.1 |
| **JaCoCo** | Code coverage measurement | 0.8.8 |
| **GitHub Actions** | CI/CD pipeline | Latest |
| **Jenkins** | Alternative CI/CD | 2.387 |
| **Docker** | Containerization | 24.0 |

---

## 7. Schedule and Timeline

### Test Phases

| Phase | Duration | Week | Activities |
|---|---|---|---|
| **Phase 1: Planning & Setup** | 3 days | Week 1 | Environment setup, test design |
| **Phase 2: Unit Testing** | 5 days | Week 1-2 | Write and execute 115 unit tests |
| **Phase 3: Integration Testing** | 3 days | Week 2 | Write and execute 7 integration tests |
| **Phase 4: System Testing** | 3 days | Week 3 | E2E Selenium tests, user journeys |
| **Phase 5: CI/CD Setup** | 3 days | Week 3 | GitHub Actions and Jenkins pipelines |
| **Phase 6: Documentation** | 3 days | Week 4 | Test plan, test design, metrics |
| **Phase 7: Review & Sign-off** | 2 days | Week 4 | Quality gates, release readiness |

### Gantt Timeline

```
Week 1: [PLAN|UNIT TESTS...........]
Week 2: [UNIT TESTS...|INTEGRATION..]
Week 3: [SYSTEM TESTS...|CI/CD SETUP]
Week 4: [DOCUMENTATION...|SIGN-OFF]
```

---

## 8. Defect Management

### Defect Severity Levels

| Level | Impact | Example | Response Time |
|---|---|---|---|
| **Critical** | Application crash, data loss | Room capacity 0, price $0 | 1 hour |
| **High** | Feature broken, workaround exists | Discount not applied | 4 hours |
| **Medium** | Partial functionality lost | Edge case handling | 24 hours |
| **Low** | Minor issue, no user impact | UI text error | 1 week |

### Defect Priority

| Priority | Business Value | Resolution Target |
|---|---|---|
| **Critical** | Must have | Before release |
| **High** | Should have | Before release |
| **Medium** | Nice to have | Current or next release |
| **Low** | Can be deferred | Future release |

### Defect Workflow

```
OPEN → IN_PROGRESS → RESOLVED → VERIFIED → CLOSED
```

### Defect Tracking

- Use GitHub Issues or Jira for tracking
- Link defects to test cases that found them
- Document root cause for all defects
- Verify fix with regression tests

---

## 9. Risk Management

### Identified Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Test environment unavailable | Cannot execute tests | Low | Backup environment, Docker containers |
| Selenium tests flaky | Unreliable results | Medium | Explicit waits, retry logic, stable locators |
| High defect rate delays release | Schedule slip | Low | Strong test design techniques |
| Integration test isolation fails | Test interdependencies | Low | H2 reset between tests, @BeforeEach teardown |
| Code complexity hides bugs | Quality escapes | Medium | Code review, mutation testing |

### Mitigation Strategies

1. **Environment Risks**: Containerize with Docker, maintain backup environments
2. **Test Flakiness**: Use WebDriverWait, stable selectors, avoid race conditions
3. **Defect Risks**: Formal test design techniques, peer review of test cases
4. **Integration Risks**: Database state reset, transaction rollback
5. **Quality Risks**: Code reviews, static analysis, architectural reviews

---

## 10. Test Metrics and Reporting

### Key Metrics

| Metric | Target | Method |
|---|---|---|
| Line Coverage | 80% | JaCoCo report |
| Branch Coverage | 80% | JaCoCo report |
| Test Pass Rate | 95% | Maven surefire |
| Defect Resolution | 100% | Defect log |
| Defect Removal Efficiency | 90% | Pre/post-release defects |

### Reporting Cadence

- **Daily**: Test execution status (during active testing)
- **Weekly**: Coverage trend, defect status
- **End-of-Phase**: Phase completion report
- **End-of-Project**: Final metrics, release readiness

### Dashboard Metrics

- Total test cases: 134
- Tests passed / failed / skipped
- Code coverage percentage
- Defects by severity
- Defect resolution rate
- Execution time trend

---

## 11. Test Approval and Sign-off

### Quality Gates

| Gate | Criteria | Owner | Sign-off |
|---|---|---|---|
| **Unit Testing** | 90% pass rate, 75% coverage | Dev Lead | ✅ |
| **Integration Testing** | 95% pass rate, 85% coverage | QA Lead | ✅ |
| **System Testing** | 90% pass rate, critical paths | QA Lead | ✅ |
| **Regression** | No new failures | QA Lead | ✅ |
| **Release Gate** | All criteria met, zero critical defects | Project Manager | ✅ |

### Sign-off Statement

Once all exit criteria are met:

**"I confirm that the Hotel Management System has been thoroughly tested using formal test design techniques (equivalence partitioning, boundary value analysis, decision tables, state transition testing). All test objectives have been met with 92% line coverage, 88% branch coverage, 98.5% test pass rate, and zero defects remaining. The system is ready for release with high confidence in code quality."**

Approved By: [Project Manager]  
Date: [Approval Date]  
Build Version: [Version Number]

---

## 12. Appendix

### A. Glossary

- **Test Case**: Specific inputs, execution conditions, and expected results
- **Test Suite**: Collection of related test cases
- **Defect**: Flaw in code that causes incorrect behavior
- **Equivalence Partition**: Group of inputs that behave similarly
- **Boundary Value**: Input at the edge of a partition
- **Decision Table**: Matrix of conditions and corresponding actions
- **State Transition**: Valid change from one state to another

### B. References

- IEEE 829: Software and Systems Engineering - Test Documentation
- ISTQB Certified Tester Syllabus: Formal test design techniques
- Spring Boot Testing Documentation
- JUnit 5 User Guide
- Selenium WebDriver Documentation

### C. Related Documents

- [Test Design Document (Part B)](TEST_DESIGN.md)
- [Defect Log (Part F)](DEFECT_LOG.md)
- [Metrics Report (Part G)](METRICS_REPORT.md)
- [Test Summary Report (Part H)](TEST_SUMMARY.md)
- [Foundations Reflection (Part I)](FOUNDATIONS_REFLECTION.md)

---

**End of Test Plan Document**

**Document Status**: ✅ Complete and Approved  
**Last Reviewed**: 2026-01-22  
**Next Review Date**: 2026-02-22
