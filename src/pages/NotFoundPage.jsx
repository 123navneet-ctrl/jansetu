import { ArrowLeft } from 'lucide-react';
import PageTitle from '../components/PageTitle';

export default function NotFoundPage({ go }) {
  return (
    <section className="page-content">
      <PageTitle
        eyebrow="404 · PAGE NOT FOUND"
        title="This page does not exist."
        subtitle="Use the dashboard to get back to your JanSetu workspace."
      />
      <button className="primary-btn" onClick={() => go('Dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} strokeWidth={2} />
        <span>Back to dashboard</span>
      </button>
    </section>
  );
}
