import neo4j, { Driver } from 'neo4j-driver';

const uri = process.env.COGNODB_URI!;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD!;

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!uri || !password) {
    throw new Error('Database credentials are missing in environment variables.');
  }
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000,
      maxConnectionPoolSize: 20,
    });
  }
  return driver;
}