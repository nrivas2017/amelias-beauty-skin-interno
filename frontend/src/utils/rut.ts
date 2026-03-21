export const cleanRut = (rut: string): string => {
  if (!rut) return "";
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
};

export const formatRut = (rut: string): string => {
  const cleaned = cleanRut(rut);
  if (!cleaned) return "";

  if (cleaned.length <= 1) {
    return cleaned;
  }

  const verifier = cleaned.slice(-1);
  const numberStr = cleaned.slice(0, -1);

  let formattedNumber = "";
  for (let i = numberStr.length - 1, j = 1; i >= 0; i--, j++) {
    formattedNumber = numberStr[i] + formattedNumber;
    if (j % 3 === 0 && i !== 0) {
      formattedNumber = "." + formattedNumber;
    }
  }

  return `${formattedNumber}-${verifier}`;
};

export const validateRut = (rut: string): boolean => {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 8) return false;

  const verifier = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier < 7 ? multiplier + 1 : 2;
  }

  const expectedVerifier = 11 - (sum % 11);
  const expectedVerifierStr =
    expectedVerifier === 11
      ? "0"
      : expectedVerifier === 10
        ? "K"
        : expectedVerifier.toString();

  return verifier === expectedVerifierStr;
};
