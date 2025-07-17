'use client';

import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { type ModelOptions } from '@/types/model';

interface ModelOptionsConfigProps {
  provider: string;
  modelId: string;
  options: ModelOptions;
  onOptionsChange: (options: ModelOptions) => void;
}

const QUALITY_OPTIONS = {
  'gpt-image-1': [
    { value: 'auto', label: 'Auto' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ],
  'dall-e-3': [
    { value: 'standard', label: 'Standard' },
    { value: 'hd', label: 'HD' },
  ],
  // 'dall-e-2': [{ value: 'standard', label: 'Standard' }],
};

const STYLE_OPTIONS = [
  { value: 'vivid', label: 'Vivid' },
  { value: 'natural', label: 'Natural' },
];

const MODERATION_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'low', label: 'Low' },
];

const SAFETY_OPTIONS = [
  { value: 'block_low_and_above', label: 'Block Low+ (Most Strict)' },
  { value: 'block_medium_and_above', label: 'Block Medium+ (Default)' },
  { value: 'block_only_high', label: 'Block Only High' },
];

const PERSON_GENERATION_OPTIONS = [
  { value: 'allow_adult', label: 'Allow Adult' },
  { value: 'dont_allow', label: "Don't Allow" },
];

const BOOLEAN_OPTIONS = [
  { value: 'false', label: 'No' },
  { value: 'true', label: 'Yes' },
];

function OptionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ModelOptions({
  provider,
  modelId,
  options,
  onOptionsChange,
}: ModelOptionsConfigProps) {
  const updateOption = (key: keyof ModelOptions, value: string | boolean) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const renderQualityOption = () => {
    const qualityOptions = QUALITY_OPTIONS[modelId as keyof typeof QUALITY_OPTIONS];
    if (!qualityOptions) return null;

    // Set correct default values according to OpenAI API specs
    const defaultValue =
      modelId === 'dall-e-2' ? 'standard' : modelId === 'dall-e-3' ? 'standard' : 'auto'; // gpt-image-1 defaults to auto

    return (
      <OptionField label="Quality">
        <Select.Root
          value={options.quality || defaultValue}
          onValueChange={(val) => updateOption('quality', val)}
        >
          <Select.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            <Select.Value />
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <Select.Viewport>
                {qualityOptions.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </OptionField>
    );
  };

  const renderOpenAIOptions = () => {
    if (provider !== 'openai') return null;

    return (
      <>
        {renderQualityOption()}
        {modelId === 'gpt-image-1' && (
          <OptionField label="Moderation">
            <Select.Root
              value={options.moderation || 'auto'}
              onValueChange={(val) => updateOption('moderation', val)}
            >
              <Select.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <Select.Value />
                <Select.Icon>
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <Select.Viewport>
                    {MODERATION_OPTIONS.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </OptionField>
        )}
        {modelId === 'dall-e-3' && (
          <OptionField label="Style">
            <Select.Root
              value={options.style || 'vivid'}
              onValueChange={(val) => updateOption('style', val)}
            >
              <Select.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <Select.Value />
                <Select.Icon>
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <Select.Viewport>
                    {STYLE_OPTIONS.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </OptionField>
        )}
      </>
    );
  };

  const renderGoogleOptions = () => {
    if (provider !== 'google') return null;

    return (
      <>
        <OptionField label="Safety Setting">
          <Select.Root
            value={options.safetySetting || 'block_medium_and_above'}
            onValueChange={(val) => updateOption('safetySetting', val)}
          >
            <Select.Trigger className="inline-flex w-48 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm whitespace-nowrap text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <Select.Value />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <Select.Viewport>
                  {SAFETY_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      <Select.ItemText className="">{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </OptionField>
        <OptionField label="Person Generation">
          <Select.Root
            value={options.personGeneration || 'allow_adult'}
            onValueChange={(val) => updateOption('personGeneration', val)}
          >
            <Select.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <Select.Value />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <Select.Viewport>
                  {PERSON_GENERATION_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </OptionField>
        <OptionField label="Enhance Prompt">
          <Select.Root
            value={options.enhancePrompt ? 'true' : 'false'}
            onValueChange={(val) => updateOption('enhancePrompt', val === 'true')}
          >
            <Select.Trigger className="inline-flex w-24 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <Select.Value />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <Select.Viewport>
                  {BOOLEAN_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </OptionField>
        <OptionField label="Add Watermark">
          <Select.Root
            value={options.addWatermark !== false ? 'true' : 'false'}
            onValueChange={(val) => updateOption('addWatermark', val === 'true')}
          >
            <Select.Trigger className="inline-flex w-24 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <Select.Value />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <Select.Viewport>
                  {BOOLEAN_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </OptionField>
      </>
    );
  };

  return (
    <div className="mt-2 flex flex-wrap gap-4">
      {renderOpenAIOptions()}
      {renderGoogleOptions()}
    </div>
  );
}
