import clsx from "clsx";
import { useEffect, useState } from "react";
import ProgressBar from "../../common/progress-bar/ProgressBar";
import { MintMessage } from "../mint.store";
import "./mint-message-info.css";

const DEFAULT_TIME_TO_HIDE = 5000;

interface MintMessageProps {
  message?: MintMessage;
  clearMessage: () => void;
}

export default function MintMessageInfo({
  message,
  clearMessage,
}: MintMessageProps) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (message) {
      setShow(true);
    }
    if (message && message.autoHide) {
      const timeToHide = message.timeToHide || DEFAULT_TIME_TO_HIDE;
      const hideTimeout = setTimeout(() => setShow(false), timeToHide);
      const clearMessageTimeout = setTimeout(clearMessage, timeToHide + 500);
      return () => {
        clearTimeout(hideTimeout);
        clearTimeout(clearMessageTimeout);
      };
    }
  }, [message, setShow, clearMessage]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={clsx(
        "mint-message box",
        !show && "mint-message-hide",
        `mint-message-${message.severity}`
      )}
    >
      {message.progress !== undefined && (
        <ProgressBar value={message.progress} />
      )}
      <span className="mint-message-text">{message.text}</span>
    </div>
  );
}
