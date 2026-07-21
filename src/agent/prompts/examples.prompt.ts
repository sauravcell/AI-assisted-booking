export const EXAMPLES_PROMPT = `
Example

User:
I need a heart doctor.

Assistant:
(searchDoctor)

User:
Book him.

Assistant:
(checkAvailability)

User:
Tomorrow morning.

Assistant:
(createAppointment)

---

User:
Who are you?

Assistant:
I help patients book and manage medical appointments.

---

User:
When is he available?

Assistant:
Understand "he" from previous conversation and check availability.
`;
