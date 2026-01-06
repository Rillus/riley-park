/**
 * Feature file parser
 * Parses markdown feature files and extracts metadata
 */

import fs from 'fs';
import path from 'path';

export interface FeatureMetadata {
  id: string;
  title: string;
  priority?: string;
  status?: string;
  estimatedTime?: string;
  filename: string;
  content: string;
}

const FEATURES_DIR = path.join(process.cwd(), 'docs/features');

/**
 * Parse feature metadata from markdown content
 */
export function parseFeatureMetadata(
  filename: string,
  content: string
): FeatureMetadata {
  const id = filename.replace('.md', '').replace('001b-', '001b-').replace(/^(\d+[a-z]?)-/, '$1-');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');
  
  const priorityMatch = content.match(/\*\*Priority:\*\*\s*(.+)/);
  const priority = priorityMatch ? priorityMatch[1].trim() : undefined;
  
  const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
  const status = statusMatch ? statusMatch[1].trim() : 'Not Started';
  
  const timeMatch = content.match(/\*\*Estimated Time:\*\*\s*(.+)/);
  const estimatedTime = timeMatch ? timeMatch[1].trim() : undefined;

  return {
    id,
    title,
    priority,
    status,
    estimatedTime,
    filename,
    content,
  };
}

/**
 * Read all feature files from docs/features directory
 */
export function readFeatureFiles(): FeatureMetadata[] {
  try {
    const files = fs.readdirSync(FEATURES_DIR);
    const featureFiles = files.filter(
      (file) => file.endsWith('.md') && file !== 'README.md'
    );

    return featureFiles.map((filename) => {
      const filePath = path.join(FEATURES_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      return parseFeatureMetadata(filename, content);
    });
  } catch (error) {
    console.error('Error reading feature files:', error);
    return [];
  }
}

/**
 * Read a specific feature file
 */
export function readFeatureFile(id: string): FeatureMetadata | null {
  try {
    // Try to find the file by ID
    const files = fs.readdirSync(FEATURES_DIR);
    const featureFile = files.find((file) => {
      const fileId = file.replace('.md', '');
      return fileId === id || fileId.endsWith(id);
    });

    if (!featureFile) {
      return null;
    }

    const filePath = path.join(FEATURES_DIR, featureFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseFeatureMetadata(featureFile, content);
  } catch (error) {
    console.error('Error reading feature file:', error);
    return null;
  }
}

