import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
console.log("SENDGRID_API_KEY: ", process.env.SENDGRID_API_KEY)
export async function POST(request: NextRequest) {
  try {
    const { email, formId, pdfBuffer, fileName, serviceOption } = await request.json() as {
      email: string;
      formId: string;
      pdfBuffer: string;
      fileName?: string;
      serviceOption?: '' | 'filing' | 'representation' | 'both';
    };

    console.log('Email API received:');
    console.log(`Email: ${email}`);
    console.log(`FormId: ${formId}`);
    console.log(`FileName: ${fileName}`);
    console.log(`PDF Buffer length: ${pdfBuffer ? pdfBuffer.length : 'undefined'}`);
    console.log(`PDF Buffer starts with: ${pdfBuffer ? pdfBuffer.substring(0, 50) : 'undefined'}...`);

    if (!email || !formId || !pdfBuffer) {
      return NextResponse.json(
        { error: 'Missing required fields: email, formId, or pdfBuffer' },
        { status: 400 }
      );
    }

    // Validate base64 PDF buffer
    try {
      // Test if the base64 string is valid
      const testDecode = Buffer.from(pdfBuffer, 'base64');
      console.log(`PDF buffer validation: PASSED (${testDecode.length} bytes)`);
      
      // Test if it's a valid PDF by checking the header
      const pdfHeader = testDecode.toString('ascii', 0, 4);
      console.log(`PDF header: ${pdfHeader}`);
      
      if (pdfHeader !== '%PDF') {
        console.warn('Warning: File does not appear to be a valid PDF');
      }
      
      // Test re-encoding to ensure no data loss
      const reEncoded = testDecode.toString('base64');
      if (reEncoded !== pdfBuffer) {
        console.warn('Warning: Base64 re-encoding produced different result');
      } else {
        console.log('Base64 re-encoding test: PASSED');
      }
    } catch (error) {
      console.error('PDF buffer validation: FAILED', error);
      return NextResponse.json(
        { error: 'Invalid PDF buffer format' },
        { status: 400 }
      );
    }

    // Validate required environment variables
    // if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    //   console.error('Missing SMTP configuration');
    //   return NextResponse.json(
    //     { error: 'Email service not configured. Please contact support.' },
    //     { status: 500 }
    //   );
    // }

    console.log("SMTP CREDENTIALS: ", process.env.GOOGLE_EMAIL)
    console.log("SMTP CREDENTIALS: ", process.env.APP_PASSWORD)

    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    // Get form title based on formId
    const getFormTitle = (formId: string) => {
      switch (formId.toLowerCase()) {
        case 'n4':
          return 'Notice to End Tenancy for Non-Payment of Rent (Form N4)';
        case 'n5':
          return 'Notice to End Tenancy for Interference, Damage, or Overcrowding (Form N5)';
        case 'n8':
          return 'Notice to End Tenancy at End of Term (Form N8)';
        case 'n12':
          return 'Notice to End your Tenancy, Because the Landlord, a Purchaser or a Family Member Requires the Rental Unit (Form N12)';
        default:
          return 'LTB Form';
      }
    };

    const formTitle = getFormTitle(formId);

    // Step 4 service section for N4 form (when user selected a service option)
    const isN4WithService =
      formId?.toLowerCase() === 'n4' &&
      (serviceOption === 'filing' || serviceOption === 'representation' || serviceOption === 'both');
    const serviceLabel =
      serviceOption === 'filing'
        ? 'Form N4 + Filing service (we file the form for you)'
        : serviceOption === 'representation'
          ? 'Form N4 + Representation service (we represent you)'
          : serviceOption === 'both'
            ? 'Form N4 + Filing + Representation services (we file the form and represent you)'
            : '';

    // Email content
    // const mailOptions = {
    //   from: process.env.SMTP_FROM || process.env.SMTP_USER,
    //   to: email,
    //   subject: `Your ${formTitle} is Ready for Download`,
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //       <div style="background-color: #C0111F; color: white; padding: 20px; text-align: center;">
    //         <h1 style="margin: 0; font-size: 24px;">LTB Forms</h1>
    //       </div>
          
    //       <div style="padding: 30px; background-color: #f9f9f9;">
    //         <h2 style="color: #333; margin-bottom: 20px;">Your Form is Ready!</h2>
            
    //         <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
    //           Thank you for using LTB Forms. Your completed <strong>${formTitle}</strong> is attached to this email and ready for download.
    //         </p>
            
    //         <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C0111F; margin: 20px 0;">
    //           <h3 style="color: #C0111F; margin-top: 0;">Important Information:</h3>
    //           <ul style="color: #666; line-height: 1.6;">
    //             <li>Please review the form carefully before serving it to your tenant</li>
    //             <li>Ensure all information is accurate and complete</li>
    //             <li>Keep a copy for your records</li>
    //             <li>Follow the proper legal procedures for serving the notice</li>
    //           </ul>
    //         </div>
            
    //         <div style="text-align: center; margin-top: 30px;">
    //           <p style="color: #999; font-size: 14px;">
    //             This email was sent from LTB Forms - Your trusted partner for landlord-tenant legal documents.
    //           </p>
    //         </div>
    //       </div>
    //     </div>
    //   `,
    //   attachments: [
    //     {
    //       filename: fileName || `${formId.toUpperCase()}.pdf`,
    //       content: pdfBuffer,
    //       encoding: 'base64',
    //       contentType: 'application/pdf',
    //     },
    //   ],
    // };
        // Step 4 service section – included only in the email to muhammad.bilal@algoace.com
        const step4Section = isN4WithService && serviceLabel
          ? `
            <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <h3 style="color: #0c4a6e; margin-top: 0;">Step 4 – Selected service</h3>
              <p style="color: #333; line-height: 1.6; margin: 0;">
                <strong>${serviceLabel}</strong>
              </p>
            </div>
          `
          : '';

        const baseHtmlParts = {
          header: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #C0111F; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">LTB Forms</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">Your Form is Ready!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Thank you for using LTB Forms. Your completed <strong>${formTitle}</strong> is attached to this email and ready for download.
              </p>`,
          step4Placeholder: step4Section,
          footerCommon: `
            <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C0111F; margin: 20px 0;">
              <h3 style="color: #C0111F; margin-top: 0;">Important Information:</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>Please review the form carefully before serving it to your tenant</li>
                <li>Ensure all information is accurate and complete</li>
                <li>Keep a copy for your records</li>
                <li>Follow the proper legal procedures for serving the notice</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 14px;">
                This email was sent from LTB Forms - Your trusted partner for landlord-tenant legal documents.
              </p>
            </div>
          </div>
        </div>`,
          footerWithClientEmail: `
            <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C0111F; margin: 20px 0;">
              <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                <strong>Client Email:</strong> ${email}
              </p>
              <h3 style="color: #C0111F; margin-top: 0;">Important Information:</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>Please review the form carefully before serving it to your tenant</li>
                <li>Ensure all information is accurate and complete</li>
                <li>Keep a copy for your records</li>
                <li>Follow the proper legal procedures for serving the notice</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 14px;">
                This email was sent from LTB Forms - Your trusted partner for landlord-tenant legal documents.
              </p>
            </div>
          </div>
        </div>`,
        };

        // User email: no Step 4 service section and no Client Email line
        const htmlContentUser = baseHtmlParts.header + baseHtmlParts.footerCommon;

        // Hardcoded recipient (Algoace): include Step 4 service section (for N4) and Client Email line
        const htmlContentAlgoace =
          baseHtmlParts.header + baseHtmlParts.step4Placeholder + baseHtmlParts.footerWithClientEmail;

        const attachments = [
          {
            content: pdfBuffer,
            filename: fileName || `${formId.toUpperCase()}.pdf`,
            type: "application/pdf",
            disposition: "attachment",
          },
        ];

        const fromAddr = process.env.SMTP_FROM || "info@justuslegal.co";
        const subject = `Your ${formTitle} is Ready for Download`;
        const CLIENT_EMAIL = 'info@justuslegal.ca';
        // const CLIENT_EMAIL = 'hashir.haider@algoace.com';

    // Always send 2 emails: (1) user copy without service section, (2) internal copy with service section when applicable.
    console.log('Sending email with attachment to user...');
    console.log(`Attachment filename: ${fileName || `${formId.toUpperCase()}.pdf`}`);
    console.log(`Attachment content length: ${pdfBuffer.length}`);

        // 1. User email (no Step 4 service section)
        const msgUser: any = {
          to: email,
          from: fromAddr,
          subject,
          html: htmlContentUser,
          attachments,
        };
        const responseUser = await sgMail.send(msgUser);

        // 2. Internal copy to muhammad.bilal@algoace.com (with Step 4 service section when applicable)
        const msgAlgoace: any = {
          to: CLIENT_EMAIL,
          from: fromAddr,
          subject: `Form submitted: ${formTitle}`,
          html: htmlContentAlgoace,
          attachments,
        };
        await sgMail.send(msgAlgoace);

    return NextResponse.json(
      {
        success: true,
        message: 'Email sent successfully',
        statusCode: responseUser[0].statusCode,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}
