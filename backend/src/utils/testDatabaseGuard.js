/**
 * Strict Test Database Safety Guard
 * Prevents accidental destructive cleanup (dropDatabase, deleteMany) against production or development databases.
 * Inspects connection URI string and parsed database name directly; never relies on variable names or NODE_ENV alone.
 */

function validateTestDatabaseUri(uri) {
  if (!uri || typeof uri !== 'string') {
    throw new Error('Test database safety check failed: Missing or invalid database URI');
  }

  const trimmed = uri.trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    throw new Error(
      `Test database safety check failed: Invalid protocol in database URI '${uri}'. Must start with mongodb:// or mongodb+srv://`
    );
  }

  // Parse URI to extract database name and hostname
  let urlObj;
  try {
    const normalized = trimmed.replace(/^mongodb(\+srv)?:\/\//, 'http://');
    urlObj = new URL(normalized);
  } catch (err) {
    throw new Error(`Test database safety check failed: Malformed URI string - ${err.message}`);
  }

  // Extract database name from pathname: /dbname?options
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const dbName = pathParts.length > 0 ? pathParts[0] : '';

  if (!dbName || dbName.trim().length === 0) {
    throw new Error(
      `FATAL SAFETY VIOLATION: Database URI '${uri}' does not specify an explicit database name. Refusing destructive test execution.`
    );
  }

  const lowerDb = dbName.toLowerCase();
  const lowerHost = urlObj.hostname.toLowerCase();

  // 1. Prohibited standard and development names
  const forbiddenNames = [
    'admin',
    'config',
    'local',
    'system',
    'nexcart',
    'nexcart_db',
    'nexcart_dev',
    'nexcart_development',
    'dev',
    'development',
    'prod',
    'production',
  ];
  if (forbiddenNames.includes(lowerDb)) {
    throw new Error(
      `FATAL SAFETY VIOLATION: Database '${dbName}' is a standard or development database. Refusing destructive test cleanup.`
    );
  }

  // 2. Reject prohibited environment / non-disposable indicators in database name or hostname
  const prohibitedEnvKeywords = [
    'prod',
    'production',
    'live',
    'main',
    'master',
    'staging',
    'stage',
    'uat',
    'demo',
    'backup',
    'archive',
    'client',
    'customer',
    'real',
    'primary',
  ];
  for (const keyword of prohibitedEnvKeywords) {
    // Check if keyword is part of dbName or hostname
    const wordRegex = new RegExp(`(^|[_-])${keyword}([_-]|$)`, 'i');
    if (lowerDb === keyword || wordRegex.test(lowerDb) || lowerDb.includes(keyword)) {
      throw new Error(
        `FATAL SAFETY VIOLATION: Database name '${dbName}' contains prohibited environment indicator '${keyword}'. Refusing destructive test execution.`
      );
    }
  }

  if (
    lowerHost.includes('prod') ||
    lowerHost.includes('production') ||
    lowerHost.includes('live') ||
    lowerHost.includes('staging') ||
    lowerHost.includes('backup')
  ) {
    throw new Error(
      `FATAL SAFETY VIOLATION: Hostname '${urlObj.hostname}' indicates production environment. Refusing destructive test execution.`
    );
  }

  // 3. Reject false-positive English words that contain 'test' as a substring (e.g., latest, contest, protest)
  const falsePositiveWords = [
    'latest',
    'contest',
    'protest',
    'fastest',
    'greatest',
    'attest',
    'detest',
    'sweetest',
    'neatest',
    'smartest',
  ];
  for (const fp of falsePositiveWords) {
    if (lowerDb.includes(fp) && !/(^|[_-])test([_-]|$)/i.test(lowerDb)) {
      throw new Error(
        `FATAL SAFETY VIOLATION: Database name '${dbName}' contains misleading word '${fp}' and does not contain 'test' as a valid disposable test indicator. Refusing destructive test cleanup.`
      );
    }
  }

  // 4. Positive verification: Must match an approved disposable test database naming pattern
  // Allowed examples: nexcart_test_db, nexcart_test, test_db, test_orders, integration_test_db, unit_test
  const approvedTestPattern = /^([a-z0-9]+[_-])?test([_-][a-z0-9]+)*$/i;
  const hasTestToken = /(^|[_-])test([_-]|$)/i.test(lowerDb);

  if (!hasTestToken || !approvedTestPattern.test(lowerDb)) {
    throw new Error(
      `FATAL SAFETY VIOLATION: Database name '${dbName}' does not contain 'test' as an approved disposable test indicator. Refusing destructive test cleanup on non-test database.`
    );
  }

  // 5. Remote database guard: Prohibit destructive testing on remote clusters unless explicitly permitted
  const isLocalHost =
    lowerHost === 'localhost' ||
    lowerHost === '127.0.0.1' ||
    lowerHost === '::1' ||
    lowerHost === 'mongodb' ||
    lowerHost.endsWith('.local');

  if (!isLocalHost && process.env.ALLOW_REMOTE_TEST_DB !== 'true') {
    throw new Error(
      `FATAL SAFETY VIOLATION: Database host '${urlObj.hostname}' is remote. Destructive test cleanup on remote clusters is forbidden by default. Set ALLOW_REMOTE_TEST_DB=true to override.`
    );
  }

  return {
    isSafe: true,
    dbName,
    hostname: urlObj.hostname,
    isRemote: !isLocalHost,
  };
}

module.exports = {
  validateTestDatabaseUri,
};
