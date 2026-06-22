const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string) {
  return EMAIL.test(value.trim()) ? null : "Enter a valid email address.";
}

export function validatePassword(value: string) {
  return value.length >= 8 ? null : "Password must be at least 8 characters.";
}

export function validateOtp(value: string) {
  return /^\d{4}$/.test(value) ? null : "OTP must contain exactly 4 digits.";
}

export function validateAccountNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 12
    ? null
    : "Recipient account number must be 10 to 12 digits.";
}

export function validateRegistration(values: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
}) {
  if (!values.firstName.trim()) return "First name is required.";
  if (!values.lastName.trim()) return "Last name is required.";
  return (
    validateEmail(values.email) ||
    validatePassword(values.password) ||
    (values.password !== values.confirm ? "Passwords do not match." : null)
  );
}
