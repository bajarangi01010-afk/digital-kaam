import React, { useState } from 'react';
import { FLUTTER_DART_PROJECT, FlutterFile } from '../data/flutterSourceCode';
import { Copy, Check, Download, Code2, FolderTree, Smartphone, FileCode2, Terminal, ShieldCheck } from 'lucide-react';

export const FlutterCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_DART_PROJECT[1]); // main.dart
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const jsonBlob = new Blob([JSON.stringify(FLUTTER_DART_PROJECT, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digital_kaam_flutter_project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Top Banner */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Flutter & Dart Architecture Source Hub</h2>
              <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
                Dart 3.2+ • Flutter M3
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Clean modular Flutter client codebase matching the Digital Kaam Master Platform Blueprint
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="download-flutter-bundle-btn"
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Export Project Bundle
          </button>
          <button
            id="copy-dart-code-btn"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Dart Code!' : 'Copy Active File'}
          </button>
        </div>
      </div>

      {/* Code Explorer Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tree Explorer */}
        <div className="w-72 bg-slate-950/80 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-slate-400" />
            Project File Tree
          </div>
          <div className="p-2 overflow-y-auto space-y-1 flex-1">
            {FLUTTER_DART_PROJECT.map((file) => {
              const isSelected = file.path === selectedFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <FileCode2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <div className="truncate">{file.path}</div>
                    <div className="text-[10px] text-slate-500 truncate font-sans">{file.category}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Server-Authoritative Dual-Trust Verified</span>
          </div>
        </div>

        {/* Right Code Display */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          {/* File Header Tab */}
          <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-white">{selectedFile.path}</span>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {selectedFile.description}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Dart / Flutter</span>
            </div>
          </div>

          {/* Syntax Highlighted View */}
          <div className="flex-1 p-6 overflow-auto font-mono text-xs leading-relaxed bg-[#0b1329] text-slate-200 selection:bg-blue-600 selection:text-white">
            <pre className="whitespace-pre">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
