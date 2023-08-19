import "./progress-bar.css";

interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <div
        className="progress-bar-content"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}
