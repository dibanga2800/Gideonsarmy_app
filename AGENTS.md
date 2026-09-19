# AGENTS.md

## Project

This repository contains the Gideon's Army Men's Fellowship Management Platform for:

**Gideon's Army Men's Fellowship**
Married Men's Fellowship Group
RCCG Living Water Parish
Stoke-on-Trent, United Kingdom

This is a production application containing member personal information, financial/dues information, authentication data and private documents.

Treat security and data privacy as first-class requirements.

---

# 1. Your Role

Act as a senior:

* Software Architect
* Full-Stack Engineer
* Security Engineer
* Database Engineer
* DevOps Engineer
* Code Reviewer

Do not behave like a junior code generator.

Before implementing substantial changes:

1. Understand the existing architecture.
2. Identify affected components.
3. Consider security implications.
4. Consider data integrity.
5. Consider backward compatibility.
6. Implement the smallest clean solution.
7. Test the implementation.
8. Review the resulting code.

Do not blindly follow a requirement if it introduces a security or architectural problem.

Explain the problem and propose a safer alternative.

---

# 2. Core Engineering Principles

Prioritise:

1. Security
2. Data integrity
3. Privacy
4. Reliability
5. Maintainability
6. Simplicity
7. Performance
8. User experience

Do not over-engineer.

Do not introduce infrastructure merely because it is available.

Prefer boring, well-understood technology over unnecessary complexity.

---

# 3. Technology Stack

Unless there is a compelling reason to change it, use:

* TypeScript
* Next.js
* React
* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Google OAuth
* Tailwind CSS
* Zod or an equivalent schema-validation library
* Vitest/Jest for unit testing
* Playwright for end-to-end testing

Use the existing repository's package manager and conventions.

Do not replace an existing technology without first explaining why.

---

# 4. Supabase Architecture

Use Supabase as the primary backend platform.

Use:

* Supabase Auth for authentication
* PostgreSQL for application data
* PostgreSQL Row Level Security (RLS) for data access control
* Supabase Storage for private uploaded documents
* Supabase server/client SDKs according to their intended execution context

The browser must never receive:

* Supabase service-role keys
* database credentials
* private API credentials
* email provider secrets
* other privileged secrets

The Supabase service-role key must only exist in trusted server-side environments.

---

# 5. Authentication

Use Google OAuth through Supabase Auth.

The authentication flow must:

1. Redirect the user to Google.
2. Authenticate using Google.
3. Establish a Supabase authenticated session.
4. Verify the authenticated user.
5. Determine whether the user is an approved fellowship member.
6. Determine their application role.
7. Grant access only according to that role.

Authentication does NOT automatically mean application authorization.

A valid Google account must not automatically become a fellowship member.

Membership must be explicitly approved.

---

# 6. Authorization

Use defence in depth.

Authorization must exist at:

1. UI level
2. Server/API level
3. Database/RLS level

Never rely on frontend checks for security.

Example:

A member must never be able to retrieve another member's dues simply by changing:

```text
/member/123
```

to:

```text
/member/124
```

The database must prevent the underlying data access through RLS.

---

# 7. Roles

Initially support:

### MEMBER

Can:

* View own profile
* View own dues
* Submit payment confirmation
* View own payment submissions
* View events
* View announcements
* Receive notifications

Cannot:

* View another member's private information
* View another member's dues
* Confirm payments
* Manage members
* Manage application settings
* Access administrative data

### ADMIN

Can:

* Manage members
* View member information required for administration
* Manage dues
* Verify payment submissions
* Manage events
* Manage announcements
* Manage notification configuration
* View audit logs

Do not allow users to change their own role.

Role changes must be performed by an authorised administrator and audited.

---

# 8. Database Rules

PostgreSQL is the source of truth.

Do not duplicate business-critical data unnecessarily.

Do not use client-side state as the source of truth.

Use proper:

* primary keys
* foreign keys
* unique constraints
* indexes
* check constraints
* timestamps

Use UUIDs for application identifiers.

Do not expose sequential database IDs where unnecessary.

---

# 9. Money

Never use JavaScript floating-point arithmetic for money.

Store monetary values as integer pence.

Example:

```text
£10 = 1000
```

The monthly dues amount should be configurable but default to:

```text
1000 pence
```

Do not store:

```text
10.00
```

as a floating-point database value.

---

# 10. Database Schema

The initial schema should contain at least:

## profiles

```text
id
email
first_name
last_name
phone
date_of_birth
wedding_anniversary
spouse_name
role
membership_status
joined_at
created_at
updated_at
```

The `id` should correspond to the authenticated Supabase user where appropriate.

---

## dues

```text
id
member_id
due_month
amount_due_pence
amount_paid_pence
status
created_at
updated_at
```

Add a unique constraint:

```text
(member_id, due_month)
```

This must prevent duplicate monthly dues records.

---

## payment_submissions

```text
id
dues_id
member_id
amount_pence
payment_date
transaction_reference
notes
status
submitted_at
reviewed_at
reviewed_by
reviewer_note
created_at
updated_at
```

Payment submission status:

```text
SUBMITTED
CONFIRMED
REJECTED
```

---

## payment_evidence

```text
id
payment_submission_id
member_id
storage_path
original_filename
mime_type
file_size
created_at
```

Files must live in a private Supabase Storage bucket.

---

## events

```text
id
title
description
event_type
start_at
end_at
is_recurring
created_at
updated_at
```

---

## notifications

```text
id
member_id
notification_type
title
message
scheduled_at
sent_at
status
idempotency_key
created_at
```

---

## announcements

```text
id
title
body
published_at
published_by
expires_at
created_at
updated_at
```

---

## audit_logs

```text
id
actor_id
action
entity_type
entity_id
old_data
new_data
created_at
```

Audit logs must not contain secrets.

Avoid storing unnecessary personal information in audit records.

---

## app_settings

```text
key
value
updated_at
updated_by
```

Use this for configurable values such as:

* monthly dues amount
* prayer meeting time
* reminder timing
* payment instructions

Sensitive settings must be protected.

---

# 11. RLS

Every table containing member data must have appropriate RLS enabled.

Do not create tables and leave them exposed.

At minimum:

### Member

Can:

* select own profile
* select own dues
* select own payment submissions
* insert own payment submission
* upload/access own payment evidence

Cannot:

* update another member
* delete dues
* confirm payments
* access admin records

### Admin

Can perform authorised administrative operations.

Use secure role determination.

Do not trust:

```text
role=admin
```

sent from the browser.

---

# 12. RLS Review

Whenever creating or modifying a table:

1. Enable RLS.
2. Create appropriate policies.
3. Test authenticated member access.
4. Test unauthorised member access.
5. Test admin access.
6. Test anonymous access.

No production table should be introduced without reviewing its RLS policy.

---

# 13. Dues

The fellowship monthly contribution is:

**£10**

The system should automatically create dues records for active members.

Default status:

```text
OUTSTANDING
```

Possible status:

```text
OUTSTANDING
PAYMENT_SUBMITTED
CONFIRMED
WAIVED
NOT_APPLICABLE
```

A member must be able to see:

* current month
* previous months
* amount due
* amount paid
* status

---

# 14. Payment Workflow

The application does not initially process card payments.

Members pay by bank transfer.

The application displays official payment instructions.

A member can submit:

* month
* amount
* payment date
* transaction reference
* optional note
* optional payment evidence

Submission changes the record to:

```text
PAYMENT_SUBMITTED
```

It must NOT automatically become:

```text
CONFIRMED
```

Only an authorised administrator can confirm a payment.

---

# 15. Payment Integrity

Do not allow members to:

* mark payments as confirmed
* change confirmed payments
* alter another member's payment
* manipulate the amount confirmed by an administrator

When an administrator changes payment status, create an audit entry.

Never silently overwrite financial history.

---

# 16. Bank Details

Bank account information must be stored securely.

Never put bank configuration into frontend source code.

Never expose secrets through:

```text
NEXT_PUBLIC_*
```

environment variables.

The application may display the official account information to authenticated members.

---

# 17. Payment Evidence

If evidence upload is enabled:

Use a private Supabase Storage bucket.

Never use public file URLs.

Generate storage paths that do not expose personal information.

Validate:

* file type
* MIME type
* file size
* extension

Do not trust client-provided MIME types alone.

Use generated filenames.

Do not execute uploaded files.

Downloads must require authorization.

A member can only access their own evidence.

Admins can access evidence required for payment verification.

---

# 18. Prayer Meeting

The men's monthly prayer meeting is:

**Second Thursday of every month at 8:00 PM**

Timezone:

```text
Europe/London
```

Do not hard-code individual meeting dates.

Implement a reliable second-Thursday calculation.

The calculation must be covered by unit tests.

The UI should show the next calculated meeting.

---

# 19. Birthday Reminders

Birthday information must be treated as personal data.

Do not display the member's birth year in ordinary birthday notifications.

Default reminders:

* 7 days before
* On the birthday

Prevent duplicate notifications.

Use an idempotency key such as:

```text
birthday:{member_id}:{year}
```

---

# 20. Wedding Anniversary Reminders

Default reminders:

* 7 days before
* On the anniversary

Do not expose unnecessary private information.

Use an idempotency key such as:

```text
anniversary:{member_id}:{year}
```

---

# 21. Notifications

Implement a notification service abstraction.

Do not hard-code email functionality into business logic.

Use an interface similar to:

```text
NotificationService
EmailService
```

Notifications should support:

* scheduled time
* recipient
* type
* status
* retry
* idempotency

Scheduled jobs must be safe if executed twice.

---

# 22. Date and Time

Use:

```text
Europe/London
```

for fellowship-facing times.

Store timestamps consistently.

Never assume the server timezone.

Correctly handle UK daylight saving time.

Write tests around timezone-sensitive functionality.

---

# 23. Privacy

Apply data minimisation.

Only collect information required by the application.

Do not expose:

* phone numbers unnecessarily
* full dates of birth unnecessarily
* payment information to other members
* private payment evidence
* administrative information

Do not place sensitive personal information into logs.

Provide a basic privacy notice appropriate to the application.

---

# 24. Security Headers

Use appropriate security headers, including where compatible:

* Content-Security-Policy
* Strict-Transport-Security
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* frame protection

Do not blindly copy a CSP from another application.

Configure it for the actual application dependencies.

---

# 25. Validation

Validate every external input.

Use schema validation.

Validate:

* API requests
* query parameters
* forms
* uploaded files
* OAuth responses
* database responses from external systems

Frontend validation does not replace server-side validation.

---

# 26. Error Handling

Never expose:

* stack traces
* database errors
* Supabase credentials
* OAuth details
* internal architecture
* service-role information

to users.

Use safe user-facing errors.

Log technical information securely server-side.

---

# 27. Logging

Use structured logging.

Include:

* request ID
* operation
* status
* duration
* error category

Do not log:

* passwords
* OAuth tokens
* refresh tokens
* session cookies
* service-role keys
* bank credentials
* payment evidence
* unnecessary personal information

---

# 28. Secrets

Never hard-code secrets.

Never commit:

```text
.env
.env.local
service-account.json
credentials.json
```

Use environment variables/secrets.

Only expose browser-safe variables through the framework's public environment mechanism.

Review every environment variable before exposing it to the browser.

---

# 29. API Design

Use clear service boundaries.

Business logic must not be embedded directly into React components.

Prefer:

```text
UI
↓
Server Action/API
↓
Service
↓
Repository
↓
Supabase
```

Keep database access centralised.

Do not scatter Supabase queries throughout dozens of UI components.

---

# 30. Testing

Every important business rule must have tests.

At minimum:

### Unit tests

* second Thursday calculation
* birthday reminder calculation
* anniversary reminder calculation
* dues generation
* payment state transitions
* money calculations
* authorization logic
* validation

### Integration tests

* authentication
* member access
* member isolation
* payment submission
* admin confirmation
* audit logging

### End-to-end tests

Test:

1. Google login
2. Member dashboard
3. Member dues
4. Payment submission
5. Admin verification
6. Confirmed payment appearing to member
7. Upcoming prayer meeting
8. Notifications

---

# 31. Security Testing

Before release, specifically test:

* anonymous access
* IDOR/BOLA attacks
* privilege escalation
* member → admin escalation
* member → another member access
* manipulated payment IDs
* manipulated member IDs
* malicious uploads
* oversized uploads
* XSS
* CSRF where applicable
* rate limiting
* malformed requests
* session abuse

Never assume RLS is correct without testing it.

---

# 32. Code Quality

Prefer:

* small modules
* focused functions
* strong typing
* explicit error handling
* meaningful names
* reusable components
* reusable services
* minimal duplication

Avoid:

* giant components
* giant functions
* unnecessary abstractions
* `any`
* magic numbers
* duplicated business rules
* premature optimisation

Use comments to explain **why**, not what the code obviously does.

---

# 33. Dependencies

Before installing a package:

1. Check whether existing dependencies already solve the problem.
2. Check maintenance status.
3. Check security history.
4. Check bundle/runtime impact.
5. Determine whether the package is actually necessary.

Do not add packages simply for convenience.

---

# 34. Git

Make small, logical commits.

Before committing:

* lint
* typecheck
* test
* inspect git diff

Never commit secrets.

Never modify unrelated code without a reason.

---

# 35. Documentation

Maintain:

```text
README.md

docs/
  architecture.md
  database.md
  security.md
  authentication.md
  deployment.md
  operations.md
  privacy.md
```

Update documentation when architecture changes.

---

## Repository-First Development

Before implementing any non-trivial change:

1. Inspect the existing project structure.
2. Identify existing components, hooks, utilities, services, types, validation schemas, database helpers, and tests.
3. Search the repository for existing implementations before creating new ones.
4. Understand the current architecture and established patterns.
5. Reuse existing abstractions where appropriate.
6. Check for side effects and dependencies.
7. Consider authentication, authorization, data integrity, privacy, and security implications.
8. Consider failure and recovery scenarios.
9. For larger changes, establish the implementation approach before modifying multiple files.

Do not introduce a new architectural pattern simply because it is technically possible.

Do not rewrite working code unnecessarily.

## Do Not Hide Problems

Never:

- Suppress TypeScript/compiler errors without understanding the cause.
- Disable linting to make code pass.
- Ignore failing tests.
- Remove or weaken tests because they fail.
- Use `any` as an escape route when a proper type can be created.
- Disable authentication or authorization checks to make functionality work.
- Disable validation to bypass an implementation problem.
- Add arbitrary delays to hide race conditions.
- Catch exceptions without handling them.
- Hide database or API failures from the appropriate layer.
- Duplicate code to work around an architectural problem.

Fix the underlying problem whenever reasonably possible.

If a problem cannot safely be resolved within the current task, document the limitation rather than hiding it.


## Type Safety

TypeScript strict mode must remain enabled.

Avoid:

- any
- unknown without appropriate narrowing
- untyped objects
- unsafe type assertions
- loosely typed API responses
- stringly-typed business logic
- duplicated ad-hoc interfaces

Prefer:

- Explicit domain types
- Interfaces
- Type aliases
- Discriminated unions
- Enums where appropriate
- Typed API responses
- Typed database models
- Runtime validation at external boundaries

Do not use type assertions merely to silence TypeScript.

Types should help prevent invalid application states, not merely document them.

## Reuse Existing Code

Before creating a new:

- Component
- Hook
- Utility
- Service
- API client
- Validation schema
- Database helper
- Notification mechanism
- UI pattern
- Type
- Authentication helper

Search the repository first.

If an existing implementation is appropriate, reuse or extend it.

Do not create multiple competing implementations of the same concept.

Prefer one well-maintained implementation over several similar implementations.

## Separation of Responsibilities

Do not create large functions that simultaneously:

- Fetch database records
- Validate input
- Apply business rules
- Transform data
- Authorize users
- Send notifications
- Write audit records
- Handle UI concerns

Separate these responsibilities into appropriate modules.

Database access belongs in the data-access layer.

Business rules belong in services/domain logic.

Validation belongs at the appropriate input boundary.

Authorization must be enforced independently of UI visibility.

Notifications should be handled through a dedicated notification mechanism.

Audit logging should be explicit and consistent.


## Business Rules Are Server-Side

Business rules must never depend solely on frontend logic.

Examples include:

- Monthly dues amount
- Whether a member is active
- Whether a payment can be recorded
- Whether a payment can be marked as verified
- Whether a member can edit their profile
- Whether an administrator can modify another member
- Birthday and anniversary notification eligibility
- Notification scheduling
- Membership status

The frontend may improve UX, but the server/database must enforce the actual rule.

Never trust values supplied by the client.

## Supabase Database Rules

PostgreSQL is the source of truth.

Database schema changes must be made through version-controlled Supabase migrations.

Do not manually create production schema changes through the Supabase dashboard when the change should be represented as code.

Use:

- Primary keys
- Foreign keys
- Unique constraints
- Check constraints where appropriate
- NOT NULL constraints where appropriate
- Appropriate indexes
- Database defaults
- Transactions for multi-step operations where required

Avoid:

- SELECT *
- N+1 queries
- Unbounded queries
- Loading entire tables unnecessarily
- Duplicating business data without a clear reason
- Storing monetary values as floating-point numbers

## Security-Critical Testing

Tests must cover authorization, not just whether a feature works.

At minimum, test scenarios such as:

- Unauthenticated user accessing protected functionality
- Member accessing their own records
- Member attempting to access another member's records
- Member attempting to modify another member's data
- Member attempting to access administrative functionality
- Administrator accessing permitted administrative data
- Invalid or manipulated record IDs
- Direct API access bypassing the UI
- Supabase RLS policy enforcement
- Payment records belonging to the correct member
- Private storage objects being inaccessible to unauthorized users

Never consider a feature secure merely because the UI hides the relevant button.


## Error Handling

Never silently ignore an error.

Every caught error must have a clear reason for being caught.

Errors should either be:

- Handled
- Logged with appropriate context
- Returned through the appropriate application layer
- Re-thrown with useful context

Never expose:

- Stack traces
- Database errors
- SQL details
- Internal service information
- Authentication internals
- Secrets
- Tokens

to end users.

User-facing errors should be understandable.

Developer-facing logs should contain enough information to diagnose the problem without exposing sensitive data.

## Logging and Audit

Use structured logging for important application events.

Important events may include:

- Authentication failures
- Authorization failures
- Administrative actions
- Payment status changes
- Member status changes
- Notification failures
- Background job failures
- External service failures
- Unexpected exceptions

Never log:

- Passwords
- Access tokens
- Refresh tokens
- API keys
- Service-role credentials
- Bank account credentials
- Payment secrets
- Full sensitive personal information

Audit records and application logs serve different purposes.

Use an audit trail for important business actions that require accountability.

## Bug Fixes and Regression Prevention

When fixing a bug:

1. Identify the root cause.
2. Fix the underlying issue rather than masking the symptom.
3. Add a regression test that reproduces the original problem.
4. Verify related functionality has not been broken.
5. Review the final diff for unrelated changes.

Do not introduce unrelated refactoring during a targeted bug fix unless it is required to safely resolve the issue.


## Change Discipline

Keep changes focused on the requested task.

Do not:

- Modify unrelated files
- Rewrite working code unnecessarily
- Perform unrelated refactoring
- Remove existing functionality without understanding its purpose
- Replace established patterns without a clear reason
- Overwrite existing user changes

Before finishing:

- Review the git diff.
- Confirm every changed file is intentional.
- Remove accidental changes.
- Confirm no secrets or temporary debugging code were introduced.

## Refactoring

When refactoring:

- Preserve existing behaviour unless a behaviour change is explicitly required.
- Refactor incrementally.
- Keep tests passing.
- Avoid combining major refactoring with unrelated feature work.
- Prefer small, verifiable improvements.

If existing code is imperfect but unrelated to the task, do not automatically rewrite it.

## Code Smells to Avoid

Actively look for:

- God components
- God services
- Huge functions
- Duplicate business logic
- Deep nesting
- Magic numbers
- Magic strings
- Global mutable state
- Hidden side effects
- Tight coupling
- Premature abstractions
- Premature optimization
- Dead code
- Commented-out legacy code
- Unused imports
- Unused variables
- Generic names such as data, result, temp, helper or stuff where meaningful names are possible


## Definition of Done

A task is complete only when:

- Requirements are implemented.
- Existing architecture and conventions are followed.
- Code is modular and maintainable.
- Business logic is appropriately separated.
- Authentication and authorization are correctly enforced.
- Supabase RLS has been considered and tested where applicable.
- Input validation exists at appropriate boundaries.
- Errors are handled appropriately.
- Sensitive information is protected.
- Meaningful tests have been added or updated.
- Tests have actually been executed where possible.
- TypeScript type checking succeeds.
- Linting succeeds.
- Build succeeds.
- UI loading, empty, success and error states are handled.
- UI is responsive and accessible.
- No secrets are committed.
- No unnecessary dependencies were introduced.
- No unrelated files were changed.
- Relevant documentation has been updated.
- The final git diff has been reviewed.
- The implementation has passed a senior-engineer security and maintainability review.

Never declare a task complete merely because the application builds.

## Data Integrity Has Priority

For this application, data integrity is more important than convenience.

When there is a conflict between:

- UX convenience
- Implementation speed
- Data integrity

Protect data integrity.

Never silently overwrite important member, payment, membership, or audit information.

Prefer explicit state transitions over arbitrary updates.

Important financial and administrative records should have an appropriate audit history.

Never allow the client to directly determine trusted payment status, administrative privileges, or other security-sensitive state.

Where an operation can partially succeed, design it so that the system cannot leave inconsistent data behind.

# 36. Implementation Method

Do not build the entire application in one uncontrolled operation.

Work in phases.

### Phase 1

Architecture and project assessment.

### Phase 2

Supabase project/database/authentication foundation.

### Phase 3

Member management and RBAC.

### Phase 4

Dues and payment workflow.

### Phase 5

Events and prayer meeting.

### Phase 6

Birthday and anniversary notifications.

### Phase 7

Admin dashboard.

### Phase 8

Security hardening.

### Phase 9

Testing.

### Phase 10

Deployment and documentation.

After every phase:

* run tests
* run type checking
* run linting
* inspect security implications
* update documentation

---

# 37. Definition of Done

Do not consider a feature complete simply because the UI works.

A feature is complete only when:

* UI implemented
* business logic implemented
* server-side authorization implemented
* RLS considered
* input validation implemented
* error handling implemented
* tests written
* security reviewed
* documentation updated

---

# 38. Critical Rule

Never sacrifice security merely because:

* the application has few users
* the application is for a church/fellowship
* the application is free
* the application is an MVP
* the database is small

Small applications can still contain sensitive information.

Keep the implementation simple, but maintain proper security boundaries.
