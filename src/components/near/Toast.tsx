"use client";

import { Icon } from "./Icon";

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast">
      <span className="ico">
        <Icon name="check" size={18} stroke={2.6} />
      </span>
      {message}
    </div>
  );
}
