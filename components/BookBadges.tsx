import { ui } from "../lib/ui";

function OwnedOpenBookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 7C10.8 6.2 9.1 5.8 7.5 5.8C6.4 5.8 5.4 6 4.5 6.4V17.5C5.4 17.1 6.4 16.9 7.5 16.9C9.1 16.9 10.8 17.3 12 18.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7C13.2 6.2 14.9 5.8 16.5 5.8C17.6 5.8 18.6 6 19.5 6.4V17.5C18.6 17.1 17.6 16.9 16.5 16.9C14.9 16.9 13.2 17.3 12 18.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7V18.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EbookDeviceBookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 8.2C9.8 7.8 10.8 7.6 12 7.8V14.8C10.8 14.5 9.8 14.7 9 15.1V8.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.8C13.2 7.6 14.2 7.8 15 8.2V15.1C14.2 14.7 13.2 14.5 12 14.8V7.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 18H13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type BookBadgesProps = {
  owned?: boolean;
  isEbook?: boolean;
};

function Badge({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <span
      title={title}
      aria-label={title}
      style={{
        width: "28px",
        height: "28px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "999px",
        border: `1px solid ${ui.colors.primary}`,
        background: ui.colors.cardBg,
        color: ui.colors.primary,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

export default function BookBadges({ owned, isEbook }: BookBadgesProps) {
  if (!owned && !isEbook) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
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