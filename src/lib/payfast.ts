import md5 from 'crypto-js/md5';

/**
 * Generates a PayFast signature.
 * The payload must be an object containing all the form fields to be submitted.
 * The passphrase is only included in the signature generation if it's provided.
 */
export const generatePayFastSignature = (
  payload: Record<string, string | number>,
  passphrase?: string
): string => {
  // 1. Convert payload to string format
  let stringPayload = '';
  
  // Sort the keys alphabetically (optional, but good practice. Payfast only requires them in the order they appear, 
  // but let's just use the exact keys we append to the form).
  const keys = Object.keys(payload);
  
  // Create URL encoded string
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = payload[key];
    
    if (value !== '' && value !== undefined && value !== null) {
      // PayFast requires spaces to be replaced with + instead of %20
      const formattedValue = encodeURIComponent(value.toString().trim()).replace(/%20/g, '+');
      stringPayload += `${key}=${formattedValue}&`;
    }
  }

  // Remove the trailing ampersand
  if (stringPayload.endsWith('&')) {
    stringPayload = stringPayload.slice(0, -1);
  }

  // 2. Append Passphrase if it exists
  if (passphrase && passphrase.trim() !== '') {
    stringPayload += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  // 3. Generate MD5 Hash
  return md5(stringPayload).toString();
};
