import { assertEquals, assertExists } from "std/assert/mod.ts";
import { ticketValidationHandler } from "./index.ts"; // Import the handler
import { SupabaseClient } from "supabase";

// Mock Deno.env.get
const originalEnvGet = Deno.env.get;
let mockEnv: Record<string, string | undefined>;

// Mock SupabaseClient
let mockSupabaseClientInstance: Partial<SupabaseClient>;
const mockFrom = (table: string) => ({
  select: (_selectArgs?: string) => ({
    eq: (_column: string, _value: any) => ({
      single: () => mockSupabaseClientInstance.from!(table).select!(_selectArgs).eq!(_column, _value).single!(),
      maybeSingle: () => mockSupabaseClientInstance.from!(table).select!(_selectArgs).eq!(_column, _value).maybeSingle!(),
    }),
  }),
  update: (_updateArgs: object) => ({
    eq: (_column: string, _value: any) => mockSupabaseClientInstance.from!(table).update!(_updateArgs).eq!(_column, _value),
  }),
});


// Mock createClient from Supabase
const mockCreateClient = (_url?: string, _key?: string, _options?: any): SupabaseClient => {
  return {
    auth: {
      getUser: () => mockSupabaseClientInstance?.auth?.getUser!(),
    },
    from: mockFrom,
    // Add other methods if needed by the function under test
  } as unknown as SupabaseClient;
};

// Store original createClient if we were to properly mock imports,
// but for this self-contained test, we'll assume this structure is okay.
// For more robust mocking, libraries or Deno's --unstable-testing features might be used.

// Helper to create a mock request
function createMockRequest(
  method: string,
  headers?: Record<string, string>,
  body?: any
): Request {
  return new Request(`http://localhost/validate-ticket`, {
    method,
    headers: new Headers(headers || {}),
    body: body ? JSON.stringify(body) : undefined,
  });
}

Deno.test("validate-ticket handler", async (t: Deno.TestContext) => {
  // Setup global mocks before all tests in this suite
  (Deno.env.get as any) = (key: string) => mockEnv[key];
  
  // Mock global createClient - this is a simplified approach.
  // In a real scenario, you might use import maps or a mocking library for cleaner import mocking.
  const originalCreateClient = (globalThis as any).createClient; // Assuming createClient is global via esm.sh
  (globalThis as any).createClient = mockCreateClient;


  await t.step("OPTIONS request should return 200 OK", async () => {
    const req = createMockRequest("OPTIONS");
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "ok");
  });

  await t.step("Missing environment variables should return 500", async () => {
    mockEnv = {}; // No env vars
    const req = createMockRequest("POST", { "Authorization": "Bearer test-token" }, { booking_id: "test" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 500);
    const json = await res.json();
    assertEquals(json.error, "Server configuration error.");
  });

  // Reset env for subsequent tests
  mockEnv = {
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
    SUPER_ADMIN_UID: "super-admin-id"
  };

  await t.step("Missing Authorization header should return 401", async () => {
    const req = createMockRequest("POST", {}, { booking_id: "test" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 401);
    const json = await res.json();
    assertEquals(json.error, "Missing authorization header.");
  });

  await t.step("Non-admin user should return 403", async () => {
    mockSupabaseClientInstance = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "user123" } }, error: null })
      },
      from: (_table: string) => ({ // Mock for isAdmin's 'users' table check
        select: (_selectArgs?: string) => ({
          eq: (_column: string, _value: any) => ({
            single: () => Promise.resolve({ data: { id: "user123", roles: ["customer"] }, error: null }),
          }),
        }),
      }) as any,
    };
    const req = createMockRequest("POST", { "Authorization": "Bearer non-admin-token" }, { booking_id: "test" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 403);
    const json = await res.json();
    assertEquals(json.error, "Unauthorized. Admin access required.");
  });
  
  await t.step("Admin user but missing booking_id in payload should return 400", async () => {
    mockSupabaseClientInstance = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "adminUser" } }, error: null })
      },
      from: (_table: string) => ({ // Mock for isAdmin's 'users' table check
        select: (_selectArgs?: string) => ({
          eq: (_column: string, _value: any) => ({
            single: () => Promise.resolve({ data: { id: "adminUser", roles: ["admin"] }, error: null }),
          }),
        }),
      }) as any,
    };
    const req = createMockRequest("POST", { "Authorization": "Bearer admin-token" }, {}); // Empty payload
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assertEquals(json.error, "Invalid payload. booking_id is required.");
  });

  await t.step("Booking ID not found should return 404", async () => {
    mockSupabaseClientInstance = {
      auth: { // Admin user
        getUser: () => Promise.resolve({ data: { user: { id: "adminUser" } }, error: null })
      },
      from: (table: string) => {
        if (table === 'users') { // For isAdmin check
          return {
            select: (_selectArgs?: string) => ({
              eq: (_column: string, _value: any) => ({
                single: () => Promise.resolve({ data: { id: "adminUser", roles: ["admin"] }, error: null }),
              }),
            }),
          };
        }
        if (table === 'bookings') { // For fetching booking
          return {
            select: (_selectArgs?: string) => ({
              eq: (_column: string, _value: any) => ({
                single: () => Promise.resolve({ data: null, error: { message: "Not found", code: "PGRST116"} }), // PGRST116: Row not found
              }),
            }),
          };
        }
        return {} as any;
      },
    };
    const req = createMockRequest("POST", { "Authorization": "Bearer admin-token" }, { booking_id: "nonexistent-id" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 404);
    const json = await res.json();
    assertEquals(json.status, "not_found");
    assertEquals(json.message, "Booking ID not found.");
  });

  await t.step("Ticket not paid should return 400", async () => {
    const mockBooking = { id: "booking1", payment_status: "pending", checked_in: false, event_name: "Test Event" };
    mockSupabaseClientInstance = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "adminUser" } }, error: null }) },
      from: (table: string) => {
        if (table === 'users') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { roles: ["admin"] }, error: null }) }) }) };
        if (table === 'bookings') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockBooking, error: null }) }) }) };
        return {} as any;
      },
    };
    const req = createMockRequest("POST", { "Authorization": "Bearer admin-token" }, { booking_id: "booking1" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assertEquals(json.status, "not_paid");
    assertEquals(json.booking_details.id, "booking1");
  });

  await t.step("Ticket already checked in should return 400", async () => {
    const mockBooking = { id: "booking2", payment_status: "paid", checked_in: true, event_name: "Another Event" };
     mockSupabaseClientInstance = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "adminUser" } }, error: null }) },
      from: (table: string) => {
        if (table === 'users') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { roles: ["admin"] }, error: null }) }) }) };
        if (table === 'bookings') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockBooking, error: null }) }) }) };
        return {} as any;
      },
    };
    const req = createMockRequest("POST", { "Authorization": "Bearer admin-token" }, { booking_id: "booking2" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assertEquals(json.status, "already_checked_in");
  });

  await t.step("Successful check-in should return 200", async () => {
    const initialBooking = { id: "booking3", payment_status: "paid", checked_in: false, event_name: "Valid Event" };
    const updatedBookingData = { ...initialBooking, checked_in: true, checked_in_at: new Date().toISOString() };
    mockSupabaseClientInstance = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "adminUser" } }, error: null }) },
      from: (table: string) => {
        if (table === 'users') {
          return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { roles: ["admin"] }, error: null }) }) }) };
        }
        if (table === 'bookings') {
          return {
            select: () => ({ 
              eq: (col: string, val: string) => {
                // This mock needs to differentiate between the initial fetch and the fetch after update
                if (val === "booking3" && mockSupabaseClientInstance.from!(table).update!({})['eq']! === undefined) { // crude way to check if it's the first select
                   return { single: () => Promise.resolve({ data: initialBooking, error: null }) };
                }
                // This part is tricky without more state in mock or spy on update
                // For simplicity, assume the second select (after update) returns updatedBookingData
                return { single: () => Promise.resolve({ data: updatedBookingData, error: null }) };
              }
            }),
            update: (_updateArgs: object) => ({
              eq: (_column: string, _value: any) => Promise.resolve({ error: null }) // Mock successful update
            }),
          };
        }
        return {} as any;
      },
    };
    
    // A bit of a hack to reset the "update" spy for the select mock logic above
    // @ts-ignore
    mockSupabaseClientInstance.from!('bookings').update!({})['eq'] = undefined;


    const req = createMockRequest("POST", { "Authorization": "Bearer admin-token" }, { booking_id: "booking3" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assertEquals(json.status, "success");
    assertEquals(json.booking_details.id, "booking3");
    assertEquals(json.booking_details.checked_in, true);
    assertExists(json.booking_details.checked_in_at);
  });
  
  await t.step("DB error on update should return 500", async () => {
    const bookingToUpdate = { id: "booking4", payment_status: "paid", checked_in: false };
    mockSupabaseClientInstance = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "adminUser" } }, error: null }) },
      from: (table: string) => {
        if (table === 'users') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { roles: ["admin"] }, error: null }) }) }) };
        if (table === 'bookings') {
          return {
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: bookingToUpdate, error: null }) }) }),
            update: () => ({ eq: () => Promise.resolve({ error: { message: "DB update failed", code: "XYZ" } }) }),
          };
        }
        return {} as any;
      },
    };
    const req = createMockRequest("POST", { "Authorization": "Bearer admin-token" }, { booking_id: "booking4" });
    const res = await ticketValidationHandler(req);
    assertEquals(res.status, 500);
    const json = await res.json();
    assertEquals(json.status, "update_failed");
  });

  // Teardown: Restore original Deno.env.get and createClient
  Deno.env.get = originalEnvGet;
  (globalThis as any).createClient = originalCreateClient;
});
