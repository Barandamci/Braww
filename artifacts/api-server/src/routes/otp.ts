import { Router } from "express";
import { sendOtp, verifyOtp } from "../lib/otpService.js";

const otpRouter = Router();

otpRouter.post("/otp/send", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Geçerli bir e-posta girin." });
    return;
  }
  try {
    await sendOtp(email.toLowerCase().trim());
    res.json({ success: true, message: "Doğrulama kodu gönderildi." });
  } catch (err) {
    req.log?.error(err, "OTP send failed");
    res.status(500).json({ error: "E-posta gönderilemedi. Lütfen tekrar deneyin." });
  }
});

otpRouter.post("/otp/verify", (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    res.status(400).json({ error: "E-posta ve kod gerekli." });
    return;
  }
  const result = verifyOtp(email.toLowerCase().trim(), code.trim());
  if (!result.valid) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

export default otpRouter;
