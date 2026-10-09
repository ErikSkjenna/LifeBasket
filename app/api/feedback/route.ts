import {rawDb, readPayload, rateLimit, validEmail, small, testRequest, UUID, RequestError, fail} from '@/db/server';

export async function POST(request: Request) {
  try {
    const body = await readPayload(request);
    if (small(body.website)) throw new RequestError('Please leave the website field empty.');
    if (typeof body.id !== 'string' || !UUID.test(body.id) || !Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5) {
      throw new RequestError('Select a usefulness rating from 1 to 5.');
    }
    if (typeof body.comment !== 'string' || body.comment.length > 2000) throw new RequestError('Keep feedback under 2,000 characters.');
    if (body.email && !validEmail(body.email)) throw new RequestError('Enter a valid reply email or leave it empty.');
    await rateLimit(request, 'feedback', 20);
    const comment = small(body.comment, 2000), email = small(body.email, 254) || null;
    const db = rawDb();
    const inserted = await db.prepare('INSERT INTO feedback(id,created_at,rating,comment,email,source,is_test) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id')
      .bind(body.id, Date.now(), body.rating, comment, email, small(body.source, 60) || 'direct', await testRequest(request)).first();
    if (!inserted) {
      const original = await db.prepare('SELECT rating,comment,email FROM feedback WHERE id=?').bind(body.id)
        .first<{rating: number; comment: string; email: string | null}>();
      if (!original || original.rating !== body.rating || original.comment !== comment || original.email !== email) {
        throw new RequestError('This response was already saved with different details. Reload the form to send a new response.', 409);
      }
    }
    return Response.json({saved: true}, {status: 201});
  } catch (error) {
    return fail(error);
  }
}
