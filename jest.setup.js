// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock scrollIntoView for tests
Element.prototype.scrollIntoView = jest.fn();

// Prevent real GitHub API calls during tests
// This ensures we never hit rate limits during test execution.
// By mocking Octokit globally, any code that uses GitHubClient will use mocked Octokit,
// preventing real API calls. Individual tests can override this mock if needed.
jest.mock('@octokit/rest', () => {
  // Default mock that returns empty results to prevent real API calls
  // Tests should override this with their own mocks as needed
  const mockGetContent = jest.fn().mockResolvedValue({
    data: [],
  });

  return {
    Octokit: jest.fn().mockImplementation(() => ({
      repos: {
        getContent: mockGetContent,
      },
      rest: {
        repos: {
          getContent: mockGetContent,
        },
      },
    })),
  };
});

