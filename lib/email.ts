import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailResponse {
  success: boolean;
  error?: any;
}


const ICONS = {
  TRUCK: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
  DELIVERED: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
  LOCATION: "https://cdn-icons-png.flaticon.com/512/1865/1865269.png",
  PACKAGE: "https://cdn-icons-png.flaticon.com/512/679/679821.png",
  HEART: "https://cdn-icons-png.flaticon.com/512/833/833472.png"
};

export async function sendThankYouEmail(
  to: string,
  donorName: string,
  foodTitle: string,
  deliveryPhotoUrl?: string,
  ngoName?: string,
  ngoAddress?: string
): Promise<EmailResponse> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "ShareBite Support <support@neutrondev.in>";
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: `Mission Complete: your ${foodTitle} was delivered! 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                margin: 0; padding: 0; 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f1f5f9;
                color: #1e293b;
              }
              .wrapper {
                width: 100%;
                background-color: #f1f5f9;
                padding: 40px 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 32px;
                overflow: hidden;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
              }
              .header {
                background: #0f172a;
                padding: 60px 40px;
                text-align: center;
                color: white;
              }
              .content {
                padding: 48px;
              }
              .hero-text {
                font-size: 32px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.2;
                margin-bottom: 8px;
                letter-spacing: -0.04em;
              }
              .sub-text {
                color: #64748b;
                font-size: 18px;
                line-height: 1.6;
                margin-bottom: 32px;
              }
              .delivery-card {
                background: #ffffff;
                border: 2px solid #f1f5f9;
                border-radius: 24px;
                padding: 32px;
                margin: 32px 0;
              }
              .delivery-photo {
                width: 100%;
                max-height: 350px;
                object-fit: cover;
                border-radius: 12px;
                margin-top: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              }
              .info-row {
                margin-bottom: 24px;
                display: flex;
                align-items: center;
              }
              .icon-img {
                width: 24px;
                height: 24px;
                margin-right: 12px;
                vertical-align: middle;
              }
              .info-label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #94a3b8;
                margin-bottom: 4px;
                display: block;
              }
              .info-value {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
              }
              .impact-banner {
                background: #fef2f2;
                border: 1px solid #fee2e2;
                border-radius: 16px;
                padding: 20px;
                text-align: center;
                color: #991b1b;
                font-weight: 700;
                font-size: 14px;
                margin-top: 32px;
              }
              .footer {
                padding: 40px;
                text-align: center;
                background: #f8fafc;
                color: #94a3b8;
                font-size: 12px;
                border-top: 1px solid #f1f5f9;
              }
              .button {
                display: inline-block;
                padding: 16px 36px;
                background: #ea580c;
                color: white !important;
                text-decoration: none;
                border-radius: 16px;
                font-weight: 800;
                margin-top: 32px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .badge {
                display: inline-block;
                padding: 6px 14px;
                background: #0f172a;
                color: #ffffff;
                border-radius: 100px;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <img src="${ICONS.TRUCK}" style="width: 80px; height: 80px; margin-bottom: 20px;" alt="Mission Complete" />
                  <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #fb923c;">Mission Success</h1>
                </div>
                <div class="content">
                  <center><div class="badge">Verified Delivery</div></center>
                  <h2 class="hero-text" style="text-align: center;">Hero, ${donorName}!</h2>
                  <p class="sub-text" style="text-align: center;">Your donation successfully reached the NGO. Thank you for making an impact today.</p>
                  
                  <div class="delivery-card">
                    <div style="margin-bottom: 24px;">
                      <span class="info-label">Donation Item</span>
                      <div class="info-value" style="font-size: 20px; color: #ea580c; font-weight: 900;">${foodTitle}</div>
                    </div>
                    
                    ${ngoName ? `
                    <div style="margin-bottom: 24px;">
                      <span class="info-label">Receiver</span>
                      <div class="info-value"><img src="${ICONS.HEART}" class="icon-img" /> ${ngoName}</div>
                    </div>
                    ` : ""}

                    ${ngoAddress ? `
                    <div style="margin-bottom: 32px;">
                      <span class="info-label">Location</span>
                      <div class="info-value" style="font-size: 14px; color: #64748b; font-weight: 500;">
                        <img src="${ICONS.LOCATION}" class="icon-img" /> ${ngoAddress}
                      </div>
                    </div>
                    ` : ""}

                    ${deliveryPhotoUrl ? `
                    <div style="margin-top: 32px; border-top: 2px solid #f1f5f9; padding-top: 24px;">
                      <span class="info-label">Visual Receipt (Proof of Delivery)</span>
                      <img src="${deliveryPhotoUrl}" class="delivery-photo" alt="Delivery Proof" />
                    </div>
                    ` : ""}
                  </div>

                  <div class="impact-banner">
                    <img src="${ICONS.PACKAGE}" class="icon-img" style="margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;" />
                    You've successfully diverted food waste to help those in need.
                  </div>

                  <div style="text-align: center; margin-top: 40px;">
                    <a href="https://sharebite.nuretrondev.in/donor" class="button">View Dashboard</a>
                  </div>
                </div>
                <div class="footer">
                  <p><b>ShareBite Platform</b> - Zero Waste, Zero Hunger</p>
                  <p>&copy; 2026 ShareBite Inc. All notifications are sent via secure production relays.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[EMAIL_DISPATCH_ERROR]", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[EMAIL_SERVICE_CRITICAL_ERROR]", err);
    return { success: false, error: err };
  }
}
