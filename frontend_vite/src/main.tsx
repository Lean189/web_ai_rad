import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import * as dicomParser from 'dicom-parser';
(window as any).dicomParser = dicomParser; // Required globally by cornerstone-dicom-image-loader

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
