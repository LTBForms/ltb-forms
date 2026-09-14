// Test script to verify tenantNames handling in form APIs
// Run this with: node test-tenant-names-handling.js

const testTenantNamesHandling = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing TenantNames Handling in Form APIs...\n');
  
  // Test data with tenantNames as array
  const testDataArray = {
    landlordName: 'John Doe',
    tenantNames: ['Jane Smith', 'Bob Johnson', 'Alice Brown'],
    rentalAddress: '123 Main St, Toronto, ON M1A 1A1',
    email: 'test@example.com',
    serveDate: '2024-01-15',
    serveMethod: 'personal'
  };

  // Test data with tenantNames as comma-separated string
  const testDataString = {
    landlordName: 'John Doe',
    tenantNames: 'Jane Smith, Bob Johnson, Alice Brown',
    rentalAddress: '123 Main St, Toronto, ON M1A 1A1',
    email: 'test@example.com',
    serveDate: '2024-01-15',
    serveMethod: 'personal'
  };

  const testCases = [
    {
      formId: 'n4',
      data: testDataArray,
      description: 'N4 Form with tenantNames as array'
    },
    {
      formId: 'n4',
      data: testDataString,
      description: 'N4 Form with tenantNames as string'
    },
    {
      formId: 'n5',
      data: testDataArray,
      description: 'N5 Form with tenantNames as array'
    },
    {
      formId: 'n5',
      data: testDataString,
      description: 'N5 Form with tenantNames as string'
    },
    {
      formId: 'n8',
      data: testDataArray,
      description: 'N8 Form with tenantNames as array'
    },
    {
      formId: 'n8',
      data: testDataString,
      description: 'N8 Form with tenantNames as string'
    },
    {
      formId: 'n12',
      data: testDataArray,
      description: 'N12 Form with tenantNames as array'
    },
    {
      formId: 'n12',
      data: testDataString,
      description: 'N12 Form with tenantNames as string'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing ${testCase.description}...`);
    
    try {
      const response = await fetch(`${baseUrl}/api/fill-${testCase.formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      if (response.ok) {
        console.log(`✅ ${testCase.description}: SUCCESS`);
        console.log(`   Response status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
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
  console.log('- Both array and string formats for tenantNames should work');
  console.log('- APIs should handle both formats gracefully');
  console.log('- Make sure your Next.js app is running on http://localhost:3000');
};

// Run the test
testTenantNamesHandling().catch(console.error);
