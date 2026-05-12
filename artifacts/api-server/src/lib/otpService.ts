import nodemailer from "nodemailer";

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendOtp(email: string): Promise<void> {
  const code = generateOtp();
  otpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Braw" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Braw — E-posta Doğrulama Kodu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1A6DFF; font-size: 28px; margin: 0;">Braw</h1>
          <p style="color: #666; margin-top: 4px;">Güvenli Mesajlaşma</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 28px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
          <div style="background: #F0F5FF; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #1A6DFF;">${code}</span>
          </div>
          <p style="color: #999; font-size: 13px;">Bu kod <strong>5 dakika</strong> geçerlidir.</p>
          <p style="color: #999; font-size: 13px;">Bu kodu kimseyle paylaşmayın.</p>
        </div>
        <p style="text-align: center; color: #bbb; font-size: 12px; margin-top: 20px;">Bu e-postayı siz talep etmediyseniz güvenle yoksayabilirsiniz.</p>
      </div>
    `,
  });
}

export function verifyOtp(email: string, code: string): { valid: boolean; error?: string } {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return { valid: false, error: "Kod bulunamadı. Yeniden gönderin." };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: "Kodun süresi doldu. Yeniden gönderin." };
  }
  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: "Çok fazla hatalı deneme. Yeniden gönderin." };
  }
  if (entry.code !== code.trim()) {
    return { valid: false, error: "Kod hatalı. Tekrar deneyin." };
  }
  otpStore.delete(email.toLowerCase());
  return { valid: true };
}
