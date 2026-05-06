import type { ReactNode } from "react";
import { ui } from "../lib/ui";
import { EbookDeviceBookIcon, OwnedOpenBookIcon } from "./icons";

type BookBadgesProps = {
  owned?: boolean;
  isEbook?: boolean;
};

function Badge({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <span title={title} aria-label={title} style={ui.bookBadge.icon}>
      {children}
    </span>
  );
}

export default function BookBadges({ owned, isEbook }: BookBadgesProps) {
  if (!owned && !isEbook) {
    return null;
  }

  return (
    <div style={ui.bookBadge.wrap}>
      {owned && (
        <Badge title="所持">
          <OwnedOpenBookIcon />
        </Badge>
      )}

      {isEbook && (
        <Badge title="電子書籍">
          <EbookDeviceBookIcon />
        </Badge>
      )}
    </div>
  );
}