const fs = require('fs');
const path = require('path');

const enPath = path.join('E:', 'attendance-system', 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join('E:', 'attendance-system', 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if(Array.isArray(obj[el])) {
      return res;
    } else if(typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

const enKeys = getKeys(en);
const arKeys = getKeys(ar);

const missingInAr = enKeys.filter(k => !arKeys.includes(k));
const missingInEn = arKeys.filter(k => !enKeys.includes(k));

console.log('Total English Keys:', enKeys.length);
console.log('Total Arabic Keys:', arKeys.length);
console.log('Missing in Arabic:', missingInAr.length > 0 ? missingInAr.slice(0, 10).join(', ') + (missingInAr.length > 10 ? '...' : '') : 'None');
console.log('Missing in English:', missingInEn.length > 0 ? missingInEn.slice(0, 10).join(', ') + (missingInEn.length > 10 ? '...' : '') : 'None');
