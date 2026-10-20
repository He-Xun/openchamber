/** Six-digit hex: the one colour form agent configs and project metadata both store. */
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const isHexColor = (value: string): boolean => HEX_COLOR_PATTERN.test(value);

/**
 * Preset colours a user can give an agent or a project. These are user data
 * written into config, not interface styling, so they cannot follow the
 * theme. Neutral grey first (the default look), then one distinct mid-tone
 * per hue, readable on dark and light themes.
 */
export const DEFAULT_GREY_COLOR = '#8a8a8a';
export const COLOR_PRESETS = [DEFAULT_GREY_COLOR, '#e5484d', '#f76b15', '#d6a312', '#30a46c', '#12a594', '#3e63dd', '#8e4ec6', '#d6409f'] as const;
