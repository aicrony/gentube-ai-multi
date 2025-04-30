import React from 'react';
import Button from '@/components/ui/Button';

interface CreditLimitNoticeButtonProps {
  errorMessage: string | null;
}

export const CreditLimitNoticeButton: React.FC<
  CreditLimitNoticeButtonProps
> = ({ errorMessage }) => {
  ``;
  return (
    <div
      className={`message-container message-container--error ${!errorMessage ? 'hidden' : ''}`}
    >
      {errorMessage &&
        (errorMessage ===
        'Credit limit exceeded. Purchase credits on the PRICING page.' ? (
          <Button
            variant="slim"
            type="button"
            className="mt-1"
            onClick={() => (window.location.href = '/pricing')}
          >
            {errorMessage}
          </Button>
        ) : (
          <p className="text-lg">{errorMessage}</p>
        ))}
    </div>
  );
};

export default CreditLimitNoticeButton;
