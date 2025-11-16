import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "../helpers/render";
import React from "react";

/**
 * Example component test demonstrating React Testing Library with Vitest
 *
 * This file serves as a reference for writing component tests.
 * Delete or move this file once you have your own tests.
 */

// Example: Simple Button component
interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function Button({ onClick, disabled, children }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

describe("Example: Basic Component Test", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

// Example: Testing form components
interface FormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

function LoginForm({ onSubmit }: FormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />

      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required />

      <button type="submit">Login</button>
    </form>
  );
}

describe("Example: Testing Forms", () => {
  it("should submit form with correct data", () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});

// Example: Testing async components
interface UserProfileProps {
  userId: string;
}

function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = React.useState<{ name: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUser({ name: "John Doe" });
      setLoading(false);
    }, 100);
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return <div>Welcome, {user.name}!</div>;
}

describe("Example: Testing Async Components", () => {
  it("should show loading state initially", () => {
    render(<UserProfile userId="1" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should show user name after loading", async () => {
    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument();
    });
  });
});

// Example: Testing accessibility
describe("Example: Testing Accessibility", () => {
  it("should have accessible button", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("should have accessible form inputs", () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
