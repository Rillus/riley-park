'use client';

import { useState, useRef } from 'react';

interface FollowupMessage {
  message: string;
  images: string[];
}

interface ConversationFollowupInputProps {
  onSend: (message: FollowupMessage) => Promise<void>;
  disabled?: boolean;
  maxImages?: number;
}

/**
 * ConversationFollowupInput component provides message input
 * with image attachment support for the conversation view
 */
export default function ConversationFollowupInput({
  onSend,
  disabled = false,
  maxImages = 5,
}: ConversationFollowupInputProps) {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    setError(null);

    try {
      await onSend({
        message: message.trim(),
        images,
      });
      setMessage('');
      setImages([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageError(null);

    if (images.length >= maxImages) {
      setImageError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setImageError(`Maximum ${maxImages} images allowed. Only added ${remainingSlots} image(s).`);
    }

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setImageError('Only image files are allowed.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImages((prev) => {
          if (prev.length >= maxImages) return prev;
          return [...prev, result];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Error messages */}
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {imageError && (
        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-700 dark:text-yellow-400 text-sm">
          {imageError}
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Attachment ${index + 1}`}
                className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                aria-label="Remove image"
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        {/* Image upload button */}
        <label
          className={`flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Attach image"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            disabled={images.length >= maxImages || sending || disabled}
            className="hidden"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </label>

        {/* Text input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={sending || disabled}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={sending || disabled || !message.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Image count indicator */}
      {images.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {images.length} of {maxImages} images attached
        </p>
      )}
    </form>
  );
}
