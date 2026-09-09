/**
 * Central configuration for the growing lily.
 * Change dates, copy, and recipient details here — nothing else in the
 * codebase should hardcode these values.
 */
export interface GardenConfig {
  /** Calendar date (YYYY-MM-DD) the lily starts growing. */
  startDate: string;
  /** Calendar date (YYYY-MM-DD) the lily fully blooms. */
  bloomDate: string;
  /** IANA timezone used to resolve "today" consistently across devices. */
  timezone: string;
  /** Name of the person this garden is for. */
  recipientName: string;
  /** Main page heading. */
  heading: string;
  /** Small caption under the heading. */
  caption: string;
  /** Title shown on the letter overlay. */
  letterTitle: string;
  /** Body of the letter, revealed once the lily blooms. Editable placeholder. */
  letterText: string;
  /** Signature line at the end of the letter. */
  letterSignature: string;
}

export const gardenConfig: GardenConfig = {
  startDate: "2026-09-09",
  bloomDate: "2027-05-11",
  timezone: "Europe/Belgrade",
  recipientName: "my love",
  heading: "A little more each day",
  caption: "Something beautiful is growing.",
  letterTitle: "For you",
  letterText:
    "If patience could grow petals, it would look like this. This little flower grew day by day, and every day it was meant for you.",
  letterSignature: "Yours, always",
};
