import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export const companySizes = [
  { value: "1-10", label: "1–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "51-100", label: "51–100" },
  { value: "100+", label: "100+" },
];

export const placementsPerYear = [
  { value: "1-10", label: "1–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "51-100", label: "51–100" },
  { value: "100+", label: "100+" },
];

export type WaitlistFormData = {
  name: string;
  email: string;
  company: string;
  companySize: string;
  placementsPerYear: string;
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateForm = (data: WaitlistFormData): Partial<WaitlistFormData> => {
  const errors: Partial<WaitlistFormData> = {};
  
  if (!data.name.trim()) {
    errors.name = "Name is required";
  }
  
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(data.email)) {
    errors.email = "Please enter a valid work email";
  }
  
  if (!data.company.trim()) {
    errors.company = "Company name is required";
  }
  
  if (!data.companySize) {
    errors.companySize = "Company size is required";
  }
  
  return errors;
};