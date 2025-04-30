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

interface PromptInputWithStylesProps {
  promptValue: string;
  onPromptChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedStyles: string[];
  selectedEffects: string[];
  styleItems: StyleItem[];
  effectItems: EffectItem[];
  id?: string;
  label?: string;
  placeholder?: string;
  stylePrefix?: string;
  effectPrefix?: string;
  onFocus?: () => void;
}

export const PromptInputWithStyles: React.FC<PromptInputWithStylesProps> = ({
  promptValue,
  onPromptChange,
  selectedStyles,
  selectedEffects,
  styleItems,
  effectItems,
  id = 'prompt',
  label = 'Describe your image',
  placeholder = 'Enter a description of your image',
  stylePrefix = 'Style: ',
  effectPrefix = 'Effect: ',
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
        {selectedStyles.length > 0 || selectedEffects.length > 0 ? (
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
            </ul>
          </div>
        ) : (
          <p>
            Select styles and effects from the options above to enhance your
            image.
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
  effectPrefix: string = 'Effect: '
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

  // Combine all styles and effects
  const stylesAndEffects = [...styleTexts, ...effectTexts].join(', ');

  // No styles or effects selected, just return the base prompt
  if (!stylesAndEffects) {
    return processedBasePrompt;
  }

  // Handle empty base prompt case
  if (!processedBasePrompt) {
    return stylesAndEffects;
  }

  // Check the ending punctuation of the base prompt
  const endsWithTerminalPunctuation = /[.!?]$/.test(processedBasePrompt);
  const endsWithSemicolon = /;$/.test(processedBasePrompt);
  const endsWithComma = /,$/.test(processedBasePrompt);
  const endsWithColon = /:$/.test(processedBasePrompt);
  const endsWithQuotes = /['""]$/.test(processedBasePrompt);

  // Combine based on the punctuation type
  let fullPrompt;
  if (endsWithTerminalPunctuation || endsWithSemicolon || endsWithColon) {
    // For terminal punctuation, semicolons, and colons: start a new segment
    fullPrompt = `${processedBasePrompt} ${stylesAndEffects}`;
  } else if (endsWithComma) {
    // If already ends with a comma, just add the styles with a space
    fullPrompt = `${processedBasePrompt} ${stylesAndEffects}`;
  } else if (endsWithQuotes) {
    // If ends with quotes, add styles outside the quotes with a comma
    // Remove the ending quote, add comma + styles, then add quote back
    fullPrompt = `${processedBasePrompt.slice(0, -1)}, ${stylesAndEffects}${processedBasePrompt.slice(-1)}`;
  } else {
    // No special ending punctuation, add with a comma
    fullPrompt = `${processedBasePrompt}, ${stylesAndEffects}`;
  }

  return fullPrompt;
};
