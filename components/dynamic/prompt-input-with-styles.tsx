// components/dynamic/prompt-input-with-styles.tsx
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface StyleItem {
  id: string;
  name: string;
  desc: string;
}

interface EffectItem {
  id: string;
  name: string;
  desc: string;
}

interface EmotionItem {
  id: string;
  name: string;
  desc?: string;
}

interface PromptInputWithStylesProps {
  promptValue: string;
  onPromptChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedStyles: string[];
  selectedEffects: string[];
  styleItems: StyleItem[];
  effectItems: EffectItem[];
  selectedEmotions?: string[];
  emotionItems?: EmotionItem[];
  id?: string;
  label?: string;
  placeholder?: string;
  stylePrefix?: string;
  effectPrefix?: string;
  emotionPrefix?: string;
  onFocus?: () => void;
}

export const PromptInputWithStyles: React.FC<PromptInputWithStylesProps> = ({
  promptValue,
  onPromptChange,
  selectedStyles,
  selectedEffects,
  selectedEmotions = [],
  styleItems,
  effectItems,
  emotionItems = [],
  id = 'prompt',
  label = 'Describe your image',
  placeholder = 'Enter a description of your image',
  stylePrefix = 'Style: ',
  effectPrefix = 'Effect: ',
  emotionPrefix = 'Emotion: ',
  onFocus
}) => {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="text-base font-medium mb-2 block">
        {label}
      </Label>
      <Input
        as="text"
        className="min-h-[50px] text-xl mb-2"
        id={id}
        placeholder={placeholder}
        value={promptValue}
        onChange={onPromptChange}
        onFocus={onFocus}
      />
      <div className="text-sm text-gray-500 mt-1">
        {selectedStyles.length > 0 ||
        selectedEffects.length > 0 ||
        selectedEmotions.length > 0 ? (
          <div>
            <p>Your image will include:</p>
            <ul className="list-disc ml-5 mt-1">
              {selectedStyles.length > 0 && (
                <li>
                  Styles:{' '}
                  {selectedStyles
                    .map((id) => styleItems.find((s) => s.id === id)?.name)
                    .join(', ')}
                </li>
              )}
              {selectedEffects.length > 0 && (
                <li>
                  Effects:{' '}
                  {selectedEffects
                    .map((id) => effectItems.find((e) => e.id === id)?.name)
                    .join(', ')}
                </li>
              )}
              {selectedEmotions.length > 0 && emotionItems.length > 0 && (
                <li>
                  Emotions:{' '}
                  {selectedEmotions
                    .map((id) => emotionItems.find((e) => e.id === id)?.name)
                    .join(', ')}
                </li>
              )}
            </ul>
          </div>
        ) : (
          <p>
            Select styles, effects, and emotions from the options above to
            enhance your image.
          </p>
        )}
      </div>
    </div>
  );
};

// Helper function to get a formatted prompt with prefixes for styles and effects
export const getFormattedPrompt = (
  basePrompt: string,
  selectedStyles: string[],
  selectedEffects: string[],
  styleItems: StyleItem[],
  effectItems: EffectItem[],
  stylePrefix: string = 'Style: ',
  effectPrefix: string = 'Effect: ',
  selectedEmotions?: string[],
  emotionItems?: EmotionItem[],
  emotionPrefix: string = 'Emotion: '
): string => {
  // Process the base prompt to handle punctuation correctly
  let processedBasePrompt = basePrompt.trim();

  // Add selected styles with prefix
  const styleTexts: string[] = [];
  selectedStyles.forEach((styleId) => {
    const style = styleItems.find((s) => s.id === styleId);
    if (style) styleTexts.push(`${stylePrefix}${style.desc}`);
  });

  // Add selected effects with prefix
  const effectTexts: string[] = [];
  selectedEffects.forEach((effectId) => {
    const effect = effectItems.find((e) => e.id === effectId);
    if (effect) effectTexts.push(`${effectPrefix}${effect.desc}`);
  });

  // Add selected emotions with prefix
  const emotionTexts: string[] = [];
  if (selectedEmotions && selectedEmotions.length > 0 && emotionItems) {
    selectedEmotions.forEach((emotionId) => {
      const emotion = emotionItems.find((e) => e.id === emotionId);
      if (emotion)
        emotionTexts.push(`${emotionPrefix}${emotion.desc || emotion.name}`);
    });
  }

  // Combine all styles, effects, and emotions
  const allAttributes = [...styleTexts, ...effectTexts, ...emotionTexts].join(
    ', '
  );

  // No attributes selected, just return the base prompt
  if (!allAttributes) {
    return processedBasePrompt;
  }

  // Handle empty base prompt case
  if (!processedBasePrompt) {
    return allAttributes;
  }

  // Check the ending punctuation of the base prompt
  const endsWithTerminalPunctuation = /[.!?]$/.test(processedBasePrompt);
  const endsWithSemicolon = /;$/.test(processedBasePrompt);
  const endsWithComma = /,$/.test(processedBasePrompt);
  const endsWithColon = /:$/.test(processedBasePrompt);

  // Combine based on the punctuation type
  let fullPrompt;
  if (endsWithTerminalPunctuation || endsWithSemicolon || endsWithColon) {
    // For terminal punctuation, semicolons, and colons: start a new segment
    fullPrompt = `${processedBasePrompt} ${allAttributes}`;
  } else if (endsWithComma) {
    // If already ends with a comma, just add the styles with a space
    fullPrompt = `${processedBasePrompt} ${allAttributes}`;
  } else {
    // No special ending punctuation, add with a comma
    fullPrompt = `${processedBasePrompt}, ${allAttributes}`;
  }

  return fullPrompt;
};
