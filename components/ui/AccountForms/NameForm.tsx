'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useUserId } from '@/context/UserIdContext';
import { toast } from '@/components/ui/Toasts/use-toast';

export default function NameForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState(userName);
  const userId = useUserId();

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (userId) {
        try {
          setIsLoading(true);
          console.log(`Fetching creator name for userId: ${userId}`);
          const response = await fetch(
            `/api/getUserCreatorName?userId=${userId}`
          );
          const data = await response.json();

          if (response.ok && data.creatorName) {
            console.log(`Found creator name: ${data.creatorName}`);
            setDisplayName(data.creatorName);
          } else {
            console.log('Using default name from Supabase:', userName);
            setDisplayName(userName);
          }
        } catch (error) {
          console.error('Error fetching creator name:', error);
          setDisplayName(userName);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchCreatorName();
  }, [userId, userName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newName = e.currentTarget.fullName.value;

    // Check if the new name is the same as the old name
    if (newName === displayName) {
      setIsSubmitting(false);
      return;
    }

    if (!newName || newName.trim() === '') {
      toast({
        title: 'Error',
        description: 'Name cannot be empty. Please enter a valid name.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }

    // Check if the name is unique before updating
    if (userId) {
      try {
        console.log(
          `Checking if name "${newName}" is unique for userId: ${userId}`
        );

        // Check if the name is unique
        const uniqueResponse = await fetch(
          `/api/checkNameUniqueness?name=${encodeURIComponent(newName)}&userId=${userId}`
        );
        const uniqueResult = await uniqueResponse.json();

        if (!uniqueResponse.ok) {
          console.error('Failed to check name uniqueness:', uniqueResult);
          toast({
            title: 'Error',
            description:
              'Could not verify if the name is unique. Please try again.',
            variant: 'destructive'
          });
          setIsSubmitting(false);
          return;
        }

        if (!uniqueResult.isUnique) {
          toast({
            title: 'Name already taken',
            description:
              'This display name is already in use by another creator. Please choose a different name.',
            variant: 'destructive'
          });
          setIsSubmitting(false);
          return;
        }

        console.log('Name is unique, proceeding with update');

        // If the name is unique, proceed with the update
        try {
          // First update the name in Google Cloud Datastore
          console.log('Updating name in Google Cloud Datastore');
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
              title: 'Error',
              description:
                'Failed to update your name in our system. Please try again.',
              variant: 'destructive'
            });
            setIsSubmitting(false);
            return;
          }

          console.log('Name successfully updated in Google Cloud Datastore');

          // Show success toast before redirecting
          toast({
            title: 'Success',
            description: 'Your display name has been updated successfully.',
            variant: 'default'
          });

          // Set the display name locally
          setDisplayName(newName);
          setIsSubmitting(false);

          // No need to redirect, just stay on the same page
        } catch (error) {
          console.error('Error in update process:', error);
          toast({
            title: 'Error',
            description:
              'There was a problem updating your name. Some changes may not have been saved.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error in name update process:', error);
        toast({
          title: 'Error',
          description: 'Failed to update your display name. Please try again.',
          variant: 'destructive'
        });
      }
    } else {
      // Update name in Supabase only if we don't have a userId
      console.log('No userId available, updating only in Supabase');
      try {
        await handleRequest(e, updateName, router);
        setDisplayName(newName);
        toast({
          title: 'Success',
          description: 'Your display name has been updated.',
          variant: 'default'
        });
      } catch (error) {
        console.error('Error updating name in Supabase:', error);
        toast({
          title: 'Error',
          description: 'Failed to update your display name. Please try again.',
          variant: 'destructive'
        });
      }
    }

    setIsSubmitting(false);
  };

  return (
    <Card
      title="Your Display Name"
      description="This name will show under your images and prompts in the gallery. Go back to the gallery and click Refresh at the top to see your updated display name."
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
            disabled={isLoading}
          >
            Update Name
          </Button>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        {isLoading ? (
          <div className="w-1/2 p-3">Loading...</div>
        ) : (
          <form id="nameForm" onSubmit={(e) => handleSubmit(e)}>
            <input
              type="text"
              name="fullName"
              className="w-1/2 p-3 rounded-md"
              defaultValue={displayName}
              placeholder="Your name"
              maxLength={64}
            />
          </form>
        )}
      </div>
    </Card>
  );
}
