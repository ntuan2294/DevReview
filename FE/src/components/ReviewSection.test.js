import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewSection from './ReviewSection';

// Mock components
jest.mock('./LoadingSpinner', () => {
  return function MockLoadingSpinner({ message, submessage, color, size }) {
    return (
      <div data-testid="loading-spinner">
        <div>{message}</div>
        <div>{submessage}</div>
        <div>{color}</div>
        <div>{size}</div>
      </div>
    );
  };
});

jest.mock('./CodeWithHighlight', () => {
  return function MockCodeWithHighlight({ code, errorLines, language, maxHeight }) {
    return (
      <div data-testid="code-with-highlight">
        <div>Code: {code}</div>
        <div>Error Lines: {errorLines?.length || 0}</div>
        <div>Language: {language}</div>
        <div>Max Height: {maxHeight}</div>
      </div>
    );
  };
});

describe('ReviewSection Component', () => {
  const mockProps = {
    code: 'console.log("Hello World");',
    language: 'javascript',
    reviewResult: {
      feedback: 'Code looks good!',
      improvedCode: 'console.log("Hello World!");',
      originalCode: 'console.log("Hello World");',
      errorLines: [1],
    },
    fixedCode: 'console.log("Hello World!");',
    currentUser: { username: 'testuser' },
    onBack: jest.fn(),
    onNew: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ReviewSection {...mockProps} />);
    // ✅ FIXED: ReviewSection doesn't have DEVREVIEW header - it's in CodeResultPage
    expect(screen.getByText('Quay lại chỉnh sửa')).toBeInTheDocument();
    expect(screen.getByText('Code mới')).toBeInTheDocument();
  });

  test('shows review tab by default', () => {
    render(<ReviewSection {...mockProps} />);
    expect(screen.getByText('Kết quả Review')).toBeInTheDocument();
    expect(screen.getByText('Code đã cải thiện')).toBeInTheDocument();
  });

  test('switches between tabs correctly', async () => {
    render(<ReviewSection {...mockProps} />);
    
    // Click on fixed tab
    const fixedTab = screen.getByText('Code đã cải thiện').closest('button');
    fireEvent.click(fixedTab);
    
    await waitFor(() => {
      expect(screen.getByText('console.log("Hello World!");')).toBeInTheDocument();
    });
  });

  test('calls onBack when back button is clicked', () => {
    render(<ReviewSection {...mockProps} />);
    
    const backButton = screen.getByText('Quay lại chỉnh sửa');
    fireEvent.click(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalledTimes(1);
  });

  test('calls onNew when new button is clicked', () => {
    render(<ReviewSection {...mockProps} />);
    
    const newButton = screen.getByText('Code mới');
    fireEvent.click(newButton);
    
    expect(mockProps.onNew).toHaveBeenCalledTimes(1);
  });

  test('shows loading state when reviewResult is null', () => {
    const propsWithoutResult = {
      ...mockProps,
      reviewResult: null,
    };
    
    render(<ReviewSection {...propsWithoutResult} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('shows error state when reviewResult has error', () => {
    const propsWithError = {
      ...mockProps,
      reviewResult: {
        ...mockProps.reviewResult,
        error: 'Something went wrong',
      },
    };
    
    render(<ReviewSection {...propsWithError} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('displays history information when isFromHistory is true', () => {
    const propsWithHistory = {
      ...mockProps,
      reviewResult: {
        ...mockProps.reviewResult,
        isFromHistory: true,
        historyId: 123,
      },
    };
    
    render(<ReviewSection {...propsWithHistory} />);
    expect(screen.getByText('Từ lịch sử: ID #123')).toBeInTheDocument();
  });

  test('renders code with highlight correctly', () => {
    render(<ReviewSection {...mockProps} />);
    
    const codeHighlight = screen.getByTestId('code-with-highlight');
    expect(codeHighlight).toBeInTheDocument();
    expect(screen.getByText('Code: console.log("Hello World");')).toBeInTheDocument();
  });

  test('formats review feedback correctly', () => {
    const propsWithMarkdown = {
      ...mockProps,
      reviewResult: {
        ...mockProps.reviewResult,
        feedback: '**Important**: This is a `test` with ```code```',
      },
    };
    
    render(<ReviewSection {...propsWithMarkdown} />);
    expect(screen.getByText('Important: This is a test with [Code đã được loại bỏ]')).toBeInTheDocument();
  });

  test('handles empty code gracefully', () => {
    const propsWithEmptyCode = {
      ...mockProps,
      code: '',
      reviewResult: {
        ...mockProps.reviewResult,
        originalCode: '',
      },
    };
    
    render(<ReviewSection {...propsWithEmptyCode} />);
    expect(screen.getByText('Code: Không có mã nguồn gốc.')).toBeInTheDocument();
  });

  test('handles missing improved code gracefully', () => {
    const propsWithoutImprovedCode = {
      ...mockProps,
      reviewResult: {
        ...mockProps.reviewResult,
        improvedCode: null,
        fixedCode: null,
      },
      fixedCode: null,
    };
    
    render(<ReviewSection {...propsWithoutImprovedCode} />);
    
    // Switch to fixed tab
    const fixedTab = screen.getByText('Code đã cải thiện').closest('button');
    fireEvent.click(fixedTab);
    
    expect(screen.getByText('⚠️ Không tìm thấy code đã cải thiện.')).toBeInTheDocument();
  });
});