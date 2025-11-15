import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * LoginForm - User login form component
 *
 * Features:
 * - Email and password fields with validation
 * - Client-side validation before submission
 * - Loading states during API calls
 * - Error display for validation and server errors
 * - Links to registration and password reset
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get redirect parameter from URL if present
  const getRedirectUrl = () => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  };

  // Check for success message in URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    if (message) {
      setSuccessMessage(message);
      // Clean up URL by removing message parameter
      params.delete("message");
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

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

  // Client-side password validation
  const validatePassword = (value: string): string => {
    if (!value) {
      return "Password is required";
    }
    return "";
  };

  // Handle email blur event
  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setEmailError(error);
  };

  // Handle password blur event
  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setPasswordError(error);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // Validate all fields
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError || passwordValidationError) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid email or password");
      }

      // Successful login - redirect based on context
      const redirectUrl = getRedirectUrl();
      if (redirectUrl) {
        // User was redirected from a protected route - go back there
        window.location.href = redirectUrl;
      } else {
        // No redirect parameter - go to new conversation page
        window.location.href = "/app/new";
      }
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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError("");
    if (generalError) setGeneralError("");
  };

  // Navigate to registration page
  const handleRegisterClick = () => {
    if (typeof window !== "undefined" && "startViewTransition" in document) {
      import("astro:transitions/client").then(({ navigate }) => {
        navigate("/auth/register");
      });
    } else {
      window.location.href = "/auth/register";
    }
  };

  // Navigate to reset password page
  // const handleResetPasswordClick = () => {
  //   if (typeof window !== "undefined" && "startViewTransition" in document) {
  //     import("astro:transitions/client").then(({ navigate }) => {
  //       navigate("/auth/reset-password");
  //     });
  //   } else {
  //     window.location.href = "/auth/reset-password";
  //   }
  // };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your switch-ai account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Success Message Alert */}
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
                disabled={isLoading}
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

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={handlePasswordBlur}
                disabled={isLoading}
                className={passwordError ? "border-destructive" : ""}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              {passwordError && (
                <p id="password-error" className="text-sm text-destructive">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    // onClick={handleResetPasswordClick}
                    className="text-sm text-muted-foreground cursor-not-allowed"
                    disabled
                    aria-label="Password reset is not currently available"
                  >
                    Forgot password?
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This feature is not currently available</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Register Link */}
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={handleRegisterClick}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
