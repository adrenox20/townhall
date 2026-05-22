import IssueDetailPage from './issue-detail-client';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function Page() {
  return <IssueDetailPage />;
}
