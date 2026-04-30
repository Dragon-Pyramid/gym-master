"use client";

import React, { useState, useCallback, forwardRef } from "react";
import {
  Bold,
  Italic,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TextEditor = forwardRef<HTMLDivElement, TextEditorProps>(
  //! Esto se añade debido a que React 18 y TypeScript requieren que los componentes de función sean forwardRef para poder usarlos con refs.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (props, ref) => {
    const { value, onChange } = props;
    const [activeTab, setActiveTab] = useState("write");

    const insertText = useCallback(
      (before: string, after: string = "", placeholder: string = "") => {
        const textarea = document.getElementById(
          "markdown-textarea"
        ) as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const textToInsert = selectedText || placeholder;

        const newText =
          value.substring(0, start) +
          before +
          textToInsert +
          after +
          value.substring(end);

        onChange(newText);

        setTimeout(() => {
          textarea.focus();
          const newCursorPos = start + before.length + textToInsert.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      },
      [value, onChange]
    );

    const formatMarkdown = (text: string) => {
      return text
        .replace(
          /^### (.*$)/gm,
          '<h3 class="text-lg font-semibold mb-2">$1</h3>'
        )
        .replace(
          /^## (.*$)/gm,
          '<h2 class="text-xl font-semibold mb-3">$1</h2>'
        )
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(
          /`(.*?)`/g,
          '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
        )
        .replace(
          /!\[([^\]]*)\]\(([^)]+)\)/g,
          '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2" />'
        )
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 underline">$1</a>'
        )
        .replace(
          /^> (.*)$/gm,
          '<blockquote class="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic text-gray-700 dark:text-gray-300 my-2">$1</blockquote>'
        )
        .replace(/^\* (.*)$/gm, '<li class="ml-4">$1</li>')
        .replace(/^(\d+)\. (.*)$/gm, '<li class="ml-4">$2</li>')
        .replace(/(<li.*>.*<\/li>)/g, (match: string) => {
          if (match.includes("ml-4")) {
            return match.replace(/<li class="ml-4">/g, '<li class="ml-4">• ');
          }
          return match;
        })
        .replace(/\n\n/g, '</p><p class="mb-4">')
        .replace(/\n/g, "<br />");
    };

    const getPreviewHTML = () => {
      if (!value.trim())
        return '<p class="text-gray-500 dark:text-gray-400 italic">Vista previa del contenido...</p>';

      let html = formatMarkdown(value);

      if (
        !html.startsWith("<h1") &&
        !html.startsWith("<h2") &&
        !html.startsWith("<h3") &&
        !html.startsWith("<blockquote") &&
        !html.startsWith("<li")
      ) {
        html = `<p class="mb-4">${html}</p>`;
      }

      return html;
    };

    const toolbarButtons = [
      {
        icon: Bold,
        action: () => insertText("**", "**", "texto en negrita"),
        title: "Negrita",
      },
      {
        icon: Italic,
        action: () => insertText("*", "*", "texto en cursiva"),
        title: "Cursiva",
      },
      {
        icon: Heading1,
        action: () => insertText("# ", "", "Título principal"),
        title: "Título H1",
      },
      {
        icon: Heading2,
        action: () => insertText("## ", "", "Subtítulo"),
        title: "Título H2",
      },
      {
        icon: Heading3,
        action: () => insertText("### ", "", "Título pequeño"),
        title: "Título H3",
      },
      {
        icon: Link,
        action: () => insertText("[", "](url)", "texto del enlace"),
        title: "Enlace",
      },
      {
        icon: Image,
        action: () => insertText("![", "](url)", "descripción imagen"),
        title: "Imagen",
      },
      {
        icon: List,
        action: () => insertText("* ", "", "elemento lista"),
        title: "Lista",
      },
      {
        icon: ListOrdered,
        action: () => insertText("1. ", "", "elemento numerado"),
        title: "Lista numerada",
      },
      {
        icon: Quote,
        action: () => insertText("> ", "", "cita"),
        title: "Cita",
      },
      {
        icon: Code,
        action: () => insertText("`", "`", "código"),
        title: "Código",
      },
    ];

    return (
      <div className="w-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-background">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("write")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "write"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                }`}
                type="button"
              >
                Escribir
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "preview"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                }`}
                type="button"
              >
                Vista previa
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {value.length} caracteres
            </div>
          </div>
          {activeTab === "write" && (
            <div className="flex flex-wrap gap-1 px-4 py-2 border-t bg-gray-50 dark:bg-muted">
              {toolbarButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.action}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                  title={button.title}
                  type="button"
                >
                  <button.icon size={16} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          {activeTab === "write" ? (
            <textarea
              id="markdown-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Escribe tu mensaje usando Markdown...\n\nEjemplos:\n**texto en negrita**\n*texto en cursiva*\n# Título principal\n## Subtítulo\n[enlace](https://ejemplo.com)\n![imagen](https://ejemplo.com/imagen.jpg)\n* Lista con viñetas\n1. Lista numerada\n> Cita\n`código`"
              className="w-full p-4 font-mono text-sm text-gray-900 bg-white border-0 resize-none h-96 focus:outline-none focus:ring-0 dark:bg-background dark:text-gray-100"
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }}
            />
          ) : (
            <div className="p-4 overflow-y-auto text-gray-900 h-96 bg-gray-50 dark:bg-muted dark:text-gray-100">
              <div
                className="prose-sm prose max-w-none"
                dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
              />
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-muted">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Soporta Markdown: **negrita**, *cursiva*, [enlaces](url),
              ![imágenes](url), listas, citas y más
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TextEditor.displayName = "TextEditor";

export default TextEditor;
