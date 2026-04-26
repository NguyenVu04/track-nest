"use client";

import { Editor } from "@tinymce/tinymce-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  height = 320,
  disabled = false,
}: RichTextEditorProps) {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key";

  return (
    <Editor
      apiKey={apiKey}
      value={value}
      onEditorChange={(html) => onChange(html)}
      disabled={disabled}
      init={{
        height,
        menubar: false,
        placeholder,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline forecolor | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | link image | removeformat | code",
        content_style:
          "body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; font-size:14px; color:#111827; }",
        branding: false,
      }}
    />
  );
}
