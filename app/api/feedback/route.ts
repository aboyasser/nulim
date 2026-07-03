import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const FEEDBACK_TYPES: Record<string, string> = {
  suggestion: '💡 اقتراح تحسين',
  missing_data: '📊 بيانات ناقصة أو خاطئة',
  bug: '🐛 مشكلة تقنية',
  other: '💬 أخرى',
};

export async function POST(req: Request) {
  try {
    const { name, type, message } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'الرسالة مطلوبة ولا يمكن أن تكون فارغة.' } },
        { status: 400 }
      );
    }

    const feedbackTypeLabel = FEEDBACK_TYPES[type] || type || 'ملاحظة عامة';
    const feedbackItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: name?.trim() || 'مجهول',
      type: type || 'suggestion',
      typeLabel: feedbackTypeLabel,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // 1. Save to local JSON file
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'feedbacks.json');

    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      let feedbacks = [];
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        try {
          feedbacks = JSON.parse(fileData);
          if (!Array.isArray(feedbacks)) {
            feedbacks = [];
          }
        } catch {
          feedbacks = [];
        }
      }

      feedbacks.push(feedbackItem);
      fs.writeFileSync(filePath, JSON.stringify(feedbacks, null, 2), 'utf8');
    } catch (saveError) {
      console.error('Failed to save feedback to local file:', saveError);
      // We will still try to send email if configured
    }

    // 2. Send email via SMTP if configured
    const smtpHost = process.env.FEEDBACK_SMTP_HOST;
    const smtpPort = process.env.FEEDBACK_SMTP_PORT;
    const smtpUser = process.env.FEEDBACK_SMTP_USER;
    const smtpPass = process.env.FEEDBACK_SMTP_PASS;
    const smtpTo = process.env.FEEDBACK_SMTP_TO || 'nulimai@outlook.com';

    let emailSent = false;
    let emailError = null;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort),
          secure: Number(smtpPort) === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const subject = `[نُلِم] ${feedbackTypeLabel} — ${feedbackItem.name}`;
        const textBody = `الاسم: ${feedbackItem.name}\nنوع الملاحظة: ${feedbackTypeLabel}\nالتاريخ: ${feedbackItem.timestamp}\n\nالرسالة:\n${feedbackItem.message}`;
        const htmlBody = `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="background-color: #0d9488; padding: 20px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px;">ملاحظة جديدة من منصة نُلِم</h2>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #64748b;">الاسم:</td>
                  <td style="padding: 8px 0;">${feedbackItem.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #64748b;">نوع الملاحظة:</td>
                  <td style="padding: 8px 0;">${feedbackTypeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #64748b;">التاريخ:</td>
                  <td style="padding: 8px 0; direction: ltr; text-align: right;">${new Date(feedbackItem.timestamp).toLocaleString('ar-SA')}</td>
                </tr>
              </table>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
              <p style="font-weight: bold; color: #0f172a; margin-bottom: 8px;">محتوى الرسالة:</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; white-space: pre-wrap; color: #334155; border: 1px solid #f1f5f9;">${feedbackItem.message}</div>
            </div>
            <div style="background-color: #f8fafc; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              تم الإرسال تلقائياً بواسطة نظام نُلِم.
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"نُلِم للملاحظات" <${smtpUser}>`,
          to: smtpTo,
          subject: subject,
          text: textBody,
          html: htmlBody,
        });

        emailSent = true;
      } catch (err) {
        console.error('Failed to send email via SMTP:', err);
        emailError = err instanceof Error ? err.message : 'Unknown SMTP error';
      }
    }
    if (!emailSent) {
      const errorMsg = smtpHost 
        ? `فشل إرسال البريد الإلكتروني: ${emailError}` 
        : 'إعدادات البريد الإلكتروني (SMTP) غير مكتملة في ملف البيئة.';
      return NextResponse.json(
        { error: { message: errorMsg } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم استلام ملاحظتك وإرسالها إلى البريد الإلكتروني بنجاح.',
      localSaved: true,
      emailSent: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
