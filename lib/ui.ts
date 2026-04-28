import { CSSProperties, MouseEvent } from "react";

export const ui = {
  colors: {
    // Base
    text: "#263322",
    subText: "#6F776A",
    border: "#C2C6BD",
    borderSoft: "#DDE1D8",
    bg: "#F4F7F2",
    cardBg: "#ffffff",
    white: "#ffffff",
    hoverBg: "#EEF3EA",

    // Main palette
    primary: "#4B6B46",
    primaryText: "#ffffff",

    secondary: "#FFD77F",
    secondaryText: "#263322",

    mutedButton: "#E4E9DF",
    mutedButtonText: "#4B6B46",

    inputBorder: "#C2C6BD",
    inputDisabledBg: "#E9EDE5",

    shelfBg: "#FFF1C7",
    shelfText: "#5F4616",

    tagBg: "#E4EDE0",
    tagText: "#4B6B46",

    ownedBg: "#E4EDE0",
    ownedText: "#4B6B46",

    notOwnedBg: "#E9EDE5",
    notOwnedText: "#6F776A",

    selectedBg: "#E4EDE0",
    selectedBorder: "#4B6B46",

    placeholder: "#8B9385",
    shadow: "rgba(38, 51, 34, 0.10)",

    danger: "#B04A3F",
    dangerSoft: "#F4DEDA",
  },

  layout: {
    page: {
      padding: "24px 16px",
      fontFamily: "sans-serif",
      background: "#F4F7F2",
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
      color: "#263322",
    } as CSSProperties,

    sectionDescription: {
      margin: "0 0 24px 0",
      color: "#6F776A",
      lineHeight: 1.6,
    } as CSSProperties,
  },

  card: {
    base: {
      background: "#ffffff",
      border: "1px solid #C2C6BD",
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box",
      boxShadow: "0 2px 10px rgba(38, 51, 34, 0.04)",
    } as CSSProperties,

    clickable: {
      background: "#ffffff",
      border: "1px solid #C2C6BD",
      borderRadius: "12px",
      padding: "14px",
      boxSizing: "border-box",
      cursor: "pointer",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
      boxShadow: "0 2px 10px rgba(38, 51, 34, 0.04)",
    } as CSSProperties,

    hover: {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 18px rgba(38, 51, 34, 0.10)",
    } as CSSProperties,
  },

  input: {
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      color: "#263322",
    } as CSSProperties,

    base: {
      width: "100%",
      padding: "12px",
      border: "1px solid #C2C6BD",
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box",
      background: "#ffffff",
      color: "#263322",
    } as CSSProperties,

    textarea: {
      width: "100%",
      padding: "12px",
      border: "1px solid #C2C6BD",
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box",
      background: "#ffffff",
      color: "#263322",
      resize: "vertical",
    } as CSSProperties,
  },

  button: {
    primary: {
      background: "#4B6B46",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      textDecoration: "none",
    } as CSSProperties,

    secondary: {
      background: "#FFD77F",
      color: "#263322",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      textDecoration: "none",
    } as CSSProperties,

    muted: {
      background: "#E4E9DF",
      color: "#4B6B46",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      textDecoration: "none",
    } as CSSProperties,

    back: {
      background: "transparent",
      color: "#4B6B46",
      border: "none",
      padding: "4px 2px",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "14px",
      fontWeight: "bold",
      lineHeight: 1,
      textDecoration: "none",
    } as CSSProperties,

    smallPrimary: {
      background: "#4B6B46",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
    } as CSSProperties,

    smallSecondary: {
      background: "#FFD77F",
      color: "#263322",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
    } as CSSProperties,

    smallMuted: {
      background: "#E4E9DF",
      color: "#4B6B46",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "14px",
    } as CSSProperties,

    danger: {
      background: "#B04A3F",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      textDecoration: "none",
    } as CSSProperties,

    smallDanger: {
      background: "#B04A3F",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
    } as CSSProperties,

    hoverPrimary: {
      filter: "brightness(0.95)",
    },

    hoverSecondary: {
      filter: "brightness(0.98)",
    },

    hoverMuted: {
      filter: "brightness(0.97)",
    },

    hoverDanger: {
      filter: "brightness(0.95)",
    },
  },

  badge: {
    shelf: {
      fontWeight: "bold",
      color: "#5F4616",
      background: "#FFF1C7",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,

    owned: {
      fontWeight: "bold",
      color: "#4B6B46",
      background: "#E4EDE0",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,

    notOwned: {
      fontWeight: "bold",
      color: "#6F776A",
      background: "#E9EDE5",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,

    reading: {
      fontWeight: "bold",
      color: "#263322",
      background: "#FFD77F",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,

    done: {
      fontWeight: "bold",
      color: "#4B6B46",
      background: "#E4EDE0",
      padding: "4px 8px",
      borderRadius: "999px",
      display: "inline-block",
      fontSize: "12px",
    } as CSSProperties,

    want: {
      fontWeight: "bold",
      color: "#6F776A",
      background: "#E9EDE5",
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
      color: "#263322",
      wordBreak: "break-word",
    } as CSSProperties,

    author: {
      margin: "6px 0 0 0",
      color: "#6F776A",
      fontSize: "13px",
      lineHeight: 1.5,
      wordBreak: "break-word",
    } as CSSProperties,

    tagsText: {
      margin: "6px 0 0 0",
      color: "#6F776A",
      fontSize: "12px",
      lineHeight: 1.4,
      wordBreak: "break-word",
    } as CSSProperties,

    helper: {
      margin: "8px 0 0 0",
      color: "#6F776A",
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
  e.currentTarget.style.background = "";
  e.currentTarget.style.opacity = "";
};

export const hoverStyles = {
  card: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 18px rgba(38, 51, 34, 0.10)",
  },
  buttonPrimary: {
    filter: "brightness(0.95)",
  },
  buttonSecondary: {
    filter: "brightness(0.98)",
  },
  buttonMuted: {
    filter: "brightness(0.97)",
  },
  buttonDanger: {
    filter: "brightness(0.95)",
  },
  buttonBack: {
    opacity: "0.7",
  },
  row: {
    background: ui.colors.selectedBg,
  },
};