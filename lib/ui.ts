import { CSSProperties, MouseEvent } from "react";

export const ui = {
  colors: {
  // Nordic minimal redesign
  text: "#2B2F33",
  subText: "#6B7280",

  bg: "#FFFFFF",
  cardBg: "#FFFFFF",
  white: "#FFFFFF",

  surface: "#F2F4F6",
  hoverBg: "#F7FAFA",

  border: "#E7EAED",
  borderSoft: "#EEF2F4",

  primary: "#3E5572",
  primaryText: "#FFFFFF",

  secondary: "#5FA7A2",
  secondaryText: "#FFFFFF",

  accent: "#5FA7A2",
  accentText: "#FFFFFF",

  accentLight: "#D8ECEA",
  accentSoft: "#EEF8F7",
  accentTextDark: "#2F6F6A",

  mutedButton: "#F2F4F6",
  mutedButtonText: "#6B7280",

  inputBorder: "#D8DEE5",
  inputDisabledBg: "#F2F4F6",

  shelfBg: "#EEF8F7",
  shelfText: "#2F6F6A",

  tagBg: "#EEF8F7",
  tagText: "#2F6F6A",

  ownedBg: "#EEF8F7",
  ownedText: "#2F6F6A",

  notOwnedBg: "#F2F4F6",
  notOwnedText: "#6B7280",

  selectedBg: "#E8F6F5",
  selectedBorder: "#5FA7A2",

  placeholder: "#8B95A1",
  shadow: "rgba(43, 47, 51, 0.08)",

  danger: "#B45B5B",
  dangerSoft: "#F6EEEE",
},

  shadows: {
    header: "0 2px 10px rgba(43, 47, 51, 0.04)",
    card: "0 2px 10px rgba(43, 47, 51, 0.04)",
    cardHover: "0 6px 18px rgba(43, 47, 51, 0.10)",
    bottomNav: "0 -4px 12px rgba(43, 47, 51, 0.06)",
    floatingButton: "0 6px 16px rgba(43, 47, 51, 0.16)",
  },

  header: {
  fixed: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    background: "#FFFFFF",
    borderBottom: "1px solid #E7EAED",
    boxShadow: "0 2px 10px rgba(43, 47, 51, 0.04)",
    padding: "14px 16px 10px",
  } as CSSProperties,

    inner: {
      maxWidth: "820px",
      margin: "0 auto",
      position: "relative",
      minHeight: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    } as CSSProperties,

    backLink: {
      position: "absolute",
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#3E5572",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
    } as CSSProperties,

    title: {
      margin: 0,
      color: "#3E5572",
      fontSize: "22px",
      fontWeight: 700,
      letterSpacing: "0.02em",
      textAlign: "center",
    } as CSSProperties,
  },

  bookBadge: {
    wrap: {
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      alignItems: "center",
    } as CSSProperties,

    icon: {
      width: "28px",
      height: "28px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "999px",
      border: "1px solid #3E5572",
      background: "#ffffff",
      color: "#3E5572",
      lineHeight: 1,
      flexShrink: 0,
    } as CSSProperties,
  },

    bottomNav: {
    nav: {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      background: "#ffffff",
      borderTop: "1px solid #D8DEE5",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "2px 0 calc(10px + env(safe-area-inset-bottom))",
      zIndex: 1000,
      boxShadow: "0 -4px 12px rgba(43, 47, 51, 0.06)",
    } as CSSProperties,

    link: {
      flex: 1,
      textAlign: "center",
      textDecoration: "none",
      padding: "8px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    } as CSSProperties,

    centerLink: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      textDecoration: "none",
      color: "#3E5572",
    } as CSSProperties,

    centerButton: {
      width: "56px",
      height: "56px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#5FA7A2",
      color: "#ffffff",
      boxShadow: "0 6px 16px rgba(43, 47, 51, 0.16)",
      transform: "translateY(-22px)",
    } as CSSProperties,

    activeColor: "#3E5572",
    inactiveColor: "#6B7280",
  },

  homePage: {
  pageWrap: {
    maxWidth: "820px",
    margin: "0 auto",
  } as CSSProperties,

  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  } as CSSProperties,

  booksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    marginTop: "16px",
  } as CSSProperties,

  bookCardBadgeArea: {
    position: "absolute",
    top: "12px",
    right: "12px",
    zIndex: 1,
  } as CSSProperties,

  bookTextArea: {
  flex: 1,
  minWidth: 0,
} as CSSProperties,

bookTextAreaWithOneBadge: {
  flex: 1,
  minWidth: 0,
  paddingRight: "42px",
} as CSSProperties,

bookTextAreaWithTwoBadges: {
  flex: 1,
  minWidth: 0,
  paddingRight: "76px",
} as CSSProperties,

  bookMetaText: {
    fontSize: "13px",
    color: "#6B7280",
    marginTop: "4px",
    lineHeight: 1.5,
  } as CSSProperties,

  inlineBadgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  } as CSSProperties,

  sectionDivider: {
    gridColumn: "1 / -1",
    marginBottom: "32px",
    paddingBottom: "28px",
    borderBottom: "1px solid #D8DEE5",
  } as CSSProperties,

  clearButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#6B7280",
  } as CSSProperties,
},

addPage: {
  pageWrap: {
    maxWidth: "760px",
    margin: "0 auto",
  } as CSSProperties,

  tabRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
  } as CSSProperties,

  tabButton: {
    border: "1px solid #D8DEE5",
    background: "#ffffff",
    color: "#2B2F33",
    borderRadius: "999px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
  } as CSSProperties,

  tabButtonActive: {
    background: "#3E5572",
    color: "#ffffff",
    border: "1px solid #3E5572",
  } as CSSProperties,

  sectionCard: {
    background: "#ffffff",
    border: "1px solid #D8DEE5",
    borderRadius: "14px",
    padding: "20px",
  } as CSSProperties,

  searchRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "stretch",
  } as CSSProperties,

  searchInputWrap: {
    position: "relative",
    flex: 1,
    minWidth: "220px",
  } as CSSProperties,

  searchInput: {
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  } as CSSProperties,

  clearButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#6B7280",
    cursor: "pointer",
    padding: "4px",
    fontSize: "18px",
    lineHeight: 1,
  } as CSSProperties,

  resultList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  } as CSSProperties,

  resultCard: {
    position: "relative",
    border: "1px solid #D8DEE5",
    borderRadius: "12px",
    background: "#ffffff",
    padding: "14px",
    cursor: "pointer",
    transition:
      "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease",
  } as CSSProperties,

  resultCardSelected: {
  background: "#E8F2F1",
  border: "1px solid #5FA7A2",
  boxShadow: "0 0 0 2px rgba(95, 167, 162, 0.16)",
} as CSSProperties,

  resultCardInner: {
    display: "grid",
    gridTemplateColumns: "72px 1fr",
    gap: "12px",
    alignItems: "start",
  } as CSSProperties,

  resultCover: {
    width: "72px",
    minWidth: "72px",
    borderRadius: "6px",
    display: "block",
  } as CSSProperties,

  resultCoverPlaceholder: {
    width: "72px",
    height: "108px",
    borderRadius: "6px",
    background: "#E7EAED",
    color: "#8B95A1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  } as CSSProperties,

  selectedArea: {
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #E7EAED",
  } as CSSProperties,

  selectedTitle: {
    margin: "0 0 12px 0",
    fontWeight: "bold",
    color: "#2B2F33",
  } as CSSProperties,

  bookRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "16px",
    alignItems: "start",
  } as CSSProperties,

  selectedCover: {
    width: "100%",
    maxWidth: "140px",
    borderRadius: "8px",
    display: "block",
  } as CSSProperties,

  selectedCoverPlaceholder: {
    width: "100%",
    maxWidth: "140px",
    aspectRatio: "2 / 3",
    borderRadius: "8px",
    background: "#E7EAED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8B95A1",
    fontSize: "13px",
  } as CSSProperties,

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    color: "#2B2F33",
  } as CSSProperties,

  checkboxLabelNoMargin: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#2B2F33",
  } as CSSProperties,

  actionArea: {
    marginTop: "16px",
  } as CSSProperties,

  manualGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
  } as CSSProperties,

  manualActionArea: {
    marginTop: "8px",
  } as CSSProperties,
},

bookEditPage: {
  pageWrap: {
    maxWidth: "760px",
    margin: "0 auto",
  } as CSSProperties,

  formCard: {
    background: "#ffffff",
    border: "1px solid #D8DEE5",
    borderRadius: "14px",
    padding: "20px",
  } as CSSProperties,

  topArea: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "20px",
    alignItems: "start",
    marginBottom: "24px",
  } as CSSProperties,

  coverImage: {
    width: "100%",
    maxWidth: "120px",
    borderRadius: "8px",
    display: "block",
  } as CSSProperties,

  coverPlaceholder: {
    width: "100%",
    maxWidth: "120px",
    aspectRatio: "2 / 3",
    background: "#E7EAED",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8B95A1",
    fontSize: "13px",
  } as CSSProperties,

  previewTitle: {
    margin: 0,
    fontWeight: "bold",
    fontSize: "22px",
    lineHeight: 1.5,
    color: "#2B2F33",
    wordBreak: "break-word",
  } as CSSProperties,

  previewAuthor: {
    margin: "8px 0 0 0",
    color: "#6B7280",
    fontSize: "14px",
    wordBreak: "break-word",
  } as CSSProperties,

  badgeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "12px",
  } as CSSProperties,

  ebookBadge: {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#EEF2F4",
    color: "#2B2F33",
    border: "1px solid #D8DEE5",
  } as CSSProperties,

  tabRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "20px",
  } as CSSProperties,

  tabButton: {
    border: "1px solid #D8DEE5",
    background: "#ffffff",
    color: "#2B2F33",
    borderRadius: "999px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
  } as CSSProperties,

  tabButtonActive: {
    background: "#3E5572",
    color: "#ffffff",
    border: "1px solid #3E5572",
  } as CSSProperties,

  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px 16px",
  } as CSSProperties,

  fieldFull: {
    gridColumn: "1 / -1",
  } as CSSProperties,

  dateInput: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  } as CSSProperties,

  dateInputDisabled: {
    background: "#E7EAED",
  } as CSSProperties,

  dateInputEnabled: {
    background: "#ffffff",
  } as CSSProperties,

  smallButtonArea: {
    marginTop: "8px",
  } as CSSProperties,

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    border: "1px solid #D8DEE5",
    borderRadius: "8px",
    background: "#ffffff",
    fontSize: "16px",
    color: "#2B2F33",
    boxSizing: "border-box",
  } as CSSProperties,

  tagArea: {
    position: "relative",
  } as CSSProperties,

  tagInputBox: {
    minHeight: "48px",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
    padding: "8px 10px",
  } as CSSProperties,

  tagChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#EEF2F4",
    color: "#3E5572",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    lineHeight: 1,
  } as CSSProperties,

  tagRemoveButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#3E5572",
    fontSize: "14px",
    padding: 0,
    lineHeight: 1,
  } as CSSProperties,

  tagInnerInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    flex: 1,
    minWidth: "140px",
    fontSize: "14px",
    color: "#2B2F33",
  } as CSSProperties,

  helperSmall: {
    margin: "6px 0 0 0",
    color: "#6B7280",
    fontSize: "12px",
  } as CSSProperties,

  suggestionList: {
    position: "absolute",
    top: "86px",
    left: 0,
    right: 0,
    background: "#ffffff",
    border: "1px solid #D8DEE5",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(43, 47, 51, 0.10)",
    maxHeight: "180px",
    overflowY: "auto",
    zIndex: 10,
  } as CSSProperties,

  suggestionButton: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    background: "#ffffff",
    border: "none",
    borderBottom: "1px solid #E7EAED",
    cursor: "pointer",
    fontSize: "14px",
    color: "#2B2F33",
  } as CSSProperties,

  memoTextarea: {
    minHeight: "120px",
    resize: "vertical",
  } as CSSProperties,

  dateMeta: {
    margin: "8px 0 0 0",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.5,
  } as CSSProperties,

  updatedMeta: {
    margin: "4px 0 0 0",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.5,
  } as CSSProperties,

  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px",
  } as CSSProperties,
},

  managePage: {
  pageWrap: {
    maxWidth: "720px",
    margin: "0 auto",
  } as CSSProperties,

  authBox: {
    maxWidth: "400px",
    margin: "100px auto",
  } as CSSProperties,

  description: {
    marginBottom: "20px",
  } as CSSProperties,

  menuGrid: {
    display: "grid",
    gap: "12px",
  } as CSSProperties,

  menuItem: {
    transition: "filter 0.15s ease, transform 0.15s ease",
  } as CSSProperties,
},

tagsPage: {
  pageWrap: {
    maxWidth: "820px",
    margin: "0 auto",
  } as CSSProperties,

  authBox: {
    maxWidth: "400px",
    margin: "100px auto",
  } as CSSProperties,

  searchArea: {
    marginBottom: "20px",
  } as CSSProperties,

  relativeField: {
    position: "relative",
  } as CSSProperties,

  clearButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#6B7280",
    padding: "4px",
    lineHeight: 1,
  } as CSSProperties,

    addArea: {
    marginBottom: "20px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  } as CSSProperties,

  addInputWrap: {
    position: "relative",
    flex: "1 1 260px",
    minWidth: "220px",
  } as CSSProperties,

  addButton: {
    whiteSpace: "nowrap",
    padding: "12px 16px",
  } as CSSProperties,

  listBox: {
    border: "1px solid #D8DEE5",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#ffffff",
  } as CSSProperties,

  row: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "12px",
    alignItems: "center",
    padding: "14px 16px",
    transition: "background-color 0.15s ease",
  } as CSSProperties,

  rowWithBorder: {
    borderTop: "1px solid #E7EAED",
  } as CSSProperties,

  rowHover: {
    background: "#E8F2F1",
  } as CSSProperties,

  tagName: {
    fontWeight: "bold",
    fontSize: "16px",
    color: "#2B2F33",
    wordBreak: "break-word",
  } as CSSProperties,

  actions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  } as CSSProperties,

  editRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "12px",
    alignItems: "center",
    width: "100%",
  } as CSSProperties,

  editActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  } as CSSProperties,

    importButton: {
  flex: 1,
  minWidth: "220px",
  width: "auto",
  minHeight: "48px",
  padding: "0 16px",
} as CSSProperties,

  smallActionButton: {
  width: "auto",
  minHeight: "48px",
  whiteSpace: "nowrap",
  padding: "0 16px",
} as CSSProperties,
},

shelvesPage: {
  addArea: {
    marginBottom: "20px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  } as CSSProperties,

  addInputWrap: {
    position: "relative",
    flex: "1 1 260px",
    minWidth: "220px",
  } as CSSProperties,

  addButtonInline: {
    width: "auto",
    minHeight: "48px",
    padding: "0 20px",
    whiteSpace: "nowrap",
  } as CSSProperties,

  clearButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#6B7280",
    cursor: "pointer",
    padding: "4px",
    fontSize: "18px",
    lineHeight: 1,
  } as CSSProperties,
},

  layout: {
  page: {
    padding: "92px 16px 96px",
    fontFamily: "sans-serif",
    background: "#FFFFFF",
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
    color: "#3E5572",
  } as CSSProperties,

  sectionDescription: {
    margin: "0 0 24px 0",
    color: "#6B7280",
    lineHeight: 1.6,
  } as CSSProperties,
},

  card: {
  base: {
    background: "#FFFFFF",
    border: "1px solid #E7EAED",
    borderRadius: "14px",
    padding: "18px",
    boxSizing: "border-box",
    boxShadow: "0 2px 10px rgba(43, 47, 51, 0.04)",
  } as CSSProperties,

  clickable: {
    background: "#FFFFFF",
    border: "1px solid #E7EAED",
    borderRadius: "12px",
    padding: "14px",
    boxSizing: "border-box",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    boxShadow: "0 2px 10px rgba(43, 47, 51, 0.04)",
  } as CSSProperties,

  hover: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 18px rgba(43, 47, 51, 0.08)",
  } as CSSProperties,
},

  input: {
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#2B2F33",
  } as CSSProperties,

  base: {
    width: "100%",
    padding: "12px",
    border: "1px solid #D8DEE5",
    borderRadius: "8px",
    fontSize: "16px",
    boxSizing: "border-box",
    background: "#FFFFFF",
    color: "#2B2F33",
  } as CSSProperties,

  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #D8DEE5",
    borderRadius: "8px",
    fontSize: "16px",
    boxSizing: "border-box",
    background: "#FFFFFF",
    color: "#2B2F33",
    resize: "vertical",
  } as CSSProperties,
},

  button: {
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #3E5572",
    background: "#3E5572",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  } as CSSProperties,

  secondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #5FA7A2",
    background: "#5FA7A2",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  } as CSSProperties,

  secondarySoft: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #D8ECEA",
    background: "#EEF8F7",
    color: "#2F6F6A",
    fontSize: "15px",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  } as CSSProperties,

  muted: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #E7EAED",
    background: "#F2F4F6",
    color: "#6B7280",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    boxSizing: "border-box",
  } as CSSProperties,

  back: {
    background: "transparent",
    color: "#3E5572",
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

  edit: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
    minHeight: "40px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "none",
    background: "#D8ECEA",
    color: "#2F6F6A",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxSizing: "border-box",
  } as CSSProperties,

  smallPrimary: {
    background: "#3E5572",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  } as CSSProperties,

  smallSecondary: {
    background: "#5FA7A2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  } as CSSProperties,

  smallMuted: {
    background: "#F2F4F6",
    color: "#6B7280",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
  } as CSSProperties,

  danger: {
    background: "#B45B5B",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    textDecoration: "none",
  } as CSSProperties,

  smallDanger: {
    background: "#F2F4F6",
    color: "#6B7280",
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
    filter: "brightness(0.97)",
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
    color: "#2F6F6A",
    background: "#EEF8F7",
    padding: "4px 8px",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "12px",
  } as CSSProperties,

  owned: {
    fontWeight: "bold",
    color: "#2F6F6A",
    background: "#EEF8F7",
    padding: "4px 8px",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "12px",
  } as CSSProperties,

  notOwned: {
    fontWeight: "bold",
    color: "#6B7280",
    background: "#F2F4F6",
    padding: "4px 8px",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "12px",
  } as CSSProperties,

  reading: {
    fontWeight: "bold",
    color: "#2F6F6A",
    background: "#D8ECEA",
    padding: "4px 8px",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "12px",
  } as CSSProperties,

  done: {
    fontWeight: "bold",
    color: "#3E5572",
    background: "#EEF2F4",
    padding: "4px 8px",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "12px",
  } as CSSProperties,

  want: {
    fontWeight: "bold",
    color: "#6B7280",
    background: "#F2F4F6",
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
    color: "#2B2F33",
    wordBreak: "break-word",
  } as CSSProperties,

  author: {
    margin: "6px 0 0 0",
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  } as CSSProperties,

  tagsText: {
    margin: "6px 0 0 0",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.4,
    wordBreak: "break-word",
  } as CSSProperties,

  helper: {
    margin: "8px 0 0 0",
    color: "#6B7280",
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
    boxShadow: "0 6px 18px rgba(43, 47, 51, 0.08)",
  },
  buttonPrimary: {
    filter: "brightness(0.95)",
  },
  buttonSecondary: {
    filter: "brightness(0.97)",
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