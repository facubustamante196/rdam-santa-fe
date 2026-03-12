import { ApiError } from "@/lib/api";

interface ErrorMessageProps {
  error: unknown;
}

export const ErrorMessage = ({ error }: ErrorMessageProps) => {
  if (!error) return null;
  let message = "Error inesperado, intente nuevamente";

  if (error instanceof ApiError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return <p className="text-sm text-red-600 mt-1">{message}</p>;
};
