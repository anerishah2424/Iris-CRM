import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-center px-4">
      <div className="w-14 h-14 bg-matrix-blue rounded-2xl flex items-center justify-center mb-6">
        <span className="text-white text-2xl font-bold">IR</span>
      </div>
      <h1 className="text-[80px] font-bold text-matrix-navy leading-none">404</h1>
      <h2 className="text-[24px] font-semibold text-matrix-navy mt-2 mb-2">Page not found</h2>
      <p className="text-muted text-sm mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
