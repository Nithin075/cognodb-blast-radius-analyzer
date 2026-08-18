import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const uri = process.env.COGNODB_URI!;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD!;

async function runSeed() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    console.log('Clearing old data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Writing seed graph...');
    await session.run(`
      CREATE (u1:User {id: 'usr_1', name: 'Alice Dev', roleType: 'Junior Engineer'})
      CREATE (u2:User {id: 'usr_2', name: 'Bob SecOps', roleType: 'Security Analyst'})
      CREATE (u3:User {id: 'usr_3', name: 'Eve Intern', roleType: 'Marketing Intern'})

      CREATE (r1:Role {id: 'role_dev', name: 'DeveloperRole'})
      CREATE (r2:Role {id: 'role_ops', name: 'DevOpsLeadRole'})
      CREATE (r3:Role {id: 'role_admin', name: 'ClusterAdminRole'})

      CREATE (vm1:ComputeInstance {id: 'vm_prod', name: 'Payment-API-Gateway', ip: '10.0.1.20'})
      CREATE (vm2:ComputeInstance {id: 'vm_internal', name: 'Internal-Wiki', ip: '10.0.2.14'})

      CREATE (b1:S3Bucket {id: 'bkt_pii', name: 'customer-credit-cards', classification: 'CRITICAL'})
      CREATE (b2:S3Bucket {id: 'bkt_logs', name: 'app-telemetry-logs', classification: 'LOW'})

      CREATE (v1:Vulnerability {cve: 'CVE-2026-8812', name: 'Remote Code Execution', severity: 'CRITICAL'})
      CREATE (v2:Vulnerability {cve: 'CVE-2025-1094', name: 'Info Disclosure', severity: 'MEDIUM'})

      // Relationships
      CREATE (u1)-[:ASSIGNED_TO]->(r1)
      CREATE (u2)-[:ASSIGNED_TO]->(r2)
      CREATE (u3)-[:ASSIGNED_TO]->(r1)

      CREATE (r1)-[:CAN_ASSUME]->(r2)
      CREATE (r2)-[:CAN_ASSUME]->(r3)

      CREATE (r3)-[:HAS_ACCESS {level: 'FULL_ADMIN'}]->(b1)
      CREATE (r1)-[:HAS_ACCESS {level: 'READ_ONLY'}]->(b2)

      CREATE (vm1)-[:RUNS_AS]->(r3)
      CREATE (vm2)-[:RUNS_AS]->(r1)

      CREATE (v1)-[:EXPLOITS]->(vm1)
      CREATE (v2)-[:EXPLOITS]->(vm2)
    `);

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

runSeed();