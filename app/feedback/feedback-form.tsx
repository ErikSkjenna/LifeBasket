'use client';

import {useEffect, useId, useRef, useState, type FormEvent} from 'react';
import {CheckCircle2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {attribution} from '@/app/analytics';

export default function FeedbackForm({portal = false}: {portal?: boolean}) {
  const fieldId = useId();
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [error, setError] = useState('');
  const attempt = useRef<{id: string; content: string} | null>(null);
  const pending = useRef(false);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);

  useEffect(() => {if (error) errorMessage.current?.focus();}, [error]);
  useEffect(() => {if (status === 'success') confirmation.current?.focus();}, [status]);

  async function sendFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || status === 'success') return;
    if (!rating) {
      setError('Choose a usefulness rating from 1 to 5.');
      return;
    }
    pending.current = true;
    setStatus('saving');
    setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const details = {rating: Number(rating), comment: comment.trim(), email: email.trim(), website};
      const content = JSON.stringify(details);
      // Retry an unchanged response with the same key; an edit is a new response.
      if (attempt.current?.content !== content) attempt.current = {id: crypto.randomUUID(), content};
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        signal: controller.signal,
        body: JSON.stringify({
          ...attribution(),
          id: attempt.current.id,
          ...details,
        }),
      });
      const result = await response.json().catch(() => null) as {saved?: boolean; error?: string} | null;
      if (!response.ok || result?.saved !== true) {
        throw new Error(result?.error || 'We could not confirm your submission. Your entries are still here; please try again.');
      }
      setStatus('success');
    } catch (failure) {
      setStatus('idle');
      setError(failure instanceof Error && failure.name !== 'AbortError' && failure.name !== 'TypeError'
        ? failure.message
        : 'We could not confirm your submission. Check your connection and try again. Your entries are still here.');
    } finally {
      clearTimeout(timeout);
      pending.current = false;
    }
  }

  return <form id="feedback" className="feedback-form" onSubmit={sendFeedback} aria-labelledby={`${fieldId}-title`} aria-busy={status === 'saving'}>
    <h2 id={`${fieldId}-title`}>{portal ? 'Share your experience' : 'Make it better with us.'}</h2>
    <p>A quick rating and one honest thought help shape what comes next.</p>
    {status === 'success' ? <div className="feedback-confirmation" role="status">
      <CheckCircle2 size={32} aria-hidden="true"/>
      <h3 ref={confirmation} tabIndex={-1}>Thanks. Your feedback is saved.</h3>
      <p>Erik can review your response in Creator dashboard. Your message is private, and you haven’t joined an email list.</p>
      <a className="button" href="/#calculator">Back to my basket</a>
    </div> : <>
      <fieldset disabled={status === 'saving'}>
        <legend id={`${fieldId}-rating-label`}>How useful is LiftBasket? <span>(required)</span></legend>
        <RadioGroup className="rating-grid" value={rating} onValueChange={value => {setRating(value); setError('');}}
          aria-labelledby={`${fieldId}-rating-label`} aria-describedby={`${fieldId}-rating-help`} aria-required="true"
          aria-invalid={!!error && !rating} disabled={status === 'saving'}>
          {[1, 2, 3, 4, 5].map(value => <label className="rating-option" key={value} htmlFor={`${fieldId}-rating-${value}`}>
            <RadioGroupItem id={`${fieldId}-rating-${value}`} value={String(value)} aria-label={`${value} out of 5${value === 1 ? ', not useful' : value === 5 ? ', very useful' : ''}`}/>
            <span>{value}</span>
          </label>)}
        </RadioGroup>
        <div className="rating-endpoints" id={`${fieldId}-rating-help`}><span>1 · Not useful</span><span>5 · Very useful</span></div>
        <label htmlFor={`${fieldId}-comment`}>What would make this better? <span>(optional)</span></label>
        <Textarea id={`${fieldId}-comment`} maxLength={2000} rows={5} value={comment}
          onChange={event => setComment(event.target.value)} aria-describedby={`${fieldId}-count`}
          placeholder="Suggest a food or feature, describe a problem, or tell us what helped."/>
        <p className="feedback-count" id={`${fieldId}-count`}>{comment.length.toLocaleString()} / 2,000 characters</p>
        <label htmlFor={`${fieldId}-email`}>Email for a reply <span>(optional)</span></label>
        <Input id={`${fieldId}-email`} type="email" autoComplete="email" maxLength={254} value={email}
          onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/>
        <div className="hp" aria-hidden="true"><label htmlFor={`${fieldId}-website`}>Website</label>
          <Input id={`${fieldId}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)}/>
        </div>
      </fieldset>
      <p className="feedback-privacy">Only the maker can review your response through the app. Adding an email does not subscribe you to updates.</p>
      {error && <p className="form-error" role="alert" ref={errorMessage} tabIndex={-1}>{error}</p>}
      <Button className="button" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Sending feedback…' : 'Send feedback'}</Button>
    </>}
  </form>;
}
