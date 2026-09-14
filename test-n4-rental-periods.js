// Test script to verify N4 rental periods processing
// Run this with: node test-n4-rental-periods.js

const testRentalPeriodsProcessing = () => {
  console.log('🧪 Testing N4 Rental Periods Processing...\n');
  
  // Test case 1: 3 periods (should remain unchanged)
  const testCase1 = {
    description: '3 rental periods (should remain unchanged)',
    input: [
      {
        rentDueDate: '2024-01-15',
        fromDate: '15/01/2024',
        toDate: '15/02/2024',
        lawfulRent: '1000',
        paidRent: '800',
        rentOwing: 200
      },
      {
        rentDueDate: '2024-02-15',
        fromDate: '15/02/2024',
        toDate: '15/03/2024',
        lawfulRent: '1000',
        paidRent: '900',
        rentOwing: 100
      },
      {
        rentDueDate: '2024-03-15',
        fromDate: '15/03/2024',
        toDate: '15/04/2024',
        lawfulRent: '1000',
        paidRent: '1000',
        rentOwing: 0
      }
    ],
    expected: 3
  };
  
  // Test case 2: 5 periods (should combine 3rd and beyond)
  const testCase2 = {
    description: '5 rental periods (should combine 3rd and beyond)',
    input: [
      {
        rentDueDate: '2024-01-15',
        fromDate: '15/01/2024',
        toDate: '15/02/2024',
        lawfulRent: '1000',
        paidRent: '800',
        rentOwing: 200
      },
      {
        rentDueDate: '2024-02-15',
        fromDate: '15/02/2024',
        toDate: '15/03/2024',
        lawfulRent: '1000',
        paidRent: '900',
        rentOwing: 100
      },
      {
        rentDueDate: '2024-03-15',
        fromDate: '15/03/2024',
        toDate: '15/04/2024',
        lawfulRent: '1000',
        paidRent: '1000',
        rentOwing: 0
      },
      {
        rentDueDate: '2024-04-15',
        fromDate: '15/04/2024',
        toDate: '15/05/2024',
        lawfulRent: '1000',
        paidRent: '500',
        rentOwing: 500
      },
      {
        rentDueDate: '2024-05-15',
        fromDate: '15/05/2024',
        toDate: '15/06/2024',
        lawfulRent: '1000',
        paidRent: '0',
        rentOwing: 1000
      }
    ],
    expected: 3
  };
  
  const processRentalPeriods = (rentalPeriods) => {
    let processedRentalPeriods = [...rentalPeriods];
    
    // If more than 3 periods, combine 3rd and beyond
    if (processedRentalPeriods.length > 3) {
      const firstPeriod = processedRentalPeriods[0];
      const secondPeriod = processedRentalPeriods[1];
      
      // Calculate totals for periods 3 and beyond
      const remainingPeriods = processedRentalPeriods.slice(2);
      const totalLawfulRentRemaining = remainingPeriods.reduce((sum, period) => 
        sum + (parseFloat(period.lawfulRent) || 0), 0
      );
      const totalPaidRentRemaining = remainingPeriods.reduce((sum, period) => 
        sum + (parseFloat(period.paidRent) || 0), 0
      );
      
      // Create third period with combined data
      const thirdPeriod = {
        ...remainingPeriods[0], // Use first of remaining periods as base
        fromDate: remainingPeriods[0].fromDate, // fromDate of 3rd period
        toDate: remainingPeriods[remainingPeriods.length - 1].toDate, // toDate of last period
        lawfulRent: totalLawfulRentRemaining.toString(),
        paidRent: totalPaidRentRemaining.toString(),
        rentOwing: Math.max(0, totalLawfulRentRemaining - totalPaidRentRemaining)
      };
      
      // Keep only first 3 periods
      processedRentalPeriods = [firstPeriod, secondPeriod, thirdPeriod];
    }
    
    return processedRentalPeriods;
  };
  
  // Test case 1
  console.log(`📅 Test Case 1: ${testCase1.description}`);
  const result1 = processRentalPeriods(testCase1.input);
  console.log(`   Input periods: ${testCase1.input.length}`);
  console.log(`   Output periods: ${result1.length}`);
  console.log(`   ✅ Result: ${result1.length === testCase1.expected ? 'PASS' : 'FAIL'}`);
  console.log('');
  
  // Test case 2
  console.log(`📅 Test Case 2: ${testCase2.description}`);
  const result2 = processRentalPeriods(testCase2.input);
  console.log(`   Input periods: ${testCase2.input.length}`);
  console.log(`   Output periods: ${result2.length}`);
  console.log(`   ✅ Result: ${result2.length === testCase2.expected ? 'PASS' : 'FAIL'}`);
  
  if (result2.length === 3) {
    console.log(`   Third period fromDate: ${result2[2].fromDate}`);
    console.log(`   Third period toDate: ${result2[2].toDate}`);
    console.log(`   Third period lawfulRent: ${result2[2].lawfulRent}`);
    console.log(`   Third period paidRent: ${result2[2].paidRent}`);
    console.log(`   Third period rentOwing: ${result2[2].rentOwing}`);
  }
  
  console.log('');
  console.log('🎯 Summary:');
  console.log('- 3 or fewer periods: remain unchanged');
  console.log('- More than 3 periods: combine 3rd and beyond into single period');
  console.log('- Combined period uses fromDate of 3rd period and toDate of last period');
  console.log('- Combined period sums up lawfulRent and paidRent from all remaining periods');
};

// Run the test
testRentalPeriodsProcessing();
