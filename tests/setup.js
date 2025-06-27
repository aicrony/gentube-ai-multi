// Ensure tests don't connect to production services
process.env.NODE_ENV = 'test';

// Mock environment variables to prevent any connection to real services
process.env.SUPABASE_URL = 'https://test-supabase-url.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123456789';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// This will ensure tests are safe to run in any environment
console.log('Test environment setup complete - using mock services only');
