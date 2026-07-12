# i18n ES/EN Admin Dashboard Final Sweep V2 - Notificaciones fix v1

Scope:
- `/dashboard/notificaciones`
- `NotificacionModal`
- `NotificacionForm`
- `NotificacionTable`
- `NotificacionViewModal`

Changes:
- Localized the notifications center UI for ES/EN.
- Localized filters, KPI cards, operational health panels, priorities, table headers, empty/loading states, toast messages and confirmations.
- Localized notification status/type/channel/terminal labels shown in the table and detail modal.
- Localized the create/edit notification modal: base template, type, channel, status, recipients, terminal output block, neon color, duration/frequency, and submit buttons.
- No DB, endpoints, Swagger/OpenAPI, notification services, terminal delivery logic or data model changes.

Validation suggested:
- Toggle ES/EN in `/dashboard/notificaciones`.
- Open `New notification`, check select options and terminal block in EN.
- Check table rows, badges, filters, view modal and edit modal in EN.
- Run `npm run build`.
