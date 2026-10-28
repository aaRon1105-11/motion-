interface Props {
  text: string;
  recentCommit?: string;
  isBusy: boolean;
}

export default function StatusBar({ text, recentCommit, isBusy }: Props) {
  return (
    <footer className="status-bar">
      <div className="status-left">
        <span className={`status-indicator ${isBusy ? 'busy' : 'idle'}`} />
        <span className="status-text">{text}</span>
      </div>
      {recentCommit && (
        <div className="status-right">
          <span className="git-commit-label">Git HEAD:</span>
          <span className="git-commit-hash">{recentCommit}</span>
        </div>
      )}
    </footer>
  );
}
