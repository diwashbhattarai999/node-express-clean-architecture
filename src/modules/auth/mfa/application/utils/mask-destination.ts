export const maskEmailDestination = (email: string): string => {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return "***";
  }

  return `${local.slice(0, 1)}***@${domain}`;
};

export const maskPhoneDestination = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 4) {
    return "***";
  }

  return `***${digits.slice(-4)}`;
};
