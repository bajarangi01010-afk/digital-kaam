const { SKILLS, TIERS } = require('../config');

const JUNK_WORDS = [
  'test', 'testing', 'asdf', 'asdfgh', 'abcd', 'abcdef', 'xxxx', 'xxxxx',
  'fake', 'dummy', 'sample', 'qwerty', 'xyz', 'none', 'na', 'n/a', 'nil',
  'demo', 'hello', 'random', 'unknown', 'blank'
];

function hasRepeatedChar(str) {
  return /^(.)\1+$/.test(str.replace(/\s/g, ''));
}

function isJunkWord(str) {
  const clean = str.trim().toLowerCase();
  return JUNK_WORDS.includes(clean) || hasRepeatedChar(clean);
}

function isValidName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 50) return false;
  if (!/^[a-zA-Z\s.]+$/.test(trimmed)) return false;
  if (isJunkWord(trimmed)) return false;
  const distinctLetters = new Set(trimmed.toLowerCase().replace(/[^a-z]/g, ''));
  if (distinctLetters.size < 3) return false;
  return true;
}

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (!/^[6-9]\d{9}$/.test(trimmed)) return false;
  if (hasRepeatedChar(trimmed)) return false;
  return true;
}

function isValidCity(city) {
  if (typeof city !== 'string') return false;
  const trimmed = city.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  // Hindi, English aur anya language ke letters allow hain
  if (!/^[\p{L}\p{M}\s,.\-]+$/u.test(trimmed)) return false;
  if (isJunkWord(trimmed)) return false;
  return true;
}

function isValidSkill(skill) {
  if (typeof skill !== 'string') return false;
  const trimmed = skill.trim().toLowerCase();
  return SKILLS.some(s => s.toLowerCase() === trimmed);
}

function isValidAddress(address) {
  if (typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (trimmed.length < 10 || trimmed.length > 200) return false;
  if (isJunkWord(trimmed)) return false;
  const distinctChars = new Set(trimmed.replace(/\s/g, ''));
  if (distinctChars.size < 4) return false;
  return true;
}

function isValidTier(tier) {
  return typeof tier === 'string' && TIERS.includes(tier.trim().toLowerCase());
}

function isValidPrice(price) {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num <= 100000;
}

function isValidId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

module.exports = {
  hasRepeatedChar,
  isJunkWord,
  isValidName,
  isValidPhone,
  isValidCity,
  isValidSkill,
  isValidAddress,
  isValidTier,
  isValidPrice,
  isValidId
};
