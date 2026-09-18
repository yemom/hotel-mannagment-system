# Hotel Management System - Test Design Techniques

## 1. Overview
The test design strategy for the Hotel Management System is risk-based and technique-driven. It applies formal, structured software testing methodologies to ensure rigorous validation of business rules, boundaries, state lifecycles, and pricing logic.

## 2. Test Design Effectiveness

| Technique | Cases | Defects | Effectiveness |
| :--- | :--- | :--- | :--- |
| **Equivalence Partitioning** | 34 | 7 | 20.6% |
| **Boundary Value Analysis** | 24 | 6 | 25% |
| **Decision Table** | 11 | 2 | 18.2% |
| **State Transition** | 10 | 2 | 20% |

These figures demonstrate that boundary and equivalence testing were highly productive for validation-heavy logic, while decision tables and state transitions were essential for pricing and reservation lifecycle rules.

## 3. Equivalence Partitioning
The project partitions input values into valid and invalid classes, primarily targeting validation logic for Guests and Rooms.

### Examples:
**Guest Age**
*   `< 18` (Invalid)
*   `18–120` (Valid)
*   `> 120` (Invalid)

**Room Price**
*   `<= 0` (Invalid)
*   `> 0–10,000` (Valid)
*   `> 10,000` (Invalid)

**Room Capacity**
*   `0` (Invalid)
*   `1–20` (Valid)
*   `> 20` (Invalid)

The design contains 17 distinct equivalence partitions yielding 34 test cases.

## 4. Boundary Value Analysis
Boundary tests focus on values immediately surrounding the edges of the equivalence partitions, catching off-by-one errors and limit validation bugs.

### Key Boundaries Targeted:
*   **Age minimum:** 17, 18, 19
*   **Age maximum:** 119, 120, 121
*   **Price minimum:** 0, 0.01, 0.99
*   **Price maximum:** 9,999, 10,000, 10,001
*   **Capacity:** 0, 1, 19, 20, 21

The suite includes 24 boundary tests, which caught 6 defects.

## 5. Decision Table Testing
Decision tables map complex combinations of conditions to specific business actions. This is primarily utilized for the pricing and discount calculation logic.

### Conditions Evaluated:
1.  **Long stay** (>= 3 nights)
2.  **Very long stay** (7+ nights)
3.  **Senior guest** (>= 60 years)
4.  **VIP guest** (Email ending in `@vip.com`)
5.  **Off-peak season** (Based on seasonal rules)

### Extracted Rules (Examples):
*   Senior + VIP + off-peak → **25% discount**
*   Senior + non-VIP + off-peak → **15% discount**
*   VIP + long stay → **15% discount**
*   Senior + non-VIP + peak → **10% discount**
*   7+ night stay → **12% discount**
*   3–6 night stay → **5% discount**
*   No qualifying conditions → **0% discount**

## 6. State Transition Testing
State transition testing validates the allowable lifecycle changes of a Reservation. Guards are put in place to ensure invalid transitions are rejected.

### State Diagram Model:
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

### Invalid Transitions Tested (Rejected):
*   `CHECKED_IN` → `CANCELLED`
*   `PENDING` → `CHECKED_IN`
*   `CHECKED_OUT` → `CANCELLED`

State-transition tests ensure that the workflow corruption cannot occur due to out-of-order API calls.
