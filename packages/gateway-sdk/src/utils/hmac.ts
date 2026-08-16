export async function verifyWebhookSignature(
  payload: string | object,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payloadStr);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray = new Uint8Array(signatureBuffer);
    const computedHex = Array.from(signatureArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const receivedHex = signature.startsWith('sha256=') ? signature.substring(7) : signature;

    return computedHex.toLowerCase() === receivedHex.toLowerCase();
  } catch {
    return false;
  }
}
