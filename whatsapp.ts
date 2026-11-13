const WUAPI_ENDPOINT = "https://api.wuapi.dev/v1/messages";

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `***${digits.slice(-4)}` : "***";
}

export async function initWhatsApp(): Promise<void> {
  if (!process.env.WUAPI_API_KEY || !process.env.WUAPI_ACCOUNT_ID) {
    console.warn("[whatsapp] WUAPI_API_KEY / WUAPI_ACCOUNT_ID not configured. OTP delivery is disabled.");
    return;
  }
  console.log("[whatsapp] WhatsApp OTP delivery is configured.");
}

export async function sendWhatsAppMessage(recipientPhone: string, message: string): Promise<boolean> {
  const apiKey = process.env.WUAPI_API_KEY;
  const accountId = process.env.WUAPI_ACCOUNT_ID;

  if (!apiKey || !accountId) {
    console.error("[whatsapp] Delivery skipped: provider credentials are missing.");
    return false;
  }

  let clean = recipientPhone.replace(/\D/g, "");
  if (clean.length === 10) clean = `91${clean}`;
  if (!/^91[6-9]\d{9}$/.test(clean)) {
    console.error("[whatsapp] Delivery skipped: invalid recipient number.");
    return false;
  }

  try {
    const response = await fetch(WUAPI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        to: `+${clean}`,
        type: "text",
        text: message,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      console.error(`[whatsapp] Provider rejected message (status ${response.status}) for ${maskPhone(clean)}`);
      return false;
    }

    console.info(`[whatsapp] Message delivered to ${maskPhone(clean)}`);
    return true;
  } catch {
    console.error("[whatsapp] Provider request failed.");
    return false;
  }
}
