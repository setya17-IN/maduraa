# Test Matrix — Initial Baseline

| Area | Scenario | Expected Result | Status |
|---|---|---|---|
| Authentication | Valid login | User receives valid session | Planned |
| Authentication | Invalid login | Error is shown and session is not created | Planned |
| Authentication | Password hashing and verification | Password is stored as a bcrypt hash; matching and non-matching passwords are handled correctly | Covered by `server/test/authSecurity.test.js` |
| Authentication | JWT generation and signature | Token contains user claims, expires after 24 hours, and fails verification with the wrong secret | Covered by `server/test/authSecurity.test.js` |
| Products | Create product | Product is stored and visible | Planned |
| Products | Update product | Product data is updated | Planned |
| Products | Delete product | Product is removed according to business rules | Planned |
| Transactions | Create transaction | Transaction is saved and stock decreases | Planned |
| Dashboard | Load summary | Revenue, transaction, product, and stock metrics are displayed | Planned |
| Reports | Filter date range | Report reflects selected period | Planned |
