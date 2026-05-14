"use server";

// İletişim formu — Resend domain doğrulandığında e-posta gönderimi eklenecek.
// Şimdilik sadece server-side log atıyor; form veriyi onaylar.

export type ContactFormResult = { ok: boolean; message: string };

export async function submitContactForm(formData: FormData): Promise<ContactFormResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !subject || !message) {
    return { ok: false, message: "Lütfen tüm alanları doldurun." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Geçerli bir e-posta adresi giriniz." };
  }
  if (message.length < 10) {
    return { ok: false, message: "Mesaj en az 10 karakter olmalıdır." };
  }

  // TODO: Resend ile [iletisim — TBD] adresine forward et
  console.log("[iletisim] yeni mesaj:", { name, email, subject, message: message.slice(0, 200) });

  return {
    ok: true,
    message: "Mesajınız iletildi. En kısa sürede dönüş yapacağız.",
  };
}
