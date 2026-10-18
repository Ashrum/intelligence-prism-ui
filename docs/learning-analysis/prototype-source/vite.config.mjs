import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({base:'./',cacheDir:'.vite',plugins:[react(),tailwindcss()],publicDir:'/Users/OLE/HermesWork/ole-school-workbench/public',resolve:{alias:{'@':'/Users/OLE/HermesWork/ole-school-workbench/src'},dedupe:['react','react-dom']},server:{host:'127.0.0.1',port:8767,strictPort:true,fs:{allow:['/Users/OLE/HermesWork/ole-learning-analysis-research-2026-10-18/agent-ui-v0.7','/Users/OLE/HermesWork/ole-school-workbench']}}});
