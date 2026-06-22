import { RadioGroup } from '@unisentinel/ui';

export const RiskLevel = () => (
  <RadioGroup defaultValue="medium" onChange={() => {}}>
    <RadioGroup.Option value="low" label="Low" />
    <RadioGroup.Option value="medium" label="Medium" />
    <RadioGroup.Option value="high" label="High" />
    <RadioGroup.Option value="critical" label="Critical" />
  </RadioGroup>
);

export const Horizontal = () => (
  <RadioGroup defaultValue="quarterly" orientation="horizontal" onChange={() => {}}>
    <RadioGroup.Option value="quarterly" label="Quarterly" />
    <RadioGroup.Option value="monthly" label="Monthly" />
    <RadioGroup.Option value="weekly" label="Weekly" />
  </RadioGroup>
);

export const WithDescriptions = () => (
  <RadioGroup defaultValue="confidential" onChange={() => {}}>
    <RadioGroup.Option
      value="public"
      label="Public"
      description="Approved for external release with no restrictions"
    />
    <RadioGroup.Option
      value="internal"
      label="Internal"
      description="Shared across the organization only"
    />
    <RadioGroup.Option
      value="confidential"
      label="Confidential"
      description="Limited to need-to-know teams; encryption required"
    />
    <RadioGroup.Option
      value="restricted"
      label="Restricted"
      description="Regulated data — access logged and reviewed quarterly"
    />
  </RadioGroup>
);
