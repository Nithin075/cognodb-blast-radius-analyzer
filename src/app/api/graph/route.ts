import { NextResponse } from 'next/server';
import { getDriver } from '@/lib/cognodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startId = searchParams.get('startId');

  let session;
  try {
    const driver = getDriver();
    session = driver.session();

    let query = '';
    let params: Record<string, any> = {};

    if (startId) {
      query = `
        MATCH (start)
        WHERE start.id = $startId OR start.cve =$startId
        MATCH path = (start)-[r*1..4]-(target)
        WITH collect(path) AS paths
        UNWIND paths AS p
        UNWIND nodes(p) AS n
        UNWIND relationships(p) AS rel
        RETURN collect(DISTINCT {
          id: coalesce(n.id, n.cve),
          label: head(labels(n)),
          name: coalesce(n.name, n.cve),
          details: properties(n)
        }) AS nodes,
        collect(DISTINCT {
          source: coalesce(startNode(rel).id, startNode(rel).cve),
          target: coalesce(endNode(rel).id, endNode(rel).cve),
          type: type(rel)
        }) AS links
      `;
      params = { startId };
    } else {
      query = `
        MATCH (n)
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN collect(DISTINCT {
          id: coalesce(n.id, n.cve),
          label: head(labels(n)),
          name: coalesce(n.name, n.cve),
          details: properties(n)
        }) AS nodes,
        collect(DISTINCT {
          source: coalesce(n.id, n.cve),
          target: coalesce(m.id, m.cve),
          type: type(r)
        }) AS links
      `;
    }

    const result = await session.run(query, params);

    if (result.records.length === 0) {
      return NextResponse.json({ nodes: [], links: [] });
    }

    const record = result.records[0];
    const rawNodes = record.get('nodes') || [];
    const rawLinks = record.get('links') || [];

    // Filter out null/undefined link targets from OPTIONAL MATCH
    const cleanLinks = rawLinks.filter(
      (link: any) => link.source && link.target && link.type
    );

    return NextResponse.json({
      nodes: rawNodes,
      links: cleanLinks,
    });
  } catch (error: any) {
    console.error('API Traversal Error:', error);
    return NextResponse.json(
      { error: error.message || 'Database error occurred' },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.close();
    }
  }
}