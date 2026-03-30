# Implementation Plan: Donor Thank-You Email System

To enhance the donor experience and provide real-time feedback, we will implement an automated email system that notifies donors when their food donation has been successfully delivered to an NGO by a rider.

## 1. Centralized Email Utility
We will create a reusable email utility in `lib/email.ts` using the `resend` library. This will allow us to maintain a consistent email configuration and easily add new email types in the future.

### Key Actions:
- Create `lib/email.ts`.
- Initialize `Resend` with the `RESEND_API_KEY` from environment variables.
- Export a function `sendThankYouEmail(to: string, donorName: string, foodTitle: string)` that sends a styled HTML email.

## 2. Update Delivery API Route
The core logic for finalizing a donation "mission" resides in `app/api/requests/[id]/deliver/route.ts`. We will update this route to trigger the donor email.

### Key Actions:
- Update the Prisma query to include the `donor` information nested within the `donation`.
- After the database transaction succeeds and notifications are created, invoke the `sendThankYouEmail` function.
- Ensure the donor's name and the donation title are passed to the email function for personalization.

## 3. Email Experience (Design)
The email will be designed with a premium, gratitude-focused aesthetic:
- **Header**: ShareBite branding with a "Mission Accomplished" theme.
- **Body**: Personalized message thanking the donor for their specific item (e.g., "Your Extra Lunch Biryani has been delivered").
- **Impact Statement**: A reminder of the positive change they've made.
- **Footer**: Support links and social handles.

## 4. Verification & Testing
- **Environment Variables**: Verify `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are correctly set in the production environment.
- **Delivery Flow**: Manually trigger a delivery as a rider and verify that:
    - The database updates correctly.
    - The in-app notification is sent.
    - The "Thank You" email arrives in the donor's inbox.

---

> [!IMPORTANT]
> The `RESEND_FROM_EMAIL` must be a verified domain in your Resend dashboard for production use. For testing, ensure the recipient email (donor email) is the one used to register the Resend account if using the "onboarding" tier.

> [!TIP]
> We can use Framer Motion-inspired logic in the email HTML (standard CSS animations) to make the email feel modern and alive, matching the ShareBite app aesthetic.
