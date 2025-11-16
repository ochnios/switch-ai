import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Example unit test demonstrating Vitest basics
 *
 * This file serves as a reference for writing unit tests.
 * Delete or move this file once you have your own tests.
 */

// Example: Testing a simple utility function
function add(a: number, b: number): number {
  return a + b;
}

describe("Example: Basic Unit Tests", () => {
  it("should add two numbers correctly", () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });
});

// Example: Testing with mocks
interface UserService {
  getUser(id: string): Promise<{ id: string; name: string }>;
}

class UserController {
  constructor(private userService: UserService) {}

  async getUserName(id: string): Promise<string> {
    const user = await this.userService.getUser(id);
    return user.name;
  }
}

describe("Example: Testing with Mocks", () => {
  let mockUserService: UserService;
  let userController: UserController;

  beforeEach(() => {
    mockUserService = {
      getUser: vi.fn().mockResolvedValue({ id: "1", name: "John Doe" }),
    };
    userController = new UserController(mockUserService);
  });

  it("should return user name", async () => {
    const name = await userController.getUserName("1");

    expect(name).toBe("John Doe");
    expect(mockUserService.getUser).toHaveBeenCalledWith("1");
    expect(mockUserService.getUser).toHaveBeenCalledOnce();
  });

  it("should handle errors", async () => {
    vi.mocked(mockUserService.getUser).mockRejectedValue(new Error("User not found"));

    await expect(userController.getUserName("999")).rejects.toThrow("User not found");
  });
});

// Example: Testing async code
async function fetchData(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve("data"), 100);
  });
}

describe("Example: Testing Async Code", () => {
  it("should resolve with data", async () => {
    const data = await fetchData();
    expect(data).toBe("data");
  });
});

// Example: Using inline snapshots
describe("Example: Snapshot Testing", () => {
  it("should match inline snapshot", () => {
    const data = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    };

    expect(data).toMatchInlineSnapshot(`
      {
        "email": "test@example.com",
        "id": 1,
        "name": "Test User",
      }
    `);
  });
});
