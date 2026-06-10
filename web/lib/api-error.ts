import axios from "axios";

type ApiErrorPayload =
  | {
      message?: unknown;
      error?: unknown;
      detail?: unknown;
      description?: unknown;
      title?: unknown;
      errors?: unknown;
    }
  | string
  | null
  | undefined;

const TECHNICAL_MESSAGE_PATTERNS = [
  /AxiosError/i,
  /Network Error/i,
  /Request failed with status code/i,
  /ECONNABORTED/i,
  /ENOTFOUND/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
];

const isTechnicalMessage = (message: string) => {
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
};

const pickString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const next = pickString(entry);
      if (next) {
        return next;
      }
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const prioritizedKeys = [
      "message",
      "error",
      "detail",
      "description",
      "title",
    ];

    for (const key of prioritizedKeys) {
      const next = pickString(record[key]);
      if (next) {
        return next;
      }
    }
  }

  return null;
};

const getServerMessage = (data: ApiErrorPayload): string | null => {
  if (!data) {
    return null;
  }

  if (typeof data === "string") {
    return pickString(data);
  }

  return pickString(data);
};

export const getFriendlyApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (axios.isAxiosError(error)) {
    const serverMessage = getServerMessage(error.response?.data);

    if (serverMessage && !isTechnicalMessage(serverMessage)) {
      return serverMessage;
    }

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "The request took too long. Please try again.";
      }

      return "We could not reach the server. Check your connection and try again.";
    }

    if (error.response.status >= 500) {
      return "The server is having trouble right now. Please try again shortly.";
    }

    if (error.response.status === 401) {
      return "Your session expired. Sign in again to continue.";
    }

    if (error.response.status === 403) {
      return "You do not have access to perform this action.";
    }

    if (error.response.status === 404) {
      return "We could not find the requested item.";
    }

    return fallbackMessage;
  }

  if (error instanceof Error) {
    if (isTechnicalMessage(error.message)) {
      return fallbackMessage;
    }

    return error.message;
  }

  return fallbackMessage;
};
