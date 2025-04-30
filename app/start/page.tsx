// app/start/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUserId } from '@/context/UserIdContext';
import Button from '@/components/ui/Button';
import StartPageWrapper from '@/app/StartPageWrapper';

// Workflow options
const WORKFLOWS = {
  PERSONAL: 'personal',
  BUSINESS: 'business',
  FREEFLOW: 'freeflow'
};

function WorkflowSelectionContent() {
  const userId = useUserId();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const signInMessage =
    userId === 'none' ? (
      <button
        onClick={() => (window.location.href = '/signin')}
        className="font-light text-md"
      >
        Sign In for free credits (1 time).
      </button>
    ) : null;

  return (
    <div className="w-full min-h-screen flex flex-col gap-2">
      <main className="flex-1 items-center justify-center mt-16 pt-4">
        <div className="container grid gap-4">
          <div className="grid gap-2 text-center">
            <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl">
              GenTube.ai
            </h1>
            <p className="max-w-2xl m-auto mt-5 text-xl sm:text-center sm:text-2xl">
              Generate AI Images and Videos
            </p>
            {signInMessage && (
              <h3 className="text-xl font-bold mt-4">{signInMessage}</h3>
            )}
          </div>

          <div className="grid gap-6 text-center max-w-3xl mx-auto mt-4">
            <h2 className="text-2xl font-bold pr-6">
              <Link href="/" className="back-button">
                ←
              </Link>
              Choose Your Workflow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`workflow-option ${selectedWorkflow === WORKFLOWS.FREEFLOW ? 'selected' : ''}`}
                onClick={() => (window.location.href = '/freeflow')}
              >
                <h3 className="text-xl font-semibold mb-2">Free Flow</h3>
                <p className="">Access all tools without guided workflows</p>
              </div>

              <div
                className={`workflow-option ${selectedWorkflow === WORKFLOWS.PERSONAL ? 'selected' : ''}`}
                onClick={() => (window.location.href = '/personal')}
              >
                <h3 className="text-xl font-semibold mb-2">Personal</h3>
                <p className="">
                  Create content for social media, personal projects, and fun
                </p>
              </div>

              <div
                className={`workflow-option ${selectedWorkflow === WORKFLOWS.BUSINESS ? 'selected' : ''}`}
                onClick={() => (window.location.href = '/business')}
              >
                <h3 className="text-xl font-semibold mb-2">Business & Plus</h3>
                <p className="">
                  Create marketing videos, product demos and brand content
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WorkflowSelection() {
  return (
    <StartPageWrapper>
      <WorkflowSelectionContent />
    </StartPageWrapper>
  );
}
