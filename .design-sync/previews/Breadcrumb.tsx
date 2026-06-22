import { Breadcrumb } from '@unisentinel/ui';

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

export const Default = () => (
  <Breadcrumb>
    <Breadcrumb.Item href="#">Home</Breadcrumb.Item>
    <Breadcrumb.Item href="#">Frameworks</Breadcrumb.Item>
    <Breadcrumb.Item href="#">SOC 2</Breadcrumb.Item>
    <Breadcrumb.Item current>CC6.1</Breadcrumb.Item>
  </Breadcrumb>
);

export const WithIcon = () => (
  <Breadcrumb>
    <Breadcrumb.Item href="#" leftIcon={<HomeIcon />}>Home</Breadcrumb.Item>
    <Breadcrumb.Item href="#">Vendors</Breadcrumb.Item>
    <Breadcrumb.Item href="#">Acme Cloud Services</Breadcrumb.Item>
    <Breadcrumb.Item current>Risk assessment</Breadcrumb.Item>
  </Breadcrumb>
);
