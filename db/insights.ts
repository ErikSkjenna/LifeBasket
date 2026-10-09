import {rawDb} from './server';
type InsightRow=Record<string,unknown>;
export type CreatorInsights={traffic:InsightRow;signups:InsightRow;feedback:InsightRow;sources:InsightRow[];events:InsightRow[];emails:InsightRow[];responses:InsightRow[]};
export async function insights():Promise<CreatorInsights>{const db=rawDb(),since=Date.now()-90*86400000;const [traffic,signups,feedback,sources,events,emails,responses]=await db.batch([
 db.prepare('SELECT COUNT(DISTINCT visitor_id) AS visitors,COUNT(*) AS sessions,COALESCE(AVG(active_seconds),0) AS average_seconds FROM visits WHERE is_test=0 AND started_at>=?').bind(since),
 db.prepare('SELECT COUNT(*) AS total,COUNT(CASE WHEN visitor_id IN (SELECT visitor_id FROM visits WHERE is_test=0 AND started_at>=?) THEN 1 END) AS measured FROM signups WHERE is_test=0 AND created_at>=?').bind(since,since),
 db.prepare('SELECT COUNT(*) AS total,COALESCE(AVG(rating),0) AS average_rating FROM feedback WHERE is_test=0 AND created_at>=?').bind(since),
 db.prepare('SELECT source,COUNT(*) AS sessions,COUNT(DISTINCT visitor_id) AS visitors FROM visits WHERE is_test=0 AND started_at>=? GROUP BY source ORDER BY sessions DESC').bind(since),
 db.prepare('SELECT name,COUNT(*) AS total FROM events WHERE is_test=0 AND created_at>=? GROUP BY name ORDER BY total DESC').bind(since),
 db.prepare('SELECT email,created_at,source,campaign,consent,offer FROM signups WHERE is_test=0 AND created_at>=? ORDER BY created_at DESC LIMIT 500').bind(since),
 db.prepare('SELECT id,rating,comment,email,source,created_at FROM feedback WHERE is_test=0 AND created_at>=? ORDER BY created_at DESC LIMIT 200').bind(since)
]);
// Node SQLite rows have a null prototype; client props require plain objects.
const rows=(result:{results:unknown[]})=>result.results.map(row=>({...row as InsightRow}));
return {traffic:rows(traffic)[0],signups:rows(signups)[0],feedback:rows(feedback)[0],sources:rows(sources),events:rows(events),emails:rows(emails),responses:rows(responses)};
}
