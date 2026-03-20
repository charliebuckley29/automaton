import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Missing required environment variable: RESEND_API_KEY");
}

const resend = new Resend(resendApiKey);

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "Harper <harper@yourdomain.com>";

/**
 * Send a completed report email to the customer.
 */
export async function sendReportEmail(
  to: string,
  reportUrl: string,
  businessName: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your Harper Report for ${businessName} is Ready`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Your Report is Ready</h1>
        <p>Hi there,</p>
        <p>
          Great news — your marketing analysis report for
          <strong>${businessName}</strong> has been generated and is ready for
          review.
        </p>
        <p>
          <a
            href="${reportUrl}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background: #6c63ff;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            "
          >
            View Your Report
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, just reply to this email.
        </p>
        <p>— Harper</p>
      </div>
    `,
  });
}
