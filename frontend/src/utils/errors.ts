import { AxiosError } from 'axios';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}

export const getErrorMessage = (error: unknown, fallbackMessage = 'An unexpected error occurred.'): string => {
  if (!error) return fallbackMessage;

  const axiosErr = error as AxiosError<{ success?: boolean; error?: ApiErrorPayload }>;

  // Network offline or server unreachable
  if (axiosErr.code === 'ERR_NETWORK' || (!axiosErr.response && axiosErr.request)) {
    return "Can't reach the server. Check your connection and try again.";
  }

  // Backend standard error envelope
  if (axiosErr.response?.data?.error?.message) {
    return axiosErr.response.data.error.message;
  }

  // Axios default message or fallback
  if (axiosErr.message && !axiosErr.message.includes('status code')) {
    return axiosErr.message;
  }

  return fallbackMessage;
};

export const getFieldErrors = (error: unknown): Record<string, string> => {
  const axiosErr = error as AxiosError<{ success?: boolean; error?: ApiErrorPayload }>;
  const details = axiosErr.response?.data?.error?.details;
  const result: Record<string, string> = {};

  if (Array.isArray(details)) {
    details.forEach((item) => {
      if (item.field && item.message) {
        result[item.field] = item.message;
      }
    });
  }

  return result;
};
