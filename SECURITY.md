# Security Policy

## Reporting a vulnerability

Please do not disclose security vulnerabilities in public issues.

Use GitHub's private vulnerability reporting/security advisory workflow when available. Include:

- affected component and file
- impact and severity
- reproducible steps or proof of concept
- affected version/commit
- suggested mitigation, if known

Do not include real credentials, payment secrets, customer data, or other sensitive information in a report.

## Supported versions

The `main` branch is the actively maintained development target. Production deployments should use a reviewed, tested commit rather than an unverified development snapshot.

## Security expectations

Empire handles authentication, customer data, inventory, orders, payments, seller wallets, and payouts. Security changes affecting authorization or financial state require regression tests and must pass the repository security and CI gates before release.
