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
    <>
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
    </>
  );
};

export default CreditLimitNoticeButton;
