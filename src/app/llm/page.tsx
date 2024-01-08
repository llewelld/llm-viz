import React from 'react';
import { LayerView } from '@/src/llm/LayerView';
import { InfoButton } from '@/src/llm/WelcomePopup';

export const metadata = {
  title: 'GPT-2 Visualization',
  description: 'A 3D animated visualization of an LLM with a walkthrough.',
};

import { Header } from '@/src/homepage/Header';

export default function Page() {
    return <>
        <LayerView />
    </>;
}
