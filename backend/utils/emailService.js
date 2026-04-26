const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (studentEmail, studentName, courseDetails) => {
  try {
    // Create a transporter using environment variables or a test account for sandbox
    let transporter;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Real Gmail SMTP (with auto-trim for spaces)
      const userEmail = process.env.EMAIL_USER.trim();
      const appPassword = process.env.EMAIL_PASS.replace(/\s+/g, '').trim();

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: userEmail,
          pass: appPassword
        }
      });
      console.log(`Using real Gmail transporter for: ${userEmail}`);
    } else {
      // Sandbox mode using Ethereal Email
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('Using Sandbox (Ethereal Email) transporter');
    }

    const mailOptions = {
      from: '"Roots Institute" <noreply@rootsinstitute.lk>',
      to: studentEmail,
      subject: 'Welcome to Roots Institute!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4A1D52;">Welcome, ${studentName}!</h1>
          </div>
          <p>We are excited to inform you that your registration at Roots Institute has been successfully completed.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Enrolled Course:</strong> ${courseDetails}</p>
          </div>
          <p>Our team is looking forward to supporting you on your educational journey. If you have any questions, please feel free to reach out to us.</p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888888; text-align: center;">ROOTS Integrated Management System. This is an automated email, please do not reply.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (!process.env.EMAIL_USER) {
      console.log("Message sent in Sandbox mode: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } else {
      console.log("Real email sent to: %s", studentEmail);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};


/* ── Result Notification Email ────────────────────────────────────────────── */
const sendResultEmail = async (studentEmail, studentName, { course, mcqMarks, essayMarks, total, grade }, isUpdate = false) => {
  try {
    const userEmail = process.env.EMAIL_USER?.trim();
    const appPassword = process.env.EMAIL_PASS?.replace(/\s+/g, '').trim();

    if (!userEmail || !appPassword) {
      console.warn('Email credentials not configured. Skipping result email.');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: userEmail, pass: appPassword },
    });

    // Grade badge colour
    const gradeColor = { 'A': '#16a34a', 'A+': '#15803d', 'B': '#2563eb', 'C': '#d97706', 'S': '#7c3aed' }[grade] || '#dc2626';

    const subject = isUpdate
      ? `Your Exam Result Has Been Updated – ${course}`
      : `Your Exam Result – ${course}`;

    const headingText = isUpdate ? 'Exam Result Updated' : 'Exam Result';
    const bodyText = isUpdate
      ? 'Your exam result has been <strong>updated</strong> by the institute. Here is the latest summary of your performance:'
      : 'Your exam result has been recorded. Here is a summary of your performance:';

    const mailOptions = {
      from: '"Roots Institute" <noreply@rootsinstitute.lk>',
      to: studentEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #4A1D52, #7c3aed); border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #fff; margin: 0; font-size: 26px;">${headingText}</h1>
            <p style="color: #e9d5ff; margin: 6px 0 0;">${course}</p>
          </div>

          <p style="font-size: 15px; color: #333;">Dear <strong>${studentName}</strong>,</p>
          <p style="font-size: 14px; color: #555;">${bodyText}</p>

          <div style="background: #f9f5ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e9d5ff;">
                <td style="padding: 10px 6px; font-weight: 600; color: #4A1D52;">MCQ Marks</td>
                <td style="padding: 10px 6px; text-align: right; font-size: 16px;">${mcqMarks} / 100</td>
              </tr>
              <tr style="border-bottom: 1px solid #e9d5ff;">
                <td style="padding: 10px 6px; font-weight: 600; color: #4A1D52;">Essay Marks</td>
                <td style="padding: 10px 6px; text-align: right; font-size: 16px;">${essayMarks} / 100</td>
              </tr>
              <tr style="border-bottom: 1px solid #e9d5ff;">
                <td style="padding: 10px 6px; font-weight: 600; color: #4A1D52;">Total (50/50)</td>
                <td style="padding: 10px 6px; text-align: right; font-size: 16px;">${Number(total).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding: 10px 6px; font-weight: 600; color: #4A1D52;">Grade</td>
                <td style="padding: 10px 6px; text-align: right;">
                  <span style="background: ${gradeColor}; color: #fff; padding: 4px 14px; border-radius: 20px; font-weight: 700; font-size: 16px;">${grade}</span>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #666;">If you have any questions about your results, please contact the institute.</p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <p style="font-size: 11px; color: #aaa; text-align: center;">ROOTS Integrated Management System &nbsp;·&nbsp; Automated email, please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`${isUpdate ? 'Update' : 'Result'} email sent to: ${studentEmail} (${info.messageId})`);
    return { success: true };
  } catch (error) {
    console.error('Error sending result email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWelcomeEmail, sendResultEmail };

