import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface UpdatePasswordFormProps {
  token: string;
}

/**
 * UpdatePasswordForm - Password update form component
 *
 * Features:
 * - Password and confirm password fields with validation
 * - Client-side validation before submission
 * - Password match validation
 * - Loading states during API calls
 * - Error display for validation and server errors
 * - Receives recovery token from URL
 */
export function UpdatePasswordForm({ token }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Client-side password validation
  const validatePassword = (value: string): string => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return "";
  };

  // Client-side confirm password validation
  const validateConfirmPassword = (value: string): string => {
    if (!value) {
      return "Please confirm your password";
    }
    if (value !== password) {
      return "Passwords do not match";
    }
    return "";
  };

  // Handle field blur events
  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setPasswordError(error);
  };

  const handleConfirmPasswordBlur = () => {
    const error = validateConfirmPassword(confirmPassword);
    setConfirmPasswordError(error);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    // Validate all fields
    const passwordValidationError = validatePassword(password);
    const confirmPasswordValidationError = validateConfirmPassword(confirmPassword);

    if (passwordValidationError || confirmPasswordValidationError) {
      setPasswordError(passwordValidationError);
      setConfirmPasswordError(confirmPasswordValidationError);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement API call to /api/auth/update-password
      // const response = await fetch("/api/auth/update-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ password, token }),
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   if (response.status === 400) {
      //     throw new Error("Password reset link is invalid or has expired");
      //   }
      //   throw new Error(error.message || "Failed to update password");
      // }
      //
      // Redirect to login with success message
      // window.location.href = "/auth/login?message=Password updated successfully";

      console.log("Update password form submitted:", { password, token });
      setGeneralError("Backend not yet implemented");
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : "An error occurred. Please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle field changes (clear errors)
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError("");
    if (generalError) setGeneralError("");
    // Re-validate confirm password if it has a value
    if (confirmPassword) {
      const error = value === confirmPassword ? "" : "Passwords do not match";
      setConfirmPasswordError(error);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (confirmPasswordError) setConfirmPasswordError("");
    if (generalError) setGeneralError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* General Error Alert */}
            {generalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
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
              <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                onBlur={handleConfirmPasswordBlur}
                disabled={isLoading}
                className={confirmPasswordError ? "border-destructive" : ""}
                aria-invalid={!!confirmPasswordError}
                aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
              />
              {confirmPasswordError && (
                <p id="confirm-password-error" className="text-sm text-destructive">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Updating password..." : "Update password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

