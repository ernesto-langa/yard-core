<!--
  Status: Official Framework Standards
-->

<div align="center">

# YARD Framework Documentation

**Official standards, patterns, and structures for all YARD projects**

🌐 **EN** | [PT](../pt/framework/README.md)

[Inventory](#-documentation-inventory) · [Framework vs Project](#-framework-vs-project-documentation) · [Usage](#-usage-guidelines)

</div>

---

## 📋 Overview

This directory contains **official YARD framework documentation** that defines standards, patterns, and structures applicable across all YARD projects (greenfield and brownfield).

**Purpose**: Separate framework-level documentation from project-specific implementation details.

---

## 📚 Documentation Inventory

| Document | Purpose | Audience |
|---|---|---|
| [**coding-standards.md**](coding-standards.md) | JavaScript/TypeScript standards, naming conventions, code quality rules | All developers |
| [**tech-stack.md**](tech-stack.md) | Technology choices, frameworks, libraries, and tooling standards | Architects, developers |
| [**source-tree.md**](source-tree.md) | Directory structure, file organization, and project layout patterns | All team members |

---

## 🏗️ Framework vs. Project Documentation

### Framework Documentation (`docs/framework/`)

- **Scope**: Portable across all YARD projects
- **Examples**: Coding standards, tech stack, source tree structure
- **Lifecycle**: Lives in `ernesto-langa/yard-core` repository
- **Changes**: Require framework-level approval

### Project Documentation (`docs/architecture/project-decisions/`)

- **Scope**: Specific to a given implementation
- **Examples**: Decision analysis, architectural reviews, integration decisions
- **Lifecycle**: Lives in the project repository permanently
- **Changes**: Project team decides

---

## 🧭 Usage Guidelines

### For Developers

1. **Read framework docs during onboarding** — Understand YARD standards
2. **Reference during development** — Ensure compliance with framework patterns
3. **Propose changes via PRs** — Framework standards evolve with community input

### For Architects

1. **Maintain framework docs** — Keep standards current and practical
2. **Review PRs for compliance** — Ensure code follows documented standards
3. **Align project decisions** — Document deviations in `docs/architecture/project-decisions/`

### For YARD Framework Maintainers

1. **Version control** — Track changes to framework standards
2. **Cross-project consistency** — Apply standards uniformly
3. **Deprecation notices** — Give advance notice before removing or changing standards

---

## 🔗 Related Documents

- **Architecture Overview**: [`docs/architecture/`](../architecture/)
- **Installation Guide**: [`docs/installation/`](../installation/)
- **Platform Guides**: [`docs/platforms/`](../platforms/)

---

**Maintainer**: YARD Framework Team
