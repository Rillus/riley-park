/**
 * Tests for ShortcutCard component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShortcutCard from '../ShortcutCard';
import { Shortcut } from '@/lib/shortcuts/types';

describe('ShortcutCard', () => {
  const mockShortcut: Shortcut = {
    id: '1',
    name: 'Test Shortcut',
    promptTemplate: 'Create {feature} in {project}',
    category: 'Testing',
    isPredefined: false,
    userId: null,
    variables: JSON.stringify(['feature', 'project']),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render shortcut name', () => {
    render(<ShortcutCard shortcut={mockShortcut} />);
    expect(screen.getByText('Test Shortcut')).toBeInTheDocument();
  });

  it('should render prompt template', () => {
    render(<ShortcutCard shortcut={mockShortcut} />);
    expect(screen.getByText(/Create \{feature\} in \{project\}/)).toBeInTheDocument();
  });

  it('should render category badge', () => {
    render(<ShortcutCard shortcut={mockShortcut} />);
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('should render variables', () => {
    render(<ShortcutCard shortcut={mockShortcut} />);
    expect(screen.getByText('{feature}')).toBeInTheDocument();
    expect(screen.getByText('{project}')).toBeInTheDocument();
  });

  it('should show predefined badge for predefined shortcuts', () => {
    const predefinedShortcut = { ...mockShortcut, isPredefined: true };
    render(<ShortcutCard shortcut={predefinedShortcut} />);
    expect(screen.getByText('Predefined')).toBeInTheDocument();
  });

  it('should call onUse when Use button is clicked', async () => {
    const user = userEvent.setup();
    const onUse = jest.fn();
    render(<ShortcutCard shortcut={mockShortcut} onUse={onUse} />);
    
    const useButton = screen.getByText('Use');
    await user.click(useButton);
    
    expect(onUse).toHaveBeenCalledWith(mockShortcut);
  });

  it('should call onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(<ShortcutCard shortcut={mockShortcut} onEdit={onEdit} />);
    
    const editButton = screen.getByText('Edit');
    await user.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockShortcut);
  });

  it('should call onDelete when Delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(<ShortcutCard shortcut={mockShortcut} onDelete={onDelete} />);
    
    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith(mockShortcut);
  });

  it('should not show Edit button for predefined shortcuts', () => {
    const predefinedShortcut = { ...mockShortcut, isPredefined: true };
    render(<ShortcutCard shortcut={predefinedShortcut} onEdit={jest.fn()} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('should not show Delete button for predefined shortcuts', () => {
    const predefinedShortcut = { ...mockShortcut, isPredefined: true };
    render(<ShortcutCard shortcut={predefinedShortcut} onDelete={jest.fn()} />);
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should handle shortcuts without category', () => {
    const shortcutWithoutCategory = { ...mockShortcut, category: null };
    render(<ShortcutCard shortcut={shortcutWithoutCategory} />);
    expect(screen.getByText('Test Shortcut')).toBeInTheDocument();
  });

  it('should handle shortcuts without variables', () => {
    const shortcutWithoutVariables = { ...mockShortcut, variables: null };
    render(<ShortcutCard shortcut={shortcutWithoutVariables} />);
    expect(screen.getByText('Test Shortcut')).toBeInTheDocument();
  });
});

