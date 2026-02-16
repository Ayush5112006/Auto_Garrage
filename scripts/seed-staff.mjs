import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  return content.split("\n").reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }
    const [key, ...rest] = trimmed.split("=");
    if (!key) {
      return acc;
    }
    acc[key] = rest.join("=").trim();
    return acc;
  }, {});
};

const envPath = path.resolve(process.cwd(), ".env.local");
const env = loadEnvFile(envPath);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const staffUsers = [
  { email: "admin@garage.com", password: "admin123", role: "admin", full_name: "Admin User" },
  { email: "advisor@garage.com", password: "advisor123", role: "service_advisor", full_name: "Service Advisor" },
  { email: "senior@garage.com", password: "senior123", role: "senior_mechanic", full_name: "Senior Mechanic" },
  { email: "junior@garage.com", password: "junior123", role: "junior_mechanic", full_name: "Junior Mechanic" },
  { email: "pickup@garage.com", password: "pickup123", role: "pickup_driver", full_name: "Pickup Driver" },
  { email: "sales@garage.com", password: "sales123", role: "car_seller", full_name: "Car Seller" },
];

const findUserByEmail = async (email) => {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
  if (error) {
    throw error;
  }
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
};

const ensureUser = async (staff) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: staff.email,
    password: staff.password,
    email_confirm: true,
  });

  if (error) {
    const existing = await findUserByEmail(staff.email);
    if (existing) {
      return existing;
    }
    throw error;
  }

  return data.user;
};

const upsertProfile = async (userId, staff) => {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        role: staff.role,
        full_name: staff.full_name,
      },
      { onConflict: "id" }
    );

  if (error) {
    throw error;
  }
};

const seed = async () => {
  for (const staff of staffUsers) {
    const user = await ensureUser(staff);
    if (!user) {
      console.error(`Failed to create or find user for ${staff.email}`);
      continue;
    }
    await upsertProfile(user.id, staff);
    console.log(`Seeded ${staff.email} (${staff.role})`);
  }
};

seed().catch((error) => {
  console.error("Seed failed:", error.message || error);
  process.exit(1);
});
