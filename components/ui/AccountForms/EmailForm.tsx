'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { updateEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

export default function EmailForm({
  userEmail,
  userId
}: {
  userEmail: string | undefined;
  userId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(userId);
    setCopySuccess(true);

    // Reset the success message after 2 seconds
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new email is the same as the old email
    if (e.currentTarget.newEmail.value === userEmail) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    handleRequest(e, updateEmail, router);
    setIsSubmitting(false);
  };

  return (
    <Card
      title="Your Email"
      description="Please enter the email address you want to use to login."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">
            We will email you to verify the change.
          </p>
          <Button
            variant="slim"
            type="submit"
            form="emailForm"
            loading={isSubmitting}
          >
            Update Email
          </Button>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        <form id="emailForm" onSubmit={(e) => handleSubmit(e)}>
          <div className="flex items-center">
            <input
              type="text"
              name="newEmail"
              className="w-1/2 p-3 rounded-md border border-zinc-800"
              defaultValue={userEmail ?? ''}
              placeholder="Your email"
              maxLength={64}
            />
            <div className="ml-3 flex items-center">
              <button
                type="button"
                onClick={handleCopyUserId}
                className="p-2 rounded border border-zinc-700 hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50 flex items-center"
                title="Copy user ID to clipboard"
              >
                <FaCopy className="mr-1" />
                <span className="text-sm">Copy ID</span>
                {copySuccess && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-green-100 h-5 w-5">
                    <FaCheck className="text-xs text-green-600" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
