/**
 * Tests for ConversationFollowupInput component
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationFollowupInput from '../ConversationFollowupInput';

describe('ConversationFollowupInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render input field and send button', () => {
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should disable send button when message is empty', () => {
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when message is typed', async () => {
    const user = userEvent.setup();
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Hello');

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('should call onSend with message when send button is clicked', async () => {
    const user = userEvent.setup();
    mockOnSend.mockResolvedValue(undefined);
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith({
      message: 'Test message',
      images: [],
    });
  });

  it('should clear input after successful send', async () => {
    const user = userEvent.setup();
    mockOnSend.mockResolvedValue(undefined);
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should show loading state while sending', async () => {
    const user = userEvent.setup();
    mockOnSend.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(sendButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/sending/i)).not.toBeInTheDocument();
    });
  });

  it('should display error when send fails', async () => {
    const user = userEvent.setup();
    mockOnSend.mockRejectedValue(new Error('Send failed'));
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/send failed/i)).toBeInTheDocument();
    });
  });

  it('should render image upload button', () => {
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    expect(screen.getByLabelText(/attach image/i)).toBeInTheDocument();
  });

  it('should display image previews when images are added', async () => {
    const user = userEvent.setup();
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const file = new File(['image content'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/attach image/i);

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,test123',
      onload: null as (() => void) | null,
    };
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

    await user.upload(fileInput, file);

    // Trigger the onload callback wrapped in act
    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }
    });

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it('should remove image when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    const file = new File(['image content'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/attach image/i);

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,test123',
      onload: null as (() => void) | null,
    };
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

    await user.upload(fileInput, file);

    // Trigger the onload callback wrapped in act
    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }
    });

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });

    const removeButton = screen.getByLabelText(/remove image/i);
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryAllByRole('img').length).toBe(0);
    });
  });

  it('should limit images to max 5', async () => {
    const user = userEvent.setup();
    render(<ConversationFollowupInput onSend={mockOnSend} maxImages={5} />);

    // Mock FileReader to return immediately
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,test123',
      onload: null as (() => void) | null,
    };
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

    // Add 5 images
    for (let i = 0; i < 5; i++) {
      const file = new File(['image content'], `test${i}.png`, { type: 'image/png' });
      const fileInput = screen.getByLabelText(/attach image/i);
      await user.upload(fileInput, file);
      await act(async () => {
        if (mockFileReader.onload) {
          mockFileReader.onload();
        }
      });
    }

    // Check that 5 images are displayed
    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBe(5);
    });

    // File input should be disabled after 5 images
    const fileInputElement = screen.getByLabelText(/attach image/i).querySelector('input');
    expect(fileInputElement).toBeDisabled();

    // Counter should show 5 of 5
    expect(screen.getByText(/5 of 5 images attached/i)).toBeInTheDocument();
  });

  it('should include images when sending message', async () => {
    const user = userEvent.setup();
    mockOnSend.mockResolvedValue(undefined);
    render(<ConversationFollowupInput onSend={mockOnSend} />);

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,test123',
      onload: null as (() => void) | null,
    };
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

    const file = new File(['image content'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/attach image/i);
    await user.upload(fileInput, file);

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }
    });

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Check this image');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith({
        message: 'Check this image',
        images: ['data:image/png;base64,test123'],
      });
    });
  });
});
