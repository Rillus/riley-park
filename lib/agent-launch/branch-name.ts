/**
 * Branch name generation utility for Cursor agents
 * 
 * Generates URL-safe branch names in format: cursor/{feature-slug}-{timestamp}
 */

export interface BranchNameOptions {
  prefix?: string;
  timestamp?: Date;
  maxLength?: number;
}

/**
 * Convert a string to a URL-safe slug
 * 
 * @param text - The text to slugify
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace special characters with spaces
    .replace(/[&+]/g, ' ')
    // Replace non-alphanumeric characters (except spaces and hyphens) with nothing
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Format a timestamp for branch naming
 * Format: YYYYMMDD-HHmm
 * 
 * @param date - The date to format
 * @returns Formatted timestamp string
 */
function formatTimestamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}`;
}

/**
 * Generate a branch name for a Cursor agent
 * 
 * @param featureName - The name of the feature
 * @param options - Optional configuration
 * @returns Generated branch name
 */
export function generateBranchName(
  featureName: string,
  options: BranchNameOptions = {}
): string {
  const {
    prefix = 'cursor',
    timestamp = new Date(),
    maxLength = 80,
  } = options;

  // Slugify the feature name
  let slug = slugify(featureName);
  
  // Use default if empty
  if (!slug) {
    slug = 'feature';
  }

  // Format timestamp
  const timestampStr = formatTimestamp(timestamp);
  
  // Calculate available length for slug
  // Format: prefix/slug-timestamp
  // prefix/ = prefix.length + 1
  // -timestamp = 1 + timestampStr.length
  const reservedLength = prefix.length + 1 + 1 + timestampStr.length;
  const availableSlugLength = maxLength - reservedLength;
  
  // Truncate slug if necessary
  if (slug.length > availableSlugLength) {
    slug = slug.substring(0, availableSlugLength).replace(/-+$/, '');
  }
  
  return `${prefix}/${slug}-${timestampStr}`;
}
