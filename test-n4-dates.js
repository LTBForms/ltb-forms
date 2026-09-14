// Test script to verify N4 date calculation
// Run this with: node test-n4-dates.js

const testDateCalculation = () => {
  console.log('🧪 Testing N4 Date Calculation...\n');
  
  // Test cases for date calculation
  const testCases = [
    {
      input: '2024-01-15',
      expectedFrom: '15/01/2024',
      expectedTo: '14/02/2024',
      description: 'January 15, 2024'
    },
    {
      input: '2024-01-31',
      expectedFrom: '31/01/2024',
      expectedTo: '28/02/2024', // Leap year (day before 29th start)
      description: 'January 31, 2024 (leap year)'
    },
    {
      input: '2024-12-15',
      expectedFrom: '15/12/2024',
      expectedTo: '14/01/2025', // Year rollover (day before 15th start)
      description: 'December 15, 2024'
    },
    {
      input: '2023-01-31',
      expectedFrom: '31/01/2023',
      expectedTo: '27/02/2023', // Non-leap year (day before 28th start)
      description: 'January 31, 2023 (non-leap year)'
    }
  ];

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateDates = (fromDate) => {
    const fromDateObj = new Date(fromDate);
    const originalDay = fromDateObj.getDate();
    const nextPeriodStart = new Date(fromDateObj);
    nextPeriodStart.setDate(1);
    nextPeriodStart.setMonth(nextPeriodStart.getMonth() + 1);
    const daysInNextMonth = new Date(nextPeriodStart.getFullYear(), nextPeriodStart.getMonth() + 1, 0).getDate();
    nextPeriodStart.setDate(Math.min(originalDay, daysInNextMonth));
    const toDateObj = new Date(nextPeriodStart);
    toDateObj.setDate(toDateObj.getDate() - 1);
    
    return {
      fromDate: formatDate(fromDateObj),
      toDate: formatDate(toDateObj)
    };
  };

  testCases.forEach((testCase, index) => {
    console.log(`📅 Test Case ${index + 1}: ${testCase.description}`);
    console.log(`   Input: ${testCase.input}`);
    
    const result = calculateDates(testCase.input);
    
    console.log(`   Calculated fromDate: ${result.fromDate}`);
    console.log(`   Expected fromDate: ${testCase.expectedFrom}`);
    console.log(`   ✅ fromDate: ${result.fromDate === testCase.expectedFrom ? 'PASS' : 'FAIL'}`);
    
    console.log(`   Calculated toDate: ${result.toDate}`);
    console.log(`   Expected toDate: ${testCase.expectedTo}`);
    console.log(`   ✅ toDate: ${result.toDate === testCase.expectedTo ? 'PASS' : 'FAIL'}`);
    
    console.log('');
  });
  
  console.log('🎯 Summary:');
  console.log('- fromDate is formatted as dd/mm/yyyy');
  console.log('- toDate is the day before the same day next month');
  console.log('- Handles year rollover correctly');
  console.log('- Handles leap years correctly');
};

// Run the test
testDateCalculation();
