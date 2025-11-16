import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * ResetPasswordForm - Password reset request form component
 *
 * Features:
 * - Email field with validation
 * - Client-side validation before submission
 * - Loading states during API calls
 * - Success message after submission
 * - Error display for validation and server errors
 * - Link back to login page
 */
export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Client-side email validation
  const validateEmail = (value: string): string => {
    if (!value) {
      return "Email address is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Handle email blur event
  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setEmailError(error);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors and success message
    setEmailError("");
    setGeneralError("");
    setSuccessMessage("");

    // Validate email
    const emailValidationError = validateEmail(email);

    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reset email");
      }

      // Display success message
      setSuccessMessage(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox."
      );
      setEmail(""); // Clear form
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : "An error occurred. Please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle field change (clear errors)
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError("");
    if (generalError) setGeneralError("");
  };

  // Navigate to login page
  const handleBackToLogin = () => {
    if (typeof window !== "undefined" && "startViewTransition" in document) {
      import("astro:transitions/client").then(({ navigate }) => {
        navigate("/auth/login");
      });
    } else {
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Success Alert */}
            {successMessage && (
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* General Error Alert */}
            {generalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                disabled={isLoading || !!successMessage}
                className={emailError ? "border-destructive" : ""}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Submit Button */}
            {!successMessage && (
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            )}

            {/* Back to Login Link */}
            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Back to sign in
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
