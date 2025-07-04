export async function generateQR(text: string): Promise<string> {
  try {
    // Using qr-server.com API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    return qrUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function scanQR(): Promise<string> {
  // This would typically use a camera-based QR scanner
  // For now, we'll return a promise that resolves with user input
  return new Promise((resolve, reject) => {
    const code = prompt('Enter the QR code value:');
    if (code) {
      resolve(code);
    } else {
      reject(new Error('QR scan cancelled'));
    }
  });
}
