/**
 * Variable Expansion Service for Shortcuts
 */

import { ExpandShortcutInput } from './types';

/**
 * Expand a shortcut template by replacing variables with actual values
 * 
 * @param template - The shortcut template with variables like {feature}, {project}, etc.
 * @param variables - Object containing variable values
 * @returns The expanded prompt with variables replaced
 */
export function expandShortcut(
  template: string,
  variables: ExpandShortcutInput
): string {
  let expanded = template;

  // Replace each variable if it exists in the variables object
  // Use a placeholder to mark replaced sections to avoid double-replacement
  const placeholder = '___PLACEHOLDER___';
  const replacements: string[] = [];

  if (variables.feature !== undefined) {
    const index = replacements.length;
    replacements.push(variables.feature);
    expanded = expanded.replace(/\{feature\}/g, `${placeholder}${index}${placeholder}`);
  }
  if (variables.project !== undefined) {
    const index = replacements.length;
    replacements.push(variables.project);
    expanded = expanded.replace(/\{project\}/g, `${placeholder}${index}${placeholder}`);
  }
  if (variables.step !== undefined) {
    const index = replacements.length;
    replacements.push(variables.step);
    expanded = expanded.replace(/\{step\}/g, `${placeholder}${index}${placeholder}`);
  }
  if (variables.description !== undefined) {
    const index = replacements.length;
    replacements.push(variables.description);
    expanded = expanded.replace(/\{description\}/g, `${placeholder}${index}${placeholder}`);
  }

  // Replace any remaining variables with empty string (graceful handling)
  expanded = expanded.replace(/\{[^}]+\}/g, '');

  // Restore the actual replacement values
  replacements.forEach((replacement, index) => {
    expanded = expanded.replace(
      new RegExp(`${placeholder}${index}${placeholder}`, 'g'),
      replacement
    );
  });

  return expanded;
}

