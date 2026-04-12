import { CSSProperties, MouseEvent } from "react";

export const ui = {
  colors: {
    text: "#2a3439",
    subText: "#6b7b83",
    border: "#e1e7ea",
    borderSoft: "#edf2f4",
    bg: "#f7fafb",
    cardBg: "#ffffff",
    white: "#ffffff",
    hoverBg: "#F5F5F5",

    primary: "#5f7c8a",
    primaryText: "#ffffff",

    secondary: "#d6e2e8",
    secondaryText: "#2a3439",

    mutedButton: "#eef3f5",
    mutedButtonText: "#44545d",

    inputBorder: "#cfd8dd",
    inputDisabledBg: "#f1f5f7",

    shelfBg: "#e6eef2",
    shelfText: "#4a6572",

    tagBg: "#e8f5f2",
    tagText: "#2f5f56",

    ownedBg: "#e6f4ee",
    ownedText: "#4f7a68",

    notOwnedBg: "#eef2f4",
    notOwnedText: "#6c7a82",

    selectedBg: "#eef4f7",
    selectedBorder: "#94a9b4",

    placeholder: "#9aa8b0",
    shadow: "rgba(29, 41, 48, 0.08)",
  },

  layout: {
    page: {
      padding: "24px 16px",
      fontFamily: "sans-serif",
      background: "#f7fafb",
      minHeight: "100vh",
      boxSizing: "border-box",
    } as CSSProperties,

    pageWrap: {
      maxWidth: "820px",
      margin: "0 auto",
    } as CSSProperties,

    sectionTitle: {
      fontSize: "32px",
      margin: "0 0 10px 0",
      color: "#2a3439",
    } as CSSProperties,

    sectionDescription: {
      margin: "0 0 24px 0",
      color: "#6b7b83",
      lineHeight: 1.6,
    } as CSSProperties,
  },

  card: {
    base: {
      background: "#ffffff",
      border: "1px solid #e1e7ea",
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box",
    } as CSSProperties,

    clickable: {
      background: "#ffffff",
      border: "1px solid #e1e7ea",
      borderRadius: "12px",
      padding: "14px",
      boxSizing: "border-box",
      cursor: "pointer",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
    } as CSSProperties,

    hover: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 18px rgba(29, 41, 48, 0.08)",
    } as CSSProperties,
  },

  input: {
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      color: "#2a3439",
    } as CSSProperties,

    base: {
      width: "100%",
      padding: "12px",
      border: "1px solid #cfd8dd",
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box",
      background: "#ffffff",
      color: "#2a3439",
    } as CSSProperties,

    textarea: {
      width: "100%",
      padding: "12px",
      border: "1px solid #cfd8dd",
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box",
      background: "#ffffff",
      color: "#2a3439",
      resize: "vertical",
    } as CSSProperties,
  },

  button: {
    primary: {
      background: "#5f7c8a",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      textDecoration: "none",
    } as CSSProperties,

    secondary: {
      background: "#d6e2e8",
      color: "#2a3439",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      textDecoration: "none",
    } as CSSProperties,

    muted: {
      background: "#eef3f5",
      color: "#44545d",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      textDecoration: "none",
    } as CSSProperties,

    smallPrimary: {
      background: "#5f7c8a",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "14px",
    } as CSSProperties,

    smallSecondary: {
      background: "#d6e2e8",
      color: "#2a3439",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "14px",
    } as CSSProperties,

    smallMuted: {
      background: "#eef3f5",
      color: "#44545d",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "14px",
    } as CSSProperties,

    hoverPrimary: {
    filter: "brightness(0.95)",
    },

    hoverSecondary: {
    filter: "brightness(0.97)",
    },

    hoverMuted: {
    filter: "brightness(0.96)",
    },
  },

  badge: {
    shelf: {
      fontWeight: "bold",
      color: "#4a6572",
      background: "#FFF3CD",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,

    owned: {
      fontWeight: "bold",
      color: "#4f7a68",
      background: "#e6f4ee",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,

    notOwned: {
      fontWeight: "bold",
      color: "#6c7a82",
      background: "#eef2f4",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,
  },

  text: {
    title: {
      margin: 0,
      fontWeight: "bold",
      fontSize: "18px",
      lineHeight: 1.4,
      color: "#2a3439",
      wordBreak: "break-word",
    } as CSSProperties,

    author: {
      margin: "6px 0 0 0",
      color: "#6b7b83",
      fontSize: "13px",
      lineHeight: 1.5,
      wordBreak: "break-word",
    } as CSSProperties,

    tagsText: {
      margin: "6px 0 0 0",
      color: "#6b7b83",
      fontSize: "12px",
      lineHeight: 1.4,
      wordBreak: "break-word",
    } as CSSProperties,

    helper: {
      margin: "8px 0 0 0",
      color: "#6b7b83",
      fontSize: "13px",
    } as CSSProperties,
  },
};

export const applyHoverStyle = (
  e: MouseEvent<HTMLElement>,
  style: Partial<CSSStyleDeclaration>
) => {
  Object.assign(e.currentTarget.style, style);
};

export const clearHoverStyle = (e: MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "";
  e.currentTarget.style.boxShadow = "";
  e.currentTarget.style.filter = "";
};

export const hoverStyles = {
  card: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 18px rgba(29, 41, 48, 0.08)",
  },
  buttonPrimary: {
    filter: "brightness(0.95)",
  },
  buttonSecondary: {
    filter: "brightness(0.97)",
  },
  buttonMuted: {
    filter: "brightness(0.96)",
  },
  row: {
    background: ui.colors.selectedBg,
  },
};