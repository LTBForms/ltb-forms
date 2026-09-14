// Simple test script to verify checkout API integration
// Run this with: node test-checkout-integration.js

const testCheckoutAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Checkout API Integration...\n');
  
  // Test data for different forms
  const testCases = [
    {
      formId: 'n4',
      customerEmail: 'test@example.com',
      description: 'N4 Form Checkout'
    },
    {
      formId: 'n5', 
      customerEmail: 'test@example.com',
      description: 'N5 Form Checkout'
    },
    {
      formId: 'n8',
      customerEmail: 'test@example.com', 
      description: 'N8 Form Checkout'
    },
    {
      formId: 'n12',
      customerEmail: 'test@example.com',
      description: 'N12 Form Checkout'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing ${testCase.description}...`);
    
    try {
      const response = await fetch(`${baseUrl}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: testCase.formId,
          customerEmail: testCase.customerEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          console.log(`✅ ${testCase.description}: SUCCESS`);
          console.log(`   Checkout URL: ${data.url}`);
        } else {
          console.log(`❌ ${testCase.description}: FAILED - No URL in response`);
        }
      } else {
        const errorData = await response.json();
        console.log(`❌ ${testCase.description}: FAILED - ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.description}: ERROR - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🎯 Test Summary:');
  console.log('- If you see SUCCESS messages, the checkout API is working correctly');
  console.log('- If you see FAILED messages, check your Stripe configuration');
  console.log('- Make sure to set STRIPE_SECRET_KEY and STRIPE_PRICE_ID environment variables');
  console.log('- Make sure your Next.js app is running on http://localhost:3000');
};

// Run the test
testCheckoutAPI().catch(console.error);
