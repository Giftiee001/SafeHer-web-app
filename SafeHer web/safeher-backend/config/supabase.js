const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Test Supabase connection
 */
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');

    // Try a simple query to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('⚠️  Supabase connected but table access error (tables may not be set up yet)');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ Supabase connected successfully!');
    }
  } catch (err) {
    console.log('⚠️  Supabase connection issue:', err.message);
  }
};

module.exports = { supabase, testConnection };
