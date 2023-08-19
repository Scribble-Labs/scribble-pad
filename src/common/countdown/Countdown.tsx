import clsx from "clsx";
import React, { useEffect, useState } from "react";
import "./countdown.css";

interface CountdownClasses {
  root?: string;
  value?: string;
  text?: string;
}

function CountdownItem({
  text,
  value,
  classes = {},
}: {
  text: React.ReactNode;
  value: number;
  classes?: CountdownClasses;
}) {
  return (
    <span className={clsx("countdown-item box", classes.root)}>
      <span className={clsx("countdown-item-value", classes.value)}>
        {`${value < 10 ? `0${value}` : value}`}
      </span>
    </span>
  );
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown({
  endDate,
  countdownClasses,
  className,
  onComplete,
}: {
  endDate: Date;
  className?: string;
  countdownClasses?: CountdownClasses;
  onComplete?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | undefined>();
  useEffect(() => {
    function refresh() {
      const now = Date.now();
      let diff = (endDate.getTime() - now) / 1000;
      if (diff <= 0) {
        clearInterval(interval);
        onComplete && onComplete();
      }
      const seconds = Math.floor(diff) % 60;
      const minutes = (diff = Math.floor(diff / 60)) % 60;
      const hours = (diff = Math.floor(diff / 60)) % 24;
      const days = (diff = Math.floor(diff / 24));
      if (days < 10) days;
      setTimeLeft({ days, hours, minutes, seconds });
    }
    const interval = setInterval(refresh, 500);
    return () => clearInterval(interval);
  }, [endDate, setTimeLeft, onComplete]);

  return !timeLeft ? null : (
    <div
      className={clsx("countdown", className)}
      style={{
        color: "#049bc2",
        fontWeight: "600",
        fontSize: "1.5rem",
        backgroundColor: "#049cc23c",
        padding: "8px",
        borderRadius: "15px",
      }}
    >
      STARTS IN:{" "}
      {timeLeft.days > 0 && (
        <CountdownItem
          classes={countdownClasses}
          text="days"
          value={timeLeft.days}
        />
      )}
      :
      <CountdownItem
        classes={countdownClasses}
        text="hs"
        value={timeLeft.hours}
      />{" "}
      :
      <CountdownItem
        classes={countdownClasses}
        text="mins"
        value={timeLeft.minutes}
      />{" "}
      :
      <CountdownItem
        classes={countdownClasses}
        text="secs"
        value={timeLeft.seconds}
      />
    </div>
  );
}
