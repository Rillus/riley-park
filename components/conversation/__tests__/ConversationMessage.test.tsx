/**
 * Tests for ConversationMessage component
 */

import { render, screen } from '@testing-library/react';
import ConversationMessage from '../ConversationMessage';
import { ConversationMessage as ConversationMessageType } from '@/lib/cursor-api/types';

// Mock marked module
jest.mock('marked', () => ({
  marked: {
    parse: (content: string) => `<p>${content}</p>`,
    setOptions: jest.fn(),
  },
}));

describe('ConversationMessage', () => {
  const userMessage: ConversationMessageType = {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, can you help me with this code?',
    timestamp: '2025-01-01T10:00:00Z',
  };

  const assistantMessage: ConversationMessageType = {
    id: 'msg-2',
    role: 'assistant',
    content: 'Of course! I would be happy to help you.',
    timestamp: '2025-01-01T10:00:01Z',
  };

  it('should render user message with correct styling', () => {
    render(<ConversationMessage message={userMessage} />);

    expect(screen.getByText(/hello, can you help me/i)).toBeInTheDocument();
    const container = screen.getByTestId('message-msg-1');
    expect(container).toHaveClass('justify-end');
  });

  it('should render assistant message with correct styling', () => {
    render(<ConversationMessage message={assistantMessage} />);

    expect(screen.getByText(/of course/i)).toBeInTheDocument();
    const container = screen.getByTestId('message-msg-2');
    expect(container).toHaveClass('justify-start');
  });

  it('should display timestamp', () => {
    render(<ConversationMessage message={userMessage} />);

    // Timestamp should be formatted
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('should render markdown content', () => {
    const markdownMessage: ConversationMessageType = {
      id: 'msg-3',
      role: 'assistant',
      content: 'Here is some **bold** text and `inline code`.',
      timestamp: '2025-01-01T10:00:00Z',
    };

    render(<ConversationMessage message={markdownMessage} />);

    // Content should be rendered (markdown parsing is mocked)
    expect(screen.getByText(/Here is some/)).toBeInTheDocument();
  });

  it('should render code blocks with syntax highlighting', () => {
    const codeMessage: ConversationMessageType = {
      id: 'msg-4',
      role: 'assistant',
      content: '```javascript\nconst x = 1;\nconsole.log(x);\n```',
      timestamp: '2025-01-01T10:00:00Z',
    };

    render(<ConversationMessage message={codeMessage} />);

    // Code should be present
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
  });

  it('should render images if present', () => {
    const imageMessage: ConversationMessageType = {
      id: 'msg-5',
      role: 'user',
      content: 'Look at this screenshot',
      timestamp: '2025-01-01T10:00:00Z',
      images: ['data:image/png;base64,test123'],
    };

    render(<ConversationMessage message={imageMessage} />);

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should display user label for user messages', () => {
    render(<ConversationMessage message={userMessage} />);

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('should display assistant label for assistant messages', () => {
    render(<ConversationMessage message={assistantMessage} />);

    expect(screen.getByText('Agent')).toBeInTheDocument();
  });
});
