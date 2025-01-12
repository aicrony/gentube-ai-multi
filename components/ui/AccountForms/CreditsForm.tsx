'use client';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface CreditsFormProps {
  userId: string;
}

const CreditsForm: React.FC<CreditsFormProps> = ({ userId }) => {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch(`/api/getUserCredits?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user credits');
        }
        const data = await response.json();
        setCredits(data.credits);
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    };

    fetchCredits();
  }, [userId]);

  return (
    <Card
      title="Your Credits"
      description="Available credits to use for generating images and videos."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">Buy more credits.</p>
          <a href="/pricing">
            <Button variant="slim">Pricing</Button>
          </a>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        {credits !== null ? (
          <p className="text-xlg">{credits}</p>
        ) : (
          <p className="text-lg">Loading credits...</p>
        )}
      </div>
    </Card>
  );
};

export default CreditsForm;
