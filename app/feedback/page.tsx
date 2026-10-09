import {MessageSquare, ShieldCheck} from 'lucide-react';
import AppNav from '@/app/app-nav';
import Analytics from '@/app/analytics';
import FeedbackForm from './feedback-form';

export const metadata = {
  title: 'Feedback portal — LiftBasket',
  description: 'Rate LiftBasket, suggest a food or feature, and send private feedback to the maker.',
};

export default function FeedbackPage() {
  return <>
    <a className="skip" href="#feedback">Skip to feedback form</a>
    <main className="wrap tool-page feedback-page">
      <AppNav/>
      <div className="feedback-layout">
        <section className="feedback-intro" aria-labelledby="feedback-heading">
          <div className="eyebrow"><MessageSquare size={18} aria-hidden="true"/>Feedback portal</div>
          <h1 id="feedback-heading">Help shape your<br/>next grocery trip.</h1>
          <p>What worked? What got in the way? Share your experience with LiftBasket, ask for a food, or suggest your next must-have feature.</p>
        </section>
        <aside className="feedback-guidance">
          <div className="feedback-detail"><ShieldCheck size={22} aria-hidden="true"/><div><h2>A direct line to the maker.</h2><p>Your response is private. A reply email is optional; you can leave it blank.</p></div></div>
          <p className="feedback-retention">Please leave out sensitive health or payment details. After 90 days, feedback is removed when the site next receives a submission or usage update. To request earlier removal, send a message with the email you used.</p>
          <a className="textlink" href="/#features">Explore LiftBasket’s features</a>
        </aside>
        <FeedbackForm portal/>
      </div>
      <footer className="feedback-footer"><a className="textlink" href="/">Back to LiftBasket</a><a className="textlink" href="/creator#feedback" target="_top">Creator dashboard</a></footer>
      <Analytics/>
    </main>
  </>;
}
