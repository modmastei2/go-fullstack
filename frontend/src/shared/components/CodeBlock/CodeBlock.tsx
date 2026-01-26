import { useEffect, type ReactNode } from 'react';
import './CodeBlock.css';
import 'prismjs/themes/prism-tomorrow.css'; // ธีมโค้ด (โทนมืดสวยๆ)
import Prism from 'prismjs';

// โหลดภาษาที่ต้องใช้เพิ่ม
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-json';
import 'prismjs/plugins/toolbar/prism-toolbar.css';
import 'prismjs/plugins/toolbar/prism-toolbar';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

interface CodeBlockProps {
    children: ReactNode;
    lang?: 'language-ts' | 'language-javascript' | 'language-csharp' | 'language-csharp' | 'language-json';
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, lang = 'language-ts' }) => {
    useEffect(() => {
        Prism.highlightAll();
    }, []);
    return (
        <pre className="line-numbers font-mono text-sm leading-relaxed p-4 rounded-lg overflow-x-auto border shadow-sm dark:shadow-lg! bg-slate-100! text-slate-800! border-slate-200! dark:bg-slate-900! dark:text-slate-200! dark:border-slate-800!">
            <code className={lang}>{children}</code>
        </pre>
    );
};
