// Print-production registration marks — used on the production-ticket
// frame in place of a flat placeholder rectangle when no real image exists
// yet (docs/CLIENT-VISUAL-DIRECTION.md §6).
export function TicketCorners() {
  return (
    <>
      <span className="ticket-corner ticket-corner-tl" aria-hidden />
      <span className="ticket-corner ticket-corner-tr" aria-hidden />
      <span className="ticket-corner ticket-corner-bl" aria-hidden />
      <span className="ticket-corner ticket-corner-br" aria-hidden />
    </>
  );
}
