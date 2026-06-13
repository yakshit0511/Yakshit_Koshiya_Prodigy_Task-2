import React from 'react';
import { Link } from 'react-router-dom';

const ErrorPageShell = ({
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  secondaryTo,
  onSecondaryAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  actionTo: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
  onSecondaryAction?: () => void;
}) => {
  return (
    <div className="error-page-shell">
      <div className="error-card">
        <div className="error-badge">EMS Portal</div>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="error-actions">
          {onAction ? (
            <button className="btn btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          ) : (
            <Link className="btn btn-primary" to={actionTo}>
              {actionLabel}
            </Link>
          )}
          {secondaryLabel && secondaryTo && (
            onSecondaryAction ? (
              <button className="btn btn-secondary" onClick={onSecondaryAction}>
                {secondaryLabel}
              </button>
            ) : (
              <Link className="btn btn-secondary" to={secondaryTo}>
                {secondaryLabel}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export const UnauthorizedPage = () => (
  <ErrorPageShell
    title="Session expired"
    message="Please log in again to continue."
    actionLabel="Go to Login"
    actionTo="/login"
  />
);

export const ForbiddenPage = () => (
  <ErrorPageShell
    title="Access denied"
    message="You do not have permission to view this resource."
    actionLabel="Go Back"
    actionTo="/dashboard"
    onAction={() => window.history.back()}
  />
);

export const NotFoundPage = () => (
  <ErrorPageShell
    title="Page not found"
    message="The page you requested does not exist."
    actionLabel="Go Home"
    actionTo="/dashboard"
  />
);

export const ServerErrorPage = () => (
  <ErrorPageShell
    title="Server error"
    message="Something went wrong on the server. Please retry."
    actionLabel="Retry"
    actionTo="/dashboard"
    onAction={() => window.location.reload()}
  />
);

export const NetworkErrorPage = () => (
  <ErrorPageShell
    title="Network error"
    message="No internet connection detected. Please check your network and try again."
    actionLabel="Retry"
    actionTo="/dashboard"
    onAction={() => window.location.reload()}
  />
);
