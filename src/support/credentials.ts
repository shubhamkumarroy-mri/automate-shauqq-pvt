import * as fs from 'fs';
import * as path from 'path';

interface TestEnvironment {
  baseUrl: string;
  loginUrl: string;
  searchJobsUrl: string;
}

interface TestUser {
  username: string;
  password: string;
}

interface TestData {
  propertyCode: string;
  propertySearchTerm: string;
  duration: string;
  adaptation: string;
  jobLocation: string;
}

interface CredentialsConfig {
  testEnvironment: TestEnvironment;
  testUser: TestUser;
  testData: TestData;
}

export function loadCredentials(): CredentialsConfig {
  const credentialsPath = path.join(process.cwd(), 'config.credentials.json');

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `Credentials file not found at ${credentialsPath}. Please copy config.credentials.example.json to config.credentials.json and fill in your values.`
    );
  }

  const rawData = fs.readFileSync(credentialsPath, 'utf-8');
  return JSON.parse(rawData) as CredentialsConfig;
}

export const credentials = loadCredentials();
