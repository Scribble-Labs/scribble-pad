import clsx from "clsx";
import "./mint-loading.css";

export default function MintLoading({
  show,
  className,
}: {
  show: boolean;
  className: string;
}) {
  return (
    <div className={className}>
      <div className={clsx("loader", show && "loader-show")}>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
