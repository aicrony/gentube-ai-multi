'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useUserId } from '@/context/UserIdContext';
import { toast } from '@/components/ui/Toasts/use-toast';

export default function NameForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = useUserId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newName = e.currentTarget.fullName.value;

    // Check if the new name is the same as the old name
    if (newName === userName) {
      setIsSubmitting(false);
      return;
    }

    // Update name in Supabase
    handleRequest(e, updateName, router);

    // Also update name in Google Cloud Datastore
    if (userId) {
      try {
        const response = await fetch('/api/updateUserName', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            name: newName
          })
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Failed to update name in Datastore:', result);
          toast({
            title: 'Note',
            description:
              'Your name was updated, but it may take a moment to appear in the gallery.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error updating name in Datastore:', error);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <Card
      title="Your Display Name"
      description="This name will show under your images and prompts in the gallery. Go back to the gallery and click Refresh at the top to see your update."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">64 characters maximum</p>

          <Button
            variant="slim"
            type="button"
            className="mt-1"
            onClick={() => (window.location.href = '/gallery')}
          >
            Open Gallery
          </Button>
          <Button
            variant="slim"
            type="submit"
            form="nameForm"
            loading={isSubmitting}
          >
            Update Name
          </Button>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        <form id="nameForm" onSubmit={(e) => handleSubmit(e)}>
          <input
            type="text"
            name="fullName"
            className="w-1/2 p-3 rounded-md"
            defaultValue={userName}
            placeholder="Your name"
            maxLength={64}
          />
        </form>
      </div>
    </Card>
  );
}
