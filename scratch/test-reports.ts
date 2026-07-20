import { getAttendanceStats, getPaymentStats, getTopInsights } from '../actions/reports/reports';

async function test() {
  try {
    console.log('Testing getAttendanceStats...');
    await getAttendanceStats();
    console.log('Testing getPaymentStats...');
    await getPaymentStats();
    console.log('Testing getTopInsights...');
    await getTopInsights();
    console.log('All functions succeeded!');
  } catch (e) {
    console.error('Error caught:');
    console.error(e);
  }
}

test();
