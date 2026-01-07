import { credentials } from '../support/credentials.js';

/**
 * Substitute credential placeholders in strings
 * Supports:
 * - <BASE_URL> -> baseUrl
 * - <LOGIN_URL> -> loginUrl
 * - <SEARCH_JOBS_URL> -> searchJobsUrl
 * - <USERNAME> -> username
 * - <PASSWORD> -> password
 * - <PROPERTY_CODE> -> propertyCode
 * - <PROPERTY_SEARCH_TERM> -> propertySearchTerm
 * - <DURATION> -> duration
 * - <ADAPTATION> -> adaptation
 * - <JOB_LOCATION> -> jobLocation
 */
export function substituteCredentials(text: string): string {
  let result = text;

  // Environment URLs
  result = result.replace(/<BASE_URL>/g, credentials.testEnvironment.baseUrl);
  result = result.replace(/<LOGIN_URL>/g, credentials.testEnvironment.loginUrl);
  result = result.replace(/<SEARCH_JOBS_URL>/g, credentials.testEnvironment.searchJobsUrl);

  // User credentials
  result = result.replace(/<USERNAME>/g, credentials.testUser.username);
  result = result.replace(/<PASSWORD>/g, credentials.testUser.password);

  // Test data
  result = result.replace(/<PROPERTY_CODE>/g, credentials.testData.propertyCode);
  result = result.replace(/<PROPERTY_SEARCH_TERM>/g, credentials.testData.propertySearchTerm);
  result = result.replace(/<DURATION>/g, credentials.testData.duration);
  result = result.replace(/<ADAPTATION>/g, credentials.testData.adaptation);
  result = result.replace(/<JOB_LOCATION>/g, credentials.testData.jobLocation);

  return result;
}
