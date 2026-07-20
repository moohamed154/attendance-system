# Changelog

## [1.1.0] - Refactoring & Architecture Upgrade (Current)

### Added
- **Centralized Documentation:** Added an extensive `docs/` folder containing Architecture, Decisions, Business Rules, and an AI Guide to assist future development.
- **Domain-Driven Architecture:** Refactored the `components/` and `actions/` directories into specific domains (`attendance`, `students`, `payments`, `settings`, `shared`) to improve maintainability and predictability.
- **Feature Matrix:** Added a complete matrix of features to track completion and dependencies.

### Changed
- **Component Paths:** Updated all import paths across the application to reflect the new domain-based component structure.
- **Action Paths:** Grouped scattered server actions into domain folders.

### Preserved
- **100% Backward Compatibility:** All existing functionality, databases, and UI elements remain exactly as they were in version 1.0.0.

---

## [1.0.0] - Initial Release

### Added
- Initial Attendance tracking mechanism using QR Code scanner.
- Student Management and Dashboard.
- Student portal with QR ID card rendering and downloading.
- Basic payment tracking system.
- Backup and Restore capabilities using SQLite.
- Arabic i18n support.
