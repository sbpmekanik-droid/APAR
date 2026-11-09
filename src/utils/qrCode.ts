import QRCode from 'qrcode';

export interface QrLabelPayload {
  aparId: string;
  aparCode: string;
  inventoryNumber: string;
  mediaType: string;
  capacity: string;
  location: string;
}

/**
 * Format string payload stored in QR code
 */
export function formatQrPayload(aparId: string): string {
  // Store formatted identifier that can also be parsed if loaded via web URL
  return `HSE-APAR:${aparId}`;
}

/**
 * Parse scanned QR string to extract APAR ID
 */
export function parseQrPayload(scannedText: string): string {
  if (!scannedText) return '';
  const trimmed = scannedText.trim();
  
  // Format: HSE-APAR:APAR-VBLT-001
  if (trimmed.startsWith('HSE-APAR:')) {
    return trimmed.replace('HSE-APAR:', '').trim();
  }

  // Format: https://.../?aparId=APAR-VBLT-001
  if (trimmed.includes('aparId=')) {
    try {
      const url = new URL(trimmed);
      const val = url.searchParams.get('aparId');
      if (val) return val.trim();
    } catch {
      // Not a valid URL, check match
      const match = trimmed.match(/[?&]aparId=([^&]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
  }

  // Format: direct ID like APAR-VBLT-001
  return trimmed;
}

/**
 * Generate QR Code as Data URL
 */
export async function generateQrDataUrl(text: string, size = 250): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}
